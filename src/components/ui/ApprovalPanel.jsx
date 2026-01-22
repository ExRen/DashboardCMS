import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/components/ui/Toast"
import { Button } from "@/components/ui/Button"
import {
    CheckCircle, XCircle, Clock, FileEdit, Send,
    AlertCircle, MessageSquare, ChevronDown
} from "lucide-react"

const STATUS_CONFIG = {
    draft: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: FileEdit },
    pending: { label: "Menunggu Review", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    approved: { label: "Disetujui", color: "bg-green-100 text-green-700", icon: CheckCircle },
    rejected: { label: "Ditolak", color: "bg-red-100 text-red-700", icon: XCircle },
    published: { label: "Dipublikasi", color: "bg-blue-100 text-blue-700", icon: Send }
}

export function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
    const Icon = config.icon

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            <Icon className="h-3 w-3" />
            {config.label}
        </span>
    )
}

export function ApprovalPanel({ item, table, onUpdate }) {
    const toast = useToast()
    const { user, isAdmin, isEditor } = useAuth()
    const [loading, setLoading] = useState(false)
    const [showComment, setShowComment] = useState(false)
    const [comment, setComment] = useState("")

    const currentStatus = item?.status || "draft"
    const canApprove = isAdmin
    const canSubmit = isEditor && currentStatus === "draft"
    const canEdit = isEditor && ["draft", "rejected"].includes(currentStatus)

    async function updateStatus(newStatus, approvalComment = null) {
        setLoading(true)
        try {
            const updateData = {
                status: newStatus,
                updated_at: new Date().toISOString()
            }

            if (newStatus === 'approved' || newStatus === 'rejected') {
                updateData.approved_by = user?.id
                updateData.approved_at = new Date().toISOString()
                if (approvalComment) {
                    updateData.approval_comment = approvalComment
                }
            }

            const { error } = await supabase
                .from(table)
                .update(updateData)
                .eq('id', item.id)

            if (error) throw error

            toast.success(`Status berhasil diubah ke "${STATUS_CONFIG[newStatus].label}"`)

            if (onUpdate) onUpdate({ ...item, ...updateData })
            setShowComment(false)
            setComment("")
        } catch (error) {
            console.error("Update status error:", error)
            toast.error("Gagal mengubah status: " + error.message)
        }
        setLoading(false)
    }

    function handleApprove() {
        updateStatus('approved', comment || null)
    }

    function handleReject() {
        if (!comment.trim()) {
            toast.error("Masukkan alasan penolakan")
            return
        }
        updateStatus('rejected', comment)
    }

    return (
        <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Status Approval</h3>
                <StatusBadge status={currentStatus} />
            </div>

            {/* Current Status Info */}
            {item?.approved_by && (
                <div className="text-sm text-muted-foreground mb-4">
                    <p>
                        {currentStatus === 'approved' ? 'Disetujui' : 'Ditolak'} pada{' '}
                        {item.approved_at ? new Date(item.approved_at).toLocaleDateString('id-ID') : '-'}
                    </p>
                    {item.approval_comment && (
                        <p className="mt-1 italic">"{item.approval_comment}"</p>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
                {/* Submit for Review */}
                {canSubmit && (
                    <Button
                        onClick={() => updateStatus('pending')}
                        disabled={loading}
                        className="w-full"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Ajukan Review
                    </Button>
                )}

                {/* Admin Approval Actions */}
                {canApprove && currentStatus === 'pending' && (
                    <>
                        {!showComment ? (
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleApprove}
                                    disabled={loading}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Setujui
                                </Button>
                                <Button
                                    onClick={() => setShowComment(true)}
                                    disabled={loading}
                                    variant="outline"
                                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Tolak
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium">
                                        Komentar {currentStatus === 'pending' ? '(wajib untuk penolakan)' : ''}
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Masukkan komentar atau alasan..."
                                        className="w-full mt-1 p-3 rounded-lg bg-muted border border-border text-sm resize-none"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleApprove}
                                        disabled={loading}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        Setujui
                                    </Button>
                                    <Button
                                        onClick={handleReject}
                                        disabled={loading || !comment.trim()}
                                        className="flex-1 bg-red-600 hover:bg-red-700"
                                    >
                                        Tolak
                                    </Button>
                                    <Button
                                        onClick={() => { setShowComment(false); setComment(""); }}
                                        variant="outline"
                                    >
                                        Batal
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Publish (after approved) */}
                {canApprove && currentStatus === 'approved' && (
                    <Button
                        onClick={() => updateStatus('published')}
                        disabled={loading}
                        className="w-full"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Publikasikan
                    </Button>
                )}

                {/* Return to Draft (if rejected) */}
                {canEdit && currentStatus === 'rejected' && (
                    <Button
                        onClick={() => updateStatus('draft')}
                        disabled={loading}
                        variant="outline"
                        className="w-full"
                    >
                        <FileEdit className="h-4 w-4 mr-2" />
                        Edit Ulang (Kembali ke Draft)
                    </Button>
                )}
            </div>

            {/* Info for non-editors */}
            {!isEditor && !isAdmin && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>Anda tidak memiliki akses untuk mengubah status</span>
                </div>
            )}
        </div>
    )
}

export function StatusFilter({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false)
    const selected = STATUS_CONFIG[value] || { label: "Semua Status" }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-muted"
            >
                <span>{selected.label}</span>
                <ChevronDown className="h-4 w-4" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-card border rounded-lg shadow-lg z-50">
                    <button
                        onClick={() => { onChange(null); setIsOpen(false); }}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-muted"
                    >
                        Semua Status
                    </button>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => { onChange(key); setIsOpen(false); }}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                        >
                            <config.icon className="h-4 w-4" />
                            {config.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
