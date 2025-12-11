import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ViewportSection } from "@/components/viewport-section";
import { ImageGallery } from "@/components/product/image-gallery";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { CountdownTimer } from "@/components/countdown-timer";
import { CallToOrder } from "@/components/call-to-order";
import {
  getProductById,
  getRelatedProducts,
  getProductReviews,
} from "@/lib/api";
import { ProductActions } from "@/components/product-actions";
import { FeaturedProductCard } from "@/components/featured-product-card";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductReviewsSkeleton } from "@/components/product-details-skeleton";
import { isDiscountActive } from "@/lib/utils";
import { ProductReviews } from "@/components/product-reviews";

interface ProductDetailPageProps {
  params: {
    category: string;
    id: string;
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const productId = params.id;

  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  // Parse discount end time if it exists
  const discountEndTime = product.discount_end_time
    ? new Date(product.discount_end_time)
    : null;

  // Check if discount is active
  const hasActiveDiscount = isDiscountActive(
    product.discount,
    product.discount_end_time
  );

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

      <div className="grid gap-8 md:grid-cols-2">
        <ViewportSection threshold={0.1}>
          {product.images && product.images.length > 0 ? (
            <ImageGallery
              images={product.images}
              productName={product.name}
              discount={hasActiveDiscount ? product.discount : null}
              discountEndTime={product.discount_end_time}
              stock={product.stock}
            />
          ) : (
            <div className="rounded-lg overflow-hidden bg-champagne/20 dark:bg-richblack/40 p-4">
              <div className="relative aspect-square">
                <Image
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="w-full h-full object-cover rounded-lg"
                  priority
                />
                {hasActiveDiscount && (
                  <Badge className="absolute top-2 left-2 bg-burgundy text-white">
                    {product.discount}% OFF
                  </Badge>
                )}
                <Badge
                  variant={
                    product.stock > 10
                      ? "secondary"
                      : product.stock > 0
                      ? "outline"
                      : "destructive"
                  }
                  className="absolute top-2 right-2"
                >
                  {product.stock > 10
                    ? "In Stock"
                    : product.stock > 0
                    ? "Low Stock"
                    : "Out of Stock"}
                </Badge>
              </div>
            </div>
          )}
        </ViewportSection>

        <ViewportSection threshold={0.1}>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center mb-2">
                <StarRating rating={product.rating} size="md" />
                <span className="ml-2 text-sm text-muted-foreground">
                  ({product.reviews_count} reviews)
                </span>
              </div>

              {hasActiveDiscount ? (
                <div className="mb-2">
                  <p className="text-2xl font-bold text-gold">
                    {Math.round(
                      product.price * (1 - (product.discount || 0) / 100)
                    ).toLocaleString()}{" "}
                    FCFA
                    <span className="ml-2 text-base line-through text-muted-foreground">
                      {product.price.toLocaleString()} FCFA
                    </span>
                  </p>
                  {discountEndTime && (
                    <CountdownTimer
                      endTime={discountEndTime}
                      className="text-burgundy mt-1"
                    />
                  )}
                </div>
              ) : (
                <p className="text-2xl font-bold text-gold mb-4">
                  {product.price.toLocaleString()} FCFA
                </p>
              )}

              <p className="text-muted-foreground mb-6">
                {product.description}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Features</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {product.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t">
              <ProductActions product={product} />

              {/* Add the Call to Order button */}
              <div className="mt-4">
                <CallToOrder
                  phoneNumber="+237 654 321 098"
                  variant="default"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </ViewportSection>
      </div>

      {/* Reviews Section */}
      <ViewportSection className="mt-16" threshold={0.1}>
        <div className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

          <Suspense fallback={<ProductReviewsSkeleton />}>
            <ProductReviewsWrapper
              productId={productId}
              productName={product.name}
            />
          </Suspense>
        </div>
      </ViewportSection>

      {/* Related Products */}
      <ViewportSection className="mt-16" threshold={0.1}>
        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-lg bg-muted h-80"
                  ></div>
                ))}
            </div>
          }
        >
          <RelatedProducts
            productId={productId}
            categoryId={product.category_id}
          />
        </Suspense>
      </ViewportSection>
    </main>
  );
}

async function ProductReviewsWrapper({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const reviews = await getProductReviews(productId);
  return (
    <ProductReviews
      productId={productId}
      productName={productName}
      initialReviews={reviews}
    />
  );
}

// Separate component for related products to allow for Suspense
async function RelatedProducts({
  productId,
  categoryId,
}: {
  productId: string;
  categoryId: string;
}) {
  const relatedProducts = await getRelatedProducts(productId, categoryId);

  if (relatedProducts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No related products found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {relatedProducts.map((relatedProduct) => (
        <FeaturedProductCard key={relatedProduct.id} product={relatedProduct} />
      ))}
    </div>
  );
}
