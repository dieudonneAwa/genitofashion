"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { ReviewForm } from "@/components/review-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { Pencil } from "lucide-react";

interface Review {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  comment: string;
  date: string;
  avatar_url: string | null;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
  productName?: string;
  initialReviews?: Review[];
}

export function ProductReviews({
  productId,
  productName,
  initialReviews = [],
}: ProductReviewsProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (refreshKey > 0) {
      fetchReviews();
    }
  }, [refreshKey, productId]);

  const handleReviewSubmitted = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const ratingCounts = [0, 0, 0, 0, 0];
  reviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[5 - review.rating]++;
    }
  });

  const totalReviews = reviews.length;
  const ratingPercentages = ratingCounts.map((count) =>
    totalReviews > 0 ? (count / totalReviews) * 100 : 0
  );

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  const hasUserReviewed = session?.user
    ? reviews.some(
        (review) =>
          review.user_name === session.user?.name ||
          review.user_name === session.user?.email
      )
    : false;

  return (
    <div className="space-y-8">
      <ReviewForm
        productId={productId}
        productName={productName}
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        onReviewSubmitted={handleReviewSubmitted}
      />

      <div className="grid gap-8 md:grid-cols-3">
        <div className="bg-champagne/20 dark:bg-richblack/40 rounded-lg p-6 space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gold">
              {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
            </div>
            <div className="flex justify-center my-2">
              <StarRating rating={averageRating} size="md" />
            </div>
            <div className="text-sm text-muted-foreground">
              Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </div>
          </div>

          {!hasUserReviewed && (
            <div className="pt-4 border-t">
              <Button
                onClick={() => setIsReviewDialogOpen(true)}
                className="w-full gap-2"
                variant="outline"
              >
                <Pencil className="h-4 w-4" />
                Write a Customer Review
              </Button>
            </div>
          )}

          {totalReviews > 0 && (
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center">
                  <div className="w-12 text-sm">{star} stars</div>
                  <div className="flex-1 mx-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold"
                      style={{ width: `${ratingPercentages[5 - star]}%` }}
                    ></div>
                  </div>
                  <div className="w-8 text-xs text-right text-muted-foreground">
                    {ratingCounts[5 - star]}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-4">
          {!session?.user && (
            <div className="mb-4">
              <Button
                onClick={() => setIsReviewDialogOpen(true)}
                className="gap-2"
                variant="outline"
              >
                <Pencil className="h-4 w-4" />
                Write a Customer Review
              </Button>
            </div>
          )}
          {session?.user && !hasUserReviewed && (
            <div className="mb-4">
              <Button
                onClick={() => setIsReviewDialogOpen(true)}
                className="gap-2"
                variant="outline"
              >
                <Pencil className="h-4 w-4" />
                Write a Customer Review
              </Button>
            </div>
          )}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-champagne/20">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <Skeleton className="h-10 w-10 rounded-full mr-3" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <Card
                key={review.id}
                className="border-champagne/20 hover:border-gold/30 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className="mr-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                        <Image
                          src={
                            review.avatar_url ||
                            "/placeholder.svg?height=40&width=40"
                          }
                          alt={review.user_name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{review.user_name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="mb-2">
                        <StarRating
                          rating={review.rating}
                          size="sm"
                          showValue={false}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No reviews yet for this product.</p>
              <p className="text-xs mt-1">Be the first to review!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

