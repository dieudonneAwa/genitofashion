"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { ProductImage } from "@/types/database";

interface UploadedImage {
  url: string;
  public_id: string;
  width: number;
  height: number;
  originalName: string;
}

interface ImageUploadProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
  onFirstImageUploaded?: (imageUrl: string) => void;
  autoAnalyze?: boolean;
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  disabled = false,
  onFirstImageUploaded,
  autoAnalyze = false,
}: ImageUploadProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        toast({
          title: "Maximum images reached",
          description: `You can only upload up to ${maxImages} images.`,
          variant: "destructive",
        });
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);

      // Validate files
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      const ALLOWED_TYPES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];

      const invalidFiles = filesToUpload.filter(
        (file) => !ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE
      );

      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid files",
          description:
            "Some files are invalid. Only JPEG, PNG, WebP, or GIF files under 10MB are allowed.",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);

      try {
        const formData = new FormData();
        filesToUpload.forEach((file) => {
          formData.append("files", file);
        });

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Upload failed");
        }

        // Convert uploaded images to ProductImage format
        const newImages: ProductImage[] = data.images.map(
          (img: UploadedImage, index: number) => ({
            url: img.url,
            public_id: img.public_id,
            is_primary: images.length === 0 && index === 0, // First image is primary if no images exist
            order: images.length + index,
          })
        );

        // Merge with existing images
        const updatedImages = [...images, ...newImages];
        onImagesChange(updatedImages);

        // Trigger analysis for first image if auto-analyze is enabled
        if (
          autoAnalyze &&
          images.length === 0 &&
          newImages.length > 0 &&
          onFirstImageUploaded
        ) {
          onFirstImageUploaded(newImages[0].url);
        }

        toast({
          title: "Upload successful",
          description: `${newImages.length} image(s) uploaded successfully.`,
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description:
            error instanceof Error ? error.message : "Failed to upload images",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [images, maxImages, onImagesChange, toast]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled || uploading) return;
      handleFileSelect(e.dataTransfer.files);
    },
    [disabled, uploading, handleFileSelect]
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      const updatedImages = images.filter((_, i) => i !== index);
      // Reorder remaining images
      const reorderedImages = updatedImages.map((img, i) => ({
        ...img,
        order: i,
        is_primary:
          i === 0 ? true : img.is_primary && i !== 0 ? false : img.is_primary,
      }));
      onImagesChange(reorderedImages);
    },
    [images, onImagesChange]
  );

  const handleSetPrimary = useCallback(
    (index: number) => {
      const updatedImages = images.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }));
      onImagesChange(updatedImages);
    },
    [images, onImagesChange]
  );

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const updatedImages = [...images];
      const [moved] = updatedImages.splice(fromIndex, 1);
      updatedImages.splice(toIndex, 0, moved);
      const reorderedImages = updatedImages.map((img, i) => ({
        ...img,
        order: i,
        is_primary: i === 0 && img.is_primary ? true : i === 0 ? true : false,
      }));
      onImagesChange(reorderedImages);
    },
    [images, onImagesChange]
  );

  return (
    <div className="space-y-4">
      {/* Upload Area and Image Previews - 2 Column Grid with Dropzone */}
      <div className="grid grid-cols-2 gap-3 items-stretch">
        {/* Image Previews */}
        <AnimatePresence>
          {images.map((image, index) => (
            <motion.div
              key={image.public_id || index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative group min-w-48 h-full"
            >
              <Card className="overflow-hidden w-full h-full flex flex-col">
                <div className="relative flex-1 min-h-0">
                  <img
                    src={image.url}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Primary Badge */}
                  {image.is_primary && (
                    <div className="absolute top-2 left-2 bg-gold text-richblack px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="hidden sm:inline">Primary</span>
                    </div>
                  )}
                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(index);
                      }}
                      disabled={disabled || image.is_primary}
                      title="Set as primary"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          image.is_primary
                            ? "fill-yellow-400 text-yellow-400"
                            : ""
                        }`}
                      />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(index);
                      }}
                      disabled={disabled}
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-2 flex-shrink-0">
                  <p className="text-xs text-center text-muted-foreground truncate">
                    Image {index + 1}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Upload Area - Appears after images in the grid */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg text-center transition-colors ${
            images.length > 0
              ? "w-full h-full flex items-center justify-center"
              : "w-full col-span-2"
          } ${images.length > 0 ? "p-4" : "p-8"} ${
            isDragging
              ? "border-gold bg-gold/10"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          } ${
            disabled || uploading
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          }`}
          onClick={() =>
            !disabled && !uploading && fileInputRef.current?.click()
          }
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled || uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-gold" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Uploading...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload
                className={`text-muted-foreground ${
                  images.length > 0 ? "h-6 w-6" : "h-8 w-8"
                }`}
              />
              <div>
                <p
                  className={`font-medium ${
                    images.length > 0 ? "text-xs" : "text-sm"
                  }`}
                >
                  {images.length > 0
                    ? "Add more"
                    : "Click to upload or drag and drop"}
                </p>
                {images.length === 0 && (
                  <>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WebP, or GIF (max 10MB each)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {images.length} / {maxImages} images
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Counter and Info - Below on Mobile */}
      {images.length > 0 && (
        <div className="sm:hidden">
          <p className="text-xs text-muted-foreground">
            {images.length} / {maxImages} images
          </p>
          {images.length > 1 && (
            <p className="text-xs text-muted-foreground mt-1">
              💡 The first image is set as primary. Click the star icon to
              change the primary image.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
