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
    Image,
    ClipboardList,
    Building2,
    Newspaper,
    Share2,
    FolderOpen
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"

import { menuPusat } from "./SidebarPusat"
import { menuCabang } from "./SidebarCabang"

function SidebarContent({ menu, collapsed, currentPage, onNavigate }) {
    return (
        <nav className="flex-1 p-3 space-y-1">
            {menu.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={cn(
                        "flex items-center gap-3 w-full p-3 rounded-lg text-sm transition-colors",
                        collapsed ? "justify-center" : "justify-start",
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
    )
}

export function Sidebar({ currentPage, onNavigate }) {
    const [collapsed, setCollapsed] = useState(false)
    const { isCabang, isPusat } = useAuth()

    // Determine which menu to show based on role
    // Default to Pusat if not strictly Cabang (for safety/legacy) or if loading
    const activeMenu = isCabang ? menuCabang : menuPusat

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
                        <span className="text-xs text-muted-foreground">
                            {isCabang ? "Cabang Dashboard" : "Pusat Dashboard"}
                        </span>
                    </div>
                )}
            </div>

            {/* Menu Content */}
            <SidebarContent
                menu={activeMenu}
                collapsed={collapsed}
                currentPage={currentPage}
                onNavigate={onNavigate}
            />

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
