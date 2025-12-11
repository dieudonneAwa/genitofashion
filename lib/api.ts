import connectDB from "./mongodb/connection";
import { Category, Product, Review } from "./mongodb/models";
import type {
  Category as CategoryType,
  Product as ProductType,
  Review as ReviewType,
} from "@/types/database";

export async function getCategories(): Promise<CategoryType[]> {
  try {
    await connectDB();
    const categories = await Category.find().sort({ _id: 1 }).lean();
    return categories.map((cat: any) => ({
      id: String(cat._id),
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      created_at: cat.created_at?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Exception fetching categories:", error);
    return [];
  }
}

export interface ProductFilters {
  category?: string | string[]; // category slug(s) - can be single or multiple
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  discountsOnly?: boolean;
  brand?: string | string[];
  size?: string | string[];
  gender?: string | string[];
  color?: string | string[];
  page?: number;
  limit?: number;
  sortBy?: "newest" | "oldest" | "name" | "price_asc" | "price_desc"; // Sort order
}

export interface PaginatedProductsResult {
  products: ProductType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function getFilteredProducts(
  filters: ProductFilters
): Promise<PaginatedProductsResult> {
  try {
    await connectDB();

    // Build MongoDB query
    const query: any = {};

    // Category filter - handle single or multiple categories
    if (filters.category) {
      const categorySlugs = Array.isArray(filters.category)
        ? filters.category
        : [filters.category];

      if (categorySlugs.length > 0) {
        // Find all categories by their slugs
        const categories = await Category.find({
          slug: { $in: categorySlugs },
        }).lean();

        if (categories.length > 0) {
          // Use $in operator to match any of the category IDs
          query.category_id = {
            $in: categories.map((cat) => cat._id),
          };
        } else {
          // If no categories found, return empty results
          return {
            products: [],
            pagination: {
              page: filters.page || 1,
              limit: filters.limit || 20,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          };
        }
      }
    }

    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) {
        query.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.price.$lte = filters.maxPrice;
      }
    }

    // Rating filter
    if (filters.minRating !== undefined) {
      query.rating = { $gte: filters.minRating };
    }

    // Search filter (name or description)
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
      ];
    }

    // Brand filter
    if (filters.brand) {
      const brands = Array.isArray(filters.brand)
        ? filters.brand
        : [filters.brand];
      if (brands.length > 0) {
        query.brand = { $in: brands };
      }
    }

    // Size filter - check both size field and stock_by_size keys
    if (filters.size) {
      const sizes = Array.isArray(filters.size) ? filters.size : [filters.size];
      if (sizes.length > 0) {
        // Build $or query to check both size field and stock_by_size keys
        const sizeConditions: any[] = [];

        // Check size field (for backward compatibility)
        sizeConditions.push({ size: { $in: sizes } });

        // Check stock_by_size keys - use $exists for each size
        const stockBySizeConditions = sizes.map((size) => ({
          [`stock_by_size.${size}`]: { $exists: true },
        }));

        // Combine all size conditions with $or
        const sizeOrCondition = {
          $or: [...sizeConditions, ...stockBySizeConditions],
        };

        // Handle existing query conditions
        if (query.$or) {
          // If there's already an $or (from search), we need to use $and
          if (query.$and) {
            // If $and already exists, append to it
            query.$and.push(sizeOrCondition);
          } else {
            query.$and = [{ $or: query.$or }, sizeOrCondition];
          }
          delete query.$or;
        } else if (query.$and) {
          // If $and already exists, append to it
          query.$and.push(sizeOrCondition);
        } else {
          // No existing $or or $and, just add the size condition
          query.$or = [...sizeConditions, ...stockBySizeConditions];
        }
      }
    }

    // Gender filter
    if (filters.gender) {
      const genders = Array.isArray(filters.gender)
        ? filters.gender
        : [filters.gender];
      if (genders.length > 0) {
        query.gender = { $in: genders };
      }
    }

    // Color filter
    if (filters.color) {
      const colors = Array.isArray(filters.color)
        ? filters.color
        : [filters.color];
      if (colors.length > 0) {
        query.color = { $in: colors };
      }
    }

    // Discount filter - only show active discounts (not expired)
    if (filters.discountsOnly) {
      query.discount = { $gt: 0 };
      // Filter out expired discounts
      const discountTimeFilter = {
        $or: [
          { discount_end_time: null }, // No end time (permanent discount)
          { discount_end_time: { $gt: new Date() } }, // End time in the future
        ],
      };

      // If there's already an $or query (from search), combine with $and
      if (query.$or) {
        query.$and = [{ $or: query.$or }, discountTimeFilter];
        delete query.$or;
      } else {
        Object.assign(query, discountTimeFilter);
      }
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Determine sort order
    let sortOrder: any = { _id: 1 }; // Default: oldest first
    if (filters.sortBy === "newest") {
      sortOrder = { created_at: -1, _id: -1 }; // Newest first (by created_at, then _id)
    } else if (filters.sortBy === "oldest") {
      sortOrder = { created_at: 1, _id: 1 }; // Oldest first
    } else if (filters.sortBy === "name") {
      sortOrder = { name: 1 }; // Alphabetical by name
    } else if (filters.sortBy === "price_asc") {
      sortOrder = { price: 1 }; // Price ascending
    } else if (filters.sortBy === "price_desc") {
      sortOrder = { price: -1 }; // Price descending
    }

    // Fetch products with filters and pagination
    const products = await Product.find(query)
      .populate("category_id", "name slug icon")
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform products
    const transformedProducts = products.map((product: any) => {
      const category = product.category_id as any;
      const productImages = (product.images || []).map((img: any) => ({
        url: img.url,
        public_id: img.public_id,
        is_primary: img.is_primary || false,
        order: img.order || 0,
      }));

      const primaryImageUrl =
        productImages.find((img: any) => img.is_primary)?.url ||
        productImages[0]?.url ||
        product.image_url ||
        "";

      return {
        id: String(product._id),
        name: product.name,
        price: product.price,
        purchase_price: product.purchase_price || 0,
        description: product.description,
        images: productImages,
        image_url: primaryImageUrl,
        category_id:
          category?._id?.toString() || product.category_id?.toString() || "",
        stock: product.stock,
        stock_by_size: product.stock_by_size
          ? product.stock_by_size instanceof Map
            ? Object.fromEntries(product.stock_by_size)
            : product.stock_by_size
          : undefined,
        discount: product.discount,
        discount_end_time: product.discount_end_time?.toISOString() || null,
        features: product.features || [],
        brand: product.brand,
        size: product.size,
        gender: product.gender,
        color: product.color,
        rating: product.rating,
        reviews_count: product.reviews_count,
        created_at:
          product.created_at?.toISOString() || new Date().toISOString(),
        updated_at:
          product.updated_at?.toISOString() || new Date().toISOString(),
        category: category
          ? {
              id: category._id?.toString() || "",
              name: category.name,
              slug: category.slug,
              icon: category.icon,
              created_at:
                category.created_at?.toISOString() || new Date().toISOString(),
            }
          : undefined,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error("Exception fetching filtered products:", error);
    return {
      products: [],
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
}

export async function getProducts(): Promise<ProductType[]> {
  try {
    await connectDB();
    const products = await Product.find()
      .populate("category_id", "name slug icon")
      .sort({ _id: 1 })
      .lean();

    return products.map((product) => {
      const category = product.category_id as any;
      const productImages = (product.images || []).map((img: any) => ({
        url: img.url,
        public_id: img.public_id,
        is_primary: img.is_primary || false,
        order: img.order || 0,
      }));

      const primaryImageUrl =
        productImages.find((img: any) => img.is_primary)?.url ||
        productImages[0]?.url ||
        product.image_url ||
        "";

      return {
        id: String(product._id),
        name: product.name,
        price: product.price,
        purchase_price: product.purchase_price || 0,
        description: product.description,
        images: productImages,
        image_url: primaryImageUrl,
        category_id:
          category?._id?.toString() || product.category_id?.toString() || "",
        stock: product.stock,
        discount: product.discount,
        discount_end_time: product.discount_end_time?.toISOString() || null,
        features: product.features || [],
        brand: product.brand,
        size: product.size,
        gender: product.gender,
        color: product.color,
        rating: product.rating,
        reviews_count: product.reviews_count,
        created_at:
          product.created_at?.toISOString() || new Date().toISOString(),
        updated_at:
          product.updated_at?.toISOString() || new Date().toISOString(),
        category: category
          ? {
              id: category._id?.toString() || "",
              name: category.name,
              slug: category.slug,
              icon: category.icon,
              created_at:
                category.created_at?.toISOString() || new Date().toISOString(),
            }
          : undefined,
      };
    });
  } catch (error) {
    console.error("Exception fetching products:", error);
    return [];
  }
}

export async function getFeaturedProducts(): Promise<ProductType[]> {
  try {
    await connectDB();
    const products = await Product.find()
      .populate("category_id", "name slug icon")
      .sort({ rating: -1 })
      .limit(4)
      .lean();

    return products.map((product) => {
      const category = product.category_id as any;
      const productImages = (product.images || []).map((img: any) => ({
        url: img.url,
        public_id: img.public_id,
        is_primary: img.is_primary || false,
        order: img.order || 0,
      }));

      const primaryImageUrl =
        productImages.find((img: any) => img.is_primary)?.url ||
        productImages[0]?.url ||
        product.image_url ||
        "";

      return {
        id: String(product._id),
        name: product.name,
        price: product.price,
        purchase_price: product.purchase_price || 0,
        description: product.description,
        images: productImages,
        image_url: primaryImageUrl,
        category_id:
          category?._id?.toString() || product.category_id?.toString() || "",
        stock: product.stock,
        discount: product.discount,
        discount_end_time: product.discount_end_time?.toISOString() || null,
        features: product.features || [],
        brand: product.brand,
        size: product.size,
        gender: product.gender,
        color: product.color,
        rating: product.rating,
        reviews_count: product.reviews_count,
        created_at:
          product.created_at?.toISOString() || new Date().toISOString(),
        updated_at:
          product.updated_at?.toISOString() || new Date().toISOString(),
        category: category
          ? {
              id: category._id?.toString() || "",
              name: category.name,
              slug: category.slug,
              icon: category.icon,
              created_at:
                category.created_at?.toISOString() || new Date().toISOString(),
            }
          : undefined,
      };
    });
  } catch (error) {
    console.error("Exception fetching featured products:", error);
    return [];
  }
}

export async function getProductById(id: string): Promise<ProductType | null> {
  try {
    await connectDB();
    const product = await Product.findById(id)
      .populate("category_id", "name slug icon")
      .lean();

    if (!product) {
      return null;
    }

    const productData = product as any;
    const category = productData.category_id as any;
    const primaryImage =
      productData.images?.find((img: any) => img.is_primary) ||
      productData.images?.[0];
    return {
      id: String(productData._id),
      name: productData.name,
      price: productData.price,
      purchase_price: productData.purchase_price || 0,
      description: productData.description,
      image_url: primaryImage?.url || productData.image_url || "",
      images:
        productData.images?.map((img: any) => ({
          url: img.url,
          public_id: img.public_id,
          is_primary: img.is_primary || false,
          order: img.order || 0,
        })) || [],
      category_id:
        category?._id?.toString() || productData.category_id?.toString() || "",
      stock: productData.stock,
      discount: productData.discount,
      discount_end_time: productData.discount_end_time?.toISOString() || null,
      features: productData.features || [],
      rating: productData.rating,
      reviews_count: productData.reviews_count,
      created_at:
        productData.created_at?.toISOString() || new Date().toISOString(),
      updated_at:
        productData.updated_at?.toISOString() || new Date().toISOString(),
      category: category
        ? {
            id: category._id?.toString() || "",
            name: category.name,
            slug: category.slug,
            icon: category.icon,
            created_at:
              category.created_at?.toISOString() || new Date().toISOString(),
          }
        : undefined,
    };
  } catch (error) {
    console.error(`Exception fetching product with id ${id}:`, error);
    return null;
  }
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string
): Promise<ProductType[]> {
  try {
    await connectDB();
    const products = await Product.find({
      category_id: categoryId,
      _id: { $ne: productId },
    })
      .populate("category_id", "name slug icon")
      .limit(4)
      .lean();

    return products.map((product) => {
      const category = product.category_id as any;
      const productImages = (product.images || []).map((img: any) => ({
        url: img.url,
        public_id: img.public_id,
        is_primary: img.is_primary || false,
        order: img.order || 0,
      }));

      const primaryImageUrl =
        productImages.find((img: any) => img.is_primary)?.url ||
        productImages[0]?.url ||
        product.image_url ||
        "";

      return {
        id: String(product._id),
        name: product.name,
        price: product.price,
        purchase_price: product.purchase_price || 0,
        description: product.description,
        images: productImages,
        image_url: primaryImageUrl,
        category_id:
          category?._id?.toString() || product.category_id?.toString() || "",
        stock: product.stock,
        discount: product.discount,
        discount_end_time: product.discount_end_time?.toISOString() || null,
        features: product.features || [],
        brand: product.brand,
        size: product.size,
        gender: product.gender,
        color: product.color,
        rating: product.rating,
        reviews_count: product.reviews_count,
        created_at:
          product.created_at?.toISOString() || new Date().toISOString(),
        updated_at:
          product.updated_at?.toISOString() || new Date().toISOString(),
        category: category
          ? {
              id: category._id?.toString() || "",
              name: category.name,
              slug: category.slug,
              icon: category.icon,
              created_at:
                category.created_at?.toISOString() || new Date().toISOString(),
            }
          : undefined,
      };
    });
  } catch (error) {
    console.error(
      `Exception fetching related products for product id ${productId}:`,
      error
    );
    return [];
  }
}

export async function getProductReviews(
  productId: string
): Promise<ReviewType[]> {
  try {
    await connectDB();
    const reviews = await Review.find({ product_id: productId })
      .sort({ date: -1 })
      .lean();

    return reviews.map((review: any) => ({
      id: String(review._id),
      product_id: review.product_id.toString(),
      user_name: review.user_name,
      rating: review.rating,
      comment: review.comment,
      date: review.date?.toISOString() || new Date().toISOString(),
      avatar_url: review.avatar_url,
      created_at: review.created_at?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error(
      `Exception fetching reviews for product id ${productId}:`,
      error
    );
    return [];
  }
}

export async function getSaleProducts(): Promise<ProductType[]> {
  try {
    await connectDB();
    const products = await Product.find({
      discount: { $exists: true, $ne: null, $gt: 0 },
    })
      .populate("category_id", "name slug icon")
      .sort({ rating: -1 })
      .limit(4)
      .lean();

    return products.map((product) => {
      const category = product.category_id as any;
      const productImages = (product.images || []).map((img: any) => ({
        url: img.url,
        public_id: img.public_id,
        is_primary: img.is_primary || false,
        order: img.order || 0,
      }));

      const primaryImageUrl =
        productImages.find((img: any) => img.is_primary)?.url ||
        productImages[0]?.url ||
        product.image_url ||
        "";

      return {
        id: String(product._id),
        name: product.name,
        price: product.price,
        purchase_price: product.purchase_price || 0,
        description: product.description,
        images: productImages,
        image_url: primaryImageUrl,
        category_id:
          category?._id?.toString() || product.category_id?.toString() || "",
        stock: product.stock,
        discount: product.discount,
        discount_end_time: product.discount_end_time?.toISOString() || null,
        features: product.features || [],
        brand: product.brand,
        size: product.size,
        gender: product.gender,
        color: product.color,
        rating: product.rating,
        reviews_count: product.reviews_count,
        created_at:
          product.created_at?.toISOString() || new Date().toISOString(),
        updated_at:
          product.updated_at?.toISOString() || new Date().toISOString(),
        category: category
          ? {
              id: category._id?.toString() || "",
              name: category.name,
              slug: category.slug,
              icon: category.icon,
              created_at:
                category.created_at?.toISOString() || new Date().toISOString(),
            }
          : undefined,
      };
    });
  } catch (error) {
    console.error("Exception fetching sale products:", error);
    return [];
  }
}
