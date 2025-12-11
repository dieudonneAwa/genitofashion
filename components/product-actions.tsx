"use client";

import type React from "react";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/components/ui/use-toast";
import { isDiscountActive } from "@/lib/utils";
import type { Product } from "@/types/database";

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  // Check if discount is active
  const hasActiveDiscount = isDiscountActive(
    product.discount,
    product.discount_end_time
  );

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    } else {
      toast({
        title: "Maximum stock reached",
        description: `Only ${product.stock} items available`,
      });
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    // Prevent any default form submission behavior
    if (e) e.preventDefault();

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
        quantity: quantity,
        category: product.category?.slug || "",
      });

      toast({
        title: "Added to cart",
        description: `${quantity} × ${product.name} added to your cart`,
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    // Prevent any default form submission behavior
    if (e) e.preventDefault();

    setIsBuyingNow(true);

    try {
      const price = hasActiveDiscount
        ? Math.round(product.price * (1 - (product.discount || 0) / 100))
        : product.price;

      // Simulate a delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Add the item to cart
      addItem({
        id: product.id,
        name: product.name,
        price: price,
        image: product.image_url || "",
        quantity: quantity,
        category: product.category?.slug || "",
      });

      // Redirect to cart page
      window.location.href = "/cart";
    } finally {
      setIsBuyingNow(false);
    }
  };

  return (
    <>
      <div className="flex items-center mb-6">
        <span className="mr-4 font-medium">Quantity:</span>
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={decreaseQuantity}
            disabled={quantity <= 1 || isAddingToCart || isBuyingNow}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={increaseQuantity}
            disabled={
              quantity >= product.stock || isAddingToCart || isBuyingNow
            }
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <span className="ml-4 text-sm text-muted-foreground">
          {product.stock} available
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <motion.div
          className="flex-1"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            className="w-full bg-emerald hover:bg-emerald/90 text-white"
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isAddingToCart || isBuyingNow}
          >
            {isAddingToCart ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Add to Cart
              </>
            )}
          </Button>
        </motion.div>
        <motion.div
          className="flex-1"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            variant="outline"
            className="w-full border-gold text-gold hover:bg-gold/10"
            onClick={handleBuyNow}
            disabled={product.stock === 0 || isAddingToCart || isBuyingNow}
          >
            {isBuyingNow ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Buy Now"
            )}
          </Button>
        </motion.div>
      </div>
    </>
  );
}
