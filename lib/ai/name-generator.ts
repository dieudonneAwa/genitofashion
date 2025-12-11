import type { VisionAnalysisResult } from "./vision";
import { rgbToColorName } from "./vision";

/**
 * Category keywords for fashion items (matching category-matcher.ts)
 */
const categoryKeywords: Record<string, string[]> = {
  clothing: [
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
  perfumes: ["perfume", "cologne", "fragrance", "scent", "bottle"],
};

/**
 * Non-fashion items to filter out
 */
const nonFashionKeywords = [
  "cartoon",
  "illustration",
  "drawing",
  "graphic",
  "logo",
  "text",
  "letter",
  "word",
  "sign",
  "label",
  "brand",
  "trademark",
  "symbol",
  "icon",
  "emblem",
  "background",
  "surface",
  "table",
  "floor",
  "wall",
  "paper",
  "cardboard",
  "box",
  "packaging",
  "container",
];

/**
 * Identify fashion items from vision results and return the most prominent one
 */
export function identifyMainFashionItem(visionResults: VisionAnalysisResult): {
  item: string;
  confidence: number;
  category: string | null;
} | null {
  // Combine labels and objects with their scores
  const fashionItems: Array<{
    name: string;
    score: number;
    category: string | null;
  }> = [];

  // Check all labels
  for (const label of visionResults.labels) {
    const term = label.description.toLowerCase();

    // Skip non-fashion items
    if (nonFashionKeywords.some((keyword) => term.includes(keyword))) {
      continue;
    }

    // Check which category this item belongs to
    let matchedCategory: string | null = null;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (term.includes(keyword) || keyword.includes(term)) {
          matchedCategory = category;
          break;
        }
      }
      if (matchedCategory) break;
    }

    // If it matches a fashion category, add it
    if (matchedCategory) {
      fashionItems.push({
        name: label.description,
        score: label.score || 0.5,
        category: matchedCategory,
      });
    }
  }

  // Check all objects (objects are usually more specific and reliable)
  for (const obj of visionResults.objects) {
    const term = obj.name.toLowerCase();

    // Skip non-fashion items
    if (nonFashionKeywords.some((keyword) => term.includes(keyword))) {
      continue;
    }

    // Check which category this item belongs to
    let matchedCategory: string | null = null;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (term.includes(keyword) || keyword.includes(term)) {
          matchedCategory = category;
          break;
        }
      }
      if (matchedCategory) break;
    }

    // If it matches a fashion category, add it (objects get higher priority)
    if (matchedCategory) {
      fashionItems.push({
        name: obj.name,
        score: (obj.score || 0.5) * 1.2, // Boost object scores
        category: matchedCategory,
      });
    }
  }

  // If no fashion items found, return null
  if (fashionItems.length === 0) {
    return null;
  }

  // Sort by score (highest first) and return the most prominent
  fashionItems.sort((a, b) => b.score - a.score);

  return {
    item: fashionItems[0].name,
    confidence: fashionItems[0].score,
    category: fashionItems[0].category,
  };
}

/**
 * Extract product type from Vision API results
 * Prioritizes fashion items that match existing categories
 */
function extractProductType(visionResults: VisionAnalysisResult): string {
  // First, try to identify the main fashion item
  const mainFashionItem = identifyMainFashionItem(visionResults);

  if (mainFashionItem) {
    // Capitalize first letter and return
    return (
      mainFashionItem.item.charAt(0).toUpperCase() +
      mainFashionItem.item.slice(1)
    );
  }

  // Fallback: Look for product type in labels and objects
  const allTerms = [
    ...visionResults.labels.map((l) => ({
      term: l.description,
      score: l.score || 0.5,
    })),
    ...visionResults.objects.map((o) => ({
      term: o.name,
      score: (o.score || 0.5) * 1.2,
    })),
  ];

  // Sort by score (highest first)
  allTerms.sort((a, b) => b.score - a.score);

  // Common product types (prioritize these)
  const productTypes = [
    "jeans",
    "pants",
    "trousers",
    "shirt",
    "t-shirt",
    "t shirt",
    "blouse",
    "dress",
    "skirt",
    "jacket",
    "coat",
    "sweater",
    "hoodie",
    "shoes",
    "sneakers",
    "boots",
    "handbag",
    "bag",
    "wallet",
    "belt",
    "watch",
    "accessories",
  ];

  // Find matching product type (checking highest confidence items first)
  for (const { term } of allTerms) {
    const lowerTerm = term.toLowerCase();

    // Skip non-fashion items
    if (nonFashionKeywords.some((keyword) => lowerTerm.includes(keyword))) {
      continue;
    }

    for (const productType of productTypes) {
      if (lowerTerm.includes(productType) || productType.includes(lowerTerm)) {
        // Capitalize first letter
        return productType.charAt(0).toUpperCase() + productType.slice(1);
      }
    }
  }

  // Fallback: use first high-confidence label (excluding non-fashion items)
  for (const { term } of allTerms) {
    const lowerTerm = term.toLowerCase();
    if (!nonFashionKeywords.some((keyword) => lowerTerm.includes(keyword))) {
      return term.charAt(0).toUpperCase() + term.slice(1);
    }
  }

  return "Product";
}

