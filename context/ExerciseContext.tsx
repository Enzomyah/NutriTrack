import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "./AuthContext";
import { useNutrition } from "./NutritionContext";
import { useDate } from "./DateContext";

// ─── Storage keys ──────────────────────────────────────────────────────────────
const getExerciseKey = (uid: string) => `@nutritrack/exercise_${uid}`;

// ─── MET Values Mapping ────────────────────────────────────────────────────────
const MET_VALUES: Record<string, number> = {
  "Running (Moderate pace)": 10.0,
  "Cycling (Casual)": 7.5,
  "Cycling (High Intensity)": 12.0,
  "Jump Rope": 11.0,
  "HIIT (High-Intensity Interval Training)": 12.0,
  "Swimming": 7.0,
  "Weightlifting": 3.5,
  "Bodyweight Workout (Push-ups, Sit-ups, Squats)": 4.0,
  "Yoga / Pilates": 2.5,
  "Basketball": 8.0,
  "Badminton / Tennis": 7.0,
  "Boxing / Martial Arts": 10.0,
  "Walking (Brisk pace)": 4.0,
  "Walking (Slow/Casual)": 2.5,
  "Stair Climbing": 9.0,
  "Dancing / Zumba": 6.0,
  "General Housework / Cleaning": 2.5,
};

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ExerciseEntry {
  id: string;
  name: string;
  durationSeconds: number; // Changed from minutes to duration in seconds
  calories: number;
  timestamp: string;
}

interface ExerciseLog {
  entries: ExerciseEntry[];
}

interface ExerciseContextType {
  exerciseLog: ExerciseLog;
  logExercise: (name: string, hours: string, minutes: string, seconds: string) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  getTodayTotals: () => { calories: number; durationSeconds: number; entries: ExerciseEntry[] };
  resetExerciseLog: () => void;
}

const DEFAULT_LOG: ExerciseLog = {
  entries: [],
};

const ExerciseContext = createContext<ExerciseContextType | undefined>(undefined);

export function ExerciseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile } = useNutrition();
  const { selectedDate } = useDate();
  const [exerciseLog, setExerciseLog] = useState<ExerciseLog>(DEFAULT_LOG);

  // 1. Listen for Firestore updates
  useEffect(() => {
    if (!user) {
      setExerciseLog(DEFAULT_LOG);
      return;
    }

    const docRef = doc(db, "exercise_logs", user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ExerciseLog;
        setExerciseLog(data);
        AsyncStorage.setItem(getExerciseKey(user.uid), JSON.stringify(data));
      } else {
        setExerciseLog(DEFAULT_LOG);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Initial load from AsyncStorage
  useEffect(() => {
    const loadFromStorage = async () => {
      if (user) {
        const saved = await AsyncStorage.getItem(getExerciseKey(user.uid));
        if (saved) setExerciseLog(JSON.parse(saved));
      }
    };
    loadFromStorage();
  }, [user]);

  const logExercise = async (name: string, hrs: string, mins: string, secs: string) => {
    if (!user) return;

    const hoursNum = parseInt(hrs, 10) || 0;
    const minutesNum = parseInt(mins, 10) || 0;
    const secondsNum = parseInt(secs, 10) || 0;
    const totalSeconds = (hoursNum * 3600) + (minutesNum * 60) + secondsNum;

    // Default to 0 values if duration is 0, otherwise calculate
    if (totalSeconds === 0) return;

    const bodyWeight = parseFloat(profile.weight) || 70;
    const met = MET_VALUES[name] || 4.0;
    
    // met * bodyWeight * durationInHours
    const caloriesBurned = Math.round(met * bodyWeight * (totalSeconds / 3600));

    const now = new Date();
    const timeString = now.toISOString().split('T')[1];

    const newEntry: ExerciseEntry = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      durationSeconds: totalSeconds,
      calories: caloriesBurned,
      timestamp: `${selectedDate}T${timeString}`,
    };

    const updatedLog: ExerciseLog = {
      entries: [newEntry, ...exerciseLog.entries],
    };

    setExerciseLog(updatedLog);

    const docRef = doc(db, "exercise_logs", user.uid);
    await setDoc(docRef, updatedLog);
    await AsyncStorage.setItem(getExerciseKey(user.uid), JSON.stringify(updatedLog));
  };

  const deleteExercise = async (id: string) => {
    if (!user) return;

    const filteredEntries = exerciseLog.entries.filter(e => e.id !== id);
    const removedEntry = exerciseLog.entries.find(e => e.id === id);
    
    if (!removedEntry) return;

    const updatedLog: ExerciseLog = {
      entries: filteredEntries,
    };

    setExerciseLog(updatedLog);

    const docRef = doc(db, "exercise_logs", user.uid);
    await setDoc(docRef, updatedLog);
    await AsyncStorage.setItem(getExerciseKey(user.uid), JSON.stringify(updatedLog));
  };

  const getTodayTotals = () => {
    const todayEntries = exerciseLog.entries.filter(e => e.timestamp.startsWith(selectedDate));
    
    const cals = todayEntries.reduce((sum, e) => sum + e.calories, 0);
    const secs = todayEntries.reduce((sum, e) => sum + e.durationSeconds, 0);
    
    return { calories: cals, durationSeconds: secs, entries: todayEntries };
  };

  const resetExerciseLog = () => {
    setExerciseLog(DEFAULT_LOG);
  };

  return (
    <ExerciseContext.Provider value={{ 
      exerciseLog, 
      logExercise, 
      deleteExercise, 
      getTodayTotals, 
      resetExerciseLog 
    }}>
      {children}
    </ExerciseContext.Provider>
  );
}

export const useExerciseLog = () => {
  const context = useContext(ExerciseContext);
  if (!context) throw new Error("useExerciseLog must be used within an ExerciseProvider");
  return context;
};
