import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"
import { DatePicker } from "@/components/ui/DatePicker"
import { ExportMenu } from "@/components/ui/ExportMenu"
import { useData } from "@/context/DataContext"
import { supabase } from "@/lib/supabase"
import { parseDate } from "@/lib/dateUtils"
import { exportToCSV } from "@/lib/export"
import { copyTableData } from "@/lib/clipboard"
import { SmartSearch } from "@/components/ui/SmartSearch"
import { UserPreferences } from "@/components/ui/UserPreferences"
import { MentionInput } from "@/components/ui/MentionInput"
import { AssignmentDropdown } from "@/components/ui/AssignmentDropdown"
import { ContentTemplates } from "@/components/ui/ContentTemplates"
import { logActivity } from "@/components/ui/ActivityLog"
import { CommentsPanel, getCommentCount } from "@/components/ui/CommentsPanel"
import { ExternalLink, Filter, Search, Plus, X, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Upload, CheckSquare, Square, Calendar, Keyboard, MessageSquare, Download, Copy, Printer } from "lucide-react"

const PAGE_SIZE = 50
const INITIAL_FORM = {
    "JUDUL SIARAN PERS": "", "NOMOR SIARAN PERS": "", "TANGGAL TERBIT": "",
    "JENIS RILIS": "", "KETEGORI": "", "MEDIA PLAN": "", "LINGKUP": "",
    "LINK WEBSITE": "", "FOLDER SIARAN PERS": "", "WRITER CORCOMM": "",
    "REVIEW": "", "PROCESS": "", "KETERANGAN": "", year: 2025,
    "ASSIGNED_TO": "", "NOTES": ""
}

