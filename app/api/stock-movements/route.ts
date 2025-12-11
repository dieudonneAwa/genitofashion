import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { StockMovement } from "@/lib/mongodb/models";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// GET - List stock movements with filters
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const productId = searchParams.get("productId");
    const reason = searchParams.get("reason");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const skip = (page - 1) * limit;

    await connectDB();

    // Build query
    const query: any = {};
    if (productId) {
      query.product_id = new mongoose.Types.ObjectId(productId);
    }
    if (reason) {
      query.reason = reason;
    }
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) {
        query.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        query.created_at.$lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await StockMovement.countDocuments(query);

    // Fetch stock movements
    const movements = await StockMovement.find(query)
      .populate("product_id", "name")
      .populate("staff_id", "name email")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      movements: movements.map((movement: any) => ({
        id: String(movement._id),
        product_id: movement.product_id,
        product_name:
          typeof movement.product_id === "object" && movement.product_id
            ? (movement.product_id as any).name
            : null,
        size: movement.size,
        quantity_change: movement.quantity_change,
        reason: movement.reason,
        reference_id: movement.reference_id
          ? movement.reference_id.toString()
          : null,
        staff_id: movement.staff_id,
        staff_name:
          typeof movement.staff_id === "object" && movement.staff_id
            ? (movement.staff_id as any).name
            : null,
        notes: movement.notes,
        created_at: movement.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
