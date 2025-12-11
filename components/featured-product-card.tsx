"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/components/ui/use-toast";
import { isDiscountActive } from "@/lib/utils";
import type { Product } from "@/types/database";

interface FeaturedProductCardProps {
  product: Product;
  loading?: boolean;
}

export function FeaturedProductCard({
  product,
  loading = false,
}: FeaturedProductCardProps) {
  const { addItem, items } = useCart();
  const { toast } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Check if discount is active
  const hasActiveDiscount = isDiscountActive(
    product.discount,
    product.discount_end_time
  );

  // Get quantity of product in cart
  const getCartQuantity = (productId: string) => {
    const item = items.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  // Handle adding product to cart
  const handleAddToCart = async (e: React.MouseEvent) => {
    // Prevent any default behavior
    e.preventDefault();

    setIsAddingToCart(true);

    try {
      const price = hasActiveDiscount
        ? Math.round(product.price * (1 - (product.discount || 0) / 100))
        : product.price;

      // Simulate a delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 500));

      addItem({
        id: product.id,
        name: product.name,
        price: price,
        image: product.image_url || "",
        quantity: 1,
        category: product.category?.slug || "",
      });

      toast({
        title: "Added to cart",
        description: (
          <div className="flex flex-col">
            <span>{product.name} added to your cart</span>
            <Button
              variant="link"
              className="p-0 h-auto text-sm text-gold justify-start"
              onClick={() => (window.location.href = "/cart")}
            >
              Go to cart
            </Button>
          </div>
        ),
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden transition-all hover:shadow-md border-champagne/20 hover:border-gold">
        <div className="relative">
          <Link href={`/products/${product.category?.slug}/${product.id}`}>
            <motion.div
              className="aspect-square overflow-hidden"
              whileHover={{ scale: 1.05 }}
            >
              <Image
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                width={400}
                height={400}
                className="h-full w-full object-cover transition-transform"
                loading="lazy"
              />
            </motion.div>
          </Link>
          {/* Discount badge */}
          {hasActiveDiscount && (
            <Badge className="absolute top-2 left-2 bg-burgundy text-white">
              {product.discount}% OFF
            </Badge>
          )}
          {/* Stock badge */}
          <Badge
            variant={
              product.stock > 10
                ? "secondary"
                : product.stock > 0
                ? "outline"
                : "destructive"
            }
            className="absolute top-2 right-2"
          >
            {product.stock > 10
              ? "In Stock"
              : product.stock > 0
              ? "Low Stock"
              : "Out of Stock"}
          </Badge>
        </div>
        <CardContent className="p-4">
          <Link href={`/products/${product.category?.slug}/${product.id}`}>
            <h3 className="mb-1 font-medium">{product.name}</h3>
          </Link>
          {/* Rating */}
          <div className="flex items-center mb-2">
            <StarRating rating={product.rating} size="sm" />
          </div>
          <div className="flex justify-between items-center mb-3">
            {hasActiveDiscount ? (
              <div>
                <span className="text-lg font-bold text-gold">
                  {Math.round(
                    product.price * (1 - (product.discount || 0) / 100)
                  ).toLocaleString()}{" "}
                  FCFA
                </span>
                <span className="ml-2 text-xs line-through text-muted-foreground">
                  {product.price.toLocaleString()} FCFA
                </span>
              </div>
            ) : (
              <p className="text-lg font-bold text-gold">
                {product.price.toLocaleString()} FCFA
              </p>
            )}
            {getCartQuantity(product.id) > 0 && (
              <Badge
                variant="secondary"
                className="bg-emerald/20 text-emerald border-emerald"
              >
                {getCartQuantity(product.id)} in cart
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-emerald hover:bg-emerald/90 text-white"
              asChild
            >
              <Link href={`/products/${product.category?.slug}/${product.id}`}>
                <ShoppingBag className="mr-2 h-4 w-4" /> Details
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-gold text-gold hover:bg-gold/10"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAddingToCart}
            >
              {isAddingToCart ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
