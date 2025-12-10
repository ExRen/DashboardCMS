import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { useData } from "@/context/DataContext"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/Toast"
import {
    FileText, CheckCircle2, Clock, AlertCircle, RefreshCw
} from "lucide-react"

const STATUSES = [
    { id: "draft", label: "Draft", icon: FileText, color: "bg-gray-500", textColor: "text-gray-500" },
    { id: "review", label: "Review", icon: Clock, color: "bg-yellow-500", textColor: "text-yellow-500" },
    { id: "approved", label: "Approved", icon: CheckCircle2, color: "bg-blue-500", textColor: "text-blue-500" },
    { id: "published", label: "Published", icon: AlertCircle, color: "bg-green-500", textColor: "text-green-500" }
]

const PROCESS_MAP = {
    draft: "Draft",
    review: "Pending Review",
    approved: "Approved",
    published: "Published"
}

function getContentStatus(item) {
    const process = (item["PROCESS"] || "").toLowerCase()
    if (process.includes("publish") || process.includes("done") || process.includes("selesai")) return "published"
    if (process.includes("approved") || process.includes("acc")) return "approved"
    if (process.includes("review") || process.includes("pending")) return "review"
    return "draft"
}

export function Pipeline() {
    const toast = useToast()
    const { commandoContents, pressReleases, loading, fetchAll } = useData()
    const [contentType, setContentType] = useState("commando")
    const [draggedItem, setDraggedItem] = useState(null)
    const [localUpdates, setLocalUpdates] = useState({}) // Track only local changes

    useEffect(() => {
        if (commandoContents.length === 0 && pressReleases.length === 0) {
            fetchAll()
        }
    }, [])

    // Reset local updates when switching tabs
    useEffect(() => {
        setLocalUpdates({})
    }, [contentType])

    const tableName = contentType === "commando" ? "commando_contents" : "press_releases"
    const titleField = contentType === "commando" ? "JUDUL KONTEN" : "JUDUL SIARAN PERS"

    // Get base data from context
    const baseData = contentType === "commando" ? commandoContents : pressReleases

    // Apply local updates to base data
    const localData = useMemo(() => {
        return baseData.map(item => {
            if (localUpdates[item.id]) {
                return { ...item, "PROCESS": localUpdates[item.id] }
            }
            return item
        })
    }, [baseData, localUpdates])

    // Group data by status
    const groupedData = useMemo(() => {
        const groups = {}
        STATUSES.forEach(s => groups[s.id] = [])

        localData.forEach(item => {
            const status = getContentStatus(item)
            if (groups[status]) {
                groups[status].push(item)
            }
        })

        return groups
    }, [localData])

    const handleDragStart = (e, item) => {
        setDraggedItem(item)
        e.dataTransfer.effectAllowed = "move"
    }

    const handleDrop = async (e, targetStatus) => {
        e.preventDefault()
        if (!draggedItem) return

        const currentStatus = getContentStatus(draggedItem)
        if (currentStatus === targetStatus) {
            setDraggedItem(null)
            return
        }

        const newProcess = PROCESS_MAP[targetStatus]
        const itemId = draggedItem.id

        // Optimistic update via localUpdates
        setLocalUpdates(prev => ({ ...prev, [itemId]: newProcess }))
        setDraggedItem(null)

        try {
            const { error } = await supabase
                .from(tableName)
                .update({ "PROCESS": newProcess })
                .eq("id", itemId)

            if (error) throw error
            toast.success(`Status diubah ke ${STATUSES.find(s => s.id === targetStatus).label}`)
        } catch (error) {
            // Revert on error
            setLocalUpdates(prev => {
                const updated = { ...prev }
                delete updated[itemId]
                return updated
            })
            toast.error("Gagal mengubah status: " + error.message)
        }
    }

    if (loading.commando || loading.press) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Content Pipeline</h1>
                    <p className="text-muted-foreground">Kelola status konten dengan drag & drop</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-muted rounded-lg p-1">
                        <button
                            onClick={() => setContentType("commando")}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${contentType === "commando"
                                    ? "bg-card shadow text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            COMMANDO
                        </button>
                        <button
                            onClick={() => setContentType("press")}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${contentType === "press"
                                    ? "bg-card shadow text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Siaran Pers
                        </button>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => { setLocalUpdates({}); fetchAll() }}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STATUSES.map(status => {
                    const count = groupedData[status.id]?.length || 0
                    const total = localData.length || 1
                    const percent = Math.round((count / total) * 100)
                    const StatusIcon = status.icon

                    return (
                        <Card key={status.id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${status.color} bg-opacity-20`}>
                                            <StatusIcon className={`h-5 w-5 ${status.textColor}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{status.label}</p>
                                            <p className="text-2xl font-bold">{count}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-lg font-semibold ${status.textColor}`}>{percent}%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {STATUSES.map(status => {
                    const items = groupedData[status.id] || []

                    return (
                        <div
                            key={status.id}
                            className="bg-muted/30 rounded-xl p-4 min-h-[400px]"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, status.id)}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                                <h3 className="font-semibold">{status.label}</h3>
                                <span className="ml-auto text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {items.length}
                                </span>
                            </div>

                            <div className="space-y-2 max-h-[500px] overflow-auto">
                                {items.map(item => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item)}
                                        className={`bg-card p-3 rounded-lg border border-border cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${draggedItem?.id === item.id ? "opacity-50" : ""
                                            }`}
                                    >
                                        <p className="text-sm font-medium line-clamp-2">
                                            {item[titleField] || "Untitled"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {item["TANGGAL"] || item["TANGGAL TERBIT"] || "No date"}
                                        </p>
                                    </div>
                                ))}

                                {items.length === 0 && (
                                    <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-border rounded-lg">
                                        Drop items here
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Pipeline
