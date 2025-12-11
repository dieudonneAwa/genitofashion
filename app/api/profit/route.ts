import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Sale } from "@/lib/mongodb/models";
import { Expense } from "@/lib/mongodb/models";

export const dynamic = "force-dynamic";

// Calculate date range based on timeframe
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

// Group sales by time period for chart data
function groupSalesByPeriod(
  sales: any[],
  timeframe: string
): Array<[string, number]> {
  const grouped: Record<string, number> = {};

  sales.forEach((sale) => {
    const saleDate = new Date(sale.created_at);
    let key: string;

    switch (timeframe) {
      case "today":
        key = saleDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        });
        break;
      case "week":
        key = saleDate.toLocaleDateString("en-US", { weekday: "short" });
        break;
      case "month":
        const weekNum = Math.ceil(saleDate.getDate() / 7);
        key = `Week ${weekNum}`;
        break;
      case "quarter":
        key = saleDate.toLocaleDateString("en-US", { month: "short" });
        break;
      case "year":
        const quarter = Math.floor(saleDate.getMonth() / 3) + 1;
        key = `Q${quarter}`;
        break;
      default:
        const weekNumDefault = Math.ceil(saleDate.getDate() / 7);
        key = `Week ${weekNumDefault}`;
    }

    if (!grouped[key]) {
      grouped[key] = 0;
    }
    grouped[key] += sale.total_profit || 0;
  });

  // Convert to array and sort
  return Object.entries(grouped)
    .map(([key, value]) => [key, value] as [string, number])
    .sort((a, b) => {
      // Simple sorting - for better results, you might want to parse dates
      return a[0].localeCompare(b[0]);
    });
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "month";

    await connectDB();

    const { startDate, endDate } = getDateRange(timeframe);

    // Fetch sales within the date range
    const sales = await Sale.find({
      created_at: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ created_at: 1 })
      .lean();

    // Fetch expenses within the date range
    const expenses = await Expense.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).lean();

    // Calculate totals
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + (sale.total || 0),
      0
    );
    const totalCost = sales.reduce(
      (sum, sale) => sum + (sale.total_cost || 0),
      0
    );
    const totalProfit = sales.reduce(
      (sum, sale) => sum + (sale.total_profit || 0),
      0
    );
    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );
    const netProfit = totalProfit - totalExpenses;
    const totalSales = sales.length;

    // Calculate profit growth (compare with previous period)
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);

    // Calculate previous period duration
    const periodDuration = endDate.getTime() - startDate.getTime();
    previousStartDate.setTime(startDate.getTime() - periodDuration);
    previousEndDate.setTime(startDate.getTime());

    const previousSales = await Sale.find({
      created_at: {
        $gte: previousStartDate,
        $lt: previousEndDate,
      },
    }).lean();

    const previousExpenses = await Expense.find({
      date: {
        $gte: previousStartDate,
        $lt: previousEndDate,
      },
    }).lean();

    const previousProfit = previousSales.reduce(
      (sum, sale) => sum + (sale.total_profit || 0),
      0
    );
    const previousExpensesTotal = previousExpenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );
    const previousNetProfit = previousProfit - previousExpensesTotal;

    const profitGrowth =
      previousProfit > 0
        ? ((totalProfit - previousProfit) / previousProfit) * 100
        : 0;

    const netProfitGrowth =
      previousNetProfit !== 0
        ? ((netProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100
        : 0;

    // Group sales for chart data
    const chartData = groupSalesByPeriod(sales, timeframe);

    return NextResponse.json({
      timeframe,
      totalRevenue,
      totalCost,
      totalProfit,
      totalExpenses,
      netProfit,
      totalSales,
      profitGrowth: profitGrowth.toFixed(1),
      netProfitGrowth: netProfitGrowth.toFixed(1),
      chartData,
    });
  } catch (error: any) {
    console.error("Error fetching profit data:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
