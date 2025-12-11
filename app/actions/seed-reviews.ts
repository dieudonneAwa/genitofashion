"use server";

import connectDB from "@/lib/mongodb/connection";
import { Review, Product } from "@/lib/mongodb/models";
import mongoose from "mongoose";

export async function seedReviews() {
  try {
    await connectDB();

    // Check if reviews already exist
    const reviewCount = await Review.countDocuments();

    if (reviewCount > 0) {
      return { success: true, message: "Reviews already seeded" };
    }

    // Get first 5 products to assign reviews to
    const products = await Product.find().limit(5).lean();
    if (products.length === 0) {
      return {
        success: false,
        message: "No products found. Please seed products first.",
      };
    }

    // Sample reviews data
    const reviews = [
      {
        product_id: new mongoose.Types.ObjectId(String(products[0]._id)),
        user_name: "John D.",
        rating: 5,
        comment:
          "These are amazing! Very comfortable and stylish. I've received many compliments wearing them.",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
        avatar_url: "/placeholder.svg?height=40&width=40",
      },
      {
        product_id: new mongoose.Types.ObjectId(String(products[0]._id)),
        user_name: "Sarah M.",
        rating: 4,
        comment:
          "Good quality product. Fits as expected and looks great. Would buy again.",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45), // 45 days ago
        avatar_url: "/placeholder.svg?height=40&width=40",
      },
      {
        product_id: new mongoose.Types.ObjectId(
          String(products[1]?._id || products[0]._id)
        ),
        user_name: "Michael T.",
        rating: 5,
        comment:
          "Excellent purchase! The quality exceeds what I expected for the price.",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60), // 60 days ago
        avatar_url: "/placeholder.svg?height=40&width=40",
      },
      {
        product_id: new mongoose.Types.ObjectId(
          String(products[1]?._id || products[0]._id)
        ),
        user_name: "Emma L.",
        rating: 3,
        comment:
          "Decent product but took longer than expected to arrive. Quality is good though.",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 75), // 75 days ago
        avatar_url: "/placeholder.svg?height=40&width=40",
      },
      {
        product_id: new mongoose.Types.ObjectId(
          String(products[2]?._id || products[0]._id)
        ),
        user_name: "David K.",
        rating: 5,
        comment:
          "These sandals are absolutely stunning! The crystal details catch the light beautifully.",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
        avatar_url: "/placeholder.svg?height=40&width=40",
      },
      {
        product_id: new mongoose.Types.ObjectId(
          String(products[3]?._id || products[0]._id)
        ),
        user_name: "Sophia R.",
        rating: 4,
        comment:
          "Love these sandals! They're comfortable and go with everything.",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        avatar_url: "/placeholder.svg?height=40&width=40",
      },
      {
        product_id: new mongoose.Types.ObjectId(
          String(products[4]?._id || products[0]._id)
        ),
        user_name: "James W.",
        rating: 5,
        comment:
          "This t-shirt is amazing quality. The fabric feels premium and it fits perfectly.",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        avatar_url: "/placeholder.svg?height=40&width=40",
      },
    ];

    // Insert reviews
    await Review.insertMany(reviews);

    return { success: true, message: "Reviews seeded successfully" };
  } catch (error) {
    console.error("Error seeding reviews:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
