import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FoodItem, EMPTY_MICRONUTRIENTS } from "../services/usdaApi";
import { useAuth } from "./AuthContext";
import { useDate } from "./DateContext";

const getFoodLogKey = (uid: string, date: string) => `@nutritrack/foodlog_${uid}_${date}`;
const getRecentFoodsKey = (uid: string) => `@nutritrack/recentfoods_${uid}`;

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snacks";

export interface LoggedFoodItem extends FoodItem {
  loggedAt: string; // ISO string
  logId: string;   // Unique identifier for this log entry
  // Store base nutrients (per 100g) to allow re-scaling during edits
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  baseMicronutrients?: {
    fiber: number;
    sugar: number;
    sodium: number;
    potassium: number;
    cholesterol: number;
    saturatedFat: number;
  };
}

export interface FoodLog {
  [meal: string]: LoggedFoodItem[];
}

interface FoodLogContextType {
  foodLog: FoodLog;
  recentFoods: FoodItem[];
  logFood: (meal: MealType, item: FoodItem) => void;
  removeFood: (meal: MealType, logId: string) => void;
  updateFood: (meal: MealType, logId: string, newQuantity: string, newUnit: string) => void;
  getTotals: () => { calories: number; protein: number; carbs: number; fat: number };
}

const DEFAULT_LOG: FoodLog = {
  Breakfast: [],
  Lunch: [],
  Dinner: [],
  Snacks: [],
};

const FoodLogContext = createContext<FoodLogContextType>({
  foodLog: DEFAULT_LOG,
  recentFoods: [],
  logFood: () => {},
  removeFood: () => {},
  updateFood: () => {},
  getTotals: () => ({ calories: 0, protein: 0, carbs: 0, fat: 0 }),
});

