import { ViewportSection } from "@/components/viewport-section"
import { ProductCardSkeleton } from "@/components/product-card-skeleton"

export default function SearchLoading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-[1300px]">
      <ViewportSection className="mb-8" threshold={0.05}>
        <div>
          <h1 className="mb-2 text-3xl font-bold">Search Results</h1>
          <p className="text-muted-foreground">Browse our collection of quality products</p>
        </div>
      </ViewportSection>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array(8)
          .fill(0)
          .map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
      </div>
    </main>
  )
}
