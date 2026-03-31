import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { getNewsPlans, createNewsPlan, updateNewsPlan, deleteNewsPlan, getNewsMonitoring, createNewsMonitoring, updateNewsMonitoring, deleteNewsMonitoring, getOffices } from "@/lib/supabase"
import { styles } from "@/lib/styles"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Plus, Search, Filter, Edit2, Trash2, X, AlertCircle } from "lucide-react"

const PAGE_SIZE = 10
const SENTIMENT_OPTIONS = ["Positif", "Netral", "Negatif"]

export function Pemberitaan() {
    const { isPusat, isCabang, userOfficeId, profile, canEditContent } = useAuth()
    const [activeTab, setActiveTab] = useState("rencana") // 'rencana' or 'monitoring'
    const [offices, setOffices] = useState([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [selectedOffice, setSelectedOffice] = useState("all")
    const [selectedSentiment, setSelectedSentiment] = useState("")

    // Data
    const [data, setData] = useState([])
    const [currentPage, setCurrentPage] = useState(1)

    // Form
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({})

    useEffect(() => {
        if (isPusat) fetchOffices()
    }, [isPusat])

    useEffect(() => {
        fetchData()
    }, [activeTab, currentPage, selectedOffice, selectedSentiment])

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

            let result
            if (activeTab === "rencana") {
                result = await getNewsPlans(params)
            } else {
                result = await getNewsMonitoring({ ...params, sentiment: selectedSentiment || undefined })
            }

            if (result.error) throw result.error
            setData(result.data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    function resetForm() {
        if (activeTab === "rencana") {
            // DB Schema: tanggal, judul, link_narasi, link_dokumentasi, process, aktualisasi
            setFormData({
                nama_media: "",
                judul: "",
                tanggal: new Date().toISOString().split('T')[0],
                link_narasi: "",
                link_dokumentasi: "",
                process: "Planned",
                office_id: ""
            })
        } else {
            // DB Schema: tanggal, tone, judul, jenis_media, nama_media, link
            setFormData({
                nama_media: "",
                judul: "",
                tanggal: new Date().toISOString().split('T')[0],
                tone: "Netral",
                jenis_media: "",
                link: "",
                office_id: ""
            })
        }
        setEditingId(null)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        try {
            const payload = { ...formData }
            // Fix invalid input syntax for type uuid: ""
            if (!payload.office_id) delete payload.office_id;

            // Validation if needed

            if (activeTab === "rencana") {
                if (editingId) await updateNewsPlan(editingId, payload)
                else await createNewsPlan(payload)
            } else {
                if (editingId) await updateNewsMonitoring(editingId, payload)
                else await createNewsMonitoring(payload)
            }

            setShowForm(false)
            fetchData()
        } catch (err) {
            console.error(err)
            alert("Gagal menyimpan")
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDelete(id) {
        if (!confirm("Hapus data?")) return
        if (activeTab === "rencana") await deleteNewsPlan(id)
        else await deleteNewsMonitoring(id)
        fetchData()
    }

    function handleEdit(item) {
        setFormData(item)
        setEditingId(item.id)
        setShowForm(true)
    }

    const filteredData = data.filter(item => {
        const matchSearch = item.judul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nama_media?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchOffice = isPusat
            ? (selectedOffice !== 'all' ? item.office_id === selectedOffice : true)
            : (item.office_id === userOfficeId)

        return matchSearch && matchOffice
    })

    const canEdit = canEditContent // Uses AuthContext permission

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={styles.text.h1}>Pemberitaan</h1>
                    <p className={styles.text.subtitle}>Manajemen data pemberitaan media</p>
                </div>
                {canEdit && (
                    <Button onClick={() => { resetForm(); setShowForm(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Data
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b">
                <button
                    className={`px-4 py-2 text-sm font-medium ${activeTab === "rencana" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => { setActiveTab("rencana"); setCurrentPage(1); }}
                >
                    Rencana Media
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium ${activeTab === "monitoring" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => { setActiveTab("monitoring"); setCurrentPage(1); }}
                >
                    Monitoring Berita
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                {isPusat && (
                    <select
                        value={selectedOffice}
                        onChange={(e) => setSelectedOffice(e.target.value)}
                        className="h-10 px-3 rounded-lg bg-white border border-input text-sm"
                    >
                        <option value="all">Semua Kantor</option>
                        {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                )}
                {activeTab === "monitoring" && (
                    <select
                        value={selectedSentiment}
                        onChange={(e) => setSelectedSentiment(e.target.value)}
                        className="h-10 px-3 rounded-lg bg-white border border-input text-sm"
                    >
                        <option value="">Semua Sentimen</option>
                        {SENTIMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                )}
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                {isPusat && <TableHead>Kantor</TableHead>}
                                <TableHead>Media</TableHead>
                                <TableHead>{activeTab === "rencana" ? "Topik / Angle" : "Judul Berita"}</TableHead>
                                {activeTab === "monitoring" && <TableHead>Sentimen</TableHead>}
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell>
                                </TableRow>
                            ) : (
                                data.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.tanggal}</TableCell>
                                        {isPusat && <TableCell>{item.offices?.name}</TableCell>}
                                        <TableCell>{item.nama_media}</TableCell>
                                        <TableCell>
                                            {activeTab === "rencana" ? item.judul : (
                                                <div>
                                                    <div className="font-medium">{item.judul}</div>
                                                    {item.link && <a href={item.link} target="_blank" className="text-xs text-blue-500 hover:underline">Link Berita</a>}
                                                </div>
                                            )}
                                        </TableCell>
                                        {activeTab === "monitoring" && (
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded text-xs ${item.tone === 'Positif' ? 'bg-green-100 text-green-800' :
                                                    item.tone === 'Negatif' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {item.tone}
                                                </span>
                                            </TableCell>
                                        )}
                                        <TableCell className="text-right">
                                            {canEdit && (
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><Edit2 className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            )}
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
                    <Card className="w-full max-w-lg mx-4">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>{editingId ? "Edit" : "Tambah"} {activeTab === "rencana" ? "Rencana" : "Monitoring"}</CardTitle>
                            <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
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
                                        >
                                            <option value="">Pilih Kantor</option>
                                            {offices.map(off => (
                                                <option key={off.id} value={off.id}>{off.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium">Nama Media</label>
                                    <Input
                                        value={formData.nama_media}
                                        onChange={e => setFormData({ ...formData, nama_media: e.target.value })}
                                        required
                                    />
                                </div>
                                {activeTab === "rencana" ? (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium">Judul / Topik</label>
                                            <Input
                                                value={formData.judul}
                                                onChange={e => setFormData({ ...formData, judul: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Tanggal Rencana</label>
                                            <Input type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Link Narasi</label>
                                            <Input value={formData.link_narasi || ''} onChange={e => setFormData({ ...formData, link_narasi: e.target.value })} placeholder="https://..." />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Link Dokumentasi</label>
                                            <Input value={formData.link_dokumentasi || ''} onChange={e => setFormData({ ...formData, link_dokumentasi: e.target.value })} placeholder="https://..." />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium">Judul Berita</label>
                                            <Input value={formData.judul} onChange={e => setFormData({ ...formData, judul: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Jenis Media</label>
                                            <Input value={formData.jenis_media || ''} onChange={e => setFormData({ ...formData, jenis_media: e.target.value })} placeholder="Online / Cetak / TV" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Tanggal Terbit</label>
                                            <Input type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Sentimen (Tone)</label>
                                            <select
                                                value={formData.tone}
                                                onChange={e => setFormData({ ...formData, tone: e.target.value })}
                                                className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                            >
                                                {SENTIMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Link Berita</label>
                                            <Input value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} />
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Batal</Button>
                                    <Button type="submit" disabled={submitting} className="flex-1">Simpan</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
