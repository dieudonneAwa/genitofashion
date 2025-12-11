import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/utils"
import { uploadImage } from "@/lib/cloudinary/upload"

// Disable body parsing, we need the raw body for file upload
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

export async function POST(request: Request) {
  try {
    // Check authorization
    await requireRole(["admin", "staff"])

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      )
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 images allowed per upload" },
        { status: 400 }
      )
    }

    const uploadResults = []
    const errors = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push({
          file: file.name,
          error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
        })
        continue
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          file: file.name,
          error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        })
        continue
      }

      try {
        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Cloudinary
        const result = await uploadImage(buffer, "products", {
          resource_type: "image",
        })

        uploadResults.push({
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          originalName: file.name,
        })
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error)
        errors.push({
          file: file.name,
          error: error instanceof Error ? error.message : "Upload failed",
        })
      }
    }

    if (uploadResults.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { error: "All uploads failed", errors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      images: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Upload error:", error)

    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    )
  }
}
