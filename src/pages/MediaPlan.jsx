import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"
import { DatePicker } from "@/components/ui/DatePicker"
import { ExportMenu } from "@/components/ui/ExportMenu"
import {
    getMediaPlans,
    createMediaPlan,
    updateMediaPlan,
    deleteMediaPlan,
    bulkCreateMediaPlans,
    bulkUpdateMediaPlans
} from "@/lib/supabase"
import {
    Search, Plus, X, Pencil, Trash2, Filter, ArrowUpDown, ArrowUp, ArrowDown,
    ChevronLeft, ChevronRight, Upload, CheckSquare, Square, Calendar, RefreshCw,
    Download, Image, Eye, FileText, FileSpreadsheet, File
} from "lucide-react"
import Tesseract from 'tesseract.js'
import * as XLSX from 'xlsx'

const PAGE_SIZE = 15

const BULAN_OPTIONS = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
]

const JENIS_MEDIA_PLAN_OPTIONS = ["TOP ONE", "MEDIA PLAN BIASA", "CORPORATE ACTION", "CSR ACTION"]
const BENTUK_MEDIA_OPTIONS = ["MEDIA SOSIAL", "MEDIA CETAK", "MEDIA ONLINE"]
const STATUS_OPTIONS = ["Planned", "In Progress", "Published", "Cancelled"]

const INITIAL_FORM = {
    no: null,
    bulan: "",
    tanggal: null,
    year: 2026,
    scheduled_date: null,
    kategori: "",
    rencana_pemberitaan: "",
    jenis_media_plan: "MEDIA PLAN BIASA",
    bentuk_media: "MEDIA SOSIAL",
    pic: "",
    keterangan: "",
    status: "Planned"
}

// Category colors for calendar
const CATEGORY_COLORS = {
    'HUT PERUSAHAAN BUMN': '#3b82f6',
    'SEMANGAT SENIN': '#10b981',
    'HARI BESAR NASIONAL': '#8b5cf6',
    'INFORMASI PRODUK/MANFAAT': '#f59e0b',
    'SEKILAS': '#06b6d4',
    'BERSERI': '#ec4899',
    'KEGIATAN LAINNYA': '#6b7280',
    'KONTEN DIREKSI': '#ef4444',
    'AUDIENSI/RAPAT': '#14b8a6',
    'default': '#6b7280'
}

