import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Sale } from "@/lib/mongodb/models";
import { User } from "@/lib/mongodb/models/auth";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admin and staff roles
    if (session.user.role !== "admin" && session.user.role !== "staff") {
      return NextResponse.json(
        { error: "Forbidden: Admin or staff access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sale_id, user_email, user_phone } = body;

    if (!sale_id) {
      return NextResponse.json(
        { error: "Sale ID is required" },
        { status: 400 }
      );
    }

    if (!user_email && !user_phone) {
      return NextResponse.json(
        { error: "Either user email or phone is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Validate sale exists
    const sale = await Sale.findById(sale_id);
    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    // Find user by email or phone
    let user = null;
    if (user_email) {
      user = await User.findOne({
        email: user_email.trim().toLowerCase(),
      });
    } else if (user_phone) {
      user = await User.findOne({
        phone: user_phone.trim(),
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found with the provided email or phone" },
        { status: 404 }
      );
    }

    // Update sale with user_id
    await Sale.findByIdAndUpdate(sale_id, {
      user_id: user._id,
      updated_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Sale linked to user account successfully",
      sale_id: sale_id,
      user_id: user._id.toString(),
      user_name: user.name,
    });
  } catch (error: any) {
    console.error("Error linking sale to user:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

