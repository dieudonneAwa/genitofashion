import mongoose, { Schema, Document } from "mongoose";

export interface IReturnItem {
  product_id: mongoose.Types.ObjectId;
  product_name: string;
  size?: string;
  quantity: number;
  unit_price: number;
  refund_amount: number;
  reason: string;
}

export interface IReturn extends Document {
  return_number: string; // Unique return identifier (e.g., "RET-2024-001")
  sale_id: mongoose.Types.ObjectId;
  items: IReturnItem[];
  total_refund: number;
  status: "pending" | "approved" | "rejected";
  staff_id: mongoose.Types.ObjectId;
  reason?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const ReturnItemSchema = new Schema<IReturnItem>(
  {
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    product_name: { type: String, required: true },
    size: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
    refund_amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const ReturnSchema = new Schema<IReturn>(
  {
    return_number: { type: String, required: true, unique: true },
    sale_id: { type: Schema.Types.ObjectId, ref: "Sale", required: true },
    items: { type: [ReturnItemSchema], required: true },
    total_refund: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    staff_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String },
    notes: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// return_number index is automatically created by unique: true constraint on line 41
ReturnSchema.index({ sale_id: 1 });
ReturnSchema.index({ created_at: -1 });
ReturnSchema.index({ status: 1 });

export const Return =
  (mongoose.models && mongoose.models.Return) ||
  mongoose.model<IReturn>("Return", ReturnSchema);
