import OpenAI from "openai";
import type { VisionAnalysisResult } from "./vision";
import { hexColorsToNames } from "./color-converter";
import { extractMaterial } from "./feature-extractor";
import { identifyMainFashionItem } from "./name-generator";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Generate product description using GPT-4 Vision
 * @param imageUrl - URL of the product image
 * @param visionResults - Results from Google Vision API (for context)
 * @returns Generated product description
 */
export async function generateDescriptionWithGPT4(
  imageUrl: string,
  visionResults: VisionAnalysisResult
): Promise<string> {
  try {
    const client = getOpenAIClient();

    // Identify the main fashion product first
    const mainFashionItem = identifyMainFashionItem(visionResults);
    const mainProduct = mainFashionItem
      ? mainFashionItem.item
      : visionResults.labels
          .filter((l) => l.score > 0.7)
          .map((l) => l.description)[0] || "product";

    // Extract key information from vision results, prioritizing fashion items
    const fashionLabels = visionResults.labels
      .filter((l) => {
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
      .filter((l) => l.score > 0.7)
      .map((l) => l.description)
      .slice(0, 5);

    // Extract more detailed information from vision results
    const highConfidenceLabels =
      fashionLabels.length > 0
        ? fashionLabels
        : visionResults.labels
            .filter((l) => l.score > 0.7)
            .map((l) => l.description)
            .slice(0, 10);

    const detectedObjects = visionResults.objects
      .filter((o) => o.score > 0.7)
      .map((o) => o.name)
      .slice(0, 5);

    // Convert hex color codes to readable color names
    const colorNames = hexColorsToNames(
      visionResults.dominantColors.slice(0, 3)
    );
    const colors = colorNames.join(", ");

    // Extract material information
    const detectedMaterial = extractMaterial(visionResults);

    const detectedText = visionResults.text
      ? `Text found: ${visionResults.text}`
      : "";

    const prompt = `Analyze this product image carefully and generate a detailed, accurate, and descriptive product description for an e-commerce website.

Detected information from image analysis:
${
  mainFashionItem
    ? `- **MAIN PRODUCT: ${mainProduct}** (This is the primary fashion item - focus your description on this item)`
    : ""
}
- Product types/items: ${highConfidenceLabels.join(", ") || "Not specified"}
- Objects detected: ${detectedObjects.join(", ") || "None"}
- Dominant colors: ${colors || "Not specified"}
${detectedMaterial ? `- Detected material: ${detectedMaterial}` : ""}
${detectedText ? `- ${detectedText}` : ""}

Generate a comprehensive product description that:
- **CRITICAL: Focus your description on the main product identified above (${mainProduct}). Ignore or minimize mentions of non-product elements like logos, text, backgrounds, or decorative elements unless they are part of the product itself.**
- Accurately describes what you see in the image (specific details, style, design elements, materials visible) - but ONLY for the main fashion product
- **IMPORTANT: If a material is detected (${
      detectedMaterial || "none detected"
    }), you MUST explicitly mention it in the description. Describe the material accurately and naturally (e.g., "crafted from premium leather", "made with soft cotton", "constructed from durable synthetic materials")**
- Mentions specific features, patterns, textures, or design elements visible in the image - specifically for the main product
- Describes the color scheme using the provided color names (e.g., "Dark Gray", "Black", "Navy") - do NOT use hex color codes
- Includes any visible branding, logos, or text ONLY if they are part of the product design itself
- Mentions the overall style and aesthetic (casual, formal, sporty, elegant, etc.) of the main product
- Is detailed enough to help customers understand exactly what the product looks like
- Is professional and suitable for an e-commerce fashion/clothing website
- Is written in English
- Should be 4-6 sentences to provide comprehensive details

Focus on accuracy and specificity - describe exactly what you see in the image for the main fashion product (${mainProduct}), not generic product descriptions or other elements in the image. Always use readable color names (like "Black", "Dark Gray", "Navy Blue") instead of color codes. ${
      detectedMaterial
        ? `Make sure to prominently mention that the product is made from ${detectedMaterial.toLowerCase()} or similar material if visible in the image.`
        : "If you can identify the material from the image, mention it in the description."
    } Generate only the description text, no additional commentary.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o", // Updated to use gpt-4o which supports vision
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 400,
    });

    const description =
      response.choices[0]?.message?.content?.trim() ||
      "A stylish product with excellent quality and design.";

    return description;
  } catch (error) {
    console.error("Error generating description with GPT-4:", error);

    // Fallback to template-based description
    return generateTemplateDescription(visionResults);
  }
}

/**
 * Generate detailed description using vision results (fallback when GPT-4 is not available)
 */
export function generateTemplateDescription(
  visionResults: VisionAnalysisResult
): string {
  // Identify the main fashion product first
  const mainFashionItem = identifyMainFashionItem(visionResults);
  const mainProduct = mainFashionItem
    ? mainFashionItem.item
    : visionResults.labels
        .filter((l) => l.score > 0.7)
        .map((l) => l.description)[0] || "product";

  // Extract high-confidence labels, filtering out non-fashion items
  const fashionLabels = visionResults.labels
    .filter((l) => {
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
    .filter((l) => l.score > 0.7)
    .map((l) => l.description)
    .slice(0, 8);

  const highConfidenceLabels =
    fashionLabels.length > 0
      ? fashionLabels
      : visionResults.labels
          .filter((l) => l.score > 0.7)
          .map((l) => l.description)
          .slice(0, 8);

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
    .filter((l) =>
      styleKeywords.some((keyword) =>
        l.description.toLowerCase().includes(keyword)
      )
    )
    .map((l) => l.description)
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
  const additionalMaterials = visionResults.labels
    .filter((l) =>
      materialKeywords.some((keyword) =>
        l.description.toLowerCase().includes(keyword)
      )
    )
    .map((l) => l.description)
    .filter((m) => !materials.includes(m))
    .slice(0, 1);

  materials.push(...additionalMaterials);

  // Extract color information and convert to readable names
  const colorNames = hexColorsToNames(visionResults.dominantColors.slice(0, 3));
  const colorDescription =
    colorNames.length > 0
      ? `featuring ${colorNames.join(", ")} color${
          colorNames.length > 1 ? "s" : ""
        }`
      : "";

  // Extract detected objects
  const objects = visionResults.objects
    .filter((o) => o.score > 0.7)
    .map((o) => o.name)
    .slice(0, 3);

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
      (label) =>
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
