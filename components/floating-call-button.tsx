"use client"

import { useState, useEffect } from "react"
import { Phone } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"

export function FloatingCallButton() {
  const [isVisible, setIsVisible] = useState(false)
  const phoneNumber = "+237 654 321 098"
  const formattedPhoneNumber = phoneNumber.replace(/\s+/g, "")
  const { toast } = useToast()

  // Show button after scrolling down a bit
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", handleScroll)

    // Show button after 3 seconds even if no scroll
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 3000)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearTimeout(timer)
    }
  }, [])

  // Handle click for desktop devices that don't support tel: links
  const handleClick = () => {
    // Copy to clipboard as fallback for desktop
    if (navigator.clipboard && !navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) {
      navigator.clipboard.writeText(phoneNumber)
      toast({
        title: "Phone number copied",
        description: `${phoneNumber} has been copied to your clipboard.`,
      })
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.a
            href={`tel:${formattedPhoneNumber}`}
            onClick={handleClick}
            className="flex items-center justify-center bg-burgundy text-white rounded-full p-4 shadow-lg relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {/* Pulse animation */}
            <motion.span
              className="absolute inset-0 rounded-full bg-burgundy"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 0, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
            />

            <Phone className="h-6 w-6" />
            <span className="ml-2 font-bold hidden md:inline">Call to Order</span>
          </motion.a>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
