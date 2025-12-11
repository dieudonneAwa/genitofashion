"use client"

import { useEffect, useState, useRef } from "react"
import { useTheme } from "next-themes"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, ShoppingCart } from "lucide-react"

// Generate profit data based on timeframe
const generateProfitData = (timeframe: string) => {
  switch (timeframe) {
    case "today":
      return [
        ["8AM", 15000],
        ["10AM", 28000],
        ["12PM", 42000],
        ["2PM", 65000],
        ["4PM", 89000],
        ["6PM", 120000],
      ]
    case "week":
      return [
        ["Mon", 65000],
        ["Tue", 85000],
        ["Wed", 110000],
        ["Thu", 75000],
        ["Fri", 115000],
      ]
    case "month":
      return [
        ["Week 1", 210000],
        ["Week 2", 185000],
        ["Week 3", 245000],
        ["Week 4", 210000],
      ]
    case "quarter":
      return [
        ["Jan", 850000],
        ["Feb", 720000],
        ["Mar", 780000],
      ]
    case "year":
      return [
        ["Q1", 2350000],
        ["Q2", 1950000],
        ["Q3", 2150000],
        ["Q4", 2300000],
      ]
    default:
      return [
        ["Week 1", 210000],
        ["Week 2", 185000],
        ["Week 3", 245000],
        ["Week 4", 210000],
      ]
  }
}

// Get profit percentage growth based on timeframe
const getProfitGrowth = (timeframe: string) => {
  switch (timeframe) {
    case "today":
      return "+8%"
    case "week":
      return "+12%"
    case "month":
      return "+15%"
    case "quarter":
      return "+18%"
    case "year":
      return "+22%"
    default:
      return "+15%"
  }
}

// Get total profit based on timeframe
const getTotalProfit = (timeframe: string) => {
  switch (timeframe) {
    case "today":
      return "120,000 FCFA"
    case "week":
      return "450,000 FCFA"
    case "month":
      return "850,000 FCFA"
    case "quarter":
      return "2,350,000 FCFA"
    case "year":
      return "8,750,000 FCFA"
    default:
      return "850,000 FCFA"
  }
}

// Get total revenue based on timeframe
const getTotalRevenue = (timeframe: string) => {
  switch (timeframe) {
    case "today":
      return "350,000 FCFA"
    case "week":
      return "1,250,000 FCFA"
    case "month":
      return "2,450,000 FCFA"
    case "quarter":
      return "6,750,000 FCFA"
    case "year":
      return "24,500,000 FCFA"
    default:
      return "2,450,000 FCFA"
  }
}

