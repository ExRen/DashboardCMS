import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

/**
 * Parse Indonesian date to get month
 */
function getMonthFromDate(dateStr) {
    if (!dateStr) return null
    const monthMap = {
        'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
        'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
    }
    const parts = dateStr.toLowerCase().split(' ')
    for (const part of parts) {
        if (monthMap[part] !== undefined) return monthMap[part]
    }
    return null
}

/**
 * Trend Analysis Chart Component
 * Shows monthly publication trends with year-over-year comparison
 */
export function TrendAnalysis({
    data = [],
    dateField = "TANGGAL",
    title = "Trend Publikasi Bulanan",
    showComparison = true
}) {
    // Process data to get monthly counts by year
    const chartData = useMemo(() => {
        const yearlyData = {}

        data.forEach(item => {
            const year = item.year
            const month = getMonthFromDate(item[dateField])

            if (year && month !== null) {
                if (!yearlyData[year]) {
                    yearlyData[year] = Array(12).fill(0)
                }
                yearlyData[year][month]++
            }
        })

        // Get years and sort
        const years = Object.keys(yearlyData).sort((a, b) => b - a).slice(0, 3)

        // Build chart data
        return MONTHS.map((monthName, idx) => {
            const result = { month: monthName }
            years.forEach(year => {
                result[year] = yearlyData[year]?.[idx] || 0
            })
            return result
        })
    }, [data, dateField])

    // Get years for chart legend
    const years = useMemo(() => {
        const yearSet = new Set()
        data.forEach(item => {
            if (item.year) yearSet.add(item.year)
        })
        return Array.from(yearSet).sort((a, b) => b - a).slice(0, 3)
    }, [data])

    // Calculate trend
    const trend = useMemo(() => {
        if (!years[0] || !years[1]) return null

        const currentYearTotal = chartData.reduce((sum, m) => sum + (m[years[0]] || 0), 0)
        const lastYearTotal = chartData.reduce((sum, m) => sum + (m[years[1]] || 0), 0)

        if (lastYearTotal === 0) return null

        const change = ((currentYearTotal - lastYearTotal) / lastYearTotal * 100).toFixed(1)
        return {
            value: change,
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
            current: currentYearTotal,
            last: lastYearTotal
        }
    }, [chartData, years])

    const colors = ['#3b82f6', '#8b5cf6', '#10b981']

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    {trend && (
                        <div className={`flex items-center gap-1 text-sm ${trend.direction === 'up' ? 'text-green-500' :
                                trend.direction === 'down' ? 'text-red-500' : 'text-muted-foreground'
                            }`}>
                            {trend.direction === 'up' ? <TrendingUp className="h-4 w-4" /> :
                                trend.direction === 'down' ? <TrendingDown className="h-4 w-4" /> :
                                    <Minus className="h-4 w-4" />}
                            <span>{trend.value}% vs tahun lalu</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                            <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            {years.map((year, idx) => (
                                <Line
                                    key={year}
                                    type="monotone"
                                    dataKey={year}
                                    stroke={colors[idx]}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Summary Stats */}
                {showComparison && trend && (
                    <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">{years[0]}</p>
                            <p className="text-2xl font-bold">{trend.current}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">{years[1]}</p>
                            <p className="text-2xl font-bold">{trend.last}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
