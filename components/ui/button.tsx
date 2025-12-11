"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        emerald: "bg-emerald text-white shadow-sm hover:bg-emerald/90",
        burgundy: "bg-burgundy text-white shadow-sm hover:bg-burgundy/90",
        gold: "bg-gold text-richblack shadow-sm hover:bg-gold/90",
      },
      size: {
        default: "h-8 px-3 py-1.5 text-xs",
        sm: "h-7 rounded-md px-2.5 text-xs",
        lg: "h-10 rounded-md px-6 text-sm",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, onClick, children, ...props },
    ref
  ) => {
    // Add a ripple effect on click (only for non-asChild buttons)
    const [ripples, setRipples] = React.useState<
      { x: number; y: number; id: number }[]
    >([]);

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        if (!asChild) {
          const button = event.currentTarget as HTMLElement;
          const rect = button.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;

          const id = Date.now();
          setRipples((prev) => [...prev, { x, y, id }]);

          setTimeout(() => {
            setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
          }, 600);
        }
        onClick?.(event as any);
      },
      [asChild, onClick]
    );

    // When asChild is true, Slot must receive exactly one child
    // Extract children from props to avoid passing it twice
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref as any}
          onClick={handleClick}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    // For regular buttons, we can add ripple effects
    const buttonElement = (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none z-10"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: "120px",
              height: "120px",
              marginLeft: "-60px",
              marginTop: "-60px",
            }}
          />
        ))}
        {children}
      </button>
    );

    // Wrap with motion.div for hover/tap animations
    return (
      <motion.div
        className="inline-block"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {buttonElement}
      </motion.div>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
