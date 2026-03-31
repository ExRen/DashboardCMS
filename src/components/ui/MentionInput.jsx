import { useState, useRef, useEffect } from "react"
import { AtSign, X } from "lucide-react"
import { USERS, searchUsers } from "@/lib/usersData"

/**
 * MentionInput - Text input/textarea with @mention autocomplete
 * @param {Object} props
 * @param {string} props.value - Current value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.multiline - Use textarea instead of input
 */
export function MentionInput({ value = "", onChange, placeholder = "Ketik @ untuk mention...", multiline = false }) {
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [mentionQuery, setMentionQuery] = useState("")
    const [cursorPosition, setCursorPosition] = useState(0)
    const inputRef = useRef(null)

    // Filter users based on query
    const filteredUsers = mentionQuery
        ? USERS.filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
        : USERS

    // Handle input change
    function handleChange(e) {
        const newValue = e.target.value
        const pos = e.target.selectionStart
        setCursorPosition(pos)

        // Check if we're in a mention context
        const textBeforeCursor = newValue.slice(0, pos)
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

        if (mentionMatch) {
            setMentionQuery(mentionMatch[1])
            setShowSuggestions(true)
        } else {
            setShowSuggestions(false)
        }

        if (onChange) onChange(newValue)
    }

    // Insert mention
    function insertMention(user) {
        const textBeforeCursor = value.slice(0, cursorPosition)
        const textAfterCursor = value.slice(cursorPosition)

        // Find the @ position
        const mentionStart = textBeforeCursor.lastIndexOf('@')
        const newText = textBeforeCursor.slice(0, mentionStart) + `@${user.name} ` + textAfterCursor

        if (onChange) onChange(newText)
        setShowSuggestions(false)
        inputRef.current?.focus()
    }

    // Parse mentions in text and highlight them
    function highlightMentions(text) {
        const parts = text.split(/(@\w+)/g)
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return <span key={i} className="text-primary font-medium">{part}</span>
            }
            return part
        })
    }

    // Extract mentions from text
    function extractMentions(text) {
        const matches = text.match(/@(\w+)/g) || []
        return matches.map(m => m.slice(1))
    }

    const InputComponent = multiline ? 'textarea' : 'input'

    return (
        <div className="relative">
            <div className="relative">
                <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <InputComponent
                    ref={inputRef}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={`w-full pl-9 pr-4 rounded-lg bg-muted border border-border text-sm ${multiline ? 'min-h-[80px] py-2' : 'h-10'
                        }`}
                    rows={multiline ? 3 : undefined}
                />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && filteredUsers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-[200px] overflow-auto">
                    <div className="p-1">
                        {filteredUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => insertMention(user)}
                                className="w-full text-left px-3 py-2 rounded hover:bg-muted flex items-center gap-2"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{user.name}</div>
                                    <div className="text-xs text-muted-foreground">{user.role}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Mentions Preview */}
            {extractMentions(value).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {extractMentions(value).map((mention, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                            @{mention}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

// Export user list for other components
export { USERS }
export default MentionInput
