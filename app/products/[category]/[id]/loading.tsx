import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProductDetailsSkeleton, ProductReviewsSkeleton } from "@/components/product-details-skeleton"
import { ProductCardSkeleton } from "@/components/product-card-skeleton"
import { ViewportSection } from "@/components/viewport-section"

export default function ProductDetailLoading() {
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

      <ProductDetailsSkeleton />

      {/* Reviews Section Skeleton */}
      <ViewportSection className="mt-16" threshold={0.1}>
        <div className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          <ProductReviewsSkeleton />
        </div>
      </ViewportSection>

      {/* Related Products Skeleton */}
      <ViewportSection className="mt-16" threshold={0.1}>
        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
        </div>
      </ViewportSection>
    </main>
  )
}
