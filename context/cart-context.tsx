"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export type CartItem = {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  category: string
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<CartItem[]>([])
  const [itemCount, setItemCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [isLoadingCart, setIsLoadingCart] = useState(false)

  // Load cart from localStorage on initial render (for guests)
  // This runs once on mount to load any existing cart
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            // Only load if we don't have items already (avoid overwriting)
            setItems((prevItems) => {
              if (prevItems.length === 0) {
                return parsedCart
              }
              return prevItems
            })
          }
        } catch (error) {
          console.error("Failed to parse cart from localStorage:", error)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Load cart from database when user logs in
  useEffect(() => {
    if (session?.user && status === "authenticated" && !isLoadingCart) {
      setIsLoadingCart(true)
      fetch("/api/cart")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch cart")
          return res.json()
        })
        .then((data) => {
          if (data.items && data.items.length > 0) {
            // Merge with current items (from localStorage or already in state)
            const currentItems = items.length > 0 ? items : []
            const localCart = localStorage.getItem("cart")
            let localItems: CartItem[] = []
            
            if (localCart) {
              try {
                localItems = JSON.parse(localCart)
              } catch (error) {
                console.error("Failed to parse local cart:", error)
              }
            }
            
            // Combine all items: database + current state + localStorage
            const allItems = [...data.items, ...currentItems, ...localItems]
            // Remove duplicates, keeping the first occurrence
            const merged = allItems.reduce((acc: CartItem[], item: CartItem) => {
              const exists = acc.find((i) => i.id === item.id)
              if (!exists) {
                acc.push(item)
              }
              return acc
            }, [])
            
            setItems(merged)
            // Save merged cart to database
            fetch("/api/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: merged }),
            }).catch(console.error)
            // Clear localStorage after merging
            localStorage.removeItem("cart")
          } else {
            // No database cart, keep current items or load from localStorage
            const localCart = localStorage.getItem("cart")
            if (localCart && items.length === 0) {
              try {
                const localItems = JSON.parse(localCart)
                setItems(localItems)
                // Save to database
                fetch("/api/cart", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ items: localItems }),
                }).catch(console.error)
                localStorage.removeItem("cart")
              } catch (error) {
                console.error("Failed to load local cart:", error)
              }
            }
          }
        })
        .catch((error) => {
          console.error("Failed to load cart from database:", error)
        })
        .finally(() => {
          setIsLoadingCart(false)
        })
    }
  }, [session?.user?.id, status]) // Only depend on user ID and status, not items

  // Update localStorage and database whenever cart changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Always update item count and total first
      const count = items.reduce((sum, item) => sum + item.quantity, 0)
      setItemCount(count)

      const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      setTotal(cartTotal)

      // Don't save if we're currently loading cart from database
      if (isLoadingCart) {
        return
      }

      // Update localStorage for guests (unauthenticated users)
      // Save to localStorage if user is not authenticated (or session is still loading but no session exists)
      const isGuest = !session || (status !== "authenticated" && status !== "loading")
      if (isGuest) {
        if (items.length > 0) {
          localStorage.setItem("cart", JSON.stringify(items))
        } else {
          localStorage.removeItem("cart")
        }
      }

      // Save to database for authenticated users (debounced)
      if (session?.user && status === "authenticated") {
        const timeoutId = setTimeout(() => {
          fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          }).catch((error) => {
            console.error("Failed to save cart to database:", error)
          })
        }, 500)

        return () => clearTimeout(timeoutId)
      }
    }
  }, [items, session, status, isLoadingCart])

  const addItem = (item: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id)
      if (existingItem) {
        return prevItems.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i))
      } else {
        return [...prevItems, item]
      }
    })
  }

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }

    setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
    if (typeof window !== "undefined") {
      localStorage.removeItem("cart")
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
