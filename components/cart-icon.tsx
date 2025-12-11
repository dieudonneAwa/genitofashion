"use client"

import { ShoppingCart } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export function CartIcon() {
  const { itemCount } = useCart()

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button variant="outline" size="icon" className="relative h-8 w-8 border-gold text-gold hover:bg-gold/10" asChild>
        <Link href="/cart">
          <ShoppingCart className="h-4 w-4" />
          <AnimatePresence>
            {itemCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-burgundy text-[10px] font-bold text-white"
              >
                {itemCount}
              </motion.div>
            )}
          </AnimatePresence>
          <span className="sr-only">Shopping Cart</span>
        </Link>
      </Button>
    </motion.div>
  )
}
