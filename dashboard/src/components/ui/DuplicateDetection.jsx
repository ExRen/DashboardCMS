import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { AlertTriangle, Check, Loader2, FileText } from "lucide-react"

/**
 * Duplicate Detection component
 * Checks if similar content already exists in the database
 */
export function DuplicateDetection({ title, table = 'press_releases', titleField = 'JUDUL BERITA', threshold = 0.7 }) {
    const [loading, setLoading] = useState(false)
    const [duplicates, setDuplicates] = useState([])
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        if (title && title.length >= 10) {
            const debounce = setTimeout(() => checkDuplicates(title), 500)
            return () => clearTimeout(debounce)
        } else {
            setDuplicates([])
            setChecked(false)
        }
    }, [title])

    async function checkDuplicates(searchTitle) {
        setLoading(true)
        try {
            // Search for similar titles
            const words = searchTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3)

            if (words.length === 0) {
                setDuplicates([])
                setChecked(true)
                setLoading(false)
                return
            }

            // Build search query using first significant words
            const searchPattern = words.slice(0, 3).join('%')

            const { data, error } = await supabase
                .from(table)
                .select(`"NO", "${titleField}", "TANGGAL TERBIT", "TANGGAL"`)
                .ilike(`"${titleField}"`, `%${searchPattern}%`)
                .limit(5)

            if (!error && data) {
                // Calculate similarity scores
                const scored = data.map(item => ({
                    ...item,
                    title: item[titleField],
                    similarity: calculateSimilarity(searchTitle.toLowerCase(), (item[titleField] || '').toLowerCase())
                })).filter(item => item.similarity >= threshold)
                    .sort((a, b) => b.similarity - a.similarity)

                setDuplicates(scored)
            }
            setChecked(true)
        } catch (error) {
            console.error("Duplicate check error:", error)
        }
        setLoading(false)
    }

    // Simple similarity calculation using Jaccard index
    function calculateSimilarity(str1, str2) {
        const set1 = new Set(str1.split(/\s+/).filter(w => w.length > 2))
        const set2 = new Set(str2.split(/\s+/).filter(w => w.length > 2))

        if (set1.size === 0 || set2.size === 0) return 0

        let intersection = 0
        set1.forEach(word => {
            if (set2.has(word)) intersection++
        })

        const union = set1.size + set2.size - intersection
        return intersection / union
    }

    if (!title || title.length < 10) return null

    return (
        <div className="space-y-2">
            {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memeriksa duplikat...
                </div>
            ) : checked && duplicates.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Tidak ditemukan konten serupa
                </div>
            ) : duplicates.length > 0 ? (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-2 text-yellow-600 font-medium mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        Konten serupa ditemukan!
                    </div>
                    <div className="space-y-2">
                        {duplicates.map((dup, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                    <p className="truncate">{dup.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Kemiripan: {Math.round(dup.similarity * 100)}% •
                                        {dup['TANGGAL TERBIT'] || dup['TANGGAL'] || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    )
}

/**
 * Hook for duplicate checking
 */
export function useDuplicateCheck(title, table, titleField, threshold = 0.7) {
    const [status, setStatus] = useState({ loading: false, duplicates: [], checked: false })

    useEffect(() => {
        if (!title || title.length < 10) {
            setStatus({ loading: false, duplicates: [], checked: false })
            return
        }

        const timeout = setTimeout(async () => {
            setStatus(s => ({ ...s, loading: true }))

            try {
                const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
                const searchPattern = words.slice(0, 3).join('%')

                const { data } = await supabase
                    .from(table)
                    .select(`*`)
                    .ilike(`"${titleField}"`, `%${searchPattern}%`)
                    .limit(5)

                const scored = (data || [])
                    .map(item => ({
                        ...item,
                        similarity: calculateJaccard(title, item[titleField] || '')
                    }))
                    .filter(item => item.similarity >= threshold)

                setStatus({ loading: false, duplicates: scored, checked: true })
            } catch {
                setStatus({ loading: false, duplicates: [], checked: true })
            }
        }, 500)

        return () => clearTimeout(timeout)
    }, [title, table, titleField, threshold])

    return status
}

function calculateJaccard(str1, str2) {
    const set1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 2))
    const set2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 2))

    if (set1.size === 0 || set2.size === 0) return 0

    let intersection = 0
    set1.forEach(word => { if (set2.has(word)) intersection++ })

    return intersection / (set1.size + set2.size - intersection)
}
