import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { useData } from "@/context/DataContext"
import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap"
import { MediaPerformance } from "@/components/analytics/MediaPerformance"
import { PressReleaseAnalytics } from "@/components/analytics/PressReleaseAnalytics"
import { SocialMediaAnalytics } from "@/components/analytics/SocialMediaAnalytics"
import { MonthlyReportGenerator } from "@/components/ui/MonthlyReportGenerator"
import { BackupManager } from "@/components/ui/BackupManager"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts"
import { Filter, Trophy, Users, TrendingUp, TrendingDown, Medal, Award, Crown, Star, Zap, Target, LayoutGrid, FileText, Share2, Megaphone } from "lucide-react"

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#14b8a6', '#f43f5e']

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
                {label && <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">{label}</p>}
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill || entry.stroke }} />
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

export function Analytics() {
    const { pressReleases, commandoContents, loading: dataLoading, fetchAll } = useData()
    const [pressData, setPressData] = useState([])
    const [commandoData, setCommandoData] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedYear, setSelectedYear] = useState("")
    const [compareMode, setCompareMode] = useState(false)
    const [activeTab, setActiveTab] = useState("overview")

    useEffect(() => {
        if (pressReleases.length > 0 || commandoContents.length > 0) {
            setPressData(pressReleases)
            setCommandoData(commandoContents)
            setLoading(false)
        } else if (!dataLoading.press && !dataLoading.commando) {
            fetchAll()
        }
    }, [pressReleases, commandoContents, dataLoading])

    const filteredPress = selectedYear ? pressData.filter(p => p.year === parseInt(selectedYear)) : pressData
    const filteredCommando = selectedYear ? commandoData.filter(c => c.year === parseInt(selectedYear)) : commandoData

    const yearOptions = [...new Set([...pressData.map(p => p.year), ...commandoData.map(c => c.year)].filter(Boolean))].sort((a, b) => b - a)

    const creatorStats = {}
    filteredCommando.forEach(c => {
        const creator = c["CREATOR"] || "Tidak Diketahui"
        if (!creatorStats[creator]) creatorStats[creator] = { name: creator, total: 0, platforms: {}, types: {} }
        creatorStats[creator].total++
        const platform = c["MEDIA"] || "Lain-lain"
        creatorStats[creator].platforms[platform] = (creatorStats[creator].platforms[platform] || 0) + 1
        const type = c["JENIS KONTEN"] || "Lain-lain"
        creatorStats[creator].types[type] = (creatorStats[creator].types[type] || 0) + 1
    })
    const creatorLeaderboard = Object.values(creatorStats)
        .filter(c => c.name !== "Tidak Diketahui")
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
        .map((c, i) => ({ ...c, rank: i + 1, topPlatform: Object.entries(c.platforms).sort((a, b) => b[1] - a[1])[0]?.[0] || "-" }))

    const writerStats = {}
    filteredPress.forEach(p => {
        const writer = p["WRITER CORCOMM"] || "Tidak Diketahui"
        if (!writerStats[writer]) writerStats[writer] = { name: writer, total: 0, types: {} }
        writerStats[writer].total++
        const type = p["JENIS RILIS"] || "Lain-lain"
        writerStats[writer].types[type] = (writerStats[writer].types[type] || 0) + 1
    })
    const writerLeaderboard = Object.values(writerStats)
        .filter(w => w.name !== "Tidak Diketahui")
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
        .map((w, i) => ({ ...w, rank: i + 1, topType: Object.entries(w.types).sort((a, b) => b[1] - a[1])[0]?.[0] || "-" }))

    // Media Performance Data
    const platformStats = {}
    filteredCommando.forEach(c => {
        const platform = c["MEDIA"] || "Tidak Diketahui"
        if (!platformStats[platform]) platformStats[platform] = { name: platform, total: 0, creators: new Set(), types: {} }
        platformStats[platform].total++
        platformStats[platform].creators.add(c["CREATOR"] || "unknown")
    })
    const platformData = Object.values(platformStats)
        .filter(p => p.name !== "Tidak Diketahui")
        .map(p => ({ name: p.name, total: p.total, creators: p.creators.size, avgPerCreator: Math.round(p.total / p.creators.size) }))
        .sort((a, b) => b.total - a.total)

    const year2024Press = pressData.filter(p => p.year === 2024).length
    const year2025Press = pressData.filter(p => p.year === 2025).length
    const year2024Commando = commandoData.filter(c => c.year === 2024).length
    const year2025Commando = commandoData.filter(c => c.year === 2025).length
    const pressGrowth = year2024Press > 0 ? Math.round((year2025Press - year2024Press) / year2024Press * 100) : 0
    const commandoGrowth = year2024Commando > 0 ? Math.round((year2025Commando - year2024Commando) / year2024Commando * 100) : 0

    const yearComparisonData = [
        { name: '2024', press: year2024Press, commando: year2024Commando },
        { name: '2025', press: year2025Press, commando: year2025Commando }
    ]

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const monthMap = { 'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11 }
    const monthlyByYear = { 2024: {}, 2025: {} }
    months.forEach(m => { monthlyByYear[2024][m] = 0; monthlyByYear[2025][m] = 0 })

    commandoData.forEach(c => {
        const date = c["TANGGAL"] || ""
        const year = c.year || 2024
        Object.keys(monthMap).forEach(month => {
            if (date.includes(month) && monthlyByYear[year]) {
                monthlyByYear[year][months[monthMap[month]]]++
            }
        })
    })

    const monthlyCompareData = months.map(m => ({
        name: m,
        '2024': monthlyByYear[2024][m] || 0,
        '2025': monthlyByYear[2025][m] || 0
    }))

    const getRankIcon = (rank) => {
        if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
        if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
        if (rank === 3) return <Award className="h-5 w-5 text-orange-600" />
        return <span className="text-sm font-medium text-muted-foreground">{rank}</span>
    }

    const tabs = [
        { id: "overview", label: "Overview", icon: LayoutGrid },
        { id: "press", label: "Siaran Pers", icon: FileText },
        { id: "social", label: "Media Sosial", icon: Share2 }
    ]

    if (loading) return <div className="flex items-center justify-center h-full"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div><p className="text-sm text-muted-foreground mt-2">Memuat analytics...</p></div></div>

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex gap-1 p-1 bg-muted rounded-lg">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-4">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="h-9 px-3 rounded-lg bg-muted border-none text-sm">
                                <option value="">Semua Tahun</option>
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            {activeTab === "overview" && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={compareMode} onChange={(e) => setCompareMode(e.target.checked)} className="rounded" />
                                    <span className="text-sm">Perbandingan Tahun</span>
                                </label>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {activeTab === "press" && <PressReleaseAnalytics data={pressData} selectedYear={selectedYear} />}
            {activeTab === "social" && <SocialMediaAnalytics data={commandoData} selectedYear={selectedYear} />}

            {activeTab === "overview" && (
                <div className="space-y-4">
                    {/* ROW 1: Key Metrics */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{filteredPress.length}</div>
                                        <p className="text-sm font-medium text-muted-foreground">Siaran Pers</p>
                                    </div>
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                {year2024Press > 0 && (
                                    <div className={`flex items-center gap-1 text-xs mt-2 font-medium ${pressGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {pressGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {Math.abs(pressGrowth)}% dari tahun lalu
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{filteredCommando.length}</div>
                                        <p className="text-sm font-medium text-muted-foreground">Total COMMANDO</p>
                                    </div>
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Megaphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                                {year2024Commando > 0 && (
                                    <div className={`flex items-center gap-1 text-xs mt-2 font-medium ${commandoGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {commandoGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {Math.abs(commandoGrowth)}% dari tahun lalu
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">{writerLeaderboard.length}</div>
                                        <p className="text-sm font-medium text-muted-foreground">Writer Aktif</p>
                                    </div>
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{creatorLeaderboard.length}</div>
                                        <p className="text-sm font-medium text-muted-foreground">Creator Aktif</p>
                                    </div>
                                    <div className="p-2 bg-orange-500/20 rounded-lg">
                                        <Star className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ROW 2: Activity & Media Performance */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <ActivityHeatmap data={filteredCommando} dateField="TANGGAL" year={selectedYear ? parseInt(selectedYear) : new Date().getFullYear()} />
                        <MediaPerformance data={filteredCommando} mediaField="MEDIA" />
                    </div>

                    {/* ROW 3: Donut Charts - Content Types, Scopes, & Platform */}
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* 1. Content Type Distribution */}
                        <Card className="shadow-sm">
                            <CardHeader><CardTitle className="text-base text-center">Distribusi Jenis Konten</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={Object.entries(filteredCommando.reduce((acc, c) => { const k = c["JENIS KONTEN"] || "Lainnya"; acc[k] = (acc[k] || 0) + 1; return acc }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                                                {Array(8).fill(0).map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Press Release Scope Distribution */}
                        <Card className="shadow-sm">
                            <CardHeader><CardTitle className="text-base text-center">Distribusi Lingkup Siaran Pers</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={Object.entries(filteredPress.reduce((acc, p) => { const k = p["LINGKUP"] || "Lainnya"; acc[k] = (acc[k] || 0) + 1; return acc }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                                                {Array(8).fill(0).map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. Platform Distribution */}
                        <Card className="shadow-sm">
                            <CardHeader><CardTitle className="text-base text-center">Distribusi Platform</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={platformData.map(p => ({ name: p.name, value: p.total }))} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                                                {platformData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ROW 4: Leaderboards */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-yellow-500" />
                                    Top Creator COMMANDO
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">Rank</TableHead>
                                            <TableHead>Creator</TableHead>
                                            <TableHead className="text-right">Konten</TableHead>
                                            <TableHead className="hidden md:table-cell">Platform Utama</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {creatorLeaderboard.map((creator) => (
                                            <TableRow key={creator.name} className={creator.rank <= 3 ? "bg-yellow-500/5" : ""}>
                                                <TableCell className="font-medium">{getRankIcon(creator.rank)}</TableCell>
                                                <TableCell className="font-medium">
                                                    <div>{creator.name}</div>
                                                    <div className="text-xs text-muted-foreground">{creator.topPlatform}</div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold">{creator.total}</TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{creator.topPlatform}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    Top Writer Siaran Pers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">Rank</TableHead>
                                            <TableHead>Writer</TableHead>
                                            <TableHead className="text-right">Rilis</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {writerLeaderboard.map((writer) => (
                                            <TableRow key={writer.name} className={writer.rank <= 3 ? "bg-blue-500/5" : ""}>
                                                <TableCell className="font-medium">{getRankIcon(writer.rank)}</TableCell>
                                                <TableCell className="font-medium">
                                                    <div>{writer.name}</div>
                                                    <div className="text-xs text-muted-foreground">{writer.topType}</div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold">{writer.total}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ROW 5. Management Tools */}
                    <div className="py-4 border-t border-dashed">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Management Console</h4>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                            <MonthlyReportGenerator pressData={pressData} commandoData={commandoData} />
                            <BackupManager />
                        </div>
                    </div>

                    {/* Year Comparison (Only in Compare Mode) - Placed at bottom or as requested */}
                    {compareMode && (
                        <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t">
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Perbandingan Tahunan</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={yearComparisonData} layout="vertical" margin={{ left: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                <XAxis type="number" stroke="#9ca3af" />
                                                <YAxis type="category" dataKey="name" stroke="#9ca3af" />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />
                                                <Bar dataKey="press" name="Siaran Pers" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                                <Bar dataKey="commando" name="COMMANDO" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4" />Tren Bulanan (2024 vs 2025)</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={monthlyCompareData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                                <YAxis stroke="#9ca3af" />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />
                                                <Line type="monotone" dataKey="2024" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                                                <Line type="monotone" dataKey="2025" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
