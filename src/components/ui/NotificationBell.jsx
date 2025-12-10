import { useState, useEffect, useMemo } from "react"
import { Bell, X, Clock, AlertCircle, CheckCircle, Info, Trash2 } from "lucide-react"
import { useData } from "@/context/DataContext"

/**
 * NotificationBell - Notification dropdown with reminders and updates
 */
export function NotificationBell() {
    const { commandoContents, pressReleases } = useData()
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)

    // Generate notifications based on data
    useEffect(() => {
        const newNotifications = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Check for draft items in pipeline (items without status or Draft status)
        const draftItems = commandoContents.filter(c => 
            !c.status || c.status === 'Draft'
        ).slice(0, 3)

        draftItems.forEach(item => {
            newNotifications.push({
                id: `draft-${item.id}`,
                type: 'warning',
                title: 'Konten Draft',
                message: `"${(item["JUDUL KONTEN"] || "").slice(0, 30)}..." masih draft`,
                time: new Date(),
                read: false
            })
        })

        // Check for items created today
        const todayItems = commandoContents.filter(c => {
            const created = new Date(c.created_at)
            created.setHours(0, 0, 0, 0)
            return created.getTime() === today.getTime()
        })

        if (todayItems.length > 0) {
            newNotifications.push({
                id: 'today-items',
                type: 'success',
                title: 'Konten Hari Ini',
                message: `${todayItems.length} konten baru ditambahkan hari ini`,
                time: new Date(),
                read: false
            })
        }

        // Weekly summary notification
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weeklyItems = commandoContents.filter(c => {
            const created = new Date(c.created_at)
            return created >= weekAgo
        })

        newNotifications.push({
            id: 'weekly-summary',
            type: 'info',
            title: 'Ringkasan Mingguan',
            message: `${weeklyItems.length} konten dalam 7 hari terakhir`,
            time: new Date(),
            read: false
        })

        // Load read status from localStorage
        const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]')
        newNotifications.forEach(n => {
            if (readIds.includes(n.id)) n.read = true
        })

        setNotifications(newNotifications)
        setUnreadCount(newNotifications.filter(n => !n.read).length)
    }, [commandoContents, pressReleases])

    // Mark notification as read
    function markAsRead(id) {
        const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]')
        if (!readIds.includes(id)) {
            readIds.push(id)
            localStorage.setItem('readNotifications', JSON.stringify(readIds))
        }
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    // Mark all as read
    function markAllAsRead() {
        const allIds = notifications.map(n => n.id)
        localStorage.setItem('readNotifications', JSON.stringify(allIds))
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
    }

    // Clear all notifications
    function clearAll() {
        localStorage.setItem('readNotifications', JSON.stringify([]))
        setNotifications([])
        setUnreadCount(0)
    }

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />
            case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
            default: return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    
                    {/* Panel */}
                    <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-lg shadow-lg z-50 max-h-[400px] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-border">
                            <h3 className="font-medium">Notifikasi</h3>
                            <div className="flex gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Tandai semua dibaca
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-auto max-h-[300px]">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    Tidak ada notifikasi
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => markAsRead(notification.id)}
                                        className={`p-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                                            !notification.read ? 'bg-primary/5' : ''
                                        }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="shrink-0 mt-0.5">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm">{notification.title}</div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {notification.message}
                                                </div>
                                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {notification.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            {!notification.read && (
                                                <div className="shrink-0">
                                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-2 border-t border-border">
                                <button
                                    onClick={clearAll}
                                    className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-1"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    Hapus semua notifikasi
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default NotificationBell
