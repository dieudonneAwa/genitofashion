import { cloudinary } from "./config";
import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

export interface UploadResult {
  url: string;
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
}

export async function uploadImage(
  file: Buffer | string,
  folder: string = "products",
  options?: {
    public_id?: string;
    overwrite?: boolean;
    resource_type?: "image" | "video" | "raw" | "auto";
  }
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      ...options,
      transformation: [
        {
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(new Error(error.message || "Failed to upload image"));
        } else if (result) {
          resolve({
            url: result.url,
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
          });
        } else {
          reject(new Error("Unknown error during upload"));
        }
      }
    );

    if (Buffer.isBuffer(file)) {
      uploadStream.end(file);
    } else {
      uploadStream.end(Buffer.from(file));
    }
  });
}

export async function deleteImage(public_id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(public_id, (error, result) => {
      if (error) {
        console.error("Cloudinary delete error:", error);
        reject(new Error(error.message || "Failed to delete image"));
      } else {
        resolve();
      }
    });
  });
}

export async function deleteImages(public_ids: string[]): Promise<void> {
  if (public_ids.length === 0) return;

  return new Promise((resolve, reject) => {
    cloudinary.api.delete_resources(public_ids, (error, result) => {
      if (error) {
        console.error("Cloudinary bulk delete error:", error);
        reject(new Error(error.message || "Failed to delete images"));
      } else {
        resolve();
      }
    });
  });
}

