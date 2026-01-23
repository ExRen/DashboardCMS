import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { useData } from "@/context/DataContext"
import { FileText, Download, Calendar, Filter, Eye, Printer } from "lucide-react"

/**
 * ReportGenerator - Custom report builder with branded PDF export
 */
export function ReportGenerator() {
    const { commandoContents, pressReleases, fetchAll, loading } = useData()
    const [dataSource, setDataSource] = useState("commando")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [selectedPlatform, setSelectedPlatform] = useState("")
    const [selectedCreator, setSelectedCreator] = useState("")
    const [reportTitle, setReportTitle] = useState("Laporan Konten")
    const [showPreview, setShowPreview] = useState(false)

    // Ensure data is loaded when component mounts
    useEffect(() => {
        if (pressReleases.length === 0 || commandoContents.length === 0) {
            fetchAll()
        }
    }, [])

    // Get data based on source
    const sourceData = dataSource === "commando" ? commandoContents : pressReleases
    const dateField = dataSource === "commando" ? "TANGGAL" : "TANGGAL TERBIT"

    // Get unique options
    const platforms = [...new Set(commandoContents.map(c => c["MEDIA"]).filter(Boolean))]
    const creators = [...new Set(commandoContents.map(c => c["CREATOR"]).filter(Boolean))]

    // Parse Indonesian date
    function parseDate(dateStr) {
        if (!dateStr) return null
        const months = { 'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11 }
        const parts = String(dateStr).split(' ')
        if (parts.length >= 3) {
            const day = parseInt(parts[0])
            const month = months[parts[1]]
            const year = parseInt(parts[2])
            if (!isNaN(day) && month !== undefined && !isNaN(year)) return new Date(year, month, day)
        }
        return null
    }

    // Filter data based on criteria
    function getFilteredData() {
        let filtered = [...sourceData]

        // Date filter
        if (dateFrom || dateTo) {
            filtered = filtered.filter(item => {
                const date = parseDate(item[dateField])
                if (!date) return false
                if (dateFrom && date < new Date(dateFrom)) return false
                if (dateTo) {
                    const to = new Date(dateTo)
                    to.setHours(23, 59, 59, 999)
                    if (date > to) return false
                }
                return true
            })
        }

        // Platform filter (commando only)
        if (dataSource === "commando" && selectedPlatform) {
            filtered = filtered.filter(c => c["MEDIA"] === selectedPlatform)
        }

        // Creator filter (commando only)
        if (dataSource === "commando" && selectedCreator) {
            filtered = filtered.filter(c => c["CREATOR"] === selectedCreator)
        }

        return filtered
    }

    const filteredData = getFilteredData()

    // Generate and download PDF
    function generatePDF() {
        const data = filteredData
        const cols = dataSource === "commando"
            ? ["TANGGAL", "JUDUL KONTEN", "JENIS KONTEN", "MEDIA", "CREATOR"]
            : ["TANGGAL TERBIT", "JUDUL SIARAN PERS", "JENIS RILIS", "KETEGORI", "WRITER CORCOMM"]

        const colLabels = dataSource === "commando"
            ? ["Tanggal", "Judul Konten", "Jenis", "Media", "Creator"]
            : ["Tanggal", "Judul Siaran Pers", "Jenis Rilis", "Kategori", "Writer"]

        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${reportTitle}</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 0; 
            padding: 40px;
            color: #1f2937;
        }
        .header { 
            display: flex;
            align-items: center;
            gap: 20px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3b82f6;
            margin-bottom: 30px;
        }
        .logo { 
            width: 60px; 
            height: 60px; 
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
        }
        .title-section h1 { 
            margin: 0; 
            font-size: 24px;
            color: #1f2937;
        }
        .title-section p { 
            margin: 5px 0 0; 
            color: #6b7280;
            font-size: 14px;
        }
        .meta { 
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        .meta-card {
            padding: 15px;
            background: #f3f4f6;
            border-radius: 8px;
            text-align: center;
        }
        .meta-card .value {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
        }
        .meta-card .label {
            font-size: 12px;
            color: #6b7280;
            margin-top: 5px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            font-size: 11px;
        }
        th { 
            background: #3b82f6; 
            color: white; 
            padding: 12px 8px; 
            text-align: left;
            font-weight: 600;
        }
        td { 
            padding: 10px 8px; 
            border-bottom: 1px solid #e5e7eb;
        }
        tr:nth-child(even) { background: #f9fafb; }
        tr:hover { background: #f3f4f6; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 11px;
        }
        @media print { 
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">A</div>
        <div class="title-section">
            <h1>${reportTitle}</h1>
            <p>PT ASABRI (Persero) - Generated on ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
    </div>

    <div class="meta">
        <div class="meta-card">
            <div class="value">${data.length}</div>
            <div class="label">Total Data</div>
        </div>
        <div class="meta-card">
            <div class="value">${dateFrom || 'Semua'}</div>
            <div class="label">Dari Tanggal</div>
        </div>
        <div class="meta-card">
            <div class="value">${dateTo || 'Semua'}</div>
            <div class="label">Sampai Tanggal</div>
        </div>
        <div class="meta-card">
            <div class="value">${dataSource === 'commando' ? 'COMMANDO' : 'Siaran Pers'}</div>
            <div class="label">Sumber Data</div>
        </div>
    </div>

    <button onclick="window.print()" class="no-print" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin-bottom: 20px;">
        🖨️ Print / Save as PDF
    </button>

    <table>
        <thead>
            <tr>
                <th style="width: 40px">No</th>
                ${colLabels.map(c => `<th>${c}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${data.map((row, idx) => `
                <tr>
                    <td>${idx + 1}</td>
                    ${cols.map(c => `<td>${(row[c] || '-').toString().slice(0, 50)}${(row[c] || '').toString().length > 50 ? '...' : ''}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="footer">
        <p>ASABRI CMS Dashboard - Confidential Report</p>
        <p>© ${new Date().getFullYear()} PT ASABRI (Persero). All rights reserved.</p>
    </div>
</body>
</html>`

        const printWindow = window.open('', '_blank')
        printWindow.document.write(html)
        printWindow.document.close()
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Report Generator
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Report Title */}
                <div>
                    <label className="text-sm font-medium">Judul Laporan</label>
                    <input
                        type="text"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                        placeholder="Masukkan judul laporan..."
                    />
                </div>

                {/* Data Source */}
                <div>
                    <label className="text-sm font-medium">Sumber Data</label>
                    <select
                        value={dataSource}
                        onChange={(e) => setDataSource(e.target.value)}
                        className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                    >
                        <option value="commando">COMMANDO Content</option>
                        <option value="press">Siaran Pers</option>
                    </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Dari Tanggal
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Sampai Tanggal
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                        />
                    </div>
                </div>

                {/* Filters (Commando only) */}
                {dataSource === "commando" && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium flex items-center gap-1">
                                <Filter className="h-3 w-3" /> Platform
                            </label>
                            <select
                                value={selectedPlatform}
                                onChange={(e) => setSelectedPlatform(e.target.value)}
                                className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                            >
                                <option value="">Semua Platform</option>
                                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium flex items-center gap-1">
                                <Filter className="h-3 w-3" /> Creator
                            </label>
                            <select
                                value={selectedCreator}
                                onChange={(e) => setSelectedCreator(e.target.value)}
                                className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                            >
                                <option value="">Semua Creator</option>
                                {creators.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* Preview Stats */}
                <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Data yang akan di-export:</span>
                        </div>
                        <span className="text-2xl font-bold text-primary">{filteredData.length}</span>
                    </div>
                </div>

                {/* Generate Button */}
                <Button onClick={generatePDF} className="w-full" disabled={filteredData.length === 0}>
                    <Printer className="h-4 w-4 mr-2" />
                    Generate & Print Report
                </Button>
            </CardContent>
        </Card>
    )
}

export default ReportGenerator
