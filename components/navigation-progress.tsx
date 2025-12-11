"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout

    // Start progress when navigation begins
    setIsNavigating(true)
    setProgress(0)

    // Simulate progress
    interval = setInterval(() => {
      setProgress((prev) => {
        // Slowly increase to 90%
        if (prev < 90) {
          return prev + (90 - prev) * 0.1
        }
        return prev
      })
    }, 100)

    // Complete progress when navigation ends
    const timeout = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setIsNavigating(false)
        setProgress(0)
      }, 200) // Fade out after reaching 100%
    }, 500)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [pathname, searchParams])

  if (!isNavigating) return null

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50">
      <div className="h-full bg-gold transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
    </div>
  )
}
