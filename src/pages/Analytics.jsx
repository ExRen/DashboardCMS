import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { useData } from "@/context/DataContext"
import { TrendAnalysis } from "@/components/dashboard/TrendAnalysis"
import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap"
import { MediaPerformance } from "@/components/analytics/MediaPerformance"
import { PressReleaseAnalytics } from "@/components/analytics/PressReleaseAnalytics"
import { SocialMediaAnalytics } from "@/components/analytics/SocialMediaAnalytics"
import { ReportGenerator } from "@/components/reports/ReportGenerator"
import { BackupManager } from "@/components/ui/BackupManager"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts"
import { Filter, Trophy, Users, TrendingUp, TrendingDown, Medal, Award, Crown, Star, Zap, Target, LayoutGrid, FileText, Share2 } from "lucide-react"

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#14b8a6', '#f43f5e']

export function Analytics() {
    const { pressReleases, commandoContents, loading: dataLoading, fetchAll } = useData()
    const [pressData, setPressData] = useState([])
    const [commandoData, setCommandoData] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedYear, setSelectedYear] = useState("")
    const [compareMode, setCompareMode] = useState(false)
    const [activeTab, setActiveTab] = useState("overview")

    // Use cached data from context
    useEffect(() => {
        if (pressReleases.length > 0 || commandoContents.length > 0) {
            setPressData(pressReleases)
            setCommandoData(commandoContents)
            setLoading(false)
        } else if (!dataLoading.press && !dataLoading.commando) {
            fetchAll()
        }
    }, [pressReleases, commandoContents, dataLoading])

    // Filter by year
    const filteredPress = selectedYear ? pressData.filter(p => p.year === parseInt(selectedYear)) : pressData
    const filteredCommando = selectedYear ? commandoData.filter(c => c.year === parseInt(selectedYear)) : commandoData

    const yearOptions = [...new Set([...pressData.map(p => p.year), ...commandoData.map(c => c.year)].filter(Boolean))].sort((a, b) => b - a)

    // Creator Leaderboard
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

    // Writer Leaderboard
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

    // Platform Performance
    const platformStats = {}
    filteredCommando.forEach(c => {
        const platform = c["MEDIA"] || "Tidak Diketahui"
        if (!platformStats[platform]) platformStats[platform] = { name: platform, total: 0, creators: new Set(), types: {} }
        platformStats[platform].total++
        platformStats[platform].creators.add(c["CREATOR"] || "unknown")
        const type = c["JENIS KONTEN"] || "Lain-lain"
        platformStats[platform].types[type] = (platformStats[platform].types[type] || 0) + 1
    })
    const platformData = Object.values(platformStats)
        .filter(p => p.name !== "Tidak Diketahui")
        .map(p => ({ name: p.name, total: p.total, creators: p.creators.size, avgPerCreator: Math.round(p.total / p.creators.size) }))
        .sort((a, b) => b.total - a.total)

    // Year Comparison
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

    // Monthly Trend by Year
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
            {/* Tab Navigation & Filter */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Tabs */}
                        <div className="flex gap-1 p-1 bg-muted rounded-lg">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Filters */}
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

            {/* Tab Content */}
            {activeTab === "press" && (
                <PressReleaseAnalytics data={pressData} selectedYear={selectedYear} />
            )}

            {activeTab === "social" && (
                <SocialMediaAnalytics data={commandoData} selectedYear={selectedYear} />
            )}

            {activeTab === "overview" && (
                <>
                    {/* Stats Summary */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-bold text-blue-500">{filteredPress.length}</div>
                                        <p className="text-sm text-muted-foreground">Siaran Pers</p>
                                    </div>
                                    {year2024Press > 0 && (
                                        <div className={`flex items-center gap-1 text-sm ${pressGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {pressGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                            {Math.abs(pressGrowth)}%
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-bold text-purple-500">{filteredCommando.length}</div>
                                        <p className="text-sm text-muted-foreground">COMMANDO</p>
                                    </div>
                                    {year2024Commando > 0 && (
                                        <div className={`flex items-center gap-1 text-sm ${commandoGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {commandoGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                            {Math.abs(commandoGrowth)}%
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                            <CardContent className="pt-6">
                                <div className="text-3xl font-bold text-green-500">{writerLeaderboard.length}</div>
                                <p className="text-sm text-muted-foreground">Writer Aktif</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                            <CardContent className="pt-6">
                                <div className="text-3xl font-bold text-orange-500">{creatorLeaderboard.length}</div>
                                <p className="text-sm text-muted-foreground">Creator Aktif</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Activity Heatmap - Kalender Aktivitas */}
                    <ActivityHeatmap data={filteredCommando} dateField="TANGGAL" year={selectedYear ? parseInt(selectedYear) : new Date().getFullYear()} />

                    {/* Media Performance - Charts per Platform */}
                    <MediaPerformance data={filteredCommando} mediaField="MEDIA" />

                    {/* Year Comparison - Only show when in compare mode */}
                    {compareMode && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Perbandingan Tahunan</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={yearComparisonData} layout="vertical" margin={{ left: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                <XAxis type="number" stroke="#9ca3af" />
                                                <YAxis type="category" dataKey="name" stroke="#9ca3af" />
                                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
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
                                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
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

                    {/* Leaderboards */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Creator Leaderboard */}
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
                                                <TableCell className="font-medium">{creator.name}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-500/10 text-purple-500 font-bold">
                                                        {creator.total}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{creator.topPlatform}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {creatorLeaderboard.length === 0 && <div className="text-center py-6 text-muted-foreground">Tidak ada data creator</div>}
                            </CardContent>
                        </Card>

                        {/* Writer Leaderboard */}
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
                                            <TableHead className="hidden md:table-cell">Jenis Utama</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {writerLeaderboard.map((writer) => (
                                            <TableRow key={writer.name} className={writer.rank <= 3 ? "bg-blue-500/5" : ""}>
                                                <TableCell className="font-medium">{getRankIcon(writer.rank)}</TableCell>
                                                <TableCell className="font-medium">{writer.name}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-500 font-bold">
                                                        {writer.total}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{writer.topType}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {writerLeaderboard.length === 0 && <div className="text-center py-6 text-muted-foreground">Tidak ada data writer</div>}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Platform Performance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Star className="h-5 w-5 text-orange-500" />
                                Performa Platform Media
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={platformData} layout="vertical" margin={{ left: 80 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis type="number" stroke="#9ca3af" />
                                            <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={80} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                                            <Bar dataKey="total" name="Total Konten" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Platform</TableHead>
                                                <TableHead className="text-right">Konten</TableHead>
                                                <TableHead className="text-right">Creator</TableHead>
                                                <TableHead className="text-right">Rata-rata</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {platformData.slice(0, 6).map((platform, idx) => (
                                                <TableRow key={platform.name}>
                                                    <TableCell className="font-medium flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                        {platform.name}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">{platform.total}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">{platform.creators}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">{platform.avgPerCreator}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Distribution Charts */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle className="text-base">Distribusi Jenis Konten</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={Object.entries(filteredCommando.reduce((acc, c) => { const k = c["JENIS KONTEN"] || "Lainnya"; acc[k] = (acc[k] || 0) + 1; return acc }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                                                {Array(8).fill(0).map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#c7cedaff', border: '1px solid #374151', borderRadius: '8px' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-base">Distribusi Lingkup Siaran Pers</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={Object.entries(filteredPress.reduce((acc, p) => { const k = p["LINGKUP"] || "Lainnya"; acc[k] = (acc[k] || 0) + 1; return acc }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                                                {Array(8).fill(0).map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#c7cedaff', border: '1px solid #374151', borderRadius: '8px' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tools Section */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Report Generator */}
                        <ReportGenerator />

                        {/* Backup Manager */}
                        <BackupManager />
                    </div>
                </>
            )}
        </div>
    )
}
