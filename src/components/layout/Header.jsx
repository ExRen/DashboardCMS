import { useState } from "react"
import { Bell, Search, Moon, Sun, LogOut, User, History, Keyboard } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { ActivityLog, ActivityLogButton, getActivities } from "@/components/ui/ActivityLog"
import { NotificationBell } from "@/components/ui/NotificationBell"
import { KeyboardShortcutsModal, useKeyboardShortcuts } from "@/components/ui/KeyboardShortcutsModal"

export function Header({ title }) {
    const { theme, toggleTheme } = useTheme()
    const { profile, logout } = useAuth()
    const [showActivityLog, setShowActivityLog] = useState(false)
    const [showShortcuts, setShowShortcuts] = useState(false)
    const activityCount = getActivities().length

    // Global keyboard shortcut listener
    useKeyboardShortcuts(() => setShowShortcuts(true))

    return (
        <>
            <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-64 h-9 pl-9 pr-4 rounded-lg bg-muted border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Keyboard Shortcuts */}
                    <button
                        onClick={() => setShowShortcuts(true)}
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                        title="Keyboard Shortcuts (?)"
                    >
                        <Keyboard className="h-5 w-5 text-muted-foreground" />
                    </button>

                    {/* Notification Bell */}
                    <NotificationBell />

                    {/* Activity Log */}
                    <ActivityLogButton
                        onClick={() => setShowActivityLog(true)}
                        count={activityCount}
                    />

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                        title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                    >
                        {theme === "light" ? (
                            <Moon className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <Sun className="h-5 w-5 text-yellow-400" />
                        )}
                    </button>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 pl-4 border-l border-border">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-foreground">{profile?.full_name || 'User'}</p>
                            <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'viewer'}</p>
                        </div>
                        <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={logout}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Activity Log Panel */}
            <ActivityLog
                isOpen={showActivityLog}
                onClose={() => setShowActivityLog(false)}
            />

            {/* Keyboard Shortcuts Modal */}
            <KeyboardShortcutsModal
                isOpen={showShortcuts}
                onClose={() => setShowShortcuts(false)}
            />
        </>
    )
}

