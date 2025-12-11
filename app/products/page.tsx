"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { StarRating } from "@/components/star-rating";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/components/ui/use-toast";
import { CallToOrderBanner } from "@/components/call-to-order-banner";
import { ViewportSection } from "@/components/viewport-section";
import { FeaturedProductCard } from "@/components/featured-product-card";
import { ProductCardSkeleton } from "@/components/product-card-skeleton";
import { isDiscountActive } from "@/lib/utils";

function ProductsLoading() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array(8)
        .fill(0)
        .map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const { addItem, items } = useCart();
  const { toast } = useToast();
  const initialRender = useRef(true);

  // Product data
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 40000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [showDiscountsOnly, setShowDiscountsOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    deals: true,
    rating: true,
    brands: true,
    categories: true,
    size: true,
    gender: true,
    color: true,
  });

  // Fetch categories from API
  useEffect(() => {
    async function fetchCategories() {
      try {
        const categoriesResponse = await fetch("/api/categories");
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          if (
            categoriesData.categories &&
            Array.isArray(categoriesData.categories)
          ) {
            setCategoriesList(
              categoriesData.categories.map((cat: any) => cat.slug || cat.name)
            );
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, []);

  // Fetch filter options from products based on current filters
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const params = new URLSearchParams();

        const categoriesToUse =
          selectedCategories.length > 0
            ? selectedCategories
            : categoryParam
            ? [categoryParam]
            : [];
        categoriesToUse.forEach((category) => {
          params.append("category", category);
        });

        if (priceRange[0] > 0) {
          params.append("minPrice", priceRange[0].toString());
        }
        if (priceRange[1] < 40000) {
          params.append("maxPrice", priceRange[1].toString());
        }

        if (minRating > 0) {
          params.append("minRating", minRating.toString());
        }

        if (showDiscountsOnly) {
          params.append("discountsOnly", "true");
        }

        params.append("limit", "1000");

        const response = await fetch(`/api/products?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          const products = data.products || (Array.isArray(data) ? data : []);

          const uniqueBrands = [
            ...new Set(
              products
                .map((p: any) => p.brand)
                .filter((b: any) => b && typeof b === "string" && b.trim())
            ),
          ].sort() as string[];
          setBrands(uniqueBrands);

          const sizeSet = new Set<string>();
          products.forEach((p: any) => {
            if (p.size && typeof p.size === "string" && p.size.trim()) {
              sizeSet.add(p.size.trim());
            }
            if (p.stock_by_size && typeof p.stock_by_size === "object") {
              Object.keys(p.stock_by_size).forEach((size) => {
                if (size && size.trim()) {
                  sizeSet.add(size.trim());
                }
              });
            }
          });
          const uniqueSizes = Array.from(sizeSet).sort();
          setSizes(uniqueSizes);

          const uniqueColors = [
            ...new Set(
              products
                .map((p: any) => p.color)
                .filter((c: any) => c && typeof c === "string" && c.trim())
            ),
          ].sort() as string[];
          setColors(uniqueColors);

          const uniqueGenders = [
            ...new Set(
              products
                .map((p: any) => p.gender)
                .filter((g: any) => g && typeof g === "string" && g.trim())
            ),
          ].sort() as string[];
          setGenders(uniqueGenders);
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    }
    fetchFilterOptions();
  }, [
    selectedCategories,
    categoryParam,
    priceRange,
    minRating,
    showDiscountsOnly,
  ]);

  // Handle URL category parameter
  useEffect(() => {
    if (categoryParam && initialRender.current) {
      setSelectedCategories([categoryParam]);
      setCurrentPage(1);
      initialRender.current = false;
    }
  }, [categoryParam]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    priceRange,
    selectedCategories,
    selectedBrands,
    selectedSizes,
    selectedColors,
    selectedGender,
    minRating,
    showDiscountsOnly,
    categoryParam,
  ]);

  // Fetch filtered products from API
  useEffect(() => {
    async function fetchFilteredProducts() {
      try {
        setLoadingProducts(true);

        const params = new URLSearchParams();

        const categoriesToUse =
          selectedCategories.length > 0
            ? selectedCategories
            : categoryParam
            ? [categoryParam]
            : [];
        categoriesToUse.forEach((category) => {
          params.append("category", category);
        });

        if (priceRange[0] > 0) {
          params.append("minPrice", priceRange[0].toString());
        }
        if (priceRange[1] < 40000) {
          params.append("maxPrice", priceRange[1].toString());
        }

        if (minRating > 0) {
          params.append("minRating", minRating.toString());
        }

        if (showDiscountsOnly) {
          params.append("discountsOnly", "true");
        }

        selectedBrands.forEach((brand) => {
          params.append("brand", brand);
        });

        selectedSizes.forEach((size) => {
          params.append("size", size);
        });

        if (selectedGender) {
          params.append("gender", selectedGender);
        }

        selectedColors.forEach((color) => {
          params.append("color", color);
        });

        params.append("page", currentPage.toString());
        params.append("limit", "20");
        params.append("sortBy", "newest");

        const response = await fetch(`/api/products?${params.toString()}`);

        if (response.ok) {
          const data = await response.json();
          if (data.products && data.pagination) {
            setFilteredProducts(data.products);
            setPagination(data.pagination);
          } else if (Array.isArray(data)) {
            setFilteredProducts(data);
            setPagination({
              page: 1,
              limit: data.length,
              total: data.length,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            });
          }
        } else {
          console.error("Failed to fetch products");
          setFilteredProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setFilteredProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchFilteredProducts();
  }, [
    priceRange,
    selectedCategories,
    selectedBrands,
    selectedSizes,
    selectedColors,
    selectedGender,
    minRating,
    showDiscountsOnly,
    currentPage,
    categoryParam,
  ]);

  // Toggle filter section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setPriceRange([0, 40000]);
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedGender(null);
    setMinRating(0);
    setShowDiscountsOnly(false);
    setCurrentPage(1);
  };

  // Count active filters
  const activeFilterCount = [
    selectedBrands.length > 0,
    selectedCategories.length > 0,
    selectedSizes.length > 0,
    selectedColors.length > 0,
    selectedGender !== null,
    minRating > 0,
    showDiscountsOnly,
    priceRange[0] > 0 || priceRange[1] < 40000,
  ].filter(Boolean).length;

  // Helper function to render filter content
  function renderFilterContent() {
    return (
      <div className="space-y-6">
        {/* Price Range Filter */}
        <div className="border-b border-champagne/20 dark:border-gray-700 pb-4">
          <button
            className="flex w-full items-center justify-between text-sm font-medium mb-2"
            onClick={() => toggleSection("price")}
          >
            Price Range (FCFA)
            {expandedSections.price ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.price && (
            <div className="space-y-4">
              <Slider
                value={[priceRange[0], priceRange[1]]}
                onValueChange={(value) =>
                  setPriceRange([value[0], value[1]] as [number, number])
                }
                min={0}
                max={40000}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{priceRange[0].toLocaleString()} FCFA</span>
                <span>{priceRange[1].toLocaleString()} FCFA</span>
              </div>
            </div>
          )}
        </div>

        {/* Discounts Filter */}
        <div className="border-b border-champagne/20 dark:border-gray-700 pb-4">
          <button
            className="flex w-full items-center justify-between text-sm font-medium mb-2"
            onClick={() => toggleSection("deals")}
          >
            Deals
            {expandedSections.deals ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.deals && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="discounts-only"
                  checked={showDiscountsOnly}
                  onCheckedChange={(checked) =>
                    setShowDiscountsOnly(checked === true)
                  }
                />
                <Label
                  htmlFor="discounts-only"
                  className="text-sm font-normal cursor-pointer"
                >
                  Show only discounted items
                </Label>
              </div>
            </div>
          )}
        </div>

        {/* Rating Filter */}
        <div className="border-b border-champagne/20 dark:border-gray-700 pb-4">
          <button
            className="flex w-full items-center justify-between text-sm font-medium mb-2"
            onClick={() => toggleSection("rating")}
          >
            Minimum Rating
            {expandedSections.rating ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.rating && (
            <div className="space-y-2">
              <RadioGroup
                value={minRating.toString()}
                onValueChange={(value) => setMinRating(Number(value))}
              >
                {[0, 3, 4, 4.5].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={rating.toString()}
                      id={`rating-${rating}`}
                    />
                    <Label
                      htmlFor={`rating-${rating}`}
                      className="text-sm font-normal cursor-pointer flex items-center gap-2"
                    >
                      {rating === 0 ? (
                        "Any"
                      ) : (
                        <>
                          <StarRating rating={rating} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {rating}+
                          </span>
                        </>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>

        {/* Categories Filter */}
        <div className="border-b border-champagne/20 dark:border-gray-700 pb-4">
          <button
            className="flex w-full items-center justify-between text-sm font-medium mb-2"
            onClick={() => toggleSection("categories")}
          >
            Categories
            {expandedSections.categories ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.categories && (
            <div className="space-y-2">
              {categoriesList.map((category: string) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCategories([
                          ...selectedCategories,
                          category,
                        ]);
                      } else {
                        setSelectedCategories(
                          selectedCategories.filter((c) => c !== category)
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`category-${category}`}
                    className="text-sm font-normal cursor-pointer capitalize"
                  >
                    {category}
                  </Label>
                </div>
              ))}
              {selectedCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategories([])}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Brands Filter */}
        <div className="border-b border-champagne/20 dark:border-gray-700 pb-4">
          <button
            className="flex w-full items-center justify-between text-sm font-medium mb-2"
            onClick={() => toggleSection("brands")}
          >
            Brands
            {expandedSections.brands ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.brands && (
            <div className="space-y-2">
              {brands.map((brand: string) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedBrands([...selectedBrands, brand]);
                      } else {
                        setSelectedBrands(
                          selectedBrands.filter((b) => b !== brand)
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`brand-${brand}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {brand}
                  </Label>
                </div>
              ))}
              {selectedBrands.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBrands([])}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Size Filter */}
        <div className="border-b border-champagne/20 dark:border-gray-700 pb-4">
          <button
            className="flex w-full items-center justify-between text-sm font-medium mb-2"
            onClick={() => toggleSection("size")}
          >
            Size
            {expandedSections.size ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.size && (
            <div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {sizes.map((size: string) => (
                  <button
                    key={size}
                    className={`text-xs border rounded-md py-1 px-2 ${
                      selectedSizes.includes(size)
                        ? "bg-gold text-richblack border-gold"
                        : "border-champagne/20 dark:border-gray-700 hover:border-gold"
                    }`}
                    onClick={() => {
                      if (selectedSizes.includes(size)) {
                        setSelectedSizes(
                          selectedSizes.filter((s) => s !== size)
                        );
                      } else {
                        setSelectedSizes([...selectedSizes, size]);
                      }
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {selectedSizes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSizes([])}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Gender Filter */}
        <div className="border-b border-champagne/20 dark:border-gray-700 pb-4">
          <button
            className="flex w-full items-center justify-between text-sm font-medium mb-2"
            onClick={() => toggleSection("gender")}
          >
            Gender
            {expandedSections.gender ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.gender && (
            <div className="space-y-2">
              <RadioGroup
                value={selectedGender || ""}
                onValueChange={(value) =>
                  setSelectedGender(value === "all" ? null : value)
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="gender-all" />
                  <Label
                    htmlFor="gender-all"
                    className="text-sm font-normal cursor-pointer"
                  >
                    All
                  </Label>
                </div>
                {genders.map((gender: string) => (
                  <div key={gender} className="flex items-center space-x-2">
                    <RadioGroupItem value={gender} id={`gender-${gender}`} />
                    <Label
                      htmlFor={`gender-${gender}`}
                      className="text-sm font-normal cursor-pointer capitalize"
                    >
                      {gender}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>

        {/* Color Filter */}
        <div className="border-b border-champagne/20 dark:border-gray-700 pb-4">
          <button
            className="flex w-full items-center justify-between text-sm font-medium mb-2"
            onClick={() => toggleSection("color")}
          >
            Color
            {expandedSections.color ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.color && (
            <div className="space-y-2">
              {colors.map((color: string) => (
                <div key={color} className="flex items-center space-x-2">
                  <Checkbox
                    id={`color-${color}`}
                    checked={selectedColors.includes(color)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedColors([...selectedColors, color]);
                      } else {
                        setSelectedColors(
                          selectedColors.filter((c) => c !== color)
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`color-${color}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {color}
                  </Label>
                </div>
              ))}
              {selectedColors.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedColors([])}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Clear All Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            onClick={clearAllFilters}
            className="w-full"
          >
            Clear All Filters ({activeFilterCount})
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Toggle Button (Mobile) */}
      <div className="flex items-center justify-between lg:hidden">
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-gold px-2 py-0.5 text-xs text-richblack">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
            </div>
            {renderFilterContent()}
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block">
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
              </div>
              {renderFilterContent()}
            </CardContent>
          </Card>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {loadingProducts ? (
            <ProductsLoading />
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No products found matching your filters.
              </p>
              {activeFilterCount > 0 && (
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <FeaturedProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev || loadingProducts}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext || loadingProducts}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-[1300px]">
      <ViewportSection className="mb-8" threshold={0.05}>
        <div>
          <h1 className="mb-2 text-3xl font-bold">Our Products</h1>
          <p className="text-muted-foreground">
            Browse our collection of quality products
          </p>
        </div>
      </ViewportSection>

      <CallToOrderBanner />

      <Suspense fallback={<ProductsLoading />}>
        <ProductsContent />
      </Suspense>
    </main>
  );
}
