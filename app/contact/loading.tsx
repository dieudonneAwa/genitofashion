import { Skeleton } from "@/components/ui/skeleton"
import { ViewportSection } from "@/components/viewport-section"
import { Card, CardContent } from "@/components/ui/card"
import { CTASkeleton } from "@/components/cta-skeleton"

function ContactCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start space-x-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-48 mb-1" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  )
}

export default function ContactLoading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-[1300px]">
      <div className="mb-12 text-center">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-5 w-full max-w-2xl mx-auto" />
      </div>

      <div className="mb-12 grid gap-6 md:grid-cols-2">
        <ViewportSection threshold={0.05}>
          <div className="flex flex-col justify-between h-full">
            <div>
              <Skeleton className="h-8 w-48 mb-6" />
              <div className="mb-6 space-y-4">
                {Array(4)
                  .fill(0)
                  .map((_, index) => (
                    <ContactCardSkeleton key={index} />
                  ))}
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-champagne/20 dark:bg-darkbluegray/40 p-4">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-64 mb-3" />
              <div className="flex space-x-3">
                {Array(4)
                  .fill(0)
                  .map((_, index) => (
                    <Skeleton key={index} className="h-7 w-7 rounded-full" />
                  ))}
              </div>
            </div>
          </div>
        </ViewportSection>

        <ViewportSection threshold={0.05}>
          <Card>
            <CardContent className="p-0">
              <div className="bg-champagne/30 dark:bg-darkbluegray/40 p-6">
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="p-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </ViewportSection>
      </div>

      <ViewportSection className="mb-12" threshold={0.05}>
        <Skeleton className="h-8 w-32 mx-auto mb-6 text-center" />
        <div className="map-container">
          <Skeleton className="w-full h-full" />
        </div>
      </ViewportSection>

      <CTASkeleton />
    </main>
  )
}
