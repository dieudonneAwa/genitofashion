import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if a discount is currently active (not expired)
 * @param discount - The discount percentage (number or null)
 * @param discountEndTime - The discount end time as ISO string or Date or null
 * @returns true if discount is active, false otherwise
 */
export function isDiscountActive(
  discount: number | null | undefined,
  discountEndTime: string | Date | null | undefined
): boolean {
  // No discount means not active
  if (!discount || discount <= 0) {
    return false;
  }

  // If no end time is set, discount is active (permanent discount)
  if (!discountEndTime) {
    return true;
  }

  // Parse the end time
  const endTime =
    typeof discountEndTime === "string"
      ? new Date(discountEndTime)
      : discountEndTime;

  // Check if end time is in the future
  return endTime > new Date();
}
