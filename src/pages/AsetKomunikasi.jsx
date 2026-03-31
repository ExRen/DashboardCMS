import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { getAssets, createAsset, updateAsset, deleteAsset, getOffices } from "@/lib/supabase"
import { styles } from "@/lib/styles"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Plus, Search, Edit2, Trash2, X, FolderOpen, ExternalLink, Filter } from "lucide-react"

const PAGE_SIZE = 10
const BULAN_OPTIONS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

export function AsetKomunikasi() {
    const { isPusat, isCabang, userOfficeId, profile, canEditContent, canDeleteContent } = useAuth()
    const [data, setData] = useState([])
    const [offices, setOffices] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedBulan, setSelectedBulan] = useState("")
    const [selectedOffice, setSelectedOffice] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)

    // Form State - DB Schema: tema, tanggal_produksi, link_folder, status_peserta, keterangan
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        tema: "",
        tanggal_produksi: new Date().toISOString().split('T')[0],
        link_folder: "",
        status_peserta: "",
        keterangan: "",
        office_id: ""
    })

    useEffect(() => {
        if (isPusat) fetchOffices()
        fetchData()
    }, [isPusat, currentPage, selectedOffice, selectedBulan])

    async function fetchOffices() {
        const { data } = await getOffices()
        if (data) setOffices(data)
    }

    async function fetchData() {
        setLoading(true)
        try {
            const params = {
                limit: PAGE_SIZE,
                offset: (currentPage - 1) * PAGE_SIZE,
                officeId: isPusat
                    ? (selectedOffice !== 'all' ? selectedOffice : undefined)
                    : userOfficeId
            }

            const { data: assets, error } = await getAssets(params)
            if (error) throw error
            setData(assets || [])
        } catch (err) {
            console.error("Error fetching assets:", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredData = data.filter(item => {
        const matchSearch = item.tema?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.keterangan?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchOffice = isPusat
            ? (selectedOffice !== 'all' ? item.office_id === selectedOffice : true)
            : (item.office_id === userOfficeId)

        return matchSearch && matchOffice
    })

    function resetForm() {
        setFormData({
            tema: "",
            tanggal_produksi: new Date().toISOString().split('T')[0],
            link_folder: "",
            status_peserta: "",
            keterangan: "",
            office_id: ""
        })
        setEditingId(null)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        try {
            const payload = { ...formData }
            // Fix invalid input syntax for type uuid: ""
            if (!payload.office_id) delete payload.office_id;

            if (editingId) {
                const { error } = await updateAsset(editingId, payload)
                if (error) throw error
            } else {
                const { error } = await createAsset(payload)
                if (error) throw error
            }

            setShowForm(false)
            resetForm()
            fetchData()
        } catch (err) {
            console.error("Error submitting asset:", err)
            alert("Gagal menyimpan data")
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDelete(id) {
        if (!confirm("Hapus aset ini?")) return
        try {
            const { error } = await deleteAsset(id)
            if (error) throw error
            fetchData()
        } catch (err) {
            console.error("Error deleting:", err)
        }
    }

    function handleEdit(item) {
        setFormData({
            tema: item.tema || "",
            tanggal_produksi: item.tanggal_produksi || new Date().toISOString().split('T')[0],
            link_folder: item.link_folder || "",
            status_peserta: item.status_peserta || "",
            keterangan: item.keterangan || "",
            office_id: item.office_id || ""
        })
        setEditingId(item.id)
        setShowForm(true)
    }

    // Cabang can only edit their own data, Pusat Super Admin can edit all
    const canEdit = canEditContent
    const canDelete = canDeleteContent

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={styles.text.h1}>Aset Komunikasi</h1>
                    <p className={styles.text.subtitle}>Database aset komunikasi kantor cabang</p>
                </div>
                {canEdit && (
                    <Button onClick={() => { resetForm(); setShowForm(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Aset
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari tema / keterangan..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
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
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <FolderOpen className="h-8 w-8 text-primary" />
                            <div>
                                <div className="text-2xl font-bold">{data.length}</div>
                                <p className="text-xs text-muted-foreground">Total Aset</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Tanggal Produksi</TableHead>
                                {isPusat && <TableHead>Kantor</TableHead>}
                                <TableHead>Tema</TableHead>
                                <TableHead>Link Folder</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead className="text-right w-[100px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        Tidak ada data aset
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="text-sm font-medium">{item.tanggal_produksi}</TableCell>
                                        {isPusat && (
                                            <TableCell className="text-sm">
                                                {item.offices?.name || '-'}
                                            </TableCell>
                                        )}
                                        <TableCell className="font-medium">{item.tema}</TableCell>
                                        <TableCell>
                                            {item.link_folder ? (
                                                <a
                                                    href={item.link_folder}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                                                >
                                                    Buka Folder <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">{item.status_peserta || '-'}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                                            <div className="line-clamp-2">{item.keterangan || '-'}</div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                {canEdit && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-500">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <Card className="w-full max-w-lg mx-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{editingId ? "Edit Aset" : "Tambah Aset"}</CardTitle>
                            <button onClick={() => { setShowForm(false); resetForm(); }}>
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {isPusat && (
                                    <div>
                                        <label className="text-sm font-medium">Kantor</label>
                                        <select
                                            value={formData.office_id}
                                            onChange={(e) => setFormData({ ...formData, office_id: e.target.value })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                            required
                                        >
                                            <option value="">Pilih Kantor</option>
                                            {offices.map(off => (
                                                <option key={off.id} value={off.id}>{off.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium">Tanggal Produksi</label>
                                    <Input
                                        type="date"
                                        value={formData.tanggal_produksi}
                                        onChange={(e) => setFormData({ ...formData, tanggal_produksi: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Tema Aset</label>
                                    <Input
                                        value={formData.tema}
                                        onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                                        placeholder="Contoh: Hari Pahlawan, HUT ASABRI"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Link Folder</label>
                                    <Input
                                        value={formData.link_folder}
                                        onChange={(e) => setFormData({ ...formData, link_folder: e.target.value })}
                                        placeholder="https://drive.google.com/..."
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Link Google Drive / folder penyimpanan aset</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Status Peserta</label>
                                    <Input
                                        value={formData.status_peserta}
                                        onChange={(e) => setFormData({ ...formData, status_peserta: e.target.value })}
                                        placeholder="Contoh: Sudah disampaikan, Belum"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Keterangan</label>
                                    <textarea
                                        value={formData.keterangan}
                                        onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm min-h-[80px]"
                                        placeholder="Keterangan tambahan..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
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
        </div>
    )
}
