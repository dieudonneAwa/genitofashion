import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function CartItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-2">
      <Skeleton className="h-20 w-20 rounded-md" />
      <div className="flex-1">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/3 mb-2" />
      </div>
      <div className="flex items-center">
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div className="text-right min-w-[80px]">
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  )
}

export function CartSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(3)
                .fill(0)
                .map((_, index) => (
                  <CartItemSkeleton key={index} />
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
          </CardContent>
          <div className="p-4 pt-0">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="text-center">
              <Skeleton className="h-4 w-48 mx-auto mb-2" />
              <Skeleton className="h-10 w-full mx-auto" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
