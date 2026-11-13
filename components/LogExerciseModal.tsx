import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useAppTheme } from "../context/ThemeContext";

// ─── Exercise List ─────────────────────────────────────────────────────────────
export const EXERCISE_OPTIONS = [
  // Cardio
  "Running (Moderate pace)",
  "Cycling (Casual)",
  "Cycling (High Intensity)",
  "Jump Rope",
  "HIIT (High-Intensity Interval Training)",
  "Swimming",
  // Strength
  "Weightlifting",
  "Bodyweight Workout (Push-ups, Sit-ups, Squats)",
  "Yoga / Pilates",
  // Sports
  "Basketball",
  "Badminton / Tennis",
  "Boxing / Martial Arts",
  // Light
  "Walking (Brisk pace)",
  "Walking (Slow/Casual)",
  "Stair Climbing",
  "Dancing / Zumba",
  "General Housework / Cleaning",
];

// ─── Exercise Picker Sheet ─────────────────────────────────────────────────────
interface ExercisePickerProps {
  visible: boolean;
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function ExercisePicker({ visible, selected, onSelect, onClose }: ExercisePickerProps) {
  const { colors } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={sheetStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[sheetStyles.sheet, { backgroundColor: colors.background }]}>
          <Text style={[sheetStyles.sheetTitle, { color: colors.text }]}>Select Exercise</Text>
          <FlatList
            data={EXERCISE_OPTIONS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[sheetStyles.option, item === selected && sheetStyles.optionSelected]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text
                  style={[sheetStyles.optionText, { color: colors.text }, item === selected && sheetStyles.optionTextSelected]}
                  numberOfLines={1}
                >
                  {item}
                </Text>
                {item === selected && (
                  <Ionicons name="checkmark" size={18} color="#6BAE45" />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={sheetStyles.separator} />}
          />
          <TouchableOpacity style={[sheetStyles.cancelBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={onClose}>
            <Text style={sheetStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
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
    maxHeight: "75%",
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
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  optionSelected: { backgroundColor: "#F4F9F5" },
  optionText: { fontSize: 14, color: "#2D3C59", flex: 1, marginRight: 4 },
  optionTextSelected: { color: "#6BAE45", fontWeight: "700" },
  separator: { height: 1, backgroundColor: "#EAEAEA" },
  cancelBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: "#8A97A8" },
});

// ─── Log Exercise Modal ────────────────────────────────────────────────────────
interface LogExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onLog: (exercise: string, hours: string, minutes: string, seconds: string) => void;
}

export default function LogExerciseModal({ visible, onClose, onLog }: LogExerciseModalProps) {
  const { colors } = useAppTheme();
  const [exercise, setExercise] = useState("Running (Moderate pace)");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // Clear inputs when modal is closed
  React.useEffect(() => {
    if (!visible) {
      setHours("");
      setMinutes("");
      setSeconds("");
    }
  }, [visible]);

  const handleLog = () => {
    // Only allow digits (no spaces, no decimals, no other chars)
    const validRegex = /^\d*$/;
    if (!validRegex.test(hours) || !validRegex.test(minutes) || !validRegex.test(seconds)) {
      Alert.alert("Invalid Input", "Please enter valid numbers only (no spaces or decimals).");
      return;
    }

    const h = parseInt(hours || "0", 10);
    const m = parseInt(minutes || "0", 10);
    const s = parseInt(seconds || "0", 10);

    if (h === 0 && m === 0 && s === 0) {
      Alert.alert("Invalid Duration", "Please enter a duration greater than 0.");
      return;
    }

    onLog(exercise, hours, minutes, seconds);
    onClose();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            {/* Green top accent */}
            <View style={styles.topAccent} />

            {/* Header row */}
            <View style={styles.headerRow}>
              <View style={[styles.iconWrap, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                <MaterialCommunityIcons name="dumbbell" size={26} color="#6BAE45" />
              </View>
              <Text style={styles.title}>Log Activity</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="#A0A9B5" />
              </TouchableOpacity>
            </View>

            {/* Exercise Name */}
            <Text style={[styles.label, { color: colors.text }]}>Activity Name</Text>
            <TouchableOpacity
              style={[styles.dropdownBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.85}
              onPress={() => setShowPicker(true)}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]} numberOfLines={1}>
                {exercise}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSub} />
            </TouchableOpacity>

            {/* Duration Input */}
            <Text style={[styles.label, { marginTop: 20, color: colors.text }]}>Duration</Text>
            <View style={styles.durationContainer}>
              <View style={[styles.durationInputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.durationInput, { color: colors.text }]}
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSub}
                  maxLength={2}
                />
                <Text style={[styles.durationHint, { color: colors.textSub }]}>hr</Text>
              </View>
              <Text style={[styles.colon, { color: colors.text }]}>:</Text>
              <View style={[styles.durationInputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.durationInput, { color: colors.text }]}
                  value={minutes}
                  onChangeText={setMinutes}
                  keyboardType="numeric"
                  placeholder="30"
                  placeholderTextColor={colors.textSub}
                  maxLength={2}
                />
                <Text style={[styles.durationHint, { color: colors.textSub }]}>min</Text>
              </View>
              <Text style={[styles.colon, { color: colors.text }]}>:</Text>
              <View style={[styles.durationInputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.durationInput, { color: colors.text }]}
                  value={seconds}
                  onChangeText={setSeconds}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSub}
                  maxLength={2}
                />
                <Text style={[styles.durationHint, { color: colors.textSub }]}>sec</Text>
              </View>
            </View>

            {/* Log Button */}
            <TouchableOpacity style={styles.logBtn} onPress={handleLog} activeOpacity={0.85}>
              <Text style={styles.logBtnText}>Log Activity</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Exercise picker overlay */}
      <ExercisePicker
        visible={showPicker}
        selected={exercise}
        onSelect={setExercise}
        onClose={() => setShowPicker(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modal: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    paddingTop: 36,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: "#6BAE45",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F0FAF0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "bold",
    color: "#6BAE45",
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D3C59",
    marginBottom: 10,
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#DADDE3",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 58,
    backgroundColor: "#FAFAFA",
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    color: "#A0A9B5",
    marginRight: 8,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  durationInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#DADDE3",
    borderRadius: 14,
    paddingHorizontal: 8,
    height: 58,
    backgroundColor: "#FAFAFA",
  },
  durationInput: {
    flex: 1,
    fontSize: 16,
    color: "#2D3C59",
    textAlign: "right",
    paddingRight: 4,
  },
  durationHint: {
    fontSize: 12,
    color: "#A0A9B5",
    fontWeight: "600",
  },
  colon: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3C59",
    marginHorizontal: 8,
  },
  logBtn: {
    marginTop: 28,
    backgroundColor: "#6BAE45",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#6BAE45",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  logBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
});
