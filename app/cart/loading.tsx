import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CartSkeleton } from "@/components/cart-skeleton"

export default function CartLoading() {
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

      <h1 className="text-3xl font-bold mb-8">Your Shopping Cart</h1>

      <CartSkeleton />
    </main>
  )
}
