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
        <div className="grid gap-4 lg:grid-cols-2">
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

            {/* Pie Chart */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span>🥧 Distribusi Platform</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            {platformStats.length} platform
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    labelLine={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value) => [`${value} konten`, 'Jumlah']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{topPlatform.name}</div>
                            <div className="text-xs text-muted-foreground">Platform Terbanyak</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{topPercentage}%</div>
                            <div className="text-xs text-muted-foreground">dari Total Konten</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default MediaPerformance
