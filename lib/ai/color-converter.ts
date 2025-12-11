/**
 * Convert hex color code to a readable color name
 * Uses a comprehensive color palette with shades and variations
 */

interface ColorMatch {
  name: string;
  hex: string;
  rgb: [number, number, number];
}

// Comprehensive color palette with common shades
const COLOR_PALETTE: ColorMatch[] = [
  // Blacks and Grays
  { name: "Black", hex: "#000000", rgb: [0, 0, 0] },
  { name: "Charcoal", hex: "#36454F", rgb: [54, 69, 79] },
  { name: "Dark Gray", hex: "#2D2E30", rgb: [45, 46, 48] },
  { name: "Gray", hex: "#808080", rgb: [128, 128, 128] },
  { name: "Light Gray", hex: "#D3D3D3", rgb: [211, 211, 211] },
  { name: "Silver", hex: "#C0C0C0", rgb: [192, 192, 192] },
  { name: "Slate Gray", hex: "#708090", rgb: [112, 128, 144] },
  
  // Whites and Beiges
  { name: "White", hex: "#FFFFFF", rgb: [255, 255, 255] },
  { name: "Ivory", hex: "#FFFFF0", rgb: [255, 255, 240] },
  { name: "Cream", hex: "#FFFDD0", rgb: [255, 253, 208] },
  { name: "Beige", hex: "#F5F5DC", rgb: [245, 245, 220] },
  { name: "Tan", hex: "#D2B48C", rgb: [210, 180, 140] },
  { name: "Khaki", hex: "#F0E68C", rgb: [240, 230, 140] },
  
  // Browns
  { name: "Brown", hex: "#A52A2A", rgb: [165, 42, 42] },
  { name: "Dark Brown", hex: "#654321", rgb: [101, 67, 33] },
  { name: "Light Brown", hex: "#CD853F", rgb: [205, 133, 63] },
  { name: "Chocolate", hex: "#7B3F00", rgb: [123, 63, 0] },
  { name: "Coffee", hex: "#6F4E37", rgb: [111, 78, 55] },
  { name: "Camel", hex: "#C19A6B", rgb: [193, 154, 107] },
  
  // Reds
  { name: "Red", hex: "#FF0000", rgb: [255, 0, 0] },
  { name: "Dark Red", hex: "#8B0000", rgb: [139, 0, 0] },
  { name: "Crimson", hex: "#DC143C", rgb: [220, 20, 60] },
  { name: "Burgundy", hex: "#800020", rgb: [128, 0, 32] },
  { name: "Maroon", hex: "#800000", rgb: [128, 0, 0] },
  { name: "Scarlet", hex: "#FF2400", rgb: [255, 36, 0] },
  { name: "Coral", hex: "#FF7F50", rgb: [255, 127, 80] },
  
  // Oranges
  { name: "Orange", hex: "#FFA500", rgb: [255, 165, 0] },
  { name: "Dark Orange", hex: "#FF8C00", rgb: [255, 140, 0] },
  { name: "Burnt Orange", hex: "#CC5500", rgb: [204, 85, 0] },
  { name: "Peach", hex: "#FFE5B4", rgb: [255, 229, 180] },
  
  // Yellows
  { name: "Yellow", hex: "#FFFF00", rgb: [255, 255, 0] },
  { name: "Gold", hex: "#FFD700", rgb: [255, 215, 0] },
  { name: "Mustard", hex: "#FFDB58", rgb: [255, 219, 88] },
  { name: "Amber", hex: "#FFBF00", rgb: [255, 191, 0] },
  
  // Greens
  { name: "Green", hex: "#008000", rgb: [0, 128, 0] },
  { name: "Dark Green", hex: "#006400", rgb: [0, 100, 0] },
  { name: "Forest Green", hex: "#228B22", rgb: [34, 139, 34] },
  { name: "Olive", hex: "#808000", rgb: [128, 128, 0] },
  { name: "Lime", hex: "#00FF00", rgb: [0, 255, 0] },
  { name: "Mint", hex: "#98FB98", rgb: [152, 251, 152] },
  { name: "Sage", hex: "#87AE73", rgb: [135, 174, 115] },
  { name: "Emerald", hex: "#50C878", rgb: [80, 200, 120] },
  
  // Blues
  { name: "Blue", hex: "#0000FF", rgb: [0, 0, 255] },
  { name: "Navy", hex: "#000080", rgb: [0, 0, 128] },
  { name: "Dark Blue", hex: "#00008B", rgb: [0, 0, 139] },
  { name: "Royal Blue", hex: "#4169E1", rgb: [65, 105, 225] },
  { name: "Sky Blue", hex: "#87CEEB", rgb: [135, 206, 235] },
  { name: "Light Blue", hex: "#ADD8E6", rgb: [173, 216, 230] },
  { name: "Teal", hex: "#008080", rgb: [0, 128, 128] },
  { name: "Turquoise", hex: "#40E0D0", rgb: [64, 224, 208] },
  { name: "Cyan", hex: "#00FFFF", rgb: [0, 255, 255] },
  
  // Purples
  { name: "Purple", hex: "#800080", rgb: [128, 0, 128] },
  { name: "Dark Purple", hex: "#4B0082", rgb: [75, 0, 130] },
  { name: "Lavender", hex: "#E6E6FA", rgb: [230, 230, 250] },
  { name: "Violet", hex: "#8A2BE2", rgb: [138, 43, 226] },
  { name: "Plum", hex: "#DDA0DD", rgb: [221, 160, 221] },
  
  // Pinks
  { name: "Pink", hex: "#FFC0CB", rgb: [255, 192, 203] },
  { name: "Hot Pink", hex: "#FF69B4", rgb: [255, 105, 180] },
  { name: "Rose", hex: "#FF007F", rgb: [255, 0, 127] },
  { name: "Salmon", hex: "#FA8072", rgb: [250, 128, 114] },
  { name: "Blush", hex: "#DE5D83", rgb: [222, 93, 131] },
  
  // Special colors
  { name: "Indigo", hex: "#4B0082", rgb: [75, 0, 130] },
  { name: "Magenta", hex: "#FF00FF", rgb: [255, 0, 255] },
  { name: "Fuchsia", hex: "#FF00FF", rgb: [255, 0, 255] },
];

