import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { useData } from "@/context/DataContext"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts"
import { Map, MapControls, MapMarker, MarkerTooltip, MarkerContent } from "@/components/ui/map"
import "maplibre-gl/dist/maplibre-gl.css"
import {
    TrendingUp, Filter, ArrowUpRight, FileText, Megaphone, Calendar, Newspaper, FolderOpen, TrendingDown, Users, BarChart3
} from "lucide-react"
import { supabase, getMediaPlans } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1']

const TONE_COLORS = {
    'Positif': '#22c55e', // green-500
    'Negatif': '#ef4444', // red-500
    'Netral': '#94a3b8'   // slate-400
}

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

export function Dashboard() {
    const { user, isPusat } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()

    // ... (data hooks)
    const {
        pressReleases, commandoContents,
        socialPosts, newsMonitoring, assets, offices,
        loading: dataLoading, fetchAll
    } = useData()

    const [selectedYear, setSelectedYear] = useState("")
    const [yearOptions, setYearOptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [allPressData, setAllPressData] = useState([])
    const [allCommandoData, setAllCommandoData] = useState([])
    const [allSocialData, setAllSocialData] = useState([])
    const [allNewsData, setAllNewsData] = useState([])
    const [allAssetsData, setAllAssetsData] = useState([])
    const [stats, setStats] = useState({
        totalPressReleases: 0, pressThisMonth: 0,
        totalCommando: 0, commandoThisMonth: 0,
        totalSocialPosts: 0, socialThisMonth: 0,
        totalNews: 0, newsThisMonth: 0,
        totalAssets: 0, assetsThisMonth: 0,
        pressTypes: [], commandoMedia: [],
        commandoJenis: [], commandoCategories: [],
        newsTones: [], socialKategori: [], planKategori: [],
        monthlyData: [], recentPress: [], recentCommando: []
    })
    const [upcomingMediaPlans, setUpcomingMediaPlans] = useState([])
    // ... (rest of state)

    const [selectedOfficeId, setSelectedOfficeId] = useState(null)
    const [officeName, setOfficeName] = useState("")
    // ...

    // Parse office from URL params
    useEffect(() => {
        const officeId = searchParams.get('office')
        if (officeId) {
            setSelectedOfficeId(officeId)
            fetchOfficeName(officeId)
        } else {
            setSelectedOfficeId(null)
            setOfficeName("")
        }
    }, [searchParams])

    async function fetchOfficeName(id) {
        const { data } = await supabase.from('offices').select('name').eq('id', id).single()
        if (data) setOfficeName(data.name)
    }

    // Use cached data from context
    useEffect(() => {
        if (pressReleases.length > 0 || commandoContents.length > 0 || socialPosts.length > 0) {
            setAllPressData(pressReleases)
            setAllCommandoData(commandoContents)
            setAllSocialData(socialPosts)
            setAllNewsData(newsMonitoring)
            setAllAssetsData(assets)

            // Extract unique years
            const years = [
                ...pressReleases.map(p => p.year),
                ...commandoContents.map(c => c.year),
                ...socialPosts.map(s => s.year),
                ...newsMonitoring.map(n => n.year),
                ...assets.map(a => a.year)
            ].filter(Boolean)
            const allYears = [...new Set(years)].sort((a, b) => b - a)
            setYearOptions(allYears)
            setLoading(false)
        } else if (!dataLoading.press && !dataLoading.commando && !dataLoading.social) {
            fetchAll()
        }
    }, [pressReleases, commandoContents, socialPosts, newsMonitoring, assets, dataLoading])

    useEffect(() => {
        if (allPressData.length || allCommandoData.length || allSocialData.length || allNewsData.length || allAssetsData.length) {
            calculateStats()
        }
        fetchUpcomingMediaPlans()
    }, [selectedYear, allPressData, allCommandoData, allSocialData, allNewsData, allAssetsData, selectedOfficeId, user])

    async function fetchUpcomingMediaPlans() {
        try {
            const today = new Date()
            today.setHours(0, 0, 0, 0) // Normalize today to start of day
            const monthIndex = today.getMonth() // 0-11
            const monthNames = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"]
            const currentMonthName = monthNames[monthIndex]

            const options = { limit: 100 }
            const effectiveOfficeId = selectedOfficeId || (!isPusat ? user?.office_id : null)

            if (effectiveOfficeId) {
                options.officeId = effectiveOfficeId
            }

            const { data } = await getMediaPlans(options)

            if (data) {
                const upcoming = data.filter(plan => {
                    if (!plan.scheduled_date) return false
                    const planDate = new Date(plan.scheduled_date)
                    planDate.setHours(0, 0, 0, 0) // Normalize planDate to start of day
                    return planDate >= today
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
        let socialData = [...allSocialData]
        let newsData = [...allNewsData]
        let assetData = [...allAssetsData]

        const now = new Date()
        const currentMonth = now.getMonth() // 0-11
        const currentYear = now.getFullYear()

        // 1. Filter by Office if NOT Pusat OR if office selected from monitoring
        const effectiveOfficeId = selectedOfficeId || (!isPusat ? user?.office_id : null)

        if (effectiveOfficeId) {
            // Ensure data has office_id or related field.
            pressData = pressData.filter(p => p.office_id === effectiveOfficeId || p.offices?.id === effectiveOfficeId)
            commandoData = commandoData.filter(c => c.office_id === effectiveOfficeId || c.offices?.id === effectiveOfficeId)
            socialData = socialData.filter(s => s.office_id === effectiveOfficeId)
            newsData = newsData.filter(n => n.office_id === effectiveOfficeId)
            assetData = assetData.filter(a => a.office_id === effectiveOfficeId)
        }

        // 2. Apply year filter
        if (selectedYear) {
            const year = parseInt(selectedYear)
            pressData = pressData.filter(p => p.year === year)
            commandoData = commandoData.filter(c => c.year === year)
            socialData = socialData.filter(s => s.year === year)
            newsData = newsData.filter(n => n.year === year)
            assetData = assetData.filter(a => a.year === year)
        }

        // Calculate current month stats for all filtered data
        const pressThisMonth = pressData.filter(p => {
            const d = new Date(p["TANGGAL TERBIT"]);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const commandoThisMonth = commandoData.filter(c => {
            const d = new Date(c["TANGGAL"]);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const socialThisMonth = socialData.filter(s => {
            const d = new Date(s.tanggal_posting);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const newsThisMonth = newsData.filter(n => {
            const d = new Date(n.tanggal_berita);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const assetsThisMonth = assetData.filter(a => {
            const d = new Date(a.tanggal_produksi);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;


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

        // BRANCH SPECIFIC DISTRIBUTIONS
        const newsTones = {}
        newsData.forEach(n => {
            const t = n.tone || "Netral"
            newsTones[t] = (newsTones[t] || 0) + 1
        })

        const socialKategori = {}
        socialData.forEach(s => {
            const k = s.kategori || "Umum"
            socialKategori[k] = (socialKategori[k] || 0) + 1
        })

        // Since upcomingMediaPlans is a separate state, we can compute its distribution here 
        // if we assume calculateStats is called when it changes too (or just use it directly in render)
        // Better: compute it from all data if possible, but for now let's stick to what's available.
        const planKategori = {}
        upcomingMediaPlans.forEach(p => {
            const k = p.kategori || "Lainnya"
            planKategori[k] = (planKategori[k] || 0) + 1
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
            totalSocialPosts: socialData.length,
            totalNews: newsData.length,
            totalAssets: assetData.length,
            pressThisMonth: pressThisMonth,
            commandoThisMonth: commandoThisMonth,
            socialThisMonth: socialThisMonth,
            newsThisMonth: newsThisMonth,
            assetsThisMonth: assetsThisMonth,
            pressTypes: Object.entries(pressTypes).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6),
            commandoMedia: Object.entries(commandoMedia).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6),
            commandoJenis: Object.entries(commandoJenis).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8),
            commandoCategories: Object.entries(commandoCategories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8),
            newsTones: Object.entries(newsTones).map(([name, value]) => ({ name, value })),
            socialKategori: Object.entries(socialKategori).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6),
            planKategori: Object.entries(planKategori).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6),
            recentPress: pressData.slice(0, 5),
            recentCommando: commandoData.slice(0, 5),
            monthlyData: combinedMonthly
        })
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Map Skeleton */}
                {isPusat && !selectedOfficeId && (
                    <div className="w-full h-[400px] bg-muted/50 rounded-xl" />
                )}

                {/* Filter Skeleton */}
                <div className="h-20 w-full bg-muted/50 rounded-xl" />

                {/* Bento Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="col-span-1 h-32 bg-muted/50 rounded-xl" />
                    ))}
                    <div className="col-span-1 md:col-span-4 lg:col-span-2 row-span-2 h-64 bg-muted/50 rounded-xl" />
                    <div className="col-span-1 h-32 bg-muted/50 rounded-xl" />
                    <div className="col-span-1 h-32 bg-muted/50 rounded-xl" />
                </div>

                {/* Charts Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-[300px] bg-muted/50 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* REGIONAL MAP (PUSAT ONLY) */}
            {isPusat && !selectedOfficeId && (
                <div className="col-span-1 md:col-span-2 lg:col-span-4 mb-6">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                                Sebaran Kinerja Kantor Cabang
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="h-[400px] w-full relative">
                                <Map
                                    initialViewState={{
                                        longitude: 118,
                                        latitude: -2,
                                        zoom: 4.5
                                    }}
                                >
                                    <MapControls />
                                    {offices.filter(o => o.latitude && o.longitude).map(office => (
                                        <MapMarker
                                            key={office.id}
                                            longitude={parseFloat(office.longitude)}
                                            latitude={parseFloat(office.latitude)}
                                        >
                                            <MarkerContent>
                                                <div
                                                    className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer"
                                                    onClick={() => setSearchParams({ office: office.id })}
                                                />
                                            </MarkerContent>
                                            <MarkerTooltip>
                                                <div className="p-1">
                                                    <p className="font-bold text-xs">{office.name}</p>
                                                    <p className="text-[10px] opacity-80">Klik untuk detail</p>
                                                </div>
                                            </MarkerTooltip>
                                        </MapMarker>
                                    ))}
                                </Map>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Office Filter Indicator */}
            {selectedOfficeId && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary text-white rounded-lg">
                            <Filter className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Viewing Office CMS</p>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{officeName || "Loading..."}</h2>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSearchParams({})
                            setSelectedOfficeId(null)
                        }}
                        className="bg-white dark:bg-slate-900 border-primary/20 text-primary hover:bg-primary/5"
                    >
                        Back to National Overview
                    </Button>
                </div>
            )}

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

            {/* Bento Grid Layout - Main container */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* BRANCH OR PUSAT CARDS */}
                {!selectedOfficeId && isPusat ? (
                    <>
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
                    </>
                ) : (
                    <>
                        <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-card border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Media Plan</p>
                                        <h3 className="text-3xl font-bold mt-2 text-indigo-700 dark:text-indigo-400">{upcomingMediaPlans.length}+</h3>
                                        <p className="text-xs text-muted-foreground mt-2">mendatang</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                                        <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Media Sosial</p>
                                        <h3 className="text-3xl font-bold mt-2 text-blue-700 dark:text-blue-400">{stats.totalSocialPosts}</h3>
                                        <p className="text-xs text-green-600 mt-2 bg-green-100 dark:bg-green-900/30 w-fit px-2 py-1 rounded-full">
                                            {stats.socialThisMonth} bulan ini
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                        <Megaphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-card border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Pemberitaan</p>
                                        <h3 className="text-3xl font-bold mt-2 text-emerald-700 dark:text-emerald-400">{stats.totalNews}</h3>
                                        <p className="text-xs text-green-600 mt-2 bg-green-100 dark:bg-green-900/30 w-fit px-2 py-1 rounded-full">
                                            {stats.newsThisMonth} bulan ini
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                                        <Newspaper className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-card border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Aset Komunikasi</p>
                                        <h3 className="text-3xl font-bold mt-2 text-amber-700 dark:text-amber-400">{stats.totalAssets}</h3>
                                        <p className="text-xs text-green-600 mt-2 bg-green-100 dark:bg-green-900/30 w-fit px-2 py-1 rounded-full">
                                            {stats.assetsThisMonth} bulan ini
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                                        <FolderOpen className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* Upcoming Media Plan Widget */}
                <Card className={`col-span-1 md:col-span-4 lg:col-span-2 row-span-2 border-none shadow-sm bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/20 dark:to-card ${!isPusat ? 'lg:col-span-4' : ''}`}>
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

                {/* Secondary Metrics - SHOW FOR ALL (But stats are filtered) */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{(!selectedOfficeId && isPusat) ? 'Jenis Rilis' : 'Kategori Berita'}</p>
                                <h3 className="text-3xl font-bold mt-2">{stats.pressTypes.length}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{(!selectedOfficeId && isPusat) ? 'kategori berbeda' : 'jenis pemberitaan'}</p>
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
                                <p className="text-sm font-medium text-muted-foreground">{(!selectedOfficeId && isPusat) ? 'Platform Media' : 'Kanal Media'}</p>
                                <h3 className="text-3xl font-bold mt-2">{stats.commandoMedia.length}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{(!selectedOfficeId && isPusat) ? 'platform aktif' : 'kanal aktif'}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* CHART SECTION: Distribution Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {!selectedOfficeId && isPusat ? (
                    <>
                        {/* NATIONAL VIEW CHARTS */}
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
                    </>
                ) : (
                    <>
                        {/* BRANCH VIEW CHARTS */}
                        <Card className="border-none shadow-sm">
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" />Sentimen Pemberitaan</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={stats.newsTones} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                                                {stats.newsTones.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={TONE_COLORS[entry.name] || '#64748b'} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4 text-blue-500" />Kategori Media Sosial</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={stats.socialKategori} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                                                {stats.socialKategori.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-indigo-500" />Kategori Media Plan</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={stats.planKategori} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                                                {stats.planKategori.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* CHART SECTION: Performance & Trends - SHOW FOR ALL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <Bar dataKey="press" name={isPusat ? "Siaran Pers" : "Pemberitaan"} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                                    <Bar dataKey="commando" name={isPusat ? "COMMANDO" : "Media Sosial"} fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

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
                    <CardHeader><CardTitle className="text-base">{isPusat ? 'Siaran Pers Terbaru' : 'Pemberitaan Terbaru'}</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead className="w-[60px]">No</TableHead><TableHead>Judul</TableHead><TableHead className="w-[100px]">Jenis</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {stats.recentPress.length > 0 ? (
                                    stats.recentPress.map((pr, index) => (
                                        <TableRow key={pr.id || index}>
                                            <TableCell>{pr["NO"] || "-"}</TableCell>
                                            <TableCell className="max-w-[200px]"><span className="line-clamp-1">{pr["JUDUL SIARAN PERS"] || "-"}</span></TableCell>
                                            <TableCell><span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">{pr["JENIS RILIS"] || "-"}</span></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">Belum ada data</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base">{isPusat ? 'Konten COMMANDO Terbaru' : 'Update Media Sosial'}</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Judul</TableHead><TableHead className="w-[80px]">Media</TableHead><TableHead className="w-[80px]">Jenis</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {stats.recentCommando.length > 0 ? (
                                    stats.recentCommando.map((c, index) => (
                                        <TableRow key={c.id || index}>
                                            <TableCell className="max-w-[200px]"><span className="line-clamp-1">{c["JUDUL KONTEN"] || "-"}</span></TableCell>
                                            <TableCell className="text-sm">{c["MEDIA"] || "-"}</TableCell>
                                            <TableCell><span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-500">{c["JENIS KONTEN"] || "-"}</span></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">Belum ada data</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
