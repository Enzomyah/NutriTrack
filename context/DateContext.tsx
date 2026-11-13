import React, { createContext, useContext, useState, ReactNode } from "react";

interface DateContextType {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  isToday: boolean;
  nextDate: () => void;
  prevDate: () => void;
  displayDate: string;
}

const DateContext = createContext<DateContextType>({
  selectedDate: new Date().toISOString().split("T")[0],
  setSelectedDate: () => {},
  isToday: true,
  nextDate: () => {},
  prevDate: () => {},
  displayDate: "",
});

export function DateProvider({ children }: { children: ReactNode }) {
  // Setup standard Philippine time formatting to match headers
  const getTodayString = () => {
    const today = new Date();
    // Adjust to PH timezone or use local as requested
    return today.toLocaleDateString('en-CA'); // 'en-CA' gives YYYY-MM-DD
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const isToday = selectedDate === getTodayString();

  const prevDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toLocaleDateString('en-CA'));
  };

  const nextDate = () => {
    if (isToday) return;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toLocaleDateString('en-CA'));
  };

  const displayDate = new Date(selectedDate)
    .toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase();

  return (
    <DateContext.Provider value={{ selectedDate, setSelectedDate, isToday, prevDate, nextDate, displayDate }}>
      {children}
    </DateContext.Provider>
  );
}

export const useDate = () => useContext(DateContext);
