import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "./AuthContext";

// ─── Storage keys ──────────────────────────────────────────────────────────────
const getProfileKey = (uid: string) => `@nutritrack/profile_${uid}`;
const getTargetsKey = (uid: string) => `@nutritrack/targets_${uid}`;

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface MacroTargets {
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
}

export interface ProfileInputs {
  age: string;
  weight: string;   // kg
  height: string;   // cm
  gender: string;
  activity: string;
  goal: string;
  isManual: boolean;
}

const DEFAULT_PROFILE: ProfileInputs = {
  age: "",
  weight: "",
  height: "",
  gender: "Male",
  activity: "Moderate Exercise (3-5 days/week)",
  goal: "Maintain weight",
  isManual: false,
};

interface NutritionContextType {
  targets: MacroTargets | null;
  profile: ProfileInputs;
  isLoaded: boolean;
  calculateMacros: (profile: ProfileInputs) => MacroTargets | null;
  updateTargets: (targets: MacroTargets) => void;
}

// ─── Activity multipliers ──────────────────────────────────────────────────────
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  "Sedentary (office job)": 1.2,
  "Light Exercise (1-2 days/week)": 1.375,
  "Moderate Exercise (3-5 days/week)": 1.55,
  "Heavy Exercise (6-7 days/week)": 1.725,
  "Athlete (2x per day)": 1.9,
};

// ─── Goal calorie adjustments ──────────────────────────────────────────────────
const GOAL_ADJUSTMENTS: Record<string, number> = {
  "Lose weight": -500,
  "Maintain weight": 0,
  "Gain weight": 300,
  "Gain muscle": 300,
};

// ─── Context ───────────────────────────────────────────────────────────────────
const NutritionContext = createContext<NutritionContextType>({
  targets: null,
  profile: DEFAULT_PROFILE,
  isLoaded: false,
  calculateMacros: () => null,
  updateTargets: () => {},
});

export function NutritionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [targets, setTargets] = useState<MacroTargets | null>(null);
  const [profile, setProfile] = useState<ProfileInputs>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Load data (Firestore or AsyncStorage) ──────────────────────────────────
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    // Reset state before loading new user data
    setProfile(DEFAULT_PROFILE);
    setTargets(null);
    setIsLoaded(false);

    const loadData = async () => {
      try {
        if (user) {
          // Sync with Firestore if logged in
          const userDocRef = doc(db, "users", user.uid);
          unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.profile) setProfile(data.profile);
              if (data.targets) setTargets(data.targets);
            }
            setIsLoaded(true);
          });
        } else {
          // No user: Clear state and marked as loaded (blank)
          setIsLoaded(true);
        }
      } catch (e) {
        console.warn("Failed to load NutriTrack data:", e);
        setIsLoaded(true);
      }
    };

    loadData();
    return () => unsubscribe();
  }, [user]);

  // ── Calculate & persist ───────────────────────────────────────────────────
  const calculateMacros = (inputs: ProfileInputs): MacroTargets | null => {
    const age = parseFloat(inputs.age);
    const weight = parseFloat(inputs.weight);
    const height = parseFloat(inputs.height);

    if (isNaN(age) || isNaN(weight) || isNaN(height)) return null;

    // Mifflin-St Jeor BMR formula
    let bmr: number;
    if (inputs.gender === "Male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Apply activity multiplier → TDEE
    const multiplier = ACTIVITY_MULTIPLIERS[inputs.activity] ?? 1.55;
    let tdee = bmr * multiplier;

    // Adjust for goal
    const adjustment = GOAL_ADJUSTMENTS[inputs.goal] ?? 0;
    tdee += adjustment;

    const calories = Math.round(tdee);

    // Macro split: Protein 30% | Carbs 40% | Fat 30%
    const protein = Math.round((calories * 0.30) / 4);
    const carbs = Math.round((calories * 0.40) / 4);
    const fat = Math.round((calories * 0.30) / 9);

    const result: MacroTargets = { calories, protein, carbs, fat };

    // Update local state
    const profileWithMode = { ...inputs, isManual: false };
    setTargets(result);
    setProfile(profileWithMode);

    // Persist to Cloud (Firestore) and Local (AsyncStorage)
    if (user) {
      setDoc(doc(db, "users", user.uid), { profile: inputs, targets: result }, { merge: true })
        .catch((e) => console.error("Firestore save error:", e));
      
      Promise.all([
        AsyncStorage.setItem(getProfileKey(user.uid), JSON.stringify(inputs)),
        AsyncStorage.setItem(getTargetsKey(user.uid), JSON.stringify(result)),
      ]).catch((e) => console.warn("Failed to save NutriTrack local data:", e));
    }

    return result;
  };

  const updateTargets = (newTargets: MacroTargets) => {
    setTargets(newTargets);
    const updatedProfile = { ...profile, isManual: true };
    setProfile(updatedProfile);

    // Persist manual targets
    if (user) {
      setDoc(doc(db, "users", user.uid), { 
        targets: newTargets, 
        profile: updatedProfile 
      }, { merge: true })
        .catch((e) => console.error("Firestore manual targets save error:", e));
      
      AsyncStorage.setItem(getTargetsKey(user.uid), JSON.stringify(newTargets))
        .catch((e) => console.warn("Failed to save manual targets locally:", e));
        
      AsyncStorage.setItem(getProfileKey(user.uid), JSON.stringify(updatedProfile))
        .catch((e) => console.warn("Failed to save manual profile locally:", e));
    }
  };

  return (
    <NutritionContext.Provider value={{ targets, profile, isLoaded, calculateMacros, updateTargets }}>
      {children}
    </NutritionContext.Provider>
  );
}

export function useNutrition() {
  return useContext(NutritionContext);
}
