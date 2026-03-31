import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"
import { useAuth } from "@/context/AuthContext"
import { supabase, getOffices } from "@/lib/supabase"
import { Plus, Pencil, Trash2, X, Users, Shield, ShieldCheck, Eye, RefreshCw, UserCircle, Building2, Search } from "lucide-react"

// Simplified Roles - Per User Request
const ROLES = [
    { id: "super_admin", label: "Super Admin", icon: ShieldCheck, color: "text-purple-600 bg-purple-100", type: "pusat" },
    { id: "admin_cabang", label: "Admin Cabang", icon: Shield, color: "text-red-600 bg-red-100", type: "cabang" }
]

export function UserManagement() {
    const toast = useToast()
    const { user, canManageUsers, isSuperAdminPusat, isCabangAdmin, userOfficeId } = useAuth()
    const [users, setUsers] = useState([])
    const [offices, setOffices] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedOfficeFilter, setSelectedOfficeFilter] = useState("all")
    const [formData, setFormData] = useState({
        email: "",
        full_name: "",
        password: "", // New password field
        role: "admin_cabang",
        office_id: ""
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (canManageUsers) {
            fetchUsers()
            if (isSuperAdminPusat) fetchOffices()
        }
    }, [canManageUsers, isSuperAdminPusat])

    const filteredUsers = users.filter(u => {
        const matchesSearch =
            (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.offices?.name || "").toLowerCase().includes(searchTerm.toLowerCase())

        const matchesOffice = selectedOfficeFilter === "all" || u.office_id === selectedOfficeFilter

        return matchesSearch && matchesOffice
    })

    async function fetchOffices() {
        const { data } = await getOffices()
        if (data) setOffices(data)
    }

    async function fetchUsers() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("user_profiles")
                .select("*, offices(name)")
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
        setFormData({
            email: "",
            full_name: "",
            password: "",
            role: isCabangAdmin ? "admin_cabang" : "super_admin",
            office_id: isCabangAdmin ? userOfficeId : ""
        })
        setEditingId(null)
    }

    function handleEdit(item) {
        setEditingId(item.id)
        setFormData({
            email: item.email || "",
            full_name: item.full_name || "",
            role: item.role || "viewer_pusat",
            office_id: item.office_id || ""
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
            const payload = {
                full_name: formData.full_name,
                role: formData.role,
                office_id: formData.role === 'admin_cabang' ? (formData.office_id || userOfficeId) : null
            }

            // Validation: Cabang users MUST have an office
            if (formData.role === 'admin_cabang' && !payload.office_id) {
                throw new Error("Admin Cabang wajib memiliki Kantor!")
            }

            // Validation: Password required for new users
            if (!editingId && (!formData.password || formData.password.length < 6)) {
                throw new Error("Password wajib minimal 6 karakter untuk user baru!")
            }

            if (editingId) {
                // EDIT MODE: just update the profile
                const { error } = await supabase
                    .from("user_profiles")
                    .update(payload)
                    .eq("id", editingId)
                if (error) throw error
                toast.success("User berhasil diperbarui!")
            } else {
                // CREATE MODE: Signup via Supabase Auth, then update profile
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

                // Create Supabase Auth user
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: { data: { full_name: formData.full_name } }
                })

                if (authError) throw new Error("Gagal membuat akun Auth: " + authError.message)

                // Insert into user_profiles table
                const { error: profileError } = await supabase
                    .from("user_profiles")
                    .insert([{ ...payload, email: formData.email }])
                if (profileError) throw profileError

                toast.success("User berhasil ditambahkan! Akun dapat langsung digunakan.")
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
        // Handle legacy roles
        const mappedRole = ['admin', 'super_admin_pusat', 'editor_pusat', 'viewer_pusat'].includes(role)
            ? 'super_admin'
            : ['editor_cabang', 'viewer_cabang'].includes(role) ? 'admin_cabang' : role
        const roleData = ROLES.find(r => r.id === mappedRole) || ROLES[1]
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleData.color}`}>
                <roleData.icon className="h-3 w-3" />
                {roleData.label}
            </span>
        )
    }

    if (!canManageUsers) {
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
            {/* Filters & Actions */}
            <Card className="border-none shadow-md bg-gradient-to-r from-card to-background">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cari nama, email, atau kantor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/50 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {isSuperAdminPusat && (
                                <select
                                    value={selectedOfficeFilter}
                                    onChange={(e) => setSelectedOfficeFilter(e.target.value)}
                                    className="h-11 px-4 rounded-xl bg-muted/50 border-none text-sm focus:ring-2 focus:ring-primary/20 min-w-[200px]"
                                >
                                    <option value="all">Semua Kantor</option>
                                    {offices.map(off => (
                                        <option key={off.id} value={off.id}>{off.name}</option>
                                    ))}
                                </select>
                            )}
                            <Button onClick={() => { resetForm(); setShowForm(true); }} className="h-11 rounded-xl shadow-lg shadow-primary/20">
                                <Plus className="h-4 w-4 mr-2" />
                                User Baru
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                                {!editingId && (
                                    <div>
                                        <label className="text-sm font-medium">Password (min. 6 karakter)</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                            required
                                            minLength={6}
                                            placeholder="Password untuk login"
                                        />
                                    </div>
                                )}
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
                                {(isSuperAdminPusat || formData.role === 'admin_cabang') && (
                                    <div>
                                        <label className="text-sm font-medium">Kantor (Wajib untuk Admin Cabang)</label>
                                        <select
                                            value={formData.office_id}
                                            onChange={(e) => setFormData({ ...formData, office_id: e.target.value })}
                                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                            disabled={isCabangAdmin}
                                        >
                                            <option value="">Pilih Kantor</option>
                                            {offices.map(off => (
                                                <option key={off.id} value={off.id}>{off.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

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
                    <div className="text-sm text-muted-foreground">Menampilkan {filteredUsers.length} user</div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">User tidak ditemukan</p>
                            <p className="text-sm">Coba kata kunci lain atau filter kantor yang berbeda.</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[60px] text-center">No</TableHead>
                                        <TableHead>Identitas Pengguna</TableHead>
                                        <TableHead>Role & Akses</TableHead>
                                        <TableHead>Unit Kerja / Kantor</TableHead>
                                        <TableHead className="w-[120px]">Tgl Terdaftar</TableHead>
                                        <TableHead className="w-[100px] text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((item, index) => (
                                        <TableRow key={item.id} className={`${item.id === user?.id ? "bg-primary/5" : ""} hover:bg-muted/30 transition-colors`}>
                                            <TableCell className="text-center font-mono text-xs text-muted-foreground">{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center text-primary font-bold">
                                                        {item.full_name?.charAt(0) || <UserCircle className="h-6 w-6" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm flex items-center gap-1.5">
                                                            {item.full_name || "Tanpa Nama"}
                                                            {item.id === user?.id && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">ANDA</span>}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground lowercase">{item.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getRoleBadge(item.role)}</TableCell>
                                            <TableCell>
                                                {item.offices?.name ? (
                                                    <div className="flex items-center gap-2 group cursor-help">
                                                        <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                                            <Building2 className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-sm font-medium group-hover:text-primary transition-colors">{item.offices.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                                            <ShieldCheck className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-sm font-medium">Kantor Pusat</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs font-medium text-muted-foreground font-mono">
                                                {item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors">
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-30"
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
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
