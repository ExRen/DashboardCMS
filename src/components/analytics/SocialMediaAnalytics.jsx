import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { ActivityHeatmap } from "./ActivityHeatmap"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts"
import { Share2, Users, TrendingUp, Award, Crown, Medal, Smartphone, Video } from "lucide-react"

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#14b8a6', '#f43f5e']

/**
 * SocialMediaAnalytics - Komponen analitik khusus untuk konten sosial media (COMMANDO)
 */
export function SocialMediaAnalytics({ data = [], selectedYear = "" }) {
    const filteredData = selectedYear
        ? data.filter(c => c.year === parseInt(selectedYear))
        : data

    // Monthly Trend
    const monthMap = { 'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11 }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

    const monthlyTrend = useMemo(() => {
        const monthCounts = Array(12).fill(0)
        filteredData.forEach(c => {
            const date = c["TANGGAL"] || ""
            Object.keys(monthMap).forEach(month => {
                if (date.includes(month)) {
                    monthCounts[monthMap[month]]++
                }
            })
        })
        return months.map((m, i) => ({ name: m, value: monthCounts[i] }))
    }, [filteredData])

    // Platform Distribution
    const platformDistribution = useMemo(() => {
        const counts = {}
        filteredData.forEach(c => {
            const platform = c["MEDIA"] || "Lainnya"
            counts[platform] = (counts[platform] || 0) + 1
        })
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8)
    }, [filteredData])

    // Jenis Konten Distribution
    const jenisKontenDistribution = useMemo(() => {
        const counts = {}
        filteredData.forEach(c => {
            const jenis = c["JENIS KONTEN"] || "Lainnya"
            counts[jenis] = (counts[jenis] || 0) + 1
        })
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8)
    }, [filteredData])

    // Media Plan Distribution
    const mediaPlanDistribution = useMemo(() => {
        const counts = {}
        filteredData.forEach(c => {
            const plan = c["JENIS MEDIA PLAN"] || "Lainnya"
            counts[plan] = (counts[plan] || 0) + 1
        })
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10)
    }, [filteredData])

    // Creator Leaderboard
    const creatorLeaderboard = useMemo(() => {
        const stats = {}
        filteredData.forEach(c => {
            const creator = c["CREATOR"] || "Tidak Diketahui"
            if (!stats[creator]) stats[creator] = { name: creator, total: 0, platforms: {} }
            stats[creator].total++
            const platform = c["MEDIA"] || "Lainnya"
            stats[creator].platforms[platform] = (stats[creator].platforms[platform] || 0) + 1
        })
        return Object.values(stats)
            .filter(c => c.name !== "Tidak Diketahui")
            .sort((a, b) => b.total - a.total)
            .slice(0, 10)
            .map((c, i) => ({
                ...c,
                rank: i + 1,
                topPlatform: Object.entries(c.platforms).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"
            }))
    }, [filteredData])

    // Stats
    const totalKonten = filteredData.length
    const totalPlatform = new Set(filteredData.map(c => c["MEDIA"]).filter(Boolean)).size
    const totalCreator = new Set(filteredData.map(c => c["CREATOR"]).filter(Boolean)).size
    const totalJenisKonten = new Set(filteredData.map(c => c["JENIS KONTEN"]).filter(Boolean)).size

    const getRankIcon = (rank) => {
        if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
        if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
        if (rank === 3) return <Award className="h-5 w-5 text-orange-600" />
        return <span className="text-sm font-medium text-muted-foreground">{rank}</span>
    }

    return (
        <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Share2 className="h-8 w-8 text-purple-500" />
                            <div>
                                <div className="text-3xl font-bold text-purple-500">{totalKonten}</div>
                                <p className="text-sm text-muted-foreground">Total Konten</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Smartphone className="h-8 w-8 text-blue-500" />
                            <div>
                                <div className="text-3xl font-bold text-blue-500">{totalPlatform}</div>
                                <p className="text-sm text-muted-foreground">Platform</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-green-500" />
                            <div>
                                <div className="text-3xl font-bold text-green-500">{totalCreator}</div>
                                <p className="text-sm text-muted-foreground">Creator Aktif</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Video className="h-8 w-8 text-orange-500" />
                            <div>
                                <div className="text-3xl font-bold text-orange-500">{totalJenisKonten}</div>
                                <p className="text-sm text-muted-foreground">Jenis Konten</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Heatmap */}
            <ActivityHeatmap
                data={filteredData}
                dateField="TANGGAL"
                year={selectedYear ? parseInt(selectedYear) : new Date().getFullYear()}
            />

            {/* Monthly Trend */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">📈 Trend Bulanan Konten Sosial Media</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value) => [`${value} konten`, 'Jumlah']}
                                />
                                <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Distribution Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Platform Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">📱 Distribusi Platform</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={platformDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {platformDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Jenis Konten Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">🎬 Distribusi Jenis Konten</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={jenisKontenDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {jenisKontenDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Media Plan Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">📋 Distribusi Jenis Media Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mediaPlanDistribution} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis type="number" stroke="#9ca3af" />
                                <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={150} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value) => [`${value} konten`, 'Jumlah']}
                                />
                                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Creator Leaderboard */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                        Top Creator COMMANDO
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Rank</TableHead>
                                <TableHead>Creator</TableHead>
                                <TableHead className="text-right">Total Konten</TableHead>
                                <TableHead className="hidden md:table-cell">Platform Utama</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {creatorLeaderboard.map((creator) => (
                                <TableRow key={creator.name} className={creator.rank <= 3 ? "bg-purple-500/5" : ""}>
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
                    {creatorLeaderboard.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">Tidak ada data creator</div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default SocialMediaAnalytics
