import { useState } from "react"
import { MessageSquare, Send, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { MentionInput, USERS } from "@/components/ui/MentionInput"

/**
 * Comments Panel for content items
 * Stores comments in localStorage per content
 */
export function CommentsPanel({
    contentId,
    contentType = "content",
    isOpen,
    onClose
}) {
    const storageKey = `cms_comments_${contentType}_${contentId}`

    const [comments, setComments] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey)
            return saved ? JSON.parse(saved) : []
        } catch {
            return []
        }
    })
    const [newComment, setNewComment] = useState("")

    const saveComments = (updatedComments) => {
        setComments(updatedComments)
        localStorage.setItem(storageKey, JSON.stringify(updatedComments))
    }

    const addComment = () => {
        if (!newComment.trim()) return

        const comment = {
            id: Date.now(),
            text: newComment.trim(),
            timestamp: new Date().toISOString(),
            author: localStorage.getItem('userName') || "User"
        }

        saveComments([...comments, comment])

        // Extract mentions and save notifications
        const mentions = newComment.match(/@(\w+)/g) || []
        if (mentions.length > 0) {
            const existingNotifs = JSON.parse(localStorage.getItem('mentionNotifications') || '[]')

            mentions.forEach(mention => {
                const userName = mention.slice(1) // Remove @
                existingNotifs.push({
                    id: Date.now() + Math.random(),
                    type: 'mention',
                    to: userName,
                    from: localStorage.getItem('userName') || 'User',
                    text: newComment.trim(),
                    contentId,
                    contentType,
                    createdAt: new Date().toISOString(),
                    read: false
                })
            })

            localStorage.setItem('mentionNotifications', JSON.stringify(existingNotifs))

            // Dispatch event to refresh notifications
            window.dispatchEvent(new CustomEvent('notificationUpdate'))
        }

        setNewComment("")
    }

    const deleteComment = (id) => {
        saveComments(comments.filter(c => c.id !== id))
    }

    const formatTime = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-card rounded-xl shadow-xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        <h2 className="font-semibold">Komentar</h2>
                        <span className="text-sm text-muted-foreground">({comments.length})</span>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-3">
                    {comments.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Belum ada komentar</p>
                        </div>
                    ) : (
                        comments.map(comment => (
                            <div
                                key={comment.id}
                                className="bg-muted/50 rounded-lg p-3 group"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium">{comment.author}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatTime(comment.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-sm">{comment.text}</p>
                                    </div>
                                    <button
                                        onClick={() => deleteComment(comment.id)}
                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <MentionInput
                                value={newComment}
                                onChange={setNewComment}
                                placeholder="Tulis komentar... (@mention untuk tag)"
                            />
                        </div>
                        <Button onClick={addComment} disabled={!newComment.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Comment button to open panel
 */
export function CommentButton({ count = 0, onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Komentar"
        >
            <MessageSquare className="h-4 w-4" />
            {count > 0 && <span className="text-xs">{count}</span>}
        </button>
    )
}

/**
 * Get comment count for a content item
 */
export function getCommentCount(contentId, contentType = "content") {
    try {
        const saved = localStorage.getItem(`cms_comments_${contentType}_${contentId}`)
        return saved ? JSON.parse(saved).length : 0
    } catch {
        return 0
    }
}
