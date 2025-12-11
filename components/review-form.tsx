"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface ReviewFormProps {
  productId: string;
  productName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewSubmitted?: () => void;
}

export function ReviewForm({
  productId,
  productName,
  open,
  onOpenChange,
  onReviewSubmitted,
}: ReviewFormProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setRating(0);
    setComment("");
    setHoveredRating(0);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please write a comment",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      toast({
        title: "Review Submitted",
        description: "Thank you for your review!",
      });

      setRating(0);
      setComment("");
      setHoveredRating(0);
      onOpenChange(false);

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Write a Customer Review</DialogTitle>
          <DialogDescription>
            {productName
              ? `Share your thoughts about ${productName}`
              : "Share your thoughts with other customers"}
          </DialogDescription>
        </DialogHeader>

        {status === "loading" ? (
          <div className="py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted w-1/4 rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-10 bg-muted w-1/3 rounded"></div>
            </div>
          </div>
        ) : !session?.user ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Please log in to write a review
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" asChild>
                <Link href="/login" onClick={() => onOpenChange(false)}>
                  Log In
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register" onClick={() => onOpenChange(false)}>
                  Sign Up
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="rating">
                Overall Rating <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                    disabled={isSubmitting}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= displayRating
                          ? "fill-gold text-gold"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
                {displayRating > 0 && (
                  <span className="ml-2 text-sm font-medium text-muted-foreground">
                    {displayRating} {displayRating === 1 ? "star" : "stars"}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">
                Add a written review <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product. What did you like or dislike about it?"
                className="min-h-[150px]"
                disabled={isSubmitting}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {comment.length}/1000 characters
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || rating === 0 || !comment.trim()}
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

