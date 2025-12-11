import { ImageAnnotatorClient } from "@google-cloud/vision";
import { existsSync } from "fs";
import { join } from "path";

// Initialize Google Vision client
let visionClient: ImageAnnotatorClient | null = null;
let initializationError: Error | null = null;

function getVisionClient(): ImageAnnotatorClient {
  // If we've already tried and failed, throw the cached error
  if (initializationError) {
    throw initializationError;
  }

  if (!visionClient) {
    // The @google-cloud/vision library uses Application Default Credentials (ADC)
    // or service account credentials. API keys are not supported directly.

    // Option 1: Use service account credentials file
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      // Check if file exists (handle both absolute and relative paths)
      const absolutePath = credentialsPath.startsWith("/")
        ? credentialsPath
        : join(process.cwd(), credentialsPath);
      
      if (!existsSync(absolutePath)) {
        initializationError = new Error(
          `Google Cloud Vision credentials file not found: ${absolutePath}. Please ensure the file exists or remove GOOGLE_APPLICATION_CREDENTIALS from your environment variables.`
        );
        throw initializationError;
      }

      try {
        visionClient = new ImageAnnotatorClient({
          keyFilename: credentialsPath,
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        });
      } catch (error) {
        initializationError = new Error(
          `Failed to initialize Vision client with service account: ${
            error instanceof Error ? error.message : "Unknown error"
          }. Please verify the credentials file path and format.`
        );
        throw initializationError;
      }
    }
    // Option 2: Use Application Default Credentials (ADC)
    // This will automatically use credentials from:
    // - GOOGLE_APPLICATION_CREDENTIALS env var
    // - gcloud CLI default credentials
    // - GCE/Cloud Run service account
    else {
      try {
        visionClient = new ImageAnnotatorClient({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        });
      } catch (error) {
        initializationError = new Error(
          `Failed to initialize Vision client: ${
            error instanceof Error ? error.message : "Unknown error"
          }. Please set GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to your service account JSON file, or configure Application Default Credentials. See GOOGLE_VISION_SETUP.md for instructions.`
        );
        throw initializationError;
      }
    }
  }
  return visionClient;
}

export interface VisionAnalysisResult {
  labels: Array<{ description: string; score: number }>;
  objects: Array<{ name: string; score: number }>;
  text: string;
  colors: Array<{
    color: { red: number; green: number; blue: number };
    score: number;
  }>;
  dominantColors: string[];
}

/**
 * Download image from URL and convert to base64
 */
