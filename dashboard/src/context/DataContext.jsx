import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const DataContext = createContext()

const FETCH_BATCH_SIZE = 1000
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function DataProvider({ children }) {
    const [pressReleases, setPressReleases] = useState([])
    const [commandoContents, setCommandoContents] = useState([])
    const [loading, setLoading] = useState({ press: false, commando: false })
    const [lastFetch, setLastFetch] = useState({ press: 0, commando: 0 })
    const [error, setError] = useState(null)
    const fetchingRef = useRef({ press: false, commando: false })

    // Fetch all rows with pagination
    async function fetchAllRows(table, orderBy = 'NO') {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
        const totalRows = count || 0
        let allRows = []
        let offset = 0
        while (offset < totalRows) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .order(orderBy, { ascending: false })
                .range(offset, offset + FETCH_BATCH_SIZE - 1)
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
            const data = await fetchAllRows('press_releases')
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
            const data = await fetchAllRows('commando_contents')
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

    // Fetch both datasets
    const fetchAll = useCallback(async (force = false) => {
        await Promise.all([
            fetchPressReleases(force),
            fetchCommandoContents(force)
        ])
    }, [fetchPressReleases, fetchCommandoContents])

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
            loading,
            error,
            lastFetch,
            fetchPressReleases,
            fetchCommandoContents,
            fetchAll,
            refreshItem,
            addItem,
            removeItem,
            removeItems,
            cacheInfo: {
                pressCount: pressReleases.length,
                commandoCount: commandoContents.length,
                pressCacheAge: Date.now() - lastFetch.press,
                commandoCacheAge: Date.now() - lastFetch.commando
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
