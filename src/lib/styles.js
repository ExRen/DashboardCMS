// Centralized style utilities for consistent UI
export const styles = {
    text: {
        h1: "text-2xl font-bold tracking-tight",
        h2: "text-xl font-semibold tracking-tight",
        h3: "text-lg font-semibold",
        subtitle: "text-sm text-muted-foreground",
        label: "text-sm font-medium",
        muted: "text-sm text-muted-foreground",
    },
    card: {
        default: "p-6 rounded-lg border bg-card",
        header: "pb-2 font-semibold",
    },
    input: {
        default: "w-full h-10 px-3 rounded-lg bg-muted border border-border text-sm",
        textarea: "w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm min-h-[100px]",
    },
    button: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
    },
    badge: {
        default: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        error: "bg-red-100 text-red-800",
        info: "bg-blue-100 text-blue-800",
        neutral: "bg-gray-100 text-gray-800",
    }
}
