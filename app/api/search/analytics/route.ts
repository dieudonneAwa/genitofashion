import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connection";
import { SearchAnalytics } from "@/lib/mongodb/models/search-analytics";

// Track search query
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, resultCount = 0 } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const searchQuery = query.trim().toLowerCase();

    // Update or create search analytics
    await SearchAnalytics.findOneAndUpdate(
      { query: searchQuery },
      {
        $inc: { count: 1, totalResults: resultCount },
        $set: { lastSearched: new Date() },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking search:", error);
    // Don't fail the request if analytics fails
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// Get trending searches
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    await connectDB();

    // Get trending searches (most searched in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trending = await SearchAnalytics.find({
      lastSearched: { $gte: sevenDaysAgo },
    })
      .sort({ count: -1 })
      .limit(limit)
      .select("query count")
      .lean();

    return NextResponse.json({
      trending: trending.map((item) => ({
        query: item.query,
        count: item.count,
      })),
    });
  } catch (error) {
    console.error("Error fetching trending searches:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending searches" },
      { status: 500 }
    );
  }
}

