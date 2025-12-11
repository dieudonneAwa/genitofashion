import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Product } from "@/lib/mongodb/models";
import { logStockMovement, logActivity } from "@/lib/admin-utils";
import mongoose from "mongoose";

// POST - Bulk update stock
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { updates, operation } = body; // operation: "update_stock" | "update_prices"

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    if (!operation || !["update_stock", "update_prices"].includes(operation)) {
      return NextResponse.json(
        { error: "Valid operation is required (update_stock or update_prices)" },
        { status: 400 }
      );
    }

    await connectDB();

    const results = {
      success: [] as any[],
      errors: [] as any[],
    };

    for (const update of updates) {
      try {
        const { product_id, stock, stock_by_size, price, purchase_price } = update;

        if (!product_id) {
          results.errors.push({
            product_id: product_id || "unknown",
            error: "Product ID is required",
          });
          continue;
        }

        const product = await Product.findById(product_id);
        if (!product) {
          results.errors.push({
            product_id,
            error: "Product not found",
          });
          continue;
        }

        const updateData: any = {
          updated_at: new Date(),
        };

        if (operation === "update_stock") {
          if (stock !== undefined) {
            updateData.stock = stock;
          }
          if (stock_by_size !== undefined) {
            updateData.stock_by_size = new Map(Object.entries(stock_by_size));
          }
        } else if (operation === "update_prices") {
          if (price !== undefined) {
            updateData.price = price;
          }
          if (purchase_price !== undefined) {
            updateData.purchase_price = purchase_price;
          }
        }

        await Product.findByIdAndUpdate(product_id, updateData, { new: true });

        // Log stock movement if stock was updated
        if (operation === "update_stock" && stock !== undefined) {
          const oldStock = product.stock;
          const stockChange = stock - oldStock;
          if (stockChange !== 0) {
            await logStockMovement({
              product_id: new mongoose.Types.ObjectId(product_id),
              quantity_change: stockChange,
              reason: "adjustment",
              staff_id: new mongoose.Types.ObjectId(session.user.id),
              notes: "Bulk stock update",
            });
          }
        }

        // Log activity
        await logActivity({
          user_id: new mongoose.Types.ObjectId(session.user.id),
          action: `bulk_${operation}`,
          entity_type: "Product",
          entity_id: new mongoose.Types.ObjectId(product_id),
        });

        results.success.push({
          product_id,
          product_name: product.name,
        });
      } catch (error: any) {
        results.errors.push({
          product_id: update.product_id || "unknown",
          error: error.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        total: updates.length,
        successful: results.success.length,
        failed: results.errors.length,
        success: results.success,
        errors: results.errors,
      },
    });
  } catch (error: any) {
    console.error("Error performing bulk operation:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

