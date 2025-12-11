"use client"

import { useEffect, useState, useRef } from "react"
import { useTheme } from "next-themes"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users } from "lucide-react"

// Generate daily data for products sold and customers
const generateDailyData = (timeframe: string) => {
  const days =
    timeframe === "today"
      ? 1
      : timeframe === "week"
        ? 7
        : timeframe === "month"
          ? 30
          : timeframe === "quarter"
            ? 90
            : 365

  const data = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Generate random data with some patterns
    const productsSold = Math.floor(Math.random() * 10) + 1 // 1-10 products per day
    const customers = Math.floor(Math.random() * 5) + 1 // 1-5 customers per day

    // Format date as "Jan 1", "Feb 2", etc.
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })

    data.push({
      date: formattedDate,
      productsSold,
      customers,
    })
  }

  // For timeframes other than "today", return only a subset of the data
  if (timeframe === "today") {
    return data
  } else if (timeframe === "week") {
    return data.slice(-7)
  } else if (timeframe === "month") {
    // For month, show weekly data
    const weeklyData = []
    for (let i = 0; i < 4; i++) {
      const weekData = data.slice(i * 7, (i + 1) * 7)
      const weekSum = weekData.reduce(
        (acc, day) => {
          return {
            date: `Week ${i + 1}`,
            productsSold: acc.productsSold + day.productsSold,
            customers: acc.customers + day.customers,
          }
        },
        { date: "", productsSold: 0, customers: 0 },
      )
      weeklyData.push(weekSum)
    }
    return weeklyData
  } else if (timeframe === "quarter") {
    // For quarter, show monthly data
    const monthlyData = []
    for (let i = 0; i < 3; i++) {
      const monthData = data.slice(i * 30, (i + 1) * 30)
      const monthSum = monthData.reduce(
        (acc, day) => {
          return {
            date: `Month ${i + 1}`,
            productsSold: acc.productsSold + day.productsSold,
            customers: acc.customers + day.customers,
          }
        },
        { date: "", productsSold: 0, customers: 0 },
      )
      monthlyData.push(monthSum)
    }
    return monthlyData
  } else {
    // For year, show quarterly data
    const quarterlyData = []
    for (let i = 0; i < 4; i++) {
      const quarterData = data.slice(i * 90, (i + 1) * 90)
      const quarterSum = quarterData.reduce(
        (acc, day) => {
          return {
            date: `Q${i + 1}`,
            productsSold: acc.productsSold + day.productsSold,
            customers: acc.customers + day.customers,
          }
        },
        { date: "", productsSold: 0, customers: 0 },
      )
      quarterlyData.push(quarterSum)
    }
    return quarterlyData
  }
}

// Get total products based on timeframe
const getTotalProducts = () => {
  return "45"
}

// Get total customers based on timeframe
const getTotalCustomers = (timeframe: string) => {
  switch (timeframe) {
    case "today":
      return "12"
    case "week":
      return "42"
    case "month":
      return "85"
    case "quarter":
      return "210"
    case "year":
      return "650"
    default:
      return "85"
  }
}

// Get timeframe label
const getTimeframeLabel = (timeframe: string) => {
  switch (timeframe) {
    case "today":
      return "Today"
    case "week":
      return "This week"
    case "month":
      return "Last 30 days"
    case "quarter":
      return "Last 90 days"
    case "year":
      return "This year"
    default:
      return "Last 30 days"
  }
}

interface ProductsCustomersChartProps {
  timeframe: string
}

