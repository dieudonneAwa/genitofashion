import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Expense } from "@/lib/mongodb/models";
import { logActivity } from "@/lib/admin-utils";
import mongoose from "mongoose";

// GET - Get expense details
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

    const expense = await Expense.findById(params.id)
      .populate("staff_id", "name email")
      .lean();

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const expenseData = expense as any;
    return NextResponse.json({
      expense: {
        id: String(expenseData._id),
        expense_number: expenseData.expense_number,
        category: expenseData.category,
        amount: expenseData.amount,
        description: expenseData.description,
        date: expenseData.date,
        staff_id: expenseData.staff_id,
        staff_name:
          typeof expenseData.staff_id === "object" && expenseData.staff_id
            ? (expenseData.staff_id as any).name
            : null,
        receipt_url: expenseData.receipt_url,
        created_at: expenseData.created_at,
        updated_at: expenseData.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update expense
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
    const { category, amount, description, date, receipt_url } = body;

    await connectDB();

    const expense = await Expense.findById(params.id);
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Store old values for activity log
    const oldValues = {
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
    };

    // Update fields
    if (category !== undefined) expense.category = category;
    if (amount !== undefined) expense.amount = Number(amount);
    if (description !== undefined)
      expense.description = description?.trim() || undefined;
    if (date !== undefined) expense.date = new Date(date);
    if (receipt_url !== undefined)
      expense.receipt_url = receipt_url || undefined;
    expense.updated_at = new Date();

    await expense.save();

    // Log activity
    await logActivity({
      user_id: new mongoose.Types.ObjectId(session.user.id),
      action: "update_expense",
      entity_type: "Expense",
      entity_id: expense._id,
      changes: {
        before: oldValues,
        after: {
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          date: expense.date,
        },
      },
    });

    return NextResponse.json({
      success: true,
      expense: {
        id: expense._id.toString(),
        expense_number: expense.expense_number,
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
        updated_at: expense.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete expense
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const expense = await Expense.findById(params.id);
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await Expense.findByIdAndDelete(params.id);

    // Log activity
    await logActivity({
      user_id: new mongoose.Types.ObjectId(session.user.id),
      action: "delete_expense",
      entity_type: "Expense",
      entity_id: expense._id,
    });

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