async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString("base64");
  } catch (error) {
    console.error("Error downloading image:", error);
    throw new Error(
      `Failed to download image from URL: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Analyze an image using Google Cloud Vision API
 * @param imageUrl - URL of the image to analyze
 * @returns Vision analysis results
 */
export async function analyzeImageWithGoogleVision(
  imageUrl: string
): Promise<VisionAnalysisResult> {
  let client: ImageAnnotatorClient;

  try {
    client = getVisionClient();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to initialize Google Vision client:", errorMessage);
    
    // Check for file not found errors specifically
    if (
      errorMessage.includes("ENOENT") ||
      errorMessage.includes("credentials file not found") ||
      errorMessage.includes("no such file or directory")
    ) {
      throw new Error(
        `Google Cloud Vision API credentials file not found. Please ensure the credentials file exists at the path specified in GOOGLE_APPLICATION_CREDENTIALS, or remove this environment variable if you don't need image analysis.`
      );
    }
    
    throw new Error(
      `Google Cloud Vision API not configured: ${errorMessage}. Please set GOOGLE_APPLICATION_CREDENTIALS environment variable. See GOOGLE_VISION_SETUP.md for instructions.`
    );
  }

  try {
    // Determine image source format
    let imageSource: { source?: { imageUri: string }; content?: string };

    // Check if it's a GCS URI (gs://) - use directly
    if (imageUrl.startsWith("gs://")) {
      imageSource = { source: { imageUri: imageUrl } };
    }
    // For HTTP/HTTPS URLs, try URL first, then fallback to base64 if it fails
    else if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      // Try URL first (more efficient)
      imageSource = { source: { imageUri: imageUrl } };
    }
    // If it's not a recognized format, download and use base64
    else {
      const base64Image = await downloadImageAsBase64(imageUrl);
      imageSource = { content: base64Image };
    }

    // Perform multiple feature detections
    let labelResult: any, objectResult: any, textResult: any, colorResult: any;

    // getVisionClient() always returns a non-null client or throws
    // TypeScript assertion needed due to control flow analysis limitations
    const visionClient = client as ImageAnnotatorClient;

    try {
      [labelResult, objectResult, textResult, colorResult] = await Promise.all([
        visionClient.labelDetection({ image: imageSource }),
        // @ts-expect-error - TypeScript control flow analysis limitation. Client is guaranteed to be initialized.
        visionClient.objectLocalization({ image: imageSource }),
        visionClient.textDetection({ image: imageSource }),
        visionClient.imageProperties({ image: imageSource }),
      ]);
    } catch (urlError) {
      // If URL-based request fails and we haven't tried base64 yet, retry with base64
      if (
        imageSource.source?.imageUri &&
        (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
      ) {
        console.warn(
          "Image URI request failed, retrying with base64 content:",
          urlError
        );
        const base64Image = await downloadImageAsBase64(imageUrl);
        imageSource = { content: base64Image };

        [labelResult, objectResult, textResult, colorResult] =
          await Promise.all([
            visionClient.labelDetection({ image: imageSource }),
            // @ts-expect-error - TypeScript control flow analysis limitation. Client is guaranteed to be initialized.
            visionClient.objectLocalization({ image: imageSource }),
            visionClient.textDetection({ image: imageSource }),
            visionClient.imageProperties({ image: imageSource }),
          ]);
      } else {
        // Re-throw if we've already tried base64 or it's not a URL
        throw urlError;
      }
    }

    // Extract labels
    const labels =
      labelResult[0]?.labelAnnotations?.map((label: any) => ({
        description: label.description || "",
        score: label.score || 0,
      })) || [];

    // Extract objects
    const objects =
      objectResult[0]?.localizedObjectAnnotations?.map((obj: any) => ({
        name: obj.name || "",
        score: obj.score || 0,
      })) || [];

    // Extract text
    const text = textResult[0]?.fullTextAnnotation?.text || "";

    // Extract dominant colors
    const colorAnnotations =
      colorResult[0]?.imagePropertiesAnnotation?.dominantColors?.colors || [];
    const dominantColors = colorAnnotations
      .map((color: any) => {
        const rgb = color.color;
        if (
          rgb &&
          rgb.red !== undefined &&
          rgb.green !== undefined &&
          rgb.blue !== undefined
        ) {
          // Convert RGB to hex
          const hex = `#${[rgb.red, rgb.green, rgb.blue]
            .map((x: number) =>
              Math.round(x || 0)
                .toString(16)
                .padStart(2, "0")
            )
            .join("")}`;
          return { color: rgb, score: color.score || 0, hex };
        }
        return null;
      })
      .filter((c: any): c is NonNullable<typeof c> => c !== null)
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
      .slice(0, 5)
      .map((c: any) => c.hex);

    // Format colors for return
    const formattedColors = colorAnnotations
      .map((color: any) => {
        const rgb = color.color;
        if (
          rgb &&
          rgb.red !== undefined &&
          rgb.red !== null &&
          rgb.green !== undefined &&
          rgb.green !== null &&
          rgb.blue !== undefined &&
          rgb.blue !== null
        ) {
          return {
            color: {
              red: rgb.red as number,
              green: rgb.green as number,
              blue: rgb.blue as number,
            },
            score: color.score || 0,
          };
        }
        return null;
      })
      .filter((c: any): c is NonNullable<typeof c> => c !== null);

    return {
      labels,
      objects,
      text,
      colors: formattedColors,
      dominantColors,
    };
  } catch (error) {
    console.error("Error analyzing image with Google Vision:", error);

    // Provide more detailed error information
    if (error instanceof Error) {
      // Check for file not found errors (credentials file)
      if (
        error.message.includes("ENOENT") ||
        error.message.includes("no such file or directory") ||
        error.message.includes("credentials file not found")
      ) {
        throw new Error(
          "Google Cloud Vision API credentials file not found. Please ensure the credentials file exists or remove GOOGLE_APPLICATION_CREDENTIALS from your environment variables."
        );
      }
      
      // Check for specific Google Cloud API errors
      if (
        error.message.includes("PERMISSION_DENIED") ||
        error.message.includes("403")
      ) {
        throw new Error(
          "Permission denied. Please check your Google Cloud Vision API credentials and ensure the API is enabled."
        );
      }
      if (
        error.message.includes("INVALID_ARGUMENT") ||
        error.message.includes("400")
      ) {
        throw new Error(
          `Invalid image URL or format: ${error.message}. The image URL must be publicly accessible or a valid Google Cloud Storage URI.`
        );
      }
      if (
        error.message.includes("UNAUTHENTICATED") ||
        error.message.includes("401")
      ) {
        throw new Error(
          "Authentication failed. Please check your Google Cloud Vision API credentials."
        );
      }
      if (
        error.message.includes("NOT_FOUND") ||
        error.message.includes("404")
      ) {
        throw new Error(
          "Image not found. Please ensure the image URL is accessible."
        );
      }

      throw new Error(`Failed to analyze image: ${error.message}`);
    }

    throw new Error("Failed to analyze image: Unknown error occurred");
  }
}

/**
 * Convert RGB color to color name (simplified)
 */
export function rgbToColorName(
  red: number,
  green: number,
  blue: number
): string {
  // Simple color name mapping based on RGB values
  const colors: Array<{ name: string; rgb: [number, number, number] }> = [
    { name: "Red", rgb: [255, 0, 0] },
    { name: "Green", rgb: [0, 255, 0] },
    { name: "Blue", rgb: [0, 0, 255] },
    { name: "Black", rgb: [0, 0, 0] },
    { name: "White", rgb: [255, 255, 255] },
    { name: "Yellow", rgb: [255, 255, 0] },
    { name: "Orange", rgb: [255, 165, 0] },
    { name: "Purple", rgb: [128, 0, 128] },
    { name: "Pink", rgb: [255, 192, 203] },
    { name: "Brown", rgb: [165, 42, 42] },
    { name: "Gray", rgb: [128, 128, 128] },
    { name: "Navy", rgb: [0, 0, 128] },
    { name: "Beige", rgb: [245, 245, 220] },
    { name: "Khaki", rgb: [240, 230, 140] },
  ];

  // Find closest color
  let minDistance = Infinity;
  let closestColor = "Unknown";

  for (const color of colors) {
    const distance = Math.sqrt(
      Math.pow(red - color.rgb[0], 2) +
        Math.pow(green - color.rgb[1], 2) +
        Math.pow(blue - color.rgb[2], 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color.name;
    }
  }

  return closestColor;
}
