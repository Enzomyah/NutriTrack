// USDA FoodData Central API service
const USDA_API_KEY = "nl7RuhtJCjortJwDvKO8sRZHyEW1rHWvo4grXS89";
const BASE_URL = "https://api.nal.usda.gov/fdc/v1";

export interface FoodItem {
  fdcId: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  dataType: string;
  micronutrients?: {
    fiber: number;
    sugar: number;
    sodium: number;
    potassium: number;
    cholesterol: number;
    saturatedFat: number;
  };
}

function getNutrient(nutrients: any[], id: number): number {
  const n = nutrients.find((n: any) => n.nutrientId === id || n.nutrientNumber === String(id));
  return n ? Math.round(n.value * 10) / 10 : 0;
}

export const EMPTY_MICRONUTRIENTS = {
  fiber: 0,
  sugar: 0,
  sodium: 0,
  potassium: 0,
  cholesterol: 0,
  saturatedFat: 0,
};

export function getTag(item: FoodItem): { text: string; color: string } {
  if (item.protein >= 20) return { text: "Protein", color: "#6BAE45" };
  if (item.carbs >= 30) return { text: "Carbs", color: "#8AB75A" };
  if (item.fat >= 15) return { text: "Fat", color: "#D1855C" };
  return { text: "Balanced", color: "#2D3C59" };
}

export function getNutrientSummary(item: FoodItem): string {
  const micros = item.micronutrients;
  if (!micros) return "Micronutrient data is currently unavailable for this food item.";
  
  const hasValues = Object.values(micros).some(val => val > 0);
  if (!hasValues) return "No detailed micronutrient data was found in the database for this item.";

  let highlights = [];
  if (micros.sodium > 400) highlights.push("high in sodium");
  if (micros.sugar > 15) highlights.push("high in sugar");
  if (micros.saturatedFat > 5) highlights.push("high in saturated fat");
  if (micros.fiber > 5) highlights.push("high in fiber");
  
  if (highlights.length === 0) return "This food has a balanced micronutrient profile based on available data.";
  
  return `This food is ${highlights.join(", ")}.`;
}

import { searchCommunityFoods } from "./communityFoods";

export async function searchFoods(query: string): Promise<FoodItem[]> {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();

  // 1. Search Firebase Community Foods first
  const communityResults = await searchCommunityFoods(query);

  // 2. Search USDA Database
  const url = `${BASE_URL}/foods/search?query=${encodeURIComponent(query)}&pageSize=15&api_key=${USDA_API_KEY}`;

  let usdaFoods: FoodItem[] = [];
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`USDA API error: ${response.status}`);

    const data = await response.json();
    usdaFoods = (data.foods ?? []).map((food: any) => {
      const nutrients = food.foodNutrients ?? [];
      return {
        fdcId: food.fdcId,
        name: food.description,
        calories: getNutrient(nutrients, 1008),
        protein: getNutrient(nutrients, 1003),
        carbs: getNutrient(nutrients, 1005),
        fat: getNutrient(nutrients, 1004),
        servingSize: food.servingSize
          ? `${food.servingSize}${food.servingSizeUnit ?? "g"} serving`
          : "100g serving",
        dataType: food.dataType ?? "",
        micronutrients: {
          fiber: getNutrient(nutrients, 1079),
          sugar: getNutrient(nutrients, 2000),
          sodium: getNutrient(nutrients, 1093),
          potassium: getNutrient(nutrients, 1092),
          cholesterol: getNutrient(nutrients, 1253),
          saturatedFat: getNutrient(nutrients, 1258),
        },
      };
    });
  } catch (err) {
    console.log("Failed to fetch USDA data, returning local only: ", err);
  }

  // Combine results: Community matches first, followed by USDA results
  return [...communityResults, ...usdaFoods];
}
