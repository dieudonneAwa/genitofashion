"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag, Plus, History, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { CountdownTimer } from "@/components/countdown-timer";
import { useCart } from "@/context/cart-context";
import { useViewHistoryContext } from "@/context/view-history-context";
import { useToast } from "@/components/ui/use-toast";
import { ViewportSection } from "@/components/viewport-section";
import { isDiscountActive } from "@/lib/utils";

export function ResumeShoppingSection() {
  const { viewHistory, clearViewHistory } = useViewHistoryContext();
  const { addItem, items } = useCart();
  const { toast } = useToast();

  // If no view history, don't render the section
  if (viewHistory.length === 0) {
    return null;
  }

  // Get quantity of product in cart
  const getCartQuantity = (productId: string) => {
    const item = items.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  // Handle adding product to cart
  const handleAddToCart = (product: any, e?: React.MouseEvent) => {
    // Prevent any default behavior
    if (e) e.preventDefault();

    const hasActiveDiscount = isDiscountActive(
      product.discount,
      product.discountEndTime
    );
    const price = hasActiveDiscount
      ? Math.round(product.price * (1 - (product.discount || 0) / 100))
      : product.price;

    addItem({
      id: product.id,
      name: product.name,
      price: price,
      image: product.image,
      quantity: 1,
      category: product.category,
    });

    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart`,
    });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <ViewportSection className="w-full" threshold={0.05}>
      <div className="container mx-auto px-4 py-10 md:py-12 max-w-[1300px]">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-gold" />
            <h2 className="text-3xl font-bold">Resume Shopping</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={clearViewHistory}
          >
            <X className="mr-2 h-4 w-4" />
            Clear History
          </Button>
        </div>
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          {viewHistory.slice(0, 4).map((product) => (
            <motion.div key={product.id} variants={item}>
              <Card className="overflow-hidden transition-all hover:shadow-md border-champagne/20 hover:border-gold">
                <div className="relative">
                  <Link href={`/products/${product.category}/${product.id}`}>
                    <motion.div
                      className="aspect-square overflow-hidden"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        width={400}
                        height={400}
                        className="h-full w-full object-cover transition-transform"
                        loading="lazy"
                      />
                    </motion.div>
                  </Link>
                  {/* Discount badge */}
                  {isDiscountActive(
                    product.discount,
                    product.discountEndTime
                  ) && (
                    <Badge className="absolute top-2 left-2 bg-burgundy text-white">
                      {product.discount}% OFF
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <Link href={`/products/${product.category}/${product.id}`}>
                    <h3 className="mb-1 font-medium">{product.name}</h3>
                  </Link>
                  {/* Rating */}
                  {product.rating && (
                    <div className="flex items-center mb-2">
                      <StarRating rating={product.rating} size="sm" />
                    </div>
                  )}
                  {/* Countdown timer for discounted products */}
                  {isDiscountActive(
                    product.discount,
                    product.discountEndTime
                  ) &&
                    !!product.discountEndTime && (
                      <div className="mb-2">
                        <CountdownTimer
                          endTime={product.discountEndTime}
                          className="text-burgundy"
                        />
                      </div>
                    )}
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      {isDiscountActive(
                        product.discount,
                        product.discountEndTime
                      ) ? (
                        <>
                          <span className="text-lg font-bold text-gold">
                            {Math.round(
                              product.price *
                                (1 - (product.discount || 0) / 100)
                            ).toLocaleString()}{" "}
                            FCFA
                          </span>
                          <span className="ml-2 text-xs line-through text-muted-foreground">
                            {product.price.toLocaleString()} FCFA
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gold">
                          {product.price.toLocaleString()} FCFA
                        </span>
                      )}
                    </div>
                    {getCartQuantity(String(product.id)) > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald/20 text-emerald border-emerald"
                      >
                        {getCartQuantity(String(product.id))} in cart
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald hover:bg-emerald/90 text-white"
                      asChild
                    >
                      <Link
                        href={`/products/${product.category}/${product.id}`}
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" /> Details
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gold text-gold hover:bg-gold/10"
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </ViewportSection>
  );
}
