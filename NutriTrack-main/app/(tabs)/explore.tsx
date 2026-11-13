import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Palette } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

// Reusable Meal Card Component matching new dark mockup
interface MealCardProps {
  title: string;
  time: string;
  calories: string;
  itemsCount: string;
  iconName: any;
  onViewPress: () => void;
  onAddPress: () => void;
}

const MealCard: React.FC<MealCardProps> = ({ title, time, calories, itemsCount, iconName, onViewPress, onAddPress }) => {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.mealHeaderRow}>
        <View style={styles.mealTitleRow}>
          <View style={styles.mealIconContainer}>
            <MaterialCommunityIcons name={iconName} size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.mealTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.mealTime, { color: colors.textSub }]}>{time}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.mealFooterRow}>
        <View style={styles.statsContainer}>
            <View style={styles.statBlock}>
                <Text style={[styles.mealCalories, { color: colors.text }]}>{calories}</Text>
                <Text style={[styles.mealSubtext, { color: colors.textSub }]}>calories</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBlock}>
                <Text style={[styles.mealCalories, { color: colors.text }]}>{itemsCount}</Text>
                <Text style={[styles.mealSubtext, { color: colors.textSub }]}>items</Text>
            </View>
        </View>
        
        <TouchableOpacity style={styles.viewButton} onPress={onViewPress}>
          <Text style={styles.viewButtonText}>View</Text>
          <Ionicons name="chevron-forward" size={14} color="#6BAE45" style={{marginTop: 2}}/>
        </TouchableOpacity>
      </View>
    </View>
  );
};

import { useNutrition } from "../../context/NutritionContext";
import { useFoodLog, MealType } from "../../context/FoodLogContext";
import { useNotifications } from "../../context/NotificationContext";
import { useExerciseLog } from "../../context/ExerciseContext";
import { useDate } from "../../context/DateContext";
import NotificationModal from "../../components/NotificationModal";
import CalendarModal from "../../components/CalendarModal";

