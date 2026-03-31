import { useState, useEffect, useMemo, useCallback } from "react"
import { History, Filter, User, Calendar, FileText, Trash2, Edit, Download, Upload, UserPlus, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { getAuditLogs, formatAction, ACTIONS } from "@/lib/auditService"
import { useAuth } from "@/context/AuthContext"

/**
 * AuditTrail - Menampilkan log perubahan data (Supabase Integrated)
 */
export function AuditTrail({ itemType = null, itemId = null }) {
    const { isPusat, user } = useAuth()
    const [isExpanded, setIsExpanded] = useState(false)
    const [filter, setFilter] = useState('all')
    const [dateFilter, setDateFilter] = useState('all')
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(false)
    const [totalCount, setTotalCount] = useState(0)

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const options = {
                limit: 50,
                itemType,
                itemId,
                action: filter,
                // If not Pusat, only show their own office logs
                officeId: isPusat ? null : user?.office_id
            }

            const { data, count } = await getAuditLogs(options)
            setLogs(data)
            setTotalCount(count || 0)
        } catch (err) {
            console.error("Failed to load logs:", err)
        } finally {
            setLoading(false)
        }
    }, [itemType, itemId, filter, isPusat, user?.office_id])

    useEffect(() => {
        if (isExpanded) {
            fetchLogs()
        }
    }, [isExpanded, fetchLogs, dateFilter]) // dateFilter handling can be added to options in next iteration

    function getActionIcon(action) {
        switch (action) {
            case 'create': return <FileText className="h-4 w-4" />
            case 'update': return <Edit className="h-4 w-4" />
            case 'delete': return <Trash2 className="h-4 w-4" />
            case 'import': return <Upload className="h-4 w-4" />
            case 'export': return <Download className="h-4 w-4" />
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

        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-all">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <History className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-sm">Riwayat Aktivitas</p>
                        <p className="text-xs text-muted-foreground">Log perubahan data sistem</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {loading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
                    <span className="text-xs font-bold bg-muted px-2 py-1 rounded-full text-muted-foreground mr-2">
                        {totalCount} Total
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="border-t border-border animate-in slide-in-from-top duration-200">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/20">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="text-xs px-2 py-1.5 rounded-lg bg-background border border-border font-medium focus:ring-2 focus:ring-primary/20 outline-none h-8"
                        >
                            <option value="all">Semua Aksi</option>
                            <option value="create">Dibuat</option>
                            <option value="update">Diperbarui</option>
                            <option value="delete">Dihapus</option>
                        </select>

                        <button
                            onClick={fetchLogs}
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors ml-auto"
                            title="Refresh"
                        >
                            <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Log List */}
                    <div className="max-h-[400px] overflow-auto custom-scrollbar">
                        {loading && logs.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                                <RefreshCw className="h-6 w-6 animate-spin" />
                                Memuat log...
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-3 border-dashed border-2 border-muted m-4 rounded-xl">
                                <History className="h-8 w-8 opacity-20" />
                                <span>Belum ada riwayat aktivitas yang tercatat.</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {logs.map(log => {
                                    const actionInfo = formatAction(log.action)
                                    // Extract title from details if possible
                                    const title = log.details?.new_data?.judul ||
                                        log.details?.old_data?.judul ||
                                        log.details?.new_data?.["JUDUL KONTEN"] ||
                                        log.details?.new_data?.["JUDUL SIARAN PERS"] ||
                                        log.details?.title ||
                                        `ID: ${log.item_id.substring(0, 8)}...`

                                    return (
                                        <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors group">
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 p-2 rounded-lg ${actionInfo.bg} shrink-0`}>
                                                    <span className={actionInfo.color}>
                                                        {getActionIcon(log.action)}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-bold uppercase tracking-wider ${actionInfo.color}`}>
                                                                {actionInfo.label}
                                                            </span>
                                                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                                                {log.item_type}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatTime(log.timestamp)}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm font-medium mt-1 leading-snug line-clamp-2">
                                                        {title}
                                                    </p>

                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                                                            <User className="h-3 w-3 text-primary/60" />
                                                            <span className="font-medium text-foreground/80">{log.user_name || 'System'}</span>
                                                        </div>
                                                        {isPusat && log.office_id && (
                                                            <span className="text-[10px] text-primary/60 font-medium">
                                                                • Cabang ID: {log.office_id.substring(0, 8)}
                                                            </span>
                                                        )}
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
