import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNutrition } from "../../context/NutritionContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { useDate } from "../../context/DateContext";
import { useAppTheme } from "../../context/ThemeContext";
import NotificationModal from "../../components/NotificationModal";
import CalendarModal from "../../components/CalendarModal";





const GENDER_OPTIONS = ["Male", "Female"];

const ACTIVITY_OPTIONS = [
  "Sedentary (office job)",
  "Light Exercise (1-2 days/week)",
  "Moderate Exercise (3-5 days/week)",
  "Heavy Exercise (6-7 days/week)",
  "Athlete (2x per day)",
];

const GOAL_OPTIONS = [
  "Lose weight",
  "Maintain weight",
  "Gain weight",
  "Gain muscle",
];

// ─── Reusable dropdown picker modal ─────────────────────────────────────────
interface DropdownPickerProps {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function DropdownPicker({ visible, title, options, selected, onSelect, onClose }: DropdownPickerProps) {
  const { colors } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[pickerStyles.sheet, { backgroundColor: colors.background }]}>
          <Text style={[pickerStyles.sheetTitle, { color: colors.text }]}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[pickerStyles.option, item === selected && pickerStyles.optionSelected]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={[pickerStyles.optionText, { color: colors.text }, item === selected && pickerStyles.optionTextSelected]}>
                  {item}
                </Text>
                {item === selected && (
                  <Ionicons name="checkmark" size={20} color="#6BAE45" />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={pickerStyles.separator} />}
          />
          <TouchableOpacity style={[pickerStyles.cancelBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={onClose}>
            <Text style={pickerStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3C59",
    textAlign: "center",
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: "#F4F9F5",
  },
  optionText: {
    fontSize: 15,
    color: "#2D3C59",
    flex: 1,
  },
  optionTextSelected: {
    color: "#6BAE45",
    fontWeight: "700",
  },
  separator: {
    height: 1,
    backgroundColor: "#EAEAEA",
  },
  cancelBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8A97A8",
  },
});

// ─── Inline dropdown trigger button ──────────────────────────────────────────
interface DropdownButtonProps {
  value: string;
  isActive: boolean;
  onPress: () => void;
  fullWidth?: boolean;
}

function DropdownButton({ value, isActive, onPress, fullWidth }: DropdownButtonProps) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.dropdownBtn,
        { backgroundColor: colors.card, borderColor: isActive ? colors.primary : colors.border },
        fullWidth && styles.dropdownBtnFull,
        isActive && styles.dropdownBtnActive,
      ]}
    >
      <Text style={[styles.dropdownBtnText, { color: colors.text }, isActive && styles.dropdownBtnTextActive]} numberOfLines={1}>
        {value}
      </Text>
      <Ionicons name="chevron-down" size={18} color={isActive ? "#6BAE45" : colors.textSub} />
    </TouchableOpacity>
  );
}

import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import CryptoJS from "crypto-js";

