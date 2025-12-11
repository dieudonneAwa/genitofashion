import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Product, Customer, Sale } from "@/lib/mongodb/models";

export const dynamic = "force-dynamic";

// Calculate date range
function getDateRange(timeframe: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);

  switch (timeframe) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setDate(now.getDate() - 30);
      break;
    case "quarter":
      startDate.setDate(now.getDate() - 90);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  return { startDate, endDate };
}

// GET - Get products and customers analytics
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
    const timeframe = searchParams.get("timeframe") || "month";

    await connectDB();

    const { startDate, endDate } = getDateRange(timeframe);

    // Get total products count
    const totalProducts = await Product.countDocuments({});

    // Get total customers count within timeframe
    const totalCustomers = await Customer.countDocuments({
      created_at: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Get sales data for products sold
    const sales = await Sale.find({
      created_at: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ created_at: 1 })
      .lean();

    // Get new customers data
    const newCustomers = await Customer.find({
      created_at: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ created_at: 1 })
      .lean();

    // Group data by time period based on timeframe
    let chartData: Array<{
      date: string;
      productsSold: number;
      customers: number;
    }> = [];

    if (timeframe === "today") {
      // Group by hours
      const hourData: Record<
        number,
        { productsSold: number; customers: number }
      > = {};

      sales.forEach((sale) => {
        const hour = new Date(sale.created_at).getHours();
        if (!hourData[hour]) {
          hourData[hour] = { productsSold: 0, customers: 0 };
        }
        hourData[hour].productsSold += sale.items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        );
      });

      newCustomers.forEach((customer) => {
        const hour = new Date(customer.created_at).getHours();
        if (!hourData[hour]) {
          hourData[hour] = { productsSold: 0, customers: 0 };
        }
        hourData[hour].customers += 1;
      });

      chartData = Object.entries(hourData)
        .map(([hour, data]) => ({
          date: `${hour}:00`,
          productsSold: data.productsSold,
          customers: data.customers,
        }))
        .sort((a, b) => parseInt(a.date) - parseInt(b.date));
    } else if (timeframe === "week") {
      // Group by days
      const dayData: Record<
        string,
        { productsSold: number; customers: number }
      > = {};

      sales.forEach((sale) => {
        const date = new Date(sale.created_at);
        const dayKey = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (!dayData[dayKey]) {
          dayData[dayKey] = { productsSold: 0, customers: 0 };
        }
        dayData[dayKey].productsSold += sale.items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        );
      });

      newCustomers.forEach((customer) => {
        const date = new Date(customer.created_at);
        const dayKey = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (!dayData[dayKey]) {
          dayData[dayKey] = { productsSold: 0, customers: 0 };
        }
        dayData[dayKey].customers += 1;
      });

      chartData = Object.entries(dayData)
        .map(([date, data]) => ({
          date,
          productsSold: data.productsSold,
          customers: data.customers,
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    } else if (timeframe === "month") {
      // Group by weeks
      const weekData: Record<
        number,
        { productsSold: number; customers: number }
      > = {};

      sales.forEach((sale) => {
        const date = new Date(sale.created_at);
        const weekNumber =
          Math.floor(
            (date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
          ) + 1;
        if (!weekData[weekNumber]) {
          weekData[weekNumber] = { productsSold: 0, customers: 0 };
        }
        weekData[weekNumber].productsSold += sale.items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        );
      });

      newCustomers.forEach((customer) => {
        const date = new Date(customer.created_at);
        const weekNumber =
          Math.floor(
            (date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
          ) + 1;
        if (!weekData[weekNumber]) {
          weekData[weekNumber] = { productsSold: 0, customers: 0 };
        }
        weekData[weekNumber].customers += 1;
      });

      chartData = Array.from({ length: 4 }, (_, i) => {
        const weekNum = i + 1;
        return {
          date: `Week ${weekNum}`,
          productsSold: weekData[weekNum]?.productsSold || 0,
          customers: weekData[weekNum]?.customers || 0,
        };
      });
    } else if (timeframe === "quarter") {
      // Group by months
      const monthData: Record<
        number,
        { productsSold: number; customers: number }
      > = {};

      sales.forEach((sale) => {
        const date = new Date(sale.created_at);
        const monthNumber =
          Math.floor(
            (date.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
          ) + 1;
        if (!monthData[monthNumber]) {
          monthData[monthNumber] = { productsSold: 0, customers: 0 };
        }
        monthData[monthNumber].productsSold += sale.items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        );
      });

      newCustomers.forEach((customer) => {
        const date = new Date(customer.created_at);
        const monthNumber =
          Math.floor(
            (date.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
          ) + 1;
        if (!monthData[monthNumber]) {
          monthData[monthNumber] = { productsSold: 0, customers: 0 };
        }
        monthData[monthNumber].customers += 1;
      });

      chartData = Array.from({ length: 3 }, (_, i) => {
        const monthNum = i + 1;
        return {
          date: `Month ${monthNum}`,
          productsSold: monthData[monthNum]?.productsSold || 0,
          customers: monthData[monthNum]?.customers || 0,
        };
      });
    } else {
      // Group by quarters
      const quarterData: Record<
        number,
        { productsSold: number; customers: number }
      > = {};

      sales.forEach((sale) => {
        const date = new Date(sale.created_at);
        const quarterNumber =
          Math.floor(
            (date.getTime() - startDate.getTime()) / (90 * 24 * 60 * 60 * 1000)
          ) + 1;
        if (!quarterData[quarterNumber]) {
          quarterData[quarterNumber] = { productsSold: 0, customers: 0 };
        }
        quarterData[quarterNumber].productsSold += sale.items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        );
      });

      newCustomers.forEach((customer) => {
        const date = new Date(customer.created_at);
        const quarterNumber =
          Math.floor(
            (date.getTime() - startDate.getTime()) / (90 * 24 * 60 * 60 * 1000)
          ) + 1;
        if (!quarterData[quarterNumber]) {
          quarterData[quarterNumber] = { productsSold: 0, customers: 0 };
        }
        quarterData[quarterNumber].customers += 1;
      });

      chartData = Array.from({ length: 4 }, (_, i) => {
        const quarterNum = i + 1;
        return {
          date: `Q${quarterNum}`,
          productsSold: quarterData[quarterNum]?.productsSold || 0,
          customers: quarterData[quarterNum]?.customers || 0,
        };
      });
    }

    return NextResponse.json({
      totalProducts,
      totalCustomers,
      chartData,
    });
  } catch (error: any) {
    console.error("Error fetching products and customers analytics:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
