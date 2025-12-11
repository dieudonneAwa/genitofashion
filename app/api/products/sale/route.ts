import { NextResponse } from "next/server"
import { getSaleProducts } from "@/lib/api"

export async function GET() {
  try {
    const products = await getSaleProducts()
    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching sale products:", error)
    return NextResponse.json({ error: "Failed to fetch sale products" }, { status: 500 })
  }
}

