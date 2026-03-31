import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"
import { DatePicker } from "@/components/ui/DatePicker"
import { Input } from "@/components/ui/Input"
import {
    getMediaPlans,
    createMediaPlan,
    updateMediaPlan,
    deleteMediaPlan,
    bulkCreateMediaPlans,
    bulkUpdateMediaPlans,
    getOffices // Need to fetch offices for filtering
} from "@/lib/supabase"
import {
    Search, Plus, X, Pencil, Trash2, Filter, ArrowUpDown, ArrowUp, ArrowDown,
    ChevronLeft, ChevronRight, Upload, CheckSquare, Square, Calendar, RefreshCw,
    Download, Image, File, FileSpreadsheet, Building2
} from "lucide-react"
import Tesseract from 'tesseract.js'
import * as XLSX from 'xlsx'
import { ExportMenu } from "@/components/ui/ExportMenu"

const PAGE_SIZE = 15

const BULAN_OPTIONS = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
]

const JENIS_MEDIA_PLAN_OPTIONS = ["TOP ONE", "MEDIA PLAN BIASA", "CORPORATE ACTION", "CSR ACTION"]
const BENTUK_MEDIA_OPTIONS = ["MEDIA SOSIAL", "MEDIA CETAK", "MEDIA ONLINE"]
const STATUS_OPTIONS = ["Planned", "In Progress", "Published", "Cancelled"]
const APPROVAL_OPTIONS = ["Pending", "Approved", "Rejected"]

