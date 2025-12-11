import { Skeleton } from "@/components/ui/skeleton"
import { ViewportSection } from "@/components/viewport-section"
import { Card, CardContent } from "@/components/ui/card"
import { CTASkeleton } from "@/components/cta-skeleton"

function FeatureCardSkeleton() {
  return (
    <Card className="h-full transition-all border-champagne/20">
      <CardContent className="p-6 text-center">
        <Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
        <Skeleton className="mb-2 h-5 w-24 mx-auto" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </CardContent>
    </Card>
  )
}

export default function AboutLoading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-[1300px]">
      <div className="mb-12 text-center">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-5 w-full max-w-2xl mx-auto" />
      </div>

      <ViewportSection className="mb-12 grid gap-6 md:grid-cols-2 md:items-center" threshold={0.1}>
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-6" />

          <div className="space-y-3">
            <div className="flex items-center">
              <Skeleton className="h-5 w-5 mr-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center">
              <Skeleton className="h-5 w-5 mr-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center">
              <Skeleton className="h-5 w-5 mr-2" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex items-center">
              <Skeleton className="h-5 w-5 mr-2" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-champagne/20 dark:bg-richblack/40 p-4">
          <Skeleton className="w-full aspect-video rounded-lg" />
        </div>
      </ViewportSection>

      <ViewportSection className="mb-12" threshold={0.1}>
        <Skeleton className="h-8 w-64 mx-auto mb-8 text-center" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <FeatureCardSkeleton key={index} />
            ))}
        </div>
      </ViewportSection>

      <CTASkeleton />
    </main>
  )
}