export function ProductsCustomersChart({ timeframe }: ProductsCustomersChartProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<Array<{ date: string; productsSold: number; customers: number }>>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null)

  const timeframeLabel = getTimeframeLabel(timeframe)

  // Fix for hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch real data from API
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch(`/api/analytics/products-customers?timeframe=${timeframe}`)
        
        if (response.ok) {
          const data = await response.json()
          setChartData(data.chartData || [])
          setTotalProducts(data.totalProducts || 0)
          setTotalCustomers(data.totalCustomers || 0)
        } else {
          console.error("Failed to fetch products and customers data")
          // Fallback to empty data
          setChartData([])
          setTotalProducts(0)
          setTotalCustomers(0)
        }
      } catch (error) {
        console.error("Error fetching products and customers data:", error)
        // Fallback to empty data
        setChartData([])
        setTotalProducts(0)
        setTotalCustomers(0)
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      fetchData()
    }
  }, [timeframe, mounted])

  // Create chart options based on theme and data
  const getChartOptions = (): Highcharts.Options => {
    const isDarkMode = theme === "dark"

    return {
      chart: {
        type: "column",
        height: 200,
        backgroundColor: "transparent",
        style: {
          fontFamily: "Inter, sans-serif",
        },
        spacingLeft: 0,
        spacingRight: 0,
        spacingBottom: 0,
        spacingTop: 0,
      },
      title: {
        text: undefined,
      },
      credits: {
        enabled: false,
      },
      xAxis: {
        categories: chartData.map((item) => item.date),
        labels: {
          style: {
            fontSize: "10px",
            color: isDarkMode ? "#B3B3B3" : "#6B7280",
          },
        },
        lineWidth: 0,
        tickWidth: 0,
      },
      yAxis: {
        title: {
          text: undefined,
        },
        labels: {
          style: {
            fontSize: "10px",
            color: isDarkMode ? "#B3B3B3" : "#6B7280",
          },
        },
        gridLineColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        gridLineDashStyle: "Dash",
      },
      legend: {
        enabled: true,
        itemStyle: {
          fontSize: "10px",
          color: isDarkMode ? "#B3B3B3" : "#6B7280",
        },
        align: "right",
        verticalAlign: "top",
        floating: true,
        x: 0,
        y: -5,
      },
      tooltip: {
        shared: true,
        backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
        borderColor: isDarkMode ? "#2C2C2C" : "#E5E7EB",
        style: {
          color: isDarkMode ? "#FDFBF6" : "#0D0D0D",
        },
      },
      plotOptions: {
        column: {
          borderRadius: 3,
          borderWidth: 0,
          groupPadding: 0.1,
          pointPadding: 0.05,
          states: {
            hover: {
              brightness: 0.1,
            },
          },
        },
      },
      series: [
        {
          type: "column",
          name: "Products Sold",
          data: chartData.map((item) => item.productsSold),
          color: "#D4AF37", // Gold color
        },
        {
          type: "column",
          name: "Customers",
          data: chartData.map((item) => item.customers),
          color: "#800020", // Burgundy color
        },
      ],
    }
  }

  // Only render the chart when the component is mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Card className="col-span-2">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-medium">Products & Customers</CardTitle>
          <CardDescription>{timeframeLabel}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Total Products</p>
                </div>
                <h3 className="text-lg font-bold">
                  {loading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    totalProducts.toString()
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">In inventory</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Total Customers</p>
                </div>
                <h3 className="text-lg font-bold">
                  {loading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    totalCustomers.toString()
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">{timeframeLabel}</p>
              </div>
            </div>

            <div className="flex-1 h-[200px] w-full bg-muted/20 animate-pulse rounded-md"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-medium">Products & Customers</CardTitle>
        <CardDescription>{timeframeLabel}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 py-2">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Products</p>
              </div>
              <h3 className="text-lg font-bold">
                {loading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  totalProducts.toString()
                )}
              </h3>
              <p className="text-xs text-muted-foreground">In inventory</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Customers</p>
              </div>
              <h3 className="text-lg font-bold">
                {loading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  totalCustomers.toString()
                )}
              </h3>
              <p className="text-xs text-muted-foreground">{timeframeLabel}</p>
            </div>
          </div>

          <div className="flex-1 h-[200px] w-full">
            <HighchartsReact
              highcharts={Highcharts}
              options={getChartOptions()}
              ref={chartComponentRef}
              immutable={true}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