// Get total sales count based on timeframe
const getTotalSales = (timeframe: string) => {
  switch (timeframe) {
    case "today":
      return "15"
    case "week":
      return "65"
    case "month":
      return "120"
    case "quarter":
      return "320"
    case "year":
      return "1250"
    default:
      return "120"
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

// Get financial metrics based on timeframe
const getFinancialMetrics = (timeframe: string) => {
  switch (timeframe) {
    case "today":
      return {
        revenue: "350,000 FCFA",
        expenses: "230,000 FCFA",
        margin: "34%",
      }
    case "week":
      return {
        revenue: "1,250,000 FCFA",
        expenses: "800,000 FCFA",
        margin: "36%",
      }
    case "month":
      return {
        revenue: "2,450,000 FCFA",
        expenses: "1,600,000 FCFA",
        margin: "35%",
      }
    case "quarter":
      return {
        revenue: "6,750,000 FCFA",
        expenses: "4,400,000 FCFA",
        margin: "35%",
      }
    case "year":
      return {
        revenue: "24,500,000 FCFA",
        expenses: "15,750,000 FCFA",
        margin: "36%",
      }
    default:
      return {
        revenue: "2,450,000 FCFA",
        expenses: "1,600,000 FCFA",
        margin: "35%",
      }
  }
}

interface ProfitChartProps {
  timeframe: string
}

export function ProfitChart({ timeframe }: ProfitChartProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profitData, setProfitData] = useState<Array<[string, number]>>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [netProfit, setNetProfit] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [profitGrowth, setProfitGrowth] = useState("0%")
  const [netProfitGrowth, setNetProfitGrowth] = useState("0%")
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null)

  const timeframeLabel = getTimeframeLabel(timeframe)

  // Fix for hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch real profit data
  useEffect(() => {
    async function fetchProfitData() {
      try {
        setLoading(true)
        const response = await fetch(`/api/profit?timeframe=${timeframe}`)
        
        if (response.ok) {
          const data = await response.json()
          setProfitData(data.chartData || [])
          setTotalRevenue(data.totalRevenue || 0)
          setTotalProfit(data.totalProfit || 0)
          setTotalExpenses(data.totalExpenses || 0)
          setNetProfit(data.netProfit || 0)
          setTotalSales(data.totalSales || 0)
          setProfitGrowth(
            data.profitGrowth
              ? `${parseFloat(data.profitGrowth) >= 0 ? "+" : ""}${parseFloat(data.profitGrowth).toFixed(1)}%`
              : "0%"
          )
          setNetProfitGrowth(
            data.netProfitGrowth
              ? `${parseFloat(data.netProfitGrowth) >= 0 ? "+" : ""}${parseFloat(data.netProfitGrowth).toFixed(1)}%`
              : "0%"
          )
        } else {
          console.error("Failed to fetch profit data")
          // Fallback to empty data
          setProfitData([])
          setTotalRevenue(0)
          setTotalProfit(0)
          setTotalExpenses(0)
          setNetProfit(0)
          setTotalSales(0)
          setProfitGrowth("0%")
          setNetProfitGrowth("0%")
        }
      } catch (error) {
        console.error("Error fetching profit data:", error)
        // Fallback to empty data
        setProfitData([])
        setTotalRevenue(0)
        setTotalProfit(0)
        setTotalExpenses(0)
        setNetProfit(0)
        setTotalSales(0)
        setProfitGrowth("0%")
        setNetProfitGrowth("0%")
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      fetchProfitData()
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
        categories: profitData.length > 0 ? profitData.map((item) => item[0]) : [],
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
          formatter: function () {
            return this.value.toLocaleString()
          },
          style: {
            fontSize: "10px",
            color: isDarkMode ? "#B3B3B3" : "#6B7280",
          },
        },
        gridLineColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        gridLineDashStyle: "Dash",
      },
      legend: {
        enabled: false,
      },
      tooltip: {
        headerFormat: "<b>{point.key}</b><br>",
        pointFormat: "Profit: {point.y:,.0f} FCFA",
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
          color: "#004D40",
          states: {
            hover: {
              color: "#00695C",
            },
          },
        },
      },
      series: [
        {
          type: "column",
          name: "Profit",
          data: profitData.length > 0 ? profitData.map((item) => item[1]) : [],
        },
      ],
    }
  }

  // Only render the chart when the component is mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Card className="col-span-2">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-medium">Sales & Profit Overview</CardTitle>
          <CardDescription>{timeframeLabel}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
                <h3 className="text-lg font-bold">
                  {loading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    `${totalRevenue.toLocaleString()} FCFA`
                  )}
                </h3>
                <Badge variant="outline" className="bg-emerald/10 text-emerald border-emerald">
                  {loading ? "..." : profitGrowth}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Total Sales</p>
                </div>
                <h3 className="text-lg font-bold">
                  {loading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    totalSales.toString()
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">{timeframeLabel}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Gross Profit</p>
                <h3 className="text-lg font-bold text-emerald">
                  {loading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    `${totalProfit.toLocaleString()} FCFA`
                  )}
                </h3>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <h3 className="text-lg font-bold text-red-600">
                  {loading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    `${totalExpenses.toLocaleString()} FCFA`
                  )}
                </h3>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Net Profit</p>
                <h3 className={`text-lg font-bold ${netProfit >= 0 ? "text-emerald" : "text-red-600"}`}>
                  {loading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    `${netProfit.toLocaleString()} FCFA`
                  )}
                </h3>
                <Badge variant="outline" className={netProfit >= 0 ? "bg-emerald/10 text-emerald border-emerald" : "bg-red-600/10 text-red-600 border-red-600"}>
                  {loading ? "..." : netProfitGrowth}
                </Badge>
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
        <CardTitle className="text-xs font-medium">Sales & Profit Overview</CardTitle>
        <CardDescription>{timeframeLabel}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 py-2">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
              <h3 className="text-lg font-bold">
                {loading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  `${totalRevenue.toLocaleString()} FCFA`
                )}
              </h3>
              <Badge variant="outline" className="bg-emerald/10 text-emerald border-emerald">
                {loading ? "..." : profitGrowth}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Sales</p>
              </div>
              <h3 className="text-lg font-bold">
                {loading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  totalSales.toString()
                )}
              </h3>
              <p className="text-xs text-muted-foreground">{timeframeLabel}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Gross Profit</p>
              <h3 className="text-lg font-bold text-emerald">
                {loading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  `${totalProfit.toLocaleString()} FCFA`
                )}
              </h3>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <h3 className="text-lg font-bold text-red-600">
                {loading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  `${totalExpenses.toLocaleString()} FCFA`
                )}
              </h3>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Net Profit</p>
              <h3 className={`text-lg font-bold ${netProfit >= 0 ? "text-emerald" : "text-red-600"}`}>
                {loading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  `${netProfit.toLocaleString()} FCFA`
                )}
              </h3>
              <Badge variant="outline" className={netProfit >= 0 ? "bg-emerald/10 text-emerald border-emerald" : "bg-red-600/10 text-red-600 border-red-600"}>
                {loading ? "..." : netProfitGrowth}
              </Badge>
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
