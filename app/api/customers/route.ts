import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Customer } from "@/lib/mongodb/models";
import { Sale } from "@/lib/mongodb/models";
import mongoose from "mongoose";

// GET - List customers with pagination and search
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin" && session.user.role !== "staff") {
      return NextResponse.json(
        { error: "Forbidden: Admin or staff access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    await connectDB();

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Customer.countDocuments(query);

    // Fetch customers
    const customers = await Customer.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      customers: customers.map((customer) => ({
        id: typeof customer._id === "object" && customer._id !== null && "toString" in customer._id
          ? customer._id.toString()
          : String(customer._id),
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        loyalty_points: customer.loyalty_points || 0,
        tags: customer.tags || [],
        notes: customer.notes,
        total_spent: customer.total_spent || 0,
        purchase_count: customer.purchase_count || 0,
        last_purchase_date: customer.last_purchase_date,
        created_at: customer.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST - Create new customer
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin" && session.user.role !== "staff") {
      return NextResponse.json(
        { error: "Forbidden: Admin or staff access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, phone, email, address, tags, notes } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if customer with phone already exists
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return NextResponse.json(
        { error: "Customer with this phone number already exists" },
        { status: 400 }
      );
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || undefined,
      address: address?.trim() || undefined,
      tags: Array.isArray(tags) ? tags : [],
      notes: notes?.trim() || undefined,
      loyalty_points: 0,
      total_spent: 0,
      purchase_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Log activity
    const { logActivity } = await import("@/lib/admin-utils");
    await logActivity({
      user_id: new mongoose.Types.ObjectId(session.user.id),
      action: "create_customer",
      entity_type: "Customer",
      entity_id: customer._id,
      changes: { after: { name, phone, email } },
    });

    return NextResponse.json(
      {
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
          created_at: customer.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating customer:", error);
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

