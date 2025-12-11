import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  loyalty_points?: number;
  tags: string[];
  notes?: string;
  total_spent: number;
  purchase_count: number;
  last_purchase_date?: Date;
  created_at: Date;
  updated_at: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, sparse: true },
    address: { type: String },
    loyalty_points: { type: Number, default: 0, min: 0 },
    tags: { type: [String], default: [] },
    notes: { type: String },
    total_spent: { type: Number, default: 0, min: 0 },
    purchase_count: { type: Number, default: 0, min: 0 },
    last_purchase_date: { type: Date },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// phone index is automatically created by unique: true constraint on line 21
CustomerSchema.index({ email: 1 }, { sparse: true });
CustomerSchema.index({ created_at: -1 });
CustomerSchema.index({ total_spent: -1 });

export const Customer =
  (mongoose.models && mongoose.models.Customer) ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);
