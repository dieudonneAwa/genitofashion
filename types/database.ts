export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  created_at: string;
}

export interface ProductImage {
  url: string;
  public_id: string;
  is_primary: boolean;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  purchase_price: number; // Cost price for profit calculation
  description: string;
  image_url?: string; // Keep for backward compatibility
  images: ProductImage[];
  category_id: string;
  stock: number;
  discount: number | null;
  discount_end_time: string | null;
  features: string[];
  rating: number;
  reviews_count: number;
  brand?: string;
  size?: string;
  gender?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Review {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  comment: string;
  date: string;
  avatar_url: string | null;
  created_at: string;
}
