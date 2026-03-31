import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts"
import { FileText, Users, TrendingUp, Award, Crown, Medal, Calendar } from "lucide-react"

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#14b8a6', '#f43f5e']

/**
 * PressReleaseAnalytics - Komponen analitik khusus untuk Siaran Pers
 */
export function PressReleaseAnalytics({ data = [], selectedYear = "" }) {
    const filteredData = selectedYear
        ? data.filter(p => p.year === parseInt(selectedYear))
        : data

    // Monthly Trend
    const monthMap = { 'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11 }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

    const monthlyTrend = useMemo(() => {
        const monthCounts = Array(12).fill(0)
        filteredData.forEach(p => {
            const date = p["TANGGAL TERBIT"] || ""
            Object.keys(monthMap).forEach(month => {
                if (date.includes(month)) {
                    monthCounts[monthMap[month]]++
                }
            })
        })
        return months.map((m, i) => ({ name: m, value: monthCounts[i] }))
    }, [filteredData])

    // Jenis Rilis Distribution
    const jenisDistribution = useMemo(() => {
        const counts = {}
        filteredData.forEach(p => {
            const jenis = p["JENIS RILIS"] || "Lainnya"
            counts[jenis] = (counts[jenis] || 0) + 1
        })
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8)
    }, [filteredData])

    // Lingkup Distribution
    const lingkupDistribution = useMemo(() => {
        const counts = {}
        filteredData.forEach(p => {
            const lingkup = p["LINGKUP"] || "Lainnya"
            counts[lingkup] = (counts[lingkup] || 0) + 1
        })
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8)
    }, [filteredData])

    // Kategori Distribution
    const kategoriDistribution = useMemo(() => {
        const counts = {}
        filteredData.forEach(p => {
            const kategori = p["KETEGORI"] || "Lainnya"
            counts[kategori] = (counts[kategori] || 0) + 1
        })
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10)
    }, [filteredData])

    // Writer Leaderboard
    const writerLeaderboard = useMemo(() => {
        const stats = {}
        filteredData.forEach(p => {
            const writer = p["WRITER CORCOMM"] || "Tidak Diketahui"
            if (!stats[writer]) stats[writer] = { name: writer, total: 0, types: {} }
            stats[writer].total++
            const type = p["JENIS RILIS"] || "Lainnya"
            stats[writer].types[type] = (stats[writer].types[type] || 0) + 1
        })
        return Object.values(stats)
            .filter(w => w.name !== "Tidak Diketahui")
            .sort((a, b) => b.total - a.total)
            .slice(0, 10)
            .map((w, i) => ({
                ...w,
                rank: i + 1,
                topType: Object.entries(w.types).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"
            }))
    }, [filteredData])

    // Stats
    const totalRilis = filteredData.length
    const totalJenis = new Set(filteredData.map(p => p["JENIS RILIS"]).filter(Boolean)).size
    const totalWriter = new Set(filteredData.map(p => p["WRITER CORCOMM"]).filter(Boolean)).size
    const withLink = filteredData.filter(p => p["LINK WEBSITE"]).length

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
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-blue-500" />
                            <div>
                                <div className="text-3xl font-bold text-blue-500">{totalRilis}</div>
                                <p className="text-sm text-muted-foreground">Total Siaran Pers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="h-8 w-8 text-purple-500" />
                            <div>
                                <div className="text-3xl font-bold text-purple-500">{totalJenis}</div>
                                <p className="text-sm text-muted-foreground">Jenis Rilis</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-green-500" />
                            <div>
                                <div className="text-3xl font-bold text-green-500">{totalWriter}</div>
                                <p className="text-sm text-muted-foreground">Writer Aktif</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-8 w-8 text-orange-500" />
                            <div>
                                <div className="text-3xl font-bold text-orange-500">{withLink}</div>
                                <p className="text-sm text-muted-foreground">Dengan Link</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Trend */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">📈 Trend Bulanan Siaran Pers</CardTitle>
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
                                    formatter={(value) => [`${value} rilis`, 'Jumlah']}
                                />
                                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Distribution Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Jenis Rilis */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">📊 Distribusi Jenis Rilis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={jenisDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {jenisDistribution.map((_, index) => (
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

                {/* Lingkup */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">🌍 Distribusi Lingkup</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={lingkupDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {lingkupDistribution.map((_, index) => (
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

            {/* Kategori Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">📑 Distribusi Kategori Siaran Pers</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={kategoriDistribution} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis type="number" stroke="#9ca3af" />
                                <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={150} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value) => [`${value} rilis`, 'Jumlah']}
                                />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
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
                                <TableHead className="text-right">Total Rilis</TableHead>
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
                    {writerLeaderboard.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">Tidak ada data writer</div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default PressReleaseAnalytics
