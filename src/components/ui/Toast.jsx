import { useState, useEffect, createContext, useContext } from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

const ToastContext = createContext()

export function useToast() {
    return useContext(ToastContext)
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    function showToast(message, type = "success", duration = 3000) {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }
    }

    function removeToast(id) {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    function success(message) {
        showToast(message, "success")
    }

    function error(message) {
        showToast(message, "error", 5000)
    }

    function info(message) {
        showToast(message, "info")
    }

    function warning(message) {
        showToast(message, "warning", 4000)
    }

    function confirm(message, onConfirm, onCancel) {
        const id = Date.now()
        setToasts(prev => [...prev, {
            id,
            message,
            type: "confirm",
            onConfirm: () => { removeToast(id); onConfirm?.() },
            onCancel: () => { removeToast(id); onCancel?.() }
        }])
    }

    return (
        <ToastContext.Provider value={{ success, error, info, warning, confirm }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    )
}

function ToastContainer({ toasts, onRemove }) {
    if (toasts.length === 0) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col gap-3 max-w-md w-full px-4">
                {toasts.map(toast => (
                    <Toast key={toast.id} toast={toast} onRemove={onRemove} />
                ))}
            </div>
        </div>
    )
}

function Toast({ toast, onRemove }) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 10)
    }, [])

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        confirm: <AlertTriangle className="h-5 w-5 text-orange-500" />
    }

    const bgColors = {
        success: "bg-green-500/10 border-green-500/30",
        error: "bg-red-500/10 border-red-500/30",
        info: "bg-blue-500/10 border-blue-500/30",
        warning: "bg-yellow-500/10 border-yellow-500/30",
        confirm: "bg-orange-500/10 border-orange-500/30"
    }

    if (toast.type === "confirm") {
        return (
            <div className={`
        pointer-events-auto transform transition-all duration-300 ease-out
        ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
                <div className="bg-card border border-border rounded-xl shadow-2xl p-6 backdrop-blur-lg">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                            {icons.confirm}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-foreground">Konfirmasi</h3>
                            <p className="text-sm text-muted-foreground mt-1">{toast.message}</p>
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={toast.onCancel}
                                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={toast.onConfirm}
                                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`
      pointer-events-auto transform transition-all duration-300 ease-out
      ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
    `}>
            <div className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg shadow-lg
        ${bgColors[toast.type]}
      `}>
                {icons[toast.type]}
                <p className="flex-1 text-sm font-medium text-foreground">{toast.message}</p>
                <button
                    onClick={() => onRemove(toast.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
