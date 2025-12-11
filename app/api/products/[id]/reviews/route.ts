import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connection";
import { Review } from "@/lib/mongodb/models";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const productId = params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const reviews = await Review.find({
      product_id: new mongoose.Types.ObjectId(productId),
    })
      .sort({ date: -1 })
      .lean();

    const formattedReviews = reviews.map((review: any) => ({
      id: String(review._id),
      product_id: review.product_id.toString(),
      user_name: review.user_name,
      rating: review.rating,
      comment: review.comment,
      date: review.date?.toISOString() || new Date().toISOString(),
      avatar_url: review.avatar_url,
      created_at: review.created_at?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({
      reviews: formattedReviews,
    });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
