import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { useData } from "@/context/DataContext"
import { Target, TrendingUp, TrendingDown, Edit2, Save, X, Trophy, Zap, BarChart3 } from "lucide-react"

// Default KPI targets
const DEFAULT_TARGETS = {
    commando_monthly: { label: "Konten Bulanan", target: 100, unit: "konten" },
    press_monthly: { label: "Siaran Pers Bulanan", target: 15, unit: "siaran pers" },
    platform_coverage: { label: "Platform Coverage", target: 6, unit: "platform" },
    realization_rate: { label: "Tingkat Realisasi", target: 90, unit: "%" }
}

/**
 * KPITargets - Set KPI targets and track progress
 */
export function KPITargets() {
    const { commandoContents, pressReleases } = useData()
    const [targets, setTargets] = useState(() => {
        try {
            const saved = localStorage.getItem('kpiTargets')
            return saved ? JSON.parse(saved) : DEFAULT_TARGETS
        } catch { return DEFAULT_TARGETS }
    })
    const [editMode, setEditMode] = useState(false)
    const [tempTargets, setTempTargets] = useState(targets)

    // Calculate current month stats
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Count this month's content
    const monthlyCommando = commandoContents.filter(c => {
        if (!c.created_at) return false
        const d = new Date(c.created_at)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    }).length

    const monthlyPress = pressReleases.filter(p => {
        if (!p.created_at) return false
        const d = new Date(p.created_at)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    }).length

    // Platform count
    const platforms = [...new Set(commandoContents.map(c => c["MEDIA"]).filter(Boolean))].length

    // Realization rate
    const realisasi = commandoContents.filter(c => c["AKTUALISASI"] === "Realisasi").length
    const realizationRate = commandoContents.length > 0
        ? Math.round((realisasi / commandoContents.length) * 100)
        : 0

    // Current values
    const currentValues = {
        commando_monthly: monthlyCommando,
        press_monthly: monthlyPress,
        platform_coverage: platforms,
        realization_rate: realizationRate
    }

    // Calculate progress percentage
    function getProgress(key) {
        const target = targets[key]?.target || 1
        const current = currentValues[key] || 0
        return Math.min(100, Math.round((current / target) * 100))
    }

    // Get status color
    function getStatusColor(progress) {
        if (progress >= 100) return "text-green-500"
        if (progress >= 75) return "text-yellow-500"
        if (progress >= 50) return "text-orange-500"
        return "text-red-500"
    }

    // Get progress bar color
    function getProgressBarColor(progress) {
        if (progress >= 100) return "bg-green-500"
        if (progress >= 75) return "bg-yellow-500"
        if (progress >= 50) return "bg-orange-500"
        return "bg-red-500"
    }

    // Save targets
    function saveTargets() {
        setTargets(tempTargets)
        localStorage.setItem('kpiTargets', JSON.stringify(tempTargets))
        setEditMode(false)
    }

    // Cancel edit
    function cancelEdit() {
        setTempTargets(targets)
        setEditMode(false)
    }

    // Overall achievement
    const overallProgress = Math.round(
        Object.keys(targets).reduce((sum, key) => sum + getProgress(key), 0) / Object.keys(targets).length
    )

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    KPI Targets - {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex items-center gap-2">
                    {editMode ? (
                        <>
                            <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={saveTargets}>
                                <Save className="h-4 w-4 mr-1" />
                                Simpan
                            </Button>
                        </>
                    ) : (
                        <Button size="sm" variant="ghost" onClick={() => setEditMode(true)}>
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit Target
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Overall Progress */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Trophy className={`h-5 w-5 ${getStatusColor(overallProgress)}`} />
                            <span className="font-medium">Overall Achievement</span>
                        </div>
                        <span className={`text-2xl font-bold ${getStatusColor(overallProgress)}`}>
                            {overallProgress}%
                        </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getProgressBarColor(overallProgress)} transition-all duration-500`}
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>
                </div>

                {/* Individual KPIs */}
                <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(targets).map(([key, kpi]) => {
                        const progress = getProgress(key)
                        const current = currentValues[key]
                        const isAchieved = progress >= 100

                        return (
                            <div key={key} className="p-4 rounded-lg border bg-card">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {isAchieved ? (
                                            <Zap className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="font-medium text-sm">{kpi.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {progress >= 100 ? (
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        ) : progress < 50 ? (
                                            <TrendingDown className="h-4 w-4 text-red-500" />
                                        ) : null}
                                        <span className={`text-sm font-medium ${getStatusColor(progress)}`}>
                                            {progress}%
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                                    <div
                                        className={`h-full ${getProgressBarColor(progress)} transition-all duration-500`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                {/* Current vs Target */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        Current: <strong className="text-foreground">{current}</strong> {kpi.unit}
                                    </span>
                                    {editMode ? (
                                        <div className="flex items-center gap-1">
                                            <span>Target:</span>
                                            <input
                                                type="number"
                                                value={tempTargets[key]?.target || 0}
                                                onChange={(e) => setTempTargets({
                                                    ...tempTargets,
                                                    [key]: { ...tempTargets[key], target: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-16 px-2 py-0.5 rounded bg-muted border text-sm text-center"
                                            />
                                        </div>
                                    ) : (
                                        <span>
                                            Target: <strong className="text-foreground">{kpi.target}</strong> {kpi.unit}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Quick Stats */}
                <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
                    <span>
                        ✅ {Object.keys(targets).filter(k => getProgress(k) >= 100).length} Tercapai
                    </span>
                    <span>|</span>
                    <span>
                        🔄 {Object.keys(targets).filter(k => getProgress(k) < 100 && getProgress(k) >= 50).length} Progress
                    </span>
                    <span>|</span>
                    <span>
                        ⚠️ {Object.keys(targets).filter(k => getProgress(k) < 50).length} Perlu Perhatian
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}

export default KPITargets
