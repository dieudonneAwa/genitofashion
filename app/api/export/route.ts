import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Sale } from "@/lib/mongodb/models";
import { Product } from "@/lib/mongodb/models";
import { Customer } from "@/lib/mongodb/models";
import { Expense } from "@/lib/mongodb/models";

export const dynamic = "force-dynamic";

// Convert data to CSV format
function convertToCSV(data: any[], headers: string[]): string {
  const rows = data.map((row) =>
    headers.map((header) => {
      const value = row[header];
      // Handle nested objects and arrays
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return JSON.stringify(value);
      // Escape quotes and wrap in quotes if contains comma or newline
      const stringValue = String(value);
      if (
        stringValue.includes(",") ||
        stringValue.includes("\n") ||
        stringValue.includes('"')
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
  );

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

// GET - Export data to CSV
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
    const type = searchParams.get("type"); // sales, products, customers, expenses
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (
      !type ||
      !["sales", "products", "customers", "expenses"].includes(type)
    ) {
      return NextResponse.json(
        {
          error:
            "Valid export type is required (sales, products, customers, expenses)",
        },
        { status: 400 }
      );
    }

    await connectDB();

    let data: any[] = [];
    let headers: string[] = [];
    let filename = "";

    switch (type) {
      case "sales": {
        const query: any = {};
        if (startDate || endDate) {
          query.created_at = {};
          if (startDate) query.created_at.$gte = new Date(startDate);
          if (endDate) query.created_at.$lte = new Date(endDate);
        }

        const sales = await Sale.find(query)
          .populate("customer_id", "name phone")
          .sort({ created_at: -1 })
          .lean();

        data = sales.map((sale) => ({
          sale_number: sale.sale_number,
          date: new Date(sale.created_at).toISOString(),
          customer_name:
            sale.customer_name ||
            (typeof sale.customer_id === "object" && sale.customer_id
              ? (sale.customer_id as any).name
              : null) ||
            "",
          customer_phone:
            sale.customer_phone ||
            (typeof sale.customer_id === "object" && sale.customer_id
              ? (sale.customer_id as any).phone
              : null) ||
            "",
          items_count: sale.items.length,
          subtotal: sale.subtotal,
          tax: sale.tax,
          discount_amount: sale.discount_amount,
          total: sale.total,
          total_cost: sale.total_cost,
          total_profit: sale.total_profit,
          payment_method: sale.payment_method,
          cash_received: sale.cash_received,
          change: sale.change,
          staff_name: sale.staff_name || "",
        }));

        headers = [
          "Sale Number",
          "Date",
          "Customer Name",
          "Customer Phone",
          "Items Count",
          "Subtotal",
          "Tax",
          "Discount Amount",
          "Total",
          "Total Cost",
          "Total Profit",
          "Payment Method",
          "Cash Received",
          "Change",
          "Staff Name",
        ];
        filename = `sales_export_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }

      case "products": {
        const products = await Product.find({})
          .populate("category_id", "name")
          .sort({ created_at: -1 })
          .lean();

        data = products.map((product) => ({
          name: product.name,
          price: product.price,
          purchase_price: product.purchase_price,
          stock: product.stock,
          category:
            typeof product.category_id === "object" && product.category_id
              ? (product.category_id as any).name
              : "N/A",
          brand: product.brand || "",
          description: product.description || "",
          created_at: new Date(product.created_at).toISOString(),
        }));

        headers = [
          "Name",
          "Price",
          "Purchase Price",
          "Stock",
          "Category",
          "Brand",
          "Description",
          "Created At",
        ];
        filename = `products_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;
      }

      case "customers": {
        const customers = await Customer.find({})
          .sort({ created_at: -1 })
          .lean();

        data = customers.map((customer) => ({
          name: customer.name,
          phone: customer.phone,
          email: customer.email || "",
          address: customer.address || "",
          total_spent: customer.total_spent,
          purchase_count: customer.purchase_count,
          loyalty_points: customer.loyalty_points || 0,
          last_purchase_date: customer.last_purchase_date
            ? new Date(customer.last_purchase_date).toISOString()
            : "",
          created_at: new Date(customer.created_at).toISOString(),
        }));

        headers = [
          "Name",
          "Phone",
          "Email",
          "Address",
          "Total Spent",
          "Purchase Count",
          "Loyalty Points",
          "Last Purchase Date",
          "Created At",
        ];
        filename = `customers_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;
      }

      case "expenses": {
        const query: any = {};
        if (startDate || endDate) {
          query.date = {};
          if (startDate) query.date.$gte = new Date(startDate);
          if (endDate) query.date.$lte = new Date(endDate);
        }

        const expenses = await Expense.find(query)
          .populate("staff_id", "name")
          .sort({ date: -1 })
          .lean();

        data = expenses.map((expense) => ({
          expense_number: expense.expense_number,
          category: expense.category,
          amount: expense.amount,
          description: expense.description || "",
          date: new Date(expense.date).toISOString(),
          staff_name:
            typeof expense.staff_id === "object" && expense.staff_id
              ? (expense.staff_id as any).name
              : "N/A",
          receipt_url: expense.receipt_url || "",
          created_at: new Date(expense.created_at).toISOString(),
        }));

        headers = [
          "Expense Number",
          "Category",
          "Amount",
          "Description",
          "Date",
          "Staff Name",
          "Receipt URL",
          "Created At",
        ];
        filename = `expenses_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;
      }
    }

    const csv = convertToCSV(data, headers);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