/**
 * Calculate the Euclidean distance between two RGB colors
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );
}

/**
 * Convert hex color code to RGB
 */
function hexToRgb(hex: string): [number, number, number] | null {
  // Remove # if present
  const cleanHex = hex.replace("#", "");
  
  // Handle 3-digit hex codes
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return [r, g, b];
  }
  
  // Handle 6-digit hex codes
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return [r, g, b];
  }
  
  return null;
}

/**
 * Convert hex color code to a readable color name
 * @param hex - Hex color code (e.g., "#151619" or "151619")
 * @returns Readable color name (e.g., "Dark Gray")
 */
export function hexToColorName(hex: string): string {
  if (!hex || typeof hex !== "string") {
    return "Unknown";
  }

  // Normalize hex code
  const normalizedHex = hex.startsWith("#") ? hex : `#${hex}`;
  
  // Convert hex to RGB
  const rgb = hexToRgb(normalizedHex);
  if (!rgb) {
    return "Unknown";
  }

  const [r, g, b] = rgb;

  // Find the closest color in the palette
  let minDistance = Infinity;
  let closestColor = "Unknown";

  for (const color of COLOR_PALETTE) {
    const distance = colorDistance(
      r,
      g,
      b,
      color.rgb[0],
      color.rgb[1],
      color.rgb[2]
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color.name;
    }
  }

  return closestColor;
}

/**
 * Convert an array of hex color codes to readable color names
 * @param hexColors - Array of hex color codes
 * @returns Array of readable color names
 */
export function hexColorsToNames(hexColors: string[]): string[] {
  return hexColors.map(hexToColorName).filter((name) => name !== "Unknown");
}

