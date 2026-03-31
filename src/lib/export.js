// Export utility functions for multiple formats

// ==================== CSV ====================
export function exportToCSV(data, filename, columns = null) {
  if (!data || data.length === 0) return
  const cols = columns || Object.keys(data[0])
  const header = cols.join(',')
  const rows = data.map(row => {
    return cols.map(col => {
      let value = row[col]
      if (value === null || value === undefined) value = ''
      value = String(value).replace(/"/g, '""')
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        value = `"${value}"`
      }
      return value
    }).join(',')
  })
  const csv = [header, ...rows].join('\n')
  downloadFile(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`)
}

// ==================== JSON ====================
export function exportToJSON(data, filename) {
  if (!data || data.length === 0) return
  const json = JSON.stringify(data, null, 2)
  downloadFile(new Blob([json], { type: 'application/json;charset=utf-8;' }), `${filename}.json`)
}

// ==================== EXCEL ====================
export function exportToExcel(data, filename, columns = null) {
  if (!data || data.length === 0) return
  const cols = columns || Object.keys(data[0])
  
  // Create simple XML-based Excel file (works without external libraries)
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>'
  const workbookStart = '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'
  const styles = `<Styles>
    <Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#4F81BD" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF"/></Style>
    <Style ss:ID="date"><NumberFormat ss:Format="yyyy-mm-dd"/></Style>
  </Styles>`
  const worksheetStart = '<Worksheet ss:Name="Data"><Table>'
  
  // Header row
  let headerRow = '<Row ss:StyleID="header">'
  cols.forEach(col => {
    headerRow += `<Cell><Data ss:Type="String">${escapeXml(col)}</Data></Cell>`
  })
  headerRow += '</Row>'
  
  // Data rows
  let dataRows = ''
  data.forEach(row => {
    dataRows += '<Row>'
    cols.forEach(col => {
      const value = row[col] ?? ''
      const type = typeof value === 'number' ? 'Number' : 'String'
      dataRows += `<Cell><Data ss:Type="${type}">${escapeXml(String(value))}</Data></Cell>`
    })
    dataRows += '</Row>'
  })
  
  const worksheetEnd = '</Table></Worksheet>'
  const workbookEnd = '</Workbook>'
  
  const xml = xmlHeader + workbookStart + styles + worksheetStart + headerRow + dataRows + worksheetEnd + workbookEnd
  downloadFile(new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' }), `${filename}.xls`)
}

// ==================== PDF ====================
export function exportToPDF(data, filename, title = 'Report', columns = null) {
  if (!data || data.length === 0) return
  const cols = columns || Object.keys(data[0])
  
  // Create printable HTML and open in new window for PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; border-bottom: 2px solid #4F81BD; padding-bottom: 10px; }
    .meta { color: #666; margin-bottom: 20px; font-size: 12px; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th { background: #4F81BD; color: white; padding: 10px; text-align: left; font-size: 11px; }
    td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 10px; }
    tr:nth-child(even) { background: #f9f9f9; }
    tr:hover { background: #f0f0f0; }
    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; }
    @media print { 
      button { display: none; } 
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">
    <p>Tanggal Export: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p>Total Data: ${data.length} baris</p>
  </div>
  <button onclick="window.print()" style="padding: 10px 20px; background: #4F81BD; color: white; border: none; cursor: pointer; margin-bottom: 20px;">
    🖨️ Print / Save as PDF
  </button>
  <table>
    <thead>
      <tr>${cols.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${data.map(row => `<tr>${cols.map(c => `<td>${escapeHtml(String(row[c] ?? '-'))}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
  <div class="footer">
    <p>ASABRI CMS Dashboard - Generated Report</p>
  </div>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  printWindow.document.write(html)
  printWindow.document.close()
}

// ==================== HELPERS ====================
function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename.replace(/\.[^/.]+$/, '')}_${new Date().toISOString().split('T')[0]}${filename.match(/\.[^/.]+$/)?.[0] || ''}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function parseCSV(text) {
  const lines = text.split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const data = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = []
    let current = ''
    let inQuotes = false
    for (const char of lines[i]) {
      if (char === '"') inQuotes = !inQuotes
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' }
      else current += char
    }
    values.push(current.trim())
    const row = {}
    headers.forEach((header, index) => { row[header] = values[index] || '' })
    data.push(row)
  }
  return { headers, data }
}
