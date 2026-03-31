import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/Toast"
import { Tag, X, Plus, Check, Loader2 } from "lucide-react"

// Predefined tag colors
const TAG_COLORS = [
    { name: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    { name: 'green', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    { name: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    { name: 'red', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    { name: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    { name: 'pink', bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
    { name: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    { name: 'gray', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
]

export function TagBadge({ tag, onRemove, size = 'sm' }) {
    const color = TAG_COLORS.find(c => c.name === tag.color) || TAG_COLORS[0]

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${color.bg} ${color.text} ${color.border} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            <Tag className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
            {tag.name}
            {onRemove && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(tag); }} className="ml-1 hover:opacity-70">
                    <X className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
                </button>
            )}
        </span>
    )
}

export function TagsInput({ value = [], onChange, availableTags = [], placeholder = "Tambah tag..." }) {
    const [inputValue, setInputValue] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)

    const filteredTags = availableTags.filter(t =>
        !value.find(v => v.id === t.id) &&
        t.name.toLowerCase().includes(inputValue.toLowerCase())
    )

    function addTag(tag) {
        onChange([...value, tag])
        setInputValue('')
        setShowSuggestions(false)
    }

    function removeTag(tag) {
        onChange(value.filter(t => t.id !== tag.id))
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (inputValue.trim()) {
                const existing = availableTags.find(t => t.name.toLowerCase() === inputValue.toLowerCase())
                if (existing && !value.find(v => v.id === existing.id)) {
                    addTag(existing)
                }
            }
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            removeTag(value[value.length - 1])
        }
    }

    return (
        <div className="relative">
            <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-border bg-card min-h-[42px]">
                {value.map(tag => (
                    <TagBadge key={tag.id} tag={tag} onRemove={removeTag} />
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[100px] bg-transparent outline-none text-sm"
                />
            </div>

            {showSuggestions && filteredTags.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 max-h-48 overflow-auto">
                    {filteredTags.map(tag => (
                        <button
                            type="button"
                            key={tag.id}
                            onClick={() => addTag(tag)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted text-sm"
                        >
                            <TagBadge tag={tag} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export function TagsManager() {
    const toast = useToast()
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [newTagName, setNewTagName] = useState('')
    const [newTagColor, setNewTagColor] = useState('blue')
    const [editing, setEditing] = useState(null)

    useEffect(() => {
        fetchTags()
    }, [])

    async function fetchTags() {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .order('name')

            if (!error && data) {
                setTags(data)
            }
        } catch (error) {
            console.error("Error fetching tags:", error)
        }
        setLoading(false)
    }

    async function createTag() {
        if (!newTagName.trim()) return

        try {
            const { data, error } = await supabase
                .from('tags')
                .insert([{ name: newTagName.trim(), color: newTagColor }])
                .select()
                .single()

            if (error) throw error

            setTags([...tags, data])
            setNewTagName('')
            toast.success('Tag berhasil dibuat!')
        } catch (error) {
            toast.error('Gagal membuat tag: ' + error.message)
        }
    }

    async function deleteTag(id) {
        try {
            await supabase.from('tags').delete().eq('id', id)
            setTags(tags.filter(t => t.id !== id))
            toast.success('Tag berhasil dihapus!')
        } catch (error) {
            toast.error('Gagal menghapus tag')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Create New Tag */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Nama tag baru..."
                    className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && createTag()}
                />
                <select
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                >
                    {TAG_COLORS.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={createTag}
                    className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                    <Plus className="h-5 w-5" />
                </button>
            </div>

            {/* Tags List */}
            <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada tag</p>
                ) : (
                    tags.map(tag => (
                        <div key={tag.id} className="group relative">
                            <TagBadge tag={tag} onRemove={() => deleteTag(tag.id)} size="md" />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
