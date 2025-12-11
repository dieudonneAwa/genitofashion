import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Sale } from "@/lib/mongodb/models";
import { Product } from "@/lib/mongodb/models";

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

// GET - Get sales analytics
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
    const metric = searchParams.get("metric") || "all"; // all, top_products, by_category, trends, peak_hours, avg_transaction

    await connectDB();

    const { startDate, endDate } = getDateRange(timeframe);

    // Fetch sales within the date range
    const sales = await Sale.find({
      created_at: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .populate("items.product_id", "name category_id")
      .sort({ created_at: 1 })
      .lean();

    const response: any = {};

    // Top selling products
    if (metric === "all" || metric === "top_products") {
      const productSales: Record<
        string,
        { name: string; quantity: number; revenue: number }
      > = {};

      sales.forEach((sale) => {
        sale.items.forEach((item: any) => {
          const productId = item.product_id?.toString() || item.product_id;
          const productName =
            typeof item.product_id === "object" && item.product_id
              ? (item.product_id as any).name
              : item.product_name;

          if (!productSales[productId]) {
            productSales[productId] = {
              name: productName,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[productId].quantity += item.quantity;
          productSales[productId].revenue += item.subtotal;
        });
      });

      response.topProducts = Object.entries(productSales)
        .map(([id, data]) => ({
          product_id: id,
          product_name: data.name,
          quantity_sold: data.quantity,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.quantity_sold - a.quantity_sold)
        .slice(0, 10);
    }

    // Sales trends
    if (metric === "all" || metric === "trends") {
      const trends: Record<string, { sales: number; revenue: number }> = {};

      sales.forEach((sale) => {
        const saleDate = new Date(sale.created_at);
        let key: string;

        switch (timeframe) {
          case "today":
            key = saleDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              hour12: false,
            });
            break;
          case "week":
            key = saleDate.toLocaleDateString("en-US", { weekday: "short" });
            break;
          case "month":
            const day = saleDate.getDate();
            key = `Day ${day}`;
            break;
          case "quarter":
            key = saleDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            break;
          case "year":
            key = saleDate.toLocaleDateString("en-US", { month: "short" });
            break;
          default:
            const dayDefault = saleDate.getDate();
            key = `Day ${dayDefault}`;
        }

        if (!trends[key]) {
          trends[key] = { sales: 0, revenue: 0 };
        }
        trends[key].sales += 1;
        trends[key].revenue += sale.total || 0;
      });

      response.trends = Object.entries(trends)
        .map(([period, data]) => ({
          period,
          sales_count: data.sales,
          revenue: data.revenue,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    }

    // Peak sales hours
    if (metric === "all" || metric === "peak_hours") {
      const hourSales: Record<number, number> = {};

      sales.forEach((sale) => {
        const hour = new Date(sale.created_at).getHours();
        hourSales[hour] = (hourSales[hour] || 0) + 1;
      });

      response.peakHours = Object.entries(hourSales)
        .map(([hour, count]) => ({
          hour: parseInt(hour, 10),
          sales_count: count,
        }))
        .sort((a, b) => b.sales_count - a.sales_count)
        .slice(0, 5);
    }

    // Average transaction value
    if (metric === "all" || metric === "avg_transaction") {
      const totalRevenue = sales.reduce(
        (sum, sale) => sum + (sale.total || 0),
        0
      );
      const totalSales = sales.length;
      response.averageTransactionValue =
        totalSales > 0 ? totalRevenue / totalSales : 0;
      response.totalTransactions = totalSales;
      response.totalRevenue = totalRevenue;
    }

    // Sales by category (if products have categories)
    if (metric === "all" || metric === "by_category") {
      const categorySales: Record<string, { sales: number; revenue: number }> =
        {};

      sales.forEach((sale) => {
        sale.items.forEach((item: any) => {
          const categoryId =
            typeof item.product_id === "object" && item.product_id
              ? (item.product_id as any).category_id?.toString()
              : null;

          if (categoryId) {
            if (!categorySales[categoryId]) {
              categorySales[categoryId] = { sales: 0, revenue: 0 };
            }
            categorySales[categoryId].sales += item.quantity;
            categorySales[categoryId].revenue += item.subtotal;
          }
        });
      });

      // Fetch category names
      const categories = await Product.distinct("category_id");
      const categoryMap: Record<string, string> = {};

      for (const catId of categories) {
        const product = await Product.findOne({ category_id: catId })
          .populate("category_id", "name")
          .lean();
        if (
          product &&
          !Array.isArray(product) &&
          typeof product.category_id === "object" &&
          product.category_id
        ) {
          categoryMap[catId.toString()] =
            (product.category_id as any).name || "Unknown";
        }
      }

      response.categorySales = Object.entries(categorySales)
        .map(([categoryId, data]) => ({
          category_id: categoryId,
          category_name: categoryMap[categoryId] || "Unknown",
          quantity_sold: data.sales,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error fetching sales analytics:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
