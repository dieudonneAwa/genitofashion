import type { VisionAnalysisResult } from "./vision";
import { rgbToColorName } from "./vision";

/**
 * Extract features from Vision API results
 */
export function extractFeatures(visionResults: VisionAnalysisResult): string[] {
  const features: string[] = [];

  // Extract colors
  if (visionResults.colors.length > 0) {
    const dominantColors = visionResults.colors
      .slice(0, 3)
      .map((c) => {
        if (c.color) {
          return rgbToColorName(
            Math.round(c.color.red || 0),
            Math.round(c.color.green || 0),
            Math.round(c.color.blue || 0)
          );
        }
        return null;
      })
      .filter((c): c is string => c !== null && c !== "Unknown");

    features.push(...dominantColors);
  }

  // Extract style/pattern keywords
  const styleKeywords = [
    "casual",
    "formal",
    "sporty",
    "elegant",
    "vintage",
    "modern",
    "classic",
    "trendy",
    "minimalist",
    "bohemian",
  ];

  const patternKeywords = [
    "striped",
    "solid",
    "printed",
    "patterned",
    "floral",
    "geometric",
    "polka dot",
    "checkered",
    "plaid",
  ];

  const allTerms = [
    ...visionResults.labels.map((l) => l.description.toLowerCase()),
    ...visionResults.objects.map((o) => o.name.toLowerCase()),
  ];

  // Check for style keywords
  for (const term of allTerms) {
    for (const style of styleKeywords) {
      if (term.includes(style) && !features.includes(style)) {
        features.push(style.charAt(0).toUpperCase() + style.slice(1));
      }
    }
  }

  // Check for pattern keywords
  for (const term of allTerms) {
    for (const pattern of patternKeywords) {
      if (term.includes(pattern) && !features.includes(pattern)) {
        features.push(pattern.charAt(0).toUpperCase() + pattern.slice(1));
      }
    }
  }

  // Extract material
  const materials = [
    "cotton",
    "denim",
    "leather",
    "synthetic",
    "polyester",
    "wool",
    "silk",
    "linen",
  ];

  for (const term of allTerms) {
    for (const material of materials) {
      if (term.includes(material) && !features.includes(material)) {
        features.push(material.charAt(0).toUpperCase() + material.slice(1));
      }
    }
  }

  // Extract product details
  const detailKeywords = [
    "button",
    "zipper",
    "pocket",
    "collar",
    "sleeve",
    "hood",
    "lace",
    "buckle",
  ];

  for (const term of allTerms) {
    for (const detail of detailKeywords) {
      if (term.includes(detail) && !features.includes(detail)) {
        features.push(detail.charAt(0).toUpperCase() + detail.slice(1));
      }
    }
  }

  // Remove duplicates and limit to 10 features
  return [...new Set(features)].slice(0, 10);
}

/**
 * Extract style classification
 */
export function extractStyle(
  visionResults: VisionAnalysisResult
): string | null {
  const styles = ["Casual", "Formal", "Sporty", "Elegant", "Vintage", "Modern"];

  const allTerms = [
    ...visionResults.labels.map((l) => l.description.toLowerCase()),
    ...visionResults.objects.map((o) => o.name.toLowerCase()),
  ];

  for (const term of allTerms) {
    for (const style of styles) {
      if (term.includes(style.toLowerCase())) {
        return style;
      }
    }
  }

  return null;
}

/**
 * Extract material type
 * Uses the same comprehensive extraction as name-generator for consistency
 */
export function extractMaterial(
  visionResults: VisionAnalysisResult
): string | null {
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
