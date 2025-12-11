import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Settings } from "@/lib/mongodb/models";
import { getSettings, updateSettings } from "@/lib/admin-utils";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// GET - Get all settings or specific setting
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      // Get specific setting
      const value = await getSettings(key);
      return NextResponse.json({ key, value });
    } else {
      // Get all settings
      const settings = await Settings.find({}).lean();
      const settingsMap: Record<string, any> = {};
      settings.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });
      return NextResponse.json({ settings: settingsMap });
    }
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

// PUT - Update setting
export async function PUT(request: Request) {
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

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Setting key is required" },
        { status: 400 }
      );
    }

    await connectDB();

    await updateSettings(
      key,
      value,
      new mongoose.Types.ObjectId(session.user.id)
    );

    return NextResponse.json({
      success: true,
      message: "Setting updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating setting:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
