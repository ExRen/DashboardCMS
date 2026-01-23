import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

/**
 * MediaPerformance - Chart perbandingan jumlah konten per platform
 */
export function MediaPerformance({ data = [], mediaField = "MEDIA" }) {
    // Count content per platform
    const platformStats = useMemo(() => {
        const counts = {}
        data.forEach(item => {
            const platform = item[mediaField] || "Tidak Diketahui"
            counts[platform] = (counts[platform] || 0) + 1
        })

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
    }, [data, mediaField])

    // Top 5 for pie chart
    const top5 = platformStats.slice(0, 5)
    const others = platformStats.slice(5).reduce((sum, p) => sum + p.value, 0)
    const pieData = others > 0 ? [...top5, { name: "Lainnya", value: others }] : top5

    // Calculate percentages
    const total = data.length
    const topPlatform = platformStats[0] || { name: "-", value: 0 }
    const topPercentage = total > 0 ? ((topPlatform.value / total) * 100).toFixed(1) : 0

    return (
        <div className="grid gap-4 lg:grid-cols-1">
            {/* Bar Chart */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">📊 Konten per Platform</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={platformStats.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value) => [`${value} konten`, 'Jumlah']}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default MediaPerformance
