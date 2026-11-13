import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

export const ThemeColors = {
  light: {
    background: "#DADBDB",
    card: "#FFFFFF",
    text: "#2D3C59",
    textSub: "#8A97A8",
    primary: "#6BAE45",
    secondary: "#D1855C",
    header: "#527A3A",
    border: "#EAEAEA",
    iconBg: "#F4F9F5",
    tabBar: "#FFFFFF",
    danger: "#FF6B6B"
  },
  dark: {
    background: "#121212",
    card: "#1E1E1E",
    text: "#FFFFFF",
    textSub: "#A0A9B5",
    primary: "#6BAE45",
    secondary: "#D1855C",
    header: "#1E1E1E",
    border: "#2C2C2C",
    iconBg: "#2C2C2C",
    tabBar: "#1E1E1E",
    danger: "#FF6B6B"
  }
};

type ColorTheme = typeof ThemeColors.light;

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ColorTheme;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  colors: ThemeColors.light,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("@nutritrack/theme").then((savedTheme) => {
      if (savedTheme === "dark" || savedTheme === "light") {
        setIsDark(savedTheme === "dark");
      } else {
        setIsDark(false); // Default to light mode explicitly as requested
      }
      setIsLoaded(true);
    });
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const newDark = !prev;
      AsyncStorage.setItem("@nutritrack/theme", newDark ? "dark" : "light");
      return newDark;
    });
  };

  const colors = isDark ? ThemeColors.dark : ThemeColors.light;

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);
