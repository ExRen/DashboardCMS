/**
 * Audit Trail Service
 * Mencatat semua perubahan data penting
 */

const STORAGE_KEY = 'auditTrail'

/**
 * Action types
 */
export const ACTIONS = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    BULK_EDIT: 'bulk_edit',
    BULK_DELETE: 'bulk_delete',
    IMPORT: 'import',
    EXPORT: 'export',
    ASSIGN: 'assign',
}

/**
 * Log an action to the audit trail
 * @param {string} action - Action type from ACTIONS
 * @param {string} itemType - Type of item (commando, press_release)
 * @param {string|number|null} itemId - ID of the item (null for bulk actions)
 * @param {Object} details - Additional details
 */
export function logAction(action, itemType, itemId, details = {}) {
    const logs = getAuditLogs()
    
    const entry = {
        id: Date.now(),
        action,
        itemType,
        itemId,
        details,
        user: getCurrentUser(),
        timestamp: new Date().toISOString(),
    }
    
    logs.unshift(entry) // Add to beginning
    
    // Keep only last 500 entries
    const trimmedLogs = logs.slice(0, 500)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLogs))
    
    return entry
}

/**
 * Get current user (mock - in production, get from auth)
 */
function getCurrentUser() {
    return localStorage.getItem('userName') || 'Admin'
}

/**
 * Get all audit logs
 */
export function getAuditLogs() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
        return []
    }
}

/**
 * Get audit logs for a specific item
 */
export function getItemAuditLogs(itemType, itemId) {
    const logs = getAuditLogs()
    return logs.filter(log => log.itemType === itemType && log.itemId === itemId)
}

/**
 * Get audit logs by action type
 */
export function getLogsByAction(action) {
    const logs = getAuditLogs()
    return logs.filter(log => log.action === action)
}

/**
 * Get audit logs within a date range
 */
export function getLogsByDateRange(startDate, endDate) {
    const logs = getAuditLogs()
    return logs.filter(log => {
        const logDate = new Date(log.timestamp)
        return logDate >= startDate && logDate <= endDate
    })
}

/**
 * Clear all audit logs
 */
export function clearAuditLogs() {
    localStorage.removeItem(STORAGE_KEY)
}

/**
 * Format action for display
 */
export function formatAction(action) {
    const actionLabels = {
        [ACTIONS.CREATE]: { label: 'Dibuat', color: 'text-green-500', bg: 'bg-green-500/10' },
        [ACTIONS.UPDATE]: { label: 'Diperbarui', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        [ACTIONS.DELETE]: { label: 'Dihapus', color: 'text-red-500', bg: 'bg-red-500/10' },
        [ACTIONS.BULK_EDIT]: { label: 'Edit Massal', color: 'text-purple-500', bg: 'bg-purple-500/10' },
        [ACTIONS.BULK_DELETE]: { label: 'Hapus Massal', color: 'text-red-500', bg: 'bg-red-500/10' },
        [ACTIONS.IMPORT]: { label: 'Diimpor', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        [ACTIONS.EXPORT]: { label: 'Diekspor', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
        [ACTIONS.ASSIGN]: { label: 'Ditugaskan', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    }
    return actionLabels[action] || { label: action, color: 'text-muted-foreground', bg: 'bg-muted' }
}

export default { logAction, getAuditLogs, getItemAuditLogs, formatAction, ACTIONS }
