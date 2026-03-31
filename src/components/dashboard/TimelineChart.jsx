import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
]

export function TimelineChart({ data = [] }) {
    // Group data by month
    const monthlyCount = data.reduce((acc, item) => {
        if (item.publish_date) {
            const date = new Date(item.publish_date)
            const month = date.getMonth()
            acc[month] = (acc[month] || 0) + 1
        }
        return acc
    }, {})

    const chartData = MONTHS.map((month, index) => ({
        name: month,
        total: monthlyCount[index] || 0
    }))

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle className="text-base">Tren Publikasi Bulanan</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={12}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={12}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "#ffffff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px"
                            }}
                            formatter={(value) => [value, "Siaran Pers"]}
                        />
                        <Bar
                            dataKey="total"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
