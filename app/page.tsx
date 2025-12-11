import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ViewportSection } from "@/components/viewport-section"
import { FlashSaleSection } from "@/components/flash-sale-section"
import { ResumeShoppingSection } from "@/components/resume-shopping-section"
import { CallToOrder } from "@/components/call-to-order"
import { LoginCTABanner } from "@/components/login-cta-banner"
import { getCategories, getFeaturedProducts } from "@/lib/api"
import { FeaturedProductCard } from "@/components/featured-product-card"
import { ProductCardSkeleton } from "@/components/product-card-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"

function CategorySkeleton() {
  return (
    <Card className="transition-all border-champagne/20">
      <CardContent className="flex flex-col items-center p-6 text-center">
        <Skeleton className="h-12 w-12 rounded-full mb-2" />
        <Skeleton className="h-5 w-20" />
      </CardContent>
    </Card>
  )
}

function CategoriesSection() {
  return (
    <ViewportSection className="w-full" threshold={0.05}>
      <div className="container mx-auto px-4 py-10 md:py-12 max-w-[1300px]">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Categories</h2>
          <Link href="/products" className="flex items-center text-sm font-medium text-gold hover:text-gold/80">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <CategorySkeleton key={index} />
            ))}
        </div>
      </div>
    </ViewportSection>
  )
}

function FeaturedProductsSection() {
  return (
    <ViewportSection className="w-full" threshold={0.05}>
      <div className="container mx-auto px-4 py-10 md:py-12 max-w-[1300px]">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <Link href="/products" className="flex items-center text-sm font-medium text-gold hover:text-gold/80">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
        </div>
      </div>
    </ViewportSection>
  )
}

async function CategoriesContent() {
  try {
    const categories = await getCategories()

    if (!categories || categories.length === 0) {
      return (
        <div className="container mx-auto px-4 py-10 md:py-12 max-w-[1300px]">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Categories</h2>
            <p className="text-muted-foreground">No categories available at the moment.</p>
          </div>
        </div>
      )
    }

    return (
      <ViewportSection className="w-full" threshold={0.05}>
        <div className="container mx-auto px-4 py-10 md:py-12 max-w-[1300px]">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Categories</h2>
            <Link href="/products" className="flex items-center text-sm font-medium text-gold hover:text-gold/80">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {categories.map((category) => (
              <div key={category.slug}>
                <Link href={`/search?category=${category.slug}`}>
                  <Card className="transition-all hover:shadow-md border-champagne/20 hover:border-gold">
                    <CardContent className="flex flex-col items-center p-6 text-center">
                      <span className="mb-2 text-4xl">{category.icon}</span>
                      <h3 className="text-lg font-medium">{category.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </ViewportSection>
    )
  } catch (error) {
    console.error("Error loading categories:", error)
    return (
      <div className="container mx-auto px-4 py-10 md:py-12 max-w-[1300px]">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Categories</h2>
          <p className="text-muted-foreground">Unable to load categories at this time.</p>
        </div>
      </div>
    )
  }
}

async function FeaturedProductsContent() {
  try {
    const featuredProducts = await getFeaturedProducts()

    if (!featuredProducts || featuredProducts.length === 0) {
      return (
        <div className="container mx-auto px-4 py-10 md:py-12 max-w-[1300px]">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-muted-foreground">No featured products available at the moment.</p>
          </div>
        </div>
      )
    }

    return (
      <ViewportSection className="w-full" threshold={0.05}>
        <div className="container mx-auto px-4 py-10 md:py-12 max-w-[1300px]">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Link href="/products" className="flex items-center text-sm font-medium text-gold hover:text-gold/80">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <FeaturedProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </ViewportSection>
    )
  } catch (error) {
    console.error("Error loading featured products:", error)
    return (
      <div className="container mx-auto px-4 py-10 md:py-12 max-w-[1300px]">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
          <p className="text-muted-foreground">Unable to load featured products at this time.</p>
        </div>
      </div>
    )
  }
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative w-full text-white min-h-[500px] flex items-center">
        {/* Background image using Next.js Image */}
        <Image
          src="/images/hero-background.jpeg"
          alt="Office background"
          fill
          priority
          className="object-cover object-center"
        />

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-richblack/70 dark:bg-darkbluegray/80 z-10"></div>

        <div className="container relative z-20 mx-auto px-4 py-16 md:py-24 max-w-[1300px]">
          <div className="max-w-3xl">
            <h1 className="mb-6 text-4xl font-bold md:text-6xl">
              Elevate Your Wardrobe with{" "}
              <span className="text-gold">Genito Fashion</span>
            </h1>
            <p className="mb-8 text-lg md:text-xl text-champagne">
              Discover our collection of shoes, clothes, perfumes, and
              accessories at prices 15-30% lower than competitors.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                variant="outline"
                className="border-gold text-gold hover:bg-gold/10"
                asChild
              >
                <Link href="/products">Shop Now</Link>
              </Button>

              {/* Add Call to Order button */}
              <CallToOrder phoneNumber="+237 654 321 098" variant="prominent" />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent z-20"></div>
      </section>

      {/* Login CTA Banner - Shows for unauthenticated users */}
      <div className="container mx-auto px-4 py-6 max-w-[1300px]">
        <LoginCTABanner />
      </div>

      {/* Flash Sale Section */}
      <FlashSaleSection />

      {/* Resume Shopping Section - Only shows if user has view history */}
      <ResumeShoppingSection />

      {/* Categories Section with Suspense */}
      <Suspense fallback={<CategoriesSection />}>
        <CategoriesContent />
      </Suspense>

      {/* Featured Products Section with Suspense */}
      <Suspense fallback={<FeaturedProductsSection />}>
        <FeaturedProductsContent />
      </Suspense>

      {/* Call to Action */}
      <ViewportSection
        className="mb-12 rounded-lg bg-champagne/30 dark:bg-richblack/40 p-6 text-center max-w-[1300px] mx-auto w-full"
        threshold={0.1}
      >
        <h2 className="mb-4 text-3xl font-bold">
          Visit Genito Fashion in Buea
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground">
          Experience our products in person at our store in Untarred Malingo
          Street, Molyko. Our friendly staff is ready to help you find exactly
          what you're looking for at the best prices in town.
        </p>
        <Button
          size="sm"
          className="bg-burgundy hover:bg-burgundy/90 text-white"
          asChild
        >
          <Link href="/contact">Contact Us</Link>
        </Button>
      </ViewportSection>
    </main>
  );
}
