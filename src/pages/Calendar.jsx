import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"
import { supabase } from "@/lib/supabase"
import { ChevronLeft, ChevronRight, FileText, Megaphone, Calendar, List, Grid3X3, Keyboard, GripVertical } from "lucide-react"

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const DAYS_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const CONTENT_COLORS = {
    'Campaign': '#3b82f6', 'Hari Penting': '#8b5cf6', 'Quote/Quotes': '#10b981',
    'Infografis': '#f59e0b', 'Dokumentasi': '#06b6d4', 'Berita': '#3b82f6',
    'Statement': '#8b5cf6', 'Feature': '#10b981', 'default': '#6b7280'
}

export function CalendarPage() {
    const toast = useToast()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState([])
    const [selectedDate, setSelectedDate] = useState(null)
    const [loading, setLoading] = useState(true)
    const [viewType, setViewType] = useState('all')
    const [viewMode, setViewMode] = useState('month')
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [draggedEvent, setDraggedEvent] = useState(null)
    const [dragOverDay, setDragOverDay] = useState(null)

    useEffect(() => { fetchEvents() }, [currentDate])

    useEffect(() => {
        function handleKeyDown(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
            if (e.key === 'ArrowLeft') { e.preventDefault(); viewMode === 'week' ? prevWeek() : prevMonth() }
            if (e.key === 'ArrowRight') { e.preventDefault(); viewMode === 'week' ? nextWeek() : nextMonth() }
            if (e.key === 't' || e.key === 'T') { e.preventDefault(); goToToday() }
            if (e.key === 'w' || e.key === 'W') { e.preventDefault(); setViewMode('week') }
            if (e.key === 'm' || e.key === 'M') { e.preventDefault(); setViewMode('month') }
            if (e.key === '?') { e.preventDefault(); setShowShortcuts(!showShortcuts) }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [viewMode, showShortcuts])

    async function fetchEvents() {
        setLoading(true)
        try {
            const monthIndex = currentDate.getMonth()
            const year = currentDate.getFullYear()
            const monthNameID = MONTHS[monthIndex]
            const monthNameEN = MONTHS_EN[monthIndex]

            const { data: pressData } = await supabase.from('press_releases').select('*').limit(500)
            const { data: commandoData } = await supabase.from('commando_contents').select('*').limit(2000)

            const allEvents = []
            pressData?.forEach(pr => {
                const dateStr = pr["TANGGAL TERBIT"] || ""
                const day = extractDay(dateStr, monthIndex, year, monthNameID, monthNameEN)
                if (day) allEvents.push({ id: pr.id, day, type: 'press', title: pr["JUDUL SIARAN PERS"], category: pr["JENIS RILIS"], date: dateStr, originalDate: dateStr })
            })
            commandoData?.forEach(c => {
                const dateStr = c["TANGGAL"] || ""
                const day = extractDay(dateStr, monthIndex, year, monthNameID, monthNameEN)
                if (day) allEvents.push({ id: c.id, day, type: 'commando', title: c["JUDUL KONTEN"], category: c["JENIS KONTEN"], media: c["MEDIA"], date: dateStr, originalDate: dateStr })
            })
            setEvents(allEvents)
        } catch (error) {
            console.error("Error:", error)
        } finally {
            setLoading(false)
        }
    }

    function extractDay(dateStr, monthIndex, year, monthNameID, monthNameEN) {
        if (!dateStr) return null
        const hasMonth = dateStr.includes(monthNameID) || dateStr.includes(monthNameEN)
        const hasYear = dateStr.includes(year.toString())
        if (!hasMonth || !hasYear) return null
        const match1 = dateStr.match(/^(\d{1,2})\s/)
        if (match1) return parseInt(match1[1])
        const match2 = dateStr.match(/,\s*(\d{1,2}),?\s*\d{4}/)
        if (match2) return parseInt(match2[1])
        const match3 = dateStr.match(/\w+\s+(\d{1,2}),?\s*\d{4}/)
        if (match3) return parseInt(match3[1])
        const match4 = dateStr.match(/(\d{1,2})/)
        if (match4) return parseInt(match4[1])
        return null
    }

    function formatNewDate(day) {
        return `${day} ${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }

    // Drag & Drop Handlers
    function handleDragStart(e, event) {
        setDraggedEvent(event)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', JSON.stringify(event))
        e.target.style.opacity = '0.5'
    }

    function handleDragEnd(e) {
        e.target.style.opacity = '1'
        setDraggedEvent(null)
        setDragOverDay(null)
    }

    function handleDragOver(e, day) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverDay(day)
    }

    function handleDragLeave() {
        setDragOverDay(null)
    }

    async function handleDrop(e, targetDay) {
        e.preventDefault()
        setDragOverDay(null)

        if (!draggedEvent || draggedEvent.day === targetDay) {
            setDraggedEvent(null)
            return
        }

        const newDateStr = formatNewDate(targetDay)

        try {
            if (draggedEvent.type === 'press') {
                const { error } = await supabase
                    .from('press_releases')
                    .update({ "TANGGAL TERBIT": newDateStr })
                    .eq('id', draggedEvent.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('commando_contents')
                    .update({ "TANGGAL": newDateStr })
                    .eq('id', draggedEvent.id)
                if (error) throw error
            }

            // Update local state immediately for better UX
            setEvents(prev => prev.map(ev =>
                ev.id === draggedEvent.id && ev.type === draggedEvent.type
                    ? { ...ev, day: targetDay, date: newDateStr }
                    : ev
            ))

            toast.success(`"${draggedEvent.title?.substring(0, 30)}..." dipindahkan ke ${newDateStr}`)
        } catch (error) {
            toast.error("Gagal memindahkan: " + error.message)
        }

        setDraggedEvent(null)
    }

    function getDaysInMonth(date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() }
    function getFirstDayOfMonth(date) { return new Date(date.getFullYear(), date.getMonth(), 1).getDay() }
    function prevMonth() { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); setSelectedDate(null) }
    function nextMonth() { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); setSelectedDate(null) }
    function prevWeek() { setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)); setSelectedDate(null) }
    function nextWeek() { setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)); setSelectedDate(null) }
    function goToToday() { setCurrentDate(new Date()); setSelectedDate(new Date().getDate()) }
    function getEventsForDay(day) { return events.filter(e => e.day === day) }
    function getFilteredEvents(dayEvents) { return viewType === 'all' ? dayEvents : dayEvents.filter(e => e.type === viewType) }
    function getContentColor(category) { return CONTENT_COLORS[category] || CONTENT_COLORS.default }

    function getWeekDays() {
        const startOfWeek = new Date(currentDate)
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek)
            d.setDate(startOfWeek.getDate() + i)
            return d
        })
    }

    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
    const selectedEvents = selectedDate ? getFilteredEvents(getEventsForDay(selectedDate)) : []
    const weekDays = getWeekDays()

    return (
        <div className="space-y-6">
            {/* Keyboard Shortcuts Modal */}
            {showShortcuts && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
                    <Card className="w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Keyboard className="h-5 w-5" />Keyboard Shortcuts</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[['← / →', 'Navigasi bulan/minggu'], ['T', 'Ke hari ini'], ['W', 'Tampilan mingguan'], ['M', 'Tampilan bulanan'], ['?', 'Toggle shortcuts'], ['Drag & Drop', 'Pindah jadwal']].map(([key, desc]) => (
                                    <div key={key} className="flex items-center justify-between"><kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">{key}</kbd><span className="text-sm text-muted-foreground">{desc}</span></div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Kalender Publikasi</h2>
                    <p className="text-muted-foreground text-sm">Drag & drop item untuk pindah jadwal</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center rounded-lg border p-1">
                        <Button variant={viewMode === 'month' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('month')} className="h-7"><Grid3X3 className="h-4 w-4" /></Button>
                        <Button variant={viewMode === 'week' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('week')} className="h-7"><List className="h-4 w-4" /></Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToToday}>Hari Ini</Button>
                    <Button variant={viewType === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setViewType('all')}>Semua</Button>
                    <Button variant={viewType === 'press' ? 'default' : 'outline'} size="sm" onClick={() => setViewType('press')}><FileText className="h-4 w-4 mr-1" />Siaran Pers</Button>
                    <Button variant={viewType === 'commando' ? 'default' : 'outline'} size="sm" onClick={() => setViewType('commando')}><Megaphone className="h-4 w-4 mr-1" />COMMANDO</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(true)} title="Keyboard Shortcuts"><Keyboard className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <Button variant="ghost" size="sm" onClick={viewMode === 'week' ? prevWeek : prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                        <CardTitle className="text-lg">
                            {viewMode === 'week' ? `${weekDays[0].getDate()} - ${weekDays[6].getDate()} ${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}` : `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={viewMode === 'week' ? nextWeek : nextMonth}><ChevronRight className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                        ) : viewMode === 'month' ? (
                            <>
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {days.map((day, index) => {
                                        if (day === null) return <div key={`empty-${index}`} className="aspect-square" />
                                        const dayEvents = getFilteredEvents(getEventsForDay(day))
                                        const isSelected = selectedDate === day
                                        const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear()
                                        const isDragOver = dragOverDay === day

                                        return (
                                            <div
                                                key={day}
                                                onClick={() => setSelectedDate(day)}
                                                onDragOver={(e) => handleDragOver(e, day)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, day)}
                                                className={`aspect-square rounded-lg p-1 text-sm transition-all cursor-pointer border-2
                          ${isSelected ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 border-transparent' : ''}
                          ${isToday && !isSelected ? 'bg-accent font-bold border-transparent' : ''}
                          ${isDragOver ? 'bg-primary/20 border-primary border-dashed' : 'border-transparent'}
                          ${!isSelected && !isToday && !isDragOver ? 'hover:bg-muted' : ''}
                        `}
                                            >
                                                <span className="block text-center">{day}</span>
                                                {dayEvents.length > 0 && (
                                                    <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
                                                        {dayEvents.slice(0, 3).map((e, i) => (
                                                            <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.type === 'press' ? '#3b82f6' : getContentColor(e.category) }} />
                                                        ))}
                                                        {dayEvents.length > 3 && <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="grid grid-cols-7 gap-2">
                                {weekDays.map((date, idx) => {
                                    const day = date.getDate()
                                    const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                                    const isToday = date.toDateString() === new Date().toDateString()
                                    const dayEvents = isCurrentMonth ? getFilteredEvents(getEventsForDay(day)) : []
                                    const isDragOver = dragOverDay === day && isCurrentMonth

                                    return (
                                        <div
                                            key={idx}
                                            onDragOver={(e) => isCurrentMonth && handleDragOver(e, day)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => isCurrentMonth && handleDrop(e, day)}
                                            className={`min-h-[200px] rounded-lg border-2 p-2 transition-all
                        ${isToday ? 'border-primary bg-primary/5' : ''}
                        ${isDragOver ? 'bg-primary/20 border-primary border-dashed' : 'border-border'}
                        ${!isCurrentMonth ? 'opacity-40' : ''}
                      `}
                                        >
                                            <div className="text-center mb-2" onClick={() => isCurrentMonth && setSelectedDate(day)}>
                                                <div className="text-xs text-muted-foreground">{DAYS_FULL[idx]}</div>
                                                <div className="text-lg font-bold cursor-pointer hover:text-primary">{day}</div>
                                            </div>
                                            <div className="space-y-1 max-h-[150px] overflow-auto">
                                                {dayEvents.slice(0, 5).map((event, i) => (
                                                    <div
                                                        key={i}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, event)}
                                                        onDragEnd={handleDragEnd}
                                                        className="text-xs p-1 rounded cursor-move flex items-center gap-1 hover:ring-2 hover:ring-primary/50 transition-all"
                                                        style={{ backgroundColor: `${event.type === 'press' ? '#3b82f6' : getContentColor(event.category)}20`, borderLeft: `3px solid ${event.type === 'press' ? '#3b82f6' : getContentColor(event.category)}` }}
                                                    >
                                                        <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                        <span className="truncate">{event.title?.substring(0, 18) || '-'}...</span>
                                                    </div>
                                                ))}
                                                {dayEvents.length > 5 && <div className="text-xs text-muted-foreground text-center">+{dayEvents.length - 5} lainnya</div>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t flex-wrap">
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-xs text-muted-foreground">Siaran Pers</span></div>
                            {Object.entries(CONTENT_COLORS).slice(0, 4).map(([name, color]) => name !== 'default' && (
                                <div key={name} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} /><span className="text-xs text-muted-foreground">{name}</span></div>
                            ))}
                            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l"><GripVertical className="h-3 w-3" /><span className="text-xs text-muted-foreground">Drag untuk pindah</span></div>
                        </div>
                    </CardContent>
                </Card>

                {/* Selected Day Events - with draggable items */}
                <Card>
                    <CardHeader><CardTitle className="text-base">{selectedDate ? `${selectedDate} ${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}` : 'Pilih Tanggal'}</CardTitle></CardHeader>
                    <CardContent>
                        {selectedDate ? (
                            selectedEvents.length > 0 ? (
                                <div className="space-y-3 max-h-[400px] overflow-auto">
                                    {selectedEvents.map((event, index) => (
                                        <div
                                            key={event.id || index}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, event)}
                                            onDragEnd={handleDragEnd}
                                            className="p-3 rounded-lg border cursor-move hover:ring-2 hover:ring-primary/50 transition-all"
                                            style={{ borderColor: `${event.type === 'press' ? '#3b82f6' : getContentColor(event.category)}40`, backgroundColor: `${event.type === 'press' ? '#3b82f6' : getContentColor(event.category)}08` }}
                                        >
                                            <div className="flex items-start gap-2">
                                                <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                {event.type === 'press' ? <FileText className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" /> : <Megaphone className="h-4 w-4 mt-0.5 shrink-0" style={{ color: getContentColor(event.category) }} />}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium line-clamp-2">{event.title || "-"}</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {event.category && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${getContentColor(event.category)}20`, color: getContentColor(event.category) }}>{event.category}</span>}
                                                        {event.media && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-600">{event.media}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="text-center py-8 text-muted-foreground"><p className="text-sm">Tidak ada publikasi pada tanggal ini</p></div>
                        ) : <div className="text-center py-8 text-muted-foreground"><p className="text-sm">Klik tanggal untuk melihat detail publikasi</p></div>}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{events.filter(e => e.type === 'press').length}</p><p className="text-xs text-muted-foreground">Siaran Pers bulan ini</p></div></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><Megaphone className="h-5 w-5 text-purple-500" /></div><div><p className="text-2xl font-bold">{events.filter(e => e.type === 'commando').length}</p><p className="text-xs text-muted-foreground">COMMANDO bulan ini</p></div></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Calendar className="h-5 w-5 text-green-500" /></div><div><p className="text-2xl font-bold">{events.length}</p><p className="text-xs text-muted-foreground">Total publikasi bulan ini</p></div></div></CardContent></Card>
            </div>
        </div>
    )
}
