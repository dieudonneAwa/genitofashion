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

// Group data by time period
function groupByPeriod(
  data: any[],
  timeframe: string,
  dateField: string = "created_at"
): Record<string, number> {
  const grouped: Record<string, number> = {};

  data.forEach((item) => {
    const itemDate = new Date(item[dateField]);
    let key: string;

    switch (timeframe) {
      case "today":
        key = itemDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        });
        break;
      case "week":
        key = itemDate.toLocaleDateString("en-US", { weekday: "short" });
        break;
      case "month":
        const weekNum = Math.ceil(itemDate.getDate() / 7);
        key = `Week ${weekNum}`;
        break;
      case "quarter":
        key = itemDate.toLocaleDateString("en-US", { month: "short" });
        break;
      case "year":
        const quarter = Math.floor(itemDate.getMonth() / 3) + 1;
        key = `Q${quarter}`;
        break;
      default:
        const weekNumDefault = Math.ceil(itemDate.getDate() / 7);
        key = `Week ${weekNumDefault}`;
    }

    if (!grouped[key]) {
      grouped[key] = 0;
    }
    grouped[key] += item.amount || item.total || 0;
  });

  return grouped;
}

// GET - Get comprehensive financial report
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
    const groupBy = searchParams.get("groupBy") || "period"; // period, category

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
    })
      .sort({ date: 1 })
      .lean();

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

    // Calculate profit margin
    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const netProfitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Group data for charts
    let revenueData: Record<string, number> = {};
    let expenseData: Record<string, number> = {};
    let profitData: Record<string, number> = {};

    if (groupBy === "period") {
      revenueData = groupByPeriod(sales, timeframe, "created_at");
      expenseData = groupByPeriod(expenses, timeframe, "date");

      // Calculate profit by period
      Object.keys(revenueData).forEach((key) => {
        profitData[key] = (revenueData[key] || 0) - (expenseData[key] || 0);
      });
    } else if (groupBy === "category") {
      // Group expenses by category
      expenses.forEach((expense) => {
        if (!expenseData[expense.category]) {
          expenseData[expense.category] = 0;
        }
        expenseData[expense.category] += expense.amount || 0;
      });
    }

    // Expense breakdown by category
    const expenseBreakdown: Record<string, number> = {};
    expenses.forEach((expense) => {
      if (!expenseBreakdown[expense.category]) {
        expenseBreakdown[expense.category] = 0;
      }
      expenseBreakdown[expense.category] += expense.amount || 0;
    });

    // Calculate previous period for comparison
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
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

    const previousRevenue = previousSales.reduce(
      (sum, sale) => sum + (sale.total || 0),
      0
    );
    const previousProfit = previousSales.reduce(
      (sum, sale) => sum + (sale.total_profit || 0),
      0
    );
    const previousExpensesTotal = previousExpenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );
    const previousNetProfit = previousProfit - previousExpensesTotal;

    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;
    const profitGrowth =
      previousProfit > 0
        ? ((totalProfit - previousProfit) / previousProfit) * 100
        : 0;
    const netProfitGrowth =
      previousNetProfit !== 0
        ? ((netProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100
        : 0;

    return NextResponse.json({
      timeframe,
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        totalExpenses,
        netProfit,
        profitMargin: profitMargin.toFixed(2),
        netProfitMargin: netProfitMargin.toFixed(2),
        totalSales,
      },
      growth: {
        revenueGrowth: revenueGrowth.toFixed(1),
        profitGrowth: profitGrowth.toFixed(1),
        netProfitGrowth: netProfitGrowth.toFixed(1),
      },
      charts: {
        revenueData: Object.entries(revenueData).map(([key, value]) => [
          key,
          value,
        ]),
        expenseData: Object.entries(expenseData).map(([key, value]) => [
          key,
          value,
        ]),
        profitData: Object.entries(profitData).map(([key, value]) => [
          key,
          value,
        ]),
      },
      expenseBreakdown: Object.entries(expenseBreakdown).map(
        ([category, amount]) => ({
          category,
          amount,
        })
      ),
    });
  } catch (error: any) {
    console.error("Error fetching financial report:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