export function MediaPlan() {
    const toast = useToast()

    // State variables
    const [allData, setAllData] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [selectedBulan, setSelectedBulan] = useState("")
    const [selectedYear, setSelectedYear] = useState(2026)
    const [selectedPIC, setSelectedPIC] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [showUpload, setShowUpload] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [sortField, setSortField] = useState("scheduled_date")
    const [sortOrder, setSortOrder] = useState("asc")
    const [selectedIds, setSelectedIds] = useState([])
    const [formData, setFormData] = useState(INITIAL_FORM)
    const [submitting, setSubmitting] = useState(false)

    // Upload states
    const [uploadedImage, setUploadedImage] = useState(null)
    const [extractedData, setExtractedData] = useState([])
    const [isExtracting, setIsExtracting] = useState(false)
    const [extractionProgress, setExtractionProgress] = useState(0)
    const [uploadTab, setUploadTab] = useState('csv') // 'csv', 'excel', 'ocr'
    const [importFileName, setImportFileName] = useState('')
    const [isDragging, setIsDragging] = useState(false)

    // Calendar state
    const [calendarDate, setCalendarDate] = useState(new Date(2026, 1, 1)) // February 2026

    // Memoized filter options
    const picOptions = useMemo(() => [...new Set(allData.map(c => c.pic).filter(Boolean))], [allData])
    const kategoriOptions = useMemo(() => [...new Set(allData.map(c => c.kategori).filter(Boolean))], [allData])

    // Fetch data on mount
    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            const { data, error } = await getMediaPlans({ limit: 500 })
            if (error) throw error
            setAllData(data || [])
        } catch (error) {
            toast.error("Gagal memuat data: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    // Memoized filtered and sorted data
    const { paginatedContents, filteredCount, calendarEvents } = useMemo(() => {
        let filtered = [...allData]
        if (selectedBulan) filtered = filtered.filter(c => c.bulan === selectedBulan)
        if (selectedYear) filtered = filtered.filter(c => c.year === parseInt(selectedYear))
        if (selectedPIC) filtered = filtered.filter(c => c.pic === selectedPIC)
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(c =>
                c.rencana_pemberitaan?.toLowerCase().includes(term) ||
                c.kategori?.toLowerCase().includes(term) ||
                c.pic?.toLowerCase().includes(term)
            )
        }

        // Sort
        const sorted = [...filtered].sort((a, b) => {
            let aVal, bVal
            if (sortField === "scheduled_date" || sortField === "tanggal") {
                aVal = a.tanggal || 0
                bVal = b.tanggal || 0
            } else if (sortField === "no") {
                aVal = parseInt(a.no) || 0
                bVal = parseInt(b.no) || 0
            } else {
                aVal = String(a[sortField] || "").toLowerCase()
                bVal = String(b[sortField] || "").toLowerCase()
            }
            if (aVal === bVal) return 0
            if (sortOrder === 'asc') return aVal > bVal ? 1 : -1
            return aVal < bVal ? 1 : -1
        })

        const startIndex = (currentPage - 1) * PAGE_SIZE
        return {
            paginatedContents: sorted.slice(startIndex, startIndex + PAGE_SIZE),
            filteredCount: sorted.length,
            calendarEvents: sorted
        }
    }, [allData, sortField, sortOrder, selectedBulan, selectedYear, selectedPIC, searchTerm, currentPage])

    const contents = paginatedContents
    const totalCount = filteredCount
    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    function handleSort(field) {
        if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        else { setSortField(field); setSortOrder('asc') }
        setCurrentPage(1)
    }

    function getSortIcon(field) {
        if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1" />
        return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
    }

    function toggleSelectAll() {
        // Only toggle IDs on the current page
        const currentPageIds = paginatedContents.map(c => c.id)
        const allCurrentSelected = currentPageIds.every(id => selectedIds.includes(id))

        if (allCurrentSelected) {
            // Unselect only current page items
            setSelectedIds(selectedIds.filter(id => !currentPageIds.includes(id)))
        } else {
            // Select all current page items, adding to existing selection
            const uniqueIds = new Set([...selectedIds, ...currentPageIds])
            setSelectedIds(Array.from(uniqueIds))
        }
    }

    function toggleSelect(id) {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id))
        else setSelectedIds([...selectedIds, id])
    }

    async function handleBulkDelete() {
        if (selectedIds.length === 0) return
        toast.confirm(`Hapus ${selectedIds.length} item yang dipilih?`, async () => {
            try {
                for (const id of selectedIds) {
                    await deleteMediaPlan(id)
                }
                toast.success(`${selectedIds.length} item berhasil dihapus!`)
                setSelectedIds([])
                await fetchData()
            } catch (error) {
                toast.error("Gagal menghapus: " + error.message)
            }
        })
    }

    async function handleBulkStatusUpdate(newStatus) {
        if (selectedIds.length === 0) return

        try {
            const { error } = await bulkUpdateMediaPlans(selectedIds, { status: newStatus })
            if (error) throw error

            toast.success(`Status updated to ${newStatus}`)
            setSelectedIds([])
            await fetchData()
        } catch (error) {
            toast.error("Gagal update status: " + error.message)
        }
    }

    function resetForm() {
        setFormData(INITIAL_FORM)
        setEditingId(null)
    }

    function handleEdit(item) {
        setEditingId(item.id)
        setFormData({
            no: item.no || null,
            bulan: item.bulan || "",
            tanggal: item.tanggal || null,
            year: item.year || 2026,
            scheduled_date: item.scheduled_date || null,
            kategori: item.kategori || "",
            rencana_pemberitaan: item.rencana_pemberitaan || "",
            jenis_media_plan: item.jenis_media_plan || "MEDIA PLAN BIASA",
            bentuk_media: item.bentuk_media || "MEDIA SOSIAL",
            pic: item.pic || "",
            keterangan: item.keterangan || "",
            status: item.status || "Planned"
        })
        setShowForm(true)
    }

    async function handleDelete(id) {
        toast.confirm("Apakah Anda yakin ingin menghapus item ini?", async () => {
            try {
                const { error } = await deleteMediaPlan(id)
                if (error) throw error
                toast.success("Item berhasil dihapus!")
                await fetchData()
            } catch (error) {
                toast.error("Gagal menghapus: " + error.message)
            }
        })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        try {
            // Build scheduled_date from bulan, tanggal, and year
            const monthIndex = BULAN_OPTIONS.indexOf(formData.bulan)
            let scheduledDate = null
            if (monthIndex !== -1 && formData.tanggal && formData.year) {
                // Create date string manually to avoid timezone shifts (toISOString uses UTC)
                const month = String(monthIndex + 1).padStart(2, '0')
                const day = String(formData.tanggal).padStart(2, '0')
                scheduledDate = `${formData.year}-${month}-${day}`
            }

            const dataToSave = { ...formData, scheduled_date: scheduledDate }

            if (editingId) {
                const { error } = await updateMediaPlan(editingId, dataToSave)
                if (error) throw error
                toast.success("Data berhasil diperbarui!")
            } else {
                const { error } = await createMediaPlan(dataToSave)
                if (error) throw error
                toast.success("Data berhasil ditambahkan!")
            }
            await fetchData()
            resetForm()
            setShowForm(false)
        } catch (error) {
            toast.error("Gagal menyimpan: " + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    // OCR Image Upload Handler
    async function handleImageUpload(e) {
        const file = e.target.files?.[0]
        if (!file) return

        setImportFileName(file.name)

        // Preview image
        const reader = new FileReader()
        reader.onload = (event) => {
            setUploadedImage(event.target?.result)
        }
        reader.readAsDataURL(file)

        // Start OCR extraction
        setIsExtracting(true)
        setExtractionProgress(0)

        try {
            const result = await Tesseract.recognize(file, 'ind+eng', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setExtractionProgress(Math.round(m.progress * 100))
                    }
                }
            })

            // Parse OCR text into structured data
            const parsedData = parseOCRText(result.data.text)
            setExtractedData(parsedData)
            if (parsedData.length > 0) {
                toast.success(`Berhasil mengekstrak ${parsedData.length} baris data!`)
            } else {
                toast.warning("Tidak dapat mengekstrak data. Coba gunakan import CSV/Excel sebagai alternatif.")
            }
        } catch (error) {
            toast.error("Gagal mengekstrak teks: " + error.message)
        } finally {
            setIsExtracting(false)
        }
    }

    // Drag and Drop Handlers
    function handleDragOver(e) {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    function handleDragLeave(e) {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    function handleDrop(e, handler) {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const files = e.dataTransfer?.files
        if (files && files.length > 0) {
            // Create a fake event object that mimics file input change event
            const fakeEvent = { target: { files: files } }
            handler(fakeEvent)
        }
    }

    // CSV Import Handler
    function handleCSVUpload(e) {
        const file = e.target.files?.[0]
        if (!file) return

        setImportFileName(file.name)
        setIsExtracting(true)

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const text = event.target?.result
                const lines = text.split('\n')
                const headers = lines[0].split(/[,;]/).map(h => h.trim().replace(/^"|"$/g, '').toUpperCase())

                const data = []
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue

                    // Handle CSV with semicolon or comma separator
                    const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/^"|"$/g, ''))
                    const row = {}
                    headers.forEach((h, idx) => { row[h] = values[idx] || '' })

                    const mappedRow = mapRowToMediaPlan(row)
                    if (mappedRow) data.push(mappedRow)
                }

                setExtractedData(data)
                if (data.length > 0) {
                    toast.success(`Berhasil memuat ${data.length} baris dari CSV!`)
                } else {
                    toast.error("Tidak ada data valid ditemukan dalam file CSV")
                }
            } catch (error) {
                toast.error("Gagal membaca CSV: " + error.message)
            } finally {
                setIsExtracting(false)
            }
        }
        reader.readAsText(file)
    }

    // Excel Import Handler
    function handleExcelUpload(e) {
        const file = e.target.files?.[0]
        if (!file) return

        setImportFileName(file.name)
        setIsExtracting(true)

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result)
                const workbook = XLSX.read(data, { type: 'array' })

                // Get first sheet
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]

                // Convert to JSON with header
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

                if (jsonData.length < 2) {
                    toast.error("File Excel kosong atau tidak memiliki data")
                    setIsExtracting(false)
                    return
                }

                // First row as headers
                const headers = jsonData[0].map(h => String(h || '').trim().toUpperCase())
                console.log('Excel Headers Detected:', headers) // Debug: log headers
                const parsedData = []

                for (let i = 1; i < jsonData.length; i++) {
                    const rowArray = jsonData[i]
                    if (!rowArray || rowArray.length === 0) continue

                    const row = {}
                    headers.forEach((h, idx) => { row[h] = rowArray[idx] || '' })

                    const mappedRow = mapRowToMediaPlan(row)
                    if (mappedRow) parsedData.push(mappedRow)
                }

                setExtractedData(parsedData)
                if (parsedData.length > 0) {
                    toast.success(`Berhasil memuat ${parsedData.length} baris dari Excel!`)
                } else {
                    toast.error("Tidak ada data valid ditemukan dalam file Excel")
                }
            } catch (error) {
                toast.error("Gagal membaca Excel: " + error.message)
            } finally {
                setIsExtracting(false)
            }
        }
        reader.readAsArrayBuffer(file)
    }

    // Map CSV/Excel row to media plan structure
    function mapRowToMediaPlan(row) {
        // Helper function to find value by partial column name match
        function findValue(row, ...searchTerms) {
            for (const key of Object.keys(row)) {
                const normalizedKey = key.trim().toUpperCase()
                for (const term of searchTerms) {
                    if (normalizedKey === term ||
                        normalizedKey.includes(term) ||
                        normalizedKey.startsWith(term) ||
                        normalizedKey.replace(/\s+/g, '').includes(term.replace(/\s+/g, ''))) {
                        return row[key]
                    }
                }
            }
            return ''
        }

        // Try to find values with flexible matching
        const no = findValue(row, 'NO', 'NOMOR', '#')
        const bulan = findValue(row, 'BULAN')
        const tanggal = findValue(row, 'TANGGAL', 'TGL', 'TGAL')
        const kategori = findValue(row, 'KATEGORI')
        const rencanaPemberitaan = findValue(row, 'RENCANA PEMBERITAAN', 'RENCANAPEMBERITAAN', 'RENCANA', 'PEMBERITAAN', 'JUDUL', 'KONTEN', 'ISI', 'DESKRIPSI')
        const jenisMediaPlan = findValue(row, 'JENIS MEDIA PLAN', 'JENISMEDIAPLAN', 'JENIS', 'MEDIA PLAN')
        const bentukMedia = findValue(row, 'BENTUK MEDIA', 'BENTUKMEDIA', 'BENTUK', 'MEDIA')
        const pic = findValue(row, 'PIC', 'CREATOR', 'PENANGGUNG JAWAB')
        const keterangan = findValue(row, 'KETERANGAN', 'CATATAN', 'NOTES', 'NOTE')

        // Skip rows without main content
        if (!rencanaPemberitaan && !kategori) return null

        // Normalize string values
        const normalizeString = (val) => val ? String(val).trim() : ''

        return {
            no: no ? parseInt(no) : null,
            bulan: normalizeString(bulan).toUpperCase(),
            tanggal: tanggal ? parseInt(tanggal) : null,
            year: 2026,
            kategori: normalizeString(kategori),
            rencana_pemberitaan: normalizeString(rencanaPemberitaan).substring(0, 500),
            jenis_media_plan: normalizeString(jenisMediaPlan).includes('TOP') ? 'TOP ONE' :
                normalizeString(jenisMediaPlan).includes('CORPORATE') ? 'CORPORATE ACTION' :
                    normalizeString(jenisMediaPlan).includes('CSR') ? 'CSR ACTION' : 'MEDIA PLAN BIASA',
            bentuk_media: normalizeString(bentukMedia).includes('CETAK') ? 'MEDIA CETAK' :
                normalizeString(bentukMedia).includes('ONLINE') ? 'MEDIA ONLINE' : 'MEDIA SOSIAL',
            pic: normalizeString(pic),
            keterangan: normalizeString(keterangan),
            status: 'Planned'
        }
    }

    // Parse OCR text into media plan structure
    function parseOCRText(text) {
        const lines = text.split('\n').filter(line => line.trim())
        const parsed = []
        let currentNo = 1

        for (const line of lines) {
            // Skip header lines
            if (line.includes('MEDIA PLAN') || line.includes('BIDANG KOMUNIKASI') ||
                line.includes('PT ASABRI') || line.includes('BULAN') ||
                line.includes('TANGGAL') || line.includes('KATEGORI') ||
                line.includes('Mengetahui') || line.includes('Menyetujui') ||
                line.includes('Sekretaris') || line.includes('Kabid') ||
                line.includes('Penyusun') || line.includes('Staf')) {
                continue
            }

            // Try to parse data rows - look for patterns with numbers at start
            const match = line.match(/^(\d+)\s+(\w+)\s+(\d+)\s+(.+)/)
            if (match) {
                const [, no, bulan, tanggal, rest] = match

                // Try to extract other fields from rest of the line
                let kategori = ""
                let rencanaPemberitaan = rest
                let pic = ""

                // Common patterns
                if (rest.includes('HUT')) kategori = 'HUT PERUSAHAAN BUMN'
                else if (rest.includes('SEMANGAT')) kategori = 'SEMANGAT SENIN'
                else if (rest.includes('HARI BESAR') || rest.includes('NASIONAL')) kategori = 'HARI BESAR NASIONAL'
                else if (rest.includes('INFORMASI') || rest.includes('PRODUK')) kategori = 'INFORMASI PRODUK/MANFAAT'
                else if (rest.includes('SEKILAS')) kategori = 'SEKILAS'
                else if (rest.includes('BERSERI')) kategori = 'BERSERI'
                else if (rest.includes('DIREKSI')) kategori = 'KONTEN DIREKSI'
                else if (rest.includes('AUDIENSI') || rest.includes('RAPAT')) kategori = 'AUDIENSI/RAPAT'
                else kategori = 'KEGIATAN LAINNYA'

                // Extract PIC if present (usually names in CAPS at end)
                const picMatch = rest.match(/\b([A-Z]{3,})\s*$/)
                if (picMatch) {
                    pic = picMatch[1]
                    rencanaPemberitaan = rest.replace(picMatch[0], '').trim()
                }

                parsed.push({
                    no: parseInt(no),
                    bulan: bulan.toUpperCase(),
                    tanggal: parseInt(tanggal),
                    year: 2026,
                    kategori,
                    rencana_pemberitaan: rencanaPemberitaan.substring(0, 200),
                    jenis_media_plan: "MEDIA PLAN BIASA",
                    bentuk_media: "MEDIA SOSIAL",
                    pic,
                    keterangan: "",
                    status: "Planned"
                })
            } else {
                // Try simpler pattern - just look for numbers followed by text
                const simpleMatch = line.match(/^(\d+)\s+(.+)/)
                if (simpleMatch && simpleMatch[2].length > 10) {
                    parsed.push({
                        no: currentNo++,
                        bulan: selectedBulan || "FEBRUARI",
                        tanggal: null,
                        year: 2026,
                        kategori: "KEGIATAN LAINNYA",
                        rencana_pemberitaan: simpleMatch[2].substring(0, 200),
                        jenis_media_plan: "MEDIA PLAN BIASA",
                        bentuk_media: "MEDIA SOSIAL",
                        pic: "",
                        keterangan: "",
                        status: "Planned"
                    })
                }
            }
        }

        return parsed
    }

    // Save extracted data to database
    async function handleSaveExtractedData() {
        if (extractedData.length === 0) {
            toast.error("Tidak ada data untuk disimpan")
            return
        }

        setSubmitting(true)
        try {
            // Add scheduled_date for each item
            const dataToSave = extractedData.map(item => {
                const monthIndex = BULAN_OPTIONS.indexOf(item.bulan)
                let scheduledDate = null
                if (monthIndex !== -1 && item.tanggal && item.year) {
                    const month = String(monthIndex + 1).padStart(2, '0')
                    const day = String(item.tanggal).padStart(2, '0')
                    scheduledDate = `${item.year}-${month}-${day}`
                }
                return { ...item, scheduled_date: scheduledDate }
            })

            const { error } = await bulkCreateMediaPlans(dataToSave)
            if (error) throw error

            toast.success(`${dataToSave.length} data berhasil disimpan!`)
            setShowUpload(false)
            setUploadedImage(null)
            setExtractedData([])
            await fetchData()
        } catch (error) {
            toast.error("Gagal menyimpan: " + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    // Calendar functions
    function getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    function getFirstDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    function getEventsForDay(day) {
        const month = calendarDate.getMonth()
        const year = calendarDate.getFullYear()
        return calendarEvents.filter(event => {
            // Prioritize bulan/tanggal/year which are explicitly set by user
            if (event.bulan && event.tanggal && event.year) {
                const monthIndex = BULAN_OPTIONS.indexOf(event.bulan)
                return monthIndex === month && event.tanggal === day && event.year === year
            }

            // Fallback to scheduled_date
            if (event.scheduled_date) {
                const eventDate = new Date(event.scheduled_date)
                return eventDate.getDate() === day &&
                    eventDate.getMonth() === month &&
                    eventDate.getFullYear() === year
            }

            return false
        })
    }

    function getCategoryColor(kategori) {
        return CATEGORY_COLORS[kategori] || CATEGORY_COLORS['default']
    }

    function prevMonth() {
        setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))
    }

    function nextMonth() {
        setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Memuat data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Import Media Plan
                            </CardTitle>
                            <button onClick={() => { setShowUpload(false); setUploadedImage(null); setExtractedData([]); setImportFileName(''); }}>
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Tab Navigation */}
                                <div className="flex border-b border-border">
                                    <button
                                        onClick={() => { setUploadTab('csv'); setExtractedData([]); setImportFileName(''); }}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${uploadTab === 'csv'
                                            ? 'text-primary border-b-2 border-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <File className="h-4 w-4" />
                                        CSV
                                    </button>
                                    <button
                                        onClick={() => { setUploadTab('excel'); setExtractedData([]); setImportFileName(''); }}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${uploadTab === 'excel'
                                            ? 'text-primary border-b-2 border-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <FileSpreadsheet className="h-4 w-4" />
                                        Excel
                                    </button>
                                    <button
                                        onClick={() => { setUploadTab('ocr'); setExtractedData([]); setUploadedImage(null); setImportFileName(''); }}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${uploadTab === 'ocr'
                                            ? 'text-primary border-b-2 border-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <Image className="h-4 w-4" />
                                        OCR (Gambar)
                                    </button>
                                </div>

                                {/* CSV Upload */}
                                {uploadTab === 'csv' && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-muted/50 rounded-lg text-sm">
                                            <p className="font-medium mb-2">Format CSV yang didukung:</p>
                                            <p className="text-muted-foreground">
                                                Kolom: NO, BULAN, TANGGAL, KATEGORI, RENCANA PEMBERITAAN, JENIS MEDIA PLAN, BENTUK MEDIA, PIC, KETERANGAN
                                            </p>
                                        </div>
                                        <div
                                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border'
                                                }`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, handleCSVUpload)}
                                        >
                                            <input
                                                type="file"
                                                accept=".csv,.txt"
                                                onChange={handleCSVUpload}
                                                className="hidden"
                                                id="csv-upload"
                                            />
                                            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-4">
                                                <File className={`h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                                                <div>
                                                    <p className="font-medium">{isDragging ? 'Lepas file disini...' : 'Klik atau drag file CSV'}</p>
                                                    <p className="text-sm text-muted-foreground">Format: .csv atau .txt dengan separator koma/titik-koma</p>
                                                </div>
                                            </label>
                                        </div>
                                        {importFileName && (
                                            <p className="text-sm text-muted-foreground">File: {importFileName}</p>
                                        )}
                                    </div>
                                )}

                                {/* Excel Upload */}
                                {uploadTab === 'excel' && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-muted/50 rounded-lg text-sm">
                                            <p className="font-medium mb-2">Format Excel yang didukung:</p>
                                            <p className="text-muted-foreground">
                                                Sheet pertama akan digunakan. Header di baris pertama dengan kolom: NO, BULAN, TANGGAL, KATEGORI, RENCANA PEMBERITAAN, dll.
                                            </p>
                                        </div>
                                        <div
                                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border'
                                                }`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, handleExcelUpload)}
                                        >
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls"
                                                onChange={handleExcelUpload}
                                                className="hidden"
                                                id="excel-upload"
                                            />
                                            <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center gap-4">
                                                <FileSpreadsheet className={`h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                                                <div>
                                                    <p className="font-medium">{isDragging ? 'Lepas file disini...' : 'Klik atau drag file Excel'}</p>
                                                    <p className="text-sm text-muted-foreground">Format: .xlsx atau .xls</p>
                                                </div>
                                            </label>
                                        </div>
                                        {importFileName && (
                                            <p className="text-sm text-muted-foreground">File: {importFileName}</p>
                                        )}
                                    </div>
                                )}

                                {/* OCR Upload */}
                                {uploadTab === 'ocr' && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
                                            <p className="font-medium text-amber-600 mb-2">⚠️ OCR memiliki keterbatasan</p>
                                            <p className="text-muted-foreground">
                                                Ekstraksi dari gambar mungkin tidak sempurna untuk tabel kompleks. Disarankan menggunakan import CSV/Excel untuk hasil yang lebih akurat.
                                            </p>
                                        </div>
                                        <div
                                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border'
                                                }`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, handleImageUpload)}
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                id="ocr-upload"
                                            />
                                            <label htmlFor="ocr-upload" className="cursor-pointer flex flex-col items-center gap-4">
                                                <Image className={`h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                                                <div>
                                                    <p className="font-medium">{isDragging ? 'Lepas gambar disini...' : 'Klik atau drag gambar'}</p>
                                                    <p className="text-sm text-muted-foreground">Format: JPG, PNG</p>
                                                </div>
                                            </label>
                                        </div>
                                        {importFileName && (
                                            <p className="text-sm text-muted-foreground">File: {importFileName}</p>
                                        )}
                                    </div>
                                )}

                                {/* Loading State */}
                                {isExtracting && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>{uploadTab === 'ocr' ? 'Mengekstrak teks dari gambar...' : 'Memproses file...'}</span>
                                            {uploadTab === 'ocr' && <span>{extractionProgress}%</span>}
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="bg-primary rounded-full h-2 transition-all"
                                                style={{ width: uploadTab === 'ocr' ? `${extractionProgress}%` : '100%' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Image Preview (for OCR) */}
                                {uploadTab === 'ocr' && uploadedImage && (
                                    <div className="border rounded-lg overflow-hidden">
                                        <img
                                            src={uploadedImage}
                                            alt="Media Plan Preview"
                                            className="w-full max-h-[200px] object-contain bg-muted"
                                        />
                                    </div>
                                )}

                                {/* Extracted Data Preview */}
                                {extractedData.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="font-medium flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Data yang akan diimport ({extractedData.length} item)
                                        </h3>
                                        <div className="max-h-[300px] overflow-auto border rounded-lg">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[50px]">No</TableHead>
                                                        <TableHead className="w-[80px]">Tanggal</TableHead>
                                                        <TableHead>Kategori</TableHead>
                                                        <TableHead>Rencana Pemberitaan</TableHead>
                                                        <TableHead>PIC</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {extractedData.map((item, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{item.no || index + 1}</TableCell>
                                                            <TableCell>{item.tanggal || "-"}</TableCell>
                                                            <TableCell>
                                                                <span
                                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs text-white"
                                                                    style={{ backgroundColor: getCategoryColor(item.kategori) }}
                                                                >
                                                                    {item.kategori || '-'}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="max-w-[300px]">
                                                                <span className="line-clamp-2">{item.rencana_pemberitaan}</span>
                                                            </TableCell>
                                                            <TableCell>{item.pic || "-"}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => { setExtractedData([]); setImportFileName(''); setUploadedImage(null); }}
                                                className="flex-1"
                                            >
                                                Reset
                                            </Button>
                                            <Button
                                                onClick={handleSaveExtractedData}
                                                disabled={submitting}
                                                className="flex-1"
                                            >
                                                {submitting ? "Menyimpan..." : `Import ${extractedData.length} Data`}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-3xl mx-4 max-h-[90vh] overflow-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{editingId ? "Edit Media Plan" : "Tambah Media Plan Baru"}</CardTitle>
                            <button onClick={() => { setShowForm(false); resetForm(); }}>
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Rencana Pemberitaan *</label>
                                    <textarea
                                        required
                                        value={formData.rencana_pemberitaan}
                                        onChange={(e) => setFormData({ ...formData, rencana_pemberitaan: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                                        rows={3}
                                        placeholder="Contoh: HUT PT BANK SYARIAH INDONESIA"
                                    />
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">No</label>
                                        <input
                                            type="number"
                                            value={formData.no || ""}
                                            onChange={(e) => setFormData({ ...formData, no: e.target.value ? parseInt(e.target.value) : null })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Bulan</label>
                                        <select
                                            value={formData.bulan}
                                            onChange={(e) => setFormData({ ...formData, bulan: e.target.value })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                        >
                                            <option value="">Pilih Bulan</option>
                                            {BULAN_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Tanggal</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={31}
                                            value={formData.tanggal || ""}
                                            onChange={(e) => setFormData({ ...formData, tanggal: e.target.value ? parseInt(e.target.value) : null })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Tahun</label>
                                        <select
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                        >
                                            <option value={2025}>2025</option>
                                            <option value={2026}>2026</option>
                                            <option value={2027}>2027</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Kategori</label>
                                        <select
                                            value={formData.kategori}
                                            onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                        >
                                            <option value="">Pilih Kategori</option>
                                            <option value="HUT PERUSAHAAN BUMN">HUT PERUSAHAAN BUMN</option>
                                            <option value="SEMANGAT SENIN">SEMANGAT SENIN</option>
                                            <option value="HARI BESAR NASIONAL">HARI BESAR NASIONAL</option>
                                            <option value="INFORMASI PRODUK/MANFAAT">INFORMASI PRODUK/MANFAAT</option>
                                            <option value="SEKILAS">SEKILAS</option>
                                            <option value="BERSERI">BERSERI</option>
                                            <option value="KEGIATAN LAINNYA">KEGIATAN LAINNYA</option>
                                            <option value="KONTEN DIREKSI">KONTEN DIREKSI</option>
                                            <option value="AUDIENSI/RAPAT">AUDIENSI/RAPAT</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">PIC</label>
                                        <input
                                            type="text"
                                            value={formData.pic}
                                            onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                            placeholder="Nama PIC"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Jenis Media Plan</label>
                                        <select
                                            value={formData.jenis_media_plan}
                                            onChange={(e) => setFormData({ ...formData, jenis_media_plan: e.target.value })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                        >
                                            {JENIS_MEDIA_PLAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Bentuk Media</label>
                                        <select
                                            value={formData.bentuk_media}
                                            onChange={(e) => setFormData({ ...formData, bentuk_media: e.target.value })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                        >
                                            {BENTUK_MEDIA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                        >
                                            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Keterangan</label>
                                        <input
                                            type="text"
                                            value={formData.keterangan}
                                            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                            placeholder="Catatan tambahan..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1">
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={submitting} className="flex-1">
                                        {submitting ? "Menyimpan..." : (editingId ? "Update" : "Simpan")}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{allData.length}</div>
                        <p className="text-xs text-muted-foreground">Total Media Plan</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">
                            {allData.filter(c => c.status === 'Planned').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Planned</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-amber-600">
                            {allData.filter(c => c.status === 'In Progress').length}
                        </div>
                        <p className="text-xs text-muted-foreground">In Progress</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                            {allData.filter(c => c.status === 'Published').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Published</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cari rencana pemberitaan, kategori, PIC..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted border-none text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <select
                                value={selectedBulan}
                                onChange={(e) => { setSelectedBulan(e.target.value); setCurrentPage(1); }}
                                className="h-10 px-3 rounded-lg bg-muted border-none text-sm"
                            >
                                <option value="">Semua Bulan</option>
                                {BULAN_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
                                className="h-10 px-3 rounded-lg bg-muted border-none text-sm"
                            >
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                                <option value={2027}>2027</option>
                            </select>
                            <select
                                value={selectedPIC}
                                onChange={(e) => { setSelectedPIC(e.target.value); setCurrentPage(1); }}
                                className="h-10 px-3 rounded-lg bg-muted border-none text-sm"
                            >
                                <option value="">Semua PIC</option>
                                {picOptions.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={fetchData}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            <ExportMenu data={allData} filename="media_plan" title="Media Plan" />
                            <Button variant="outline" onClick={() => setShowUpload(true)}>
                                <Upload className="h-4 w-4" />
                                Import
                            </Button>
                            <Button onClick={() => { resetForm(); setShowForm(true); }}>
                                <Plus className="h-4 w-4" />
                                Tambah
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="py-3 flex items-center justify-between">
                        <span className="text-sm font-medium">{selectedIds.length} item dipilih</span>
                        <div className="flex gap-2 items-center">
                            <select
                                className="h-8 text-sm rounded-md border-input bg-background px-3"
                                onChange={(e) => {
                                    if (e.target.value) handleBulkStatusUpdate(e.target.value)
                                }}
                                defaultValue=""
                            >
                                <option value="" disabled>Ubah Status...</option>
                                {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <div className="h-4 w-px bg-border mx-2"></div>
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus Pilihan
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                                Batal
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Data Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Daftar Media Plan ({totalCount})</CardTitle>
                    <div className="text-sm text-muted-foreground">Hal. {currentPage}/{totalPages || 1}</div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]">
                                    <button onClick={toggleSelectAll}>
                                        {contents.length > 0 && contents.every(c => selectedIds.includes(c.id)) ?
                                            <CheckSquare className="h-4 w-4 text-primary" /> :
                                            <Square className="h-4 w-4" />
                                        }
                                    </button>
                                </TableHead>
                                <TableHead className="w-[50px] cursor-pointer" onClick={() => handleSort("no")}>
                                    <div className="flex items-center">No {getSortIcon("no")}</div>
                                </TableHead>
                                <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort("tanggal")}>
                                    <div className="flex items-center">Tanggal {getSortIcon("tanggal")}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort("kategori")}>
                                    <div className="flex items-center">Kategori {getSortIcon("kategori")}</div>
                                </TableHead>
                                <TableHead>Rencana Pemberitaan</TableHead>
                                <TableHead>Jenis</TableHead>
                                <TableHead>Bentuk Media</TableHead>
                                <TableHead>PIC</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead className="w-[100px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contents.map((item, index) => (
                                <TableRow key={item.id} className={selectedIds.includes(item.id) ? "bg-primary/5" : ""}>
                                    <TableCell>
                                        <button onClick={() => toggleSelect(item.id)}>
                                            {selectedIds.includes(item.id) ?
                                                <CheckSquare className="h-4 w-4 text-primary" /> :
                                                <Square className="h-4 w-4" />
                                            }
                                        </button>
                                    </TableCell>
                                    <TableCell className="font-medium text-muted-foreground">
                                        {item.no || (currentPage - 1) * PAGE_SIZE + index + 1}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {item.tanggal ? `${item.tanggal} ${item.bulan?.substring(0, 3)}` : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs text-white"
                                            style={{ backgroundColor: getCategoryColor(item.kategori) }}
                                        >
                                            {item.kategori || "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-[250px]">
                                        <span className="line-clamp-2">{item.rencana_pemberitaan || "-"}</span>
                                    </TableCell>
                                    <TableCell className="text-sm">{item.jenis_media_plan || "-"}</TableCell>
                                    <TableCell className="text-sm">{item.bentuk_media || "-"}</TableCell>
                                    <TableCell className="text-sm font-medium">{item.pic || "-"}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${item.status === 'Published' ? 'bg-green-100 text-green-800' :
                                            item.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                                                item.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {item.status || "Planned"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                        <span className="line-clamp-2 text-sm text-muted-foreground">{item.keterangan || "-"}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {contents.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            Tidak ada data. Klik "Upload OCR" untuk upload gambar media plan atau "Tambah" untuk input manual.
                        </div>
                    )}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount)} dari {totalCount}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    let pageNum = totalPages <= 5 ? i + 1 :
                                        currentPage <= 3 ? i + 1 :
                                            currentPage >= totalPages - 2 ? totalPages - 4 + i :
                                                currentPage - 2 + i
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </Button>
                                    )
                                })}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Calendar View */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Kalender Media Plan
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={prevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="font-medium min-w-[150px] text-center">
                                {BULAN_OPTIONS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                            </span>
                            <Button variant="outline" size="sm" onClick={nextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Calendar Legend */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {Object.entries(CATEGORY_COLORS).filter(([key]) => key !== 'default').map(([kategori, color]) => (
                            <div key={kategori} className="flex items-center gap-1 text-xs">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                <span>{kategori}</span>
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {/* Day Headers */}
                        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                                {day}
                            </div>
                        ))}

                        {/* Empty cells for days before first day of month */}
                        {[...Array(getFirstDayOfMonth(calendarDate))].map((_, i) => (
                            <div key={`empty-${i}`} className="min-h-32 max-h-40 bg-muted/30 rounded-lg" />
                        ))}

                        {/* Day cells */}
                        {[...Array(getDaysInMonth(calendarDate))].map((_, i) => {
                            const day = i + 1
                            const events = getEventsForDay(day)
                            const today = new Date()
                            const isToday = day === today.getDate() &&
                                calendarDate.getMonth() === today.getMonth() &&
                                calendarDate.getFullYear() === today.getFullYear()

                            return (
                                <div
                                    key={day}
                                    className={`min-h-32 max-h-40 border rounded-lg p-1 overflow-hidden flex flex-col ${isToday ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className={`text-sm font-medium mb-1 flex-shrink-0 ${isToday ? 'text-primary' : ''}`}>
                                        {day}
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-1 pr-1" style={{ scrollbarWidth: 'thin' }}>
                                        {events.map((event, idx) => (
                                            <div
                                                key={idx}
                                                className="text-xs px-1.5 py-0.5 rounded cursor-pointer font-medium"
                                                style={{
                                                    backgroundColor: getCategoryColor(event.kategori),
                                                    color: '#ffffff',
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                                    padding: '4px',
                                                    marginBottom: '4px',
                                                }}
                                                title={`${event.rencana_pemberitaan}${event.pic ? ` | PIC: ${event.pic}` : ''}`}
                                                onClick={() => handleEdit(event)}
                                            >
                                                <div className="truncate">{event.rencana_pemberitaan?.substring(0, 20)}</div>
                                                {event.pic && <div className="truncate text-white/80 text-[10px]">PIC: {event.pic}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
