import { Calendar, Clock, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/Button"

/**
 * Quick filter buttons for common date ranges
 * @param {Function} onFilter - Callback with {dateFrom, dateTo} values
 * @param {string} activeFilter - Currently active filter name
 */
export function QuickFilters({ onFilter, activeFilter = "" }) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const filters = [
        {
            id: "today",
            label: "Hari Ini",
            icon: Clock,
            getRange: () => {
                const from = new Date(today)
                const to = new Date(today)
                to.setHours(23, 59, 59, 999)
                return { dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] }
            }
        },
        {
            id: "week",
            label: "Minggu Ini",
            icon: Calendar,
            getRange: () => {
                const from = new Date(today)
                from.setDate(today.getDate() - today.getDay())
                const to = new Date(from)
                to.setDate(from.getDate() + 6)
                return { dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] }
            }
        },
        {
            id: "month",
            label: "Bulan Ini",
            icon: CalendarDays,
            getRange: () => {
                const from = new Date(today.getFullYear(), today.getMonth(), 1)
                const to = new Date(today.getFullYear(), today.getMonth() + 1, 0)
                return { dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] }
            }
        }
    ]

    const handleClick = (filter) => {
        if (activeFilter === filter.id) {
            // Toggle off
            onFilter({ dateFrom: "", dateTo: "", activeQuickFilter: "" })
        } else {
            const range = filter.getRange()
            onFilter({ ...range, activeQuickFilter: filter.id })
        }
    }

    return (
        <div className="flex gap-2 flex-wrap">
            {filters.map(filter => {
                const Icon = filter.icon
                const isActive = activeFilter === filter.id
                return (
                    <Button
                        key={filter.id}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleClick(filter)}
                        className="gap-1.5"
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {filter.label}
                    </Button>
                )
            })}
        </div>
    )
}
