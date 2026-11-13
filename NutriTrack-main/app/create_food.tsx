import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";
import { saveCommunityFood } from "../services/communityFoods";
import { useFoodLog, MealType } from "../context/FoodLogContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 40 - 15) / 2; 

export default function CreateFoodScreen() {
  const router = useRouter();
  const { meal } = useLocalSearchParams<{ meal?: string }>();
  const { logFood } = useFoodLog();
  const { colors, isDark } = useAppTheme();

  const [name, setName] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [sugar, setSugar] = useState("");
  const [sodium, setSodium] = useState("");
  const [potassium, setPotassium] = useState("");
  const [cholesterol, setCholesterol] = useState("");
  const [saturatedFat, setSaturatedFat] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !calories || !protein || !carbs || !fat) {
      Alert.alert("Missing Fields", "Please fill in all nutritional information.");
      return;
    }

    setIsSubmitting(true);
    const parsedMicros = {
      fiber: parseFloat(fiber) || 0,
      sugar: parseFloat(sugar) || 0,
      sodium: parseFloat(sodium) || 0,
      potassium: parseFloat(potassium) || 0,
      cholesterol: parseFloat(cholesterol) || 0,
      saturatedFat: parseFloat(saturatedFat) || 0,
    };

    const success = await saveCommunityFood({
      name: name.trim(),
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      servingSize: servingSize.trim() || "100g",
      dataType: "Community Food",
      micronutrients: parsedMicros
    });
    setIsSubmitting(false);

    if (success) {
      if (meal && ["Breakfast", "Lunch", "Dinner", "Snacks"].includes(meal)) {
        logFood(meal as MealType, {
          fdcId: -Math.floor(Math.random() * 1000000),
          name: name.trim(),
          calories: parseFloat(calories) || 0,
          protein: parseFloat(protein) || 0,
          carbs: parseFloat(carbs) || 0,
          fat: parseFloat(fat) || 0,
          servingSize: servingSize.trim() || "100g",
          dataType: "Community Food",
          micronutrients: parsedMicros,
          baseCalories: parseFloat(calories) || 0,
          baseProtein: parseFloat(protein) || 0,
          baseCarbs: parseFloat(carbs) || 0,
          baseFat: parseFloat(fat) || 0,
          baseMicronutrients: parsedMicros
        } as any);
      }

      Alert.alert("Success!", "Your custom food has been published and logged!", [
        { text: "Awesome", onPress: () => router.push("/") }
      ]);
    } else {
      Alert.alert("Error", "Failed to save custom food. Please try again.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : "#f5f6f8" }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.headerRow, { backgroundColor: isDark ? colors.header : "#527A3A" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Custom Food</Text>
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <Text style={[styles.sectionTitle, { color: isDark ? "#A0B5E5" : "#2d3c59" }]}>General Info</Text>
          
          <View style={[styles.mainCard, { backgroundColor: isDark ? colors.card : "#FFFFFF", borderColor: colors.border }]}>
            <View style={[styles.inputField, { borderColor: isDark ? colors.border : "#a6b1c4" }]}>
              <Ionicons name="fast-food-outline" size={22} color="#527A3A" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Food Name (e.g. Adobo)"
                placeholderTextColor={isDark ? colors.textSub : "#a6b1c4"}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={[styles.inputField, { borderColor: isDark ? colors.border : "#a6b1c4", marginBottom: 0 }]}>
              <MaterialCommunityIcons name="scale-balance" size={22} color="#527A3A" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="100g"
                placeholderTextColor={isDark ? colors.textSub : "#a6b1c4"}
                value={servingSize}
                onChangeText={setServingSize}
              />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: isDark ? "#A0B5E5" : "#2d3c59", marginTop: 15 }]}>Nutrition Facts</Text>
          
          <View style={styles.macroGrid}>
            <View style={[styles.macroCard, { backgroundColor: isDark ? colors.card : "#FFFFFF" }]}>
              <View style={styles.macroHeader}>
                <MaterialCommunityIcons name="fire" size={16} color="#d6714c" />
                <Text style={[styles.macroLabel, { color: "#d6714c" }]}>Calories</Text>
              </View>
              <View style={[styles.macroInputWrapper, { backgroundColor: isDark ? colors.background : "#e2e6eb" }]}>
                <TextInput
                  style={[styles.macroInputCenter, { color: colors.text }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={isDark ? colors.textSub : "#a6b1c4"}
                  selectionColor="#66AE44"
                  value={calories}
                  onChangeText={setCalories}
                />
              </View>
              <Text style={[styles.macroUnit, { color: isDark ? colors.textSub : "#a6b1c4" }]}>kcal</Text>
            </View>

            <View style={[styles.macroCard, { backgroundColor: isDark ? colors.card : "#FFFFFF" }]}>
              <View style={styles.macroHeader}>
                <Ionicons name="fish" size={16} color="#527A3A" />
                <Text style={[styles.macroLabel, { color: "#527A3A" }]}>Protein</Text>
              </View>
              <View style={[styles.macroInputWrapper, { backgroundColor: isDark ? colors.background : "#e2e6eb" }]}>
                <TextInput
                  style={[styles.macroInputCenter, { color: colors.text }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={isDark ? colors.textSub : "#a6b1c4"}
                  selectionColor="#66AE44"
                  value={protein}
                  onChangeText={setProtein}
                />
              </View>
              <Text style={[styles.macroUnit, { color: isDark ? colors.textSub : "#a6b1c4" }]}>g</Text>
            </View>

            <View style={[styles.macroCard, { backgroundColor: isDark ? colors.card : "#FFFFFF" }]}>
              <View style={styles.macroHeader}>
                <MaterialCommunityIcons name="corn" size={16} color="#2d3c59" />
                <Text style={[styles.macroLabel, { color: isDark ? "#A0B5E5" : "#2d3c59" }]}>Carbs</Text>
              </View>
              <View style={[styles.macroInputWrapper, { backgroundColor: isDark ? colors.background : "#e2e6eb" }]}>
                <TextInput
                  style={[styles.macroInputCenter, { color: colors.text }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={isDark ? colors.textSub : "#a6b1c4"}
                  selectionColor="#66AE44"
                  value={carbs}
                  onChangeText={setCarbs}
                />
              </View>
              <Text style={[styles.macroUnit, { color: isDark ? colors.textSub : "#a6b1c4" }]}>g</Text>
            </View>

            <View style={[styles.macroCard, { backgroundColor: isDark ? colors.card : "#FFFFFF" }]}>
              <View style={styles.macroHeader}>
                <MaterialCommunityIcons name="water" size={16} color="#d1855c" />
                <Text style={[styles.macroLabel, { color: "#d1855c" }]}>Fat</Text>
              </View>
              <View style={[styles.macroInputWrapper, { backgroundColor: isDark ? colors.background : "#e2e6eb" }]}>
                <TextInput
                  style={[styles.macroInputCenter, { color: colors.text }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={isDark ? colors.textSub : "#a6b1c4"}
                  selectionColor="#66AE44"
                  value={fat}
                  onChangeText={setFat}
                />
              </View>
              <Text style={[styles.macroUnit, { color: isDark ? colors.textSub : "#a6b1c4" }]}>g</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: isDark ? "#A0B5E5" : "#2d3c59", marginTop: 15 }]}>Micronutrients (Optional)</Text>
          
          <View style={styles.macroGrid}>
            {[
              { label: "Fiber", value: fiber, setter: setFiber, unit: "g" },
              { label: "Sugar", value: sugar, setter: setSugar, unit: "g" },
              { label: "Sodium", value: sodium, setter: setSodium, unit: "mg" },
              { label: "Potassium", value: potassium, setter: setPotassium, unit: "mg" },
              { label: "Cholesterol", value: cholesterol, setter: setCholesterol, unit: "mg" },
              { label: "Sat. Fat", value: saturatedFat, setter: setSaturatedFat, unit: "g" },
            ].map((micro, idx) => (
              <View key={idx} style={[styles.macroCard, { backgroundColor: isDark ? colors.card : "#FFFFFF" }]}>
                <View style={[styles.macroHeader, { justifyContent: 'center', width: '100%' }]}>
                  <Text style={[styles.macroLabel, { color: isDark ? "#A0B5E5" : "#527A3A", marginLeft: 0 }]}>{micro.label}</Text>
                </View>
                <View style={[styles.macroInputWrapper, { backgroundColor: isDark ? colors.background : "#e2e6eb" }]}>
                  <TextInput
                    style={[styles.macroInputCenter, { color: colors.text }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={isDark ? colors.textSub : "#a6b1c4"}
                    selectionColor="#66AE44"
                    value={micro.value}
                    onChangeText={micro.setter}
                  />
                </View>
                <Text style={[styles.macroUnit, { color: isDark ? colors.textSub : "#a6b1c4" }]}>{micro.unit}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave} 
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={styles.addIconCircle}>
                  <Ionicons name="add" size={24} color="#66AE44" />
                </View>
                <Text style={styles.saveButtonText}>Add Food</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: { padding: 5 },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    fontStyle: "italic",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  mainCard: {
    borderRadius: 20,
    padding: 20,
    paddingVertical: 25,
    marginBottom: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    height: "100%",
  },
  
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  macroCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    padding: 15,
    paddingVertical: 20,
    marginBottom: 15,
    alignItems: "center",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  macroHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  macroLabel: {
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 5,
  },
  macroInputWrapper: {
    width: "100%",
    height: 48,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  macroInputCenter: {
    minWidth: 60,
    height: "100%",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 20,
    fontWeight: "bold",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  macroUnit: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 8,
  },

  saveButton: {
    backgroundColor: "#66AE44",
    borderRadius: 15,
    height: 60,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addIconCircle: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
