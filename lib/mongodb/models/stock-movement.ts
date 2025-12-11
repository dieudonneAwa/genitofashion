import mongoose, { Schema, Document } from "mongoose";

export interface IStockMovement extends Document {
  product_id: mongoose.Types.ObjectId;
  size?: string;
  quantity_change: number; // positive for additions, negative for deductions
  reason: string; // "sale", "return", "adjustment", "restock", "initial"
  reference_id?: mongoose.Types.ObjectId; // sale_id, return_id, adjustment_id, etc.
  staff_id: mongoose.Types.ObjectId;
  notes?: string;
  created_at: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    size: { type: String },
    quantity_change: { type: Number, required: true },
    reason: {
      type: String,
      required: true,
      enum: ["sale", "return", "adjustment", "restock", "initial", "other"],
    },
    reference_id: { type: Schema.Types.ObjectId },
    staff_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

StockMovementSchema.index({ product_id: 1, created_at: -1 });
StockMovementSchema.index({ created_at: -1 });
StockMovementSchema.index({ reference_id: 1 });
StockMovementSchema.index({ reason: 1 });

export const StockMovement =
  (mongoose.models && mongoose.models.StockMovement) ||
  mongoose.model<IStockMovement>("StockMovement", StockMovementSchema);