// ─── Main Profile Screen ──────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { calculateMacros, updateTargets, profile: savedProfile, targets: savedTargets, isLoaded } = useNutrition();
  const { displayDate, prevDate, nextDate, isToday } = useDate();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const { user, logout } = useAuth();

  const [username, setUsername] = useState("NutriTracker");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("Male");
  const [activity, setActivity] = useState("Moderate Exercise (3-5 days/week)");
  const [goal, setGoal] = useState("Maintain weight");
  const [isManualMode, setIsManualMode] = useState(false);

  // Manual values
  const [mCal, setMCal] = useState("");
  const [mPro, setMPro] = useState("");
  const [mCarb, setMCarb] = useState("");
  const [mFat, setMFat] = useState("");

  const [activeInput, setActiveInput] = useState<string | null>(null);

  // which dropdown modal is open: "gender" | "activity" | "goal" | null
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // 1. Sync Username from Firestore
  useEffect(() => {
    if (!user) return;
    
    // Set Gravatar from email
    const email = user.email || "";
    const hash = CryptoJS.MD5(email.trim().toLowerCase()).toString();
    setGravatarUrl(`https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`);

    // Listen to Firestore for current username
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.username) setUsername(data.username);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateName = async () => {
    if (!user || !tempName.trim()) {
      setIsEditingName(false);
      return;
    }

    try {
      await updateDoc(doc(db, "users", user.uid), {
        username: tempName.trim()
      });
      setIsEditingName(false);
      Alert.alert("Success", "Username updated!");
    } catch (error) {
      console.error("Error updating username:", error);
      Alert.alert("Error", "Failed to update username.");
    }
  };

  useEffect(() => {
    if (isLoaded && savedProfile) {
      setAge(savedProfile.age || "");
      setWeight(savedProfile.weight || "");
      setHeight(savedProfile.height || "");
      setGender(savedProfile.gender || "Male");
      setActivity(savedProfile.activity || "Moderate Exercise (3-5 days/week)");
      setGoal(savedProfile.goal || "Maintain weight");
      setIsManualMode(savedProfile.isManual || false);

      // --- New User Onboarding Prompt ---
      // If any of these are missing, it's a new or incomplete profile
      // Only show this if a user is actually logged in to prevent showing it during logout
      if (user && (!savedProfile.age || !savedProfile.weight || !savedProfile.height)) {
        Alert.alert(
          "Complete Your Profile",
          "Welcome to NutriTrack! Please fill in your basic information (Age, Weight, Height) so we can calculate your daily nutrition goals for you.",
          [{ text: "Okay, I'll do it!", style: "default" }]
        );
      }
    }
    if (isLoaded && savedTargets) {
      setMCal(savedTargets.calories.toString());
      setMPro(savedTargets.protein.toString());
      setMCarb(savedTargets.carbs.toString());
      setMFat(savedTargets.fat.toString());
    }
  }, [isLoaded, savedProfile, savedTargets]);

  const handleSaveGoals = () => {
    const validRegex = /^\d+(\.\d+)?$/;

    if (isManualMode) {
      if (!validRegex.test(mCal) || !validRegex.test(mPro) || !validRegex.test(mCarb) || !validRegex.test(mFat)) {
        Alert.alert("Invalid Input", "Please enter valid numbers without spaces for all manual goal fields.");
        return;
      }

      const calories = parseInt(mCal);
      const protein = parseInt(mPro);
      const carbs = parseInt(mCarb);
      const fat = parseInt(mFat);

      if (isNaN(calories) || isNaN(protein) || isNaN(carbs) || isNaN(fat)) {
        Alert.alert("Invalid Input", "Please enter valid numbers for all manual goal fields.");
        return;
      }

      updateTargets({ calories, protein, carbs, fat });
      Alert.alert("✅ Manual Goals Saved!", "Your custom dashboard goals have been updated.");
    } else {
      if (!validRegex.test(age) || !validRegex.test(weight) || !validRegex.test(height)) {
        Alert.alert("Invalid Input", "Please enter valid numbers without spaces for Age, Weight, and Height.");
        return;
      }

      const result = calculateMacros({ age, weight, height, gender, activity, goal, isManual: false });
      if (!result) {
        Alert.alert("Invalid Input", "Please enter valid numbers for Age, Weight, and Height.");
        return;
      }
      Alert.alert(
        "✅ Auto-Macros Calculated!",
        `Daily Calorie Goal: ${result.calories} kcal\n\nProtein: ${result.protein}g\nCarbs: ${result.carbs}g\nFat: ${result.fat}g`,
        [{ text: "Got it!", style: "default" }]
      );
    }
  };

  const getInputStyle = (inputName: string) => {
    const isActive = activeInput === inputName;
    return {
      container: [styles.input, isActive && styles.inputActive, { backgroundColor: colors.card, borderColor: isActive ? colors.primary : colors.border }],
      textColor: isActive ? colors.primary : colors.text,
    };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.header} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <View style={styles.headerTitleContainer}>
          <Image
            source={require("../../assets/images/NutriTrackLOGO.png")}
            style={styles.logoIconImage}
            resizeMode="contain"
          />
          <View>
            <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>NUTRITRACK</Text>
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

      <NotificationModal 
        visible={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      <CalendarModal 
        visible={showCalendar} 
        onClose={() => setShowCalendar(false)} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Info */}
        <View style={styles.userInfoContainer}>
          <View style={styles.avatarContainer}>
            {user?.photoURL || gravatarUrl ? (
              <Image 
                source={{ uri: user?.photoURL || gravatarUrl || "" }} 
                style={styles.avatarImage} 
              />
            ) : (
              <View style={styles.avatarPattern} />
            )}
          </View>

          <View style={styles.userInfoText}>
            {isEditingName ? (
              <View style={styles.editNameRow}>
                <TextInput
                  style={[styles.usernameInput, { color: colors.text, borderColor: colors.primary }]}
                  value={tempName}
                  onChangeText={setTempName}
                  autoFocus
                  placeholder="Enter name"
                  placeholderTextColor={colors.textSub}
                />
                <TouchableOpacity onPress={handleUpdateName} style={styles.saveNameBtn}>
                  <Ionicons name="checkmark-circle" size={28} color="#6BAE45" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.nameRow}>
                <Text style={[styles.username, { color: colors.text }]}>{username || user?.displayName || "User"}</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setTempName(username);
                    setIsEditingName(true);
                  }}
                  style={styles.editIconBtn}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            <Text style={[styles.userSubtitle, { color: colors.textSub }]}>{user?.email}</Text>
          </View>
        </View>

        {/* Goal Source / Mode Toggle */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="options-outline" size={20} color={colors.primary} style={styles.cardIcon} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Goal Settings</Text>
          </View>
          <Text style={[styles.labelSubtitle, { color: colors.textSub }]}>Choose how you set your goals:</Text>
          <View style={[styles.toggleRow, { backgroundColor: colors.background }]}>
            <TouchableOpacity 
              style={[styles.toggleBtn, !isManualMode && { backgroundColor: colors.primary }]} 
              onPress={() => setIsManualMode(false)}
            >
              <Text style={[styles.toggleBtnText, { color: colors.textSub }, !isManualMode && { color: "#FFFFFF", fontWeight: "bold" }]}>Automatic</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, isManualMode && { backgroundColor: colors.primary }]} 
              onPress={() => setIsManualMode(true)}
            >
              <Text style={[styles.toggleBtnText, { color: colors.textSub }, isManualMode && { color: "#FFFFFF", fontWeight: "bold" }]}>Manual</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helpText}>
            {isManualMode 
              ? "Manual mode lets you type your own targets. Perfect if you have a specific plan from a coach."
              : "Automatic mode calculates goals based on your age, weight, and activity level."}
          </Text>
        </View>

        {!isManualMode ? (
          <>
            {/* Basic Information Card */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-outline" size={20} color="#6BAE45" style={styles.cardIcon} />
                <Text style={styles.cardTitle}>Basic Information</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Age *</Text>
                  <TextInput
                    style={[getInputStyle("age").container, { color: getInputStyle("age").textColor }]}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    onFocus={() => setActiveInput("age")}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Weight (kg) *</Text>
                  <TextInput
                    style={[getInputStyle("weight").container, { color: getInputStyle("weight").textColor }]}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    onFocus={() => setActiveInput("weight")}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Height (cm) *</Text>
                  <TextInput
                    style={[getInputStyle("height").container, { color: getInputStyle("height").textColor }]}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    onFocus={() => setActiveInput("height")}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
                  <DropdownButton
                    value={gender}
                    isActive={openDropdown === "gender"}
                    onPress={() => { setActiveInput(null); setOpenDropdown("gender"); }}
                  />
                </View>
              </View>
            </View>

            {/* Activity Level + Your Goal Card */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="pulse" size={20} color="#6BAE45" style={styles.cardIcon} />
                <Text style={styles.cardTitle}>Activity Level</Text>
              </View>
              <Text style={[styles.labelSubtitle, { color: colors.text }]}>How active are you?</Text>
              <DropdownButton
                value={activity}
                isActive={openDropdown === "activity"}
                onPress={() => { setActiveInput(null); setOpenDropdown("activity"); }}
                fullWidth
              />

              <View style={[styles.cardHeader, { marginTop: 25 }]}>
                <Ionicons name="disc-outline" size={20} color="#6BAE45" style={styles.cardIcon} />
                <Text style={styles.cardTitle}>Your Goal</Text>
              </View>
              <Text style={[styles.labelSubtitle, { color: colors.text }]}>What's your fitness goal?</Text>
              <DropdownButton
                value={goal}
                isActive={openDropdown === "goal"}
                onPress={() => { setActiveInput(null); setOpenDropdown("goal"); }}
                fullWidth
              />
            </View>
          </>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="create-outline" size={20} color="#6BAE45" style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Custom Daily Targets</Text>
            </View>
            
            <View style={styles.inputGroupFull}>
              <Text style={[styles.label, { color: colors.text }]}>Daily Calorie Goal (kcal)</Text>
              <TextInput
                style={[getInputStyle("mCal").container, { color: getInputStyle("mCal").textColor }]}
                value={mCal}
                onChangeText={setMCal}
                keyboardType="numeric"
                onFocus={() => setActiveInput("mCal")}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Protein (g)</Text>
                <TextInput
                  style={[getInputStyle("mPro").container, { color: getInputStyle("mPro").textColor }]}
                  value={mPro}
                  onChangeText={setMPro}
                  keyboardType="numeric"
                  onFocus={() => setActiveInput("mPro")}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Carbs (g)</Text>
                <TextInput
                  style={[getInputStyle("mCarb").container, { color: getInputStyle("mCarb").textColor }]}
                  value={mCarb}
                  onChangeText={setMCarb}
                  keyboardType="numeric"
                  onFocus={() => setActiveInput("mCarb")}
                />
              </View>
            </View>

            <View style={styles.inputGroupFull}>
              <Text style={[styles.label, { color: colors.text }]}>Fat (g)</Text>
              <TextInput
                style={[getInputStyle("mFat").container, { color: getInputStyle("mFat").textColor }]}
                value={mFat}
                onChangeText={setMFat}
                keyboardType="numeric"
                onFocus={() => setActiveInput("mFat")}
              />
            </View>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={handleSaveGoals}>
          <Text style={styles.buttonText}>Save Profile</Text>
        </TouchableOpacity>

        {/* Theme Settings Card */}
        <View style={[styles.card, { backgroundColor: colors.card, marginTop: 20 }]}>
          <View style={styles.cardHeader}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={colors.primary} style={styles.cardIcon} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Theme Settings</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <Text style={{ color: colors.textSub, fontSize: 14 }}>Enable Dark Theme</Text>
            <TouchableOpacity
              onPress={toggleTheme}
              style={{
                width: 50, height: 28, borderRadius: 14,
                backgroundColor: isDark ? colors.primary : "#EAEAEA",
                padding: 2,
                justifyContent: "center",
                alignItems: isDark ? "flex-end" : "flex-start"
              }}
            >
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#FFF" }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert("Logout", "Are you sure you want to logout?", [
              { text: "Cancel", style: "cancel" },
              { text: "Logout", style: "destructive", onPress: logout }
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" style={{marginRight: 8}} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      <DropdownPicker
        visible={openDropdown === "gender"}
        title="Select Gender"
        options={GENDER_OPTIONS}
        selected={gender}
        onSelect={setGender}
        onClose={() => setOpenDropdown(null)}
      />
      <DropdownPicker
        visible={openDropdown === "activity"}
        title="Select Activity Level"
        options={ACTIVITY_OPTIONS}
        selected={activity}
        onSelect={setActivity}
        onClose={() => setOpenDropdown(null)}
      />
      <DropdownPicker
        visible={openDropdown === "goal"}
        title="Select Your Goal"
        options={GOAL_OPTIONS}
        selected={goal}
        onSelect={setGoal}
        onClose={() => setOpenDropdown(null)}
      />
      </ScrollView>
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
  scrollContent: { padding: 20, paddingBottom: 100 },

  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    marginTop: 10,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    marginRight: 15,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPattern: {
    width: 100,
    height: 100,
    backgroundColor: "#F0F0F0",
  },
  userInfoText: { flex: 1, justifyContent: "center" },
  username: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0b3114ff",
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 13,
    color: "#0b3114ff",
    fontWeight: "600",
  },
  
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  editIconBtn: {
    marginLeft: 8,
    padding: 4,
  },
  editNameRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  usernameInput: {
    fontSize: 20,
    fontWeight: "bold",
    borderBottomWidth: 1.5,
    flex: 1,
    paddingVertical: 4,
    marginRight: 10,
  },
  saveNameBtn: {
    padding: 4,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  cardIcon: { marginRight: 10 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#6BAE45" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  inputGroup: { width: "47%" },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2D3C59",
    marginBottom: 8,
  },
  labelSubtitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2D3C59",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#8A97A8",
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  inputActive: {
    borderColor: "#6BAE45",
  },

  // Dropdown trigger button
  dropdownBtn: {
    borderWidth: 1,
    borderColor: "#8A97A8",
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  dropdownBtnFull: {
    marginBottom: 10,
  },
  dropdownBtnActive: {
    borderColor: "#6BAE45",
  },
  dropdownBtnText: {
    fontSize: 15,
    color: "#2D3C59",
    flex: 1,
    marginRight: 4,
  },
  dropdownBtnTextActive: {
    color: "#6BAE45",
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#6BAE45",
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    elevation: 4,
    shadowColor: "#6BAE45",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#FF6B6B40",
    borderRadius: 12,
  },
  logoutButtonText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Toggle Styles
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8A97A8",
  },
  toggleBtnTextActive: {
    color: "#6BAE45",
  },
  helpText: {
    fontSize: 12,
    color: "#8A97A8",
    fontStyle: "italic",
    lineHeight: 18,
  },
  inputGroupFull: {
    width: "100%",
    marginBottom: 15,
  },
});

