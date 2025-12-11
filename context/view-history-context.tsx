"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { useViewHistory, type ViewedProduct } from "@/hooks/use-view-history"

type ViewHistoryContextType = {
  viewHistory: ViewedProduct[]
  addToViewHistory: (product: ViewedProduct) => void
  clearViewHistory: () => void
}

const ViewHistoryContext = createContext<ViewHistoryContextType | undefined>(undefined)

export function ViewHistoryProvider({ children }: { children: React.ReactNode }) {
  const { viewHistory, addToViewHistory, clearViewHistory } = useViewHistory()

  return (
    <ViewHistoryContext.Provider value={{ viewHistory, addToViewHistory, clearViewHistory }}>
      {children}
    </ViewHistoryContext.Provider>
  )
}

export function useViewHistoryContext() {
  const context = useContext(ViewHistoryContext)
  if (context === undefined) {
    throw new Error("useViewHistoryContext must be used within a ViewHistoryProvider")
  }
  return context
}
