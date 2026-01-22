import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { Plus, Pencil, Trash2, X, Users, Shield, ShieldCheck, Eye, RefreshCw, UserCircle } from "lucide-react"

const ROLES = [
    { id: "admin", label: "Admin", icon: ShieldCheck, color: "text-red-600 bg-red-100" },
    { id: "editor", label: "Editor", icon: Shield, color: "text-blue-600 bg-blue-100" },
    { id: "viewer", label: "Viewer", icon: Eye, color: "text-gray-600 bg-gray-100" }
]

export function UserManagement() {
    const toast = useToast()
    const { user, isAdmin } = useAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({
        email: "",
        full_name: "",
        role: "viewer"
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    async function fetchUsers() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("user_profiles")
                .select("*")
                .order("created_at", { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error("Error fetching users:", error)
            toast.error("Gagal memuat data users")
        }
        setLoading(false)
    }

    function resetForm() {
        setFormData({ email: "", full_name: "", role: "viewer" })
        setEditingId(null)
    }

    function handleEdit(item) {
        setEditingId(item.id)
        setFormData({
            email: item.email || "",
            full_name: item.full_name || "",
            role: item.role || "viewer"
        })
        setShowForm(true)
    }

    async function handleDelete(id) {
        if (id === user?.id) {
            toast.error("Tidak dapat menghapus akun sendiri!")
            return
        }

        toast.confirm("Hapus user ini?", async () => {
            try {
                const { error } = await supabase.from("user_profiles").delete().eq("id", id)
                if (error) throw error
                toast.success("User berhasil dihapus!")
                await fetchUsers()
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
                const { error } = await supabase
                    .from("user_profiles")
                    .update({
                        full_name: formData.full_name,
                        role: formData.role
                    })
                    .eq("id", editingId)
                if (error) throw error
                toast.success("User berhasil diperbarui!")
            } else {
                // Check if email already exists
                const { data: existing } = await supabase
                    .from("user_profiles")
                    .select("id")
                    .eq("email", formData.email)
                    .single()

                if (existing) {
                    toast.error("Email sudah terdaftar!")
                    setSubmitting(false)
                    return
                }

                const { error } = await supabase
                    .from("user_profiles")
                    .insert([formData])
                if (error) throw error
                toast.success("User berhasil ditambahkan!")
            }
            await fetchUsers()
            resetForm()
            setShowForm(false)
        } catch (error) {
            toast.error("Gagal menyimpan: " + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    function getRoleBadge(role) {
        const roleData = ROLES.find(r => r.id === role) || ROLES[2]
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleData.color}`}>
                <roleData.icon className="h-3 w-3" />
                {roleData.label}
            </span>
        )
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h2 className="text-lg font-semibold mb-2">Akses Terbatas</h2>
                        <p className="text-sm text-muted-foreground">
                            Halaman ini hanya dapat diakses oleh Admin.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-sm text-muted-foreground">Kelola pengguna dan hak akses</p>
                </div>
                <Button onClick={fetchUsers} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{users.length}</div>
                        <p className="text-xs text-muted-foreground">Total Users</p>
                    </CardContent>
                </Card>
                {ROLES.map(role => (
                    <Card key={role.id}>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{users.filter(u => u.role === role.id).length}</div>
                            <p className="text-xs text-muted-foreground">{role.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{editingId ? "Edit" : "Tambah"} User</CardTitle>
                            <button onClick={() => { setShowForm(false); resetForm(); }}>
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                        required
                                        disabled={editingId}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                    >
                                        {ROLES.map(role => (
                                            <option key={role.id} value={role.id}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>
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

            {/* Users Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Daftar Users ({users.length})
                    </CardTitle>
                    <Button onClick={() => { resetForm(); setShowForm(true); }}>
                        <Plus className="h-4 w-4 mr-1" />
                        Tambah User
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Belum ada user</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">No</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((item, index) => (
                                    <TableRow key={item.id} className={item.id === user?.id ? "bg-primary/5" : ""}>
                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <UserCircle className="h-8 w-8 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium">{item.full_name || "-"}</div>
                                                    {item.id === user?.id && (
                                                        <span className="text-xs text-primary">(Anda)</span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{item.email}</TableCell>
                                        <TableCell>{getRoleBadge(item.role)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                                                    disabled={item.id === user?.id}
                                                >
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
