import { useState, useEffect } from "react"
import { User, UserPlus, Check, X } from "lucide-react"
import { USERS } from "@/lib/usersData"

/**
 * AssignmentDropdown - Assign content to a user
 * @param {Object} props
 * @param {string} props.value - Currently assigned user name
 * @param {Function} props.onChange - Change handler
 * @param {string} props.itemId - Item ID for notifications
 * @param {string} props.itemType - Item type for notifications
 */
export function AssignmentDropdown({ value = "", onChange, itemId, itemType = "commando" }) {
    const [isOpen, setIsOpen] = useState(false)

    function handleAssign(user) {
        const previousValue = value
        if (onChange) onChange(user.name)
        setIsOpen(false)

        // Save assignment notification
        if (user.name !== previousValue) {
            const notifications = JSON.parse(localStorage.getItem('assignmentNotifications') || '[]')
            notifications.push({
                id: Date.now(),
                type: 'assignment',
                to: user.name,
                from: 'Admin',
                itemId,
                itemType,
                createdAt: new Date().toISOString(),
                read: false
            })
            localStorage.setItem('assignmentNotifications', JSON.stringify(notifications))
        }
    }

    function handleClear() {
        if (onChange) onChange("")
        setIsOpen(false)
    }

    const selectedUser = USERS.find(u => u.name === value)

    return (
        <div className="relative">
            <label className="text-sm font-medium mb-1 block">Assign To</label>

            {/* Current Selection */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 h-10 px-3 rounded-lg bg-muted border border-border text-sm text-left"
            >
                {selectedUser ? (
                    <>
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                            {selectedUser.name.charAt(0)}
                        </div>
                        <span className="flex-1">{selectedUser.name}</span>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleClear(); }}
                            className="p-1 hover:bg-destructive/10 rounded"
                        >
                            <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                    </>
                ) : (
                    <>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-muted-foreground">Pilih user...</span>
                    </>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-[250px] overflow-auto">
                        {USERS.map(user => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => handleAssign(user)}
                                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-muted ${user.name === value ? 'bg-primary/5' : ''
                                    }`}
                            >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium">{user.name}</div>
                                    <div className="text-xs text-muted-foreground">{user.role}</div>
                                </div>
                                {user.name === value && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

// Export USERS for consistency
export { USERS }
export default AssignmentDropdown
