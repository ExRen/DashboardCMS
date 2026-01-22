import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    FileText,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Megaphone,
    Calendar,
    Kanban,
    Database,
    Users,
    Settings,
    Image
} from "lucide-react"
import { useState } from "react"

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
    { icon: FileText, label: "Siaran Pers", id: "press-releases" },
    { icon: Megaphone, label: "COMMANDO", id: "commando" },
    { icon: Kanban, label: "Pipeline", id: "pipeline" },
    { icon: Calendar, label: "Kalender", id: "calendar" },
    { icon: BarChart3, label: "Analytics", id: "analytics" },
    { icon: Image, label: "Media Library", id: "media" },
    { icon: Database, label: "Master Data", id: "master-data" },
    { icon: Users, label: "Users", id: "users", adminOnly: true },
    { icon: Settings, label: "Settings", id: "settings" },
]



export function Sidebar({ currentPage, onNavigate }) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={cn(
                "flex flex-col h-screen bg-card border-r border-border transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">A</span>
                </div>
                {!collapsed && (
                    <div className="flex flex-col">
                        <span className="font-semibold text-foreground">ASABRI</span>
                        <span className="text-xs text-muted-foreground">CMS Dashboard</span>
                    </div>
                )}
            </div>

            {/* Menu */}
            <nav className="flex-1 p-3 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                            currentPage === item.id
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                    </button>
                ))}
            </nav>

            {/* Collapse Button */}
            <div className="p-3 border-t border-border">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center justify-center w-full py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                    {collapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <>
                            <ChevronLeft className="h-5 w-5 mr-2" />
                            <span className="text-sm">Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    )
}
