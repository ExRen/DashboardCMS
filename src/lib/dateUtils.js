// Date utility functions for Indonesian date format

const MONTHS = {
  'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
  'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
}

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

/**
 * Parse Indonesian date string to Date object
 * @param {string} dateStr - Date string like "1 Januari 2025"
 * @returns {Date|null}
 */
export function parseDate(dateStr) {
  if (!dateStr) return null
  const parts = dateStr.split(' ')
  if (parts.length >= 3) {
    const day = parseInt(parts[0])
    const month = MONTHS[parts[1]]
    const year = parseInt(parts[2])
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day)
    }
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
    if (dateFrom && date < new Date(dateFrom)) return false
    if (dateTo && date > new Date(dateTo)) return false
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
