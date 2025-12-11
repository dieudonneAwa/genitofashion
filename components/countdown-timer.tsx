"use client"

import { useState, useEffect } from "react"

interface CountdownTimerProps {
  endTime: Date
  onComplete?: () => void
  className?: string
}

export function CountdownTimer({ endTime, onComplete, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime.getTime() - new Date().getTime()

      if (difference <= 0) {
        setIsComplete(true)
        onComplete?.()
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime, onComplete])

  if (isComplete) {
    return <div className={`text-xs text-destructive font-medium ${className}`}>Offer expired</div>
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="text-xs font-medium">Ends in:</div>
      <div className="flex items-center gap-1 text-xs">
        {timeLeft.days > 0 && (
          <>
            <span className="font-bold">{timeLeft.days}d</span>
            <span className="text-muted-foreground">:</span>
          </>
        )}
        <span className="font-bold">{String(timeLeft.hours).padStart(2, "0")}h</span>
        <span className="text-muted-foreground">:</span>
        <span className="font-bold">{String(timeLeft.minutes).padStart(2, "0")}m</span>
        <span className="text-muted-foreground">:</span>
        <span className="font-bold">{String(timeLeft.seconds).padStart(2, "0")}s</span>
      </div>
    </div>
  )
}
