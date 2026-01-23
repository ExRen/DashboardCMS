import { useState, useRef, useEffect } from 'react'

export function AutoComplete({
    value,
    onChange,
    suggestions = [],
    placeholder = "Ketik untuk mencari...",
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [filtered, setFiltered] = useState([])
    const [highlightIndex, setHighlightIndex] = useState(-1)
    const containerRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (value && suggestions.length > 0) {
            const matches = suggestions.filter(s =>
                s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
            ).slice(0, 8)
            setFiltered(matches)
            setIsOpen(matches.length > 0)
        } else {
            setFiltered([])
            setIsOpen(false)
        }
        setHighlightIndex(-1)
    }, [value, suggestions])

    function handleSelect(item) {
        onChange(item)
        setIsOpen(false)
        inputRef.current?.focus()
    }

    function handleKeyDown(e) {
        if (!isOpen) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightIndex(prev => Math.min(prev + 1, filtered.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightIndex(prev => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter' && highlightIndex >= 0) {
            e.preventDefault()
            handleSelect(filtered[highlightIndex])
        } else if (e.key === 'Escape') {
            setIsOpen(false)
        }
    }

    return (
        <div className="relative" ref={containerRef}>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => filtered.length > 0 && setIsOpen(true)}
                placeholder={placeholder}
                className={`w-full h-10 px-3 rounded-lg bg-muted border border-border text-sm ${className}`}
            />

            {isOpen && filtered.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
                    {filtered.map((item, index) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => handleSelect(item)}
                            className={`w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors
                ${highlightIndex === index ? 'bg-muted' : ''}
              `}
                        >
                            {highlightMatch(item, value)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function highlightMatch(text, query) {
    if (!query) return text
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
        regex.test(part) ? <span key={i} className="font-bold text-primary">{part}</span> : part
    )
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Duplicate detection helper
export function checkDuplicate(value, existingValues, threshold = 0.8) {
    if (!value || !existingValues.length) return null

    const normalizedValue = value.toLowerCase().trim()

    // Exact match
    const exactMatch = existingValues.find(v => v.toLowerCase().trim() === normalizedValue)
    if (exactMatch) return { type: 'exact', match: exactMatch }

    // Fuzzy match using simple similarity
    for (const existing of existingValues) {
        const similarity = calculateSimilarity(normalizedValue, existing.toLowerCase().trim())
        if (similarity >= threshold) {
            return { type: 'similar', match: existing, similarity: Math.round(similarity * 100) }
        }
    }

    return null
}

function calculateSimilarity(a, b) {
    if (a === b) return 1
    if (a.length === 0 || b.length === 0) return 0

    // Simple Dice coefficient
    const getBigrams = (str) => {
        const bigrams = new Set()
        for (let i = 0; i < str.length - 1; i++) {
            bigrams.add(str.slice(i, i + 2))
        }
        return bigrams
    }

    const bigramsA = getBigrams(a)
    const bigramsB = getBigrams(b)

    let intersection = 0
    bigramsA.forEach(b => { if (bigramsB.has(b)) intersection++ })

    return (2 * intersection) / (bigramsA.size + bigramsB.size)
}

// URL validation
export function validateURL(url) {
    if (!url) return true
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}
