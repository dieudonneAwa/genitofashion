import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
}

export function StarRating({ rating, size = "sm", showValue = true }: StarRatingProps) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const stars = []

  // Determine star size based on prop
  const starSize = size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"
  const textSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"

  for (let i = 0; i < fullStars; i++) {
    stars.push(<Star key={`full-${i}`} className={`${starSize} fill-gold text-gold`} />)
  }

  if (hasHalfStar) {
    stars.push(
      <div key="half" className="relative">
        <Star className={`${starSize} text-gold`} />
        <div className="absolute inset-0 overflow-hidden w-[50%]">
          <Star className={`${starSize} fill-gold text-gold`} />
        </div>
      </div>,
    )
  }

  const emptyStars = 5 - stars.length
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<Star key={`empty-${i}`} className={`${starSize} text-gold`} />)
  }

  return (
    <div className="flex items-center">
      <div className="flex mr-1">{stars}</div>
      {showValue && <span className={`${textSize} text-muted-foreground`}>{rating}</span>}
    </div>
  )
}
