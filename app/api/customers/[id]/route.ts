import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Customer } from "@/lib/mongodb/models";
import { Sale } from "@/lib/mongodb/models";
import mongoose from "mongoose";

// GET - Get customer details with purchase history
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin" && session.user.role !== "staff") {
      return NextResponse.json(
        { error: "Forbidden: Admin or staff access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const customer = await Customer.findById(params.id).lean();
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Get purchase history
    const sales = await Sale.find({
      customer_id: new mongoose.Types.ObjectId(params.id),
    })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    const customerData = customer as any;
    return NextResponse.json({
      customer: {
        id: String(customerData._id),
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address,
        loyalty_points: customerData.loyalty_points || 0,
        tags: customerData.tags || [],
        notes: customerData.notes,
        total_spent: customerData.total_spent || 0,
        purchase_count: customerData.purchase_count || 0,
        last_purchase_date: customerData.last_purchase_date,
        created_at: customerData.created_at,
      },
      purchase_history: sales.map((sale: any) => ({
        id: String(sale._id),
        sale_number: sale.sale_number,
        total: sale.total,
        items_count: sale.items.length,
        created_at: sale.created_at,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update customer
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin" && session.user.role !== "staff") {
      return NextResponse.json(
        { error: "Forbidden: Admin or staff access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, phone, email, address, tags, notes, loyalty_points } = body;

    await connectDB();

    const customer = await Customer.findById(params.id);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Store old values for activity log
    const oldValues = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      tags: customer.tags,
      notes: customer.notes,
      loyalty_points: customer.loyalty_points,
    };

    // Update fields
    if (name !== undefined) customer.name = name.trim();
    if (phone !== undefined) customer.phone = phone.trim();
    if (email !== undefined) customer.email = email?.trim() || undefined;
    if (address !== undefined) customer.address = address?.trim() || undefined;
    if (tags !== undefined)
      customer.tags = Array.isArray(tags) ? tags : customer.tags;
    if (notes !== undefined) customer.notes = notes?.trim() || undefined;
    if (loyalty_points !== undefined) customer.loyalty_points = loyalty_points;
    customer.updated_at = new Date();

    await customer.save();

    // Log activity
    const { logActivity } = await import("@/lib/admin-utils");
    await logActivity({
      user_id: new mongoose.Types.ObjectId(session.user.id),
      action: "update_customer",
      entity_type: "Customer",
      entity_id: customer._id,
      changes: {
        before: oldValues,
        after: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          tags: customer.tags,
          notes: customer.notes,
          loyalty_points: customer.loyalty_points,
        },
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        loyalty_points: customer.loyalty_points,
        tags: customer.tags,
        notes: customer.notes,
        total_spent: customer.total_spent,
        purchase_count: customer.purchase_count,
        updated_at: customer.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error updating customer:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Customer with this phone number already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
