import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Calendar, Clock, Send, X, Check, AlertCircle } from "lucide-react"

export function ContentScheduler({
    value,
    onChange,
    onSchedule,
    minDate = new Date().toISOString().split('T')[0]
}) {
    const [showPicker, setShowPicker] = useState(false)
    const [date, setDate] = useState(value?.date || '')
    const [time, setTime] = useState(value?.time || '09:00')

    function handleConfirm() {
        if (!date) return
        const scheduled = { date, time, datetime: `${date}T${time}:00` }
        onChange(scheduled)
        if (onSchedule) onSchedule(scheduled)
        setShowPicker(false)
    }

    function handleClear() {
        setDate('')
        setTime('09:00')
        onChange(null)
    }

    function formatScheduledDate(datetime) {
        if (!datetime) return null
        const d = new Date(datetime)
        return d.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Jadwal Publikasi
            </label>

            {value?.datetime ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="flex-1 text-sm">
                        Dijadwalkan: {formatScheduledDate(value.datetime)}
                    </span>
                    <button type="button" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPicker(true)}
                    className="w-full justify-start"
                >
                    <Calendar className="h-4 w-4 mr-2" />
                    Jadwalkan Publikasi...
                </Button>
            )}

            {showPicker && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-sm mx-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Jadwalkan Publikasi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Tanggal</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    min={minDate}
                                    className="w-full mt-1 p-3 rounded-lg bg-muted border border-border"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Waktu</label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full mt-1 p-3 rounded-lg bg-muted border border-border"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowPicker(false)} className="flex-1">
                                    Batal
                                </Button>
                                <Button type="button" onClick={handleConfirm} disabled={!date} className="flex-1">
                                    <Send className="h-4 w-4 mr-2" />
                                    Jadwalkan
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

// Scheduled content list
export function ScheduledContentList({ items = [], onPublish, onCancel }) {
    if (items.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada konten terjadwal</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <Clock className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                            {new Date(item.scheduled_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <Button type="button" size="sm" variant="outline" onClick={() => onPublish?.(item)}>
                            <Send className="h-3 w-3" />
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => onCancel?.(item)}>
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}
