import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "./AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_DURATION = 16 * 60 * 60; // 16 hours in seconds
const getFastingKey = (uid: string) => `@nutritrack/fasting_${uid}`;

interface FastingState {
  isFasting: boolean;
  startTime: string | null; // ISO String
  targetDuration: number;   // seconds
}

interface FastingContextType {
  fastingState: FastingState;
  remainingSeconds: number;
  startFast: (duration?: number) => Promise<void>;
  stopFast: () => Promise<void>;
  resetFast: () => Promise<void>;
}

const DEFAULT_STATE: FastingState = {
  isFasting: false,
  startTime: null,
  targetDuration: DEFAULT_DURATION,
};

const FastingContext = createContext<FastingContextType | undefined>(undefined);

export function FastingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [fastingState, setFastingState] = useState<FastingState>(DEFAULT_STATE);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Load state from AsyncStorage on mount or user change
  useEffect(() => {
    const loadState = async () => {
      if (!user) {
        setFastingState(DEFAULT_STATE);
        clearTimer();
        return;
      }

      // Initial local load for speed
      const saved = await AsyncStorage.getItem(getFastingKey(user.uid));
      if (saved) {
        const parsed = JSON.parse(saved) as FastingState;
        setFastingState(parsed);
        if (parsed.isFasting && parsed.startTime) {
          calculateRemaining(parsed.startTime, parsed.targetDuration);
          startTimer();
        }
      }

      // Sync with Firestore (Cloud source of truth)
      const docRef = doc(db, "fasting_logs", user.uid);
      const unsubscribeSnap = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as FastingState;
          setFastingState(data);
          AsyncStorage.setItem(getFastingKey(user.uid), JSON.stringify(data));
          if (data.isFasting && data.startTime) {
            calculateRemaining(data.startTime, data.targetDuration);
            startTimer();
          } else {
            clearTimer();
            setRemainingSeconds(data.targetDuration || DEFAULT_DURATION);
          }
        }
      });
      return unsubscribeSnap;
    };

    let unsubscribeFirestore: (() => void) | undefined;
    loadState().then(unsub => { unsubscribeFirestore = unsub; });

    return () => {
      clearTimer();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [user]);

  const calculateRemaining = (startTime: string, duration: number) => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000);
    const remaining = Math.max(0, duration - elapsed);
    setRemainingSeconds(remaining);
  };

  const startTimer = () => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setFastingState((current) => {
        if (current.isFasting && current.startTime) {
          const start = new Date(current.startTime).getTime();
          const elapsed = Math.floor((Date.now() - start) / 1000);
          const remaining = Math.max(0, current.targetDuration - elapsed);
          setRemainingSeconds(remaining);
          if (remaining === 0) clearTimer();
        }
        return current;
      });
    }, 1000);
  };

  const clearTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const saveAndSync = async (newState: FastingState) => {
    if (!user) return;
    setFastingState(newState);
    await AsyncStorage.setItem(getFastingKey(user.uid), JSON.stringify(newState));
    await setDoc(doc(db, "fasting_logs", user.uid), newState);
  };

  const startFast = async (duration = DEFAULT_DURATION) => {
    if (!user) return;
    const newState: FastingState = {
      isFasting: true,
      startTime: new Date().toISOString(),
      targetDuration: duration,
    };
    setRemainingSeconds(duration);
    await saveAndSync(newState);
    startTimer();
  };

  const stopFast = async () => {
    if (!user) return;
    const newState = { ...fastingState, isFasting: false, startTime: null };
    clearTimer();
    await saveAndSync(newState);
  };

  const resetFast = async () => {
    if (!user) return;
    const newState = { ...fastingState, isFasting: false, startTime: null };
    setRemainingSeconds(fastingState.targetDuration);
    clearTimer();
    await saveAndSync(newState);
  };

  return (
    <FastingContext.Provider value={{ fastingState, remainingSeconds, startFast, stopFast, resetFast }}>
      {children}
    </FastingContext.Provider>
  );
}

export const useFasting = () => {
  const context = useContext(FastingContext);
  if (!context) throw new Error("useFasting must be used within a FastingProvider");
  return context;
};
