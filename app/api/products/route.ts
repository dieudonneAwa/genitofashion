import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/utils";
import { getProducts, getFilteredProducts } from "@/lib/api";
import connectDB from "@/lib/mongodb/connection";
import { Product, Category } from "@/lib/mongodb/models";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Check if any filter parameters are provided
    const hasFilters =
      searchParams.has("category") ||
      searchParams.has("minPrice") ||
      searchParams.has("maxPrice") ||
      searchParams.has("search") ||
      searchParams.has("minRating") ||
      searchParams.has("discountsOnly") ||
      searchParams.has("brand") ||
      searchParams.has("size") ||
      searchParams.has("gender") ||
      searchParams.has("color") ||
      searchParams.has("page") ||
      searchParams.has("limit");

    if (hasFilters) {
      // Handle multiple category parameters
      // Support both: ?category=shoes&category=clothes OR ?categories=shoes,clothes
      const categoryParams = searchParams.getAll("category");
      const categoriesParam = searchParams.get("categories");

      let categories: string[] | undefined;
      if (categoryParams.length > 0) {
        categories = categoryParams;
      } else if (categoriesParam) {
        // Support comma-separated categories
        categories = categoriesParam
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
      }

      // Handle multiple brand, size, gender, color parameters
      const brandParams = searchParams.getAll("brand");
      const sizeParams = searchParams.getAll("size");
      const genderParams = searchParams.getAll("gender");
      const colorParams = searchParams.getAll("color");

      // Use filtered products with pagination
      const result = await getFilteredProducts({
        category: categories && categories.length > 0 ? categories : undefined,
        search: searchParams.get("search") || undefined,
        minPrice: searchParams.get("minPrice")
          ? Number(searchParams.get("minPrice"))
          : undefined,
        maxPrice: searchParams.get("maxPrice")
          ? Number(searchParams.get("maxPrice"))
          : undefined,
        minRating: searchParams.get("minRating")
          ? Number(searchParams.get("minRating"))
          : undefined,
        discountsOnly: searchParams.get("discountsOnly") === "true",
        brand: brandParams.length > 0 ? brandParams : undefined,
        size: sizeParams.length > 0 ? sizeParams : undefined,
        gender: genderParams.length > 0 ? genderParams : undefined,
        color: colorParams.length > 0 ? colorParams : undefined,
        page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
        limit: searchParams.get("limit")
          ? Number(searchParams.get("limit"))
          : 20,
        sortBy: (searchParams.get("sortBy") as any) || undefined,
      });

      return NextResponse.json(result);
    } else {
      // Return all products (backward compatibility)
      const products = await getProducts();
      return NextResponse.json(products);
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check authorization
    await requireRole(["admin", "staff"]);

    const body = await request.json();
    const {
      name,
      price,
      purchase_price,
      description,
      images,
      category_id,
      stock,
      stock_by_size,
      discount,
      discount_end_time,
      features,
      brand,
      size,
      gender,
      color,
    } = body;

    // Validation
    if (!name || !price || !category_id) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 }
      );
    }

    // Validate images
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "At least one product image is required" },
        { status: 400 }
      );
    }

    // Validate image structure
    for (const img of images) {
      if (!img.url || !img.public_id) {
        return NextResponse.json(
          {
            error: "Invalid image data. Each image must have url and public_id",
          },
          { status: 400 }
        );
      }
    }

    if (typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        { error: "Price must be a positive number" },
        { status: 400 }
      );
    }

    // Validate purchase_price (optional, but if provided must be valid)
    if (purchase_price !== undefined && purchase_price !== null) {
      if (typeof purchase_price !== "number" || purchase_price < 0) {
        return NextResponse.json(
          { error: "Purchase price must be a non-negative number" },
          { status: 400 }
        );
      }
    }

    if (stock !== undefined && (typeof stock !== "number" || stock < 0)) {
      return NextResponse.json(
        { error: "Stock must be a non-negative number" },
        { status: 400 }
      );
    }

    if (discount !== undefined && discount !== null) {
      if (typeof discount !== "number" || discount < 0 || discount > 100) {
        return NextResponse.json(
          { error: "Discount must be a number between 0 and 100" },
          { status: 400 }
        );
      }
    }

    // Validate category exists
    await connectDB();
    const category = await Category.findById(category_id);
    if (!category) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    // Process images - ensure at least one is primary
    const processedImages = images.map((img: any, index: number) => ({
      url: img.url,
      public_id: img.public_id,
      is_primary: img.is_primary !== undefined ? img.is_primary : index === 0,
      order: img.order !== undefined ? img.order : index,
    }));

    // Ensure first image is primary if none are marked
    if (!processedImages.some((img) => img.is_primary)) {
      processedImages[0].is_primary = true;
    }

    // Calculate stock from stock_by_size if provided
    let calculatedStock = stock !== undefined ? Number(stock) : 0;
    if (stock_by_size && typeof stock_by_size === "object") {
      // Calculate total from size-based inventory
      calculatedStock = Object.values(stock_by_size).reduce(
        (sum: number, qty: any) => sum + (Number(qty) || 0),
        0
      );
    }

    // Create product
    const product = await Product.create({
      name: name.trim(),
      price: Number(price),
      purchase_price: purchase_price !== undefined && purchase_price !== null ? Number(purchase_price) : 0,
      description: description?.trim() || "",
      images: processedImages,
      // Keep image_url for backward compatibility (use primary image)
      image_url:
        processedImages.find((img) => img.is_primary)?.url ||
        processedImages[0].url,
      category_id: new mongoose.Types.ObjectId(category_id),
      stock: calculatedStock,
      stock_by_size:
        stock_by_size && typeof stock_by_size === "object"
          ? new Map(Object.entries(stock_by_size))
          : undefined,
      discount:
        discount !== undefined && discount !== null ? Number(discount) : null,
      discount_end_time: discount_end_time ? new Date(discount_end_time) : null,
      features: Array.isArray(features)
        ? features.filter((f: any) => f && typeof f === "string")
        : [],
      brand: brand?.trim() || undefined,
      size: size?.trim() || undefined,
      gender: gender?.trim() || undefined,
      color: color?.trim() || undefined,
      rating: 0,
      reviews_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        product: {
          id: product._id.toString(),
          name: product.name,
          price: product.price,
          purchase_price: product.purchase_price,
          description: product.description,
          images: product.images,
          image_url: product.image_url, // Backward compatibility
          category_id: product.category_id.toString(),
          stock: product.stock,
          stock_by_size: product.stock_by_size
            ? Object.fromEntries(product.stock_by_size)
            : undefined,
          discount: product.discount,
          discount_end_time: product.discount_end_time?.toISOString() || null,
          features: product.features,
          brand: product.brand,
          size: product.size,
          gender: product.gender,
          color: product.color,
          rating: product.rating,
          reviews_count: product.reviews_count,
          created_at: product.created_at.toISOString(),
          updated_at: product.updated_at.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);

    if (error instanceof Error) {
      if (
        error.message === "Unauthorized" ||
        error.message.includes("Forbidden")
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
