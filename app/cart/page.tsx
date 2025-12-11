"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, X, Loader2, LogIn, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ViewportSection } from "@/components/viewport-section"
import { useCart } from "@/context/cart-context"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { CallToOrder } from "@/components/call-to-order"

export default function CartPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const { toast } = useToast()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleCheckout = () => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/cart")}`)
      toast({
        title: "Sign in required",
        description: "Please sign in to complete your purchase.",
        variant: "default",
      })
      return
    }

    setIsCheckingOut(true)

    setTimeout(() => {
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your purchase.",
      })
      clearCart()
      setIsCheckingOut(false)
    }, 2000)
  }

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(id)
      return
    }

    setIsUpdating(id)

    await new Promise((resolve) => setTimeout(resolve, 300))

    updateQuantity(id, newQuantity)
    setIsUpdating(null)
  }

  const handleRemoveItem = async (id: string) => {
    setIsUpdating(id)

    await new Promise((resolve) => setTimeout(resolve, 300))

    removeItem(id)
    setIsUpdating(null)
  }

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-[1300px]">
        <div className="mb-8">
          <Link
            href="/products"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-gold"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </div>

        <Card className="mx-auto max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>Your Cart is Empty</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6 flex justify-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            </div>
            <p className="mb-6 text-muted-foreground">Looks like you haven't added any products to your cart yet.</p>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-[1300px]">
      <div className="mb-8">
        <Link
          href="/products"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Your Shopping Cart</h1>

      {!session && status !== "loading" && (
        <Alert className="mb-6 border-gold/30 bg-gold/5">
          <Lock className="h-4 w-4 text-gold" />
          <AlertTitle>Sign in to checkout</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">You need to sign in to complete your purchase and access order history.</p>
            <Button asChild size="sm" className="bg-gold text-richblack hover:bg-gold/90">
              <Link href={`/login?callbackUrl=${encodeURIComponent("/cart")}`}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in to continue
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <ViewportSection threshold={0.1}>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <CardTitle className="text-lg sm:text-xl">Cart Items ({items.length})</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive text-sm"
                    onClick={clearCart}
                    disabled={isCheckingOut}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Cart
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 border-b last:border-b-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Image and Product Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-md overflow-hidden bg-champagne/20 dark:bg-richblack/40">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.category}/${item.id}`}>
                            <h3 className="font-medium text-sm sm:text-base truncate">{item.name}</h3>
                          </Link>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {item.price.toLocaleString()} FCFA
                          </p>
                          {/* Mobile: Show total price here */}
                          <p className="text-sm sm:hidden font-medium mt-2">
                            Total: {(item.price * item.quantity).toLocaleString()} FCFA
                          </p>
                        </div>
                      </div>

                      {/* Quantity Controls and Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={isUpdating === item.id || isCheckingOut}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 sm:w-8 text-center text-sm">
                            {isUpdating === item.id ? (
                              <Loader2 className="h-4 w-4 mx-auto animate-spin" />
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={isUpdating === item.id || isCheckingOut}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Desktop: Total Price */}
                        <div className="hidden sm:block text-right min-w-[100px]">
                          <p className="font-medium text-sm sm:text-base">
                            {(item.price * item.quantity).toLocaleString()} FCFA
                          </p>
                        </div>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isUpdating === item.id || isCheckingOut}
                        >
                          {isUpdating === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </ViewportSection>
        </div>

        <ViewportSection threshold={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{total.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{total.toLocaleString()} FCFA</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              {!session && status !== "loading" ? (
                <motion.div className="w-full" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    className="w-full bg-gold hover:bg-gold/90 text-richblack text-lg py-6"
                    onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent("/cart")}`)}
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign in to Checkout
                  </Button>
                </motion.div>
              ) : (
                <motion.div className="w-full" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    className="w-full bg-emerald hover:bg-emerald/90 text-white text-lg py-6"
                    onClick={handleCheckout}
                    disabled={isCheckingOut || status === "loading"}
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Checkout & Pay"
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Add Call to Order option */}
              <div className="text-center text-sm text-muted-foreground">
                <span>Prefer to order by phone?</span>
                <div className="mt-2">
                  <CallToOrder phoneNumber="+237 654 321 098" variant="prominent" />
                </div>
              </div>
            </CardFooter>
          </Card>
        </ViewportSection>
      </div>
    </main>
  )
}
