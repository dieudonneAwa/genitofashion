import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { calculateLowStockProducts, getSettings } from "@/lib/admin-utils";

export const dynamic = "force-dynamic";

// GET - Get products with low stock
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin" && session.user.role !== "staff") {
      return NextResponse.json(
        { error: "Forbidden: Admin or staff access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const thresholdParam = searchParams.get("threshold");

    // Get threshold from settings or use provided/default value
    let threshold = 10;
    if (thresholdParam) {
      threshold = parseInt(thresholdParam, 10);
    } else {
      const settingsThreshold = await getSettings("low_stock_threshold");
      if (settingsThreshold !== null) {
        threshold = parseInt(settingsThreshold, 10);
      }
    }

    const lowStockProducts = await calculateLowStockProducts(threshold);

    return NextResponse.json({
      threshold,
      count: lowStockProducts.length,
      products: lowStockProducts.map((item) => ({
        product_id: item.product._id.toString(),
        product_name: item.product.name,
        current_stock: item.currentStock,
        size: item.size,
        threshold,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching low stock products:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
