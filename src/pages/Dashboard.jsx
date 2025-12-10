import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { useData } from "@/context/DataContext"
import { FileText, Megaphone, TrendingUp, BarChart3, ArrowUpRight, Filter } from "lucide-react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']

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
    }, [selectedYear, allPressData, allCommandoData])

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

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Siaran Pers</p>
                                <h3 className="text-3xl font-bold mt-1">{stats.totalPressReleases}</h3>
                                <p className="text-xs text-green-500 flex items-center mt-1">
                                    <ArrowUpRight className="h-3 w-3 mr-1" />
                                    {stats.pressThisMonth} bulan ini
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total COMMANDO</p>
                                <h3 className="text-3xl font-bold mt-1">{stats.totalCommando}</h3>
                                <p className="text-xs text-green-500 flex items-center mt-1">
                                    <ArrowUpRight className="h-3 w-3 mr-1" />
                                    {stats.commandoThisMonth} bulan ini
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Megaphone className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Jenis Rilis</p>
                                <h3 className="text-3xl font-bold mt-1">{stats.pressTypes.length}</h3>
                                <p className="text-xs text-muted-foreground mt-1">kategori berbeda</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <BarChart3 className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Platform Media</p>
                                <h3 className="text-3xl font-bold mt-1">{stats.commandoMedia.length}</h3>
                                <p className="text-xs text-muted-foreground mt-1">platform aktif</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-orange-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Trend Chart */}
            <Card>
                <CardHeader><CardTitle className="text-base">Tren Publikasi Bulanan {selectedYear && `(${selectedYear})`}</CardTitle></CardHeader>
                <CardContent>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                                <Legend />
                                <Bar dataKey="press" name="Siaran Pers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="commando" name="COMMANDO" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Pie Charts Row */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500" />Jenis Rilis Siaran Pers</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.pressTypes} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                                        {stats.pressTypes.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#c7cedaff', border: '1px solid #374151', borderRadius: '8px' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4 text-purple-500" />Jenis Konten COMMANDO</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.commandoJenis} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                                        {stats.commandoJenis.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#c7cedaff', border: '1px solid #374151', borderRadius: '8px' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Kategori AGSET */}
            <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4 text-orange-500" />Kategori AGSET BUMN</CardTitle></CardHeader>
                <CardContent>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.commandoCategories} layout="vertical" margin={{ left: 100 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis type="number" stroke="#9ca3af" />
                                <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} width={100} />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                                <Bar dataKey="value" name="Jumlah" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Platform Distribution */}
            <Card>
                <CardHeader><CardTitle className="text-base">Distribusi Platform COMMANDO</CardTitle></CardHeader>
                <CardContent>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.commandoMedia} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                                    {stats.commandoMedia.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#c7cedaff', border: '1px solid #374151', borderRadius: '8px' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

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
        </div>
    )
}
