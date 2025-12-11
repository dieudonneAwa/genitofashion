import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Review, Product } from "@/lib/mongodb/models";
import mongoose from "mongoose";
import { z } from "zod";

const reviewSchema = z.object({
  product_id: z.string().min(1, "Product ID is required"),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, "Comment is required").max(1000, "Comment is too long"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to submit a review" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    await connectDB();

    const product = await Product.findById(validatedData.product_id);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const existingReview = await Review.findOne({
      product_id: new mongoose.Types.ObjectId(validatedData.product_id),
      user_name: session.user.name || session.user.email || "Anonymous",
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    const review = await Review.create({
      product_id: new mongoose.Types.ObjectId(validatedData.product_id),
      user_name: session.user.name || session.user.email || "Anonymous",
      rating: validatedData.rating,
      comment: validatedData.comment,
      date: new Date(),
      avatar_url: session.user.image || null,
      created_at: new Date(),
    });

    const allReviews = await Review.find({
      product_id: new mongoose.Types.ObjectId(validatedData.product_id),
    });

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allReviews.length;
    const reviewsCount = allReviews.length;

    await Product.findByIdAndUpdate(validatedData.product_id, {
      rating: Math.round(averageRating * 10) / 10,
      reviews_count: reviewsCount,
      updated_at: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        review: {
          id: review._id.toString(),
          product_id: review.product_id.toString(),
          user_name: review.user_name,
          rating: review.rating,
          comment: review.comment,
          date: review.date.toISOString(),
          avatar_url: review.avatar_url,
          created_at: review.created_at.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create review" },
      { status: 500 }
    );
  }
}

