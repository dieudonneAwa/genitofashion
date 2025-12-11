import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Sale } from "@/lib/mongodb/models";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const orderId = params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 }
      );
    }

    // Fetch order and verify it belongs to the user
    const order = await Sale.findById(orderId).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership and transform order for response
    const orderData = order as any;
    if (!orderData.user_id || String(orderData.user_id) !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only view your own orders" },
        { status: 403 }
      );
    }
    const transformedOrder = {
      id: String(orderData._id),
      sale_number: orderData.sale_number,
      items: orderData.items.map((item: any) => ({
        product_id: item.product_id.toString(),
        product_name: item.product_name,
        quantity: item.quantity,
        size: item.size || null,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || null,
        final_price: item.final_price,
        subtotal: item.subtotal,
      })),
      customer_name: orderData.customer_name || null,
      customer_phone: orderData.customer_phone || null,
      subtotal: orderData.subtotal,
      tax: orderData.tax,
      discount_amount: orderData.discount_amount,
      total: orderData.total,
      payment_method: orderData.payment_method,
      cash_received: orderData.cash_received,
      change: orderData.change,
      staff_name: orderData.staff_name || null,
      created_at: orderData.created_at.toISOString(),
    };

    return NextResponse.json({ order: transformedOrder });
  } catch (error: any) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
