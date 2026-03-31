import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react"

export function NotificationsDropdown() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const unreadCount = notifications.filter(n => !n.is_read).length

    useEffect(() => {
        if (user) fetchNotifications()
    }, [user])

    async function fetchNotifications() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20)

            if (!error && data) {
                setNotifications(data)
            }
        } catch (error) {
            console.error("Error fetching notifications:", error)
        }
        setLoading(false)
    }

    async function markAsRead(id) {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id)

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            )
        } catch (error) {
            console.error("Error marking as read:", error)
        }
    }

    async function markAllAsRead() {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('is_read', false)

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        } catch (error) {
            console.error("Error marking all as read:", error)
        }
    }

    async function deleteNotification(id) {
        try {
            await supabase.from('notifications').delete().eq('id', id)
            setNotifications(prev => prev.filter(n => n.id !== id))
        } catch (error) {
            console.error("Error deleting notification:", error)
        }
    }

    function getTypeColor(type) {
        switch (type) {
            case 'success': return 'bg-green-500'
            case 'warning': return 'bg-yellow-500'
            case 'error': return 'bg-red-500'
            default: return 'bg-blue-500'
        }
    }

    function formatTime(dateStr) {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = Math.floor((now - date) / 1000)

        if (diff < 60) return 'Baru saja'
        if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
        if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
        return date.toLocaleDateString('id-ID')
    }

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-accent transition-colors"
            >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h3 className="font-semibold">Notifikasi</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Tandai semua dibaca
                                    </button>
                                )}
                                <button onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Tidak ada notifikasi</p>
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`flex items-start gap-3 p-4 border-b border-border hover:bg-muted/50 transition-colors ${!notification.is_read ? 'bg-primary/5' : ''
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full mt-2 ${getTypeColor(notification.type)}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{notification.title}</p>
                                            {notification.message && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatTime(notification.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {!notification.is_read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="p-1 text-muted-foreground hover:text-primary"
                                                    title="Tandai dibaca"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="p-1 text-muted-foreground hover:text-red-500"
                                                title="Hapus"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

// Utility function to create notifications
export async function createNotification(userId, title, message, type = 'info') {
    try {
        await supabase.from('notifications').insert([{
            user_id: userId,
            title,
            message,
            type
        }])
    } catch (error) {
        console.error("Error creating notification:", error)
    }
}
