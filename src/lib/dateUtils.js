// Date utility functions for Indonesian date format

const MONTHS = {
  'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
  'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
}

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

/**
 * Parse Indonesian date string to Date object
 * Supports formats: "1 Januari 2025", "01 Januari 2025", "Thursday, February 13, 2025", etc.
 * @param {string} dateStr - Date string
 * @returns {Date|null}
 */
export function parseDate(dateStr) {
  if (!dateStr) return null
  
  // Clean the string
  let cleaned = String(dateStr).trim()
  
  // Try to extract date parts using various patterns
  // Pattern 1: "1 Januari 2025" or "01 Januari 2025"
  const indonesianPattern = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/
  const match1 = cleaned.match(indonesianPattern)
  if (match1) {
    const day = parseInt(match1[1])
    const monthStr = match1[2]
    const year = parseInt(match1[3])
    const month = MONTHS[monthStr]
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day)
    }
  }
  
  // Pattern 2: English format "Thursday, February 13, 2025" or "February 13, 2025"
  const englishMonths = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
    'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
  }
  const englishPattern = /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/
  const match2 = cleaned.match(englishPattern)
  if (match2) {
    const monthStr = match2[1]
    const day = parseInt(match2[2])
    const year = parseInt(match2[3])
    const month = englishMonths[monthStr]
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day)
    }
  }
  
  // Pattern 3: ISO format "2025-01-13"
  const isoPattern = /(\d{4})-(\d{2})-(\d{2})/
  const match3 = cleaned.match(isoPattern)
  if (match3) {
    const year = parseInt(match3[1])
    const month = parseInt(match3[2]) - 1
    const day = parseInt(match3[3])
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day)
    }
  }
  
  // Fallback: try native Date parsing
  const fallback = new Date(cleaned)
  if (!isNaN(fallback.getTime())) {
    return fallback
  }
  
  return null
}

/**
 * Format Date object to Indonesian date string
 * @param {Date} date - Date object
 * @returns {string} - Formatted string like "1 Januari 2025"
 */
export function formatDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date)) return ''
  const day = date.getDate()
  const month = MONTH_NAMES[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

/**
 * Filter data by date range
 * @param {Array} data - Array of data objects
 * @param {string} dateField - Field name containing date string
 * @param {string} dateFrom - Start date (ISO format)
 * @param {string} dateTo - End date (ISO format)
 * @returns {Array}
 */
export function filterByDateRange(data, dateField, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return data
  return data.filter(item => {
    const date = parseDate(item[dateField])
    if (!date) return false
    const fromDate = dateFrom ? new Date(dateFrom) : null
    const toDate = dateTo ? new Date(dateTo) : null
    if (toDate) toDate.setHours(23, 59, 59, 999) // Include whole end day
    if (fromDate && date < fromDate) return false
    if (toDate && date > toDate) return false
    return true
  })
}

/**
 * Get today's date formatted in Indonesian
 * @returns {string}
 */
export function getTodayFormatted() {
  return formatDate(new Date())
}

export { MONTHS, MONTH_NAMES }
