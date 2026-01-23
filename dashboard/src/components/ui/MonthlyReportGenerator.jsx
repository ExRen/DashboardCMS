import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { FileText, Download, Calendar, BarChart3, Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"

export function MonthlyReportGenerator({ data, type = "press-releases", title }) {
    const [month, setMonth] = useState(new Date().getMonth())
    const [year, setYear] = useState(new Date().getFullYear())
    const [loading, setLoading] = useState(false)

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ]

    const generateReport = () => {
        setLoading(true)
        setTimeout(() => {
            try {
                const doc = new jsPDF()
                const reportTitle = title || "Laporan Bulanan"

                // Filter Data
                const filteredData = data.filter(item => {
                    const itemYear = item.year || 2024
                    const dateStr = item["TANGGAL"] || ""
                    const monthName = months[month]

                    // Simple string matching for month in date string (e.g. "12 Januari 2024")
                    const isMonthMatch = dateStr.toLowerCase().includes(monthName.toLowerCase())

                    return itemYear === year && isMonthMatch
                })

                // Header
                doc.setFontSize(18)
                doc.text(reportTitle.toUpperCase(), 14, 20)

                doc.setFontSize(11)
                doc.setTextColor(100)
                doc.text(`Periode: ${months[month]} ${year}`, 14, 28)
                doc.text(`Total Data: ${filteredData.length}`, 14, 34)
                doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 40)

                // Table Data
                let tableColumn = []
                let tableRows = []

                if (type === "press-releases") {
                    tableColumn = ["No", "Tanggal", "Judul Rilis", "Lingkup", "Writer"]
                    tableRows = filteredData.map((item, index) => [
                        index + 1,
                        item["TANGGAL"] || "-",
                        item["JUDUL RILIS"] || "-",
                        item["LINGKUP"] || "-",
                        item["WRITER CORCOMM"] || "-"
                    ])
                } else {
                    tableColumn = ["No", "Tanggal", "Judul Konten", "Creator", "Media/Platform", "Views"]
                    tableRows = filteredData.map((item, index) => [
                        index + 1,
                        item["TANGGAL"] || "-",
                        item["JUDUL KONTEN"] || "-",
                        item["CREATOR"] || "-",
                        item["MEDIA"] || "-",
                        item["VIEWS"] || "0"
                    ])
                }

                doc.autoTable({
                    head: [tableColumn],
                    body: tableRows,
                    startY: 50,
                    theme: 'grid',
                    styles: { fontSize: 8, cellPadding: 2 },
                    headStyles: { fillColor: [41, 128, 185], textColor: 255 }
                })

                doc.save(`${reportTitle.replace(/\s+/g, '_')}_${months[month]}_${year}.pdf`)
            } catch (err) {
                console.error("Report generation failed:", err)
            } finally {
                setLoading(false)
            }
        }, 500)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {title || 'Laporan Bulanan'}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">

                    <div>
                        <label className="text-sm font-medium mb-1 block">Bulan</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="w-full h-10 px-3 py-2 rounded-md bg-transparent border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                        >
                            {months.map((m, idx) => (
                                <option key={idx} value={idx} className="bg-popover text-popover-foreground">{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Tahun</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="w-full h-10 px-3 py-2 rounded-md bg-transparent border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y} className="bg-popover text-popover-foreground">{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <Button onClick={generateReport} disabled={loading} className="w-full">
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate Laporan PDF
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
