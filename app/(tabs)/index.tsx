import {
  Ionicons,
  MaterialCommunityIcons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
import LogExerciseModal from "../../components/LogExerciseModal";
import { useNutrition } from "../../context/NutritionContext";
import { useFoodLog } from "../../context/FoodLogContext";
import { useExerciseLog } from "../../context/ExerciseContext";
import { useFasting } from "../../context/FastingContext";
import { useDate } from "../../context/DateContext";
import { useAppTheme } from "../../context/ThemeContext";
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
// Reusable component para sa 3 bilog (Fats, Proteins, Carbs)
interface NutrientCircleProps {
  name: string;
  value: string;
  total: string;
  progressColor: string;
}

const NutrientCircle: React.FC<NutrientCircleProps> = ({ name, value, total, progressColor }) => {
  const { colors } = useAppTheme();
  
  const numValue = parseFloat(value) || 0;
  const numTotal = parseFloat(total) || 1; // avoid divide by zero
  const percentage = (numValue / numTotal) * 100;

  const currentTop = percentage > 0 ? progressColor : colors.border;
  const currentRight = percentage > 25 ? progressColor : colors.border;
  const currentBottom = percentage > 50 ? progressColor : colors.border;
  const currentLeft = percentage > 75 ? progressColor : colors.border;

  return (
    <View style={styles.nutrientCircleContainer}>
      {/* Outline using border chunks to visually represent progress */}
      <View style={[styles.circleOutline, { 
        borderColor: colors.border, 
        borderTopColor: currentTop, 
        borderRightColor: currentRight,
        borderBottomColor: currentBottom,
        borderLeftColor: currentLeft
      }]}></View>
    <View style={styles.circleContent}>
      <Text style={[styles.nutrientName, { color: progressColor }]}>{name}</Text>
      <Text style={[styles.nutrientValue, { color: colors.textSub }]}>
        <Text style={{ fontWeight: 'bold', color: colors.text }}>{value}</Text> / {total}
      </Text>
    </View>
    </View>
  );
};

interface ActivityCardProps {
  icon: React.ReactNode;
  name: string;
  value: string;
  goal: string;
  unit: string;
  bgColor: string;
  iconColor: string;
}

// Reusable component para sa Activity Cards (Calories & Minutes)
const ActivityCard: React.FC<ActivityCardProps> = ({
  icon,
  name,
  value,
  goal,
  unit,
  bgColor,
  iconColor,
}) => {
  const { colors } = useAppTheme();
  return (
  <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
    <View style={styles.activityHeader}>
      <View style={[styles.activityIconContainer, { backgroundColor: colors.iconBg, padding: 8, borderRadius: 10 }]}>
        {icon}
      </View>
      <View>
        <Text style={[styles.activityName, { color: colors.text }]}>{name}</Text>
      </View>
    </View>
    <View style={styles.activityValueContainer}>
      <Text style={[styles.activityValue, { color: iconColor }]}>{value}</Text>
      <Text style={[styles.activityGoal, { color: colors.textSub }]}>
        {unit === "" ? goal : `Goal: ${goal} ${unit}`}
      </Text>
    </View>
  </View>
  );
};

import { useRouter } from "expo-router";
import SmartGuideModal from "../../components/SmartGuideModal";
import NotificationModal from "../../components/NotificationModal";
import CalendarModal from "../../components/CalendarModal";
import { useNotifications } from "../../context/NotificationContext";

export default function HomeScreen() {
  const router = useRouter();
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showSmartGuide, setShowSmartGuide] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const hasCheckedSmartGuide = useRef(false);

  const { targets } = useNutrition();
  const { getTotals } = useFoodLog();
  const logged = getTotals();
  const { displayDate, prevDate, nextDate, isToday } = useDate();
  const { colors } = useAppTheme();
  const { logExercise, deleteExercise, getTodayTotals } = useExerciseLog();
  const todayExercise = getTodayTotals();
  const { unreadCount } = useNotifications();

  // ── Smart Guide Logic ──────────────────────────────────────────────────────
  useEffect(() => {
    // Only check once per session/mount
    if (hasCheckedSmartGuide.current) return;

    const checkSmartGuide = () => {
      // 1. Only check for today's data
      if (!targets || !isToday) return;

      // 2. Only check near the end of the day (e.g., after 6:00 PM)
      const currentHour = new Date().getHours();
      const isEvening = currentHour >= 18;
      if (!isEvening) return;

      // 3. Only show if user is VERY low on protein (< 50% of target)
      const isVeryLowOnProtein = targets.protein > 0 && logged.protein < (targets.protein / 2);
      
      if (isVeryLowOnProtein) {
        setShowSmartGuide(true);
        hasCheckedSmartGuide.current = true;
      }
    };

    // Small delay to let the initial data settle
    const timer = setTimeout(checkSmartGuide, 2000);
    return () => clearTimeout(timer);
  }, [logged.protein, isToday]);

  const handleLogFoodNow = () => {
    setShowSmartGuide(false);
    router.push("/add_food");
  };

  const { fastingState, remainingSeconds, startFast, resetFast } = useFasting();

  const progressPct = fastingState.isFasting 
    ? Math.round(((fastingState.targetDuration - remainingSeconds) / fastingState.targetDuration) * 100)
    : 0;

  const handleFastingButton = () => {
    if (!fastingState.isFasting) {
      startFast();
    } else {
      resetFast();
    }
  };

  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600).toString().padStart(2, "0");
    const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, "0");
    const s = (totalSecs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const formatDurationFriendly = (totalSecs: number) => {
    if (totalSecs === 0) return "0 min";
    let parts = [];
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = Math.floor(totalSecs % 60);
    if (h > 0) parts.push(`${h} hr`);
    if (m > 0 || (h > 0 && s > 0)) parts.push(`${m} min`);
    if (s > 0) parts.push(`${s} sec`);
    return parts.join(' ');
  };

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Daily Nutrients Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Nutrients</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.nutrientRow}>
            <NutrientCircle
              name="Fats"
              value={`${logged.fat}g`}
              total={targets ? `${targets.fat}g` : "0g"}
              progressColor="#D1855C"
            />
            <NutrientCircle
              name="Proteins"
              value={`${logged.protein}g`}
              total={targets ? `${targets.protein}g` : "0g"}
              progressColor="#6BAE45"
            />
            <NutrientCircle
              name="Carbs"
              value={`${logged.carbs}g`}
              total={targets ? `${targets.carbs}g` : "0g"}
              progressColor="#2D3C59"
            />
          </View>
        </View>

        {/* 2. Fasting Tracker Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Fasting Tracker</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.fastingHeader}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={20}
              color="#D1855C"
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.timeRemainingLabel, { color: colors.textSub }]}>Time Remaining</Text>
            <TouchableOpacity onPress={handleFastingButton}>
              <Text style={styles.restartText}>{fastingState.isFasting ? "Restart" : "Start"}</Text>
            </TouchableOpacity>
          </View>

          {/* Main Timer Display */}
          <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(remainingSeconds)}</Text>

          {/* Progress Bar */}
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` as any }]} />
          </View>

          <View style={styles.fastingStatusRow}>
            <Text style={[styles.windowText, { color: colors.text }]}>16:8 Fasting Window</Text>
            <Text style={[styles.completePercentText, { color: colors.text }]}>{progressPct}% Complete</Text>
          </View>
        </View>

        {/* 3. Daily Activity Section */}
        <View style={styles.activitySectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Activity</Text>
          <TouchableOpacity style={styles.plusButtonContainer} onPress={() => setShowExerciseModal(true)}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.activitySubtitle, { color: colors.textSub }]}>Track your workouts</Text>

        <View style={styles.activityCardsRow}>
          <ActivityCard
            icon={<SimpleLineIcons name="fire" size={18} color="#D1855C" />}
            name="Calories Burned"
            value={todayExercise.calories.toString()}
            goal="0"
            unit="kcal"
            bgColor="#FFF6EE" 
            iconColor="#D1855C"
          />
          <ActivityCard
            icon={
              <MaterialCommunityIcons
                name="chart-line-variant"
                size={20}
                color="#6BAE45"
              />
            }
            name="Active Time"
            value={formatDurationFriendly(todayExercise.durationSeconds)}
            goal={todayExercise.entries.length > 0 ? todayExercise.entries[0].name : "No Activity"}
            unit={todayExercise.entries.length > 0 ? "" : ""}
            bgColor="#F4F9F5" 
            iconColor="#6BAE45"
          />
        </View>

        {/* 4. Today's Exercise List */}
        {todayExercise.entries.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.exerciseListTitle, { color: colors.text }]}>Today's Activities</Text>
            {todayExercise.entries.map((entry) => (
              <View key={entry.id} style={[styles.exerciseItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.exerciseIconContainer, { backgroundColor: colors.iconBg }]}>
                  <MaterialCommunityIcons name="run" size={20} color={colors.primary} />
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseNameText, { color: colors.text }]}>{entry.name}</Text>
                  <Text style={[styles.exerciseSubText, { color: colors.textSub }]}>{formatDurationFriendly(entry.durationSeconds)} • {entry.calories} kcal</Text>
                </View>
                <TouchableOpacity onPress={() => deleteExercise(entry.id)} style={styles.deleteIconContainer}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <LogExerciseModal
        visible={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        onLog={(exercise, hrs, mins, secs) => {
          logExercise(exercise, hrs, mins, secs);
        }}
      />

      <SmartGuideModal 
        visible={showSmartGuide} 
        onClose={() => setShowSmartGuide(false)} 
        onLogFood={() => {
          setShowSmartGuide(false);
          router.push("/add_food");
        }}
      />

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
  container: { flex: 1, backgroundColor: "#DADBDB" },

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
  sectionTitle: {
    color: "#6BAE45",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },

  // Generic Card Style
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  // Nutrients Section
  nutrientRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  nutrientCircleContainer: { alignItems: "center", justifyContent: "center", position: "relative" },
  circleOutline: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: "#EAEAEA", // Base color
    marginBottom: 10,
    transform: [{ rotate: "45deg" }], // Just to show some "progress" using borders
  },
  circleContent: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    top: 20,
  },
  nutrientName: { fontSize: 13, fontWeight: "bold", marginBottom: 2 },
  nutrientValue: { fontSize: 11, color: "#8A97A8", fontWeight: "500" },

  // Fasting Section
  fastingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    position: "relative",
  },
  timeRemainingLabel: {
    fontSize: 14,
    color: "#A0A9B5",
    fontWeight: "500",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  restartText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6BAE45",
  },
  timerText: {
    textAlign: "center",
    fontSize: 42,
    fontWeight: "bold",
    color: "#D1855C",
    marginBottom: 20,
    letterSpacing: 1,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#E2E4E7",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
    flexDirection: "row",
  },
  progressBarFill: {
    height: "100%",
    width: "72%",
    backgroundColor: "#6BAE45",
    borderRadius: 4,
  },
  fastingStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  windowText: { fontSize: 13, color: "#A0A9B5", fontWeight: "500" },
  completePercentText: { fontSize: 13, color: "#2D3C59", fontWeight: "bold" },

  // Activity Section
  activitySectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
    marginTop: 10,
  },
  activitySubtitle: {
    color: "#A0A9B5",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 15,
  },
  plusButtonContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6BAE45",
    justifyContent: "center",
    alignItems: "center",
  },
  activityCardsRow: { flexDirection: "row", justifyContent: "space-between" },
  activityCard: {
    width: "48%",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  activityIconContainer: { marginBottom: 12 },
  activityName: { fontSize: 14, color: "#2D3C59", fontWeight: "700" },
  activityValueContainer: { marginTop: 5 },
  activityValue: { fontSize: 28, fontWeight: "bold", marginBottom: 2 },
  activityGoal: { fontSize: 12, color: "#A0A9B5", fontWeight: "500" },

  // Exercise List Styles
  exerciseListTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6BAE45",
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  exerciseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F9F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseNameText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2D3C59",
  },
  exerciseSubText: {
    fontSize: 12,
    color: "#A0A9B5",
    marginTop: 2,
  },
  deleteIconContainer: {
    padding: 8,
  },
});
