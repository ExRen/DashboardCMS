import { useState, useEffect } from "react"
import { Bell, Search, Moon, Sun, LogOut, User, History, Keyboard } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { ActivityLog, ActivityLogButton, getActivities } from "@/components/ui/ActivityLog"

import { NotificationsDropdown } from "@/components/ui/NotificationsDropdown"
import { KeyboardShortcutsModal, useKeyboardShortcuts } from "@/components/ui/KeyboardShortcutsModal"
import { GlobalSearchModal } from "@/components/ui/GlobalSearchModal"

export function Header({ title, onNavigate }) {
    const { theme, toggleTheme } = useTheme()
    const { profile, logout } = useAuth()
    const [showActivityLog, setShowActivityLog] = useState(false)
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [showGlobalSearch, setShowGlobalSearch] = useState(false)
    const activityCount = getActivities().length

    // Global keyboard shortcut listener
    useKeyboardShortcuts(() => setShowShortcuts(true))

    // Search Shortcut (Ctrl+K)
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                setShowGlobalSearch(true)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <>
            <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    {/* Search */}
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <button
                            onClick={() => setShowGlobalSearch(true)}
                            className="w-64 h-9 pl-9 pr-4 text-left rounded-lg bg-muted text-sm text-muted-foreground hover:bg-muted/80 transition-colors border border-transparent focus:ring-2 focus:ring-primary flex items-center justify-between"
                        >
                            <span>Search...</span>
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted-foreground/10 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </button>
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
                    <NotificationsDropdown />

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

            {/* Global Search Modal */}
            <GlobalSearchModal
                isOpen={showGlobalSearch}
                onClose={() => setShowGlobalSearch(false)}
            />
        </>
    )
}
