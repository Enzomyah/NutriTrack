import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useFoodLog } from './FoodLogContext';
import { useNutrition } from './NutritionContext';
import { useFasting } from './FastingContext';

export interface Notification {
  id: string;
  type: 'meal' | 'fasting' | 'goal' | 'tip';
  title: string;
  description: string;
  time: string; // ISO string
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notif: Omit<Notification, 'id' | 'read' | 'time'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { foodLog, getTotals } = useFoodLog();
  const { targets } = useNutrition();
  const { fastingState } = useFasting();
  const { isFasting, startTime, targetDuration } = fastingState;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const lastProcessedRef = React.useRef<string>(""); // Format: "YYYY-MM-DD-HH"

  const STORAGE_KEY = user ? `@nutritrack/notifications_${user.uid}` : null;

  // Load from storage
  useEffect(() => {
    if (STORAGE_KEY) {
      AsyncStorage.getItem(STORAGE_KEY).then(val => {
        if (val) setNotifications(JSON.parse(val));
      });
    }
  }, [STORAGE_KEY]);

  // Save to storage
  useEffect(() => {
    if (STORAGE_KEY) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }
  }, [notifications, STORAGE_KEY]);

  const addNotification = (notif: Omit<Notification, 'id' | 'read' | 'time'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50)); // Keep last 50
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // ─── Automated Alert Logic ──────────────────────────────────────────────────
  
  useEffect(() => {
    if (!user || !targets) return;
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const hour = now.getHours();
    const checkKey = `${dateStr}-${hour}`;

    // Throttle checks to once per hour to avoid loops & duplicates
    if (lastProcessedRef.current === checkKey) return;
    lastProcessedRef.current = checkKey;
    
    const totals = getTotals();

    // 1. Meal Reminders
    const checkMealReminders = () => {
      // Breakfast (8 AM - 10 AM)
      if (hour >= 8 && hour < 10 && (!foodLog.Breakfast || foodLog.Breakfast.length === 0)) {
        if (!notifications.some(n => n.type === 'meal' && n.title.includes('Breakfast') && isToday(n.time))) {
          addNotification({
            type: 'meal',
            title: 'Time for Breakfast! 🍳',
            description: 'Start your day right with a healthy meal.',
            priority: 'medium'
          });
        }
      }
      // Lunch (12 PM - 2 PM)
      if (hour >= 12 && hour < 14 && (!foodLog.Lunch || foodLog.Lunch.length === 0)) {
        if (!notifications.some(n => n.type === 'meal' && n.title.includes('Lunch') && isToday(n.time))) {
          addNotification({
            type: 'meal',
            title: 'Lunch Break! 🥗',
            description: "Don't forget to log your midday fuel.",
            priority: 'medium'
          });
        }
      }
      // Dinner (6 PM - 8 PM)
      if (hour >= 18 && hour < 20 && (!foodLog.Dinner || foodLog.Dinner.length === 0)) {
        if (!notifications.some(n => n.type === 'meal' && n.title.includes('Dinner') && isToday(n.time))) {
          addNotification({
            type: 'meal',
            title: 'Time to log your Dinner! 🍽️',
            description: 'Last big meal of the day. Keep it balanced!',
            priority: 'medium'
          });
        }
      }
    };

    // 2. Goal Progress
    const checkGoalProgress = () => {
       const proteinRatio = targets.protein > 0 ? totals.protein / targets.protein : 0;
       if (proteinRatio >= 0.8 && proteinRatio < 1.0) {
         if (!notifications.some(n => n.type === 'goal' && n.title.includes('Protein') && isToday(n.time))) {
           addNotification({
             type: 'goal',
             title: 'Goal Progress! 💪',
             description: "Great job! You've hit 80% of your Protein goal today.",
             priority: 'high'
           });
         }
       }
    }

    // 3. Fasting Updates
    const checkFastingUpdates = () => {
      if (isFasting && startTime) {
        const start = new Date(startTime).getTime();
        const end = start + (targetDuration * 1000);
        const totalDuration = end - start;
        const elapsed = now.getTime() - start;
        const progress = elapsed / totalDuration;

        if (progress >= 0.5 && progress < 0.6) {
          if (!notifications.some(n => n.type === 'fasting' && n.title.includes('halfway') && isToday(n.time))) {
            addNotification({
              type: 'fasting',
              title: 'Keep it going! ⏳',
              description: 'Your 16:8 fast is halfway done! Stay strong.',
              priority: 'medium'
            });
          }
        }
      }
    }

    // Run checks
    checkMealReminders();
    checkGoalProgress();
    checkFastingUpdates();

  }, [foodLog, targets, isFasting, startTime, user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

// Helper
function isToday(isoString: string) {
  const d = new Date(isoString);
  const today = new Date();
  return d.getDate() === today.getDate() && 
         d.getMonth() === today.getMonth() && 
         d.getFullYear() === today.getFullYear();
}
