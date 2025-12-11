import mongoose, { Schema, Document } from "mongoose";

export interface IExpense extends Document {
  expense_number: string; // Unique expense identifier (e.g., "EXP-2024-001")
  category: string; // "rent", "utilities", "salaries", "supplies", "marketing", "other"
  amount: number;
  description?: string;
  date: Date;
  staff_id: mongoose.Types.ObjectId;
  receipt_url?: string;
  created_at: Date;
  updated_at: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    expense_number: { type: String, required: true, unique: true },
    category: {
      type: String,
      required: true,
      enum: [
        "rent",
        "utilities",
        "salaries",
        "supplies",
        "marketing",
        "maintenance",
        "insurance",
        "taxes",
        "other",
      ],
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String },
    date: { type: Date, required: true, default: Date.now },
    staff_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receipt_url: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// expense_number index is automatically created by unique: true constraint on line 17
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ staff_id: 1 });

export const Expense =
  (mongoose.models && mongoose.models.Expense) ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);