export function FoodLogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { selectedDate } = useDate();
  const [foodLog, setFoodLog] = useState<FoodLog>(DEFAULT_LOG);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);

  // ── Load data (Firestore or AsyncStorage) ──────────────────────────────────
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    // Reset log before loading new data
    setFoodLog(DEFAULT_LOG);

    const loadData = async () => {
      try {
        if (user) {
          // 1. Sync Food Log with Firestore (Daily Subcollection)
          const dailyLogRef = doc(db, "users", user.uid, "dailyLogs", selectedDate);
          unsubscribe = onSnapshot(dailyLogRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.foodLog) {
                setFoodLog(data.foodLog);
              } else {
                setFoodLog(DEFAULT_LOG);
              }
            } else {
              setFoodLog(DEFAULT_LOG);
            }
          });

          // 2. Load Recent Foods from AsyncStorage (User-Specific)
          const savedRecent = await AsyncStorage.getItem(getRecentFoodsKey(user.uid));
          if (savedRecent) {
            setRecentFoods(JSON.parse(savedRecent));
          }
        }
      } catch (e) {
        console.warn("Failed to load food log data:", e);
      }
    };

    loadData();
    return () => unsubscribe();
  }, [user, selectedDate]);

  const save = (log: FoodLog, recent: FoodItem[]) => {
    setFoodLog(log);
    setRecentFoods(recent);
    
    // Save to Firestore if logged in
    if (user) {
      setDoc(doc(db, "users", user.uid, "dailyLogs", selectedDate), { foodLog: log }, { merge: true })
        .catch((e) => console.error("Firestore food log save error:", e));
      
      AsyncStorage.setItem(getFoodLogKey(user.uid, selectedDate), JSON.stringify(log))
        .catch((e) => console.warn("Failed to save food log locally:", e));

      AsyncStorage.setItem(getRecentFoodsKey(user.uid), JSON.stringify(recent))
        .catch((e) => console.warn("Failed to save recent foods locally:", e));
    }
  };

  const logFood = (meal: MealType, item: FoodItem) => {
    // We treat 'item' as potentially containing base stats already from scaledItem in add_food.tsx
    const anyItem = item as any;
    const updatedLog: FoodLog = {
      ...foodLog,
      [meal]: [
        ...(foodLog[meal] ?? []),
        { 
          ...item, 
          loggedAt: new Date().toISOString(),
          logId: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
          // Use explicitly passed base stats or fallback to item's current stats
          baseCalories: anyItem.baseCalories !== undefined ? anyItem.baseCalories : item.calories,
          baseProtein: anyItem.baseProtein !== undefined ? anyItem.baseProtein : item.protein,
          baseCarbs: anyItem.baseCarbs !== undefined ? anyItem.baseCarbs : item.carbs,
          baseFat: anyItem.baseFat !== undefined ? anyItem.baseFat : item.fat,
          baseMicronutrients: anyItem.baseMicronutrients !== undefined ? anyItem.baseMicronutrients : (item.micronutrients || EMPTY_MICRONUTRIENTS),
        },
      ],
    };

    // Update Recent Foods (limit to 10, unique)
    const filteredRecent = recentFoods.filter(r => r.fdcId !== item.fdcId);
    const updatedRecent = [item, ...filteredRecent].slice(0, 10);

    save(updatedLog, updatedRecent);
  };

  const removeFood = (meal: MealType, logId: string) => {
    const updatedLog: FoodLog = {
      ...foodLog,
      [meal]: (foodLog[meal] ?? []).filter((f) => f.logId !== logId),
    };
    save(updatedLog, recentFoods);
  };

  const updateFood = (meal: MealType, logId: string, newQuantity: string, newUnit: string) => {
    const updatedLog: FoodLog = { ...foodLog };
    const mealItems = [...(updatedLog[meal] ?? [])];
    const index = mealItems.findIndex(item => item.logId === logId);

    if (index !== -1) {
      const item = mealItems[index];
      
      // Re-scale based on base nutrients
      const qty = parseFloat(newQuantity) || 0;
      let multiplier = 1;
      if (newUnit === "oz") multiplier = 28.35;
      if (newUnit === "cup") multiplier = 240;
      
      const grams = qty * multiplier;
      const factor = grams / 100;

      mealItems[index] = {
        ...item,
        servingSize: `${newQuantity}${newUnit}`,
        calories: Math.round(item.baseCalories * factor),
        protein: Math.round(item.baseProtein * factor * 10) / 10,
        carbs: Math.round(item.baseCarbs * factor * 10) / 10,
        fat: Math.round(item.baseFat * factor * 10) / 10,
        micronutrients: (item.baseMicronutrients || EMPTY_MICRONUTRIENTS) ? {
          fiber: Math.round((item.baseMicronutrients || EMPTY_MICRONUTRIENTS).fiber * factor * 10) / 10,
          sugar: Math.round((item.baseMicronutrients || EMPTY_MICRONUTRIENTS).sugar * factor * 10) / 10,
          sodium: Math.round((item.baseMicronutrients || EMPTY_MICRONUTRIENTS).sodium * factor * 10) / 10,
          potassium: Math.round((item.baseMicronutrients || EMPTY_MICRONUTRIENTS).potassium * factor * 10) / 10,
          cholesterol: Math.round((item.baseMicronutrients || EMPTY_MICRONUTRIENTS).cholesterol * factor * 10) / 10,
          saturatedFat: Math.round((item.baseMicronutrients || EMPTY_MICRONUTRIENTS).saturatedFat * factor * 10) / 10,
        } : EMPTY_MICRONUTRIENTS,
      };

      updatedLog[meal] = mealItems;
      save(updatedLog, recentFoods);
    }
  };

  const getTotals = () => {
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    Object.values(foodLog).forEach((items) =>
      items.forEach((f) => {
        calories += f.calories;
        protein += f.protein;
        carbs += f.carbs;
        fat += f.fat;
      })
    );
    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
    };
  };

  return (
    <FoodLogContext.Provider value={{ foodLog, recentFoods, logFood, removeFood, updateFood, getTotals }}>
      {children}
    </FoodLogContext.Provider>
  );
}

export function useFoodLog() {
  return useContext(FoodLogContext);
}
