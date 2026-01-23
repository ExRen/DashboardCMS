import { useState, useMemo } from "react"
import { History, Filter, User, Calendar, FileText, Trash2, Edit, Download, Upload, UserPlus, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { getAuditLogs, formatAction, ACTIONS } from "@/lib/auditService"

/**
 * AuditTrail - Menampilkan log perubahan data
 */
export function AuditTrail({ itemType = null, itemId = null }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [filter, setFilter] = useState('all')
    const [dateFilter, setDateFilter] = useState('all')

    const allLogs = getAuditLogs()

    // Filter logs
    const filteredLogs = useMemo(() => {
        let logs = allLogs

        // Filter by item type and id if provided
        if (itemType && itemId) {
            logs = logs.filter(log => log.itemType === itemType && log.itemId === itemId)
        } else if (itemType) {
            logs = logs.filter(log => log.itemType === itemType)
        }

        // Filter by action
        if (filter !== 'all') {
            logs = logs.filter(log => log.action === filter)
        }

        // Filter by date
        const now = new Date()
        if (dateFilter === 'today') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            logs = logs.filter(log => new Date(log.timestamp) >= today)
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            logs = logs.filter(log => new Date(log.timestamp) >= weekAgo)
        } else if (dateFilter === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            logs = logs.filter(log => new Date(log.timestamp) >= monthAgo)
        }

        return logs.slice(0, 50) // Limit to 50 entries
    }, [allLogs, itemType, itemId, filter, dateFilter])

    function getActionIcon(action) {
        switch (action) {
            case ACTIONS.CREATE: return <FileText className="h-4 w-4" />
            case ACTIONS.UPDATE: return <Edit className="h-4 w-4" />
            case ACTIONS.DELETE: return <Trash2 className="h-4 w-4" />
            case ACTIONS.BULK_EDIT: return <Edit className="h-4 w-4" />
            case ACTIONS.BULK_DELETE: return <Trash2 className="h-4 w-4" />
            case ACTIONS.IMPORT: return <Upload className="h-4 w-4" />
            case ACTIONS.EXPORT: return <Download className="h-4 w-4" />
            case ACTIONS.ASSIGN: return <UserPlus className="h-4 w-4" />
            default: return <History className="h-4 w-4" />
        }
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now - date

        if (diff < 60000) return 'Baru saja'
        if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} hari lalu`

        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    return (
        <div className="bg-card border border-border rounded-lg">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
            >
                <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    <span className="font-medium">Riwayat Perubahan</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {filteredLogs.length}
                    </span>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="border-t border-border">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/30">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="text-sm px-3 py-1.5 rounded-lg bg-background border border-border"
                        >
                            <option value="all">Semua Aksi</option>
                            <option value={ACTIONS.CREATE}>Dibuat</option>
                            <option value={ACTIONS.UPDATE}>Diperbarui</option>
                            <option value={ACTIONS.DELETE}>Dihapus</option>
                            <option value={ACTIONS.IMPORT}>Diimpor</option>
                            <option value={ACTIONS.EXPORT}>Diekspor</option>
                        </select>

                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="text-sm px-3 py-1.5 rounded-lg bg-background border border-border"
                        >
                            <option value="all">Semua Waktu</option>
                            <option value="today">Hari Ini</option>
                            <option value="week">Minggu Ini</option>
                            <option value="month">Bulan Ini</option>
                        </select>
                    </div>

                    {/* Log List */}
                    <div className="max-h-[300px] overflow-auto">
                        {filteredLogs.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                Belum ada riwayat perubahan
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {filteredLogs.map(log => {
                                    const actionInfo = formatAction(log.action)
                                    return (
                                        <div key={log.id} className="p-3 hover:bg-muted/30">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${actionInfo.bg}`}>
                                                    <span className={actionInfo.color}>
                                                        {getActionIcon(log.action)}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-medium ${actionInfo.color}`}>
                                                            {actionInfo.label}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {log.itemType}
                                                        </span>
                                                    </div>
                                                    {log.details?.title && (
                                                        <p className="text-sm truncate mt-0.5">
                                                            {log.details.title}
                                                        </p>
                                                    )}
                                                    {log.details?.count && (
                                                        <p className="text-sm text-muted-foreground mt-0.5">
                                                            {log.details.count} item
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                        <User className="h-3 w-3" />
                                                        <span>{log.user}</span>
                                                        <span>•</span>
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{formatTime(log.timestamp)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default AuditTrail
