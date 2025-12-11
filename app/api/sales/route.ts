import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/mongodb/connection";
import { Sale, Product } from "@/lib/mongodb/models";
import { Customer } from "@/lib/mongodb/models";
import { User } from "@/lib/mongodb/models/auth";
import mongoose from "mongoose";
import { isDiscountActive } from "@/lib/utils";
import { logStockMovement, logActivity } from "@/lib/admin-utils";

// Note: Transactions require a MongoDB replica set.
// For standalone instances, we use atomic operations with findOneAndUpdate.

// Generate unique sale number
async function generateSaleNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SALE-${year}-`;

  // Find the latest sale number for this year
  const latestSale = await Sale.findOne({
    sale_number: { $regex: `^${prefix}` },
  })
    .sort({ sale_number: -1 })
    .select("sale_number")
    .lean();

  let sequence = 1;
  if (latestSale) {
    const saleData = latestSale as any;
    const lastSequence = parseInt(saleData.sale_number.replace(prefix, ""), 10);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
}

// POST - Create a new sale
export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      items,
      customer_name,
      customer_phone,
      customer_email,
      tax = 0,
      cash_received,
    } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Sale must have at least one item" },
        { status: 400 }
      );
    }

    if (!cash_received || cash_received < 0) {
      return NextResponse.json(
        { error: "Cash received amount is required and must be positive" },
        { status: 400 }
      );
    }

    await connectDB();

    // Process items and calculate totals
    const processedItems = [];
    let subtotal = 0;
    let totalDiscountAmount = 0;
    let totalCost = 0;
    let totalProfit = 0;
    const productUpdates: Array<{
      product: any;
      quantity: number;
      size?: string;
    }> = [];

    // First pass: Validate all items and calculate totals
    for (const item of items) {
      const product = await Product.findById(item.id).lean();

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.id} not found` },
          { status: 404 }
        );
      }

      const productData = product as any;

      // Check stock availability - handle size-based inventory
      if (item.size && productData.stock_by_size) {
        // Convert Map to object if needed, or use as-is if already an object
        // When using .lean(), MongoDB returns Map as a plain object, but we handle both cases
        let stockBySize: Record<string, number>;
        if (productData.stock_by_size instanceof Map) {
          stockBySize = Object.fromEntries(productData.stock_by_size);
        } else if (
          productData.stock_by_size &&
          typeof productData.stock_by_size === "object"
        ) {
          stockBySize = productData.stock_by_size as Record<string, number>;
        } else {
          stockBySize = {};
        }

        // Try both string and number keys (in case size is stored as number)
        const sizeStock =
          stockBySize[item.size] ||
          stockBySize[String(item.size)] ||
          stockBySize[Number(item.size)] ||
          0;

        // Debug logging (can be removed in production)
        if (sizeStock === 0) {
          console.log(
            `Stock check for ${productData.name} (Size ${item.size}):`,
            {
              stockBySize,
              requestedSize: item.size,
              availableSizes: Object.keys(stockBySize),
              sizeStock,
            }
          );
        }

        if (sizeStock < item.quantity) {
          return NextResponse.json(
            {
              error: `Insufficient stock for ${productData.name} (Size ${
                item.size
              }). Available: ${sizeStock}, Requested: ${
                item.quantity
              }. Available sizes: ${Object.keys(stockBySize).join(", ")}`,
            },
            { status: 400 }
          );
        }
      } else if (productData.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${productData.name}. Available: ${productData.stock}, Requested: ${item.quantity}`,
          },
          { status: 400 }
        );
      }

      // Get purchase price (default to 0 if not set)
      const purchasePrice = productData.purchase_price || 0;

      // Check if discount is active
      const hasActiveDiscount = isDiscountActive(
        productData.discount,
        productData.discount_end_time
      );
      const discountPercentage = hasActiveDiscount
        ? productData.discount
        : null;
      const finalPrice = hasActiveDiscount
        ? Math.round(
            productData.price * (1 - (productData.discount || 0) / 100)
          )
        : productData.price;
      const itemSubtotal = finalPrice * item.quantity;
      const originalSubtotal = productData.price * item.quantity;
      const itemDiscountAmount = originalSubtotal - itemSubtotal;

      // Calculate cost and profit for this item
      const itemCost = purchasePrice * item.quantity;
      const itemProfit = itemSubtotal - itemCost;

      subtotal += itemSubtotal;
      totalDiscountAmount += itemDiscountAmount;
      totalCost += itemCost;
      totalProfit += itemProfit;

      processedItems.push({
        product_id: productData._id,
        product_name: productData.name,
        quantity: item.quantity,
        size: item.size || undefined,
        unit_price: productData.price,
        purchase_price: purchasePrice,
        discount_percentage: discountPercentage,
        final_price: finalPrice,
        subtotal: itemSubtotal,
        cost: itemCost,
        profit: itemProfit,
      });

      // Store product update info with size (need to fetch again without lean for updates)
      const productForUpdate = await Product.findById(item.id);
      if (!productForUpdate) {
        return NextResponse.json(
          { error: `Product ${item.id} not found for update` },
          { status: 404 }
        );
      }
      productUpdates.push({
        product: productForUpdate,
        quantity: item.quantity,
        size: item.size,
      });
    }

    const total = subtotal + tax;
    const change = cash_received - total;

    if (change < 0) {
      return NextResponse.json(
        {
          error: `Insufficient cash. Total: ${total.toLocaleString()} FCFA, Received: ${cash_received.toLocaleString()} FCFA`,
        },
        { status: 400 }
      );
    }

    // Generate sale number
    const saleNumber = await generateSaleNumber();

    // Handle customer lookup/creation
    let customerId: mongoose.Types.ObjectId | null = null;
    if (customer_phone) {
      let customer = await Customer.findOne({ phone: customer_phone.trim() });
      if (customer) {
        customerId = customer._id;
        // Update customer stats
        customer.total_spent += total;
        customer.purchase_count += 1;
        customer.last_purchase_date = new Date();
        customer.updated_at = new Date();
        await customer.save();
      } else if (customer_name) {
        // Create new customer
        customer = await Customer.create({
          name: customer_name.trim(),
          phone: customer_phone.trim(),
          email: customer_email?.trim() || null,
          total_spent: total,
          purchase_count: 1,
          last_purchase_date: new Date(),
          loyalty_points: 0,
          tags: [],
          created_at: new Date(),
          updated_at: new Date(),
        });
        customerId = customer._id;
      }
    }

    // Link sale to User account if email or phone matches
    let userId: mongoose.Types.ObjectId | null = null;
    if (customer_email) {
      const user = await User.findOne({
        email: customer_email.trim().toLowerCase(),
      });
      if (user) {
        userId = user._id;
      }
    } else if (customer_phone) {
      const user = await User.findOne({
        phone: customer_phone.trim(),
      });
      if (user) {
        userId = user._id;
      }
    }

    try {
      // Create sale record first
      const sale = await Sale.create({
        sale_number: saleNumber,
        items: processedItems,
        customer_id: customerId,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        user_id: userId,
        subtotal,
        tax,
        discount_amount: totalDiscountAmount,
        total,
        total_cost: totalCost,
        total_profit: totalProfit,
        payment_method: "cash",
        cash_received,
        change,
        staff_id: new mongoose.Types.ObjectId(session.user.id),
        staff_name: session.user.name || null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Update product stock and log stock movements
      for (const { product, quantity, size } of productUpdates) {
        const updateData: any = {
          $inc: { stock: -quantity },
          updated_at: new Date(),
        };

        // If size is specified and product has size-based inventory, update that size's stock
        if (size && product.stock_by_size) {
          // Convert Map to object if needed to check if size exists
          const stockBySize =
            product.stock_by_size instanceof Map
              ? Object.fromEntries(product.stock_by_size)
              : product.stock_by_size;

          if (stockBySize[size] !== undefined) {
            const sizeKey = `stock_by_size.${size}`;
            updateData.$inc[sizeKey] = -quantity;
          }
        }

        await Product.findByIdAndUpdate(product._id, updateData, { new: true });

        // Log stock movement
        await logStockMovement({
          product_id: product._id,
          size: size,
          quantity_change: -quantity,
          reason: "sale",
          reference_id: sale._id,
          staff_id: new mongoose.Types.ObjectId(session.user.id),
          notes: `Sale ${saleNumber}`,
        });
      }

      // Log activity
      await logActivity({
        user_id: new mongoose.Types.ObjectId(session.user.id),
        action: "complete_sale",
        entity_type: "Sale",
        entity_id: sale._id,
        changes: {
          after: {
            sale_number: sale.sale_number,
            total: sale.total,
            items_count: sale.items.length,
          },
        },
      });

      return NextResponse.json(
        {
          success: true,
          sale: {
            id: sale._id.toString(),
            sale_number: sale.sale_number,
            items: sale.items,
            customer_id: sale.customer_id ? sale.customer_id.toString() : null,
            customer_name: sale.customer_name,
            customer_phone: sale.customer_phone,
            subtotal: sale.subtotal,
            tax: sale.tax,
            discount_amount: sale.discount_amount,
            total: sale.total,
            total_cost: sale.total_cost,
            total_profit: sale.total_profit,
            payment_method: sale.payment_method,
            cash_received: sale.cash_received,
            change: sale.change,
            staff_name: sale.staff_name,
            created_at: sale.created_at,
          },
        },
        { status: 201 }
      );
    } catch (error: any) {
      // If sale creation fails, we don't need to rollback stock
      // If stock update fails, the sale is already created (could add cleanup logic here)
      throw error;
    }
  } catch (error: any) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

// GET - Fetch sales history
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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    await connectDB();

    // Build query for date filtering if provided
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const query: any = {};

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
    const total = await Sale.countDocuments(query);

    // Fetch sales
    const sales = await Sale.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      sales: sales.map((sale: any) => ({
        id: String(sale._id),
        sale_number: sale.sale_number,
        items: sale.items,
        customer_name: sale.customer_name,
        customer_phone: sale.customer_phone,
        subtotal: sale.subtotal,
        tax: sale.tax,
        discount_amount: sale.discount_amount,
        total: sale.total,
        total_cost: sale.total_cost,
        total_profit: sale.total_profit,
        payment_method: sale.payment_method,
        cash_received: sale.cash_received,
        change: sale.change,
        staff_name: sale.staff_name,
        created_at: sale.created_at,
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
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
