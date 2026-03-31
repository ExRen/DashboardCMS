/**
 * Clipboard Utility Functions
 * Copy text, table data, and formatted content to clipboard
 */

/**
 * Copy plain text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    }
  } catch (error) {
    console.error('Failed to copy:', error)
    return false
  }
}

/**
 * Copy table data as tab-separated values (for Excel/Sheets paste)
 * @param {Array<Object>} rows - Array of row objects
 * @param {Array<string>} columns - Column keys to include
 * @returns {Promise<boolean>} - Success status
 */
export async function copyTableData(rows, columns = null) {
  if (!rows || rows.length === 0) return false
  
  const keys = columns || Object.keys(rows[0])
  
  // Create header row
  const header = keys.join('\t')
  
  // Create data rows
  const dataRows = rows.map(row => 
    keys.map(key => {
      const value = row[key] || ''
      // Escape tabs and newlines
      return String(value).replace(/[\t\n\r]/g, ' ')
    }).join('\t')
  )
  
  const content = [header, ...dataRows].join('\n')
  return copyToClipboard(content)
}

/**
 * Copy data as formatted markdown table
 * @param {Array<Object>} rows - Array of row objects
 * @param {Array<string>} columns - Column keys to include
 * @returns {Promise<boolean>} - Success status
 */
export async function copyAsMarkdown(rows, columns = null) {
  if (!rows || rows.length === 0) return false
  
  const keys = columns || Object.keys(rows[0])
  
  // Header row
  const header = '| ' + keys.join(' | ') + ' |'
  
  // Separator row
  const separator = '| ' + keys.map(() => '---').join(' | ') + ' |'
  
  // Data rows
  const dataRows = rows.map(row => 
    '| ' + keys.map(key => {
      const value = row[key] || '-'
      // Escape pipe characters
      return String(value).replace(/\|/g, '\\|')
    }).join(' | ') + ' |'
  )
  
  const content = [header, separator, ...dataRows].join('\n')
  return copyToClipboard(content)
}

/**
 * Copy single item details as formatted text
 * @param {Object} item - Item object
 * @param {Array<{key: string, label: string}>} fields - Fields to include
 * @returns {Promise<boolean>} - Success status
 */
export async function copyItemDetails(item, fields) {
  if (!item) return false
  
  const lines = fields.map(({ key, label }) => {
    const value = item[key] || '-'
    return `${label}: ${value}`
  })
  
  return copyToClipboard(lines.join('\n'))
}
