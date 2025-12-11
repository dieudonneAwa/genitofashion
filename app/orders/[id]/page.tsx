"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Package,
  Calendar,
  DollarSign,
  User,
  Phone,
  CreditCard,
  FileText,
  Printer,
} from "lucide-react";
import { motion } from "framer-motion";
import { getProductById } from "@/lib/api";

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  size: string | null;
  unit_price: number;
  discount_percentage: number | null;
  final_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  sale_number: string;
  items: OrderItem[];
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  tax: number;
  discount_amount: number;
  total: number;
  payment_method: string;
  cash_received: number;
  change: number;
  staff_name: string | null;
  created_at: string;
}

export default function OrderDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/orders/${orderId}`)}`);
      return;
    }

    if (status === "authenticated") {
      fetchOrderDetails();
    }
  }, [status, router, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);

        // Fetch product images for each item
        const imagePromises = data.order.items.map(async (item: OrderItem) => {
          try {
            const product = await getProductById(item.product_id);
            if (product) {
              const primaryImage =
                product.images?.find((img) => img.is_primary)?.url ||
                product.images?.[0]?.url ||
                product.image_url ||
                "/placeholder.svg";
              return { productId: item.product_id, image: primaryImage };
            }
          } catch (error) {
            console.error(`Error fetching product ${item.product_id}:`, error);
          }
          return { productId: item.product_id, image: "/placeholder.svg" };
        });

        const images = await Promise.all(imagePromises);
        const imageMap: Record<string, string> = {};
        images.forEach(({ productId, image }) => {
          imageMap[productId] = image;
        });
        setProductImages(imageMap);
      } else if (response.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/orders/${orderId}`)}`);
      } else if (response.status === 403) {
        router.push("/orders");
      } else if (response.status === 404) {
        router.push("/orders");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-9 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!session?.user || !order) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <main className="container mx-auto px-4 py-8 max-w-4xl print-content">
        <div className="mb-8 no-print">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{order.sale_number}</h1>
              <p className="text-muted-foreground">
                Order placed on{" "}
                {new Date(order.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold mb-2">{order.sale_number}</h1>
          <p className="text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Items */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <motion.div
                    key={`${item.product_id}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={productImages[item.product_id] || "/placeholder.svg"}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{item.product_name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                        {item.size && (
                          <span className="px-2 py-0.5 bg-muted rounded">
                            Size: {item.size}
                          </span>
                        )}
                        <span>Qty: {item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.discount_percentage ? (
                          <>
                            <span className="text-lg font-semibold">
                              {item.final_price.toLocaleString()} FCFA
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              {item.unit_price.toLocaleString()} FCFA
                            </span>
                            <span className="text-xs text-gold">
                              ({item.discount_percentage}% off)
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-semibold">
                            {item.unit_price.toLocaleString()} FCFA
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Subtotal: {item.subtotal.toLocaleString()} FCFA
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{order.subtotal.toLocaleString()} FCFA</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{order.tax.toLocaleString()} FCFA</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-gold">
                    <span>Discount</span>
                    <span>-{order.discount_amount.toLocaleString()} FCFA</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-gold">
                      {order.total.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="capitalize">{order.payment_method}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cash Received</span>
                <span>{order.cash_received.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Change</span>
                <span>{order.change.toLocaleString()} FCFA</span>
              </div>
            </CardContent>
          </Card>

          {(order.customer_name || order.customer_phone) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.customer_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customer_name}</span>
                  </div>
                )}
                {order.customer_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customer_phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {order.staff_name && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Processed By</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.staff_name}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </main>
    </>
  );
}

