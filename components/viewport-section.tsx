"use client"

import React from "react"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

type AnimationVariant = "fade" | "slide" | "scale" | "rotate" | "flip"

interface ViewportSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
  distance?: number
  once?: boolean
  threshold?: number
  variant?: AnimationVariant
  duration?: number
  staggerChildren?: boolean
  staggerDelay?: number
}

export function ViewportSection({
  children,
  className = "",
  delay = 0,
  distance = 50,
  once = true,
  threshold = 0.1,
  variant = "slide",
  duration = 0.5,
  staggerChildren = false,
  staggerDelay = 0.1,
}: ViewportSectionProps) {
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (once && ref.current) {
            observer.unobserve(ref.current)
          }
        } else if (!once) {
          setIsInView(false)
        }
      },
      {
        threshold,
        rootMargin: "0px",
      },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [once, threshold])

  // Animation variants
  const variants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    slide: {
      hidden: { opacity: 0, y: distance },
      visible: { opacity: 1, y: 0 },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 },
    },
    rotate: {
      hidden: { opacity: 0, rotate: -5 },
      visible: { opacity: 1, rotate: 0 },
    },
    flip: {
      hidden: { opacity: 0, rotateX: 80 },
      visible: { opacity: 1, rotateX: 0 },
    },
  }

  // Container variant for staggered children
  const containerVariant = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  }

  // Child variant for staggered children
  const childVariant = {
    hidden: variants[variant].hidden,
    visible: variants[variant].visible,
  }

  return staggerChildren ? (
    <motion.div
      ref={ref}
      className={className}
      variants={containerVariant}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={childVariant} transition={{ duration, ease: "easeOut" }}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  ) : (
    <motion.div
      ref={ref}
      className={className}
      initial={variants[variant].hidden}
      animate={isInView ? variants[variant].visible : variants[variant].hidden}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // cubic-bezier curve for a more natural motion
        opacity: { duration: duration * 1.2 }, // slightly longer fade for smoother effect
      }}
    >
      {children}
    </motion.div>
  )
}
