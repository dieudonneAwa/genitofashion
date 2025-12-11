import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  icon: string;
  created_at: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    icon: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export interface IProductImage {
  url: string;
  public_id: string;
  is_primary: boolean;
  order: number;
}

export interface IProduct extends Document {
  name: string;
  price: number;
  purchase_price: number; // Cost price for profit calculation
  description: string;
  image_url?: string; // Keep for backward compatibility during migration
  images: IProductImage[];
  category_id: mongoose.Types.ObjectId;
  stock: number; // Total stock (calculated from stock_by_size or manually set)
  stock_by_size?: Record<string, number>; // Size-based inventory: { "S": 5, "M": 10, "L": 8 }
  discount: number | null;
  discount_end_time: Date | null;
  features: string[];
  rating: number;
  reviews_count: number;
  brand?: string;
  size?: string; // Keep for backward compatibility (single size filter)
  gender?: string;
  color?: string;
  created_at: Date;
  updated_at: Date;
  category?: ICategory;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    is_primary: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    purchase_price: { type: Number, required: true, default: 0 }, // Cost price for profit calculation
    description: { type: String },
    image_url: { type: String }, // Keep for backward compatibility
    images: { type: [ProductImageSchema], default: [] },
    category_id: { type: Schema.Types.ObjectId, ref: "Category" },
    stock: { type: Number, default: 0 },
    stock_by_size: { type: Map, of: Number, default: {} }, // Size-based inventory
    discount: { type: Number, default: null },
    discount_end_time: { type: Date, default: null },
    features: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
    reviews_count: { type: Number, default: 0 },
    brand: { type: String },
    size: { type: String }, // Keep for backward compatibility
    gender: { type: String },
    color: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export interface IReview extends Document {
  product_id: mongoose.Types.ObjectId;
  user_name: string;
  rating: number;
  comment: string;
  date: Date;
  avatar_url: string | null;
  created_at: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    user_name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now },
    avatar_url: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

ProductSchema.index({ category_id: 1 });
ProductSchema.index({ discount: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ stock: 1 }); // For low stock queries
ReviewSchema.index({ product_id: 1 });
ReviewSchema.index({ product_id: 1, user_name: 1 }); // Compound index for duplicate check

export interface ISaleItem {
  product_id: mongoose.Types.ObjectId;
  product_name: string;
  quantity: number;
  size?: string; // Size of the item (e.g., "S", "M", "L") for size-based inventory tracking
  unit_price: number;
  purchase_price: number; // Cost price at time of sale (for accurate profit calculation)
  discount_percentage: number | null;
  final_price: number; // Price after discount
  subtotal: number; // final_price * quantity
  cost: number; // purchase_price * quantity (COGS)
  profit: number; // subtotal - cost (profit for this item)
}

export interface ISale extends Document {
  sale_number: string; // Unique sale identifier (e.g., "SALE-2024-001")
  items: ISaleItem[];
  customer_id: mongoose.Types.ObjectId | null; // Reference to Customer model
  customer_name: string | null;
  customer_phone: string | null;
  user_id: mongoose.Types.ObjectId | null; // Reference to User model (for authenticated users)
  subtotal: number;
  tax: number;
  discount_amount: number; // Total discount applied
  total: number;
  total_cost: number; // Total cost of goods sold (COGS)
  total_profit: number; // Total profit (total - total_cost)
  payment_method: "cash";
  cash_received: number;
  change: number;
  staff_id: mongoose.Types.ObjectId | null; // Admin/staff who processed the sale
  staff_name: string | null;
  created_at: Date;
  updated_at: Date;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    product_name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, required: false }, // Optional size field for size-based inventory
    unit_price: { type: Number, required: true, min: 0 },
    purchase_price: { type: Number, required: true, min: 0 },
    discount_percentage: { type: Number, default: null },
    final_price: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
  },
  { _id: false }
);

const SaleSchema = new Schema<ISale>(
  {
    sale_number: { type: String, required: true, unique: true },
    items: { type: [SaleItemSchema], required: true },
    customer_id: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    customer_name: { type: String, default: null },
    customer_phone: { type: String, default: null },
    user_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount_amount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    total_cost: { type: Number, required: true, min: 0 },
    total_profit: { type: Number, required: true },
    payment_method: { type: String, enum: ["cash"], default: "cash" },
    cash_received: { type: Number, required: true, min: 0 },
    change: { type: Number, required: true, min: 0 },
    staff_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    staff_name: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// sale_number index is automatically created by unique: true
SaleSchema.index({ created_at: -1 });
SaleSchema.index({ staff_id: 1 });
SaleSchema.index({ customer_id: 1 }); // For customer lookup
SaleSchema.index({ customer_phone: 1 }); // For customer lookup
SaleSchema.index({ user_id: 1 }); // For user order lookup
SaleSchema.index({ created_at: -1, total: -1 }); // For sales analytics

export const Category =
  (mongoose.models && mongoose.models.Category) ||
  mongoose.model<ICategory>("Category", CategorySchema);

export const Product =
  (mongoose.models && mongoose.models.Product) ||
  mongoose.model<IProduct>("Product", ProductSchema);

export const Review =
  (mongoose.models && mongoose.models.Review) ||
  mongoose.model<IReview>("Review", ReviewSchema);

export const Sale =
  (mongoose.models && mongoose.models.Sale) ||
  mongoose.model<ISale>("Sale", SaleSchema);

// Export new models
export { Customer } from "./models/customer";
export { StockMovement } from "./models/stock-movement";
export { ActivityLog } from "./models/activity-log";
export { Return } from "./models/return";
export { Expense } from "./models/expense";
export { Settings } from "./models/settings";
export { SearchAnalytics } from "./models/search-analytics";

// Export interfaces
export type { ICustomer } from "./models/customer";
export type { IStockMovement } from "./models/stock-movement";
export type { IActivityLog } from "./models/activity-log";
export type { IReturn, IReturnItem } from "./models/return";
export type { IExpense } from "./models/expense";
export type { ISettings } from "./models/settings";
export type { ISearchAnalytics } from "./models/search-analytics";
