import { Skeleton } from "@/components/ui/skeleton"

export function ProductDetailsSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="rounded-lg overflow-hidden bg-champagne/20 dark:bg-richblack/40 p-4">
        <Skeleton className="w-full aspect-square rounded-lg" />
        <div className="flex justify-center mt-4 gap-2">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="w-16 h-16 rounded-md" />
            ))}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <div className="flex items-center mb-2">
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-7 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-6" />
        </div>

        <div>
          <Skeleton className="h-6 w-1/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <div className="pt-6 border-t">
          <div className="flex items-center mb-6">
            <Skeleton className="h-5 w-20 mr-4" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-5 w-24 ml-4" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductReviewsSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {/* Rating Summary Skeleton */}
      <div className="bg-champagne/20 dark:bg-richblack/40 rounded-lg p-6">
        <div className="text-center mb-4">
          <Skeleton className="h-10 w-16 mx-auto mb-2" />
          <Skeleton className="h-5 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <div key={star} className="flex items-center">
              <Skeleton className="w-12 h-4" />
              <Skeleton className="flex-1 mx-2 h-2" />
              <Skeleton className="w-8 h-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List Skeleton */}
      <div className="md:col-span-2 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-start">
              <Skeleton className="h-10 w-10 rounded-full mr-3" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
