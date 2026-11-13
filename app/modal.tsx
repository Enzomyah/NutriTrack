import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useFoodLog, MealType, LoggedFoodItem } from '../context/FoodLogContext';
import { useAppTheme } from '../context/ThemeContext';

// Reusable component for a single food item
interface FoodItemProps {
  item: LoggedFoodItem;
  onDelete: () => void;
  isEditing: boolean;
  onStartEdit: () => void;
  editQty: string;
  setEditQty: (val: string) => void;
  editUnit: "g" | "mL" | "oz" | "cup";
  setEditUnit: (val: "g" | "mL" | "oz" | "cup") => void;
  onSave: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

import { getNutrientSummary } from '../services/usdaApi';

const FoodItem: React.FC<FoodItemProps> = ({ 
  item, onDelete, isEditing, onStartEdit, 
  editQty, setEditQty, editUnit, setEditUnit, onSave,
  isExpanded, onToggleExpand
}) => {
  const { colors, isDark } = useAppTheme();
  const summary = getNutrientSummary(item);
  return (
    <View style={[styles.foodItemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
      <TouchableOpacity 
        onPress={onToggleExpand} 
        activeOpacity={0.7}
        style={styles.foodItemHeader}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.nameWithVerified}>
            <Text style={[styles.foodName, { color: colors.text }]}>{item.name}</Text>
            {item.fdcId > 0 && (
              <Ionicons name="checkmark-circle" size={16} color="#4285F4" style={{ marginLeft: 4 }} />
            )}
          </View>
          <View style={styles.tagRow}>
            <Text style={[styles.servingInfoText, { color: colors.textSub }]}>{item.servingSize}</Text>
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {!isEditing && (
            <TouchableOpacity onPress={onStartEdit} style={[styles.editIconBtn, { backgroundColor: isDark ? 'rgba(107,174,69,0.1)' : '#F4F9F5' }]}>
              <Ionicons name="create-outline" size={18} color="#6BAE45" />
            </TouchableOpacity>
          )}
          {!isEditing && (
            <TouchableOpacity onPress={onDelete} style={[styles.deleteButton, { backgroundColor: isDark ? 'rgba(255,107,107,0.1)' : '#FFF5F5' }]}>
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {isEditing ? (
        <View style={[styles.editContainer, { backgroundColor: colors.background }]}>
          <View style={styles.portionRow}>
            <View style={[styles.quantityInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.textSub }]}>Qty</Text>
              <TextInput
                style={[styles.quantityInput, { color: colors.text }]}
                value={editQty}
                onChangeText={setEditQty}
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <View style={styles.unitToggleContainer}>
              {(["g", "mL", "oz", "cup"] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitButton, { backgroundColor: colors.card, borderColor: colors.border }, editUnit === u && styles.unitButtonActive]}
                  onPress={() => setEditUnit(u)}
                >
                  <Text style={[styles.unitButtonText, { color: colors.textSub }, editUnit === u && styles.unitButtonTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.editButtonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onStartEdit}>
              <Ionicons name="close" size={20} color={colors.textSub} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.macroRow}>
            <View style={[styles.macroBox, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[styles.macroValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{Math.round(item.calories)}</Text>
              <Text style={[styles.macroLabel, { color: "#D67A52" }]} numberOfLines={1} adjustsFontSizeToFit>Calories</Text>
            </View>
            <View style={[styles.macroBox, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[styles.macroValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{item.protein}g</Text>
              <Text style={[styles.macroLabel, { color: "#6BAE45" }]} numberOfLines={1} adjustsFontSizeToFit>Pro</Text>
            </View>
            <View style={[styles.macroBox, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[styles.macroValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{item.carbs}g</Text>
              <Text style={[styles.macroLabel, { color: isDark ? "#A0B5E5" : "#2D3C59" }]} numberOfLines={1} adjustsFontSizeToFit>Carb</Text>
            </View>
            <View style={[styles.macroBox, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[styles.macroValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{item.fat}g</Text>
              <Text style={[styles.macroLabel, { color: "#D1855C" }]} numberOfLines={1} adjustsFontSizeToFit>Fat</Text>
            </View>
          </View>

          {isExpanded && (
            <View style={[styles.microSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.microTitle, { color: colors.primary }]}>Micro-nutrients</Text>
              
              {item.micronutrients && Object.values(item.micronutrients).some(v => v > 0) ? (
                <View style={styles.microGrid}>
                  {[
                    { label: "Fiber", value: `${item.micronutrients.fiber}g` },
                    { label: "Sugar", value: `${item.micronutrients.sugar}g` },
                    { label: "Sodium", value: `${item.micronutrients.sodium}mg` },
                    { label: "Potassium", value: `${item.micronutrients.potassium}mg` },
                    { label: "Cholesterol", value: `${item.micronutrients.cholesterol}mg` },
                    { label: "Saturated Fat", value: `${item.micronutrients.saturatedFat}g` },
                  ].map((micro, idx) => (
                    <View key={idx} style={styles.microItem}>
                      <Text style={[styles.microLabelText, { color: colors.textSub }]}>{micro.label}</Text>
                      <Text style={[styles.microValueText, { color: colors.text }]}>{micro.value}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={[styles.summaryBox, { backgroundColor: isDark ? 'rgba(107,174,69,0.1)' : '#F4F9F5' }]}>
                <Ionicons name="information-circle-outline" size={16} color="#6BAE45" style={{ marginRight: 8 }} />
                <Text style={[styles.summaryText, { color: colors.text }]}>{summary}</Text>
              </View>

              <Text style={[styles.disclaimerText, { color: colors.textSub }]}>
                * Data source: USDA FoodData Central. Results may be incomplete for some items.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};



export default function ModalScreen() {
  const router = useRouter();
  const { meal } = useLocalSearchParams<{ meal: string }>();
  const { foodLog, removeFood, updateFood } = useFoodLog();
  const { colors } = useAppTheme();

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [editQty, setEditQty] = React.useState("");
  const [editUnit, setEditUnit] = React.useState<"g" | "mL" | "oz" | "cup">("g");

  const selectedMeal = (meal as MealType) || "Breakfast";
  const items = foodLog[selectedMeal] || [];
  const totalCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);

  return (
    <View style={styles.container}>
      {/* Background overlay */}
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={() => router.back()} 
      />

      <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Ionicons name="calendar-outline" size={24} color="#6BAE45" />
            </View>
            <Text style={styles.modalTitle}>{selectedMeal} Details</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#8A97A8" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Food Items List */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {items.length > 0 ? (
            items.map((item, index) => {
              const isEditing = editingId === item.logId;
              
              const startEdit = () => {
                if (isEditing) {
                  setEditingId(null);
                } else {
                  setEditingId(item.logId);
                  // Extract qty/unit from servingSize (e.g. "100g")
                  const match = item.servingSize.match(/^(\d+)(.*)$/);
                  setEditQty(match ? match[1] : "100");
                  setEditUnit(match ? (match[2] as any) : "g");
                }
              };

              const handleSave = () => {
                updateFood(selectedMeal, item.logId, editQty, editUnit);
                setEditingId(null);
              };

              return (
                <FoodItem 
                  key={`${item.fdcId}-${item.logId}-${index}`}
                  item={item}
                  onDelete={() => removeFood(selectedMeal, item.logId)}
                  isEditing={isEditing}
                  onStartEdit={startEdit}
                  editQty={editQty}
                  setEditQty={setEditQty}
                  editUnit={editUnit}
                  setEditUnit={setEditUnit}
                  onSave={handleSave}
                  isExpanded={expandedId === item.logId}
                  onToggleExpand={() => setExpandedId(expandedId === item.logId ? null : item.logId)}
                />
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="nutrition-outline" size={60} color="#EAECEF" />
              <Text style={styles.emptyText}>No items logged for {selectedMeal} yet.</Text>
            </View>
          )}
        </ScrollView>

        {/* Total Footer Area */}
        <View style={[styles.totalRow, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
          <Text style={styles.totalValue}>{Math.round(totalCalories)} calories</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/add_food")}>
            <Text style={styles.primaryButtonText}>Add More Items</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    height: '85%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#F4F9F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6BAE45',
  },
  closeButton: {
    padding: 5,
  },

  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#A0A9B5',
    textAlign: 'center',
  },

  foodItemCard: {
    backgroundColor: '#F9FAFC',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  foodName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3C59',
  },
  nameWithVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tagContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sodiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 11,
    color: '#A0A9B5',
    fontWeight: '600',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3C59',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6BAE45',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    flex: 2,
    backgroundColor: '#6BAE45',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#6BAE45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#EAECEF',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0, // Reset any margin
  },
  secondaryButtonText: {
    color: '#2D3C59',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Inline Editor Styles
  editContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginTop: 5,
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAECEF',
    paddingHorizontal: 10,
    height: 45,
    width: 100,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8A97A8',
    marginRight: 6,
  },
  quantityInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3C59',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  unitToggleContainer: {
    flexDirection: 'row',
    marginLeft: 10,
    gap: 4,
    flex: 1,
    justifyContent: 'space-between',
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#F9FAFC',
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  unitButtonActive: {
    backgroundColor: '#6BAE45',
    borderColor: '#6BAE45',
  },
  unitButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8A97A8',
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },
  editButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6BAE45',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    padding: 10,
    backgroundColor: '#F9FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  editIconBtn: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  servingInfoText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  microSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EAECEF',
  },
  microTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  microGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 15,
  },
  microItem: {
    width: '47%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  microLabelText: {
    fontSize: 11,
    fontWeight: '500',
  },
  microValueText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  summaryText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  disclaimerText: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 15,
    textAlign: 'center',
    opacity: 0.8,
  },
});
