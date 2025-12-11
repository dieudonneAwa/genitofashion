import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Customer } from "@/lib/mongodb/models";
import { Sale } from "@/lib/mongodb/models";

export const dynamic = "force-dynamic";

// GET - Get customer analytics
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

    await connectDB();

    // Get all customers
    const customers = await Customer.find({}).lean();

    // Get all sales with customer information
    const sales = await Sale.find({
      customer_id: { $ne: null },
    })
      .populate("customer_id", "name phone")
      .lean();

    // Calculate customer lifetime value
    const customerLTV: Record<
      string,
      {
        name: string;
        totalSpent: number;
        purchaseCount: number;
        lastPurchase: Date | null;
      }
    > = {};

    sales.forEach((sale) => {
      const customerId = sale.customer_id?.toString();
      if (customerId) {
        if (!customerLTV[customerId]) {
          customerLTV[customerId] = {
            name:
              typeof sale.customer_id === "object" && sale.customer_id
                ? (sale.customer_id as any).name
                : "Unknown",
            totalSpent: 0,
            purchaseCount: 0,
            lastPurchase: null,
          };
        }
        customerLTV[customerId].totalSpent += sale.total || 0;
        customerLTV[customerId].purchaseCount += 1;
        const saleDate = new Date(sale.created_at);
        if (
          !customerLTV[customerId].lastPurchase ||
          saleDate > customerLTV[customerId].lastPurchase!
        ) {
          customerLTV[customerId].lastPurchase = saleDate;
        }
      }
    });

    // Calculate metrics
    const totalCustomers = customers.length;
    const customersWithPurchases = Object.keys(customerLTV).length;
    const repeatCustomers = Object.values(customerLTV).filter(
      (customer) => customer.purchaseCount > 1
    ).length;
    const repeatCustomerRate =
      customersWithPurchases > 0
        ? (repeatCustomers / customersWithPurchases) * 100
        : 0;

    // Average customer lifetime value
    const avgLTV =
      customersWithPurchases > 0
        ? Object.values(customerLTV).reduce(
            (sum, customer) => sum + customer.totalSpent,
            0
          ) / customersWithPurchases
        : 0;

    // Average purchase frequency (purchases per customer)
    const avgPurchaseFrequency =
      customersWithPurchases > 0
        ? Object.values(customerLTV).reduce(
            (sum, customer) => sum + customer.purchaseCount,
            0
          ) / customersWithPurchases
        : 0;

    // Top customers by lifetime value
    const topCustomers = Object.entries(customerLTV)
      .map(([customerId, data]) => ({
        customer_id: customerId,
        name: data.name,
        lifetime_value: data.totalSpent,
        purchase_count: data.purchaseCount,
        last_purchase: data.lastPurchase,
      }))
      .sort((a, b) => b.lifetime_value - a.lifetime_value)
      .slice(0, 10);

    // Customer segmentation
    const segments = {
      vip: topCustomers.slice(0, Math.ceil(topCustomers.length * 0.1)), // Top 10%
      regular: Object.entries(customerLTV)
        .map(([customerId, data]) => ({
          customer_id: customerId,
          name: data.name,
          lifetime_value: data.totalSpent,
          purchase_count: data.purchaseCount,
        }))
        .filter((customer) => {
          const isVIP = topCustomers.some(
            (top) => top.customer_id === customer.customer_id
          );
          return !isVIP && customer.purchase_count > 1;
        }),
      new: Object.entries(customerLTV)
        .map(([customerId, data]) => ({
          customer_id: customerId,
          name: data.name,
          lifetime_value: data.totalSpent,
          purchase_count: data.purchaseCount,
        }))
        .filter((customer) => customer.purchase_count === 1),
    };

    return NextResponse.json({
      totalCustomers,
      customersWithPurchases,
      repeatCustomers,
      repeatCustomerRate: repeatCustomerRate.toFixed(2),
      averageLTV: avgLTV.toFixed(2),
      averagePurchaseFrequency: avgPurchaseFrequency.toFixed(2),
      topCustomers,
      segments: {
        vip: segments.vip.length,
        regular: segments.regular.length,
        new: segments.new.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching customer analytics:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
