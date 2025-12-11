import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Product } from "@/lib/mongodb/models";
import { logStockMovement, logActivity } from "@/lib/admin-utils";
import mongoose from "mongoose";

// POST - Adjust stock (increase or decrease)
export async function POST(
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
    const { quantity_change, size, reason, notes } = body;

    if (quantity_change === undefined || quantity_change === 0) {
      return NextResponse.json(
        { error: "Quantity change is required and must not be zero" },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Store old stock values for activity log
    const oldStock = product.stock;
    const oldStockBySize = product.stock_by_size
      ? product.stock_by_size instanceof Map
        ? Object.fromEntries(product.stock_by_size)
        : product.stock_by_size
      : {};

    // Update stock
    const updateData: any = {
      $inc: { stock: quantity_change },
      updated_at: new Date(),
    };

    // If size is specified and product has size-based inventory, update that size's stock
    if (size && product.stock_by_size) {
      const stockBySize =
        product.stock_by_size instanceof Map
          ? Object.fromEntries(product.stock_by_size)
          : product.stock_by_size;

      if (stockBySize[size] !== undefined) {
        const sizeKey = `stock_by_size.${size}`;
        updateData.$inc[sizeKey] = quantity_change;

        // Check if new stock would be negative
        const newSizeStock = (stockBySize[size] || 0) + quantity_change;
        if (newSizeStock < 0) {
          return NextResponse.json(
            {
              error: `Insufficient stock. Current stock for size ${size}: ${stockBySize[size]}, Adjustment: ${quantity_change}`,
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Size ${size} not found for this product` },
          { status: 400 }
        );
      }
    } else {
      // Check if new stock would be negative
      const newStock = product.stock + quantity_change;
      if (newStock < 0) {
        return NextResponse.json(
          {
            error: `Insufficient stock. Current stock: ${product.stock}, Adjustment: ${quantity_change}`,
          },
          { status: 400 }
        );
      }
    }

    await Product.findByIdAndUpdate(params.id, updateData, { new: true });

    // Get updated product for response
    const updatedProduct = await Product.findById(params.id).lean();
    const productData = updatedProduct as any;

    // Log stock movement
    await logStockMovement({
      product_id: new mongoose.Types.ObjectId(params.id),
      size: size,
      quantity_change: quantity_change,
      reason: "adjustment",
      staff_id: new mongoose.Types.ObjectId(session.user.id),
      notes: notes || reason,
    });

    // Log activity
    await logActivity({
      user_id: new mongoose.Types.ObjectId(session.user.id),
      action: "adjust_stock",
      entity_type: "Product",
      entity_id: new mongoose.Types.ObjectId(params.id),
      changes: {
        before: {
          stock: oldStock,
          stock_by_size: size ? oldStockBySize : undefined,
        },
        after: {
          stock: productData?.stock,
          stock_by_size:
            size && productData?.stock_by_size
              ? productData.stock_by_size instanceof Map
                ? Object.fromEntries(productData.stock_by_size)
                : productData.stock_by_size
              : undefined,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Stock adjusted successfully",
      product: {
        id: productData?._id ? String(productData._id) : undefined,
        name: productData?.name,
        stock: productData?.stock,
        stock_by_size: productData?.stock_by_size
          ? productData.stock_by_size instanceof Map
            ? Object.fromEntries(productData.stock_by_size)
            : productData.stock_by_size
          : undefined,
      },
    });
  } catch (error: any) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
