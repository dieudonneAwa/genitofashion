import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Return } from "@/lib/mongodb/models";
import { Product } from "@/lib/mongodb/models";
import { logStockMovement, logActivity } from "@/lib/admin-utils";
import mongoose from "mongoose";

// GET - Get return details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const returnRecord = await Return.findById(params.id)
      .populate("sale_id")
      .populate("staff_id", "name")
      .lean();

    if (!returnRecord) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    const returnData = returnRecord as any;
    return NextResponse.json({
      return: {
        id: String(returnData._id),
        return_number: returnData.return_number,
        sale_id: returnData.sale_id,
        items: returnData.items,
        total_refund: returnData.total_refund,
        status: returnData.status,
        staff_id: returnData.staff_id,
        staff_name:
          typeof returnData.staff_id === "object" && returnData.staff_id
            ? (returnData.staff_id as any).name
            : null,
        reason: returnData.reason,
        notes: returnData.notes,
        created_at: returnData.created_at,
        updated_at: returnData.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error fetching return:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update return status (approve/reject)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { status, notes } = body;

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (pending, approved, rejected)" },
        { status: 400 }
      );
    }

    await connectDB();

    const returnRecord = await Return.findById(params.id);
    if (!returnRecord) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    const oldStatus = returnRecord.status;
    returnRecord.status = status;
    if (notes !== undefined) {
      returnRecord.notes = notes;
    }
    returnRecord.updated_at = new Date();
    await returnRecord.save();

    // If approved, restore stock
    if (status === "approved" && oldStatus !== "approved") {
      for (const item of returnRecord.items) {
        const product = await Product.findById(item.product_id);
        if (product) {
          const updateData: any = {
            $inc: { stock: item.quantity },
            updated_at: new Date(),
          };

          // If size is specified and product has size-based inventory, update that size's stock
          if (item.size && product.stock_by_size) {
            const stockBySize =
              product.stock_by_size instanceof Map
                ? Object.fromEntries(product.stock_by_size)
                : product.stock_by_size;

            if (stockBySize[item.size] !== undefined) {
              const sizeKey = `stock_by_size.${item.size}`;
              updateData.$inc[sizeKey] = item.quantity;
            }
          }

          await Product.findByIdAndUpdate(product._id, updateData, {
            new: true,
          });

          // Log stock movement
          await logStockMovement({
            product_id: product._id,
            size: item.size,
            quantity_change: item.quantity,
            reason: "return",
            reference_id: returnRecord._id,
            staff_id: new mongoose.Types.ObjectId(session.user.id),
            notes: `Return ${returnRecord.return_number}`,
          });
        }
      }
    }

    // Log activity
    await logActivity({
      user_id: new mongoose.Types.ObjectId(session.user.id),
      action: "update_return",
      entity_type: "Return",
      entity_id: returnRecord._id,
      changes: {
        before: { status: oldStatus },
        after: { status: returnRecord.status },
      },
    });

    return NextResponse.json({
      success: true,
      return: {
        id: returnRecord._id.toString(),
        return_number: returnRecord.return_number,
        status: returnRecord.status,
        updated_at: returnRecord.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error updating return:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
