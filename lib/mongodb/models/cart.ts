import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
}

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        category: { type: String, required: true },
      },
    ],
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// userId index is automatically created by unique: true constraint on line 20

export const Cart =
  (mongoose.models && mongoose.models.Cart) ||
  mongoose.model<ICart>("Cart", CartSchema);
