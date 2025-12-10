import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const COLORS = [
    "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
    "#8b5cf6", "#06b6d4", "#ec4899", "#f97316",
    "#14b8a6", "#6366f1", "#d946ef", "#eab308"
]

export function CategoryChart({ data = [] }) {
    // Group data by category
    const categoryCount = data.reduce((acc, item) => {
        const cat = item.categories?.name || "Tidak Berkategori"
        acc[cat] = (acc[cat] || 0) + 1
        return acc
    }, {})

    const chartData = Object.entries(categoryCount).map(([name, value]) => ({
        name: name.length > 20 ? name.substring(0, 20) + "..." : name,
        value,
        fullName: name
    }))

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="text-base">Distribusi Kategori</CardTitle>
            </CardHeader>
            <CardContent>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, name, props) => [value, props.payload.fullName]}
                                contentStyle={{
                                    background: "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px"
                                }}
                            />
                            <Legend
                                layout="vertical"
                                align="right"
                                verticalAlign="middle"
                                wrapperStyle={{ fontSize: "12px" }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Tidak ada data
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
