import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connection";
import { Product } from "@/lib/mongodb/models";

export const dynamic = "force-dynamic";

// Simple in-memory cache (for serverless, consider Redis in production)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "8", 10);

    if (!query.trim() || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const cacheKey = `${query.toLowerCase()}_${limit}`;
    const cached = cache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ suggestions: cached.data });
    }

    await connectDB();

    // Search products by name, brand, and category
    // Prioritize name matches, then brand, then description
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    })
      .select("name brand category_id image_url images")
      .populate("category_id", "name slug")
      .limit(limit * 2) // Get more to sort and limit
      .lean();

    // Sort by relevance (name matches first, then brand, then description)
    const sortedProducts = products
      .sort((a: any, b: any) => {
        const queryLower = query.toLowerCase();
        const aNameMatch = a.name?.toLowerCase().includes(queryLower);
        const bNameMatch = b.name?.toLowerCase().includes(queryLower);
        const aBrandMatch = a.brand?.toLowerCase().includes(queryLower);
        const bBrandMatch = b.brand?.toLowerCase().includes(queryLower);

        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        if (aBrandMatch && !bBrandMatch) return -1;
        if (!aBrandMatch && bBrandMatch) return 1;
        return 0;
      })
      .slice(0, limit);

    const suggestions = sortedProducts.map((product: any) => ({
      id: product._id.toString(),
      name: product.name,
      brand: product.brand || null,
      category: product.category_id
        ? {
            name: product.category_id.name,
            slug: product.category_id.slug,
          }
        : null,
      image: product.image_url || product.images?.[0]?.url || null,
    }));

    // Cache the results
    cache.set(cacheKey, { data: suggestions, timestamp: Date.now() });

    // Clean up old cache entries (keep cache size manageable)
    if (cache.size > 100) {
      const entries = Array.from(cache.entries());
      entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 50)
        .forEach(([key]) => cache.delete(key));
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
