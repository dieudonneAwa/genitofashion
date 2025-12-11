"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Filter,
  Plus,
  ShoppingBag,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { StarRating } from "@/components/star-rating";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/components/ui/use-toast";
import { CallToOrderSection } from "@/components/call-to-order-section";
import { ViewportSection } from "@/components/viewport-section";
import { isDiscountActive } from "@/lib/utils";
import { ProductCardSkeleton } from "@/components/product-card-skeleton";

// Filter options - will be populated from products
const categories = ["shoes", "clothes", "perfumes", "chains"];

interface SearchPageProps {
  searchParams: {
    q?: string;
    category?: string;
    discounts?: string;
  };
}

function SearchResultsLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array(8)
        .fill(0)
        .map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
    </div>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category");
  const discountsParam = searchParams.get("discounts");
  const { addItem, items } = useCart();
  const { toast } = useToast();
  const initialRender = useRef(true);

  // Product data
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categoriesList, setCategoriesList] = useState<string[]>(categories);
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

  // Determine the title based on search parameters
  let title = "Search Results";
  if (categoryParam) {
    title = `${categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)}`;
  }
  if (discountsParam === "true") {
    title = "Discounted Products";
  }
  if (query) {
    title = `Results for "${query}"`;
  }

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
            // Use category slugs for filtering
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

  // Fetch filter options from products based on current filters (excluding brand, size, color, gender)
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        // Build query params for filter options (exclude brand, size, color, gender to get all available options)
        const params = new URLSearchParams();

        // Include current filters that should limit the available options
        const categoriesToUse =
          selectedCategories.length > 0
            ? selectedCategories
            : categoryParam
            ? [categoryParam]
            : [];
        categoriesToUse.forEach((category) => {
          params.append("category", category);
        });

        if (query) {
          params.append("search", query);
        }

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

        // Fetch a large number of products to extract filter options
        params.append("limit", "1000");

        const response = await fetch(`/api/products?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          const products = data.products || (Array.isArray(data) ? data : []);

          // Extract unique brands
          const uniqueBrands = [
            ...new Set(
              products
                .map((p: any) => p.brand)
                .filter((b: any) => b && typeof b === "string" && b.trim())
            ),
          ].sort() as string[];
          setBrands(uniqueBrands);

          // Extract unique sizes from both size field and stock_by_size keys
          // Only sizes from products matching current filters are included
          const sizeSet = new Set<string>();
          products.forEach((p: any) => {
            // Add size from size field if it exists
            if (p.size && typeof p.size === "string" && p.size.trim()) {
              sizeSet.add(p.size.trim());
            }
            // Add sizes from stock_by_size if it exists
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

          // Extract unique colors
          const uniqueColors = [
            ...new Set(
              products
                .map((p: any) => p.color)
                .filter((c: any) => c && typeof c === "string" && c.trim())
            ),
          ].sort() as string[];
          setColors(uniqueColors);

          // Extract unique genders
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
    query,
    selectedCategories,
    categoryParam,
    priceRange,
    minRating,
    showDiscountsOnly,
    // Note: We intentionally exclude selectedBrands, selectedSizes, selectedColors, selectedGender
    // to get all available options for the current filter context
  ]);

  // Handle URL category parameter only once on initial render
  useEffect(() => {
    if (categoryParam && initialRender.current) {
      setSelectedCategories([categoryParam]);
      setCurrentPage(1); // Reset to first page when category changes
      initialRender.current = false;
    }
  }, [categoryParam]);

  // Reset to page 1 when filters change (except when page changes)
  useEffect(() => {
    setCurrentPage(1);
  }, [
    query,
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

  // Track search analytics after products are loaded
  useEffect(() => {
    if (query.trim() && !loadingProducts) {
      const trackSearch = async (resultCount: number) => {
        try {
          await fetch("/api/search/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, resultCount }),
          });
        } catch (error) {
          // Silently fail - analytics shouldn't block user experience
          console.error("Error tracking search:", error);
        }
      };

      // Track search with result count
      trackSearch(filteredProducts.length);
    }
  }, [query, filteredProducts.length, loadingProducts]);

  // Fetch filtered products from API
  useEffect(() => {
    async function fetchFilteredProducts() {
      try {
        setLoadingProducts(true);

        // Build query parameters
        const params = new URLSearchParams();

        // Category filter - support multiple categories
        const categoriesToUse =
          selectedCategories.length > 0
            ? selectedCategories
            : categoryParam
            ? [categoryParam]
            : [];

        // Append each category as a separate parameter
        categoriesToUse.forEach((category) => {
          params.append("category", category);
        });

        // Search query
        if (query) {
          params.append("search", query);
        }

        // Price range
        if (priceRange[0] > 0) {
          params.append("minPrice", priceRange[0].toString());
        }
        if (priceRange[1] < 40000) {
          params.append("maxPrice", priceRange[1].toString());
        }

        // Rating filter
        if (minRating > 0) {
          params.append("minRating", minRating.toString());
        }

        // Discount filter
        if (showDiscountsOnly) {
          params.append("discountsOnly", "true");
        }

        // Brand filter
        selectedBrands.forEach((brand) => {
          params.append("brand", brand);
        });

        // Size filter
        selectedSizes.forEach((size) => {
          params.append("size", size);
        });

        // Gender filter
        if (selectedGender) {
          params.append("gender", selectedGender);
        }

        // Color filter
        selectedColors.forEach((color) => {
          params.append("color", color);
        });

        // Pagination
        params.append("page", currentPage.toString());
        params.append("limit", "20");
        params.append("sortBy", "newest");

        const response = await fetch(`/api/products?${params.toString()}`);

        if (response.ok) {
          const data = await response.json();
          // Check if response has pagination (new API) or is array (old API)
          if (data.products && data.pagination) {
            setFilteredProducts(data.products);
            setPagination(data.pagination);
          } else if (Array.isArray(data)) {
            // Fallback for old API format
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
    query,
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
    setCurrentPage(1); // Reset to first page
  };

  // Get quantity of product in cart
  const getCartQuantity = (productId: string) => {
    const item = items.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  // Handle adding product to cart
  const handleAddToCart = (product: any) => {
    const hasActiveDiscount = isDiscountActive(
      product.discount,
      product.discount_end_time
    );
    const price = hasActiveDiscount
      ? Math.round(product.price * (1 - (product.discount || 0) / 100))
      : product.price;

    addItem({
      id: String(product.id),
      name: product.name,
      price: price,
      image:
        product.image_url || product.images?.[0]?.url || product.image || "",
      quantity: 1,
      category: product.category?.slug || product.category || "",
    });

    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart`,
    });
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

  // Helper function to render filter content (used for both mobile and desktop)
  function renderFilterContent() {
    return (
      <div className="space-y-6">
        {/* Price Range Filter */}
        <div className="border-b border-champagne/20 dark:border-gray-700 pb-4">
          <button
            className="flex w-full items-center justify-between text-sm font-medium mb-2"
            onClick={() => toggleSection("price")}
          >
            Price Range
            {expandedSections.price ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.price && (
            <div className="space-y-4">
              <Slider
                defaultValue={[0, 40000]}
                min={0}
                max={40000}
                step={1000}
                value={priceRange}
                onValueChange={(value) => {
                  if (Array.isArray(value) && value.length === 2) {
                    setPriceRange([value[0], value[1]]);
                  }
                }}
                className="py-4"
              />
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {priceRange[0].toLocaleString()} FCFA
                </div>
                <div className="text-sm">
                  {priceRange[1].toLocaleString()} FCFA
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Deals and Discounts Filter */}
        <div className="border-b border-champagne/20 dark:border-gray-700 pb-4">
          <button
            className="flex w-full items-center justify-between text-sm font-medium mb-2"
            onClick={() => toggleSection("deals")}
          >
            Deals & Discounts
            {expandedSections.deals ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.deals && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="discounts"
                checked={showDiscountsOnly}
                onCheckedChange={(checked) =>
                  setShowDiscountsOnly(checked === true)
                }
              />
              <Label htmlFor="discounts" className="text-sm">
                Show only items on sale
              </Label>
            </div>
          )}
        </div>

        {/* Customer Review Filter */}
        <div className="border-b border-champagne/20 dark:border-gray-700 pb-4">
          <button
            className="flex w-full items-center justify-between text-sm font-medium mb-2"
            onClick={() => toggleSection("rating")}
          >
            Customer Review
            {expandedSections.rating ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.rating && (
            <div className="space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <button
                    className={`flex items-center ${
                      minRating === rating
                        ? "text-gold"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setMinRating(rating)}
                  >
                    <StarRating rating={rating} size="sm" />
                    <span className="ml-1 text-xs">& Up</span>
                  </button>
                </div>
              ))}
              {minRating > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMinRating(0)}
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
                  <Label htmlFor={`brand-${brand}`} className="text-sm">
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
              {categoriesList.map((category) => (
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
                    className="text-sm capitalize"
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
                onValueChange={(value) => setSelectedGender(value || null)}
              >
                {genders.map((gender: string) => (
                  <div key={gender} className="flex items-center space-x-2">
                    <RadioGroupItem value={gender} id={`gender-${gender}`} />
                    <Label
                      htmlFor={`gender-${gender}`}
                      className="text-sm capitalize"
                    >
                      {gender}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {selectedGender && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGender(null)}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Color Filter */}
        <div>
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
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {colors.map((color: string) => (
                  <button
                    key={color}
                    className={`px-3 py-1 rounded-md text-sm border ${
                      selectedColors.includes(color)
                        ? "bg-gold text-richblack border-gold"
                        : "border-champagne/20 dark:border-gray-700 hover:border-gold"
                    }`}
                    onClick={() => {
                      if (selectedColors.includes(color)) {
                        setSelectedColors(
                          selectedColors.filter((c: string) => c !== color)
                        );
                      } else {
                        setSelectedColors([...selectedColors, color]);
                      }
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
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
      </div>
    );
  }

  return (
    <>
      <ViewportSection className="mb-8" threshold={0.05}>
        <div>
          <h1 className="mb-2 text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            {categoryParam
              ? "Browse our collection in this category"
              : discountsParam === "true"
              ? "Special offers and discounted items"
              : "Browse our collection of quality products"}
          </p>
        </div>
      </ViewportSection>

      <div className="lg:grid lg:grid-cols-4 gap-8">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center bg-transparent"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-gold text-richblack">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px] sm:w-[400px] overflow-y-auto"
            >
              <div className="py-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-8 text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                {/* Filter content - same as desktop but in sheet */}
                {renderFilterContent()}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-20 bg-background p-4 rounded-lg border border-champagne/20 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filters</h2>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8 text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
            {renderFilterContent()}
          </div>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {loadingProducts ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array(6)
                .fill(0)
                .map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filter criteria
              </p>
              <Button onClick={clearAllFilters}>Clear All Filters</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="overflow-hidden transition-all hover:shadow-md border-champagne/20 hover:border-gold h-full flex flex-col">
                      <div className="relative">
                        <Link
                          href={`/products/${
                            product.category?.slug || product.category || "all"
                          }/${product.id}`}
                        >
                          <motion.div
                            className="aspect-square overflow-hidden"
                            whileHover={{ scale: 1.05 }}
                          >
                            <Image
                              src={
                                product.image_url ||
                                product.images?.[0]?.url ||
                                product.image ||
                                "/placeholder.svg"
                              }
                              alt={product.name}
                              width={400}
                              height={400}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </motion.div>
                        </Link>
                        {/* Discount badge */}
                        {isDiscountActive(
                          product.discount,
                          product.discount_end_time
                        ) && (
                          <Badge className="absolute top-2 left-2 bg-burgundy text-white">
                            {product.discount}% OFF
                          </Badge>
                        )}
                        {/* Stock badge */}
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
                      <CardContent className="p-4 flex flex-col flex-grow">
                        <Link
                          href={`/products/${
                            product.category?.slug || product.category || "all"
                          }/${product.id}`}
                        >
                          <h3 className="mb-1 font-medium">{product.name}</h3>
                        </Link>
                        {product.brand && (
                          <div className="text-xs text-muted-foreground mb-1">
                            {product.brand}
                          </div>
                        )}
                        <div className="flex items-center mb-2">
                          <StarRating rating={product.rating || 0} size="sm" />
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({product.reviews_count || product.reviews || 0})
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-3 mt-auto">
                          <div>
                            {isDiscountActive(
                              product.discount,
                              product.discount_end_time
                            ) ? (
                              <div>
                                <span className="text-lg font-bold text-gold">
                                  {Math.round(
                                    product.price *
                                      (1 - (product.discount || 0) / 100)
                                  ).toLocaleString()}{" "}
                                  FCFA
                                </span>
                                <span className="ml-2 text-xs line-through text-muted-foreground">
                                  {product.price.toLocaleString()} FCFA
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-gold">
                                {product.price.toLocaleString()} FCFA
                              </span>
                            )}
                          </div>
                          {getCartQuantity(String(product.id)) > 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-emerald/20 text-emerald border-emerald"
                            >
                              {getCartQuantity(String(product.id))} in cart
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald hover:bg-emerald/90 text-white"
                            asChild
                          >
                            <Link
                              href={`/products/${
                                product.category?.slug ||
                                product.category ||
                                "all"
                              }/${product.id}`}
                            >
                              <ShoppingBag className="mr-2 h-4 w-4" /> Details
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gold text-gold hover:bg-gold/10 bg-transparent"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev || loadingProducts}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum: number;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (
                          pagination.page >=
                          pagination.totalPages - 2
                        ) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={
                              pagination.page === pageNum
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={loadingProducts}
                            className="min-w-[40px]"
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(pagination.totalPages, p + 1)
                      )
                    }
                    disabled={!pagination.hasNext || loadingProducts}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Pagination Info */}
              {pagination.total > 0 && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} products
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <CallToOrderSection />
    </>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <main className="container mx-auto px-4 py-8 max-w-[1300px]">
      <Suspense fallback={<SearchResultsLoading />}>
        <SearchPageContent />
      </Suspense>
    </main>
  );
}
