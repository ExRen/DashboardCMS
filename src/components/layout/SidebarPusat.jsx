import {
    LayoutDashboard,
    FileText,
    BarChart3,
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
    FolderOpen,
    History
} from "lucide-react"

export const menuPusat = [
    { icon: LayoutDashboard, label: "Dashboard Nas", id: "/dashboard" },
    { icon: Building2, label: "Monitoring Cabang", id: "/monitoring-cabang" },
    { icon: FileText, label: "Siaran Pers", id: "/press-releases" },
    { icon: Megaphone, label: "COMMANDO Nas", id: "/commando" },
    { icon: Kanban, label: "Pipeline", id: "/pipeline" },
    { icon: Calendar, label: "Kalender", id: "/calendar" },
    { icon: ClipboardList, label: "Media Plan", id: "/media-plan" },
    { icon: BarChart3, label: "Analytics", id: "/analytics" },
    { icon: Image, label: "Media Library", id: "/media" },
    { icon: Database, label: "Master Data", id: "/master-data" },
    { icon: Users, label: "User Management", id: "/users" },
    { icon: History, label: "Audit Log", id: "/history" },
    { icon: Settings, label: "Settings", id: "/settings" },
]
