import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { styles } from "@/lib/styles"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { Label } from "@/components/ui/Label"
import { supabase } from "@/lib/supabase"
import { Loader2, Mail, MapPin, Phone, Instagram, Save, Building2 } from "lucide-react"

export function ProfilKantor() {
    const { profile, isCabangAdmin, isSuperAdminPusat, loading: authLoading } = useAuth()
    const [officeData, setOfficeData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        kontak_whatsapp: "",
        link_instagram: ""
    })
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    useEffect(() => {
        if (!authLoading && profile?.office_id) {
            fetchOfficeData()
        }
    }, [authLoading, profile?.office_id])

    async function fetchOfficeData() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('offices')
                .select('*')
                .eq('id', profile.office_id)
                .single()

            if (error) throw error

            setOfficeData(data)
            setFormData({
                kontak_whatsapp: data.kontak_whatsapp || "",
                link_instagram: data.link_instagram || ""
            })
        } catch (err) {
            console.error("Fetch Error:", err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        if (!isCabangAdmin && !isSuperAdminPusat) return

        try {
            setSaving(true)
            setError("")
            const { error } = await supabase
                .from('offices')
                .update({
                    kontak_whatsapp: formData.kontak_whatsapp,
                    link_instagram: formData.link_instagram
                })
                .eq('id', profile.office_id)

            if (error) throw error
            setSuccess("Profil berhasil diperbarui")
            setTimeout(() => setSuccess(""), 3000)

            // Refresh data
            fetchOfficeData()
        } catch (err) {
            console.error("Save Error:", err)
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const canEdit = isCabangAdmin || isSuperAdminPusat

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        {officeData?.name || "Profil Kantor Cabang"}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Manajemen informasi dan kontak kantor Cabang ASABRI
                    </p>
                </div>
                {canEdit && (
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="shadow-lg shadow-primary/20 transition-all hover:scale-105"
                    >
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Simpan Perubahan
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Info Utama */}
                <Card className="lg:col-span-1 overflow-hidden border-none shadow-xl bg-gradient-to-b from-card to-background">
                    <div className="h-32 bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center border-b border-border/50">
                        <div className="p-4 rounded-2xl bg-background shadow-inner">
                            <Building2 className="h-12 w-12 text-primary" />
                        </div>
                    </div>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="bg-muted/30 p-4 rounded-xl space-y-1">
                                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Kode Kantor</Label>
                                <p className="text-lg font-mono font-bold text-primary">{officeData?.kode_kantor || "-"}</p>
                            </div>

                            <div className="bg-muted/30 p-4 rounded-xl space-y-1">
                                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Wilayah / Regional</Label>
                                <p className="text-lg font-bold">{officeData?.wilayah || "-"}</p>
                            </div>

                            <div className="bg-muted/30 p-4 rounded-xl space-y-1">
                                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Alamat Kantor</Label>
                                <div className="flex items-start gap-3 mt-1">
                                    <div className="mt-1 p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                                        <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <p className="text-sm leading-relaxed font-medium">
                                        {officeData?.alamat || "Alamat belum diinput secara lengkap."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Section */}
                <Card className="lg:col-span-2 border-none shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                    <CardContent className="p-8 space-y-8">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Phone className="h-5 w-5 text-green-500" />
                                Kontak & Media Sosial
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Informasi ini akan ditampilkan pada profil publik kantor cabang.
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 animate-in slide-in-from-top-2">
                                <span className="h-2 w-2 rounded-full bg-red-500" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30 animate-in slide-in-from-top-2">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                <p className="text-sm font-medium">{success}</p>
                            </div>
                        )}

                        <div className="grid gap-8">
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">WhatsApp Bisnis</Label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 transition-colors group-focus-within:bg-green-600 group-focus-within:text-white">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <Input
                                        className="pl-12 h-12 bg-muted/20 border-border/50 focus:border-green-500/50 focus:ring-green-500/10 rounded-xl transition-all"
                                        value={formData.kontak_whatsapp}
                                        onChange={e => setFormData({ ...formData, kontak_whatsapp: e.target.value })}
                                        placeholder="Contoh: 0812XXXXXXXX"
                                        disabled={!canEdit}
                                    />
                                    {formData.kontak_whatsapp && (
                                        <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1.5 px-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            Active Link Preview: <span className="underline select-all">wa.me/{formData.kontak_whatsapp.replace(/[^0-9]/g, '')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Username / Link Instagram</Label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 transition-colors group-focus-within:bg-pink-600 group-focus-within:text-white">
                                        <Instagram className="h-4 w-4" />
                                    </div>
                                    <Input
                                        className="pl-12 h-12 bg-muted/20 border-border/50 focus:border-pink-500/50 focus:ring-pink-500/10 rounded-xl transition-all"
                                        value={formData.link_instagram}
                                        onChange={e => setFormData({ ...formData, link_instagram: e.target.value })}
                                        placeholder="@username_cabang"
                                        disabled={!canEdit}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 flex gap-4 items-start">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                <Mail className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Tips Optimasi Profil</p>
                                <p className="text-xs text-blue-700/70 dark:text-blue-300/50 leading-relaxed">
                                    Pastikan kontak WhatsApp selalu aktif dan link Instagram menggunakan akun resmi kantor cabang untuk meningkatkan verifikasi Monitoring Commando Pusat.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
