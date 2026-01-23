import { useState, useEffect } from "react"
import { History, Plus, Pencil, Trash2, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/Button"

const ACTIVITY_LOG_KEY = "cms_activity_log"
const MAX_ACTIVITIES = 100

/**
 * Activity types and their icons/colors
 */
const ACTIVITY_TYPES = {
    create: { icon: Plus, color: "text-green-500", label: "Tambah" },
    edit: { icon: Pencil, color: "text-blue-500", label: "Edit" },
    delete: { icon: Trash2, color: "text-red-500", label: "Hapus" }
}

/**
 * Log an activity to localStorage
 */
export function logActivity(type, contentType, title, details = {}) {
    try {
        const activities = getActivities()
        const newActivity = {
            id: Date.now(),
            type,
            contentType,
            title,
            details,
            timestamp: new Date().toISOString()
        }

        const updated = [newActivity, ...activities].slice(0, MAX_ACTIVITIES)
        localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(updated))

        // Dispatch event for real-time updates
        window.dispatchEvent(new CustomEvent("activityLogged", { detail: newActivity }))
    } catch (e) {
        console.error("Failed to log activity:", e)
    }
}

/**
 * Get all activities from localStorage
 */
export function getActivities() {
    try {
        const data = localStorage.getItem(ACTIVITY_LOG_KEY)
        return data ? JSON.parse(data) : []
    } catch (e) {
        return []
    }
}

/**
 * Clear all activities
 */
export function clearActivities() {
    localStorage.removeItem(ACTIVITY_LOG_KEY)
    window.dispatchEvent(new CustomEvent("activityLogged"))
}

/**
 * Format relative time
 */
function formatRelativeTime(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Baru saja"
    if (minutes < 60) return `${minutes} menit lalu`
    if (hours < 24) return `${hours} jam lalu`
    if (days < 7) return `${days} hari lalu`
    return date.toLocaleDateString("id-ID")
}

/**
 * Activity Log Panel Component
 */
export function ActivityLog({ isOpen, onClose }) {
    const [activities, setActivities] = useState([])

    useEffect(() => {
        setActivities(getActivities())

        const handleUpdate = () => setActivities(getActivities())
        window.addEventListener("activityLogged", handleUpdate)
        return () => window.removeEventListener("activityLogged", handleUpdate)
    }, [])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
            <div className="w-96 bg-card h-full shadow-xl flex flex-col animate-in slide-in-from-right">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        <h2 className="font-semibold">Activity Log</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {activities.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearActivities}>
                                Clear
                            </Button>
                        )}
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {activities.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Belum ada aktivitas</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {activities.map(activity => {
                                const activityType = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.edit
                                const Icon = activityType.icon

                                return (
                                    <div key={activity.id} className="p-3 hover:bg-muted/50">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 ${activityType.color}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm">
                                                    <span className="font-medium">{activityType.label}</span>
                                                    {" "}
                                                    <span className="text-muted-foreground">{activity.contentType}:</span>
                                                </p>
                                                <p className="text-sm font-medium truncate">
                                                    {activity.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatRelativeTime(activity.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/**
 * Activity Log Toggle Button
 */
export function ActivityLogButton({ onClick, count = 0 }) {
    return (
        <Button variant="ghost" size="sm" onClick={onClick} className="relative">
            <History className="h-5 w-5" />
            {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {count > 9 ? "9+" : count}
                </span>
            )}
        </Button>
    )
}
