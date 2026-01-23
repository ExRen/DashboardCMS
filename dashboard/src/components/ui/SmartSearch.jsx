import { useState, useMemo, useRef, useEffect } from "react"
import Fuse from "fuse.js"
import { Search, X, Sparkles } from "lucide-react"

/**
 * SmartSearch - Fuzzy search with suggestions and recent searches
 * @param {Object} props
 * @param {Array} props.data - Data array to search through
 * @param {Array} props.searchKeys - Keys to search in (e.g., ["JUDUL KONTEN", "MEDIA"])
 * @param {Function} props.onSearch - Callback with search term
 * @param {Function} props.onResultSelect - Callback when suggestion is clicked
 * @param {string} props.placeholder - Input placeholder text
 */
export function SmartSearch({
    data = [],
    searchKeys = ["JUDUL KONTEN"],
    onSearch,
    onResultSelect,
    placeholder = "Cari dengan smart search..."
}) {
    const [query, setQuery] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [recentSearches, setRecentSearches] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('recentSearches') || '[]')
        } catch { return [] }
    })
    const inputRef = useRef(null)
    const wrapperRef = useRef(null)

    // Initialize Fuse.js
    const fuse = useMemo(() => {
        return new Fuse(data, {
            keys: searchKeys,
            threshold: 0.4,
            distance: 100,
            includeScore: true,
            ignoreLocation: true,
            minMatchCharLength: 2
        })
    }, [data, searchKeys])

    // Get search suggestions
    const suggestions = useMemo(() => {
        if (!query || query.length < 2) return []
        const results = fuse.search(query, { limit: 5 })
        return results.map(r => ({
            item: r.item,
            score: r.score,
            match: searchKeys.map(k => r.item[k]).filter(Boolean).join(' - ')
        }))
    }, [query, fuse, searchKeys])

    // Close suggestions on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Handle search
    function handleSearch(value) {
        setQuery(value)
        if (onSearch) onSearch(value)
    }

    // Handle suggestion select
    function handleSelect(item) {
        const title = item[searchKeys[0]] || ''
        setQuery(title)
        setShowSuggestions(false)

        // Save to recent searches
        const newRecent = [title, ...recentSearches.filter(s => s !== title)].slice(0, 5)
        setRecentSearches(newRecent)
        localStorage.setItem('recentSearches', JSON.stringify(newRecent))

        if (onResultSelect) onResultSelect(item)
        if (onSearch) onSearch(title)
    }

    // Clear search
    function clearSearch() {
        setQuery("")
        if (onSearch) onSearch("")
        inputRef.current?.focus()
    }

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={placeholder}
                    className="w-full h-10 pl-9 pr-9 rounded-lg bg-muted border border-primary/20 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted-foreground/20"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (query.length >= 2 || recentSearches.length > 0) && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-[300px] overflow-auto">
                    {/* Search Suggestions */}
                    {suggestions.length > 0 && (
                        <div className="p-2">
                            <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                                <Sparkles className="h-3 w-3 inline mr-1" />
                                Saran Pencarian
                            </div>
                            {suggestions.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(s.item)}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm transition-colors"
                                >
                                    <div className="font-medium truncate">{s.match}</div>
                                    <div className="text-xs text-muted-foreground">
                                        Match: {((1 - s.score) * 100).toFixed(0)}%
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Recent Searches */}
                    {query.length < 2 && recentSearches.length > 0 && (
                        <div className="p-2 border-t border-border">
                            <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                                <Search className="h-3 w-3 inline mr-1" />
                                Pencarian Terakhir
                            </div>
                            {recentSearches.map((search, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setQuery(search)
                                        if (onSearch) onSearch(search)
                                        setShowSuggestions(false)
                                    }}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm truncate transition-colors"
                                >
                                    {search}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No results */}
                    {query.length >= 2 && suggestions.length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Tidak ada hasil untuk "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default SmartSearch
