import OpenAI from "openai";
import type { VisionAnalysisResult } from "./vision";
import { hexColorsToNames } from "./color-converter";
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

export interface GPT4ProductResult {
  name: string | null;
  description: string | null;
}

/**
 * Generate both product name and description using GPT-4 Vision in a single API call
 * Cost-effective: One API call instead of two, processes image only once
 * @param imageUrl - URL of the product image
 * @param visionResults - Results from Google Vision API (for context)
 * @returns Generated product name and description
 */
export async function generateProductWithGPT4(
  imageUrl: string,
  visionResults: VisionAnalysisResult
): Promise<GPT4ProductResult> {
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

    const detectedText = visionResults.text
      ? `Text found: ${visionResults.text}`
      : "";

    // Extract potential brand name from text (look for uppercase words, brand-like patterns)
    const potentialBrand = detectedText
      ? detectedText
          .split(/\s+/)
          .filter((word) => word.length > 2 && /^[A-Z]/.test(word))
          .slice(0, 2)
          .join(" ")
      : "";

    // Combined prompt for both name and description
    const prompt = `Analyze this product image carefully and generate both a product name and description for an e-commerce website.

Detected information from image analysis:
${
  mainFashionItem
    ? `- **MAIN PRODUCT: ${mainProduct}** (This is the primary fashion item - focus on this item)`
    : ""
}
- Product types/items: ${highConfidenceLabels.join(", ") || "Not specified"}
- Objects detected: ${detectedObjects.join(", ") || "None"}
- Dominant colors: ${colors || "Not specified"}
${detectedText ? `- Text/brand visible in image: ${detectedText}` : ""}
${potentialBrand ? `- Potential brand name: ${potentialBrand}` : ""}

Generate the following in JSON format:
{
  "name": "Generate an accurate, descriptive product name that matches e-commerce naming conventions. IMPORTANT RULES: 1) If you can see a brand name or logo text in the image (like '${
    potentialBrand || "brand name"
  }'), include it in the name (e.g., 'Toga Virilis Strap-Detail Clogs'). 2) Use the MOST SPECIFIC product type name you can identify from the image (e.g., 'clogs', 'mules', 'loafers', 'sneakers' - NOT generic 'shoes' or 'slipper'). 3) Include distinctive design features if clearly visible (e.g., 'strap-detail', 'buckle', 'slip-on', 'lace-up'). 4) Analyze the material TEXTURE visually from the image - distinguish between smooth leather (glossy), suede (matte fuzzy), nubuck (matte smooth), canvas, synthetic, etc. - be specific and accurate. 5) Include color if clearly visible (use readable names like 'Black', 'Navy', not hex codes). 6) Follow e-commerce naming patterns: [Brand] [Feature] [Product Type] OR [Color] [Material] [Feature] [Product Type] if no brand visible. 7) Keep it concise but descriptive (3-6 words). Examples: 'Toga Virilis Strap-Detail Clogs', 'Black Suede Buckle Mules', 'Navy Canvas Sneakers'.",
  "description": "A detailed product description (4-6 sentences) that: focuses on the main product (${mainProduct}), accurately describes what you see (specific details, style, design elements, materials visible), analyzes material texture visually and describes it accurately (e.g., 'matte suede', 'smooth leather', 'textured canvas'), mentions material type based on visual texture analysis, describes color scheme using readable color names (not hex codes), includes visible branding/logos only if part of product design, mentions distinctive features (buckles, straps, closures, etc.), mentions overall style and aesthetic, is professional and suitable for e-commerce fashion website."
}

IMPORTANT:
- Return ONLY valid JSON, no additional text or explanation
- The name should be 3-6 words (more flexible for brand names and features)
- The description should be 4-6 sentences
- Focus on the main product (${mainProduct}), ignore non-product elements
- Analyze material TEXTURE visually - distinguish suede (matte fuzzy), nubuck (matte smooth), smooth leather (glossy), canvas, etc.
- If brand name is visible in text, include it in the name
- Use specific product type names (clogs, mules, loafers) not generic terms
- Use readable color names, not hex codes`;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
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
      max_tokens: 450, // Combined: ~20 for name + ~400 for description + buffer
      temperature: 0.3, // Lower temperature for more consistent output
      response_format: { type: "json_object" }, // Force JSON output for easier parsing
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (!content) {
      return { name: null, description: null };
    }

    try {
      const parsed = JSON.parse(content);

      // Validate and clean the results
      const name = parsed.name?.trim() || null;
      const description = parsed.description?.trim() || null;

      // Validate name (should be reasonable length, allow for brand names)
      if (name && name.length > 150) {
        console.warn("GPT-4 returned name that's too long, using null");
        return { name: null, description };
      }

      // Validate description (should be reasonable length)
      if (description && description.length < 50) {
        console.warn("GPT-4 returned description that's too short, using null");
        return { name, description: null };
      }

      return { name, description };
    } catch (parseError) {
      console.error("Failed to parse GPT-4 JSON response:", parseError);
      console.error("Response content:", content);
      return { name: null, description: null };
    }
  } catch (error) {
    console.error("Error generating product with GPT-4:", error);
    return { name: null, description: null };
  }
}
