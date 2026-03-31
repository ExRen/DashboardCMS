import { useState, useEffect } from "react"
import { Search, X, Bookmark, BookmarkCheck } from "lucide-react"
import { Button } from "@/components/ui/Button"

const SAVED_FILTERS_KEY = "cms_saved_filters"

/**
 * Global search bar with saved filters functionality
 */
export function GlobalSearch({
    value = "",
    onChange,
    placeholder = "Cari...",
    onSaveFilter,
    currentFilters = {}
}) {
    const [savedFilters, setSavedFilters] = useState([])
    const [showSaved, setShowSaved] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem(SAVED_FILTERS_KEY)
        if (saved) {
            try {
                setSavedFilters(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to load saved filters")
            }
        }
    }, [])

    const saveCurrentFilter = () => {
        const name = prompt("Nama filter:")
        if (!name) return

        const newFilter = {
            id: Date.now(),
            name,
            filters: currentFilters,
            createdAt: new Date().toISOString()
        }

        const updated = [...savedFilters, newFilter]
        setSavedFilters(updated)
        localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated))
    }

    const loadFilter = (filter) => {
        if (onSaveFilter) {
            onSaveFilter(filter.filters)
        }
        setShowSaved(false)
    }

    const deleteFilter = (id) => {
        const updated = savedFilters.filter(f => f.id !== id)
        setSavedFilters(updated)
        localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated))
    }

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full pl-9 pr-8 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {value && (
                        <button
                            onClick={() => onChange("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={saveCurrentFilter}
                    title="Simpan filter saat ini"
                >
                    <Bookmark className="h-4 w-4" />
                </Button>

                {savedFilters.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSaved(!showSaved)}
                        title="Filter tersimpan"
                    >
                        <BookmarkCheck className="h-4 w-4" />
                        <span className="ml-1 text-xs">{savedFilters.length}</span>
                    </Button>
                )}
            </div>

            {showSaved && savedFilters.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
                    <div className="p-2 border-b border-border">
                        <span className="text-sm font-medium">Filter Tersimpan</span>
                    </div>
                    {savedFilters.map(filter => (
                        <div
                            key={filter.id}
                            className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                        >
                            <span
                                className="flex-1 text-sm"
                                onClick={() => loadFilter(filter)}
                            >
                                {filter.name}
                            </span>
                            <button
                                onClick={() => deleteFilter(filter.id)}
                                className="text-muted-foreground hover:text-destructive p-1"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