export default function FoodDiaryScreen() {
  const router = useRouter();
  const { targets } = useNutrition();
  const { foodLog, getTotals } = useFoodLog();
  const logged = getTotals();
  const { displayDate, prevDate, nextDate, isToday } = useDate();
  const { colors } = useAppTheme();
  const { getTodayTotals } = useExerciseLog();
  const todayExercise = getTodayTotals();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Helper to get stats for a specific meal
  const getMealStats = (type: MealType) => {
    const items = foodLog[type] || [];
    const calories = items.reduce((sum, item) => sum + (item.calories || 0), 0);
    return {
      calories: Math.round(calories).toString(),
      itemsCount: items.length.toString(),
    };
  };

  const caloriesGoal = targets?.calories || 0;
  const caloriesEaten = logged.calories;
  const caloriesRemaining = Math.max(0, caloriesGoal - caloriesEaten + todayExercise.calories);
  
  const progressRatio = caloriesGoal > 0 ? (caloriesEaten / caloriesGoal) : 0;
  const progressPct = `${Math.min(100, progressRatio * 100)}%`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.header} />

      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <View style={styles.headerTitleContainer}>
          <Image
            source={require("../../assets/images/NutriTrackLOGO.png")}
            style={styles.logoIconImage}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>NUTRITRACK</Text>
            <TouchableOpacity 
              onPress={() => setShowCalendar(true)} 
              style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 2, marginLeft: -10, alignSelf: 'flex-start'}}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={14} color="#FFFFFF" style={{marginRight: 6}} />
              <Text style={styles.headerSubtitle}>{displayDate}</Text>
              <Ionicons name="chevron-down" size={12} color="#FFFFFF" style={{marginLeft: 6}} />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.headerRightIconContainer}
          onPress={() => setShowNotifications(true)}
        >
          <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Food Diary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValueGreen}>{caloriesEaten}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSub }]}>Eaten</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValueOrange}>{caloriesRemaining}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSub }]}>Remaining</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValueDark, { color: colors.text }]}>{caloriesGoal}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSub }]}>Goal</Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
             <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                 <View style={[styles.progressBarFill, { width: progressPct as any }]} /> 
             </View>
          </View>
        </View>

        {/* Meal Cards */}
        <MealCard 
            title="Breakfast" 
            time="Morning" 
            calories={getMealStats("Breakfast").calories} 
            itemsCount={getMealStats("Breakfast").itemsCount} 
            iconName="silverware-fork-knife" 
            onViewPress={() => router.push({ pathname: "/modal", params: { meal: "Breakfast" } })}
            onAddPress={() => router.push({ pathname: "/add_food", params: { meal: "Breakfast" } })}
        />
        <MealCard 
            title="Lunch" 
            time="Afternoon" 
            calories={getMealStats("Lunch").calories} 
            itemsCount={getMealStats("Lunch").itemsCount} 
            iconName="silverware-fork-knife" 
            onViewPress={() => router.push({ pathname: "/modal", params: { meal: "Lunch" } })}
            onAddPress={() => router.push({ pathname: "/add_food", params: { meal: "Lunch" } })}
        />
        <MealCard 
            title="Dinner" 
            time="Evening" 
            calories={getMealStats("Dinner").calories} 
            itemsCount={getMealStats("Dinner").itemsCount} 
            iconName="silverware-fork-knife" 
            onViewPress={() => router.push({ pathname: "/modal", params: { meal: "Dinner" } })}
            onAddPress={() => router.push({ pathname: "/add_food", params: { meal: "Dinner" } })}
        />
        <MealCard 
            title="Snacks" 
            time="Various" 
            calories={getMealStats("Snacks").calories} 
            itemsCount={getMealStats("Snacks").itemsCount} 
            iconName="silverware-fork-knife" 
            onViewPress={() => router.push({ pathname: "/modal", params: { meal: "Snacks" } })}
            onAddPress={() => router.push({ pathname: "/add_food", params: { meal: "Snacks" } })}
        />

      </ScrollView>

      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      
      <CalendarModal 
        visible={showCalendar} 
        onClose={() => setShowCalendar(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#DADBDB" }, // Light gray background from mockup

  // Header
  header: {
    height: 65,
    backgroundColor: "#527A3A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitleContainer: { flexDirection: "row", alignItems: "center" },
  logoIconImage: { width: 45, height: 45, marginRight: 10 },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    marginTop: -2,
  },
  headerRightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6BAE45",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6BAE45',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 100, marginTop: 25 },

  // Summary Card
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
  },
  summaryTitle: {
    color: "#6BAE45",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValueGreen: {
    fontSize: 32,
    fontWeight: "900",
    color: "#6BAE45",
  },
  summaryValueOrange: {
    fontSize: 32,
    fontWeight: "900",
    color: "#D1855C",
  },
  summaryValueDark: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2D3C59",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#A0A9B5",
    fontWeight: "500",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#EAEAEA",
  },
  progressBarContainer: {
      width: '100%',
      alignItems: 'center',
  },
  progressBarBackground: {
      width: '95%',
      height: 12,
      backgroundColor: "#E2E4E7",
      borderRadius: 6,
      overflow: 'hidden',
  },
  progressBarFill: {
      height: '100%',
      backgroundColor: "#8A97A8", // Olive/Grayish fill indicating slight progress
      borderRadius: 6,
  },

  // Meal Card
  mealCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  mealHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  mealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#F4F9F5",
    borderColor: "#C5E1A5",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3C59",
  },
  mealTime: {
      fontSize: 13,
      color: "#8A97A8",
      marginTop: 2,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#6BAE45",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6BAE45",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  mealFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsContainer: {
      flexDirection: "row",
      alignItems: "center",
  },
  statBlock: {
      alignItems: "flex-start",
  },
  statDivider: {
      width: 1,
      height: 30,
      backgroundColor: "#EAEAEA",
      marginHorizontal: 15,
  },
  mealCalories: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2D3C59",
  },
  mealSubtext: {
    fontSize: 12,
    color: "#A0A9B5",
    fontWeight: "500",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewButtonText: {
      color: "#6BAE45",
      fontSize: 16,
      fontWeight: "bold",
      marginRight: 2,
  }
});
