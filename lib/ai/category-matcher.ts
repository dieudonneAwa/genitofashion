import type { Category } from "@/types/database";
import type { VisionAnalysisResult } from "./vision";

/**
 * Map product types to category keywords
 */
const categoryKeywords: Record<string, string[]> = {
  clothes: [
    "clothing",
    "apparel",
    "garment",
    "shirt",
    "t-shirt",
    "t shirt",
    "blouse",
    "dress",
    "pants",
    "jeans",
    "trousers",
    "shorts",
    "skirt",
    "jacket",
    "coat",
    "sweater",
    "hoodie",
    "sweatshirt",
    "top",
    "outfit",
    "fashion",
    "wear",
  ],
  shoes: [
    "shoe",
    "sneaker",
    "boot",
    "sandal",
    "heel",
    "slipper",
    "footwear",
    "trainer",
    "running shoe",
    "high heel",
    "flat",
  ],
  accessories: [
    "bag",
    "handbag",
    "purse",
    "wallet",
    "belt",
    "watch",
    "jewelry",
    "necklace",
    "bracelet",
    "ring",
    "earring",
    "accessory",
    "hat",
    "cap",
    "scarf",
    "gloves",
    "sunglasses",
  ],
};

/**
 * Match Vision API results to product categories
 * @param visionResults - Results from Google Vision API
 * @param categories - Available categories from database
 * @returns Best matching category with confidence score
 */
export function matchCategory(
  visionResults: VisionAnalysisResult,
  categories: Category[]
): { category: Category | null; confidence: number; alternatives: Category[] } {
  // Combine all detected labels and objects
  const allTerms = [
    ...visionResults.labels.map((l) => l.description.toLowerCase()),
    ...visionResults.objects.map((o) => o.name.toLowerCase()),
  ];

  // Score each category
  const categoryScores: Array<{ category: Category; score: number }> = [];

  for (const category of categories) {
    const categorySlug = category.slug.toLowerCase();
    const keywords = categoryKeywords[categorySlug] || [];

    let score = 0;
    let matches = 0;

    // Check if any detected terms match category keywords
    for (const term of allTerms) {
      for (const keyword of keywords) {
        if (term.includes(keyword) || keyword.includes(term)) {
          // Higher score for exact matches
          const matchScore = term === keyword ? 1.0 : 0.7;
          score += matchScore;
          matches++;
        }
      }
    }

    // Also check category name and slug
    const categoryName = category.name.toLowerCase();
    for (const term of allTerms) {
      if (term.includes(categoryName) || categoryName.includes(term)) {
        score += 0.5;
        matches++;
      }
    }

    // Normalize score (0-1 range)
    const normalizedScore = matches > 0 ? Math.min(score / (matches * 1.0), 1.0) : 0;

    if (normalizedScore > 0) {
      categoryScores.push({ category, score: normalizedScore });
    }
  }

  // Sort by score (highest first)
  categoryScores.sort((a, b) => b.score - a.score);

  // Return best match
  const bestMatch = categoryScores[0];

  if (!bestMatch || bestMatch.score < 0.3) {
    // Low confidence - return null
    return {
      category: null,
      confidence: 0,
      alternatives: categoryScores.slice(0, 3).map((s) => s.category),
    };
  }

  return {
    category: bestMatch.category,
    confidence: bestMatch.score,
    alternatives: categoryScores.slice(1, 4).map((s) => s.category),
  };
}