export function PressReleases() {
    const toast = useToast()
    const { pressReleases: cachedPress, loading: dataLoading, fetchPressReleases } = useData()
    const searchRef = useRef(null)

    // All state variables
    const [pressReleases, setPressReleases] = useState([])
    const [allData, setAllData] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [selectedJenis, setSelectedJenis] = useState("")
    const [selectedYear, setSelectedYear] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [showImport, setShowImport] = useState(false)
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [sortField, setSortField] = useState("NO")
    const [sortOrder, setSortOrder] = useState("desc")
    const [selectedIds, setSelectedIds] = useState([])
    const [formData, setFormData] = useState(INITIAL_FORM)
    const [submitting, setSubmitting] = useState(false)
    const [importData, setImportData] = useState([])
    const [importing, setImporting] = useState(false)
    const [showComments, setShowComments] = useState(false)
    const [visibleColumns, setVisibleColumns] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('pressVisibleColumns'))
            return saved || ["NO", "TANGGAL TERBIT", "NOMOR SIARAN PERS", "JUDUL SIARAN PERS", "JENIS RILIS", "KETEGORI", "LINK"]
        } catch { return ["NO", "TANGGAL TERBIT", "NOMOR SIARAN PERS", "JUDUL SIARAN PERS", "JENIS RILIS", "KETEGORI", "LINK"] }
    })

    // Table columns config
    const TABLE_COLUMNS = [
        { key: "NO", label: "No" },
        { key: "TANGGAL TERBIT", label: "Tanggal" },
        { key: "NOMOR SIARAN PERS", label: "Nomor SP" },
        { key: "JUDUL SIARAN PERS", label: "Judul" },
        { key: "JENIS RILIS", label: "Jenis Rilis" },
        { key: "KETEGORI", label: "Kategori" },
        { key: "WRITER CORCOMM", label: "Writer" },
        { key: "LINGKUP", label: "Lingkup" },
        { key: "LINK", label: "Link/Aksi" }
    ]

    // Memoized filter options
    const jenisOptions = useMemo(() => [...new Set(allData.map(p => p["JENIS RILIS"]).filter(Boolean))], [allData])
    const kategoriOptions = useMemo(() => [...new Set(allData.map(p => p["KETEGORI"]).filter(Boolean))], [allData])
    const lingkupOptions = useMemo(() => [...new Set(allData.map(p => p["LINGKUP"]).filter(Boolean))], [allData])
    const yearOptions = useMemo(() => [...new Set(allData.map(p => p.year).filter(Boolean))].sort((a, b) => b - a), [allData])

    // Memoized filtered data for select all functionality
    const filteredData = useMemo(() => {
        let filtered = [...allData]
        if (selectedJenis) filtered = filtered.filter(p => p["JENIS RILIS"] === selectedJenis)
        if (selectedYear) filtered = filtered.filter(p => p.year === parseInt(selectedYear))
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(p => p["JUDUL SIARAN PERS"]?.toLowerCase().includes(term) || p["NOMOR SIARAN PERS"]?.toLowerCase().includes(term))
        }
        if (dateFrom || dateTo) {
            filtered = filtered.filter(p => {
                const date = parseDate(p["TANGGAL TERBIT"])
                if (!date) return false
                const fromDate = dateFrom ? new Date(dateFrom) : null
                const toDate = dateTo ? new Date(dateTo) : null
                if (toDate) toDate.setHours(23, 59, 59, 999)
                if (fromDate && date < fromDate) return false
                if (toDate && date > toDate) return false
                return true
            })
        }
        return filtered
    }, [allData, selectedJenis, selectedYear, searchTerm, dateFrom, dateTo])

    // Use cached data from context
    useEffect(() => {
        if (cachedPress.length > 0) {
            setAllData(cachedPress)
            setTotalCount(cachedPress.length)
            setLoading(false)
        } else if (!dataLoading.press) {
            fetchPressReleases()
        }
    }, [cachedPress, dataLoading.press])

    useEffect(() => { applyFiltersAndPagination() }, [allData, sortField, sortOrder, selectedJenis, selectedYear, searchTerm, dateFrom, dateTo, currentPage])

    // Keyboard Shortcuts
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if (e.key === 'Escape') { setShowForm(false); setShowImport(false); setShowShortcuts(false) }
                return
            }
            if (e.ctrlKey && e.key === 'n') { e.preventDefault(); resetForm(); setShowForm(true) }
            if (e.ctrlKey && e.key === 'f') { e.preventDefault(); searchRef.current?.focus() }
            if (e.key === 'Escape') { setShowForm(false); setShowImport(false); setShowShortcuts(false) }
            if (e.key === '?') setShowShortcuts(s => !s)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    async function refreshData() {
        setLoading(true)
        const data = await fetchPressReleases(true) // Force refresh
        setAllData(data)
        setTotalCount(data.length)
        setLoading(false)
    }

    // parseDate is imported from @/lib/dateUtils

    function applyFiltersAndPagination() {
        let filtered = [...allData]
        if (selectedJenis) filtered = filtered.filter(p => p["JENIS RILIS"] === selectedJenis)
        if (selectedYear) filtered = filtered.filter(p => p.year === parseInt(selectedYear))
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(p => p["JUDUL SIARAN PERS"]?.toLowerCase().includes(term) || p["NOMOR SIARAN PERS"]?.toLowerCase().includes(term))
        }
        if (dateFrom || dateTo) {
            filtered = filtered.filter(p => {
                const date = parseDate(p["TANGGAL TERBIT"])
                if (!date) return false
                const fromDate = dateFrom ? new Date(dateFrom) : null
                const toDate = dateTo ? new Date(dateTo) : null
                if (toDate) toDate.setHours(23, 59, 59, 999) // Include the whole end day
                if (fromDate && date < fromDate) return false
                if (toDate && date > toDate) return false
                return true
            })
        }
        // Sort with proper date comparison
        filtered.sort((a, b) => {
            let aVal, bVal
            if (sortField === "TANGGAL TERBIT") {
                aVal = parseDate(a["TANGGAL TERBIT"])?.getTime() || 0
                bVal = parseDate(b["TANGGAL TERBIT"])?.getTime() || 0
            } else if (sortField === "created_at") {
                aVal = new Date(a.created_at || 0).getTime()
                bVal = new Date(b.created_at || 0).getTime()
            } else {
                aVal = a[sortField] || ""
                bVal = b[sortField] || ""
            }
            if (sortOrder === 'asc') return aVal > bVal ? 1 : -1
            return aVal < bVal ? 1 : -1
        })
        const startIndex = (currentPage - 1) * PAGE_SIZE
        setPressReleases(filtered.slice(startIndex, startIndex + PAGE_SIZE))
        setTotalCount(filtered.length)
    }

    function handleSort(field) {
        if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        else { setSortField(field); setSortOrder('desc') }
        setCurrentPage(1)
    }

    function getSortIcon(field) {
        if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1" />
        return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
    }

    function toggleSelectAll() {
        // Select all filtered data, not just current page
        const allFilteredIds = filteredData.map(p => p.id)
        if (selectedIds.length === allFilteredIds.length) setSelectedIds([])
        else setSelectedIds(allFilteredIds)
    }

    function toggleSelect(id) {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id))
        else setSelectedIds([...selectedIds, id])
    }

    async function handleBulkDelete() {
        if (selectedIds.length === 0) return
        toast.confirm(`Hapus ${selectedIds.length} item yang dipilih?`, async () => {
            try {
                const { error } = await supabase.from('press_releases').delete().in('id', selectedIds)
                if (error) throw error
                toast.success(`${selectedIds.length} item berhasil dihapus!`)
                setSelectedIds([])
                await fetchAllData()
            } catch (error) { toast.error("Gagal menghapus: " + error.message) }
        })
    }

    function handleExportSelected() {
        const dataToExport = allData.filter(p => selectedIds.includes(p.id)).map(p => ({
            "NO": p["NO"], "TANGGAL TERBIT": p["TANGGAL TERBIT"], "NOMOR SIARAN PERS": p["NOMOR SIARAN PERS"],
            "JUDUL SIARAN PERS": p["JUDUL SIARAN PERS"], "JENIS RILIS": p["JENIS RILIS"], "LINGKUP": p["LINGKUP"],
            "WRITER CORCOMM": p["WRITER CORCOMM"], "LINK WEBSITE": p["LINK WEBSITE"]
        }))
        exportToCSV(dataToExport, 'siaran_pers_selected')
        toast.success(`${dataToExport.length} data berhasil diexport!`)
    }

    async function handleCopySelected() {
        const dataToCopy = allData.filter(p => selectedIds.includes(p.id)).map(p => ({
            "No": p["NO"], "Tanggal": p["TANGGAL TERBIT"], "Nomor SP": p["NOMOR SIARAN PERS"],
            "Judul": p["JUDUL SIARAN PERS"], "Jenis": p["JENIS RILIS"], "Writer": p["WRITER CORCOMM"]
        }))
        const success = await copyTableData(dataToCopy)
        if (success) toast.success(`${dataToCopy.length} data disalin ke clipboard!`)
        else toast.error("Gagal menyalin data")
    }

    function handlePrint() {
        window.print()
    }

    function resetForm() {
        setFormData({ "JUDUL SIARAN PERS": "", "NOMOR SIARAN PERS": "", "TANGGAL TERBIT": "", "JENIS RILIS": "", "KETEGORI": "", "MEDIA PLAN": "", "LINGKUP": "", "LINK WEBSITE": "", "FOLDER SIARAN PERS": "", "WRITER CORCOMM": "", "REVIEW": "", "PROCESS": "", "KETERANGAN": "", year: 2025 })
        setEditingId(null)
    }

    function handleEdit(pr) {
        setEditingId(pr.id)
        setFormData({ "JUDUL SIARAN PERS": pr["JUDUL SIARAN PERS"] || "", "NOMOR SIARAN PERS": pr["NOMOR SIARAN PERS"] || "", "TANGGAL TERBIT": pr["TANGGAL TERBIT"] || "", "JENIS RILIS": pr["JENIS RILIS"] || "", "KETEGORI": pr["KETEGORI"] || "", "MEDIA PLAN": pr["MEDIA PLAN"] || "", "LINGKUP": pr["LINGKUP"] || "", "LINK WEBSITE": pr["LINK WEBSITE"] || "", "FOLDER SIARAN PERS": pr["FOLDER SIARAN PERS"] || "", "WRITER CORCOMM": pr["WRITER CORCOMM"] || "", "REVIEW": pr["REVIEW"] || "", "PROCESS": pr["PROCESS"] || "", "KETERANGAN": pr["KETERANGAN"] || "", year: pr.year || 2025 })
        setShowForm(true)
    }

    async function handleDelete(id) {
        const itemToDelete = allData.find(p => p.id === id)
        toast.confirm("Apakah Anda yakin ingin menghapus siaran pers ini?", async () => {
            try {
                const { error } = await supabase.from('press_releases').delete().eq('id', id)
                if (error) throw error
                logActivity('delete', 'Siaran Pers', itemToDelete?.["JUDUL SIARAN PERS"] || 'Item')
                await fetchAllData(); toast.success("Siaran pers berhasil dihapus!")
            } catch (error) { toast.error("Gagal menghapus: " + error.message) }
        })
    }

    async function handleSubmit(e) {
        e.preventDefault(); setSubmitting(true)
        try {
            if (editingId) {
                const { error } = await supabase.from('press_releases').update(formData).eq('id', editingId)
                if (error) throw error
                logActivity('edit', 'Siaran Pers', formData["JUDUL SIARAN PERS"])
                toast.success("Siaran pers berhasil diperbarui!")
            } else {
                const { error } = await supabase.from('press_releases').insert([formData])
                if (error) throw error
                logActivity('create', 'Siaran Pers', formData["JUDUL SIARAN PERS"])
                toast.success("Siaran pers berhasil ditambahkan!")
            }
            await fetchPressReleases(); resetForm(); setShowForm(false)
        } catch (error) { toast.error("Gagal menyimpan: " + error.message) }
        finally { setSubmitting(false) }
    }

    function handleExport() {
        const dataToExport = allData.map(p => ({ "NO": p["NO"], "TANGGAL TERBIT": p["TANGGAL TERBIT"], "NOMOR SIARAN PERS": p["NOMOR SIARAN PERS"], "JUDUL SIARAN PERS": p["JUDUL SIARAN PERS"], "JENIS RILIS": p["JENIS RILIS"], "KETEGORI": p["KETEGORI"], "LINGKUP": p["LINGKUP"], "WRITER CORCOMM": p["WRITER CORCOMM"], "LINK WEBSITE": p["LINK WEBSITE"] }))
        exportToCSV(dataToExport, 'siaran_pers'); toast.success("Data berhasil diexport!")
    }

    function handleFileUpload(e) {
        const file = e.target.files?.[0]; if (!file) return
        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result; const lines = text.split('\n')
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
            const data = []
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue
                const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
                const row = {}; headers.forEach((h, idx) => { row[h] = values[idx] || '' }); data.push(row)
            }
            setImportData(data)
        }
        reader.readAsText(file)
    }

    async function handleImport() {
        if (importData.length === 0) return; setImporting(true)
        try {
            const dataToInsert = importData.map(row => ({ ...row, year: row.year ? parseInt(row.year) : 2025 }))
            const { error } = await supabase.from('press_releases').insert(dataToInsert)
            if (error) throw error
            toast.success(`${dataToInsert.length} data berhasil diimport!`); setShowImport(false); setImportData([]); await fetchAllData()
        } catch (error) { toast.error("Gagal import: " + error.message) }
        finally { setImporting(false) }
    }

    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    if (loading) return <div className="flex items-center justify-center h-full"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div><p className="text-sm text-muted-foreground mt-2">Memuat data...</p></div></div>

    return (
        <div className="space-y-6">
            {/* Keyboard Shortcuts Modal */}
            {showShortcuts && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
                    <Card className="w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Keyboard className="h-5 w-5" />Keyboard Shortcuts</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[['Ctrl+N', 'Tambah data baru'], ['Ctrl+E', 'Export CSV'], ['Ctrl+F', 'Focus ke search'], ['Esc', 'Tutup modal'], ['?', 'Toggle shortcuts']].map(([key, desc]) => (
                                    <div key={key} className="flex items-center justify-between"><kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">{key}</kbd><span className="text-sm text-muted-foreground">{desc}</span></div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Import Modal */}
            {showImport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
                        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Import CSV</CardTitle><button onClick={() => { setShowImport(false); setImportData([]); }}><X className="h-5 w-5" /></button></CardHeader>
                        <CardContent className="space-y-4">
                            <div><label className="text-sm font-medium">Pilih File CSV</label><input type="file" accept=".csv" onChange={handleFileUpload} className="w-full mt-1 p-2 rounded-lg bg-muted border border-border text-sm" /></div>
                            {importData.length > 0 && (<>
                                <div className="text-sm text-muted-foreground">{importData.length} baris data siap diimport</div>
                                <div className="max-h-48 overflow-auto border rounded-lg"><table className="w-full text-xs"><thead className="bg-muted"><tr>{Object.keys(importData[0]).slice(0, 4).map(key => <th key={key} className="p-2 text-left">{key}</th>)}</tr></thead><tbody>{importData.slice(0, 5).map((row, idx) => (<tr key={idx} className="border-t">{Object.values(row).slice(0, 4).map((val, i) => <td key={i} className="p-2 truncate max-w-[150px]">{val}</td>)}</tr>))}</tbody></table></div>
                                <div className="flex gap-3"><Button variant="outline" onClick={() => { setShowImport(false); setImportData([]); }} className="flex-1">Batal</Button><Button onClick={handleImport} disabled={importing} className="flex-1">{importing ? "Mengimport..." : `Import ${importData.length} Data`}</Button></div>
                            </>)}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <CardTitle>{editingId ? "Edit Siaran Pers" : "Tambah Siaran Pers Baru"}</CardTitle>
                                {!editingId && (
                                    <ContentTemplates
                                        onApply={(templateData) => setFormData(prev => ({ ...prev, ...templateData }))}
                                    />
                                )}
                            </div>
                            <button onClick={() => { setShowForm(false); resetForm(); }}><X className="h-5 w-5" /></button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div><label className="text-sm font-medium">Judul Siaran Pers *</label><textarea required value={formData["JUDUL SIARAN PERS"]} onChange={(e) => setFormData({ ...formData, "JUDUL SIARAN PERS": e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm" rows={2} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-sm font-medium">Nomor Siaran Pers</label><input type="text" value={formData["NOMOR SIARAN PERS"]} onChange={(e) => setFormData({ ...formData, "NOMOR SIARAN PERS": e.target.value })} className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm" /></div>
                                    <div><label className="text-sm font-medium">Tanggal Terbit</label><div className="mt-1"><DatePicker value={formData["TANGGAL TERBIT"]} onChange={(val) => setFormData({ ...formData, "TANGGAL TERBIT": val })} placeholder="Pilih atau ketik tanggal..." /></div></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Jenis Rilis</label>
                                        <select value={formData["JENIS RILIS"]} onChange={(e) => setFormData({ ...formData, "JENIS RILIS": e.target.value })} className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm">
                                            <option value="">Pilih Jenis Rilis</option>
                                            {jenisOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Kategori</label>
                                        <select value={formData["KETEGORI"]} onChange={(e) => setFormData({ ...formData, "KETEGORI": e.target.value })} className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm">
                                            <option value="">Pilih Kategori</option>
                                            {kategoriOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Lingkup</label>
                                        <select value={formData["LINGKUP"]} onChange={(e) => setFormData({ ...formData, "LINGKUP": e.target.value })} className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm">
                                            <option value="">Pilih Lingkup</option>
                                            {lingkupOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div><label className="text-sm font-medium">Writer Corcomm</label><input type="text" value={formData["WRITER CORCOMM"]} onChange={(e) => setFormData({ ...formData, "WRITER CORCOMM": e.target.value })} className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm" /></div>
                                </div>
                                <div><label className="text-sm font-medium">Link Website</label><input type="text" value={formData["LINK WEBSITE"]} onChange={(e) => setFormData({ ...formData, "LINK WEBSITE": e.target.value })} className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm" /></div>

                                {/* Assignment & Notes */}
                                <div className="grid grid-cols-2 gap-4">
                                    <AssignmentDropdown
                                        value={formData["ASSIGNED_TO"]}
                                        onChange={(val) => setFormData({ ...formData, "ASSIGNED_TO": val })}
                                        itemId={editingId}
                                        itemType="press"
                                    />
                                    <div>
                                        <label className="text-sm font-medium">Catatan (@mention)</label>
                                        <MentionInput
                                            value={formData["NOTES"]}
                                            onChange={(val) => setFormData({ ...formData, "NOTES": val })}
                                            placeholder="Tulis catatan... @mention untuk tag"
                                        />
                                    </div>
                                </div>

                                {/* Comments Button - only for editing */}
                                {editingId && (
                                    <div className="pt-2 border-t border-border">
                                        <button
                                            type="button"
                                            onClick={() => setShowComments(true)}
                                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Lihat Komentar ({getCommentCount(editingId, 'press')})
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2"><Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1">Batal</Button><Button type="submit" disabled={submitting} className="flex-1">{submitting ? "Menyimpan..." : (editingId ? "Update" : "Simpan")}</Button></div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Comments Panel */}
            <CommentsPanel
                contentId={editingId}
                contentType="press"
                isOpen={showComments}
                onClose={() => setShowComments(false)}
            />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{allData.length}</div><p className="text-xs text-muted-foreground">Total Siaran Pers</p></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-600">{jenisOptions.length}</div><p className="text-xs text-muted-foreground">Jenis Rilis</p></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{allData.filter(p => p["LINK WEBSITE"]).length}</div><p className="text-xs text-muted-foreground">Dengan Link</p></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-purple-600">{new Set(allData.map(p => p["WRITER CORCOMM"]).filter(Boolean)).size}</div><p className="text-xs text-muted-foreground">Writer</p></CardContent></Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <SmartSearch
                                    data={allData}
                                    searchKeys={["JUDUL SIARAN PERS", "NOMOR SIARAN PERS", "WRITER CORCOMM"]}
                                    onSearch={(term) => { setSearchTerm(term); setCurrentPage(1); }}
                                    placeholder="Smart search judul, nomor, writer... (Ctrl+F)"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }} className="h-10 px-3 rounded-lg bg-muted border-none text-sm"><option value="">Semua Tahun</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select>
                                <select value={selectedJenis} onChange={(e) => { setSelectedJenis(e.target.value); setCurrentPage(1); }} className="h-10 px-3 rounded-lg bg-muted border-none text-sm"><option value="">Semua Jenis</option>{jenisOptions.map(j => <option key={j} value={j}>{j}</option>)}</select>
                            </div>
                        </div>
                        {/* Date Range Filter */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <Calendar className="h-4 w-4 text-muted-foreground hidden sm:block" />
                            <span className="text-sm text-muted-foreground">Rentang Tanggal:</span>
                            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }} className="h-10 px-3 rounded-lg bg-muted border-none text-sm" />
                            <span className="text-sm">s/d</span>
                            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }} className="h-10 px-3 rounded-lg bg-muted border-none text-sm" />
                            {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-primary hover:underline">Reset</button>}
                            <div className="flex gap-2 ml-auto">
                                <ExportMenu data={allData} filename="siaran_pers" title="Data Siaran Pers" />
                                <Button variant="outline" onClick={() => setShowImport(true)}><Upload className="h-4 w-4" />Import</Button>
                                <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="h-4 w-4" />Tambah</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="py-3 flex items-center justify-between">
                        <span className="text-sm font-medium">{selectedIds.length} item dipilih</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleCopySelected}><Copy className="h-4 w-4" />Copy</Button>
                            <Button variant="outline" size="sm" onClick={handleExportSelected}><Download className="h-4 w-4" />Export</Button>
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete}><Trash2 className="h-4 w-4" />Hapus Pilihan</Button>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>Batal</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Data Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Daftar Siaran Pers ({totalCount})</CardTitle>
                    <div className="flex items-center gap-3">
                        <UserPreferences
                            columns={TABLE_COLUMNS}
                            onColumnChange={(cols) => {
                                setVisibleColumns(cols)
                                localStorage.setItem('pressVisibleColumns', JSON.stringify(cols))
                            }}
                        />
                        <div className="text-sm text-muted-foreground">Hal. {currentPage}/{totalPages || 1}</div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]"><button onClick={toggleSelectAll}>{selectedIds.length === pressReleases.length && pressReleases.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}</button></TableHead>
                                {visibleColumns.includes("NO") && <TableHead className="w-[60px] cursor-pointer" onClick={() => handleSort("NO")}><div className="flex items-center">No {getSortIcon("NO")}</div></TableHead>}
                                {visibleColumns.includes("TANGGAL TERBIT") && <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("TANGGAL TERBIT")}><div className="flex items-center">Tanggal {getSortIcon("TANGGAL TERBIT")}</div></TableHead>}
                                {visibleColumns.includes("NOMOR SIARAN PERS") && <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort("NOMOR SIARAN PERS")}><div className="flex items-center">Nomor SP {getSortIcon("NOMOR SIARAN PERS")}</div></TableHead>}
                                {visibleColumns.includes("JUDUL SIARAN PERS") && <TableHead className="cursor-pointer" onClick={() => handleSort("JUDUL SIARAN PERS")}><div className="flex items-center">Judul {getSortIcon("JUDUL SIARAN PERS")}</div></TableHead>}
                                {visibleColumns.includes("JENIS RILIS") && <TableHead>Jenis</TableHead>}
                                {visibleColumns.includes("KETEGORI") && <TableHead>Kategori</TableHead>}
                                {visibleColumns.includes("WRITER CORCOMM") && <TableHead>Writer</TableHead>}
                                {visibleColumns.includes("LINGKUP") && <TableHead>Lingkup</TableHead>}
                                {visibleColumns.includes("LINK") && <TableHead className="w-[100px]">Aksi</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pressReleases.map((pr, index) => (
                                <TableRow key={pr.id || index} className={selectedIds.includes(pr.id) ? "bg-primary/5" : ""}>
                                    <TableCell><button onClick={() => toggleSelect(pr.id)}>{selectedIds.includes(pr.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}</button></TableCell>
                                    {visibleColumns.includes("NO") && <TableCell className="font-medium">{pr["NO"] || "-"}</TableCell>}
                                    {visibleColumns.includes("TANGGAL TERBIT") && <TableCell className="text-sm">{pr["TANGGAL TERBIT"] || "-"}</TableCell>}
                                    {visibleColumns.includes("NOMOR SIARAN PERS") && <TableCell className="text-sm font-mono text-muted-foreground">{pr["NOMOR SIARAN PERS"] || "-"}</TableCell>}
                                    {visibleColumns.includes("JUDUL SIARAN PERS") && <TableCell className="max-w-[300px]"><span className="line-clamp-2">{pr["JUDUL SIARAN PERS"] || "-"}</span></TableCell>}
                                    {visibleColumns.includes("JENIS RILIS") && <TableCell><span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">{pr["JENIS RILIS"] || "-"}</span></TableCell>}
                                    {visibleColumns.includes("KETEGORI") && <TableCell className="text-sm">{pr["KETEGORI"] || "-"}</TableCell>}
                                    {visibleColumns.includes("WRITER CORCOMM") && <TableCell className="text-sm">{pr["WRITER CORCOMM"] || "-"}</TableCell>}
                                    {visibleColumns.includes("LINGKUP") && <TableCell className="text-sm text-muted-foreground">{pr["LINGKUP"] || "-"}</TableCell>}
                                    {visibleColumns.includes("LINK") && (
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {pr["LINK WEBSITE"] && <a href={pr["LINK WEBSITE"]} target="_blank" rel="noopener noreferrer" className="p-1.5 text-primary hover:bg-primary/10 rounded"><ExternalLink className="h-4 w-4" /></a>}
                                                <button onClick={() => handleEdit(pr)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"><Pencil className="h-4 w-4" /></button>
                                                <button onClick={() => handleDelete(pr.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {pressReleases.length === 0 && <div className="text-center py-10 text-muted-foreground">Tidak ada data.</div>}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="text-sm text-muted-foreground">{((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount)} dari {totalCount}</div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                {[...Array(Math.min(5, totalPages))].map((_, i) => { let pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i; return <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pageNum)}>{pageNum}</Button> })}
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
