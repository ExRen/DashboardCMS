import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Tooltip } from "recharts"

/**
 * ActivityHeatmap - Kalender heatmap menampilkan aktivitas publikasi per hari
 * Warna intensity berdasarkan jumlah konten
 */
export function ActivityHeatmap({ data = [], dateField = "TANGGAL", year = new Date().getFullYear() }) {
    // Parse Indonesian date to Date object
    function parseDate(dateStr) {
        if (!dateStr) return null
        const months = { 'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11 }
        const parts = String(dateStr).split(' ')
        if (parts.length >= 3) {
            const day = parseInt(parts[0])
            const month = months[parts[1]]
            const yearPart = parseInt(parts[2])
            if (!isNaN(day) && month !== undefined && !isNaN(yearPart)) return new Date(yearPart, month, day)
        }
        return null
    }

    // Count activities per day
    const activityMap = useMemo(() => {
        const map = {}
        data.forEach(item => {
            const date = parseDate(item[dateField])
            if (date && date.getFullYear() === year) {
                const key = date.toISOString().split('T')[0]
                map[key] = (map[key] || 0) + 1
            }
        })
        return map
    }, [data, dateField, year])

    // Generate calendar grid for the year
    const months = useMemo(() => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
        return monthNames.map((name, monthIndex) => {
            const firstDay = new Date(year, monthIndex, 1)
            const lastDay = new Date(year, monthIndex + 1, 0)
            const days = []

            // Add empty cells for days before the first day
            const startDayOfWeek = firstDay.getDay()
            for (let i = 0; i < startDayOfWeek; i++) {
                days.push({ empty: true })
            }

            // Add all days of the month
            for (let d = 1; d <= lastDay.getDate(); d++) {
                const date = new Date(year, monthIndex, d)
                const key = date.toISOString().split('T')[0]
                days.push({
                    date: d,
                    key,
                    count: activityMap[key] || 0,
                    fullDate: date
                })
            }

            return { name, days }
        })
    }, [year, activityMap])

    // Get color intensity based on count
    function getColor(count) {
        if (count === 0) return "bg-muted/30"
        if (count <= 2) return "bg-green-200 dark:bg-green-900"
        if (count <= 5) return "bg-green-400 dark:bg-green-700"
        if (count <= 10) return "bg-green-500 dark:bg-green-600"
        return "bg-green-600 dark:bg-green-500"
    }

    // Calculate stats
    const totalActivities = Object.values(activityMap).reduce((a, b) => a + b, 0)
    const activeDays = Object.keys(activityMap).length
    const maxInDay = Math.max(...Object.values(activityMap), 0)

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>📅 Aktivitas Publikasi {year}</span>
                    <div className="flex gap-4 text-sm font-normal">
                        <span className="text-muted-foreground">{totalActivities} konten</span>
                        <span className="text-muted-foreground">{activeDays} hari aktif</span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-12 gap-2">
                    {months.map((month, idx) => (
                        <div key={idx} className="text-center">
                            <div className="text-xs font-medium text-muted-foreground mb-1">{month.name}</div>
                            <div className="grid grid-cols-7 gap-[2px]">
                                {month.days.map((day, dayIdx) => (
                                    <div
                                        key={dayIdx}
                                        className={`w-3 h-3 rounded-sm ${day.empty ? 'bg-transparent' : getColor(day.count)} cursor-pointer transition-transform hover:scale-150`}
                                        title={day.empty ? '' : `${day.date} ${months[idx].name}: ${day.count} konten`}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                    <span>Sedikit</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-muted/30" />
                        <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
                        <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
                        <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
                        <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
                    </div>
                    <span>Banyak</span>
                </div>
            </CardContent>
        </Card>
    )
}

export default ActivityHeatmap
