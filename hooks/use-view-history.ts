"use client"

import { useState, useEffect, useCallback } from "react"

// Define the product type
export interface ViewedProduct {
  id: number
  name: string
  price: number
  image: string
  category: string
  discount?: number
  discountEndTime?: Date
  rating?: number
}

const MAX_HISTORY_ITEMS = 10

export function useViewHistory() {
  const [viewHistory, setViewHistory] = useState<ViewedProduct[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load view history from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      try {
        const savedHistory = localStorage.getItem("viewHistory")
        if (savedHistory) {
          // Parse the JSON and convert string dates back to Date objects
          const parsedHistory = JSON.parse(savedHistory, (key, value) => {
            if (key === "discountEndTime" && value) {
              return new Date(value)
            }
            return value
          })
          setViewHistory(parsedHistory)
        }
        setIsInitialized(true)
      } catch (error) {
        console.error("Failed to load view history:", error)
        setIsInitialized(true)
      }
    }
  }, [isInitialized])

  // Add a product to view history - using useCallback to memoize the function
  const addToViewHistory = useCallback((product: ViewedProduct) => {
    setViewHistory((prevHistory) => {
      // Check if product already exists in history
      const existingProductIndex = prevHistory.findIndex((item) => item.id === product.id)

      // If product already exists and is at the top of the list, don't update
      if (existingProductIndex === 0) {
        return prevHistory
      }

      // Remove the product if it already exists elsewhere in history
      const filteredHistory =
        existingProductIndex > 0
          ? [...prevHistory.slice(0, existingProductIndex), ...prevHistory.slice(existingProductIndex + 1)]
          : prevHistory

      // Add the product to the beginning of the array
      const newHistory = [product, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS)

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("viewHistory", JSON.stringify(newHistory))
      }

      return newHistory
    })
  }, [])

  // Clear view history
  const clearViewHistory = useCallback(() => {
    setViewHistory([])
    if (typeof window !== "undefined") {
      localStorage.removeItem("viewHistory")
    }
  }, [])

  return { viewHistory, addToViewHistory, clearViewHistory }
}
