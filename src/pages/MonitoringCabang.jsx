import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"
import { getOffices, supabase } from "@/lib/supabase"
import { Building2, Search, MapPin, Phone, Users, RefreshCw, Calendar, Share2, FileText, CheckCircle2, Clock, Zap } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { useNavigate } from "react-router-dom"
import { Map, MapControls, MapMarker, MarkerTooltip, MarkerContent } from "@/components/ui/map"
import "maplibre-gl/dist/maplibre-gl.css"

export function MonitoringCabang() {
    const [offices, setOffices] = useState([])
    const [stats, setStats] = useState({})
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const toast = useToast()
    const navigate = useNavigate()

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            const { data: officesList, error: officeError } = await getOffices()
            if (officeError) throw officeError
            setOffices(officesList || [])

            // Fetch Aggregate Stats Per Branch
            const statsMap = {}

            // Promise all to fetch counts from multiple tables
            const tables = ['media_plans', 'social_posts', 'news_plans', 'news_monitoring', 'assets']
            const results = await Promise.all(tables.map(table =>
                supabase
                    .from(table)
                    .select('office_id, updated_at')
            ))

            tables.forEach((table, index) => {
                const data = results[index].data || []
                data.forEach(item => {
                    if (!item.office_id) return
                    if (!statsMap[item.office_id]) {
                        statsMap[item.office_id] = {
                            media_plans: 0,
                            social_posts: 0,
                            news_plans: 0,
                            news_monitoring: 0,
                            assets: 0,
                            last_activity: null
                        }
                    }
                    statsMap[item.office_id][table]++

                    const itemDate = new Date(item.updated_at)
                    if (!statsMap[item.office_id].last_activity || itemDate > statsMap[item.office_id].last_activity) {
                        statsMap[item.office_id].last_activity = itemDate
                    }
                })
            })

            setStats(statsMap)
        } catch (error) {
            console.error("Error fetching dashboard data:", error)
            toast.error("Gagal memuat data monitoring")
        }
        setLoading(false)
    }

    const filteredOffices = offices.filter(office =>
        office.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (office.city || "").toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Monitoring Cabang</h1>
                    <p className="text-sm text-muted-foreground">Pantau aktivitas dan status kantor cabang</p>
                </div>
                <Button variant="outline" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Cari kantor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Summary Cards with Gradients */}
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-600/80">Total Kantor</p>
                            <h3 className="text-2xl font-bold text-blue-900">{offices.length}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/20">
                            <Zap className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-purple-600/80">Aktif (7 Hari)</p>
                            <h3 className="text-2xl font-bold text-purple-900">
                                {offices.filter(o => {
                                    const last = stats[o.id]?.last_activity
                                    if (!last) return false
                                    const diff = new Date() - new Date(last)
                                    return diff < 7 * 24 * 60 * 60 * 1000
                                }).length}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/50">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/20">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-green-600/80">Media Plan Selesai</p>
                            <h3 className="text-2xl font-bold text-green-900">
                                {Object.values(stats).reduce((acc, s) => acc + (s.media_plans || 0), 0)}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200/50">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20">
                            <Share2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-amber-600/80">Total Konten</p>
                            <h3 className="text-2xl font-bold text-amber-900">
                                {Object.values(stats).reduce((acc, s) => acc + (s.social_posts || 0), 0)}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kantor Cabang</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="w-[250px]">Kantor Cabang</TableHead>
                                    <TableHead>Media Plan</TableHead>
                                    <TableHead>Social Media</TableHead>
                                    <TableHead>Pemberitaan</TableHead>
                                    <TableHead>Aset</TableHead>
                                    <TableHead>Last Activity</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOffices.length > 0 ? (
                                    filteredOffices.map((office) => {
                                        const officeStats = stats[office.id] || {}
                                        const lastActivity = officeStats.last_activity

                                        return (
                                            <TableRow key={office.id} className="hover:bg-muted/20 transition-colors">
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-semibold text-foreground border-l-2 border-primary pl-2">
                                                            {office.name}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider pl-2">
                                                            <MapPin className="h-3 w-3" />
                                                            {office.city || "N/A"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="font-medium">{officeStats.media_plans || 0}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
                                                            <Share2 className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="font-medium">{officeStats.social_posts || 0}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-green-50 text-green-600 rounded-md">
                                                            <FileText className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="font-medium">
                                                            {(officeStats.news_plans || 0) + (officeStats.news_monitoring || 0)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
                                                            <Zap className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="font-medium">{officeStats.assets || 0}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {lastActivity ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                                                <Clock className="h-3 w-3 text-green-500" />
                                                                {formatDistanceToNow(lastActivity, { addSuffix: true, locale: id })}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground italic">
                                                                {new Date(lastActivity).toLocaleDateString('id-ID')}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Belum ada aktivitas
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" className="bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/30 text-primary h-8" onClick={() => {
                                                        navigate(`/dashboard?office=${office.id}`)
                                                    }}>
                                                        Detail CMS
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data kantor ditemukan
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
