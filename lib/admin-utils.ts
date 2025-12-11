import mongoose from "mongoose";
import { Return } from "./mongodb/models/return";
import { Expense } from "./mongodb/models/expense";
import { StockMovement } from "./mongodb/models/stock-movement";
import { ActivityLog } from "./mongodb/models/activity-log";
import { Product } from "./mongodb/models";
import type { IStockMovement, IActivityLog } from "./mongodb/models";

/**
 * Generate unique return number
 */
export async function generateReturnNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RET-${year}-`;

  const latestReturn = await Return.findOne({
    return_number: { $regex: `^${prefix}` },
  })
    .sort({ return_number: -1 })
    .select("return_number")
    .lean();

  let sequence = 1;
  if (latestReturn) {
    const returnData = latestReturn as any;
    const lastSequence = parseInt(
      returnData.return_number.replace(prefix, ""),
      10
    );
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
}

/**
 * Generate unique expense number
 */
export async function generateExpenseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `EXP-${year}-`;

  const latestExpense = await Expense.findOne({
    expense_number: { $regex: `^${prefix}` },
  })
    .sort({ expense_number: -1 })
    .select("expense_number")
    .lean();

  let sequence = 1;
  if (latestExpense) {
    const expenseData = latestExpense as any;
    const lastSequence = parseInt(
      expenseData.expense_number.replace(prefix, ""),
      10
    );
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
}

/**
 * Calculate products with low stock
 */
export async function calculateLowStockProducts(
  threshold: number = 10
): Promise<Array<{ product: any; currentStock: number; size?: string }>> {
  const lowStockProducts: Array<{
    product: any;
    currentStock: number;
    size?: string;
  }> = [];

  const products = await Product.find({}).lean();

  for (const product of products) {
    const productData = product as any;
    if (productData.stock_by_size && productData.stock_by_size instanceof Map) {
      // Check size-based stock
      const stockBySize = Object.fromEntries(productData.stock_by_size);
      for (const [size, stock] of Object.entries(stockBySize)) {
        if ((stock as number) <= threshold) {
          lowStockProducts.push({
            product,
            currentStock: stock as number,
            size,
          });
        }
      }
    } else if ((productData.stock as number) <= threshold) {
      // Check regular stock
      lowStockProducts.push({
        product,
        currentStock: product.stock,
      });
    }
  }

  return lowStockProducts;
}

/**
 * Log stock movement
 */
export async function logStockMovement(data: {
  product_id: mongoose.Types.ObjectId;
  size?: string;
  quantity_change: number;
  reason: "sale" | "return" | "adjustment" | "restock" | "initial" | "other";
  reference_id?: mongoose.Types.ObjectId;
  staff_id: mongoose.Types.ObjectId;
  notes?: string;
}): Promise<void> {
  try {
    await StockMovement.create({
      product_id: data.product_id,
      size: data.size,
      quantity_change: data.quantity_change,
      reason: data.reason,
      reference_id: data.reference_id,
      staff_id: data.staff_id,
      notes: data.notes,
      created_at: new Date(),
    });
  } catch (error) {
    console.error("Error logging stock movement:", error);
    // Don't throw - stock movement logging shouldn't break the main operation
  }
}

/**
 * Log activity
 */
export async function logActivity(data: {
  user_id: mongoose.Types.ObjectId;
  action: string;
  entity_type: string;
  entity_id?: mongoose.Types.ObjectId;
  changes?: {
    before?: any;
    after?: any;
  };
  ip_address?: string;
  user_agent?: string;
}): Promise<void> {
  try {
    await ActivityLog.create({
      user_id: data.user_id,
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      changes: data.changes,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      created_at: new Date(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw - activity logging shouldn't break the main operation
  }
}

/**
 * Get settings value
 */
export async function getSettings(key: string): Promise<any> {
  const { Settings } = await import("./mongodb/models/settings");
  const setting = await Settings.findOne({ key }).lean();
  const settingData = setting as any;
  return settingData?.value ?? null;
}

/**
 * Update settings value
 */
export async function updateSettings(
  key: string,
  value: any,
  updated_by: mongoose.Types.ObjectId
): Promise<void> {
  const { Settings } = await import("./mongodb/models/settings");
  await Settings.findOneAndUpdate(
    { key },
    {
      value,
      updated_at: new Date(),
      updated_by,
    },
    { upsert: true, new: true }
  );
}
