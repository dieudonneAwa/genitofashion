import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Cart } from "@/lib/mongodb/models/cart";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id),
    });

    // Map database cart items to client cart items (productId -> id)
    const items =
      cart?.items.map((item: any) => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        category: item.category,
      })) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items } = await request.json();

    // Map client cart items to database cart items (id -> productId)
    const dbItems = items.map((item: any) => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity,
      category: item.category,
    }));

    await connectDB();

    const cart = await Cart.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(session.user.id) },
      {
        userId: new mongoose.Types.ObjectId(session.user.id),
        items: dbItems,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Map back to client format
    const responseItems = cart.items.map((item: any) => ({
      id: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity,
      category: item.category,
    }));

    return NextResponse.json({ success: true, items: responseItems });
  } catch (error) {
    console.error("Error saving cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