const INITIAL_FORM = {
    no: null,
    bulan: "",
    tanggal: null,
    year: 2026,
    scheduled_date: null,
    kategori: "",
    judul: "", // Renamed mainly to judul in new schema but keeping code consistent
    rencana_pemberitaan: "", // Using this as 'judul' in UI for now or mapping it
    jenis_media_plan: "MEDIA PLAN BIASA",
    bentuk_media: "MEDIA SOSIAL",
    pic: "",
    keterangan: "",
    status: "Planned",
    approval_status: "Pending",
    aktualisasi: "Belum",
    tanggal_realisasi: null,
    link_realisasi: ""
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
    const { user, isPusat, isCabang, userOfficeId } = useAuth()
    const toast = useToast()

    // State variables
    const [allData, setAllData] = useState([])
    const [offices, setOffices] = useState([]) // For Pusat filtering
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(true)

    // Filters
    const [selectedBulan, setSelectedBulan] = useState("")
    const [selectedYear, setSelectedYear] = useState(2026)
    const [selectedPIC, setSelectedPIC] = useState("") // Fix: Add selectedPIC state
    const [selectedOffice, setSelectedOffice] = useState("all") // Pusat filter
    const [searchTerm, setSearchTerm] = useState("")

    const [showForm, setShowForm] = useState(false)
    const [showUpload, setShowUpload] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [sortField, setSortField] = useState("scheduled_date")
    const [sortOrder, setSortOrder] = useState("asc")
    const [selectedIds, setSelectedIds] = useState([])
    const [formData, setFormData] = useState(INITIAL_FORM)
    const [submitting, setSubmitting] = useState(false)

    // Calendar & Upload states
    const [calendarDate, setCalendarDate] = useState(new Date())
    const [isDragging, setIsDragging] = useState(false)
    const [uploadTab, setUploadTab] = useState('csv')
    const [uploadedImage, setUploadedImage] = useState(null)
    const [extractedData, setExtractedData] = useState([])
    const [importFileName, setImportFileName] = useState('')
    const [isExtracting, setIsExtracting] = useState(false)
    const [extractionProgress, setExtractionProgress] = useState(0)

    // Upload & Extract states omitted for brevity but kept in logic

    // Fetch data on mount
    useEffect(() => {
        if (user) {
            fetchData()
            if (isPusat) fetchOffices()
        }
    }, [user, isPusat])

    async function fetchOffices() {
        try {
            const { data } = await getOffices()
            setOffices(data || [])
        } catch (err) {
            console.error("Failed to fetch offices", err)
        }
    }

    async function fetchData() {
        setLoading(true)
        try {
            // Context-aware fetching handled largely by RLS, but we can pass explicit filters
            const params = { limit: 1000 }

            // If Pusat and selecting specific office
            if (isPusat && selectedOffice !== 'all') {
                params.officeId = selectedOffice
            } else if (isCabang) {
                params.officeId = userOfficeId
            }

            const { data, error } = await getMediaPlans(params)

            if (error) throw error

            // Client-side cleaning/mapping if necessary
            // Map 'judul' to 'rencana_pemberitaan' if needed for legacy UI compatibility
            const mappedData = (data || []).map(item => ({
                ...item,
                rencana_pemberitaan: item.judul || item.rencana_pemberitaan // Fallback to new column 'judul'
            }))

            setAllData(mappedData)
        } catch (error) {
            toast.error("Gagal memuat data: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    // Manual refresh when filter changes (for server-side filtering optimization later)
    useEffect(() => {
        fetchData()
    }, [selectedOffice])

    // Derived state for PIC Options
    const picOptions = useMemo(() => {
        return [...new Set(allData.map(item => item.pic).filter(Boolean))]
    }, [allData])

    // Client-side filtering
    const filteredData = useMemo(() => {
        return allData.filter(item => {
            const matchSearch = (item.rencana_pemberitaan || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.pic || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.kategori || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.no && String(item.no).includes(searchTerm))

            const matchBulan = selectedBulan ? item.bulan === selectedBulan : true
            const matchYear = selectedYear ? item.year === parseInt(selectedYear) : true
            const matchPIC = selectedPIC ? item.pic === selectedPIC : true
            const matchOffice = isPusat
                ? (selectedOffice !== 'all' ? item.office_id === selectedOffice : true)
                : (item.office_id === userOfficeId)

            return matchSearch && matchBulan && matchYear && matchPIC && matchOffice
        })
    }, [allData, searchTerm, selectedBulan, selectedYear, selectedPIC, selectedOffice, isPusat])

    // Sorting and Pagination
    const { paginatedContents, filteredCount } = useMemo(() => {
        let sorted = [...filteredData]

        sorted.sort((a, b) => {
            let aVal = a[sortField]
            let bVal = b[sortField]

            // Special handling for dates
            if (sortField === 'scheduled_date' || sortField === 'tanggal_rencana') {
                aVal = new Date(aVal || '1970-01-01').getTime()
                bVal = new Date(bVal || '1970-01-01').getTime()
            }

            if (aVal === bVal) return 0
            const result = aVal > bVal ? 1 : -1
            return sortOrder === 'asc' ? result : -result
        })

        const startIndex = (currentPage - 1) * PAGE_SIZE
        return {
            paginatedContents: sorted.slice(startIndex, startIndex + PAGE_SIZE),
            filteredCount: sorted.length
        }
    }, [filteredData, sortField, sortOrder, currentPage])

    // Derived state
    const totalCount = allData.length
    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    // Selection Handlers
    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === 0) {
            setSelectedIds(paginatedContents.map(c => c.id))
        } else {
            setSelectedIds([])
        }
    }

    // Sorting Handlers
    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortOrder("asc")
        }
    }

    const getSortIcon = (field) => {
        if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/50" />
        return sortOrder === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
    }

    const handleDelete = async (id) => {
        if (!confirm("Hapus data ini?")) return
        try {
            const { error } = await deleteMediaPlan(id)
            if (error) throw error
            toast.success("Data berhasil dihapus")
            fetchData()
        } catch (err) {
            toast.error("Gagal menghapus: " + err.message)
        }
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Hapus ${selectedIds.length} data yang dipilih?`)) return
        try {
            for (const id of selectedIds) {
                await deleteMediaPlan(id)
            }
            toast.success("Data berhasil dihapus")
            setSelectedIds([])
            fetchData()
        } catch (err) {
            toast.error("Sebagian data gagal dihapus")
        }
    }

    const handleBulkStatusUpdate = async (status) => {
        try {
            const { error } = await bulkUpdateMediaPlans(selectedIds, { status })
            if (error) throw error
            toast.success("Status berhasil diperbarui")
            setSelectedIds([])
            fetchData()
        } catch (err) {
            toast.error("Gagal update status")
        }
    }

    const getCategoryColor = (cat) => {
        return CATEGORY_COLORS[cat] || CATEGORY_COLORS.default
    }

    // Calendar Helpers
    const prevMonth = () => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() - 1)))
    const nextMonth = () => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() + 1)))

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

    const getEventsForDay = (day) => {
        return allData.filter(item => {
            const dStr = item.tanggal_rencana || item.scheduled_date
            if (!dStr) return false
            const d = new Date(dStr)

            const matchOffice = isPusat
                ? (selectedOffice !== 'all' ? item.office_id === selectedOffice : true)
                : (item.office_id === userOfficeId)

            return d.getDate() === day &&
                d.getMonth() === calendarDate.getMonth() &&
                d.getFullYear() === calendarDate.getFullYear() &&
                matchOffice
        })
    }

    // Upload & Drag handlers
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); }
    const handleDragLeave = () => { setIsDragging(false); }
    const handleDrop = (e, callback) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) callback({ target: { files: [file] } });
    }

    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImportFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            const rows = content.split('\n').filter(r => r.trim());
            const data = rows.slice(1).map(row => {
                const cols = row.split(/[;,]/);
                return {
                    no: cols[0],
                    bulan: cols[1],
                    tanggal: cols[2],
                    kategori: cols[3],
                    rencana_pemberitaan: cols[4],
                    jenis_media_plan: cols[5],
                    bentuk_media: cols[6],
                    pic: cols[7],
                    keterangan: cols[8]
                };
            });
            setExtractedData(data);
        };
        reader.readAsText(file);
    }

    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImportFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const bstr = event.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            setExtractedData(data.map(item => ({
                ...item,
                rencana_pemberitaan: item["RENCANA PEMBERITAAN"] || item.rencana_pemberitaan
            })));
        };
        reader.readAsBinaryString(file);
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImportFileName(file.name);
        setUploadedImage(URL.createObjectURL(file));
        setIsExtracting(true);
        Tesseract.recognize(file, 'ind', {
            logger: m => { if (m.status === 'recognizing text') setExtractionProgress(Math.floor(m.progress * 100)); }
        }).then(({ data: { text } }) => {
            setExtractedData([]);
            toast.info("OCR Selesai. Mohon verifikasi data.");
        }).finally(() => setIsExtracting(false));
    }

    const handleSaveExtractedData = async () => {
        setSubmitting(true);
        try {
            const { error } = await bulkCreateMediaPlans(extractedData);
            if (error) throw error;
            toast.success("Berhasil mengimpor data");
            setShowUpload(false);
            fetchData();
        } catch (err) {
            toast.error("Gagal mengimpor data");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        try {
            // Construct payload
            const payload = {
                judul: formData.rencana_pemberitaan, // Map UI field to DB column
                bulan: formData.bulan,
                // If manual tanggal input used, construct date. Else use picker?
                // Logic: if manual 'tanggal' + 'bulan' + 'year', make date.
                // Simplified: use form picker or manual
                tanggal_rencana: formData.scheduled_date,
                kategori: formData.kategori,
                approval_status: isPusat ? formData.approval_status : 'Pending', // Only Pusat sets status directly
                aktualisasi: formData.aktualisasi,
                tanggal_realisasi: formData.tanggal_realisasi,
                link_realisasi: formData.link_realisasi,
                keterangan: formData.keterangan,
                // Auto-bind office_id (RLS/Trigger will handle, but explicit is good)
                office_id: isPusat ? (formData.office_id || userOfficeId) : userOfficeId // If Pusat Creating, might need to specify office? Usually Pusat creates for Pusat.
            }

            if (editingId) {
                const { error } = await updateMediaPlan(editingId, payload)
                if (error) throw error
                toast.success("Data berhasil diperbarui!")
            } else {
                const { error } = await createMediaPlan(payload)
                if (error) throw error
                toast.success("Data berhasil ditambahkan!")
            }
            await fetchData()
            setShowForm(false)
            resetForm()
        } catch (error) {
            toast.error("Gagal menyimpan: " + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    // ... (Rest of existing render logic, updating Inputs to match new fields)

    // Helper: Reset Form
    function resetForm() {
        setFormData(INITIAL_FORM)
        setEditingId(null)
    }

    // Helper: Handle Edit
    function handleEdit(item) {
        setEditingId(item.id)
        setFormData({
            ...INITIAL_FORM,
            ...item,
            rencana_pemberitaan: item.judul || item.rencana_pemberitaan, // Map back
            scheduled_date: item.tanggal_rencana
        })
        setShowForm(true)
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <Card className="w-full max-w-2xl mx-4 my-auto relative">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{editingId ? "Edit Media Plan" : "Tambah Media Plan"}</CardTitle>
                            <button onClick={() => { setShowForm(false); resetForm(); }}>
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Bulan</label>
                                        <select
                                            value={formData.bulan}
                                            onChange={(e) => setFormData({ ...formData, bulan: e.target.value })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                            required
                                        >
                                            <option value="">Pilih Bulan</option>
                                            {BULAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Tahun</label>
                                        <input
                                            type="number"
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Tanggal</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={formData.tanggal || ""}
                                            onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                            placeholder="Tgl (Opsional)"
                                        />
                                    </div>
                                    {isPusat && (
                                        <div>
                                            <label className="text-sm font-medium">Kantor (Opsional)</label>
                                            <select
                                                value={formData.office_id || ""}
                                                onChange={(e) => setFormData({ ...formData, office_id: e.target.value })}
                                                className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                            >
                                                <option value="">Default (Pusat)</option>
                                                {offices.map(off => (
                                                    <option key={off.id} value={off.id}>{off.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Rencana Pemberitaan / Judul</label>
                                    <textarea
                                        value={formData.rencana_pemberitaan}
                                        onChange={(e) => setFormData({ ...formData, rencana_pemberitaan: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm min-h-[80px]"
                                        placeholder="Deskripsi rencana..."
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Kategori</label>
                                        <Input
                                            value={formData.kategori}
                                            onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                                            placeholder="Contoh: HUT BUMN"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">PIC</label>
                                        <Input
                                            value={formData.pic}
                                            onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
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

                                {/* REALIZATION SECTION */}
                                <div className="border-t pt-4 mt-4">
                                    <h4 className="font-semibold text-sm mb-3">Realisasi & Status</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">Status Pelaksanaan</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                            >
                                                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        {isPusat && (
                                            <div>
                                                <label className="text-sm font-medium">Status Approval</label>
                                                <select
                                                    value={formData.approval_status}
                                                    onChange={(e) => setFormData({ ...formData, approval_status: e.target.value })}
                                                    className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                                >
                                                    {APPROVAL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="text-sm font-medium">Tanggal Realisasi</label>
                                            <Input
                                                type="date"
                                                value={formData.tanggal_realisasi || ''}
                                                onChange={(e) => setFormData({ ...formData, tanggal_realisasi: e.target.value })}
                                                className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Link Realisasi</label>
                                            <Input
                                                value={formData.link_realisasi || ""}
                                                onChange={(e) => setFormData({ ...formData, link_realisasi: e.target.value })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Keterangan</label>
                                    <Input
                                        value={formData.keterangan}
                                        onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                        placeholder="Catatan tambahan..."
                                    />
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
                            {allData.filter(c => c.aktualisasi === 'Sudah' || c.status === 'Published').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Terealisasi</p>
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
                            {isPusat && (
                                <select
                                    value={selectedOffice}
                                    onChange={(e) => { setSelectedOffice(e.target.value); setCurrentPage(1); }}
                                    className="h-10 px-3 rounded-lg bg-muted border-none text-sm max-w-[150px]"
                                >
                                    <option value="all">Semua Kantor</option>
                                    {offices.map(off => (
                                        <option key={off.id} value={off.id}>{off.name}</option>
                                    ))}
                                </select>
                            )}
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
                                        {paginatedContents.length > 0 && paginatedContents.every(c => selectedIds.includes(c.id)) ?
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
                                {isPusat && <TableHead>Kantor</TableHead>}
                                <TableHead className="cursor-pointer" onClick={() => handleSort("kategori")}>
                                    <div className="flex items-center">Kategori {getSortIcon("kategori")}</div>
                                </TableHead>
                                <TableHead>Rencana Pemberitaan</TableHead>
                                <TableHead>Jenis</TableHead>
                                <TableHead>Bentuk Media</TableHead>
                                <TableHead>PIC</TableHead>
                                <TableHead>Status</TableHead>
                                {isPusat && <TableHead>Approval</TableHead>}
                                <TableHead>Keterangan</TableHead>
                                <TableHead className="w-[100px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedContents.map((item, index) => (
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
                                    {isPusat && (
                                        <TableCell className="text-xs font-medium">
                                            {item.offices?.name || 'Pusat'}
                                        </TableCell>
                                    )}
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
                                        {item.link_realisasi && (
                                            <a href={item.link_realisasi} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline block mt-1">
                                                Link Realisasi
                                            </a>
                                        )}
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
                                    {isPusat && (
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${item.approval_status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                item.approval_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {item.approval_status || "Pending"}
                                            </span>
                                        </TableCell>
                                    )}
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
                    {paginatedContents.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            Tidak ada data. Klik "Import" atau "Tambah" untuk input manual.
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
