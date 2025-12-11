import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Sale } from "@/lib/mongodb/models";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query - only fetch orders for the authenticated user
    const query: any = {
      user_id: new mongoose.Types.ObjectId(session.user.id),
    };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) {
        query.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        query.created_at.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await Sale.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Fetch orders
    const orders = await Sale.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform orders for response
    const transformedOrders = orders.map((order: any) => ({
      id: String(order._id),
      sale_number: order.sale_number,
      items_count: order.items.length,
      total: order.total,
      created_at: order.created_at.toISOString(),
      payment_method: order.payment_method,
    }));

    return NextResponse.json({
      orders: transformedOrders,
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
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