/**
 * Extract material from Vision API results
 * Comprehensive material detection with priority ordering
 */
function extractMaterial(visionResults: VisionAnalysisResult): string | null {
  // Expanded material list with common variations and synonyms
  const materials = [
    // Natural materials
    {
      keywords: [
        "leather",
        "genuine leather",
        "real leather",
        "cowhide",
        "calfskin",
      ],
      name: "Leather",
    },
    { keywords: ["cotton", "cotton fabric", "cotton blend"], name: "Cotton" },
    {
      keywords: ["wool", "woolen", "woollen", "merino", "cashmere"],
      name: "Wool",
    },
    { keywords: ["silk", "silk fabric"], name: "Silk" },
    { keywords: ["linen", "linen fabric"], name: "Linen" },
    { keywords: ["denim", "jean", "jeans fabric"], name: "Denim" },
    { keywords: ["canvas", "canvas fabric"], name: "Canvas" },
    { keywords: ["suede", "suede leather"], name: "Suede" },
    {
      keywords: ["faux leather", "vegan leather", "synthetic leather"],
      name: "Faux Leather",
    },
    { keywords: ["mesh", "mesh fabric"], name: "Mesh" },
    { keywords: ["knit", "knitted", "knit fabric"], name: "Knit" },
    { keywords: ["jersey", "jersey fabric"], name: "Jersey" },
    { keywords: ["chiffon", "chiffon fabric"], name: "Chiffon" },
    { keywords: ["satin", "satin fabric"], name: "Satin" },
    { keywords: ["velvet", "velvet fabric"], name: "Velvet" },
    { keywords: ["corduroy", "corduroy fabric"], name: "Corduroy" },
    { keywords: ["tweed", "tweed fabric"], name: "Tweed" },
    { keywords: ["twill", "twill fabric"], name: "Twill" },
    { keywords: ["bamboo", "bamboo fabric"], name: "Bamboo" },
    { keywords: ["hemp", "hemp fabric"], name: "Hemp" },

    // Synthetic materials
    { keywords: ["polyester", "polyester fabric"], name: "Polyester" },
    { keywords: ["nylon", "nylon fabric"], name: "Nylon" },
    { keywords: ["spandex", "elastane", "lycra"], name: "Spandex" },
    { keywords: ["acrylic", "acrylic fabric"], name: "Acrylic" },
    { keywords: ["polyurethane", "pu leather"], name: "Polyurethane" },
    { keywords: ["polyamide"], name: "Polyamide" },
    {
      keywords: ["synthetic", "synthetic fabric", "synthetic material"],
      name: "Synthetic",
    },
    { keywords: ["plastic", "plastic material"], name: "Plastic" },
    { keywords: ["rubber", "rubber material"], name: "Rubber" },
    { keywords: ["neoprene"], name: "Neoprene" },

    // Metal materials
    {
      keywords: ["metal", "metallic", "steel", "stainless steel"],
      name: "Metal",
    },
    { keywords: ["gold", "gold plated", "golden"], name: "Gold" },
    { keywords: ["silver", "silver plated", "silver tone"], name: "Silver" },
    { keywords: ["brass", "brass plated"], name: "Brass" },
    { keywords: ["copper", "copper plated"], name: "Copper" },

    // Generic fallbacks (lower priority)
    { keywords: ["fabric", "textile", "material"], name: "Fabric" },
  ];

  const allTerms = [
    ...visionResults.labels.map((l) => l.description.toLowerCase()),
    ...visionResults.objects.map((o) => o.name.toLowerCase()),
  ];

  // Check for materials in priority order (more specific first)
  for (const material of materials) {
    for (const keyword of material.keywords) {
      for (const term of allTerms) {
        if (term.includes(keyword)) {
          return material.name;
        }
      }
    }
  }

  return null;
}

/**
 * Generate product name from Vision API results
 * Format: [Color] [Material] [Product Type]
 */
export function generateProductName(
  visionResults: VisionAnalysisResult
): string {
  const productType = extractProductType(visionResults);
  const material = extractMaterial(visionResults);

  // Get dominant color
  let color: string | null = null;
  if (visionResults.colors.length > 0) {
    const dominantColor = visionResults.colors[0].color;
    if (dominantColor) {
      color = rgbToColorName(
        Math.round(dominantColor.red || 0),
        Math.round(dominantColor.green || 0),
        Math.round(dominantColor.blue || 0)
      );
    }
  }

  // Build name parts
  const parts: string[] = [];

  if (color && color !== "Unknown") {
    parts.push(color);
  }

  if (material) {
    parts.push(material);
  }

  parts.push(productType);

  return parts.join(" ");
}
