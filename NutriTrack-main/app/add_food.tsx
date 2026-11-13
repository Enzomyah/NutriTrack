import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NotificationModal from "../components/NotificationModal";
import { MealType, useFoodLog } from "../context/FoodLogContext";
import { useNotifications } from "../context/NotificationContext";
import { useDate } from "../context/DateContext";
import { useAppTheme } from "../context/ThemeContext";
import CalendarModal from "../components/CalendarModal";
import { FoodItem, getTag, searchFoods, EMPTY_MICRONUTRIENTS } from "../services/usdaApi";


interface FoodCardProps {
  item: FoodItem;
  meal: MealType;
}

function FoodCard({ item, meal }: FoodCardProps) {
  const { logFood } = useFoodLog();
  const { colors, isDark } = useAppTheme();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState("100");
  const [unit, setUnit] = useState<"g" | "mL" | "oz" | "cup">("g");
  const tag = getTag(item);


  const getGrams = () => {
    const val = parseFloat(quantity) || 0;
    if (unit === "oz") return val * 28.35;
    if (unit === "cup") return val * 240;
    return val;
  };

  const scale = (val: number) => {
    const grams = getGrams();
    return Math.round((val * grams) / 100);
  };

  const scaledItem = {
    ...item,
    calories: scale(item.calories),
    protein: scale(item.protein),
    carbs: scale(item.carbs),
    fat: scale(item.fat),
    servingSize: `${quantity}${unit}`,
    micronutrients: (item.micronutrients || EMPTY_MICRONUTRIENTS) ? {
      fiber: Math.round((item.micronutrients || EMPTY_MICRONUTRIENTS).fiber * (getGrams() / 100) * 10) / 10,
      sugar: Math.round((item.micronutrients || EMPTY_MICRONUTRIENTS).sugar * (getGrams() / 100) * 10) / 10,
      sodium: Math.round((item.micronutrients || EMPTY_MICRONUTRIENTS).sodium * (getGrams() / 100) * 10) / 10,
      potassium: Math.round((item.micronutrients || EMPTY_MICRONUTRIENTS).potassium * (getGrams() / 100) * 10) / 10,
      cholesterol: Math.round((item.micronutrients || EMPTY_MICRONUTRIENTS).cholesterol * (getGrams() / 100) * 10) / 10,
      saturatedFat: Math.round((item.micronutrients || EMPTY_MICRONUTRIENTS).saturatedFat * (getGrams() / 100) * 10) / 10,
    } : EMPTY_MICRONUTRIENTS,
  };

  const handleAdd = () => {
   
    const validRegex = /^\d+(\.\d+)?$/;
    if (!validRegex.test(quantity)) {
      Alert.alert("Invalid Quantity", "Please enter a valid number without spaces.");
      return;
    }

    const grams = getGrams();
    if (grams <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a quantity greater than 0.");
      return;
    }


    logFood(meal, {
      ...scaledItem,
      baseCalories: item.calories,
      baseProtein: item.protein,
      baseCarbs: item.carbs,
      baseFat: item.fat,
    } as any);

    setAdded(true);
    if (Platform.OS === "android") {
      ToastAndroid.show(`${scaledItem.name} (${quantity}${unit}) added!`, ToastAndroid.SHORT);
    } else {
      Alert.alert("Added!", `${scaledItem.name} logged to ${meal}`);
    }
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardTitleRow}>
        <View style={styles.cardTitleLeft}>
          <View style={styles.nameWithVerified}>
            <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
            {item.fdcId > 0 && (
              <Ionicons name="checkmark-circle" size={18} color="#4285F4" style={styles.verifiedIcon} />
            )}
          </View>
          <View style={styles.tagRow}>
            <View style={[styles.tagContainer, { backgroundColor: tag.color + "20" }]}>
              <Text style={[styles.tagText, { color: tag.color }]}>{tag.text}</Text>
            </View>
            {item.micronutrients && item.micronutrients.sodium > 400 && (
              <View style={[styles.tagContainer, { backgroundColor: "#FFF3E0", marginLeft: 8 }]}>
                <View style={styles.sodiumHeader}>
                  <Ionicons name="warning-outline" size={12} color="#E65100" style={{ marginRight: 4 }} />
                  <Text style={[styles.tagText, { color: "#E65100" }]}>High Sodium</Text>
                </View>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.addButton, added && styles.addButtonAdded]}
          onPress={handleAdd}
          disabled={added}
        >
          <Ionicons name={added ? "checkmark" : "add"} size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Quantity & Unit Selection */}
      <View style={styles.portionRow}>
        <View style={[styles.quantityInputContainer, { backgroundColor: isDark ? colors.background : "#FFFFFF", borderColor: isDark ? colors.border : "#66AE44" }]}>
          <Text style={[styles.inputLabel, { color: isDark ? colors.textSub : "#66AE44" }]}>Qty</Text>
          <TextInput
            style={[styles.quantityInput, { backgroundColor: "transparent", color: colors.text }]}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textSub}
          />
        </View>
        <View style={styles.unitToggleContainer}>
          {(["g", "mL", "oz", "cup"] as const).map((u) => (
            <TouchableOpacity
              key={u}
              style={[
                styles.unitButton, 
                unit === u && styles.unitButtonActive,
                !isDark && unit !== u && { backgroundColor: "#E8F0E5" },
                isDark && unit !== u && { backgroundColor: colors.background }
              ]}
              onPress={() => setUnit(u)}
            >
              <Text style={[
                styles.unitButtonText, 
                unit === u && styles.unitButtonTextActive,
                !isDark && unit !== u && { color: "#66AE44" },
                isDark && unit !== u && { color: colors.textSub }
              ]}>
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.macroRow}>
        <View style={[styles.macroBox, { borderColor: "#D67A52" + "40", backgroundColor: isDark ? colors.background : "#FFFFFF" }]}>
          <Text style={[styles.macroLabel, { color: "#D67A52" }]} numberOfLines={1} adjustsFontSizeToFit>Calories</Text>
          <Text style={[styles.macroValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{scaledItem.calories}</Text>
        </View>
        <View style={[styles.macroBox, { borderColor: "#6BAE45" + "40", backgroundColor: isDark ? colors.background : "#FFFFFF" }]}>
          <Text style={[styles.macroLabel, { color: "#6BAE45" }]} numberOfLines={1} adjustsFontSizeToFit>Pro</Text>
          <Text style={[styles.macroValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{scaledItem.protein}g</Text>
        </View>
        <View style={[styles.macroBox, { borderColor: "#2D3C59" + "40", backgroundColor: isDark ? colors.background : "#FFFFFF" }]}>
          <Text style={[styles.macroLabel, { color: isDark ? "#A0B5E5" : "#2D3C59" }]} numberOfLines={1} adjustsFontSizeToFit>Carb</Text>
          <Text style={[styles.macroValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{scaledItem.carbs}g</Text>
        </View>
        <View style={[styles.macroBox, { borderColor: "#D1855C" + "40", backgroundColor: isDark ? colors.background : "#FFFFFF" }]}>
          <Text style={[styles.macroLabel, { color: "#D1855C" }]} numberOfLines={1} adjustsFontSizeToFit>Fat</Text>
          <Text style={[styles.macroValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{scaledItem.fat}g</Text>
        </View>
      </View>
    </View>
  );
}


export default function AddFoodScreen() {
  const router = useRouter();
  const { meal } = useLocalSearchParams<{ meal: string }>();
  const { logFood } = useFoodLog();
  const { unreadCount } = useNotifications();
  const { colors } = useAppTheme();
  const { displayDate, prevDate, nextDate, isToday } = useDate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [activeTab, setActiveTab] = useState<MealType>(
    (meal && ["Breakfast", "Lunch", "Dinner", "Snacks"].includes(meal as MealType))
      ? meal as MealType
      : "Breakfast"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const { recentFoods } = useFoodLog();
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabs: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults(recentFoods);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const foods = await searchFoods(query);
      setResults(foods.length > 0 ? foods : []);
      if (foods.length === 0) setError(`No results found for "${query}"`);
    } catch (e) {
      setError("Failed to fetch results. Check your connection.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [recentFoods]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => doSearch(searchQuery), 500);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchQuery, doSearch]);

  const sectionLabel = searchQuery.trim() ? "Search Results" : "Recent & Popular";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.header} />

      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: colors.header }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonCenter}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
            <Image source={require("../assets/images/NutriTrackLOGO.png")} style={{ width: 35, height: 35, marginRight: 8 }} resizeMode="contain" />
          </TouchableOpacity>
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

        {/* Meal Category Tabs */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Adding to:</Text>
        <View style={styles.tabsRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Bar */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Search Food</Text>
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={22} color={colors.textSub} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="e.g. chicken breast, oats..."
            placeholderTextColor={colors.textSub}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#A0A9B5" />
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>{sectionLabel}</Text>
          <TouchableOpacity onPress={() => router.push({ pathname: "/create_food", params: { meal: activeTab } })} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
            <Ionicons name="add-circle" size={18} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: 'bold', marginLeft: 4, fontSize: 13 }}>Custom Food</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.stateText, { color: colors.textSub }]}>Searching USDA database...</Text>
          </View>
        )}

        {!isLoading && error && (
          <View style={styles.centerState}>
            <Ionicons name="search-outline" size={40} color={colors.textSub} />
            <Text style={[styles.stateText, { color: colors.textSub }]}>{error}</Text>
          </View>
        )}

        {!isLoading && !error && (
          results.length > 0 ? (
            results.map((item) => (
              <FoodCard key={item.fdcId} item={item} meal={activeTab} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name={searchQuery.trim() ? "search-outline" : "time-outline"}
                size={60}
                color={colors.textSub}
              />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>
                {searchQuery.trim()
                  ? `No results found for "${searchQuery}"`
                  : "Your recently logged foods will appear here.\nStart searching to build your list!"}
              </Text>
            </View>
          )
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#DADBDB" },

  headerRow: {
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
  headerLeft: { flexDirection: "row", alignItems: "center" },
  backButtonCenter: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  headerTitle: {
    color: "#6BAE45",
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60, marginTop: 20 },

  sectionTitle: {
    color: "#6BAE45",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  tabButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 4,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: { backgroundColor: "#6BAE45" },
  tabButtonText: { color: "#2D3C59", fontWeight: "700", fontSize: 14, textAlign: "center" },
  tabButtonTextActive: { color: "#FFFFFF", fontWeight: "700" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 60,
    marginBottom: 30,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: "#2D3C59" },

  centerState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  stateText: { fontSize: 15, color: "#8A97A8", textAlign: "center" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  cardTitleLeft: {
    flex: 1,
    marginRight: 12
  },
  foodName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2D3C59",
    flex: 1,
  },
  nameWithVerified: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
    gap: 4,
  },
  verifiedIcon: {
    marginLeft: 0,
    marginTop: 0,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sodiumHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagContainer: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  tagText: {
    fontSize: 11,
    fontWeight: "bold"
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6BAE45",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6BAE45",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  addButtonAdded: {
    backgroundColor: "#2D3C59"
  },
  servingText: {
    fontSize: 13,
    color: "#A0A9B5",
    marginTop: 4,
    marginBottom: 14
  },

  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  macroBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    marginHorizontal: 3,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  macroLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  macroValue: { fontSize: 16, fontWeight: "bold", color: "#2D3C59" },

  // Portion Control
  portionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Center the whole row
    paddingVertical: 10,
    marginBottom: 10,
  },
  quantityInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#66AE44",
    paddingHorizontal: 10,
    height: 40,
    width: 110, // Fixed width
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#66AE44",
    marginRight: 6,
  },
  quantityInput: {
    flex: 1,
    fontSize: 17,
    color: "#2D3C59",
    fontWeight: "800",
    textAlign: "center",
    padding: 0,
  },
  unitToggleContainer: {
    flexDirection: "row",
    marginLeft: 12,
    gap: 4,
  },
  unitButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#E8F0E5",
    minWidth: 38,
    alignItems: "center",
  },
  unitButtonActive: {
    backgroundColor: "#66AE44",
  },
  unitButtonText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#66AE44",
  },
  unitButtonTextActive: {
    color: "#FFFFFF",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: "center",
    color: "#9E9E9E",
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
  },
});
