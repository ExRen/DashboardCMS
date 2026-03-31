import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Settings, Save, RotateCcw, Eye, EyeOff, Check } from "lucide-react"

/**
 * UserPreferences - Save default filters and table column visibility
 */
export function UserPreferences({ columns = [], onColumnChange }) {
    const [preferences, setPreferences] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('userPreferences') || '{}')
        } catch { return {} }
    })
    const [isOpen, setIsOpen] = useState(false)

    // Get visible columns
    const visibleColumns = preferences.columns || columns.map(c => c.key)

    // Toggle column visibility
    function toggleColumn(key) {
        const newVisible = visibleColumns.includes(key)
            ? visibleColumns.filter(k => k !== key)
            : [...visibleColumns, key]

        const newPrefs = { ...preferences, columns: newVisible }
        setPreferences(newPrefs)
        localStorage.setItem('userPreferences', JSON.stringify(newPrefs))
        if (onColumnChange) onColumnChange(newVisible)
    }

    // Reset to defaults
    function resetToDefaults() {
        const defaultCols = columns.map(c => c.key)
        const newPrefs = { ...preferences, columns: defaultCols }
        setPreferences(newPrefs)
        localStorage.setItem('userPreferences', JSON.stringify(newPrefs))
        if (onColumnChange) onColumnChange(defaultCols)
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
                <Settings className="h-4 w-4" />
                Kolom
            </button>
        )
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground"
            >
                <Settings className="h-4 w-4" />
                Kolom
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 top-10 w-64 bg-card border border-border rounded-lg shadow-lg z-50 p-3">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Tampilkan Kolom</span>
                    <button
                        onClick={resetToDefaults}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                    </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-auto">
                    {columns.map(col => (
                        <label
                            key={col.key}
                            className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={visibleColumns.includes(col.key)}
                                onChange={() => toggleColumn(col.key)}
                                className="rounded"
                            />
                            <span className="text-sm">{col.label}</span>
                        </label>
                    ))}
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    {visibleColumns.length} dari {columns.length} kolom ditampilkan
                </div>
            </div>

            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
            />
        </div>
    )
}

/**
 * DefaultFilters - Save and apply default filter settings
 */
export function DefaultFilters({ filters, onApply }) {
    const [saved, setSaved] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('defaultFilters') || 'null')
        } catch { return null }
    })

    // Save current filters as default
    function saveAsDefault() {
        localStorage.setItem('defaultFilters', JSON.stringify(filters))
        setSaved(filters)
    }

    // Apply saved defaults
    function applyDefaults() {
        if (saved && onApply) onApply(saved)
    }

    // Clear defaults
    function clearDefaults() {
        localStorage.removeItem('defaultFilters')
        setSaved(null)
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={saveAsDefault}>
                <Save className="h-4 w-4 mr-1" />
                Simpan Filter
            </Button>
            {saved && (
                <>
                    <Button variant="outline" size="sm" onClick={applyDefaults}>
                        <Check className="h-4 w-4 mr-1" />
                        Terapkan Default
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearDefaults}>
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </>
            )}
        </div>
    )
}

export default UserPreferences
