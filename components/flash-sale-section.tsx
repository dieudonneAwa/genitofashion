"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Zap, ArrowRight } from "lucide-react"
import { ViewportSection } from "@/components/viewport-section"
import { FeaturedProductCard } from "@/components/featured-product-card"
import type { Product } from "@/types/database"
import { ProductCardSkeleton } from "@/components/product-card-skeleton"

export function FlashSaleSection() {
  const [saleProducts, setSaleProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSaleProducts() {
      try {
        const response = await fetch("/api/products/sale")
        if (!response.ok) {
          throw new Error("Failed to fetch sale products")
        }
        const data = await response.json()
        setSaleProducts(data)
      } catch (error) {
        console.error("Exception in fetchSaleProducts:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch sale products")
      } finally {
        setLoading(false)
      }
    }

    fetchSaleProducts()
  }, [])

  if (loading) {
    return (
      <ViewportSection className="w-full" threshold={0.05}>
        <div className="container mx-auto px-4 py-10 md:py-12 max-w-[1300px]">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-gold" />
              <h2 className="text-3xl font-bold">Flash Sale</h2>
            </div>
            <div className="flex items-center text-sm font-medium text-gold hover:text-gold/80">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array(4)
              .fill(0)
              .map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
          </div>
        </div>
      </ViewportSection>
    )
  }

  if (error) {
    return (
      <ViewportSection className="w-full" threshold={0.05}>
        <div className="container mx-auto px-4 py-10 md:py-12 max-w-[1300px]">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-gold" />
              <h2 className="text-3xl font-bold">Flash Sale</h2>
            </div>
          </div>
          <div className="bg-champagne/20 dark:bg-darkbluegray/40 rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Currently Unavailable</h3>
              <p className="text-muted-foreground">
                We're experiencing technical difficulties loading sale products. Please check back later.
              </p>
              {process.env.NODE_ENV === "development" && (
                <div className="mt-4 p-4 bg-destructive/10 rounded-md max-w-md mx-auto">
                  <p className="text-sm font-medium text-destructive">Developer Info:</p>
                  <p className="text-xs text-destructive mt-1">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ViewportSection>
    )
  }

  if (saleProducts.length === 0 && !loading) {
    return null
  }

  return (
    <ViewportSection className="w-full" threshold={0.05}>
      <div className="container mx-auto px-4 py-10 md:py-12 max-w-[1300px]">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-gold" />
            <h2 className="text-3xl font-bold">Flash Sale</h2>
          </div>
          <Link
            href="/search?discounts=true"
            className="flex items-center text-sm font-medium text-gold hover:text-gold/80"
          >
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {saleProducts.map((product) => (
            <FeaturedProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </ViewportSection>
  )
}
