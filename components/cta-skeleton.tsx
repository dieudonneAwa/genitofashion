import { Skeleton } from "@/components/ui/skeleton"
import { ViewportSection } from "@/components/viewport-section"

export function CTASkeleton() {
  return (
    <ViewportSection
      className="mb-12 rounded-lg bg-champagne/30 dark:bg-richblack/40 p-6 text-center max-w-[1300px] mx-auto w-full"
      threshold={0.1}
    >
      <Skeleton className="h-8 w-1/2 mx-auto mb-4" />
      <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
      <Skeleton className="h-4 w-2/3 mx-auto mb-6" />
      <Skeleton className="h-9 w-32 mx-auto" />
    </ViewportSection>
  )
}
