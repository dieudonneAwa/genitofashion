"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

export function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // Scroll to top when pathname changes
    window.scrollTo({
      top: 0,
      behavior: "instant", // Use "smooth" for smooth scrolling or "instant" for immediate jump
    })
  }, [pathname])

  // This component doesn't render anything
  return null
}
