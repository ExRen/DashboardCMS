import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { useData } from "@/context/DataContext"
import { KPITargets } from "@/components/dashboard/KPITargets"
import { FileText, Megaphone, TrendingUp, BarChart3, ArrowUpRight, Filter, Calendar } from "lucide-react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { getMediaPlans } from "@/lib/supabase"

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']


const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
                {label && <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">{label}</p>}
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill }} />
                        <span className="text-slate-600 dark:text-slate-400 capitalize">{entry.name}:</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                            {new Intl.NumberFormat('id-ID').format(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

export function Dashboard() {
    const { pressReleases, commandoContents, loading: dataLoading, fetchAll } = useData()
    const [selectedYear, setSelectedYear] = useState("")
    const [yearOptions, setYearOptions] = useState([])
    const [allPressData, setAllPressData] = useState([])
    const [allCommandoData, setAllCommandoData] = useState([])
    const [stats, setStats] = useState({
        totalPressReleases: 0,
        totalCommando: 0,
        pressThisMonth: 0,
        commandoThisMonth: 0,
        pressTypes: [],
        commandoMedia: [],
        commandoJenis: [],
        commandoCategories: [],
        recentPress: [],
        recentCommando: [],
        monthlyData: []
    })
    const [upcomingMediaPlans, setUpcomingMediaPlans] = useState([])
    const [loading, setLoading] = useState(true)

    // Use cached data from context
    useEffect(() => {
        if (pressReleases.length > 0 || commandoContents.length > 0) {
            setAllPressData(pressReleases)
            setAllCommandoData(commandoContents)
            // Extract unique years
            const pressYears = pressReleases.map(p => p.year).filter(Boolean)
            const commandoYears = commandoContents.map(c => c.year).filter(Boolean)
            const allYears = [...new Set([...pressYears, ...commandoYears])].sort((a, b) => b - a)
            setYearOptions(allYears)
            setLoading(false)
        } else if (!dataLoading.press && !dataLoading.commando) {
            fetchAll()
        }
    }, [pressReleases, commandoContents, dataLoading])

    useEffect(() => {
        if (allPressData.length || allCommandoData.length) {
            calculateStats()
        }
        fetchUpcomingMediaPlans()
    }, [selectedYear, allPressData, allCommandoData])

    async function fetchUpcomingMediaPlans() {
        try {
            const today = new Date()
            const year = today.getFullYear()
            const monthIndex = today.getMonth() // 0-11
            const monthNames = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"]
            const currentMonth = monthNames[monthIndex]

            // Fetch upcoming plans (future dates or current month)
            const { data } = await getMediaPlans({ limit: 100 })

            if (data) {
                // Filter client-side for simplicity (ideal: server-side filter)
                const upcoming = data.filter(plan => {
                    if (!plan.scheduled_date) return false
                    const planDate = new Date(plan.scheduled_date)
                    return planDate >= new Date(today.setHours(0, 0, 0, 0))
                }).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date)).slice(0, 5)

                setUpcomingMediaPlans(upcoming)
            }
        } catch (error) {
            console.error("Failed to fetch media plans", error)
        }
    }

    function calculateStats() {
        let pressData = [...allPressData]
        let commandoData = [...allCommandoData]

        // Apply year filter
        if (selectedYear) {
            const year = parseInt(selectedYear)
            pressData = pressData.filter(p => p.year === year)
            commandoData = commandoData.filter(c => c.year === year)
        }

        // Press JENIS RILIS distribution
        const pressTypes = {}
        pressData.forEach(p => {
            const type = p["JENIS RILIS"]
            if (type) pressTypes[type] = (pressTypes[type] || 0) + 1
        })

        // COMMANDO MEDIA distribution
        const commandoMedia = {}
        commandoData.forEach(c => {
            const media = c["MEDIA"]
            if (media) commandoMedia[media] = (commandoMedia[media] || 0) + 1
        })

        // COMMANDO JENIS KONTEN
        const commandoJenis = {}
        commandoData.forEach(c => {
            const jenis = c["JENIS KONTEN"]
            if (jenis) commandoJenis[jenis] = (commandoJenis[jenis] || 0) + 1
        })

        // COMMANDO KATEGORI
        const commandoCategories = {}
        commandoData.forEach(c => {
            const cat = c["KATEGORI DALAM AGSET BUMN"]
            if (cat) commandoCategories[cat] = (commandoCategories[cat] || 0) + 1
        })

        // Monthly data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
        const monthMap = {
            'Januari': 'Jan', 'Februari': 'Feb', 'Maret': 'Mar', 'April': 'Apr',
            'Mei': 'Mei', 'Juni': 'Jun', 'Juli': 'Jul', 'Agustus': 'Agu',
            'September': 'Sep', 'Oktober': 'Okt', 'November': 'Nov', 'Desember': 'Des',
            'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'May': 'Mei',
            'June': 'Jun', 'July': 'Jul', 'August': 'Agu', 'October': 'Okt', 'December': 'Des'
        }

        const monthlyPress = {}
        const monthlyCommando = {}
        months.forEach(m => { monthlyPress[m] = 0; monthlyCommando[m] = 0 })

        pressData.forEach(p => {
            const date = p["TANGGAL TERBIT"] || ""
            Object.keys(monthMap).forEach(month => {
                if (date.includes(month)) monthlyPress[monthMap[month]]++
            })
        })
        commandoData.forEach(c => {
            const date = c["TANGGAL"] || ""
            Object.keys(monthMap).forEach(month => {
                if (date.includes(month)) monthlyCommando[monthMap[month]]++
            })
        })

        const combinedMonthly = months.map(month => ({
            name: month,
            press: monthlyPress[month],
            commando: monthlyCommando[month]
        }))

        setStats({
            totalPressReleases: pressData.length,
            totalCommando: commandoData.length,
            pressThisMonth: monthlyPress['Nov'] + monthlyPress['Des'],
            commandoThisMonth: monthlyCommando['Nov'] + monthlyCommando['Des'],
            pressTypes: Object.entries(pressTypes).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6),
            commandoMedia: Object.entries(commandoMedia).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6),
            commandoJenis: Object.entries(commandoJenis).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8),
            commandoCategories: Object.entries(commandoCategories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8),
            recentPress: pressData.slice(0, 5),
            recentCommando: commandoData.slice(0, 5),
            monthlyData: combinedMonthly
        })
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
            {/* Year Filter */}
            <Card>
                <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Filter Tahun:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="h-9 px-3 rounded-lg bg-muted border-none text-sm font-medium"
                        >
                            <option value="">Semua Tahun</option>
                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        {selectedYear && (
                            <span className="text-xs text-muted-foreground">
                                Menampilkan data tahun {selectedYear}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* KPI Targets - HIDDEN 
            <KPITargets />
            */}

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Row 1: Key Metrics (Top) */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Siaran Pers</p>
                                <h3 className="text-3xl font-bold mt-2 text-blue-700 dark:text-blue-400">{stats.totalPressReleases}</h3>
                                <p className="text-xs text-green-600 flex items-center mt-2 bg-green-100 dark:bg-green-900/30 w-fit px-2 py-1 rounded-full">
                                    <ArrowUpRight className="h-3 w-3 mr-1" />
                                    {stats.pressThisMonth} bulan ini
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-card border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total COMMANDO</p>
                                <h3 className="text-3xl font-bold mt-2 text-purple-700 dark:text-purple-400">{stats.totalCommando}</h3>
                                <p className="text-xs text-green-600 flex items-center mt-2 bg-green-100 dark:bg-green-900/30 w-fit px-2 py-1 rounded-full">
                                    <ArrowUpRight className="h-3 w-3 mr-1" />
                                    {stats.commandoThisMonth} bulan ini
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                                <Megaphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Media Plan Widget */}
                <Card className="col-span-1 md:col-span-4 lg:col-span-2 row-span-2 border-none shadow-sm bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/20 dark:to-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-indigo-500" />
                            Media Plan Terdekat
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 mt-2">
                            {upcomingMediaPlans.length > 0 ? (
                                upcomingMediaPlans.map((plan, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                                            <span className="text-xs font-bold uppercase">{plan.bulan?.substring(0, 3)}</span>
                                            <span className="text-lg font-bold">{plan.tanggal}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium line-clamp-2 leading-snug">{plan.rencana_pemberitaan}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                                                    {plan.kategori}
                                                </span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${plan.status === 'Published' ? 'bg-green-100 text-green-700' :
                                                    plan.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {plan.status || 'Planned'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Tidak ada rencana media dalam waktu dekat.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Row 2: Secondary Metrics */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Jenis Rilis</p>
                                <h3 className="text-3xl font-bold mt-2">{stats.pressTypes.length}</h3>
                                <p className="text-xs text-muted-foreground mt-1">kategori berbeda</p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Platform Media</p>
                                <h3 className="text-3xl font-bold mt-2">{stats.commandoMedia.length}</h3>
                                <p className="text-xs text-muted-foreground mt-1">platform aktif</p>
                            </div>
                            <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* CHART SECTION: Distribution Analysis (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Jenis Rilis Siaran Pers */}
                <Card className="border-none shadow-sm">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500" />Jenis Rilis Siaran Pers</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.pressTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                                        {stats.pressTypes.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Jenis Konten COMMANDO */}
                <Card className="border-none shadow-sm">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4 text-purple-500" />Jenis Konten COMMANDO</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.commandoJenis} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                                        {stats.commandoJenis.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Platform Distribution */}
                <Card className="border-none shadow-sm">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-orange-500" />Platform Media</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.commandoMedia} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                                        {stats.commandoMedia.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* CHART SECTION: Performance & Trends (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Tren Bulanan */}
                <Card className="border-none shadow-sm">
                    <CardHeader><CardTitle className="text-base">Tren Publikasi Bulanan {selectedYear && `(${selectedYear})`}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Legend />
                                    <Bar dataKey="press" name="Siaran Pers" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                                    <Bar dataKey="commando" name="COMMANDO" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Kategori AGSET */}
                <Card className="border-none shadow-sm">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4 text-orange-500" />Kategori AGSET BUMN</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.commandoCategories} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                                    <XAxis type="number" stroke="#9ca3af" tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={11} width={150} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" name="Jumlah" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Tables */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="text-base">Siaran Pers Terbaru</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead className="w-[60px]">No</TableHead><TableHead>Judul</TableHead><TableHead className="w-[100px]">Jenis</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {stats.recentPress.map((pr, index) => (
                                    <TableRow key={pr.id || index}>
                                        <TableCell>{pr["NO"] || "-"}</TableCell>
                                        <TableCell className="max-w-[200px]"><span className="line-clamp-1">{pr["JUDUL SIARAN PERS"] || "-"}</span></TableCell>
                                        <TableCell><span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">{pr["JENIS RILIS"] || "-"}</span></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base">Konten COMMANDO Terbaru</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Judul</TableHead><TableHead className="w-[80px]">Media</TableHead><TableHead className="w-[80px]">Jenis</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {stats.recentCommando.map((c, index) => (
                                    <TableRow key={c.id || index}>
                                        <TableCell className="max-w-[200px]"><span className="line-clamp-1">{c["JUDUL KONTEN"] || "-"}</span></TableCell>
                                        <TableCell className="text-sm">{c["MEDIA"] || "-"}</TableCell>
                                        <TableCell><span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-500">{c["JENIS KONTEN"] || "-"}</span></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
