import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"
import { supabase } from "@/lib/supabase"
import { Plus, Pencil, Trash2, X, Database, FileText, Megaphone, Users, RefreshCw } from "lucide-react"

const TABS = [
    { id: "categories", label: "Kategori", icon: FileText, table: "categories", fields: ["name", "description"] },
    { id: "content_types", label: "Jenis Konten", icon: Megaphone, table: "content_types", fields: ["name", "description"] },
    { id: "media_platforms", label: "Platform Media", icon: Database, table: "media_platforms", fields: ["name", "icon"] },
    { id: "writers", label: "Writers", icon: Users, table: "writers", fields: ["name", "email", "department"] }
]

export function MasterData() {
    const toast = useToast()
    const [activeTab, setActiveTab] = useState("categories")
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({})
    const [submitting, setSubmitting] = useState(false)

    const currentTab = TABS.find(t => t.id === activeTab) || TABS[0]

    useEffect(() => {
        fetchData()
    }, [activeTab])

    async function fetchData() {
        setLoading(true)
        try {
            const { data: result, error } = await supabase
                .from(currentTab.table)
                .select("*")
                .order("name", { ascending: true })

            if (error) throw error
            setData(result || [])
        } catch (error) {
            console.error("Error fetching data:", error)
            // If table doesn't exist, show empty
            setData([])
        }
        setLoading(false)
    }

    function resetForm() {
        setFormData({})
        setEditingId(null)
    }

    function handleEdit(item) {
        setEditingId(item.id)
        setFormData(item)
        setShowForm(true)
    }

    async function handleDelete(id) {
        toast.confirm(`Hapus item ini?`, async () => {
            try {
                const { error } = await supabase.from(currentTab.table).delete().eq("id", id)
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
            if (editingId) {
                const { error } = await supabase.from(currentTab.table).update(formData).eq("id", editingId)
                if (error) throw error
                toast.success("Data berhasil diperbarui!")
            } else {
                const { error } = await supabase.from(currentTab.table).insert([formData])
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Master Data</h1>
                    <p className="text-sm text-muted-foreground">Kelola data referensi sistem</p>
                </div>
                <Button onClick={fetchData} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b pb-2">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent"
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{editingId ? "Edit" : "Tambah"} {currentTab.label}</CardTitle>
                            <button onClick={() => { setShowForm(false); resetForm(); }}>
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {currentTab.fields.map(field => (
                                    <div key={field}>
                                        <label className="text-sm font-medium capitalize">{field.replace("_", " ")}</label>
                                        <input
                                            type={field === "email" ? "email" : "text"}
                                            value={formData[field] || ""}
                                            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                            required={field === "name"}
                                        />
                                    </div>
                                ))}
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1">
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={submitting} className="flex-1">
                                        {submitting ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Data Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <currentTab.icon className="h-5 w-5" />
                        {currentTab.label} ({data.length})
                    </CardTitle>
                    <Button onClick={() => { resetForm(); setShowForm(true); }}>
                        <Plus className="h-4 w-4 mr-1" />
                        Tambah
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Belum ada data {currentTab.label.toLowerCase()}</p>
                            <Button onClick={() => { resetForm(); setShowForm(true); }} className="mt-4">
                                <Plus className="h-4 w-4 mr-1" />
                                Tambah {currentTab.label}
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">No</TableHead>
                                    {currentTab.fields.map(field => (
                                        <TableHead key={field} className="capitalize">
                                            {field.replace("_", " ")}
                                        </TableHead>
                                    ))}
                                    <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                        {currentTab.fields.map(field => (
                                            <TableCell key={field}>{item[field] || "-"}</TableCell>
                                        ))}
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
