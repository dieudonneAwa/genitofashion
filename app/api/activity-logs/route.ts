import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { ActivityLog } from "@/lib/mongodb/models";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// GET - List activity logs with filters
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
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const skip = (page - 1) * limit;

    await connectDB();

    // Build query
    const query: any = {};
    if (userId) {
      query.user_id = new mongoose.Types.ObjectId(userId);
    }
    if (action) {
      query.action = action;
    }
    if (entityType) {
      query.entity_type = entityType;
    }
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) {
        query.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        query.created_at.$lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await ActivityLog.countDocuments(query);

    // Fetch activity logs
    const logs = await ActivityLog.find(query)
      .populate("user_id", "name email")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: String(log._id),
        user_id: log.user_id,
        user_name:
          typeof log.user_id === "object" && log.user_id
            ? (log.user_id as any).name
            : null,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id ? String(log.entity_id) : null,
        changes: log.changes,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
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
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
