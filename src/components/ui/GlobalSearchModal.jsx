import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Search, X, FileText, Megaphone, Share2, Newspaper, FolderOpen, Building2, ExternalLink, Command, ArrowRight } from "lucide-react"
import { useData } from "@/context/DataContext"
import Fuse from "fuse.js"
import { cn } from "@/lib/utils"

export function GlobalSearchModal({ isOpen, onClose }) {
    const {
        pressReleases,
        commandoContents,
        socialPosts,
        newsMonitoring,
        assets,
        offices
    } = useData()
    const navigate = useNavigate()
    const [query, setQuery] = useState("")
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Close on Escape
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape' && isOpen) onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    // Reset query when closed
    useEffect(() => {
        if (!isOpen) {
            setQuery("")
            setSelectedIndex(0)
        }
    }, [isOpen])

    // Search Logic
    const results = useMemo(() => {
        if (!query || query.length < 2) return []

        const searchOptions = {
            threshold: 0.4,
            ignoreLocation: true,
            minMatchCharLength: 2,
            includeScore: true
        }

        const pressFuse = new Fuse(pressReleases, { ...searchOptions, keys: ["JUDUL SIARAN PERS", "NOMOR SIARAN PERS"] })
        const commandoFuse = new Fuse(commandoContents, { ...searchOptions, keys: ["JUDUL KONTEN", "MEDIA"] })
        const socialFuse = new Fuse(socialPosts, { ...searchOptions, keys: ["topik", "platform"] })
        const newsFuse = new Fuse(newsMonitoring, { ...searchOptions, keys: ["judul_berita", "media"] })
        const assetsFuse = new Fuse(assets, { ...searchOptions, keys: ["nama_file", "kategori"] })
        const officesFuse = new Fuse(offices, { ...searchOptions, keys: ["name", "city"] })

        const pressResults = pressFuse.search(query).slice(0, 3).map(r => ({ ...r.item, type: 'press', label: "Siaran Pers", icon: FileText, title: r.item["JUDUL SIARAN PERS"], link: "/press-releases" }))
        const commandoResults = commandoFuse.search(query).slice(0, 3).map(r => ({ ...r.item, type: 'commando', label: "COMMANDO", icon: Megaphone, title: r.item["JUDUL KONTEN"], link: "/commando" }))
        const socialResults = socialFuse.search(query).slice(0, 3).map(r => ({ ...r.item, type: 'social', label: "Social Media", icon: Share2, title: r.item.topik, link: "/media-social" }))
        const newsResults = newsFuse.search(query).slice(0, 3).map(r => ({ ...r.item, type: 'news', label: "Pemberitaan", icon: Newspaper, title: r.item.judul_berita, link: "/pemberitaan" }))
        const assetsResults = assetsFuse.search(query).slice(0, 3).map(r => ({ ...r.item, type: 'asset', label: "Aset", icon: FolderOpen, title: r.item.nama_file, link: "/aset-komunikasi" }))
        const officesResults = officesFuse.search(query).slice(0, 3).map(r => ({ ...r.item, type: 'office', label: "Kantor", icon: Building2, title: r.item.name, link: `/dashboard?office=${r.item.id}` }))

        return [
            ...pressResults,
            ...commandoResults,
            ...socialResults,
            ...newsResults,
            ...assetsResults,
            ...officesResults
        ]
    }, [query, pressReleases, commandoContents, socialPosts, newsMonitoring, assets, offices])

    // Keyboard navigation
    useEffect(() => {
        function handleKeyDown(e) {
            if (!isOpen) return
            if (results.length === 0) return

            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(i => (i + 1) % results.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(i => (i - 1 + results.length) % results.length)
            } else if (e.key === 'Enter') {
                e.preventDefault()
                handleSelect(results[selectedIndex])
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, results, selectedIndex])

    function handleSelect(item) {
        if (!item) return
        navigate(item.link)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-card rounded-xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center border-b border-border px-4 h-16">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <input
                        autoFocus
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                        placeholder="Cari semua data (Siaran Pers, Kantor, Berita...)"
                        className="flex-1 h-full bg-transparent border-none px-4 text-lg focus:outline-none placeholder:text-muted-foreground"
                    />
                    <div className="flex items-center gap-2">
                        <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">ESC</span>
                        </kbd>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {results.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            {query ? `Tidak ada hasil untuk "${query}"` : "Ketik untuk mulai mencari..."}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {results.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelect(item)}
                                    className={cn(
                                        "w-full flex items-center justify-between text-left px-4 py-3 rounded-lg text-sm transition-colors",
                                        selectedIndex === index ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                    )}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={cn("p-2 rounded-lg shrink-0", selectedIndex === index ? "bg-primary/10" : "bg-muted")}>
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{item.title}</p>
                                            <p className="text-xs text-muted-foreground truncate opacity-80">{item.label}</p>
                                        </div>
                                    </div>
                                    {selectedIndex === index && <ArrowRight className="h-4 w-4 opacity-50" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-2 border-t border-border bg-muted/30 text-[10px] text-muted-foreground text-center">
                    Gunakan <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> untuk navigasi, <kbd className="font-mono">Enter</kbd> untuk pilih
                </div>
            </div>
        </div>
    )
}
