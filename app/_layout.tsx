import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import React from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NutritionProvider } from '../context/NutritionContext';
import { FoodLogProvider } from '../context/FoodLogContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ExerciseProvider } from '../context/ExerciseContext';
import { FastingProvider } from '../context/FastingContext';
import { NotificationProvider } from '../context/NotificationContext';
import { DateProvider } from '../context/DateContext';
import { ThemeProvider as AppThemeProvider, useAppTheme } from '../context/ThemeContext';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const { isDark } = useAppTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'add_food' || segments[0] === 'profile';
    
    if (!user) {
      if (inAuthGroup) {
        router.replace('/login');
      }
    } else {
      if (!user.emailVerified) {
        if ((segments[0] as string) !== 'verify_email' && (segments[0] as string) !== 'signup') {
          router.replace('/verify_email' as any);
        }
      } else {
        if (segments[0] === 'login' || segments[0] === 'signup' || segments[0] === undefined) {
          router.replace('/(tabs)/profile');
        }
      }
    }
  }, [user, loading, segments]);

  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="verify_email" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add_food" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="modal" options={{ presentation: 'transparentModal', headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppThemeProvider>
          <DateProvider>
            <FoodLogProvider>
              <NutritionProvider>
                <ExerciseProvider>
                  <FastingProvider>
                    <NotificationProvider>
                      <RootLayoutNav />
                    </NotificationProvider>
                  </FastingProvider>
                </ExerciseProvider>
              </NutritionProvider>
            </FoodLogProvider>
          </DateProvider>
        </AppThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
