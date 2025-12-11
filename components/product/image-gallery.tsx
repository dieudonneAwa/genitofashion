"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isDiscountActive } from "@/lib/utils";
import type { ProductImage } from "@/types/database";

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
  discount?: number | null;
  discountEndTime?: string | null;
  stock?: number;
}

export function ImageGallery({
  images,
  productName,
  discount,
  discountEndTime,
  stock,
}: ImageGalleryProps) {
  // Check if discount is active
  const hasActiveDiscount = isDiscountActive(discount, discountEndTime);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sort images by order, with primary first
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.order - b.order;
  });

  const currentImage = sortedImages[currentIndex] || sortedImages[0];

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === sortedImages.length - 1 ? 0 : prev + 1
    );
  };

  if (!currentImage) {
    return (
      <div className="rounded-lg overflow-hidden bg-champagne/20 dark:bg-richblack/40 p-4 aspect-square flex items-center justify-center">
        <p className="text-muted-foreground">No image available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative rounded-lg overflow-hidden bg-champagne/20 dark:bg-richblack/40 p-4 aspect-square">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage.url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full z-0"
          >
            <Image
              src={currentImage.url}
              alt={`${productName} - Image ${currentIndex + 1}`}
              fill
              className="object-cover rounded-lg pointer-events-none"
              priority={currentIndex === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {sortedImages.length > 1 && (
          <>
            <button
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 h-8 w-8 rounded-full border border-input bg-background/80 hover:bg-background backdrop-blur-sm transition-colors inline-flex items-center justify-center text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToPrevious();
              }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 h-8 w-8 rounded-full border border-input bg-background/80 hover:bg-background backdrop-blur-sm transition-colors inline-flex items-center justify-center text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {sortedImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-xs">
            {currentIndex + 1} / {sortedImages.length}
          </div>
        )}

        {/* Discount Badge */}
        {hasActiveDiscount && (
          <div className="absolute top-2 left-2 bg-burgundy text-white px-2 py-1 rounded text-sm font-medium">
            {discount}% OFF
          </div>
        )}

        {/* Stock Badge */}
        {stock !== undefined && (
          <div
            className={`absolute top-2 right-2 px-2 py-1 rounded text-sm font-medium ${
              stock > 10
                ? "bg-emerald text-white"
                : stock > 0
                ? "bg-yellow-500 text-white"
                : "bg-destructive text-white"
            }`}
          >
            {stock > 10 ? "In Stock" : stock > 0 ? "Low Stock" : "Out of Stock"}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {sortedImages.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.public_id || index}
              onClick={() => setCurrentIndex(index)}
              className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                currentIndex === index
                  ? "border-gold ring-2 ring-gold/50"
                  : "border-transparent hover:border-muted-foreground/50"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image.url}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 20vw"
              />
              {image.is_primary && (
                <div className="absolute top-1 right-1 bg-gold text-richblack rounded-full p-0.5">
                  <svg
                    className="h-2 w-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
