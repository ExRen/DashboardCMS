import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { getSocialPosts, createSocialPost, updateSocialPost, deleteSocialPost, getOffices } from "@/lib/supabase"
import { styles } from "@/lib/styles"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Plus, Search, Filter, Edit2, Trash2, X, MoreVertical, ExternalLink } from "lucide-react"

const PAGE_SIZE = 10
const PLATFORM_OPTIONS = ["Instagram Feed", "Instagram Story", "Instagram Reels", "Tiktok", "Facebook", "Twitter/X", "YouTube"]
const STATUS_OPTIONS = ["Draft", "Published", "Archived"]

export function MediaSosial() {
    const { user, isPusat, isCabang, userOfficeId, profile, canEditContent } = useAuth()
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedPlatform, setSelectedPlatform] = useState("")
    const [selectedStatus, setSelectedStatus] = useState("")
    const [selectedOffice, setSelectedOffice] = useState("all")
    const [offices, setOffices] = useState([])

    // Form State
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        content_type: "Instagram Feed",
        caption: "",
        post_date: "",
        link_post: "",
        insight_likes: 0,
        insight_comments: 0,
        insight_views: 0,
        status: "Draft",
        office_id: "" // For Pusat to set, or auto-set by backend for Cabang
    })

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        if (isPusat) {
            fetchOffices()
        }
        fetchData()
    }, [isPusat, selectedPlatform, selectedStatus, selectedOffice, currentPage])

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
                platform: selectedPlatform || undefined,
                status: selectedStatus || undefined
            }

            if (isPusat && selectedOffice !== 'all') {
                params.officeId = selectedOffice
            } else if (isCabang) {
                params.officeId = userOfficeId
            }

            const { data: posts, error } = await getSocialPosts(params)
            if (error) throw error
            setData(posts || [])
        } catch (err) {
            console.error("Error fetching social posts:", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredData = data.filter(item => {
        const matchSearch = item.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.content_type?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchOffice = isPusat
            ? (selectedOffice !== 'all' ? item.office_id === selectedOffice : true)
            : (item.office_id === userOfficeId)

        return matchSearch && matchOffice
    })

    // DB Schema: tanggal_posting, judul, caption, tagar, kategori, link_posting, likes, comments
    function resetForm() {
        setFormData({
            judul: "",
            caption: "",
            tanggal_posting: new Date().toISOString().split('T')[0],
            link_posting: "",
            kategori: "",
            tagar: "",
            likes: 0,
            comments: 0,
            office_id: ""
        })
        setEditingId(null)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        try {
            const payload = {
                ...formData,
                // Ensure numbers match DB column names
                likes: parseInt(formData.likes) || 0,
                comments: parseInt(formData.comments) || 0,
                office_id: isCabang ? userOfficeId : formData.office_id
            }
            // Fix invalid input syntax for type uuid: ""
            if (!payload.office_id) delete payload.office_id;

            // If Pusat is creating, they must select office_id usually, but if not selected, it might fail RLS or be null. 
            // Ideally Pusat selects office.
            if (isPusat && !payload.office_id && !editingId) {
                // simple validation if strict
            }

            if (editingId) {
                const { error } = await updateSocialPost(editingId, payload)
                if (error) throw error
            } else {
                const { error } = await createSocialPost(payload)
                if (error) throw error
            }

            setShowForm(false)
            resetForm()
            fetchData()
        } catch (err) {
            console.error("Error submitting:", err)
            alert("Gagal menyimpan data")
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDelete(id) {
        if (!confirm("Hapus postingan ini?")) return
        try {
            const { error } = await deleteSocialPost(id)
            if (error) throw error
            fetchData()
        } catch (err) {
            console.error("Error deleting:", err)
        }
    }

    function handleEdit(item) {
        setFormData({
            judul: item.judul || "",
            caption: item.caption || "",
            tanggal_posting: item.tanggal_posting || "",
            link_posting: item.link_posting || "",
            kategori: item.kategori || "",
            tagar: item.tagar || "",
            likes: item.likes || 0,
            comments: item.comments || 0,
            office_id: item.office_id || ""
        })
        setEditingId(item.id)
        setShowForm(true)
    }

    const canEdit = canEditContent // Uses AuthContext permission

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={styles.text.h1}>Media Sosial</h1>
                    <p className={styles.text.subtitle}>Monitoring aktivitas media sosial kantor cabang</p>
                </div>
                {canEdit && (
                    <Button onClick={() => { resetForm(); setShowForm(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Post
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
                                    placeholder="Cari caption..."
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
                                value={selectedPlatform}
                                onChange={(e) => setSelectedPlatform(e.target.value)}
                                className="h-10 px-3 rounded-lg bg-muted border-none text-sm"
                            >
                                <option value="">Semua Platform</option>
                                {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="h-10 px-3 rounded-lg bg-muted border-none text-sm"
                            >
                                <option value="">Semua Status</option>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Tanggal</TableHead>
                                {isPusat && <TableHead>Kantor</TableHead>}
                                <TableHead>Kategori</TableHead>
                                <TableHead className="max-w-[300px]">Judul / Caption</TableHead>
                                <TableHead>Tagar</TableHead>
                                <TableHead>Engagement</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="text-sm">
                                            {item.tanggal_posting}
                                        </TableCell>
                                        {isPusat && (
                                            <TableCell className="text-sm font-medium">
                                                {item.offices?.name || '-'}
                                            </TableCell>
                                        )}
                                        <TableCell className="text-sm">
                                            {item.kategori || '-'}
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <div className="font-medium text-sm">{item.judul}</div>
                                            <div className="line-clamp-2 text-sm text-muted-foreground">{item.caption}</div>
                                            {item.link_posting && (
                                                <a href={item.link_posting} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1">
                                                    Lihat Post <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.tagar && <span className="text-xs text-muted-foreground">{item.tagar}</span>}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            <div>Likes: {item.likes || 0}</div>
                                            <div>Comments: {item.comments || 0}</div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {canEdit && (
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-500">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <Card className="w-full max-w-lg mx-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{editingId ? "Edit Post" : "Tambah Post"}</CardTitle>
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
                                        >
                                            <option value="">Pilih Kantor</option>
                                            {offices.map(off => (
                                                <option key={off.id} value={off.id}>{off.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium">Judul</label>
                                    <Input
                                        value={formData.judul}
                                        onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                                        placeholder="Judul post..."
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Kategori</label>
                                        <Input
                                            value={formData.kategori}
                                            onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                                            placeholder="Contoh: Instagram, TikTok, YouTube"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Tanggal Posting</label>
                                        <Input
                                            type="date"
                                            value={formData.tanggal_posting}
                                            onChange={(e) => setFormData({ ...formData, tanggal_posting: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Caption</label>
                                    <textarea
                                        value={formData.caption}
                                        onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm min-h-[100px]"
                                        placeholder="Tulis caption..."
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Tagar / Hashtag</label>
                                    <Input
                                        value={formData.tagar}
                                        onChange={(e) => setFormData({ ...formData, tagar: e.target.value })}
                                        placeholder="#contoh #hashtag"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Link Posting</label>
                                    <Input
                                        value={formData.link_posting}
                                        onChange={(e) => setFormData({ ...formData, link_posting: e.target.value })}
                                        placeholder="https://instagram.com/p/..."
                                    />
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-sm mb-3">Engagement</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-muted-foreground">Likes</label>
                                            <Input
                                                type="number"
                                                value={formData.likes}
                                                onChange={(e) => setFormData({ ...formData, likes: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Comments</label>
                                            <Input
                                                type="number"
                                                value={formData.comments}
                                                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                            />
                                        </div>
                                    </div>
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
