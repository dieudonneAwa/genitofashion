import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/utils";
import { analyzeImageWithGoogleVision } from "@/lib/ai/vision";
import { matchCategory } from "@/lib/ai/category-matcher";
import {
  generateProductName,
  identifyMainFashionItem,
} from "@/lib/ai/name-generator";
import {
  extractFeatures,
  extractStyle,
  extractMaterial,
} from "@/lib/ai/feature-extractor";
import { generateProductWithGPT4 } from "@/lib/ai/gpt4-product";
import { hexColorsToNames } from "@/lib/ai/color-converter";
import connectDB from "@/lib/mongodb/connection";
import { Category } from "@/lib/mongodb/models";

export interface AnalysisResult {
  name: string;
  description: string;
  suggestedCategory: {
    id: string;
    name: string;
    confidence: number;
  } | null;
  alternatives: Array<{ id: string; name: string }>;
  features: string[];
  colors: string[];
  style: string | null;
  material: string | null;
  brand: string | null;
  color: string | null;
  gender: string | null;
  confidence: {
    overall: number;
    name: number;
    category: number;
    description: number;
  };
}

export async function POST(request: Request) {
  try {
    // Check authorization (admin/staff only)
    await requireRole(["admin", "staff"]);

    const body = await request.json();
    const { imageUrl, includeDescription = false } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Validate image URL format
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid image URL format" },
        { status: 400 }
      );
    }

    // Analyze image with Google Vision API
    let visionResults;
    try {
      visionResults = await analyzeImageWithGoogleVision(imageUrl);
    } catch (error) {
      // Handle missing credentials gracefully
      if (
        error instanceof Error &&
        (error.message.includes("credentials file not found") ||
          error.message.includes("not configured") ||
          error.message.includes("ENOENT"))
      ) {
        return NextResponse.json(
          {
            error: "Google Cloud Vision API is not configured",
            details:
              "The image analysis feature requires Google Cloud Vision API credentials. Please configure GOOGLE_APPLICATION_CREDENTIALS or remove the credentials file path from your environment variables if you don't need this feature.",
            fallback: true,
          },
          { status: 503 }
        );
      }
      // Re-throw other errors
      throw error;
    }

    // Fetch categories for matching
    await connectDB();
    const categories = await Category.find().sort({ name: 1 }).lean();
    const categoryList: Array<{ id: string; name: string; slug: string }> =
      categories.map((cat: any) => ({
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
      }));

    // Match category
    const categoryMatch = matchCategory(visionResults, categoryList as any);
    const categoryConfidence = categoryMatch.confidence;

    // Extract features
    const features = extractFeatures(visionResults);
    const style = extractStyle(visionResults);
    const material = extractMaterial(visionResults);

    // Extract colors
    const colors = visionResults.dominantColors.slice(0, 3);
    const colorNames = hexColorsToNames(colors);

    // Helper function to extract brand from product name
    const extractBrandFromName = (name: string): string | null => {
      if (!name) return null;
      const words = name.split(/\s+/);
      // Common fashion brands are usually 1-2 words at the start
      // Look for capitalized words that could be a brand
      const brandWords: string[] = [];
      for (let i = 0; i < Math.min(2, words.length); i++) {
        const word = words[i];
        // Check if it's a capitalized word (likely brand)
        if (word && /^[A-Z]/.test(word) && word.length > 2) {
          brandWords.push(word);
        } else {
          break; // Stop if we hit a non-capitalized word
        }
      }
      return brandWords.length > 0 ? brandWords.join(" ") : null;
    };

    // Helper function to extract color from product name
    const extractColorFromName = (name: string): string | null => {
      if (!name) return null;
      const colorKeywords = [
        "black",
        "white",
        "red",
        "blue",
        "navy",
        "brown",
        "tan",
        "beige",
        "gray",
        "grey",
        "green",
        "yellow",
        "orange",
        "pink",
        "purple",
        "burgundy",
        "maroon",
        "crimson",
        "gold",
        "silver",
        "bronze",
        "ivory",
        "cream",
        "khaki",
        "olive",
        "teal",
        "turquoise",
        "coral",
        "charcoal",
        "slate",
        "chocolate",
        "coffee",
        "camel",
        "mustard",
        "amber",
        "emerald",
        "forest",
        "lime",
        "mint",
        "sage",
        "royal",
        "sky",
        "light",
        "dark",
        "midnight",
        "indigo",
        "violet",
        "lavender",
        "plum",
        "rose",
        "salmon",
        "blush",
        "fuchsia",
        "magenta",
      ];
      const nameLower = name.toLowerCase();
      for (const color of colorKeywords) {
        if (nameLower.includes(color)) {
          // Capitalize first letter
          return color.charAt(0).toUpperCase() + color.slice(1);
        }
      }
      return null;
    };

    // Helper function to filter out common non-brand phrases
    const filterNonBrandPhrases = (text: string): string[] => {
      const nonBrandPhrases = [
        "MADE",
        "IN",
        "ITALY",
        "PARIS",
        "FRANCE",
        "USA",
        "UK",
        "GERMANY",
        "SPAIN",
        "PORTUGAL",
        "CHINA",
        "JAPAN",
        "KOREA",
        "INDIA",
        "BRAZIL",
        "MEXICO",
        "CANADA",
        "AUSTRALIA",
        "NEW",
        "YORK",
        "LONDON",
        "MILAN",
        "ROME",
        "BERLIN",
        "MADRID",
        "AMSTERDAM",
        "VIENNA",
        "ZURICH",
        "COPENHAGEN",
        "STOCKHOLM",
        "OSLO",
        "HELSINKI",
        "DUBLIN",
        "BRUSSELS",
        "LISBON",
        "ATHENS",
        "PRAGUE",
        "BUDAPEST",
        "WARSAW",
        "BUCHAREST",
        "SOFIA",
        "ZAGREB",
        "BELGRADE",
        "BRATISLAVA",
        "LJUBLJANA",
        "TALLINN",
        "RIGA",
        "VILNIUS",
        "REYKJAVIK",
        "LUXEMBOURG",
        "MONACO",
        "VATICAN",
        "SAN",
        "MARINO",
        "ANDORRA",
        "LIECHTENSTEIN",
        "MALTA",
        "CYPRUS",
      ];
      const words = text.split(/\s+/);
      return words.filter(
        (word) =>
          word.length > 2 &&
          /^[A-Z]/.test(word) &&
          !/^[A-Z]{1,2}$/.test(word) &&
          !nonBrandPhrases.includes(word.toUpperCase())
      );
    };

    // Extract brand from text detection (fallback)
    let extractedBrandFromText: string | null = null;
    if (visionResults.text) {
      const filteredWords = filterNonBrandPhrases(visionResults.text);
      if (filteredWords.length > 0) {
        // Look for multi-word brand names (2 words together)
        for (let i = 0; i < filteredWords.length - 1; i++) {
          const twoWords = `${filteredWords[i]} ${filteredWords[i + 1]}`;
          // Check if this appears multiple times (more likely to be brand)
          const occurrences = (
            visionResults.text.match(new RegExp(twoWords, "gi")) || []
          ).length;
          if (occurrences > 1) {
            extractedBrandFromText = twoWords;
            break;
          }
        }
        // If no multi-word brand found, take first filtered word
        if (!extractedBrandFromText && filteredWords.length > 0) {
          extractedBrandFromText = filteredWords[0];
        }
      }
    }

    // Extract gender from labels and product type
    let extractedGender: string | null = null;
    const genderKeywords = {
      men: ["men", "male", "man", "mens", "gents", "boys"],
      women: ["women", "female", "woman", "womens", "ladies", "girls"],
      unisex: ["unisex", "unified", "both", "all"],
    };
    const allLabels = [
      ...visionResults.labels.map((l) => l.description.toLowerCase()),
      ...visionResults.objects.map((o) => o.name.toLowerCase()),
    ];
    for (const [gender, keywords] of Object.entries(genderKeywords)) {
      if (
        keywords.some((keyword) =>
          allLabels.some((label) => label.includes(keyword))
        )
      ) {
        extractedGender = gender;
        break;
      }
    }

    // Generate both name and description in a single GPT-4 API call (cost-effective)
    let productName: string;
    let nameConfidence: number;
    let description: string;
    let descriptionConfidence: number;
    let extractedBrand: string | null = null;
    let primaryColor: string | null = null;

    if (process.env.OPENAI_API_KEY) {
      try {
        const gpt4Result = await generateProductWithGPT4(
          imageUrl,
          visionResults
        );

        // Use GPT-4 name if available, otherwise fallback
        if (gpt4Result.name) {
          productName = gpt4Result.name;
          nameConfidence = 0.9; // GPT-4 names are highly accurate

          // Extract brand from GPT-4 name (most reliable)
          extractedBrand = extractBrandFromName(gpt4Result.name);

          // Extract color from GPT-4 name (most reliable)
          primaryColor = extractColorFromName(gpt4Result.name);
        } else {
          productName = generateProductName(visionResults);
          nameConfidence =
            visionResults.labels.length > 0
              ? Math.min(visionResults.labels[0].score || 0.7, 0.95)
              : 0.6;
        }

        // Use GPT-4 description if available, otherwise fallback
        if (gpt4Result.description) {
          description = gpt4Result.description;
          descriptionConfidence = 0.9; // GPT-4 descriptions are highly accurate
        } else {
          description = generateTemplateDescription(visionResults);
          descriptionConfidence = 0.75; // Template is more accurate
        }
      } catch (error) {
        console.error(
          "GPT-4 product generation failed, using fallbacks:",
          error
        );
        // Fallback to rule-based name and template description
        productName = generateProductName(visionResults);
        nameConfidence =
          visionResults.labels.length > 0
            ? Math.min(visionResults.labels[0].score || 0.7, 0.95)
            : 0.6;
        description = generateTemplateDescription(visionResults);
        descriptionConfidence = 0.75;
      }
    } else {
      // No OpenAI API key, use rule-based name and template description
      productName = generateProductName(visionResults);
      nameConfidence =
        visionResults.labels.length > 0
          ? Math.min(visionResults.labels[0].score || 0.7, 0.95)
          : 0.6;
      description = generateTemplateDescription(visionResults);
      descriptionConfidence = 0.75;
    }

    // Fallback brand extraction if not found in GPT-4 name
    if (!extractedBrand) {
      extractedBrand = extractedBrandFromText;
    }

    // Fallback color extraction if not found in GPT-4 name
    if (!primaryColor) {
      // Filter out light/background colors (likely not the product color)
      const backgroundColors = [
        "Tan",
        "Beige",
        "Cream",
        "Ivory",
        "Khaki",
        "Light Gray",
        "Silver",
      ];
      const filteredColors = colorNames.filter(
        (color) => !backgroundColors.includes(color)
      );

      if (filteredColors.length > 0) {
        // Prioritize darker colors for fashion items
        const darkColors = [
          "Black",
          "Navy",
          "Dark Gray",
          "Charcoal",
          "Brown",
          "Dark Brown",
          "Burgundy",
          "Maroon",
        ];
        const darkColorMatch = filteredColors.find((color) =>
          darkColors.some((dark) => color.includes(dark))
        );
        primaryColor = darkColorMatch || filteredColors[0];
      } else {
        // If all colors are background colors, use the first one as fallback
        primaryColor = colorNames[0] || null;
      }
    }

    // Calculate overall confidence
    const overallConfidence =
      (nameConfidence + categoryConfidence + descriptionConfidence) / 3;

    // Build response
    const result: AnalysisResult = {
      name: productName,
      description,
      suggestedCategory: categoryMatch.category
        ? {
            id: categoryMatch.category.id,
            name: categoryMatch.category.name,
            confidence: categoryConfidence,
          }
        : null,
      alternatives: categoryMatch.alternatives.map((cat) => ({
        id: cat.id,
        name: cat.name,
      })),
      features,
      colors,
      style,
      material,
      brand: extractedBrand,
      color: primaryColor,
      gender: extractedGender,
      confidence: {
        overall: overallConfidence,
        name: nameConfidence,
        category: categoryConfidence,
        description: descriptionConfidence,
      },
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error analyzing image:", error);

    if (error instanceof Error) {
      if (
        error.message === "Unauthorized" ||
        error.message.includes("Forbidden")
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }

      // Return the actual error message to help with debugging
      if (
        error.message.includes("Google Cloud Vision") ||
        error.message.includes("not configured") ||
        error.message.includes("credentials")
      ) {
        return NextResponse.json(
          {
            error: error.message,
            details:
              "Please check your Google Cloud Vision API configuration in your environment variables.",
          },
          { status: 500 }
        );
      }

      // Return detailed error for other cases
      return NextResponse.json(
        {
          error: error.message || "Failed to analyze image",
          details: error.stack,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze image: Unknown error occurred" },
      { status: 500 }
    );
  }
}

/**
 * Generate detailed description using vision results (fallback when GPT-4 is not available)
 */
function generateTemplateDescription(visionResults: any): string {
  // Identify the main fashion product first
  const mainFashionItem = identifyMainFashionItem(visionResults);
  const mainProduct = mainFashionItem
    ? mainFashionItem.item
    : visionResults.labels
        ?.filter((l: any) => l.score > 0.7)
        .map((l: any) => l.description)[0] || "product";

  // Extract high-confidence labels, filtering out non-fashion items
  const fashionLabels =
    visionResults.labels
      ?.filter((l: any) => {
        const term = l.description.toLowerCase();
        // Filter out non-fashion items
        const nonFashion = [
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
        ];
        return !nonFashion.some((keyword) => term.includes(keyword));
      })
      .filter((l: any) => l.score > 0.7)
      .map((l: any) => l.description)
      .slice(0, 8) || [];

  const highConfidenceLabels =
    fashionLabels.length > 0
      ? fashionLabels
      : visionResults.labels
          ?.filter((l: any) => l.score > 0.7)
          .map((l: any) => l.description)
          .slice(0, 8) || [];

  // Extract style descriptors
  const styleKeywords = [
    "casual",
    "formal",
    "sporty",
    "elegant",
    "classic",
    "modern",
    "vintage",
    "trendy",
    "minimalist",
    "bold",
  ];
  const styles = visionResults.labels
    .filter((l: any) =>
      styleKeywords.some((keyword) =>
        l.description.toLowerCase().includes(keyword)
      )
    )
    .map((l: any) => l.description)
    .slice(0, 2);

  // Extract material using the comprehensive extractor
  const detectedMaterial = extractMaterial(visionResults);
  const materials = detectedMaterial ? [detectedMaterial] : [];

  // Also check labels for additional material mentions
  const materialKeywords = [
    "cotton",
    "denim",
    "leather",
    "synthetic",
    "wool",
    "silk",
    "polyester",
    "linen",
    "fabric",
    "textile",
    "canvas",
    "nylon",
    "spandex",
    "suede",
    "mesh",
    "knit",
    "jersey",
    "chiffon",
    "satin",
    "velvet",
  ];
  const additionalMaterials =
    visionResults.labels
      ?.filter((l: any) =>
        materialKeywords.some((keyword) =>
          l.description.toLowerCase().includes(keyword)
        )
      )
      .map((l: any) => l.description)
      .filter((m: string) => !materials.includes(m))
      .slice(0, 1) || [];

  materials.push(...additionalMaterials);

  // Extract color information and convert to readable names
  const colorNames = hexColorsToNames(
    visionResults.dominantColors?.slice(0, 3) || []
  );
  const colorDescription =
    colorNames.length > 0
      ? `featuring ${colorNames.join(", ")} color${
          colorNames.length > 1 ? "s" : ""
        }`
      : "";

  // Extract detected objects
  const objects =
    visionResults.objects
      ?.filter((o: any) => o.score > 0.7)
      .map((o: any) => o.name)
      .slice(0, 3) || [];

  // Build detailed description
  const parts: string[] = [];

  // Main product type - use identified main fashion item if available
  const productType = mainFashionItem
    ? mainFashionItem.item
    : highConfidenceLabels[0] || "product";
  parts.push(`This ${productType}`);

  // Add style
  if (styles.length > 0) {
    parts.push(`features a ${styles.join(" and ")} style`);
  }

  // Add materials
  if (materials.length > 0) {
    parts.push(`crafted from ${materials.join(" and ")}`);
  } else if (highConfidenceLabels.length > 1) {
    parts.push(`made with quality materials`);
  }

  // Add colors
  if (colorDescription) {
    parts.push(colorDescription);
  }

  // Add objects/features
  if (objects.length > 0) {
    parts.push(`with ${objects.join(", ")} details`);
  }

  // Add additional characteristics from labels
  const additionalFeatures = highConfidenceLabels
    .slice(1, 4)
    .filter(
      (label: string) =>
        !styleKeywords.some((k) => label.toLowerCase().includes(k)) &&
        !materialKeywords.some((k) => label.toLowerCase().includes(k))
    );

  if (additionalFeatures.length > 0) {
    parts.push(`showcasing ${additionalFeatures.join(", ")}`);
  }

  // Add text if detected
  if (visionResults.text && visionResults.text.trim().length > 0) {
    parts.push(`with "${visionResults.text.trim()}" text/logo`);
  }

  // Combine into a comprehensive description
  let description = parts.join(", ") + ".";

  // Add a closing statement about quality
  description +=
    " This product combines style and functionality, designed to enhance your wardrobe with its distinctive features and quality construction.";

  return description;
}
