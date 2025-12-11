"use client"

import { Phone } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface CallToOrderProps {
  phoneNumber: string
  className?: string
  variant?: "default" | "prominent" | "subtle" | "floating"
  showIcon?: boolean
  showCopyFeedback?: boolean
}

export function CallToOrder({
  phoneNumber = "+237 654 321 098",
  className = "",
  variant = "default",
  showIcon = true,
  showCopyFeedback = true,
}: CallToOrderProps) {
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  // Format the phone number for the href attribute
  const formattedPhoneNumber = phoneNumber.replace(/\s+/g, "")

  // Handle click for desktop devices that don't support tel: links
  const handleClick = () => {
    // Copy to clipboard as fallback for desktop
    if (navigator.clipboard && !navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) {
      navigator.clipboard.writeText(phoneNumber)

      if (showCopyFeedback) {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)

        toast({
          title: "Phone number copied",
          description: `${phoneNumber} has been copied to your clipboard.`,
        })
      }
    }
  }

  // Determine styles based on variant
  let buttonVariant:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive"
    | "emerald"
    | "burgundy"
    | "gold" = "emerald"
  let buttonSize: "default" | "sm" | "lg" | "icon" = "default"
  let additionalClasses = ""

  switch (variant) {
    case "prominent":
      buttonVariant = "gold"
      buttonSize = "lg"
      additionalClasses = "font-bold"
      break
    case "subtle":
      buttonVariant = "outline"
      buttonSize = "sm"
      break
    case "floating":
      buttonVariant = "burgundy"
      buttonSize = "lg"
      additionalClasses = "fixed bottom-4 right-4 z-50 shadow-lg rounded-full px-4 py-3 font-bold"
      break
    default:
      buttonVariant = "burgundy" // Changed from emerald to burgundy for better visibility
      buttonSize = "default"
  }

  if (variant === "floating") {
    return (
      <motion.div
        className={`${className} ${additionalClasses}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <a
          href={`tel:${formattedPhoneNumber}`}
          onClick={handleClick}
          className="flex items-center justify-center text-white"
        >
          <Phone className="mr-2 h-5 w-5" />
          <span>Call to Order</span>
        </a>
      </motion.div>
    )
  }

  return (
    <motion.div className={`${className} relative`} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        className={`${additionalClasses} relative overflow-hidden`}
        onClick={handleClick}
        asChild
      >
        <a href={`tel:${formattedPhoneNumber}`}>
          {showIcon && <Phone className="mr-2 h-4 w-4" />}
          Call to Order
        </a>
      </Button>
    </motion.div>
  )
}
