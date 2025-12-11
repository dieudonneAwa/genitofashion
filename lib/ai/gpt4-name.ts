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
 * Generate product name using GPT-4 Vision
 * Cost-effective: Uses minimal tokens with a focused prompt
 * @param imageUrl - URL of the product image
 * @param visionResults - Results from Google Vision API (for context)
 * @returns Generated product name
 */
export async function generateNameWithGPT4(
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

    // Convert hex color codes to readable color names
    const colorNames = hexColorsToNames(
      visionResults.dominantColors.slice(0, 3)
    );
    const colors = colorNames.join(", ");

    // Extract material information
    const detectedMaterial = extractMaterial(visionResults);

    // Create a concise, focused prompt for name generation
    const prompt = `Analyze this product image and generate a concise, professional product name for an e-commerce website.

Main product: ${mainProduct}
${colors ? `Colors: ${colors}` : ""}
${detectedMaterial ? `Material: ${detectedMaterial}` : ""}

Generate a product name following this format: [Color] [Material] [Product Type]
- Use the main product identified above as the product type
- Include color if clearly visible (use readable names like "Black", "Navy", not hex codes)
- Include material if detected and relevant
- Keep it concise (2-4 words maximum)
- Use title case (e.g., "Brown Leather Shoes", "Black Cotton T-Shirt")
- Return ONLY the product name, no additional text or explanation`;

    const response = await client.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o for vision support
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
      max_tokens: 20, // Very low token limit since names are short
      temperature: 0.3, // Lower temperature for more consistent, focused names
    });

    const name = response.choices[0]?.message?.content?.trim() || null;

    // Validate the generated name (should be short and not contain explanations)
    if (
      name &&
      name.length < 100 &&
      !name.toLowerCase().includes("product name:")
    ) {
      return name;
    }

    // If GPT-4 returns something invalid, return empty string to use fallback
    return "";
  } catch (error) {
    console.error("Error generating name with GPT-4:", error);
    // Return empty string to trigger fallback
    return "";
  }
}
