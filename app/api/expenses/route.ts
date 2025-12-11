import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Expense } from "@/lib/mongodb/models";
import { generateExpenseNumber, logActivity } from "@/lib/admin-utils";
import mongoose from "mongoose";

// GET - List expenses with pagination and filters
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const skip = (page - 1) * limit;

    await connectDB();

    // Build query
    const query: any = {};
    if (category) {
      query.category = category;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await Expense.countDocuments(query);

    // Fetch expenses
    const expenses = await Expense.find(query)
      .populate("staff_id", "name email")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      expenses: expenses.map((expense: any) => ({
        id: String(expense._id),
        expense_number: expense.expense_number,
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
        staff_id: expense.staff_id,
        staff_name:
          typeof expense.staff_id === "object" && expense.staff_id
            ? (expense.staff_id as any).name
            : null,
        receipt_url: expense.receipt_url,
        created_at: expense.created_at,
        updated_at: expense.updated_at,
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
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST - Create new expense
export async function POST(request: Request) {
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
    const { category, amount, description, date, receipt_url } = body;

    if (!category || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Category and amount are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Generate expense number
    const expenseNumber = await generateExpenseNumber();

    const expense = await Expense.create({
      expense_number: expenseNumber,
      category,
      amount: Number(amount),
      description: description?.trim() || undefined,
      date: date ? new Date(date) : new Date(),
      staff_id: new mongoose.Types.ObjectId(session.user.id),
      receipt_url: receipt_url || undefined,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Log activity
    await logActivity({
      user_id: new mongoose.Types.ObjectId(session.user.id),
      action: "create_expense",
      entity_type: "Expense",
      entity_id: expense._id,
      changes: {
        after: {
          expense_number: expenseNumber,
          category,
          amount,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        expense: {
          id: expense._id.toString(),
          expense_number: expense.expense_number,
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          date: expense.date,
          created_at: expense.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
