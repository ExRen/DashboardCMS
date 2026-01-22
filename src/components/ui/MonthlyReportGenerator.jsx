import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { FileText, Download, Calendar, BarChart3, Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"

export function MonthlyReportGenerator({ data, type = "press-releases" }) {
    const [loading, setLoading] = useState(false)
    const [month, setMonth] = useState(new Date().getMonth())
    const [year, setYear] = useState(new Date().getFullYear())

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]

    async function generateReport() {
        setLoading(true)

        try {
            // Filter data for selected month
            const filteredData = data.filter(item => {
                const dateField = type === 'press-releases' ? 'TANGGAL TERBIT' : 'TANGGAL'
                const itemDate = new Date(item[dateField])
                return itemDate.getMonth() === month && itemDate.getFullYear() === year
            })

            // Calculate statistics
            const stats = calculateStats(filteredData)

            // Generate PDF
            const doc = new jsPDF()

            // Header
            doc.setFontSize(20)
            doc.setTextColor(0, 102, 204)
            doc.text('LAPORAN BULANAN', 105, 20, { align: 'center' })

            doc.setFontSize(14)
            doc.setTextColor(0, 0, 0)
            doc.text(`${type === 'press-releases' ? 'SIARAN PERS' : 'COMMANDO'}`, 105, 30, { align: 'center' })
            doc.text(`${months[month]} ${year}`, 105, 38, { align: 'center' })

            doc.setFontSize(10)
            doc.text(`Digenerate: ${new Date().toLocaleDateString('id-ID')}`, 105, 46, { align: 'center' })

            // Line
            doc.setDrawColor(0, 102, 204)
            doc.line(20, 52, 190, 52)

            // Summary Box
            doc.setFillColor(240, 240, 240)
            doc.rect(20, 58, 170, 30, 'F')

            doc.setFontSize(12)
            doc.setTextColor(0, 0, 0)
            doc.text('RINGKASAN', 25, 68)

            doc.setFontSize(10)
            doc.text(`Total Konten: ${filteredData.length}`, 25, 78)
            doc.text(`Kategori Terbanyak: ${stats.topCategory || '-'}`, 80, 78)
            doc.text(`Rata-rata per Minggu: ${stats.avgPerWeek}`, 145, 78)

            // Category Distribution
            doc.setFontSize(12)
            doc.text('DISTRIBUSI KATEGORI', 20, 100)

            const categoryData = Object.entries(stats.categories).map(([name, count]) => [
                name, count.toString(), `${((count / filteredData.length) * 100).toFixed(1)}%`
            ])

            doc.autoTable({
                startY: 105,
                head: [['Kategori', 'Jumlah', 'Persentase']],
                body: categoryData.length > 0 ? categoryData : [['Tidak ada data', '-', '-']],
                theme: 'striped',
                headStyles: { fillColor: [0, 102, 204] }
            })

            // Weekly Distribution
            doc.setFontSize(12)
            const weeklyY = doc.lastAutoTable.finalY + 15
            doc.text('DISTRIBUSI MINGGUAN', 20, weeklyY)

            const weeklyData = [
                ['Minggu 1', stats.weekly[0]?.toString() || '0'],
                ['Minggu 2', stats.weekly[1]?.toString() || '0'],
                ['Minggu 3', stats.weekly[2]?.toString() || '0'],
                ['Minggu 4', stats.weekly[3]?.toString() || '0'],
                ['Minggu 5', stats.weekly[4]?.toString() || '0']
            ]

            doc.autoTable({
                startY: weeklyY + 5,
                head: [['Minggu', 'Jumlah Konten']],
                body: weeklyData,
                theme: 'striped',
                headStyles: { fillColor: [0, 102, 204] }
            })

            // Content List
            doc.addPage()
            doc.setFontSize(14)
            doc.text('DAFTAR KONTEN', 20, 20)

            const contentData = filteredData.slice(0, 50).map((item, idx) => [
                (idx + 1).toString(),
                (item['JUDUL BERITA'] || item['JUDUL KONTEN'] || '-').substring(0, 50),
                item['KATEGORI'] || '-',
                item['TANGGAL TERBIT'] || item['TANGGAL'] || '-'
            ])

            doc.autoTable({
                startY: 25,
                head: [['No', 'Judul', 'Kategori', 'Tanggal']],
                body: contentData.length > 0 ? contentData : [['', 'Tidak ada data', '', '']],
                theme: 'striped',
                headStyles: { fillColor: [0, 102, 204] },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 90 },
                    2: { cellWidth: 40 },
                    3: { cellWidth: 35 }
                }
            })

            // Footer
            const pageCount = doc.internal.getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i)
                doc.setFontSize(8)
                doc.setTextColor(128, 128, 128)
                doc.text(`Halaman ${i} dari ${pageCount}`, 105, 290, { align: 'center' })
                doc.text('PT ASABRI (Persero) - Dashboard CMS', 20, 290)
            }

            // Save
            doc.save(`Laporan_${type}_${months[month]}_${year}.pdf`)

        } catch (error) {
            console.error("Error generating report:", error)
        }

        setLoading(false)
    }

    function calculateStats(items) {
        const categories = {}
        const weekly = [0, 0, 0, 0, 0]

        items.forEach(item => {
            // Count categories
            const cat = item['KATEGORI'] || 'Lainnya'
            categories[cat] = (categories[cat] || 0) + 1

            // Count weekly
            const dateField = type === 'press-releases' ? 'TANGGAL TERBIT' : 'TANGGAL'
            const date = new Date(item[dateField])
            const weekOfMonth = Math.floor(date.getDate() / 7)
            if (weekOfMonth < 5) weekly[weekOfMonth]++
        })

        const topCategory = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])[0]?.[0]

        return {
            categories,
            weekly,
            topCategory,
            avgPerWeek: (items.length / 4).toFixed(1)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Laporan Bulanan
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">Bulan</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="w-full mt-1 p-3 rounded-lg bg-muted border border-border"
                        >
                            {months.map((m, idx) => (
                                <option key={idx} value={idx}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Tahun</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="w-full mt-1 p-3 rounded-lg bg-muted border border-border"
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
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
