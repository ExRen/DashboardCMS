import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const DataContext = createContext()

const FETCH_BATCH_SIZE = 1000
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function DataProvider({ children }) {
    const [pressReleases, setPressReleases] = useState([])
    const [commandoContents, setCommandoContents] = useState([])
    const [socialPosts, setSocialPosts] = useState([])
    const [newsMonitoring, setNewsMonitoring] = useState([])
    const [assets, setAssets] = useState([])
    const [offices, setOffices] = useState([])
    const [loading, setLoading] = useState({ press: false, commando: false, social: false, news: false, assets: false, offices: false })
    const [lastFetch, setLastFetch] = useState({ press: 0, commando: 0, social: 0, news: 0, assets: 0, offices: 0 })
    const [error, setError] = useState(null)
    const fetchingRef = useRef({ press: false, commando: false })
    const { user, isPusat, userOfficeId } = useAuth()

    // Fetch all rows with pagination
    async function fetchAllRows(table, orderBy = 'NO', officeId = null) {
        let query = supabase.from(table).select('*', { count: 'exact', head: true })
        if (officeId) query = query.eq('office_id', officeId)

        const { count } = await query
        const totalRows = count || 0
        let allRows = []
        let offset = 0
        while (offset < totalRows) {
            let selectQuery = supabase
                .from(table)
                .select('*')
                .order(orderBy, { ascending: false })
                .range(offset, offset + FETCH_BATCH_SIZE - 1)

            if (officeId) selectQuery = selectQuery.eq('office_id', officeId)

            const { data, error } = await selectQuery
            if (error) throw error
            if (data) allRows = [...allRows, ...data]
            offset += FETCH_BATCH_SIZE
        }
        return allRows
    }

    // Fetch Press Releases with cache
    const fetchPressReleases = useCallback(async (force = false) => {
        const now = Date.now()
        const cacheValid = now - lastFetch.press < CACHE_DURATION

        if (!force && cacheValid && pressReleases.length > 0) {
            return pressReleases
        }

        if (fetchingRef.current.press) return pressReleases

        fetchingRef.current.press = true
        setLoading(prev => ({ ...prev, press: true }))

        try {
            const data = await fetchAllRows('press_releases', '"TANGGAL TERBIT"', isPusat ? null : userOfficeId)
            setPressReleases(data)
            setLastFetch(prev => ({ ...prev, press: now }))
            return data
        } catch (err) {
            setError(err.message)
            return []
        } finally {
            setLoading(prev => ({ ...prev, press: false }))
            fetchingRef.current.press = false
        }
    }, [lastFetch.press, pressReleases])

    // Server-Side Pagination for Press Releases
    const fetchPressReleasesPaginated = useCallback(async ({ page = 1, pageSize = 50, filters = {}, sort = { field: 'NO', order: 'desc' } }) => {
        try {
            let query = supabase.from('press_releases').select('*', { count: 'exact' })

            const effectiveOfficeId = isPusat ? null : userOfficeId
            if (effectiveOfficeId) {
                query = query.eq('office_id', effectiveOfficeId)
            }

            // Apply Filters
            if (filters.jenis) query = query.eq('JENIS RILIS', filters.jenis)
            if (filters.year) query = query.eq('year', filters.year)
            if (filters.search) {
                const term = filters.search.toLowerCase()
                query = query.or(`"JUDUL SIARAN PERS".ilike.%${term}%,"NOMOR SIARAN PERS".ilike.%${term}%`)
            }
            if (filters.dateFrom) query = query.gte('"TANGGAL TERBIT"', filters.dateFrom)
            if (filters.dateTo) query = query.lte('"TANGGAL TERBIT"', filters.dateTo)

            // Apply Sort
            if (sort.field === 'TANGGAL TERBIT') {
                // Use raw column name for sorting if needed, usually same as field
                query = query.order('"TANGGAL TERBIT"', { ascending: sort.order === 'asc' })
            } else if (sort.field === 'created_at') {
                query = query.order('created_at', { ascending: sort.order === 'asc' })
            } else {
                query = query.order(sort.field, { ascending: sort.order === 'asc' })
            }

            // Apply Pagination
            const from = (page - 1) * pageSize
            const to = from + pageSize - 1
            query = query.range(from, to)

            const { data, count, error } = await query
            if (error) throw error

            return { data, count }
        } catch (err) {
            console.error("Pagination Fetch Error:", err)
            throw err
        }
    }, [isPusat, userOfficeId])

    // Fetch COMMANDO with cache
    const fetchCommandoContents = useCallback(async (force = false) => {
        const now = Date.now()
        const cacheValid = now - lastFetch.commando < CACHE_DURATION

        if (!force && cacheValid && commandoContents.length > 0) {
            return commandoContents
        }

        if (fetchingRef.current.commando) return commandoContents

        fetchingRef.current.commando = true
        setLoading(prev => ({ ...prev, commando: true }))

        try {
            const data = await fetchAllRows('commando_contents', 'TANGGAL', isPusat ? null : userOfficeId)
            setCommandoContents(data)
            setLastFetch(prev => ({ ...prev, commando: now }))
            return data
        } catch (err) {
            setError(err.message)
            return []
        } finally {
            setLoading(prev => ({ ...prev, commando: false }))
            fetchingRef.current.commando = false
        }
    }, [lastFetch.commando, commandoContents])

    // Fetch Social Posts
    const fetchSocialPosts = useCallback(async (force = false) => {
        const now = Date.now()
        if (!force && now - lastFetch.social < CACHE_DURATION && socialPosts.length > 0) return socialPosts
        setLoading(prev => ({ ...prev, social: true }))
        try {
            const data = await fetchAllRows('social_posts', 'tanggal_posting', isPusat ? null : userOfficeId)
            setSocialPosts(data)
            setLastFetch(prev => ({ ...prev, social: now }))
            return data
        } catch (err) { return [] } finally { setLoading(prev => ({ ...prev, social: false })) }
    }, [lastFetch.social, socialPosts])

    // Fetch News Monitoring
    const fetchNewsMonitoring = useCallback(async (force = false) => {
        const now = Date.now()
        if (!force && now - lastFetch.news < CACHE_DURATION && newsMonitoring.length > 0) return newsMonitoring
        setLoading(prev => ({ ...prev, news: true }))
        try {
            const data = await fetchAllRows('news_monitoring', 'tanggal', isPusat ? null : userOfficeId)
            setNewsMonitoring(data)
            setLastFetch(prev => ({ ...prev, news: now }))
            return data
        } catch (err) { return [] } finally { setLoading(prev => ({ ...prev, news: false })) }
    }, [lastFetch.news, newsMonitoring])

    // Fetch Assets
    const fetchAssets = useCallback(async (force = false) => {
        const now = Date.now()
        if (!force && now - lastFetch.assets < CACHE_DURATION && assets.length > 0) return assets
        setLoading(prev => ({ ...prev, assets: true }))
        try {
            const data = await fetchAllRows('assets', 'tanggal_produksi', isPusat ? null : userOfficeId)
            setAssets(data)
            setLastFetch(prev => ({ ...prev, assets: now }))
            return data
        } catch (err) { return [] } finally { setLoading(prev => ({ ...prev, assets: false })) }
    }, [lastFetch.assets, assets])

    // Fetch Offices (with coordinates)
    const fetchOffices = useCallback(async (force = false) => {
        const now = Date.now()
        if (!force && now - lastFetch.offices < CACHE_DURATION && offices.length > 0) return offices
        setLoading(prev => ({ ...prev, offices: true }))
        try {
            const { data, error } = await supabase.from('offices').select('*').order('name')
            if (error) throw error
            setOffices(data || [])
            setLastFetch(prev => ({ ...prev, offices: now }))
            return data
        } catch (err) { return [] } finally { setLoading(prev => ({ ...prev, offices: false })) }
    }, [lastFetch.offices, offices])

    // Fetch all datasets
    const fetchAll = useCallback(async (force = false) => {
        await Promise.all([
            fetchPressReleases(force),
            fetchCommandoContents(force),
            fetchSocialPosts(force),
            fetchNewsMonitoring(force),
            fetchAssets(force),
            fetchOffices(force)
        ])
    }, [fetchPressReleases, fetchCommandoContents, fetchSocialPosts, fetchNewsMonitoring, fetchAssets, fetchOffices])

    // Refresh single item in cache
    const refreshItem = useCallback((type, id, newData) => {
        if (type === 'press') {
            setPressReleases(prev => prev.map(item => item.id === id ? { ...item, ...newData } : item))
        } else {
            setCommandoContents(prev => prev.map(item => item.id === id ? { ...item, ...newData } : item))
        }
    }, [])

    // Add item to cache
    const addItem = useCallback((type, newItem) => {
        if (type === 'press') {
            setPressReleases(prev => [newItem, ...prev])
        } else {
            setCommandoContents(prev => [newItem, ...prev])
        }
    }, [])

    // Remove item from cache
    const removeItem = useCallback((type, id) => {
        if (type === 'press') {
            setPressReleases(prev => prev.filter(item => item.id !== id))
        } else {
            setCommandoContents(prev => prev.filter(item => item.id !== id))
        }
    }, [])

    // Remove multiple items from cache
    const removeItems = useCallback((type, ids) => {
        if (type === 'press') {
            setPressReleases(prev => prev.filter(item => !ids.includes(item.id)))
        } else {
            setCommandoContents(prev => prev.filter(item => !ids.includes(item.id)))
        }
    }, [])

    // Initial fetch on mount
    useEffect(() => {
        fetchAll()
    }, [])

    return (
        <DataContext.Provider value={{
            pressReleases,
            commandoContents,
            socialPosts,
            newsMonitoring,
            assets,
            offices,
            loading,
            error,
            lastFetch,
            fetchPressReleases,
            fetchPressReleasesPaginated,
            fetchCommandoContents,
            fetchSocialPosts,
            fetchNewsMonitoring,
            fetchAssets,
            fetchOffices,
            fetchAll,
            refreshItem,
            addItem,
            removeItem,
            removeItems,
            cacheInfo: {
                pressCount: pressReleases.length,
                commandoCount: commandoContents.length,
                socialCount: socialPosts.length,
                newsCount: newsMonitoring.length,
                assetsCount: assets.length
            }
        }}>
            {children}
        </DataContext.Provider>
    )
}

export function useData() {
    const context = useContext(DataContext)
    if (!context) {
        throw new Error('useData must be used within a DataProvider')
    }
    return context
}
