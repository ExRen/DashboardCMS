import { useState, useCallback } from 'react'

/**
 * Custom hook for managing filters state
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Filter state and handlers
 */
export function useFilters(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters)

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  const clearFilter = useCallback((key) => {
    setFilters(prev => ({ ...prev, [key]: '' }))
  }, [])

  return { filters, setFilter, resetFilters, clearFilter, setFilters }
}

/**
 * Custom hook for managing pagination
 * @param {number} pageSize - Items per page
 * @returns {Object} Pagination state and handlers
 */
export function usePagination(pageSize = 50) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const totalPages = Math.ceil(totalCount / pageSize)

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)))
  }, [totalPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const resetPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  const getPageData = useCallback((data) => {
    const startIndex = (currentPage - 1) * pageSize
    return data.slice(startIndex, startIndex + pageSize)
  }, [currentPage, pageSize])

  return {
    currentPage,
    totalCount,
    totalPages,
    pageSize,
    setTotalCount,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    getPageData
  }
}

/**
 * Custom hook for managing sort state
 * @param {string} defaultField - Default sort field
 * @param {string} defaultOrder - Default sort order ('asc' or 'desc')
 * @returns {Object} Sort state and handlers
 */
export function useSort(defaultField = 'NO', defaultOrder = 'desc') {
  const [sortField, setSortField] = useState(defaultField)
  const [sortOrder, setSortOrder] = useState(defaultOrder)

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }, [sortField])

  const sortData = useCallback((data) => {
    return [...data].sort((a, b) => {
      const aVal = a[sortField] || ''
      const bVal = b[sortField] || ''
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1
      return aVal < bVal ? 1 : -1
    })
  }, [sortField, sortOrder])

  return { sortField, sortOrder, handleSort, sortData }
}

/**
 * Custom hook for managing modal state
 * @returns {Object} Modal state and handlers
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [modalData, setModalData] = useState(null)

  const open = useCallback((data = null) => {
    setModalData(data)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setModalData(null)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  return { isOpen, modalData, open, close, toggle }
}

/**
 * Custom hook for managing selection state
 * @returns {Object} Selection state and handlers
 */
export function useSelection() {
  const [selectedIds, setSelectedIds] = useState([])

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    )
  }, [])

  const selectAll = useCallback((ids) => {
    setSelectedIds(ids)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  const isSelected = useCallback((id) => {
    return selectedIds.includes(id)
  }, [selectedIds])

  return { selectedIds, toggleSelect, selectAll, clearSelection, isSelected }
}
