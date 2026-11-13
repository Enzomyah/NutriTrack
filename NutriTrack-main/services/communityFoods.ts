import { collection, addDoc, getDocs, query, where, limit, serverTimestamp, writeBatch, doc as firestoreDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FoodItem } from "./usdaApi";

/**
 * Generates an array of words from a string to be used for search indexing (lowercase).
 */
function generateKeywords(name: string): string[] {
  if (!name) return [];
  const lowerName = name.toLowerCase();
  const words = lowerName.split(/[\s,.-]+/).filter(word => word.length > 0);
  
  // We can also add prefixes for better partial matches (optional)
  // For now, let's just use the words
  return Array.from(new Set(words));
}

export async function saveCommunityFood(food: Omit<FoodItem, "fdcId">) {
  try {
    const customFoodRef = collection(db, "customFoods");
    const keywords = generateKeywords(food.name);
    
    await addDoc(customFoodRef, {
      ...food,
      nameLower: food.name.toLowerCase(),
      keywords: keywords,
      createdAt: serverTimestamp(),
      fdcId: -Math.floor(Math.random() * 1000000) // Generate negative random ID for UI uniqueness
    });
    return true;
  } catch (error) {
    console.error("Error saving custom food to Firebase", error);
    return false;
  }
}

export async function searchCommunityFoods(searchQuery: string): Promise<FoodItem[]> {
  if (!searchQuery.trim()) return [];
  
  try {
    const lowerQuery = searchQuery.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 0);
    
    if (queryWords.length === 0) return [];

    // Use array-contains-any with keywords (up to 10 words supported by Firestore)
    const q = query(
      collection(db, "customFoods"),
      where("keywords", "array-contains-any", queryWords.slice(0, 10)),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    const results: FoodItem[] = [];

    /** 
     * Generates a stable numeric hash from a string.
     * We use this to convert Firestore string IDs to stable negative numbers for fdcId.
     */
    const getStableNumericId = (id: string) => {
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return -Math.abs(hash % 100000000); // Stable negative ID
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        fdcId: data.fdcId || getStableNumericId(doc.id),
        name: data.name,
        calories: Number(data.calories) || 0,
        protein: Number(data.protein) || 0,
        carbs: Number(data.carbs) || 0,
        fat: Number(data.fat) || 0,
        servingSize: data.servingSize || "100g",
        dataType: data.dataType || "Community Food",
        micronutrients: data.micronutrients || undefined
      });
    });
    return results;
  } catch (error) {
    console.error("Error searching custom foods", error);
    return [];
  }
}

