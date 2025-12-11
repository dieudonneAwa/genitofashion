"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { isDiscountActive } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfitChart } from "@/components/profit-chart";
import { ProductsCustomersChart } from "@/components/products-customers-chart";
import { ViewportSection } from "@/components/viewport-section";
import { AddProductDialog } from "@/components/admin/add-product-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "@/components/product-card-skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";

function AdminPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [timeframe, setTimeframe] = useState("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCompletingSale, setIsCompletingSale] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [posCustomerSearchOpen, setPosCustomerSearchOpen] = useState(false);
  const [posCustomerSearchQuery, setPosCustomerSearchQuery] = useState("");
  const [posCustomerSearchResults, setPosCustomerSearchResults] = useState<
    any[]
  >([]);
  const [isSearchingPosCustomers, setIsSearchingPosCustomers] = useState(false);
  const posCustomerSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const customerPhoneInputRef = useRef<HTMLInputElement | null>(null);
  const [sizeSelectionDialog, setSizeSelectionDialog] = useState<{
    open: boolean;
    product: any | null;
  }>({ open: false, product: null });
  const [selectedSize, setSelectedSize] = useState<string>("");
  const sizeButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      [
        "dashboard",
        "pos",
        "inventory",
        "customers",
        "returns",
        "activity",
        "expenses",
        "analytics",
        "settings",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "dashboard") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const newUrl = params.toString() ? `/admin?${params.toString()}` : "/admin";
    router.push(newUrl, { scroll: false });
  };

  const [posProducts, setPosProducts] = useState<any[]>([]);
  const [loadingPosProducts, setLoadingPosProducts] = useState(true);
  const [filteredPosProducts, setFilteredPosProducts] = useState<any[]>([]);
  const [posRefreshKey, setPosRefreshKey] = useState(0);
  const [posPage, setPosPage] = useState(1);
  const [posPagination, setPosPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousSearchQueryRef = useRef<string>("");

  const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);
  const [inventoryPagination, setInventoryPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);

  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerPagination, setCustomerPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [returns, setReturns] = useState<any[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(true);
  const [returnPage, setReturnPage] = useState(1);
  const [returnPagination, setReturnPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingActivityLogs, setLoadingActivityLogs] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const [activityPagination, setActivityPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loadingLowStock, setLoadingLowStock] = useState(true);

  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [loadingStockMovements, setLoadingStockMovements] = useState(true);
  const [stockMovementPage, setStockMovementPage] = useState(1);
  const [stockMovementPagination, setStockMovementPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [stockAdjustmentDialog, setStockAdjustmentDialog] = useState<{
    open: boolean;
    product: any | null;
  }>({ open: false, product: null });
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentSize, setAdjustmentSize] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");

  const [expenses, setExpenses] = useState<any[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [expensePage, setExpensePage] = useState(1);
  const [expensePagination, setExpensePagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [expenseFormData, setExpenseFormData] = useState({
    category: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    receipt_url: "",
  });

  const [salesAnalytics, setSalesAnalytics] = useState<any>(null);
  const [loadingSalesAnalytics, setLoadingSalesAnalytics] = useState(true);
  const [customerAnalytics, setCustomerAnalytics] = useState<any>(null);
  const [loadingCustomerAnalytics, setLoadingCustomerAnalytics] =
    useState(true);

  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsFormData, setSettingsFormData] = useState({
    store_name: "",
    currency: "FCFA",
    tax_rate: "0",
    low_stock_threshold: "10",
  });

  const [linkOrderDialog, setLinkOrderDialog] = useState(false);
  const [linkOrderForm, setLinkOrderForm] = useState({
    sale_id: "",
    user_email: "",
    user_phone: "",
  });

  const [currentSale, setCurrentSale] = useState<{
    items: {
      id: string;
      name: string;
      price: number;
      discount: number | null;
      discount_end_time: string | null;
      stock: number;
      stock_by_size?: Record<string, number>;
      quantity: number;
      size?: string;
      finalPrice: number;
    }[];
    subtotal: number;
    discountAmount: number;
    tax: number;
    total: number;
  }>({
    items: [],
    subtotal: 0,
    discountAmount: 0,
    tax: 0,
    total: 0,
  });

  useEffect(() => {
    async function fetchInventoryProducts() {
      try {
        setLoadingInventory(true);
        const params = new URLSearchParams();

        if (inventorySearchQuery.trim()) {
          params.append("search", inventorySearchQuery.trim());
        }

        params.append("page", inventoryPage.toString());
        params.append("limit", "10");
        params.append("sortBy", "newest");

        const response = await fetch(`/api/products?${params.toString()}`);

        if (response.ok) {
          const data = await response.json();
          if (data.products && data.pagination) {
            setInventoryProducts(data.products);
            setInventoryPagination(data.pagination);
          } else if (Array.isArray(data)) {
            setInventoryProducts(data);
            setInventoryPagination({
              page: 1,
              limit: data.length,
              total: data.length,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            });
          }
        } else {
          console.error("Failed to fetch inventory products");
          setInventoryProducts([]);
        }
      } catch (error) {
        console.error("Error fetching inventory products:", error);
        setInventoryProducts([]);
      } finally {
        setLoadingInventory(false);
      }
    }

    if (activeTab === "inventory") {
      fetchInventoryProducts();
    }
  }, [activeTab, inventorySearchQuery, inventoryPage, inventoryRefreshKey]);

  useEffect(() => {
    setInventoryPage(1);
  }, [inventorySearchQuery]);

  useEffect(() => {
    setPosPage(1);
    setPosPagination((prev) => ({
      ...prev,
      page: 1,
      hasPrev: false,
    }));
  }, [searchQuery]);

  useEffect(() => {
    async function fetchRecentSales() {
      try {
        setLoadingSales(true);
        const response = await fetch("/api/sales?limit=5");

        if (response.ok) {
          const data = await response.json();
          setRecentSales(data.sales || []);
        } else {
          console.error("Failed to fetch recent sales");
          setRecentSales([]);
        }
      } catch (error) {
        console.error("Error fetching recent sales:", error);
        setRecentSales([]);
      } finally {
        setLoadingSales(false);
      }
    }

    if (activeTab === "dashboard") {
      fetchRecentSales();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "pos" && searchQuery !== previousSearchQueryRef.current) {
      const previousQuery = previousSearchQueryRef.current;
      previousSearchQueryRef.current = searchQuery;
      if (posPage !== 1) {
        setPosPage(1);
      }
      if (searchQuery === "" && previousQuery !== "") {
        setDebouncedSearchQuery("");
      }
    }
  }, [searchQuery, activeTab, posPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const previousDebounced = debouncedSearchQuery;
      setDebouncedSearchQuery(searchQuery);
      if (
        activeTab === "pos" &&
        searchQuery !== previousDebounced &&
        posPage !== 1
      ) {
        setPosPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, debouncedSearchQuery, posPage]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    async function fetchPosProducts() {
      if (activeTab !== "pos") {
        return;
      }

      try {
        setLoadingPosProducts(true);

        const params = new URLSearchParams();
        const isSearchPending = searchQuery !== debouncedSearchQuery;
        const searchToUse = isSearchPending
          ? searchQuery
          : debouncedSearchQuery;

        if (searchToUse.trim()) {
          params.append("search", searchToUse.trim());
        }

        params.append("page", posPage.toString());
        params.append("limit", "12");
        params.append("sortBy", "newest");

        const response = await fetch(`/api/products?${params.toString()}`, {
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) {
          return;
        }

        if (response.ok) {
          const data = await response.json();

          if (abortController.signal.aborted) {
            return;
          }

          if (data.products && data.pagination) {
            const pagination = data.pagination;
            const validPage = Math.max(
              1,
              Math.min(pagination.page || posPage, pagination.totalPages || 1)
            );

            setPosProducts(data.products);
            setPosPagination({
              page: validPage,
              limit: pagination.limit || 12,
              total: pagination.total || 0,
              totalPages: pagination.totalPages || 0,
              hasNext: pagination.hasNext || false,
              hasPrev: pagination.hasPrev || false,
            });

            if (posPage !== validPage) {
              setPosPage(validPage);
            }

            if (
              posPage > pagination.totalPages &&
              pagination.totalPages > 0 &&
              pagination.total > 0
            ) {
              setPosPage(1);
            }
          } else if (Array.isArray(data)) {
            if (abortController.signal.aborted) return;

            setPosProducts(data);
            setPosPagination({
              page: 1,
              limit: data.length,
              total: data.length,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            });
            setPosPage(1);
          } else {
            if (abortController.signal.aborted) return;

            setPosProducts([]);
            setPosPagination({
              page: 1,
              limit: 12,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            });
          }
        } else {
          // Handle HTTP errors
          if (!abortController.signal.aborted) {
            console.error(
              "Failed to fetch POS products:",
              response.status,
              response.statusText
            );
          }
        }
      } catch (error: any) {
        // Ignore abort errors
        if (error.name === "AbortError") {
          return;
        }

        console.error("Error fetching POS products:", error);
        // Don't clear existing products on error - preserve current state
        // This prevents blank screen when network fails
      } finally {
        // Only update loading state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setLoadingPosProducts(false);
        }
      }
    }

    // Only fetch when POS tab is active
    if (activeTab === "pos") {
      fetchPosProducts();
    } else {
      setLoadingPosProducts(false);
    }

    // Cleanup: abort request if component unmounts or dependencies change
    return () => {
      abortController.abort();
    };
  }, [activeTab, posRefreshKey, posPage, debouncedSearchQuery, searchQuery]);

  useEffect(() => {
    setFilteredPosProducts([...posProducts]);
  }, [posProducts]);

  useEffect(() => {
    if (
      activeTab === "pos" &&
      posPage > 1 &&
      !loadingPosProducts &&
      filteredPosProducts.length > 0
    ) {
      const timer = setTimeout(() => {
        const productListElement = document.querySelector(
          "[data-pos-product-list]"
        );
        if (productListElement) {
          productListElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [posPage, activeTab, loadingPosProducts, filteredPosProducts.length]);

  useEffect(() => {
    async function fetchLowStock() {
      try {
        setLoadingLowStock(true);
        const response = await fetch("/api/products/low-stock");
        if (response.ok) {
          const data = await response.json();
          setLowStockProducts(data.products || []);
        }
      } catch (error) {
        console.error("Error fetching low stock:", error);
      } finally {
        setLoadingLowStock(false);
      }
    }
    if (activeTab === "dashboard") {
      fetchLowStock();
    }
  }, [activeTab]);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoadingCustomers(true);
        const params = new URLSearchParams();
        params.append("page", customerPage.toString());
        params.append("limit", "20");
        if (customerSearchQuery) {
          params.append("search", customerSearchQuery);
        }
        const response = await fetch(`/api/customers?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setCustomers(data.customers || []);
          setCustomerPagination(data.pagination || customerPagination);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoadingCustomers(false);
      }
    }
    if (activeTab === "customers") {
      fetchCustomers();
    }
  }, [activeTab, customerPage, customerSearchQuery]);

  useEffect(() => {
    async function fetchReturns() {
      try {
        setLoadingReturns(true);
        const params = new URLSearchParams();
        params.append("page", returnPage.toString());
        params.append("limit", "20");
        const response = await fetch(`/api/returns?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setReturns(data.returns || []);
          setReturnPagination(data.pagination || returnPagination);
        }
      } catch (error) {
        console.error("Error fetching returns:", error);
      } finally {
        setLoadingReturns(false);
      }
    }
    if (activeTab === "returns") {
      fetchReturns();
    }
  }, [activeTab, returnPage]);

  useEffect(() => {
    async function fetchActivityLogs() {
      try {
        setLoadingActivityLogs(true);
        const params = new URLSearchParams();
        params.append("page", activityPage.toString());
        params.append("limit", "50");
        const response = await fetch(`/api/activity-logs?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setActivityLogs(data.logs || []);
          setActivityPagination(data.pagination || activityPagination);
        }
      } catch (error) {
        console.error("Error fetching activity logs:", error);
      } finally {
        setLoadingActivityLogs(false);
      }
    }
    if (activeTab === "activity") {
      fetchActivityLogs();
    }
  }, [activeTab, activityPage]);

  useEffect(() => {
    async function fetchStockMovements() {
      try {
        setLoadingStockMovements(true);
        const params = new URLSearchParams();
        params.append("page", stockMovementPage.toString());
        params.append("limit", "50");
        const response = await fetch(
          `/api/stock-movements?${params.toString()}`
        );
        if (response.ok) {
          const data = await response.json();
          setStockMovements(data.movements || []);
          setStockMovementPagination(
            data.pagination || stockMovementPagination
          );
        }
      } catch (error) {
        console.error("Error fetching stock movements:", error);
      } finally {
        setLoadingStockMovements(false);
      }
    }
    if (activeTab === "inventory") {
      fetchStockMovements();
    }
  }, [activeTab, stockMovementPage]);

  useEffect(() => {
    async function fetchExpenses() {
      try {
        setLoadingExpenses(true);
        const params = new URLSearchParams();
        params.append("page", expensePage.toString());
        params.append("limit", "20");
        const response = await fetch(`/api/expenses?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setExpenses(data.expenses || []);
          setExpensePagination(data.pagination || expensePagination);
        }
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoadingExpenses(false);
      }
    }
    if (activeTab === "expenses") {
      fetchExpenses();
    }
  }, [activeTab, expensePage]);

  useEffect(() => {
    async function fetchSalesAnalytics() {
      try {
        setLoadingSalesAnalytics(true);
        const response = await fetch(
          `/api/analytics/sales?timeframe=${timeframe}&metric=all`
        );
        if (response.ok) {
          const data = await response.json();
          setSalesAnalytics(data);
        }
      } catch (error) {
        console.error("Error fetching sales analytics:", error);
      } finally {
        setLoadingSalesAnalytics(false);
      }
    }
    if (activeTab === "analytics") {
      fetchSalesAnalytics();
    }
  }, [activeTab, timeframe]);

  // Debounced customer search for POS
  useEffect(() => {
    if (posCustomerSearchTimeoutRef.current) {
      clearTimeout(posCustomerSearchTimeoutRef.current);
    }

    if (posCustomerSearchQuery.trim().length >= 2) {
      posCustomerSearchTimeoutRef.current = setTimeout(async () => {
        setIsSearchingPosCustomers(true);
        try {
          const response = await fetch(
            `/api/customers?search=${encodeURIComponent(
              posCustomerSearchQuery.trim()
            )}&limit=10`
          );
          if (response.ok) {
            const data = await response.json();
            setPosCustomerSearchResults(data.customers || []);
          } else {
            setPosCustomerSearchResults([]);
          }
        } catch (error) {
          console.error("Error searching customers:", error);
          setPosCustomerSearchResults([]);
        } finally {
          setIsSearchingPosCustomers(false);
        }
      }, 300);
    } else {
      setPosCustomerSearchResults([]);
    }

    return () => {
      if (posCustomerSearchTimeoutRef.current) {
        clearTimeout(posCustomerSearchTimeoutRef.current);
      }
    };
  }, [posCustomerSearchQuery]);

  useEffect(() => {
    async function fetchCustomerAnalytics() {
      try {
        setLoadingCustomerAnalytics(true);
        const response = await fetch(`/api/analytics/customers`);
        if (response.ok) {
          const data = await response.json();
          setCustomerAnalytics(data);
        }
      } catch (error) {
        console.error("Error fetching customer analytics:", error);
      } finally {
        setLoadingCustomerAnalytics(false);
      }
    }
    if (activeTab === "analytics") {
      fetchCustomerAnalytics();
    }
  }, [activeTab]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoadingSettings(true);
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings || {});
          setSettingsFormData({
            store_name: data.settings?.store_name || "Genito Fashion",
            currency: data.settings?.currency || "FCFA",
            tax_rate: data.settings?.tax_rate?.toString() || "0",
            low_stock_threshold:
              data.settings?.low_stock_threshold?.toString() || "10",
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    }
    if (activeTab === "settings") {
      fetchSettings();
    }
  }, [activeTab]);

  // Calculate sale totals
  const calculateSaleTotals = (items: typeof currentSale.items) => {
    let subtotal = 0;
    let discountAmount = 0;

    items.forEach((item) => {
      const itemSubtotal = item.finalPrice * item.quantity;
      const originalSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;
      discountAmount += originalSubtotal - itemSubtotal;
    });

    const tax = 0;
    const total = subtotal + tax;

    return { subtotal, discountAmount, tax, total };
  };

  const addToSale = (product: any, size?: string) => {
    if (product.stock === 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive",
      });
      return;
    }

    if (
      product.stock_by_size &&
      Object.keys(product.stock_by_size).length > 0 &&
      !size
    ) {
      setSizeSelectionDialog({ open: true, product });
      setSelectedSize("");
      return;
    }

    if (
      product.stock_by_size &&
      Object.keys(product.stock_by_size).length > 0 &&
      !size
    ) {
      toast({
        title: "Size Required",
        description: `Please select a size for ${product.name}`,
        variant: "destructive",
      });
      return;
    }

    if (size && product.stock_by_size) {
      const sizeStock = product.stock_by_size[size] || 0;
      if (sizeStock === 0) {
        toast({
          title: "Out of Stock",
          description: `${product.name} (Size ${size}) is currently out of stock`,
          variant: "destructive",
        });
        return;
      }
    }

    const hasActiveDiscount = isDiscountActive(
      product.discount,
      product.discount_end_time
    );
    const finalPrice = hasActiveDiscount
      ? Math.round(product.price * (1 - (product.discount || 0) / 100))
      : product.price;

    // For size-based products, check existing item with same size
    const existingItem = currentSale.items.find(
      (item) => item.id === product.id && (!size || item.size === size)
    );

    if (existingItem) {
      const availableStock =
        size && product.stock_by_size
          ? product.stock_by_size[size] || 0
          : product.stock;

      if (existingItem.quantity >= availableStock) {
        toast({
          title: "Insufficient Stock",
          description: size
            ? `Only ${availableStock} items available in size ${size}`
            : `Only ${availableStock} items available in stock`,
          variant: "destructive",
        });
        return;
      }

      const updatedItems = currentSale.items.map((item) =>
        item.id === product.id && (!size || item.size === size)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );

      const totals = calculateSaleTotals(updatedItems);
      setCurrentSale({
        items: updatedItems,
        ...totals,
      });
    } else {
      const newItem: any = {
        id: product.id,
        name: product.name,
        price: product.price,
        discount: product.discount,
        discount_end_time: product.discount_end_time,
        stock:
          size && product.stock_by_size
            ? product.stock_by_size[size] || 0
            : product.stock,
        stock_by_size: product.stock_by_size,
        quantity: 1,
        size: size || undefined,
        finalPrice,
      };

      const updatedItems = [...currentSale.items, newItem];
      const totals = calculateSaleTotals(updatedItems);
      setCurrentSale({
        items: updatedItems,
        ...totals,
      });
    }

    // Close size selection dialog if it was open
    if (sizeSelectionDialog.open) {
      setSizeSelectionDialog({ open: false, product: null });
      setSelectedSize("");
    }
  };

  // Handle size selection confirmation
  const handleSizeConfirm = () => {
    if (!sizeSelectionDialog.product) return;

    if (!selectedSize) {
      toast({
        title: "Size Required",
        description: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    // Double-check stock before adding (in case stock changed)
    const sizeStock =
      sizeSelectionDialog.product.stock_by_size?.[selectedSize] || 0;
    if (sizeStock === 0) {
      toast({
        title: "Out of Stock",
        description: `${sizeSelectionDialog.product.name} (Size ${selectedSize}) is currently out of stock`,
        variant: "destructive",
      });
      setPosRefreshKey((prev) => prev + 1);
      return;
    }

    addToSale(sizeSelectionDialog.product, selectedSize);
  };

  // Focus management for size selection dialog
  useEffect(() => {
    if (
      sizeSelectionDialog.open &&
      sizeSelectionDialog.product?.stock_by_size
    ) {
      // Focus the first available size button when dialog opens
      const sizes = Object.keys(sizeSelectionDialog.product.stock_by_size);
      const firstAvailableSize = sizes.find(
        (size) => Number(sizeSelectionDialog.product.stock_by_size?.[size]) > 0
      );
      if (firstAvailableSize && sizeButtonRefs.current[firstAvailableSize]) {
        // Small delay to ensure dialog is fully rendered
        setTimeout(() => {
          sizeButtonRefs.current[firstAvailableSize]?.focus();
        }, 100);
      }
    } else if (!sizeSelectionDialog.open) {
      // Clear refs when dialog closes
      sizeButtonRefs.current = {};
    }
  }, [sizeSelectionDialog.open, sizeSelectionDialog.product]);

  const updateItemQuantity = (
    productId: string,
    newQuantity: number,
    itemSize?: string
  ) => {
    if (newQuantity < 1) {
      removeFromSale(productId, itemSize);
      return;
    }

    const item = currentSale.items.find(
      (item) => item.id === productId && (!itemSize || item.size === itemSize)
    );
    if (!item) return;

    const availableStock =
      item.size && item.stock_by_size
        ? item.stock_by_size[item.size] || 0
        : item.stock;

    if (newQuantity > availableStock) {
      toast({
        title: "Insufficient Stock",
        description: item.size
          ? `Only ${availableStock} items available in size ${item.size}`
          : `Only ${availableStock} items available in stock`,
        variant: "destructive",
      });
      return;
    }

    const updatedItems = currentSale.items.map((item) =>
      item.id === productId && (!itemSize || item.size === itemSize)
        ? { ...item, quantity: newQuantity }
        : item
    );

    const totals = calculateSaleTotals(updatedItems);
    setCurrentSale({
      items: updatedItems,
      ...totals,
    });
  };

  // Remove item from current sale
  const removeFromSale = (productId: string, itemSize?: string) => {
    const updatedItems = currentSale.items.filter(
      (item) =>
        !(item.id === productId && (!itemSize || item.size === itemSize))
    );
    const totals = calculateSaleTotals(updatedItems);
    setCurrentSale({
      items: updatedItems,
      ...totals,
    });
  };

  // Complete the sale
  const completeSale = async () => {
    if (currentSale.items.length === 0) {
      toast({
        title: "No items in sale",
        description: "Please add items to the sale before completing",
        variant: "destructive",
      });
      return;
    }

    const cashAmount = parseFloat(cashReceived);
    if (isNaN(cashAmount) || cashAmount < currentSale.total) {
      toast({
        title: "Insufficient cash",
        description: `Total: ${currentSale.total.toLocaleString()} FCFA. Please enter sufficient cash amount.`,
        variant: "destructive",
      });
      return;
    }

    setIsCompletingSale(true);

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: currentSale.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            size: item.size || undefined,
          })),
          customer_name: customerName.trim() || null,
          customer_phone: customerPhone.trim() || null,
          customer_email: customerEmail.trim() || null,
          tax: currentSale.tax,
          cash_received: cashAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error && data.error.includes("Insufficient stock")) {
          setPosRefreshKey((prev) => prev + 1);
        }
        throw new Error(data.error || "Failed to complete sale");
      }

      // Show success
      toast({
        title: "Sale Completed",
        description: `Sale ${data.sale.sale_number} completed successfully`,
      });

      // Store completed sale for receipt
      setCompletedSale(data.sale);
      setIsReceiptOpen(true);

      setPosRefreshKey((prev) => prev + 1);

      setCurrentSale({
        items: [],
        subtotal: 0,
        discountAmount: 0,
        tax: 0,
        total: 0,
      });
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCashReceived("");

      setPosRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      toast({
        title: "Error completing sale",
        description:
          error.message || "An error occurred while completing the sale",
        variant: "destructive",
      });
    } finally {
      setIsCompletingSale(false);
    }
  };

  // Cancel the sale
  const cancelSale = () => {
    setCurrentSale({
      items: [],
      subtotal: 0,
      discountAmount: 0,
      tax: 0,
      total: 0,
    });
    setCustomerName("");
    setCustomerPhone("");
    setCashReceived("");
  };

  // Filter sales by timeframe
  const getFilteredSales = () => {
    if (!recentSales.length) return [];

    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case "quarter":
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30));
    }

    return recentSales.filter((sale) => new Date(sale.created_at) >= startDate);
  };

  const filteredSales = getFilteredSales();

  function getTimeframeLabel() {
    switch (timeframe) {
      case "today":
        return "Today";
      case "week":
        return "This week";
      case "month":
        return "Last 30 days";
      case "quarter":
        return "Last 90 days";
      case "year":
        return "This year";
      default:
        return "Last 30 days";
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <TooltipProvider>
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-[1300px]">
        <motion.div
          className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="mb-1 text-2xl font-bold">Genito Fashion Admin</h1>
            <p className="text-gray-600 text-sm">
              Manage products, sales, and inventory
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild>
                <Link href="/">Back to Website</Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <Tabs
          value={activeTab}
          className="space-y-8"
          onValueChange={handleTabChange}
        >
          <div className="overflow-x-auto -mx-4 px-4">
            <TabsList className="h-9 w-max min-w-full justify-start">
              <TabsTrigger value="dashboard" className="text-xs h-8">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="pos" className="text-xs h-8">
                Point of Sale
              </TabsTrigger>
              <TabsTrigger value="inventory" className="text-xs h-8">
                Inventory
              </TabsTrigger>
              <TabsTrigger value="customers" className="text-xs h-8">
                Customers
              </TabsTrigger>
              <TabsTrigger value="returns" className="text-xs h-8">
                Returns
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs h-8">
                Activity
              </TabsTrigger>
              <TabsTrigger value="expenses" className="text-xs h-8">
                Expenses
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs h-8">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs h-8">
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-xl font-bold mb-4 md:mb-0">
                Dashboard Overview
              </h2>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <motion.div
              className="grid gap-4 grid-cols-1 lg:grid-cols-2"
              variants={container}
              initial="hidden"
              animate="show"
            >
              <ViewportSection
                className="col-span-1 lg:col-span-1"
                threshold={0.05}
              >
                <ProfitChart timeframe={timeframe} />
              </ViewportSection>
              <ViewportSection
                className="col-span-1 lg:col-span-1"
                threshold={0.05}
              >
                <ProductsCustomersChart timeframe={timeframe} />
              </ViewportSection>
            </motion.div>

            <ViewportSection threshold={0.05}>
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium">
                    Recent Sales
                  </CardTitle>
                  <CardDescription>
                    {loadingSales
                      ? "Loading sales..."
                      : `You made ${
                          filteredSales.length
                        } sales ${getTimeframeLabel().toLowerCase()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  {loadingSales ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  ) : filteredSales.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No sales found</p>
                      <p className="text-xs mt-1">
                        Sales will appear here once you complete transactions
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-4 px-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sale Number</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSales.map((sale, index) => (
                            <TableRow
                              key={sale.id}
                              className="text-xs"
                              style={{
                                opacity: 0,
                                transform: "translateY(10px)",
                                animation: `fadeIn 0.5s ease forwards ${
                                  0.1 * index + 0.4
                                }s`,
                              }}
                            >
                              <TableCell className="font-medium">
                                {sale.sale_number}
                              </TableCell>
                              <TableCell>
                                {sale.customer_name || "Walk-in"}
                              </TableCell>
                              <TableCell>
                                {new Date(sale.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{sale.items.length}</TableCell>
                              <TableCell className="text-right">
                                {sale.total.toLocaleString()} FCFA
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ViewportSection>

            {/* Low Stock Alert Widget */}
            <ViewportSection threshold={0.05}>
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium">
                    Low Stock Alert
                  </CardTitle>
                  <CardDescription>
                    {loadingLowStock
                      ? "Loading..."
                      : `${lowStockProducts.length} product${
                          lowStockProducts.length !== 1 ? "s" : ""
                        } with low stock`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  {loadingLowStock ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-4 w-full" />
                      ))}
                    </div>
                  ) : lowStockProducts.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">All products are well stocked</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {lowStockProducts.slice(0, 10).map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-xs p-2 rounded border"
                        >
                          <div>
                            <span className="font-medium">
                              {item.product_name}
                            </span>
                            {item.size && (
                              <span className="text-muted-foreground ml-1">
                                (Size {item.size})
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-red-600 font-medium">
                              {item.current_stock} left
                            </span>
                          </div>
                        </div>
                      ))}
                      {lowStockProducts.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          +{lowStockProducts.length - 10} more
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </ViewportSection>
          </TabsContent>

          <TabsContent value="pos" className="space-y-8">
            <div className="grid gap-4 lg:gap-8 grid-cols-1 lg:grid-cols-3">
              <ViewportSection className="lg:col-span-2" threshold={0.05}>
                <Card className="pb-4">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-xs font-medium">
                      New Sale
                    </CardTitle>
                    <CardDescription>
                      Add products to the current sale
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 py-2">
                    <div className="mb-4">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Search products..."
                          className="flex-1"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Button
                          variant="secondary"
                          onClick={() => setSearchQuery("")}
                        >
                          {searchQuery ? "Clear" : "Search"}
                        </Button>
                      </div>
                    </div>
                    {loadingPosProducts && filteredPosProducts.length === 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                        {Array.from({ length: 12 }).map((_, index) => (
                          <div key={index} className="space-y-2">
                            <Card className="cursor-pointer transition-all">
                              <CardContent className="p-4 py-2 px-4">
                                <div className="text-center">
                                  <div className="mb-2 flex h-20 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                    <Skeleton className="h-full w-full" />
                                  </div>
                                  <Skeleton className="h-3 w-3/4 mx-auto mb-1" />
                                  <Skeleton className="h-4 w-1/2 mx-auto" />
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    ) : filteredPosProducts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery
                          ? "No products found matching your search"
                          : "No products available"}
                      </div>
                    ) : (
                      <>
                        <motion.div
                          key={`pos-products-${posPage}-${debouncedSearchQuery}`}
                          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4"
                          variants={container}
                          initial="hidden"
                          animate="show"
                          data-pos-product-list
                        >
                          {filteredPosProducts.map((product, index) => (
                            <motion.div key={product.id} variants={item}>
                              <Card
                                className={`cursor-pointer transition-all hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                  product.stock === 0
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                onClick={() => addToSale(product)}
                              >
                                <CardContent className="p-4 py-2 px-4">
                                  <motion.div
                                    className="text-center"
                                    whileHover={{
                                      scale: product.stock > 0 ? 1.05 : 1,
                                    }}
                                    whileTap={{
                                      scale: product.stock > 0 ? 0.95 : 1,
                                    }}
                                  >
                                    <div className="mb-2 flex h-20 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                                      <Image
                                        src={
                                          product.image_url ||
                                          product.images?.[0]?.url ||
                                          "/placeholder.svg"
                                        }
                                        alt={product.name}
                                        width={80}
                                        height={80}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                      />
                                      {product.stock === 0 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                          <span className="text-xs text-white font-bold">
                                            Out of Stock
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <h3 className="mb-1 text-xs font-medium">
                                      {product.name}
                                    </h3>
                                    {isDiscountActive(
                                      product.discount,
                                      product.discount_end_time
                                    ) ? (
                                      <div className="space-y-0.5">
                                        <p className="text-xs line-through text-muted-foreground">
                                          {product.price.toLocaleString()} FCFA
                                        </p>
                                        <p className="text-xs font-bold text-green-600">
                                          {Math.round(
                                            product.price *
                                              (1 -
                                                (product.discount || 0) / 100)
                                          ).toLocaleString()}{" "}
                                          FCFA
                                        </p>
                                        <p className="text-xs text-green-600 font-medium">
                                          {product.discount}% OFF
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-xs font-bold">
                                        {product.price.toLocaleString()} FCFA
                                      </p>
                                    )}
                                    {product.stock > 0 &&
                                      product.stock <= 10 && (
                                        <p className="text-xs text-yellow-600 mt-1">
                                          Only {product.stock} left
                                        </p>
                                      )}
                                  </motion.div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </motion.div>

                        {/* Pagination Controls */}
                        {posPagination.total > 0 && (
                          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-muted-foreground">
                              Showing{" "}
                              <span className="font-medium">
                                {(posPagination.page - 1) *
                                  posPagination.limit +
                                  1}
                              </span>{" "}
                              to{" "}
                              <span className="font-medium">
                                {Math.min(
                                  posPagination.page * posPagination.limit,
                                  posPagination.total
                                )}
                              </span>{" "}
                              of{" "}
                              <span className="font-medium">
                                {posPagination.total}
                              </span>{" "}
                              products
                            </div>
                            {posPagination.totalPages > 1 && (
                              <div className="flex items-center gap-1">
                                {/* First Page Button */}
                                {posPagination.totalPages > 5 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (!loadingPosProducts && posPage > 1) {
                                        setPosPage(1);
                                      }
                                    }}
                                    disabled={
                                      posPage === 1 || loadingPosProducts
                                    }
                                    className="min-w-[40px]"
                                    title="First page"
                                  >
                                    1
                                  </Button>
                                )}

                                {/* Previous Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      !loadingPosProducts &&
                                      posPagination.hasPrev
                                    ) {
                                      const newPage = Math.max(1, posPage - 1);
                                      setPosPage(newPage);
                                    }
                                  }}
                                  disabled={
                                    !posPagination.hasPrev || loadingPosProducts
                                  }
                                  title="Previous page"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                  <span className="sr-only sm:not-sr-only sm:ml-1">
                                    Previous
                                  </span>
                                </Button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                  {(() => {
                                    const totalPages = posPagination.totalPages;
                                    const currentPage = posPagination.page;
                                    const maxVisible = 5;
                                    let startPage: number;
                                    let endPage: number;

                                    if (totalPages <= maxVisible) {
                                      // Show all pages if total is less than max visible
                                      startPage = 1;
                                      endPage = totalPages;
                                    } else if (currentPage <= 3) {
                                      // Near the beginning
                                      startPage = 1;
                                      endPage = maxVisible;
                                    } else if (currentPage >= totalPages - 2) {
                                      // Near the end
                                      startPage = totalPages - maxVisible + 1;
                                      endPage = totalPages;
                                    } else {
                                      // In the middle
                                      startPage = currentPage - 2;
                                      endPage = currentPage + 2;
                                    }

                                    const pages: (number | string)[] = [];

                                    if (startPage > 1) {
                                      pages.push(1);
                                      if (startPage > 2) {
                                        pages.push("ellipsis-start");
                                      }
                                    }

                                    for (let i = startPage; i <= endPage; i++) {
                                      pages.push(i);
                                    }

                                    if (endPage < totalPages) {
                                      if (endPage < totalPages - 1) {
                                        pages.push("ellipsis-end");
                                      }
                                      pages.push(totalPages);
                                    }

                                    return pages.map((page, index) => {
                                      if (typeof page === "string") {
                                        return (
                                          <span
                                            key={`${page}-${index}`}
                                            className="px-2 text-muted-foreground"
                                          >
                                            ...
                                          </span>
                                        );
                                      }

                                      return (
                                        <Button
                                          key={page}
                                          variant={
                                            posPagination.page === page
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          onClick={() => {
                                            if (
                                              !loadingPosProducts &&
                                              posPagination.page !== page
                                            ) {
                                              setPosPage(page);
                                            }
                                          }}
                                          disabled={loadingPosProducts}
                                          className="min-w-[40px]"
                                          aria-label={`Go to page ${page}`}
                                          aria-current={
                                            posPagination.page === page
                                              ? "page"
                                              : undefined
                                          }
                                        >
                                          {page}
                                        </Button>
                                      );
                                    });
                                  })()}
                                </div>

                                {/* Next Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      !loadingPosProducts &&
                                      posPagination.hasNext
                                    ) {
                                      const newPage = Math.min(
                                        posPagination.totalPages,
                                        posPage + 1
                                      );
                                      setPosPage(newPage);
                                    }
                                  }}
                                  disabled={
                                    !posPagination.hasNext || loadingPosProducts
                                  }
                                  title="Next page"
                                >
                                  <span className="sr-only sm:not-sr-only sm:mr-1">
                                    Next
                                  </span>
                                  <ChevronRight className="h-4 w-4" />
                                </Button>

                                {/* Last Page Button */}
                                {posPagination.totalPages > 5 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (
                                        !loadingPosProducts &&
                                        posPage < posPagination.totalPages
                                      ) {
                                        setPosPage(posPagination.totalPages);
                                      }
                                    }}
                                    disabled={
                                      posPage === posPagination.totalPages ||
                                      loadingPosProducts
                                    }
                                    className="min-w-[40px]"
                                    title="Last page"
                                  >
                                    {posPagination.totalPages}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </ViewportSection>
              <ViewportSection threshold={0.05} className="relative">
                <Card className="sticky top-20">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-xs font-medium">
                      Current Sale
                    </CardTitle>
                    <CardDescription>
                      {currentSale.items.length} item
                      {currentSale.items.length !== 1 ? "s" : ""} in cart
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 py-6">
                    <div className="space-y-4">
                      {/* Customer Information */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="customer-phone" className="text-xs">
                            Customer Phone (Optional)
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help text-muted-foreground">
                                ℹ️
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Enter phone number to auto-fill customer details
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Popover
                          open={
                            posCustomerSearchOpen &&
                            posCustomerSearchResults.length > 0 &&
                            posCustomerSearchQuery.trim().length >= 2
                          }
                          onOpenChange={(open) => {
                            setPosCustomerSearchOpen(open);
                            // Maintain focus on input when dropdown opens
                            if (open && customerPhoneInputRef.current) {
                              setTimeout(() => {
                                customerPhoneInputRef.current?.focus();
                              }, 0);
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <div>
                              <Input
                                ref={customerPhoneInputRef}
                                id="customer-phone"
                                placeholder="Enter phone number"
                                value={customerPhone}
                                onChange={(e) => {
                                  const phone = e.target.value;
                                  setCustomerPhone(phone);
                                  setPosCustomerSearchQuery(phone);
                                  if (phone.trim().length >= 2) {
                                    setPosCustomerSearchOpen(true);
                                    // Ensure input maintains focus
                                    setTimeout(() => {
                                      e.target.focus();
                                    }, 0);
                                  } else {
                                    setPosCustomerSearchOpen(false);
                                  }
                                }}
                                onFocus={() => {
                                  if (
                                    customerPhone.trim().length >= 2 &&
                                    posCustomerSearchResults.length > 0
                                  ) {
                                    setPosCustomerSearchOpen(true);
                                  }
                                }}
                                onBlur={(e) => {
                                  // Don't close if clicking inside the popover
                                  const relatedTarget =
                                    e.relatedTarget as HTMLElement;
                                  if (
                                    relatedTarget &&
                                    relatedTarget.closest('[role="listbox"]')
                                  ) {
                                    return;
                                  }
                                  // Delay closing to allow selection
                                  setTimeout(() => {
                                    if (
                                      document.activeElement !==
                                      customerPhoneInputRef.current
                                    ) {
                                      setPosCustomerSearchOpen(false);
                                    }
                                  }, 200);
                                }}
                                className="h-8 text-xs"
                              />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[var(--radix-popover-trigger-width)] p-0"
                            align="start"
                            side="bottom"
                            sideOffset={4}
                            onOpenAutoFocus={(e) => {
                              // Prevent auto-focus on popover content
                              e.preventDefault();
                              // Keep focus on input
                              customerPhoneInputRef.current?.focus();
                            }}
                          >
                            <Command shouldFilter={false}>
                              <CommandList>
                                {isSearchingPosCustomers ? (
                                  <div className="py-6 text-center text-sm text-muted-foreground">
                                    Searching...
                                  </div>
                                ) : posCustomerSearchResults.length === 0 ? (
                                  <CommandEmpty>
                                    No customers found.
                                  </CommandEmpty>
                                ) : (
                                  <CommandGroup>
                                    {posCustomerSearchResults.map(
                                      (customer) => (
                                        <CommandItem
                                          key={customer.id}
                                          value={`${customer.phone} ${
                                            customer.name
                                          } ${customer.email || ""}`}
                                          onSelect={() => {
                                            setCustomerPhone(customer.phone);
                                            setCustomerName(
                                              customer.name || ""
                                            );
                                            setCustomerEmail(
                                              customer.email || ""
                                            );
                                            setPosCustomerSearchOpen(false);
                                            setPosCustomerSearchQuery("");
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={`mr-2 h-4 w-4 ${
                                              customerPhone === customer.phone
                                                ? "opacity-100"
                                                : "opacity-0"
                                            }`}
                                          />
                                          <div className="flex flex-col">
                                            <span className="font-medium">
                                              {customer.name}
                                            </span>
                                            <span className="text-xs text-foreground/80 dark:text-foreground/70">
                                              {customer.phone}
                                              {customer.email &&
                                                ` • ${customer.email}`}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      )
                                    )}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Label htmlFor="customer-name" className="text-xs">
                          Customer Name (Optional)
                        </Label>
                        <Input
                          id="customer-name"
                          placeholder="Enter customer name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Label htmlFor="customer-email" className="text-xs">
                          Customer Email (Optional)
                        </Label>
                        <Input
                          id="customer-email"
                          type="email"
                          placeholder="customer@example.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Sale Items */}
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {currentSale.items.length > 0 ? (
                          currentSale.items.map((item) => {
                            const hasDiscount = isDiscountActive(
                              item.discount,
                              item.discount_end_time
                            );
                            return (
                              <div
                                key={item.id}
                                className="flex justify-between items-start p-2 border rounded-md"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-medium block truncate">
                                    {item.name}
                                    {item.size && (
                                      <span className="ml-1 text-muted-foreground">
                                        (Size {item.size})
                                      </span>
                                    )}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center border rounded">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 p-0"
                                        onClick={() =>
                                          updateItemQuantity(
                                            item.id,
                                            item.quantity - 1,
                                            item.size
                                          )
                                        }
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="text-xs px-2 min-w-[2rem] text-center">
                                        {item.quantity}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 p-0"
                                        onClick={() =>
                                          updateItemQuantity(
                                            item.id,
                                            item.quantity + 1,
                                            item.size
                                          )
                                        }
                                        disabled={item.quantity >= item.stock}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {hasDiscount ? (
                                        <>
                                          <span className="line-through text-muted-foreground">
                                            {item.price.toLocaleString()}
                                          </span>{" "}
                                          <span className="text-green-600 font-medium">
                                            {item.finalPrice.toLocaleString()}
                                          </span>
                                        </>
                                      ) : (
                                        <span>
                                          {item.finalPrice.toLocaleString()}
                                        </span>
                                      )}{" "}
                                      FCFA
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-2">
                                  <span className="text-xs font-medium">
                                    {(
                                      item.finalPrice * item.quantity
                                    ).toLocaleString()}{" "}
                                    FCFA
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                    onClick={() =>
                                      removeFromSale(item.id, item.size)
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <p className="text-sm">No items added yet</p>
                            <p className="text-xs mt-1">
                              Click on products to add them to the sale
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Totals */}
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Subtotal</span>
                          <span className="font-medium">
                            {currentSale.subtotal.toLocaleString()} FCFA
                          </span>
                        </div>
                        {currentSale.discountAmount > 0 && (
                          <div className="flex justify-between text-xs text-green-600">
                            <span>Discount</span>
                            <span className="font-medium">
                              -{currentSale.discountAmount.toLocaleString()}{" "}
                              FCFA
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs">
                          <span>Tax</span>
                          <span className="font-medium">
                            {currentSale.tax.toLocaleString()} FCFA
                          </span>
                        </div>
                        <div className="flex justify-between text-base font-bold border-t pt-2">
                          <span>Total</span>
                          <span>{currentSale.total.toLocaleString()} FCFA</span>
                        </div>
                      </div>

                      {/* Cash Received */}
                      {currentSale.items.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="cash-received" className="text-xs">
                              Cash Received (FCFA)
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help text-muted-foreground">
                                  ℹ️
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Enter the amount received from customer</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="cash-received"
                            type="number"
                            placeholder="Enter amount"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            className="h-8 text-xs"
                            min={currentSale.total}
                          />
                          {cashReceived &&
                            parseFloat(cashReceived) >= currentSale.total && (
                              <div className="text-xs text-green-600">
                                Change:{" "}
                                {(
                                  parseFloat(cashReceived) - currentSale.total
                                ).toLocaleString()}{" "}
                                FCFA
                              </div>
                            )}
                          {cashReceived &&
                            parseFloat(cashReceived) < currentSale.total && (
                              <div className="text-xs text-red-600">
                                Insufficient:{" "}
                                {(
                                  currentSale.total - parseFloat(cashReceived)
                                ).toLocaleString()}{" "}
                                FCFA needed
                              </div>
                            )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-x-2 flex">
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                className="w-full"
                                variant="emerald"
                                disabled={
                                  currentSale.items.length === 0 ||
                                  isCompletingSale ||
                                  !cashReceived ||
                                  parseFloat(cashReceived) < currentSale.total
                                }
                                onClick={completeSale}
                              >
                                {isCompletingSale
                                  ? "Processing..."
                                  : "Complete Sale"}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {currentSale.items.length === 0
                                  ? "Add products to the sale first"
                                  : !cashReceived
                                  ? "Enter cash received amount"
                                  : parseFloat(cashReceived) < currentSale.total
                                  ? "Cash received must be at least equal to total"
                                  : "Complete and process the sale"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled={
                              currentSale.items.length === 0 || isCompletingSale
                            }
                            onClick={cancelSale}
                          >
                            Cancel Sale
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ViewportSection>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-8">
            <ViewportSection threshold={0.05}>
              <Card>
                <CardHeader className="pb-2 pt-4 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xs font-medium">
                      Inventory Management
                    </CardTitle>
                    <CardDescription>
                      Manage your product inventory
                    </CardDescription>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => setIsAddProductDialogOpen(true)}
                          className="w-full sm:w-auto"
                        >
                          Add Product
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add a new product to your inventory</p>
                      </TooltipContent>
                    </Tooltip>
                  </motion.div>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <div className="mb-4 flex items-center gap-2">
                    <Input
                      placeholder="Search inventory..."
                      className="max-w-sm"
                      value={inventorySearchQuery}
                      onChange={(e) => setInventorySearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setInventoryPage(1);
                        }
                      }}
                    />
                    {inventorySearchQuery && (
                      <Button
                        variant="secondary"
                        onClick={() => setInventorySearchQuery("")}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  {loadingInventory ? (
                    <div className="space-y-2 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price (FCFA)</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.from({ length: 10 }).map((_, index) => (
                            <TableRow key={index} className="text-xs">
                              <TableCell>
                                <Skeleton className="h-4 w-6" />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Skeleton className="h-10 w-10 rounded-md" />
                                  <Skeleton className="h-4 w-32" />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-20" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-24" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-12" />
                              </TableCell>
                              <TableCell className="text-right">
                                <Skeleton className="h-8 w-20 ml-auto" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : inventoryProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {inventorySearchQuery
                        ? "No products found matching your search"
                        : "No products in inventory"}
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto -mx-4 px-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Product</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Price (FCFA)</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inventoryProducts.map((product, index) => {
                              // Calculate row number based on pagination
                              const rowNumber =
                                (inventoryPagination.page - 1) *
                                  inventoryPagination.limit +
                                index +
                                1;

                              return (
                                <TableRow
                                  key={product.id}
                                  className="text-xs"
                                  style={{
                                    opacity: 0,
                                    transform: "translateY(10px)",
                                    animation: `fadeIn 0.5s ease forwards ${
                                      0.1 * index
                                    }s`,
                                  }}
                                >
                                  <TableCell className="font-medium">
                                    {rowNumber}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100">
                                        <Image
                                          src={
                                            product.image_url ||
                                            product.images?.[0]?.url ||
                                            "/placeholder.svg"
                                          }
                                          alt={product.name}
                                          width={40}
                                          height={40}
                                          className="h-full w-full object-cover"
                                          loading="lazy"
                                        />
                                      </div>
                                      <span className="text-xs">
                                        {product.name}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {product.category?.name ||
                                      product.category ||
                                      "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    {product.price.toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={
                                        product.stock > 10
                                          ? "text-green-600"
                                          : product.stock > 0
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                      }
                                    >
                                      {product.stock}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          Actions{" "}
                                          <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setStockAdjustmentDialog({
                                              open: true,
                                              product,
                                            });
                                            setAdjustmentQuantity("");
                                            setAdjustmentSize("");
                                            setAdjustmentReason("");
                                            setAdjustmentNotes("");
                                          }}
                                        >
                                          Adjust Stock
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Link
                                            href={`/products/${
                                              product.category?.slug || "all"
                                            }/${product.id}`}
                                          >
                                            View Details
                                          </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-500">
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination Controls */}
                      {inventoryPagination.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Showing{" "}
                            {(inventoryPagination.page - 1) *
                              inventoryPagination.limit +
                              1}{" "}
                            to{" "}
                            {Math.min(
                              inventoryPagination.page *
                                inventoryPagination.limit,
                              inventoryPagination.total
                            )}{" "}
                            of {inventoryPagination.total} products
                          </div>
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setInventoryPage((p) => Math.max(1, p - 1))
                                  }
                                  disabled={!inventoryPagination.hasPrev}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                  Previous
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Go to previous page</p>
                              </TooltipContent>
                            </Tooltip>
                            <div className="flex items-center gap-1">
                              {Array.from(
                                {
                                  length: Math.min(
                                    5,
                                    inventoryPagination.totalPages
                                  ),
                                },
                                (_, i) => {
                                  let pageNum: number;
                                  if (inventoryPagination.totalPages <= 5) {
                                    pageNum = i + 1;
                                  } else if (inventoryPagination.page <= 3) {
                                    pageNum = i + 1;
                                  } else if (
                                    inventoryPagination.page >=
                                    inventoryPagination.totalPages - 2
                                  ) {
                                    pageNum =
                                      inventoryPagination.totalPages - 4 + i;
                                  } else {
                                    pageNum = inventoryPagination.page - 2 + i;
                                  }

                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={
                                        inventoryPagination.page === pageNum
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      onClick={() => setInventoryPage(pageNum)}
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
                                setInventoryPage((p) =>
                                  Math.min(
                                    inventoryPagination.totalPages,
                                    p + 1
                                  )
                                )
                              }
                              disabled={!inventoryPagination.hasNext}
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </ViewportSection>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-8">
            <ViewportSection threshold={0.05}>
              <Card>
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-medium">
                      Customer Management
                    </CardTitle>
                    <CardDescription>
                      Manage your customers and their purchase history
                    </CardDescription>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => setIsCustomerDialogOpen(true)}>
                        Add Customer
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Register a new customer</p>
                    </TooltipContent>
                  </Tooltip>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <div className="mb-4 flex items-center gap-2">
                    <Input
                      placeholder="Search customers..."
                      className="max-w-sm"
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setCustomerPage(1);
                        }
                      }}
                    />
                  </div>
                  {loadingCustomers ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No customers found
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto -mx-4 px-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Total Spent</TableHead>
                              <TableHead>Purchases</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customers.map((customer) => (
                              <TableRow key={customer.id} className="text-xs">
                                <TableCell className="font-medium">
                                  {customer.name}
                                </TableCell>
                                <TableCell>{customer.phone}</TableCell>
                                <TableCell>{customer.email || "N/A"}</TableCell>
                                <TableCell>
                                  {customer.total_spent.toLocaleString()} FCFA
                                </TableCell>
                                <TableCell>{customer.purchase_count}</TableCell>
                                <TableCell className="text-right">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            const response = await fetch(
                                              `/api/customers/${customer.id}`
                                            );
                                            if (response.ok) {
                                              const data =
                                                await response.json();
                                              setSelectedCustomer(
                                                data.customer
                                              );
                                              setIsCustomerDialogOpen(true);
                                            }
                                          } catch (error) {
                                            console.error(
                                              "Error fetching customer:",
                                              error
                                            );
                                          }
                                        }}
                                      >
                                        View
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        View customer details and purchase
                                        history
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {customerPagination.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCustomerPage((p) => Math.max(1, p - 1))
                            }
                            disabled={!customerPagination.hasPrev}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Prev
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Page {customerPagination.page} of{" "}
                            {customerPagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCustomerPage((p) =>
                                Math.min(customerPagination.totalPages, p + 1)
                              )
                            }
                            disabled={!customerPagination.hasNext}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </ViewportSection>
          </TabsContent>

          {/* Returns Tab */}
          <TabsContent value="returns" className="space-y-8">
            <ViewportSection threshold={0.05}>
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium">
                    Returns & Refunds
                  </CardTitle>
                  <CardDescription>
                    Manage product returns and refunds
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  {loadingReturns ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : returns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No returns found
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto -mx-4 px-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Return Number</TableHead>
                              <TableHead>Sale Number</TableHead>
                              <TableHead>Total Refund</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {returns.map((ret) => (
                              <TableRow key={ret.id} className="text-xs">
                                <TableCell className="font-medium">
                                  {ret.return_number}
                                </TableCell>
                                <TableCell>
                                  {ret.sale_number || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {ret.total_refund.toLocaleString()} FCFA
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={
                                      ret.status === "approved"
                                        ? "text-green-600"
                                        : ret.status === "rejected"
                                        ? "text-red-600"
                                        : "text-yellow-600"
                                    }
                                  >
                                    {ret.status}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    ret.created_at
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        const response = await fetch(
                                          `/api/returns/${ret.id}`
                                        );
                                        if (response.ok) {
                                          const data = await response.json();
                                          toast({
                                            title: "Return Details",
                                            description: `Return ${data.return.return_number}`,
                                          });
                                        }
                                      } catch (error) {
                                        console.error(
                                          "Error fetching return:",
                                          error
                                        );
                                      }
                                    }}
                                  >
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {returnPagination.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setReturnPage((p) => Math.max(1, p - 1))
                            }
                            disabled={!returnPagination.hasPrev}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Prev
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Page {returnPagination.page} of{" "}
                            {returnPagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setReturnPage((p) =>
                                Math.min(returnPagination.totalPages, p + 1)
                              )
                            }
                            disabled={!returnPagination.hasNext}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </ViewportSection>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-8">
            <ViewportSection threshold={0.05}>
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium">
                    Activity Log
                  </CardTitle>
                  <CardDescription>
                    View all admin activities and changes
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  {loadingActivityLogs ? (
                    <div className="space-y-2">
                      {Array.from({ length: 10 }).map((_, index) => (
                        <Skeleton key={index} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : activityLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No activity logs found
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {activityLogs.map((log) => (
                          <div
                            key={log.id}
                            className="flex justify-between items-start p-2 border rounded text-xs"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{log.action}</div>
                              <div className="text-muted-foreground">
                                {log.user_name || "Unknown"} - {log.entity_type}
                              </div>
                              <div className="text-muted-foreground text-xs mt-1">
                                {new Date(log.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {activityPagination.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setActivityPage((p) => Math.max(1, p - 1))
                            }
                            disabled={!activityPagination.hasPrev}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Prev
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Page {activityPagination.page} of{" "}
                            {activityPagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setActivityPage((p) =>
                                Math.min(activityPagination.totalPages, p + 1)
                              )
                            }
                            disabled={!activityPagination.hasNext}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </ViewportSection>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-8">
            <ViewportSection threshold={0.05}>
              <Card>
                <CardHeader className="pb-2 pt-4 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xs font-medium">
                      Expense Management
                    </CardTitle>
                    <CardDescription>
                      Track and manage business expenses
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setIsExpenseDialogOpen(true);
                      setSelectedExpense(null);
                      setExpenseFormData({
                        category: "",
                        amount: "",
                        description: "",
                        date: new Date().toISOString().split("T")[0],
                        receipt_url: "",
                      });
                    }}
                    className="w-full sm:w-auto"
                  >
                    Add Expense
                  </Button>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  {loadingExpenses ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : expenses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No expenses found
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto -mx-4 px-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Expense #</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Staff</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {expenses.map((expense) => (
                              <TableRow key={expense.id} className="text-xs">
                                <TableCell className="font-medium">
                                  {expense.expense_number}
                                </TableCell>
                                <TableCell className="capitalize">
                                  {expense.category}
                                </TableCell>
                                <TableCell>
                                  {expense.amount.toLocaleString()} FCFA
                                </TableCell>
                                <TableCell>
                                  {new Date(expense.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {expense.staff_name || "N/A"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            const response = await fetch(
                                              `/api/expenses/${expense.id}`
                                            );
                                            if (response.ok) {
                                              const data =
                                                await response.json();
                                              setSelectedExpense(data.expense);
                                              setExpenseFormData({
                                                category: data.expense.category,
                                                amount:
                                                  data.expense.amount.toString(),
                                                description:
                                                  data.expense.description ||
                                                  "",
                                                date: new Date(
                                                  data.expense.date
                                                )
                                                  .toISOString()
                                                  .split("T")[0],
                                                receipt_url:
                                                  data.expense.receipt_url ||
                                                  "",
                                              });
                                              setIsExpenseDialogOpen(true);
                                            }
                                          } catch (error) {
                                            console.error(
                                              "Error fetching expense:",
                                              error
                                            );
                                          }
                                        }}
                                      >
                                        Edit
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit expense details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {expensePagination.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setExpensePage((p) => Math.max(1, p - 1))
                            }
                            disabled={!expensePagination.hasPrev}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Prev
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Page {expensePagination.page} of{" "}
                            {expensePagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setExpensePage((p) =>
                                Math.min(expensePagination.totalPages, p + 1)
                              )
                            }
                            disabled={!expensePagination.hasNext}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </ViewportSection>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-xl font-bold mb-4 md:mb-0">Analytics</h2>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sales Analytics */}
            <ViewportSection threshold={0.05}>
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium">
                    Sales Analytics
                  </CardTitle>
                  <CardDescription>
                    Insights into your sales performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  {loadingSalesAnalytics ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : salesAnalytics ? (
                    <div className="space-y-4">
                      {salesAnalytics.averageTransactionValue && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">
                              Avg Transaction
                            </div>
                            <div className="font-bold text-lg">
                              {salesAnalytics.averageTransactionValue.toLocaleString(
                                undefined,
                                { maximumFractionDigits: 0 }
                              )}{" "}
                              FCFA
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Total Transactions
                            </div>
                            <div className="font-bold text-lg">
                              {salesAnalytics.totalTransactions}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Total Revenue
                            </div>
                            <div className="font-bold text-lg">
                              {salesAnalytics.totalRevenue?.toLocaleString()}{" "}
                              FCFA
                            </div>
                          </div>
                        </div>
                      )}
                      {salesAnalytics.topProducts && (
                        <div>
                          <div className="font-medium mb-2">
                            Top Selling Products
                          </div>
                          <div className="space-y-2">
                            {salesAnalytics.topProducts
                              .slice(0, 5)
                              .map((product: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center p-2 border rounded text-xs"
                                >
                                  <div>
                                    <div className="font-medium">
                                      {product.product_name}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {product.quantity_sold} sold
                                    </div>
                                  </div>
                                  <div className="font-medium">
                                    {product.revenue.toLocaleString()} FCFA
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      {salesAnalytics.peakHours && (
                        <div>
                          <div className="font-medium mb-2">
                            Peak Sales Hours
                          </div>
                          <div className="space-y-2">
                            {salesAnalytics.peakHours.map(
                              (hour: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center p-2 border rounded text-xs"
                                >
                                  <div>
                                    {hour.hour}:00 - {hour.hour + 1}:00
                                  </div>
                                  <div className="font-medium">
                                    {hour.sales_count} sales
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No analytics data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </ViewportSection>

            {/* Customer Analytics */}
            <ViewportSection threshold={0.05}>
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium">
                    Customer Analytics
                  </CardTitle>
                  <CardDescription>
                    Customer insights and metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  {loadingCustomerAnalytics ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : customerAnalytics ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">
                            Total Customers
                          </div>
                          <div className="font-bold text-lg">
                            {customerAnalytics.totalCustomers}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Repeat Customer Rate
                          </div>
                          <div className="font-bold text-lg">
                            {customerAnalytics.repeatCustomerRate}%
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Avg Lifetime Value
                          </div>
                          <div className="font-bold text-lg">
                            {parseFloat(
                              customerAnalytics.averageLTV
                            ).toLocaleString()}{" "}
                            FCFA
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Avg Purchase Frequency
                          </div>
                          <div className="font-bold text-lg">
                            {parseFloat(
                              customerAnalytics.averagePurchaseFrequency
                            ).toFixed(1)}
                          </div>
                        </div>
                      </div>
                      {customerAnalytics.topCustomers && (
                        <div>
                          <div className="font-medium mb-2">Top Customers</div>
                          <div className="space-y-2">
                            {customerAnalytics.topCustomers
                              .slice(0, 5)
                              .map((customer: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center p-2 border rounded text-xs"
                                >
                                  <div>
                                    <div className="font-medium">
                                      {customer.name}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {customer.purchase_count} purchases
                                    </div>
                                  </div>
                                  <div className="font-medium">
                                    {customer.lifetime_value.toLocaleString()}{" "}
                                    FCFA
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No customer analytics available
                    </div>
                  )}
                </CardContent>
              </Card>
            </ViewportSection>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-8">
            <ViewportSection threshold={0.05}>
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium">
                    Store Settings
                  </CardTitle>
                  <CardDescription>
                    Configure your store settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  {loadingSettings ? (
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="store-name" className="text-xs">
                          Store Name
                        </Label>
                        <Input
                          id="store-name"
                          value={settingsFormData.store_name}
                          onChange={(e) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              store_name: e.target.value,
                            })
                          }
                          placeholder="Genito Fashion"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency" className="text-xs">
                          Currency
                        </Label>
                        <Select
                          value={settingsFormData.currency}
                          onValueChange={(value) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              currency: value,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FCFA">FCFA</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="XAF">XAF</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax-rate" className="text-xs">
                          Tax Rate (%)
                        </Label>
                        <Input
                          id="tax-rate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={settingsFormData.tax_rate}
                          onChange={(e) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              tax_rate: e.target.value,
                            })
                          }
                          placeholder="0"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="low-stock-threshold"
                          className="text-xs"
                        >
                          Low Stock Threshold
                        </Label>
                        <Input
                          id="low-stock-threshold"
                          type="number"
                          min="0"
                          value={settingsFormData.low_stock_threshold}
                          onChange={(e) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              low_stock_threshold: e.target.value,
                            })
                          }
                          placeholder="10"
                          className="h-8 text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          Products with stock below this number will be flagged
                          as low stock
                        </p>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSettingsFormData({
                              store_name:
                                settings.store_name || "Genito Fashion",
                              currency: settings.currency || "FCFA",
                              tax_rate: settings.tax_rate?.toString() || "0",
                              low_stock_threshold:
                                settings.low_stock_threshold?.toString() ||
                                "10",
                            });
                          }}
                        >
                          Reset
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={async () => {
                            try {
                              // Save all settings
                              const settingsToSave = {
                                store_name: settingsFormData.store_name,
                                currency: settingsFormData.currency,
                                tax_rate:
                                  parseFloat(settingsFormData.tax_rate) || 0,
                                low_stock_threshold:
                                  parseInt(
                                    settingsFormData.low_stock_threshold,
                                    10
                                  ) || 10,
                              };

                              // Update each setting
                              for (const [key, value] of Object.entries(
                                settingsToSave
                              )) {
                                await fetch("/api/settings", {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ key, value }),
                                });
                              }

                              toast({
                                title: "Success",
                                description: "Settings saved successfully",
                              });

                              // Refresh settings
                              const response = await fetch("/api/settings");
                              if (response.ok) {
                                const data = await response.json();
                                setSettings(data.settings || {});
                              }
                            } catch (error: any) {
                              toast({
                                title: "Error",
                                description:
                                  error.message || "Failed to save settings",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Save Settings
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ViewportSection>

            {/* Order Linking Tool */}
            <ViewportSection threshold={0.05}>
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium">
                    Link Orders to User Accounts
                  </CardTitle>
                  <CardDescription>
                    Link existing sales to user accounts retroactively
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Use this tool to link past sales to user accounts. This
                      allows customers to view their purchase history in "My
                      Orders".
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setLinkOrderDialog(true)}
                      className="w-full sm:w-auto"
                    >
                      Link Order to User
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ViewportSection>

            {/* Data Export Section */}
            <ViewportSection threshold={0.05}>
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium">
                    Data Export
                  </CardTitle>
                  <CardDescription>
                    Export your data to CSV format
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Export Type</Label>
                      <Select
                        value=""
                        onValueChange={async (value) => {
                          if (value) {
                            try {
                              const response = await fetch(
                                `/api/export?type=${value}`
                              );
                              if (response.ok) {
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                const contentDisposition = response.headers.get(
                                  "Content-Disposition"
                                );
                                const filename = contentDisposition
                                  ? contentDisposition
                                      .split("filename=")[1]
                                      ?.replace(/"/g, "") ||
                                    `export_${value}.csv`
                                  : `export_${value}.csv`;
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                window.URL.revokeObjectURL(url);
                                toast({
                                  title: "Success",
                                  description: "Data exported successfully",
                                });
                              } else {
                                toast({
                                  title: "Error",
                                  description: "Failed to export data",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to export data",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select data type to export" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="products">Products</SelectItem>
                          <SelectItem value="customers">Customers</SelectItem>
                          <SelectItem value="expenses">Expenses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select a data type above to download as CSV file
                    </p>
                  </div>
                </CardContent>
              </Card>
            </ViewportSection>
          </TabsContent>
        </Tabs>

        <AddProductDialog
          open={isAddProductDialogOpen}
          onOpenChange={(open) => {
            setIsAddProductDialogOpen(open);
            if (!open) {
              if (activeTab === "inventory") {
                setInventoryPage(1);
                setInventoryRefreshKey((prev) => prev + 1);
              } else if (activeTab === "pos") {
                setPosRefreshKey((prev) => prev + 1);
              }
            }
          }}
        />

        {/* Size Selection Dialog */}
        <Dialog
          open={sizeSelectionDialog.open}
          onOpenChange={(open) =>
            setSizeSelectionDialog({
              open,
              product: open ? sizeSelectionDialog.product : null,
            })
          }
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle id="size-selection-title">Select Size</DialogTitle>
              <DialogDescription id="size-selection-description">
                Choose a size for {sizeSelectionDialog.product?.name}. Use arrow
                keys to navigate between sizes, Enter or Space to select.
              </DialogDescription>
            </DialogHeader>
            {sizeSelectionDialog.product?.stock_by_size && (
              <div className="space-y-4">
                <div
                  role="radiogroup"
                  aria-labelledby="size-selection-title"
                  aria-describedby="size-selection-description"
                  className="grid grid-cols-3 gap-2"
                  aria-required="true"
                >
                  <div
                    className="sr-only"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {selectedSize
                      ? `Size ${selectedSize} selected`
                      : "No size selected"}
                  </div>
                  {Object.entries(
                    sizeSelectionDialog.product.stock_by_size
                  ).map(([size, stock], index) => {
                    const isSelected = selectedSize === size;
                    const isDisabled = Number(stock) === 0;
                    const stockCount = Number(stock);
                    const sizes = Object.keys(
                      sizeSelectionDialog.product.stock_by_size || {}
                    );
                    const currentIndex = sizes.indexOf(size);
                    const prevIndex =
                      currentIndex > 0 ? currentIndex - 1 : sizes.length - 1;
                    const nextIndex =
                      currentIndex < sizes.length - 1 ? currentIndex + 1 : 0;

                    return (
                      <Button
                        key={size}
                        ref={(el) => {
                          sizeButtonRefs.current[size] = el;
                        }}
                        variant={isSelected ? "default" : "outline"}
                        className="h-12 group"
                        onClick={() => setSelectedSize(size)}
                        disabled={isDisabled}
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`Size ${size}, ${stockCount} ${
                          stockCount === 1 ? "item" : "items"
                        } available${isDisabled ? ", out of stock" : ""}${
                          isSelected ? ", selected" : ""
                        }`}
                        aria-disabled={isDisabled}
                        title={
                          isDisabled
                            ? `Size ${size} is out of stock`
                            : `Select size ${size}`
                        }
                        tabIndex={
                          isDisabled
                            ? -1
                            : isSelected
                            ? 0
                            : index === 0 && !selectedSize
                            ? 0
                            : -1
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (!isDisabled) {
                              setSelectedSize(size);
                            }
                          } else if (
                            e.key === "ArrowRight" ||
                            e.key === "ArrowDown"
                          ) {
                            e.preventDefault();
                            // Find next available size
                            let nextSize = sizes[nextIndex];
                            let attempts = 0;
                            while (
                              attempts < sizes.length &&
                              Number(
                                sizeSelectionDialog.product.stock_by_size?.[
                                  nextSize
                                ]
                              ) === 0
                            ) {
                              nextSize =
                                sizes[
                                  (sizes.indexOf(nextSize) + 1) % sizes.length
                                ];
                              attempts++;
                            }
                            if (sizeButtonRefs.current[nextSize]) {
                              sizeButtonRefs.current[nextSize]?.focus();
                              setSelectedSize(nextSize);
                            }
                          } else if (
                            e.key === "ArrowLeft" ||
                            e.key === "ArrowUp"
                          ) {
                            e.preventDefault();
                            // Find previous available size
                            let prevSize = sizes[prevIndex];
                            let attempts = 0;
                            while (
                              attempts < sizes.length &&
                              Number(
                                sizeSelectionDialog.product.stock_by_size?.[
                                  prevSize
                                ]
                              ) === 0
                            ) {
                              prevSize =
                                sizes[
                                  (sizes.indexOf(prevSize) - 1 + sizes.length) %
                                    sizes.length
                                ];
                              attempts++;
                            }
                            if (sizeButtonRefs.current[prevSize]) {
                              sizeButtonRefs.current[prevSize]?.focus();
                              setSelectedSize(prevSize);
                            }
                          }
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{size}</span>
                          <span
                            className={`text-xs transition-colors ${
                              isSelected
                                ? "text-foreground/90 dark:text-foreground/90"
                                : isDisabled
                                ? "text-muted-foreground opacity-50"
                                : "text-muted-foreground group-hover:text-foreground/90 dark:group-hover:text-foreground/90"
                            }`}
                            aria-hidden="true"
                          >
                            {stockCount} available
                          </span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
                <div
                  className="flex gap-2"
                  role="group"
                  aria-label="Dialog actions"
                >
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSizeSelectionDialog({ open: false, product: null });
                      setSelectedSize("");
                    }}
                    aria-label="Cancel size selection"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSizeConfirm}
                    disabled={!selectedSize}
                    aria-label={
                      selectedSize
                        ? `Add size ${selectedSize} to sale`
                        : "Select a size first"
                    }
                    aria-disabled={!selectedSize}
                  >
                    Add to Sale
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Receipt Dialog */}
        <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Sale Receipt</DialogTitle>
              <DialogDescription>
                Sale {completedSale?.sale_number}
              </DialogDescription>
            </DialogHeader>
            {completedSale && (
              <div className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>
                      {new Date(completedSale.created_at).toLocaleString()}
                    </span>
                  </div>
                  {completedSale.customer_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer:</span>
                      <span>{completedSale.customer_name}</span>
                    </div>
                  )}
                  {completedSale.customer_phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{completedSale.customer_phone}</span>
                    </div>
                  )}
                  {completedSale.staff_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Staff:</span>
                      <span>{completedSale.staff_name}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="font-medium mb-2">Items:</div>
                  {completedSale.items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm border-b pb-2"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {item.product_name}
                          {item.size && (
                            <span className="ml-1 text-muted-foreground font-normal">
                              (Size {item.size})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.quantity} × {item.final_price.toLocaleString()}{" "}
                          FCFA
                          {item.discount_percentage && (
                            <span className="text-green-600 ml-2">
                              ({item.discount_percentage}% off)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-medium">
                        {item.subtotal.toLocaleString()} FCFA
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{completedSale.subtotal.toLocaleString()} FCFA</span>
                  </div>
                  {completedSale.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>
                        -{completedSale.discount_amount.toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{completedSale.tax.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{completedSale.total.toLocaleString()} FCFA</span>
                  </div>
                  {completedSale.total_cost !== undefined && (
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span>Cost of Goods:</span>
                      <span>
                        {completedSale.total_cost.toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                  {completedSale.total_profit !== undefined && (
                    <div className="flex justify-between text-sm font-medium text-emerald border-t pt-2">
                      <span>Profit:</span>
                      <span>
                        {completedSale.total_profit.toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span>Cash Received:</span>
                    <span>
                      {completedSale.cash_received.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-green-600">
                    <span>Change:</span>
                    <span>{completedSale.change.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      window.print();
                    }}
                  >
                    Print Receipt
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setIsReceiptOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Stock Adjustment Dialog */}
        <Dialog
          open={stockAdjustmentDialog.open}
          onOpenChange={(open) =>
            setStockAdjustmentDialog({
              open,
              product: open ? stockAdjustmentDialog.product : null,
            })
          }
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adjust Stock</DialogTitle>
              <DialogDescription>
                {stockAdjustmentDialog.product?.name}
              </DialogDescription>
            </DialogHeader>
            {stockAdjustmentDialog.product && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adjustment-quantity" className="text-xs">
                    Quantity Change
                  </Label>
                  <Input
                    id="adjustment-quantity"
                    type="number"
                    placeholder="e.g., +10 or -5"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use positive numbers to increase, negative to decrease
                  </p>
                </div>
                {stockAdjustmentDialog.product.stock_by_size &&
                  Object.keys(stockAdjustmentDialog.product.stock_by_size)
                    .length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="adjustment-size" className="text-xs">
                        Size (Optional)
                      </Label>
                      <Select
                        value={adjustmentSize}
                        onValueChange={setAdjustmentSize}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(
                            stockAdjustmentDialog.product.stock_by_size
                          ).map(([size, stock]) => (
                            <SelectItem key={size} value={size}>
                              {size} (Current: {Number(stock)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                <div className="space-y-2">
                  <Label htmlFor="adjustment-reason" className="text-xs">
                    Reason *
                  </Label>
                  <Input
                    id="adjustment-reason"
                    placeholder="e.g., Restock, Damage, etc."
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adjustment-notes" className="text-xs">
                    Notes (Optional)
                  </Label>
                  <Input
                    id="adjustment-notes"
                    placeholder="Additional notes"
                    value={adjustmentNotes}
                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStockAdjustmentDialog({ open: false, product: null });
                      setAdjustmentQuantity("");
                      setAdjustmentSize("");
                      setAdjustmentReason("");
                      setAdjustmentNotes("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={async () => {
                      if (!adjustmentQuantity || !adjustmentReason) {
                        toast({
                          title: "Error",
                          description:
                            "Quantity change and reason are required",
                          variant: "destructive",
                        });
                        return;
                      }
                      try {
                        const response = await fetch(
                          `/api/products/${stockAdjustmentDialog.product?.id}/adjust-stock`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              quantity_change: parseInt(adjustmentQuantity, 10),
                              size: adjustmentSize || undefined,
                              reason: adjustmentReason,
                              notes: adjustmentNotes || undefined,
                            }),
                          }
                        );
                        if (response.ok) {
                          toast({
                            title: "Success",
                            description: "Stock adjusted successfully",
                          });
                          setStockAdjustmentDialog({
                            open: false,
                            product: null,
                          });
                          setAdjustmentQuantity("");
                          setAdjustmentSize("");
                          setAdjustmentReason("");
                          setAdjustmentNotes("");
                          setInventoryRefreshKey((prev) => prev + 1);
                        } else {
                          const data = await response.json();
                          toast({
                            title: "Error",
                            description: data.error || "Failed to adjust stock",
                            variant: "destructive",
                          });
                        }
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description:
                            error.message || "Failed to adjust stock",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={!adjustmentQuantity || !adjustmentReason}
                  >
                    Adjust Stock
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Expense Dialog */}
        <Dialog
          open={isExpenseDialogOpen}
          onOpenChange={(open) => {
            setIsExpenseDialogOpen(open);
            if (!open) {
              setSelectedExpense(null);
              setExpenseFormData({
                category: "",
                amount: "",
                description: "",
                date: new Date().toISOString().split("T")[0],
                receipt_url: "",
              });
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedExpense ? "Edit Expense" : "Add Expense"}
              </DialogTitle>
              <DialogDescription>
                {selectedExpense
                  ? "Update expense details"
                  : "Record a new business expense"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expense-category" className="text-xs">
                  Category *
                </Label>
                <Select
                  value={expenseFormData.category}
                  onValueChange={(value) =>
                    setExpenseFormData({ ...expenseFormData, category: value })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="salaries">Salaries</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="taxes">Taxes</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-amount" className="text-xs">
                  Amount (FCFA) *
                </Label>
                <Input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={expenseFormData.amount}
                  onChange={(e) =>
                    setExpenseFormData({
                      ...expenseFormData,
                      amount: e.target.value,
                    })
                  }
                  placeholder="0.00"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-date" className="text-xs">
                  Date *
                </Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseFormData.date}
                  onChange={(e) =>
                    setExpenseFormData({
                      ...expenseFormData,
                      date: e.target.value,
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-description" className="text-xs">
                  Description
                </Label>
                <Input
                  id="expense-description"
                  value={expenseFormData.description}
                  onChange={(e) =>
                    setExpenseFormData({
                      ...expenseFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Optional description"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-receipt" className="text-xs">
                  Receipt URL
                </Label>
                <Input
                  id="expense-receipt"
                  value={expenseFormData.receipt_url}
                  onChange={(e) =>
                    setExpenseFormData({
                      ...expenseFormData,
                      receipt_url: e.target.value,
                    })
                  }
                  placeholder="Optional receipt URL"
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsExpenseDialogOpen(false);
                    setSelectedExpense(null);
                    setExpenseFormData({
                      category: "",
                      amount: "",
                      description: "",
                      date: new Date().toISOString().split("T")[0],
                      receipt_url: "",
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={async () => {
                    if (!expenseFormData.category || !expenseFormData.amount) {
                      toast({
                        title: "Error",
                        description: "Category and amount are required",
                        variant: "destructive",
                      });
                      return;
                    }
                    try {
                      const url = selectedExpense
                        ? `/api/expenses/${selectedExpense.id}`
                        : "/api/expenses";
                      const method = selectedExpense ? "PATCH" : "POST";
                      const response = await fetch(url, {
                        method,
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          category: expenseFormData.category,
                          amount: parseFloat(expenseFormData.amount),
                          description: expenseFormData.description || undefined,
                          date: expenseFormData.date,
                          receipt_url: expenseFormData.receipt_url || undefined,
                        }),
                      });
                      if (response.ok) {
                        toast({
                          title: "Success",
                          description: selectedExpense
                            ? "Expense updated successfully"
                            : "Expense created successfully",
                        });
                        setIsExpenseDialogOpen(false);
                        setSelectedExpense(null);
                        setExpenseFormData({
                          category: "",
                          amount: "",
                          description: "",
                          date: new Date().toISOString().split("T")[0],
                          receipt_url: "",
                        });
                        setExpensePage(1);
                        if (activeTab === "expenses") {
                          const params = new URLSearchParams();
                          params.append("page", "1");
                          params.append("limit", "20");
                          const refetchResponse = await fetch(
                            `/api/expenses?${params.toString()}`
                          );
                          if (refetchResponse.ok) {
                            const data = await refetchResponse.json();
                            setExpenses(data.expenses || []);
                            setExpensePagination(
                              data.pagination || expensePagination
                            );
                          }
                        }
                      } else {
                        const data = await response.json();
                        toast({
                          title: "Error",
                          description: data.error || "Failed to save expense",
                          variant: "destructive",
                        });
                      }
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || "Failed to save expense",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={
                    !expenseFormData.category || !expenseFormData.amount
                  }
                >
                  {selectedExpense ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Link Order Dialog */}
        <Dialog
          open={linkOrderDialog}
          onOpenChange={(open) => {
            setLinkOrderDialog(open);
            if (!open) {
              setLinkOrderForm({
                sale_id: "",
                user_email: "",
                user_phone: "",
              });
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Link Order to User Account</DialogTitle>
              <DialogDescription>
                Link an existing sale to a user account by providing the sale ID
                and user email or phone
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-sale-id" className="text-xs">
                  Sale ID *
                </Label>
                <Input
                  id="link-sale-id"
                  value={linkOrderForm.sale_id}
                  onChange={(e) =>
                    setLinkOrderForm({
                      ...linkOrderForm,
                      sale_id: e.target.value,
                    })
                  }
                  placeholder="Enter sale ID (MongoDB ObjectId)"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-user-email" className="text-xs">
                  User Email
                </Label>
                <Input
                  id="link-user-email"
                  type="email"
                  value={linkOrderForm.user_email}
                  onChange={(e) =>
                    setLinkOrderForm({
                      ...linkOrderForm,
                      user_email: e.target.value,
                      user_phone: "",
                    })
                  }
                  placeholder="user@example.com"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-user-phone" className="text-xs">
                  User Phone
                </Label>
                <Input
                  id="link-user-phone"
                  type="tel"
                  value={linkOrderForm.user_phone}
                  onChange={(e) =>
                    setLinkOrderForm({
                      ...linkOrderForm,
                      user_phone: e.target.value,
                      user_email: "",
                    })
                  }
                  placeholder="+237 XXX XXX XXX"
                  className="h-8 text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Provide either email or phone (not both)
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setLinkOrderDialog(false);
                    setLinkOrderForm({
                      sale_id: "",
                      user_email: "",
                      user_phone: "",
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={async () => {
                    if (!linkOrderForm.sale_id) {
                      toast({
                        title: "Error",
                        description: "Sale ID is required",
                        variant: "destructive",
                      });
                      return;
                    }

                    if (
                      !linkOrderForm.user_email &&
                      !linkOrderForm.user_phone
                    ) {
                      toast({
                        title: "Error",
                        description: "Either email or phone is required",
                        variant: "destructive",
                      });
                      return;
                    }

                    try {
                      const response = await fetch("/api/sales/link-user", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          sale_id: linkOrderForm.sale_id.trim(),
                          user_email: linkOrderForm.user_email.trim() || null,
                          user_phone: linkOrderForm.user_phone.trim() || null,
                        }),
                      });

                      if (response.ok) {
                        const data = await response.json();
                        toast({
                          title: "Success",
                          description: `Sale linked to ${data.user_name}'s account`,
                        });
                        setLinkOrderDialog(false);
                        setLinkOrderForm({
                          sale_id: "",
                          user_email: "",
                          user_phone: "",
                        });
                      } else {
                        const errorData = await response.json();
                        toast({
                          title: "Error",
                          description:
                            errorData.error || "Failed to link order",
                          variant: "destructive",
                        });
                      }
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || "Failed to link order",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={
                    !linkOrderForm.sale_id ||
                    (!linkOrderForm.user_email && !linkOrderForm.user_phone)
                  }
                >
                  Link Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </TooltipProvider>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto px-4 py-8 max-w-[1300px]">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Skeleton className="h-8 w-48 mx-auto mb-4" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
          </div>
        </main>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
