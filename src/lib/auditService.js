import { supabase } from './supabase'

/**
 * Audit Trail Service (Supabase Integrated)
 * Mencatat dan mengambil log perubahan data dari database
 */

/**
 * Action types (Mapped to SQL trigger actions)
 */
export const ACTIONS = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    // UI specific labels for filtering
    BULK_EDIT: 'bulk_edit',
    BULK_DELETE: 'bulk_delete',
    IMPORT: 'import',
    EXPORT: 'export'
}

/**
 * Log an action manually (for non-DB triggers like Import/Export)
 * @param {string} action - Action type
 * @param {string} itemType - Type of item
 * @param {string} itemId - ID or label
 * @param {Object} details - Extra info
 */
export async function logAction(action, itemType, itemId, details = {}) {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('name, office_id')
            .eq('id', user.id)
            .single()

        const { error } = await supabase
            .from('activity_logs')
            .insert({
                action,
                item_type: itemType,
                item_id: itemId, // Note: triggers use UUID, manual logs might use string IDs
                details,
                user_id: user.id,
                user_name: profile?.name || user.email,
                office_id: profile?.office_id,
                timestamp: new Date().toISOString()
            })

        if (error) throw error
    } catch (err) {
        console.error("Audit log failed:", err)
    }
}

/**
 * Get activity logs with filters
 */
export async function getAuditLogs(options = {}) {
    const { 
        limit = 50, 
        offset = 0, 
        itemType = null, 
        itemId = null,
        officeId = null,
        action = null
    } = options

    try {
        let query = supabase
            .from('activity_logs')
            .select('*', { count: 'exact' })
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1)

        if (itemType) query = query.eq('item_type', itemType)
        if (itemId) query = query.eq('item_id', itemId)
        if (officeId) query = query.eq('office_id', officeId)
        if (action && action !== 'all') query = query.eq('action', action)

        const { data, count, error } = await query
        if (error) throw error
        
        return { data, count }
    } catch (err) {
        console.error("Fetch audit logs failed:", err)
        return { data: [], count: 0 }
    }
}

/**
 * Format action for display
 */
export function formatAction(action) {
    const actionLabels = {
        'create': { label: 'Dibuat', color: 'text-green-500', bg: 'bg-green-500/10' },
        'update': { label: 'Diperbarui', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        'delete': { label: 'Dihapus', color: 'text-red-500', bg: 'bg-red-500/10' },
        'bulk_edit': { label: 'Edit Massal', color: 'text-purple-500', bg: 'bg-purple-500/10' },
        'import': { label: 'Diimpor', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        'export': { label: 'Diekspor', color: 'text-cyan-500', bg: 'bg-cyan-500/10' }
    }
    return actionLabels[action] || { label: action, color: 'text-muted-foreground', bg: 'bg-muted' }
}

export default { logAction, getAuditLogs, formatAction, ACTIONS }
