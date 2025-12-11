import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Return } from "@/lib/mongodb/models";
import { Sale } from "@/lib/mongodb/models";
import { Product } from "@/lib/mongodb/models";
import {
  generateReturnNumber,
  logStockMovement,
  logActivity,
} from "@/lib/admin-utils";
import mongoose from "mongoose";

// GET - List returns with pagination and filters
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
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    await connectDB();

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }

    // Get total count
    const total = await Return.countDocuments(query);

    // Fetch returns
    const returns = await Return.find(query)
      .populate("sale_id", "sale_number total")
      .populate("staff_id", "name")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      returns: returns.map((ret: any) => ({
        id: String(ret._id),
        return_number: ret.return_number,
        sale_id: ret.sale_id,
        sale_number:
          typeof ret.sale_id === "object" && ret.sale_id
            ? (ret.sale_id as any).sale_number
            : null,
        items: ret.items,
        total_refund: ret.total_refund,
        status: ret.status,
        staff_id: ret.staff_id,
        staff_name:
          typeof ret.staff_id === "object" && ret.staff_id
            ? (ret.staff_id as any).name
            : null,
        reason: ret.reason,
        notes: ret.notes,
        created_at: ret.created_at,
        updated_at: ret.updated_at,
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
    console.error("Error fetching returns:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST - Create return/refund
export async function POST(request: Request) {
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

    const body = await request.json();
    const { sale_id, items, reason, notes } = body;

    if (!sale_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Sale ID and items are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch the sale
    const sale = await Sale.findById(sale_id);
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Validate items and calculate refund
    const returnItems = [];
    let totalRefund = 0;

    for (const item of items) {
      // Find the item in the sale
      const saleItem = sale.items.find(
        (si: any) =>
          si.product_id.toString() === item.product_id &&
          (item.size ? si.size === item.size : !si.size)
      );

      if (!saleItem) {
        return NextResponse.json(
          { error: `Item not found in sale: ${item.product_id}` },
          { status: 400 }
        );
      }

      if (item.quantity > saleItem.quantity) {
        return NextResponse.json(
          {
            error: `Return quantity (${item.quantity}) exceeds sale quantity (${saleItem.quantity})`,
          },
          { status: 400 }
        );
      }

      const refundAmount = saleItem.final_price * item.quantity;
      totalRefund += refundAmount;

      returnItems.push({
        product_id: saleItem.product_id,
        product_name: saleItem.product_name,
        size: saleItem.size,
        quantity: item.quantity,
        unit_price: saleItem.unit_price,
        refund_amount: refundAmount,
        reason: item.reason || reason || "Customer return",
      });
    }

    // Generate return number
    const returnNumber = await generateReturnNumber();

    // Create return record
    const returnRecord = await Return.create({
      return_number: returnNumber,
      sale_id: new mongoose.Types.ObjectId(sale_id),
      items: returnItems,
      total_refund: totalRefund,
      status: "pending",
      staff_id: new mongoose.Types.ObjectId(session.user.id),
      reason: reason || "Customer return",
      notes: notes,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Log activity
    await logActivity({
      user_id: new mongoose.Types.ObjectId(session.user.id),
      action: "create_return",
      entity_type: "Return",
      entity_id: returnRecord._id,
      changes: {
        after: {
          return_number: returnNumber,
          sale_id: sale_id,
          total_refund: totalRefund,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        return: {
          id: returnRecord._id.toString(),
          return_number: returnRecord.return_number,
          sale_id: returnRecord.sale_id.toString(),
          items: returnRecord.items,
          total_refund: returnRecord.total_refund,
          status: returnRecord.status,
          created_at: returnRecord.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating return:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
