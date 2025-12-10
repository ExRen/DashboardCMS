import { useState, useEffect } from "react"
import { Keyboard, X, Command } from "lucide-react"

/**
 * Keyboard Shortcuts configuration
 */
const SHORTCUTS = [
    {
        category: 'Navigasi', shortcuts: [
            { keys: ['Alt', 'D'], description: 'Ke Dashboard' },
            { keys: ['Alt', 'C'], description: 'Ke Commando' },
            { keys: ['Alt', 'P'], description: 'Ke Press Releases' },
            { keys: ['Alt', 'A'], description: 'Ke Analytics' },
            { keys: ['Alt', 'S'], description: 'Ke Settings' },
        ]
    },
    {
        category: 'Tabel & Data', shortcuts: [
            { keys: ['Ctrl', 'F'], description: 'Fokus ke search' },
            { keys: ['Ctrl', 'N'], description: 'Tambah item baru' },
            { keys: ['Ctrl', 'E'], description: 'Export data' },
            { keys: ['Ctrl', 'R'], description: 'Refresh data' },
            { keys: ['Escape'], description: 'Tutup modal / Batal' },
        ]
    },
    {
        category: 'Bulk Actions', shortcuts: [
            { keys: ['Ctrl', 'A'], description: 'Pilih semua' },
            { keys: ['Delete'], description: 'Hapus item terpilih' },
        ]
    },
    {
        category: 'Umum', shortcuts: [
            { keys: ['?'], description: 'Tampilkan shortcut ini' },
            { keys: ['Ctrl', '/'], description: 'Tampilkan shortcut ini' },
            { keys: ['Ctrl', 'S'], description: 'Simpan perubahan' },
        ]
    },
]

/**
 * KeyboardShortcutsModal - Modal untuk menampilkan daftar keyboard shortcuts
 */
export function KeyboardShortcutsModal({ isOpen, onClose }) {
    // Close on escape
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Keyboard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-lg">Keyboard Shortcuts</h2>
                                <p className="text-sm text-muted-foreground">Pintasan keyboard untuk navigasi cepat</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-muted"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                        <div className="grid md:grid-cols-2 gap-6">
                            {SHORTCUTS.map(section => (
                                <div key={section.category}>
                                    <h3 className="font-medium text-sm text-muted-foreground mb-3">
                                        {section.category}
                                    </h3>
                                    <div className="space-y-2">
                                        {section.shortcuts.map((shortcut, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted"
                                            >
                                                <span className="text-sm">{shortcut.description}</span>
                                                <div className="flex items-center gap-1">
                                                    {shortcut.keys.map((key, keyIdx) => (
                                                        <span key={keyIdx}>
                                                            <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono shadow-sm">
                                                                {key === 'Ctrl' && navigator.platform.includes('Mac') ? '⌘' : key}
                                                            </kbd>
                                                            {keyIdx < shortcut.keys.length - 1 && (
                                                                <span className="text-muted-foreground mx-1">+</span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border bg-muted/30 text-center">
                        <p className="text-xs text-muted-foreground">
                            Tekan <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">?</kbd> atau{' '}
                            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">Ctrl</kbd>
                            <span className="mx-1">+</span>
                            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">/</kbd>
                            {' '}untuk membuka menu ini
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

/**
 * Hook untuk mendengarkan keyboard shortcut
 */
export function useKeyboardShortcuts(onOpen) {
    useEffect(() => {
        function handleKeyDown(e) {
            // ? key (without modifiers) or Ctrl+/
            if ((e.key === '?' && !e.ctrlKey && !e.metaKey) ||
                (e.key === '/' && (e.ctrlKey || e.metaKey))) {
                e.preventDefault()
                onOpen()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onOpen])
}

export default KeyboardShortcutsModal
