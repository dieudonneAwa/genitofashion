"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  Plus,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/admin/image-upload";
import { ProgressStepper } from "@/components/ui/progress-stepper";
import { motion, AnimatePresence } from "framer-motion";
import type { Category, ProductImage } from "@/types/database";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductDialog({
  open,
  onOpenChange,
}: AddProductDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<ProductImage[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    name?: string;
    description?: string;
    category?: string;
    features?: string[];
    confidence?: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    purchase_price: "",
    category_id: "",
    stock: "0",
    discount: "",
    discount_end_time: "",
    brand: "",
    size: "",
    gender: "",
    color: "",
  });

  // Size-based inventory: { size: quantity }
  const [stockBySize, setStockBySize] = useState<Record<string, number>>({});
  const [newSizeInput, setNewSizeInput] = useState("");
  const [newSizeQuantity, setNewSizeQuantity] = useState("");

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const totalSteps = 4;

  const steps = [
    { id: 1, label: "Basic Info", description: "Name, images & category" },
    { id: 2, label: "Pricing", description: "Price & inventory" },
    {
      id: 3,
      label: "Features",
      description: "Features, brand, gender & color",
    },
  ];

  // Calculate discounted price
  const discountedPrice =
    formData.price && formData.discount
      ? parseFloat(formData.price) * (1 - parseFloat(formData.discount) / 100)
      : null;

  // Fetch categories when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingCategories(true);
      fetch("/api/categories")
        .then((res) => res.json())
        .then((data) => {
          if (data.categories) {
            setCategories(data.categories);
          } else {
            throw new Error("Invalid response");
          }
        })
        .catch((error) => {
          console.error("Error fetching categories:", error);
          toast({
            title: "Error",
            description: "Failed to load categories",
            variant: "destructive",
          });
        })
        .finally(() => {
          setLoadingCategories(false);
        });
    }
  }, [open, toast]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        description: "",
        price: "",
        purchase_price: "",
        category_id: "",
        stock: "0",
        discount: "",
        discount_end_time: "",
        brand: "",
        size: "",
        gender: "",
        color: "",
      });
      setStockBySize({});
      setNewSizeInput("");
      setNewSizeQuantity("");
      setFeatures([]);
      setFeatureInput("");
      setErrors({});
      setImages([]);
      setAiAnalysis(null);
      setAnalyzing(false);
      setCurrentStep(1);
      setCompletedSteps(new Set());
    }
  }, [open]);

  // Handle AI analysis when first image is uploaded
  const handleFirstImageUploaded = async (imageUrl: string) => {
    if (analyzing) return; // Prevent multiple simultaneous analyses

    setAnalyzing(true);
    try {
      const response = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          includeDescription: true, // Set to true if you want GPT-4 descriptions
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze image");
      }

      if (data.success && data.data) {
        console.log(data);
        const analysis = data.data;

        // Store AI analysis results
        setAiAnalysis({
          name: analysis.name,
          description: analysis.description,
          category: analysis.suggestedCategory?.id,
          features: analysis.features || [],
          confidence: analysis.confidence?.overall || 0,
        });

        // Auto-populate fields if they're empty
        if (!formData.name && analysis.name) {
          setFormData((prev) => ({ ...prev, name: analysis.name }));
        }
        if (!formData.description && analysis.description) {
          setFormData((prev) => ({
            ...prev,
            description: analysis.description,
          }));
        }
        if (!formData.category_id && analysis.suggestedCategory) {
          setFormData((prev) => ({
            ...prev,
            category_id: analysis.suggestedCategory.id,
          }));
        }
        if (analysis.features && analysis.features.length > 0) {
          setFeatures(analysis.features);
        }
        // Auto-populate brand, color, and gender if they're empty
        if (!formData.brand && analysis.brand) {
          setFormData((prev) => ({ ...prev, brand: analysis.brand }));
        }
        if (!formData.color && analysis.color) {
          setFormData((prev) => ({ ...prev, color: analysis.color }));
        }
        if (!formData.gender && analysis.gender) {
          setFormData((prev) => ({ ...prev, gender: analysis.gender }));
        }

        toast({
          title: "AI Analysis Complete",
          description: `Found ${analysis.name} with ${Math.round(
            (analysis.confidence?.overall || 0) * 100
          )}% confidence`,
        });
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      toast({
        title: "Analysis failed",
        description:
          error instanceof Error ? error.message : "Could not analyze image",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Manual trigger for AI analysis
  const handleAnalyzeWithAI = async () => {
    if (images.length === 0) {
      toast({
        title: "No image",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    await handleFirstImageUploaded(images[0].url);
  };

  // Clear AI suggestions
  const handleClearAISuggestions = () => {
    setAiAnalysis(null);
    toast({
      title: "AI suggestions cleared",
      description: "You can still use manual entry",
    });
  };

  // Validate individual fields
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case "name":
        if (!value.trim()) {
          newErrors.name = "Product name is required";
        } else {
          delete newErrors.name;
        }
        break;
      case "price":
        if (!value) {
          newErrors.price = "Price is required";
        } else if (parseFloat(value) <= 0) {
          newErrors.price = "Price must be greater than 0";
        } else {
          delete newErrors.price;
        }
        break;
      case "category_id":
        if (!value) {
          newErrors.category_id = "Category is required";
        } else {
          delete newErrors.category_id;
        }
        break;
      case "discount":
        if (value && (parseFloat(value) < 0 || parseFloat(value) > 100)) {
          newErrors.discount = "Discount must be between 0 and 100";
        } else {
          delete newErrors.discount;
        }
        break;
    }

    setErrors(newErrors);
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Validate: name, category_id, images
        validateField("name", formData.name);
        validateField("category_id", formData.category_id);
        if (!formData.name.trim()) {
          return false;
        }
        if (!formData.category_id) {
          return false;
        }
        if (images.length === 0) {
          return false;
        }
        return true;
      case 2:
        // Validate: price
        validateField("price", formData.price);
        if (!formData.price || parseFloat(formData.price) <= 0) {
          return false;
        }
        if (formData.discount) {
          validateField("discount", formData.discount);
          if (errors.discount) {
            return false;
          }
        }
        return true;
      case 3:
        // No required fields, always valid
        return true;
      case 4:
        // No required fields, always valid
        return true;
      default:
        return false;
    }
  };

  // Handle step navigation
  const handleNext = (
    e?:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Prevent form submission when navigating between steps
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (validateStep(currentStep)) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      // Show validation error
      if (currentStep === 1) {
        if (!formData.name.trim()) {
          toast({
            title: "Validation Error",
            description: "Product name is required",
            variant: "destructive",
          });
        } else if (!formData.category_id) {
          toast({
            title: "Validation Error",
            description: "Category is required",
            variant: "destructive",
          });
        } else if (images.length === 0) {
          toast({
            title: "Validation Error",
            description: "At least one product image is required",
            variant: "destructive",
          });
        }
      } else if (currentStep === 2) {
        if (!formData.price || parseFloat(formData.price) <= 0) {
          toast({
            title: "Validation Error",
            description: "Valid price is required",
            variant: "destructive",
          });
        } else if (errors.discount) {
          toast({
            title: "Validation Error",
            description: errors.discount,
            variant: "destructive",
          });
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    // Only allow clicking on completed steps or current step
    if (completedSteps.has(step) || step === currentStep) {
      setCurrentStep(step);
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleAddSize = () => {
    if (!newSizeInput.trim()) {
      toast({
        title: "Size required",
        description: "Please enter a size",
        variant: "destructive",
      });
      return;
    }

    const size = newSizeInput.trim().toUpperCase();
    const quantity = parseInt(newSizeQuantity) || 0;

    if (stockBySize[size]) {
      toast({
        title: "Size already exists",
        description: `Size ${size} is already in the list`,
        variant: "destructive",
      });
      return;
    }

    const updated = { ...stockBySize, [size]: quantity };
    setStockBySize(updated);

    // Update total stock
    const total = Object.values(updated).reduce((sum, qty) => sum + qty, 0);
    setFormData({ ...formData, stock: total.toString() });

    setNewSizeInput("");
    setNewSizeQuantity("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps before submitting
    if (!validateStep(1) || !validateStep(2)) {
      // If validation fails, go to the first invalid step
      if (!validateStep(1)) {
        setCurrentStep(1);
      } else if (!validateStep(2)) {
        setCurrentStep(2);
      }
      return;
    }

    // Final validation
    validateField("name", formData.name);
    validateField("price", formData.price);
    validateField("category_id", formData.category_id);

    if (
      Object.keys(errors).length > 0 ||
      !formData.name.trim() ||
      !formData.price ||
      !formData.category_id ||
      images.length === 0
    ) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          purchase_price: formData.purchase_price
            ? parseFloat(formData.purchase_price)
            : 0,
          images: images.map((img, index) => ({
            url: img.url,
            public_id: img.public_id,
            is_primary: img.is_primary || index === 0,
            order: img.order ?? index,
          })),
          category_id: formData.category_id,
          stock: parseInt(formData.stock) || 0,
          stock_by_size:
            Object.keys(stockBySize).length > 0 ? stockBySize : undefined,
          discount: formData.discount ? parseFloat(formData.discount) : null,
          discount_end_time: formData.discount_end_time || null,
          features: features,
          brand: formData.brand.trim() || null,
          size: formData.size.trim() || null,
          gender: formData.gender.trim() || null,
          color: formData.color.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      toast({
        title: "Success!",
        description: `"${formData.name.trim()}" has been added to your inventory.`,
      });

      onOpenChange(false);
      // Small delay to allow dialog to close smoothly
      setTimeout(() => {
        router.refresh(); // Refresh to show new product
      }, 300);
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new product to your inventory.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Stepper */}
        <div className="py-2 sm:py-4">
          <ProgressStepper
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>

        <form
          onSubmit={(e) => {
            // Only allow form submission on the final step
            if (currentStep !== totalSteps) {
              e.preventDefault();
              // Don't pass the form event to handleNext, just call it
              handleNext();
            } else {
              handleSubmit(e);
            }
          }}
          className="space-y-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Basic Information & Images */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {/* <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Basic Information
                  </h3> */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Form Fields */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Product Name{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                name: e.target.value,
                              });
                              validateField("name", e.target.value);
                            }}
                            onBlur={(e) =>
                              validateField("name", e.target.value)
                            }
                            placeholder="Enter product name"
                            required
                            disabled={loading}
                            className={errors.name ? "border-destructive" : ""}
                          />
                          {aiAnalysis?.name &&
                            formData.name === aiAnalysis.name && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gold">
                                ✨ AI
                              </span>
                            )}
                        </div>
                        {errors.name && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <div className="relative">
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description: e.target.value,
                              })
                            }
                            placeholder="Enter product description"
                            rows={3}
                            disabled={loading}
                          />
                          {aiAnalysis?.description &&
                            formData.description === aiAnalysis.description && (
                              <span className="absolute right-2 top-2 text-xs text-gold">
                                ✨ AI
                              </span>
                            )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">
                          Category <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Select
                            value={formData.category_id}
                            onValueChange={(value) => {
                              setFormData({ ...formData, category_id: value });
                              validateField("category_id", value);
                            }}
                            disabled={loading || loadingCategories}
                            required
                          >
                            <SelectTrigger
                              id="category"
                              className={
                                errors.category_id ? "border-destructive" : ""
                              }
                            >
                              <SelectValue
                                placeholder={
                                  loadingCategories
                                    ? "Loading categories..."
                                    : "Select category"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
                                  {category.icon} {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {aiAnalysis?.category &&
                            formData.category_id === aiAnalysis.category && (
                              <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-gold pointer-events-none">
                                ✨
                              </span>
                            )}
                        </div>
                        {errors.category_id && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.category_id}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Image Upload */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>
                          Product Images{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        {images.length > 0 && !analyzing && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAnalyzeWithAI}
                            disabled={loading}
                          >
                            <Loader2 className="mr-2 h-4 w-4" />
                            Analyze with AI
                          </Button>
                        )}
                      </div>
                      {analyzing && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Analyzing image with AI...</span>
                        </div>
                      )}
                      <ImageUpload
                        images={images}
                        onImagesChange={setImages}
                        maxImages={10}
                        disabled={loading}
                        onFirstImageUploaded={handleFirstImageUploaded}
                        autoAnalyze={false}
                      />
                      {aiAnalysis && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>✨ AI suggestions applied</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={handleClearAISuggestions}
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Pricing & Inventory */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Pricing & Inventory
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">
                          Price (FCFA){" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => {
                            setFormData({ ...formData, price: e.target.value });
                            validateField("price", e.target.value);
                          }}
                          onBlur={(e) => validateField("price", e.target.value)}
                          placeholder="0.00"
                          required
                          disabled={loading}
                          className={errors.price ? "border-destructive" : ""}
                        />
                        {errors.price && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.price}
                          </p>
                        )}
                        {formData.price && !errors.price && (
                          <p className="text-xs text-muted-foreground">
                            {parseFloat(formData.price).toLocaleString()} FCFA
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="purchase_price">
                          Purchase Price (FCFA)
                          <span className="text-xs text-muted-foreground ml-2">
                            (Cost price for profit calculation)
                          </span>
                        </Label>
                        <Input
                          id="purchase_price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.purchase_price}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              purchase_price: e.target.value,
                            });
                          }}
                          placeholder="0.00"
                          disabled={loading}
                        />
                        {formData.purchase_price && formData.price && (
                          <p className="text-xs text-muted-foreground">
                            Profit margin:{" "}
                            {(
                              ((parseFloat(formData.price) -
                                parseFloat(formData.purchase_price)) /
                                parseFloat(formData.price)) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock">
                        Total Stock Quantity
                        <span className="text-xs text-muted-foreground ml-2">
                          (Auto-calculated from sizes)
                        </span>
                      </Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({ ...formData, stock: e.target.value })
                        }
                        placeholder="0"
                        disabled={loading}
                        readOnly
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Total:{" "}
                        {Object.values(stockBySize).reduce(
                          (sum, qty) => sum + qty,
                          0
                        )}{" "}
                        items
                      </p>
                    </div>

                    {/* Size-based inventory */}
                    <div className="space-y-2">
                      <Label>Stock by Size</Label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Input
                          type="text"
                          value={newSizeInput}
                          onChange={(e) => setNewSizeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newSizeQuantity.trim()) {
                              e.preventDefault();
                              handleAddSize();
                            }
                          }}
                          placeholder="Size (e.g., S, M, L, 36)"
                          disabled={loading}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min="0"
                          value={newSizeQuantity}
                          onChange={(e) => setNewSizeQuantity(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newSizeInput.trim()) {
                              e.preventDefault();
                              handleAddSize();
                            }
                          }}
                          placeholder="Qty"
                          disabled={loading}
                          className="w-full sm:w-24"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddSize}
                          disabled={loading || !newSizeInput.trim()}
                          className="w-full sm:w-auto"
                        >
                          <Plus className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Add Size</span>
                          <span className="sm:hidden">Add</span>
                        </Button>
                      </div>
                      {Object.keys(stockBySize).length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
                          No sizes added. Click "Add Size" to add inventory by
                          size.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(stockBySize).map(
                            ([size, quantity]) => (
                              <div
                                key={size}
                                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 border rounded-md"
                              >
                                <div className="flex-1 min-w-0">
                                  <Label className="text-sm font-medium">
                                    Size {size}
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={quantity}
                                    onChange={(e) => {
                                      const newQty =
                                        parseInt(e.target.value) || 0;
                                      const updated = {
                                        ...stockBySize,
                                        [size]: newQty,
                                      };
                                      setStockBySize(updated);
                                      // Update total stock
                                      const total = Object.values(
                                        updated
                                      ).reduce((sum, qty) => sum + qty, 0);
                                      setFormData({
                                        ...formData,
                                        stock: total.toString(),
                                      });
                                    }}
                                    placeholder="0"
                                    disabled={loading}
                                    className="w-full sm:w-24"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const updated = { ...stockBySize };
                                      delete updated[size];
                                      setStockBySize(updated);
                                      // Update total stock
                                      const total = Object.values(
                                        updated
                                      ).reduce((sum, qty) => sum + qty, 0);
                                      setFormData({
                                        ...formData,
                                        stock: total.toString(),
                                      });
                                    }}
                                    disabled={loading}
                                    className="text-destructive hover:text-destructive shrink-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discount">Discount (%)</Label>
                        <Input
                          id="discount"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formData.discount}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              discount: e.target.value,
                            });
                            validateField("discount", e.target.value);
                          }}
                          onBlur={(e) =>
                            validateField("discount", e.target.value)
                          }
                          placeholder="0"
                          disabled={loading}
                          className={
                            errors.discount ? "border-destructive" : ""
                          }
                        />
                        {errors.discount && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.discount}
                          </p>
                        )}
                        {discountedPrice &&
                          !errors.discount &&
                          formData.price && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                              Discounted price:{" "}
                              {Math.round(discountedPrice).toLocaleString()}{" "}
                              FCFA
                              <span className="text-muted-foreground ml-2">
                                (Save{" "}
                                {Math.round(
                                  parseFloat(formData.price) - discountedPrice
                                ).toLocaleString()}{" "}
                                FCFA)
                              </span>
                            </p>
                          )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discount_end_time">
                          Discount End Time
                        </Label>
                        <Input
                          id="discount_end_time"
                          type="datetime-local"
                          value={formData.discount_end_time}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discount_end_time: e.target.value,
                            })
                          }
                          disabled={loading || !formData.discount}
                        />
                        {!formData.discount && (
                          <p className="text-xs text-muted-foreground">
                            Enter a discount percentage to set an end time
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Product Features & Filtering */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Product Features & Filtering
                  </h3>

                  {/* Product Features Section */}
                  <div className="space-y-2">
                    <Label htmlFor="features">Features</Label>
                    <div className="flex gap-2">
                      <Input
                        id="features"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddFeature();
                          }
                        }}
                        placeholder="Enter a feature and press Enter"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddFeature}
                        disabled={loading || !featureInput.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1.5 bg-muted dark:bg-card px-2.5 py-1 rounded-md text-sm relative"
                          >
                            <span className="pr-0.5">{feature}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!loading) {
                                  handleRemoveFeature(index);
                                }
                              }}
                              className="flex-shrink-0 ml-0.5 p-1 -mr-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                              disabled={loading}
                              aria-label={`Remove feature: ${feature}`}
                              tabIndex={0}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Filtering Attributes Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Filtering Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="brand">Brand</Label>
                        <Input
                          id="brand"
                          value={formData.brand}
                          onChange={(e) =>
                            setFormData({ ...formData, brand: e.target.value })
                          }
                          onKeyDown={(e) => {
                            // Prevent form submission on Enter key when not on final step
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (currentStep < totalSteps) {
                                handleNext(e);
                              }
                            }
                          }}
                          placeholder="e.g., Nike, Adidas, Gucci"
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={formData.gender || undefined}
                          onValueChange={(value) =>
                            setFormData({ ...formData, gender: value || "" })
                          }
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="men">Men</SelectItem>
                            <SelectItem value="women">Women</SelectItem>
                            <SelectItem value="unisex">Unisex</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="color">Color</Label>
                        <Input
                          id="color"
                          value={formData.color}
                          onChange={(e) =>
                            setFormData({ ...formData, color: e.target.value })
                          }
                          onKeyDown={(e) => {
                            // Prevent form submission on Enter key when not on final step
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (currentStep < totalSteps) {
                                handleNext(e);
                              }
                            }
                          }}
                          placeholder="e.g., Black, White, Blue"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Product Preview Card */}
                  {(formData.name || images.length > 0 || formData.price) && (
                    <div className="space-y-2 mt-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Preview
                      </h3>
                      <Card className="border-dashed">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {images.length > 0 && (
                              <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                                <Image
                                  src={
                                    images.find((img) => img.is_primary)?.url ||
                                    images[0].url
                                  }
                                  alt="Preview"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">
                                {formData.name || "Product Name"}
                              </h4>
                              {formData.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {formData.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-2">
                                {discountedPrice && formData.price ? (
                                  <>
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                      {Math.round(
                                        discountedPrice
                                      ).toLocaleString()}{" "}
                                      FCFA
                                    </span>
                                    <span className="text-xs line-through text-muted-foreground">
                                      {parseFloat(
                                        formData.price
                                      ).toLocaleString()}{" "}
                                      FCFA
                                    </span>
                                    {formData.discount && (
                                      <span className="text-xs bg-burgundy text-white px-1.5 py-0.5 rounded">
                                        -{parseFloat(formData.discount)}%
                                      </span>
                                    )}
                                  </>
                                ) : formData.price ? (
                                  <span className="text-sm font-bold">
                                    {parseFloat(
                                      formData.price
                                    ).toLocaleString()}{" "}
                                    FCFA
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Price not set
                                  </span>
                                )}
                              </div>
                              {features.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {features
                                    .slice(0, 3)
                                    .map((feature, index) => (
                                      <span
                                        key={index}
                                        className="text-xs bg-muted px-2 py-0.5 rounded"
                                      >
                                        {feature}
                                      </span>
                                    ))}
                                  {features.length > 3 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{features.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={loading}
                  className="flex-1 sm:flex-initial"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
              )}
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={(e) => handleNext(e)}
                  disabled={loading}
                  className="flex-1 sm:flex-initial"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || Object.keys(errors).length > 0}
                  className="flex-1 sm:flex-initial"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Creating...</span>
                      <span className="sm:hidden">Creating</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Create Product</span>
                      <span className="sm:hidden">Create</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
