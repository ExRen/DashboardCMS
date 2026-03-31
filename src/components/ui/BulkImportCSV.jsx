import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/Toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import {
    Upload, FileSpreadsheet, X, Check, AlertCircle,
    Loader2, Download, ChevronDown, ChevronUp
} from "lucide-react"

export function BulkImportCSV({ table, columns, onComplete }) {
    const toast = useToast()
    const fileInputRef = useRef(null)
    const [file, setFile] = useState(null)
    const [parsedData, setParsedData] = useState([])
    const [errors, setErrors] = useState([])
    const [step, setStep] = useState('upload') // upload, preview, importing, complete
    const [progress, setProgress] = useState(0)
    const [showPreview, setShowPreview] = useState(true)

    function parseCSV(text) {
        const lines = text.split('\n').filter(l => l.trim())
        if (lines.length < 2) return { headers: [], rows: [] }

        const headers = parseCSVLine(lines[0])
        const rows = []

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i])
            const row = {}
            headers.forEach((h, idx) => {
                row[h.trim()] = values[idx]?.trim() || ''
            })
            rows.push(row)
        }

        return { headers, rows }
    }

    function parseCSVLine(line) {
        const values = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
                inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
                values.push(current)
                current = ''
            } else {
                current += char
            }
        }
        values.push(current)
        return values.map(v => v.replace(/^"|"$/g, '').trim())
    }

    function handleFileSelect(e) {
        const selectedFile = e.target.files[0]
        if (!selectedFile) return

        if (!selectedFile.name.endsWith('.csv')) {
            toast.error('Hanya file CSV yang didukung')
            return
        }

        setFile(selectedFile)

        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target.result
            const { headers, rows } = parseCSV(text)

            // Validate columns
            const missingCols = columns.filter(c => !headers.includes(c.csvName))
            if (missingCols.length > 0) {
                setErrors([`Kolom tidak ditemukan: ${missingCols.map(c => c.csvName).join(', ')}`])
            } else {
                setErrors([])
            }

            setParsedData(rows)
            setStep('preview')
        }
        reader.readAsText(selectedFile, 'UTF-8')
    }

    async function handleImport() {
        if (parsedData.length === 0) return

        setStep('importing')
        setProgress(0)

        const batchSize = 50
        let successCount = 0
        let errorMessages = []

        try {
            for (let i = 0; i < parsedData.length; i += batchSize) {
                const batch = parsedData.slice(i, i + batchSize)

                // Map CSV columns to database columns
                const mappedBatch = batch.map(row => {
                    const mapped = {}
                    columns.forEach(col => {
                        if (row[col.csvName] !== undefined) {
                            mapped[col.dbName] = row[col.csvName]
                        }
                    })
                    return mapped
                })

                const { error } = await supabase.from(table).insert(mappedBatch)

                if (error) {
                    errorMessages.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
                } else {
                    successCount += batch.length
                }

                setProgress(Math.round(((i + batch.length) / parsedData.length) * 100))
            }

            if (errorMessages.length > 0) {
                setErrors(errorMessages)
                toast.warning(`Import selesai dengan ${errorMessages.length} error`)
            } else {
                toast.success(`Berhasil import ${successCount} data!`)
            }

            setStep('complete')
            if (onComplete) onComplete(successCount)
        } catch (error) {
            toast.error('Import gagal: ' + error.message)
            setStep('preview')
        }
    }

    function reset() {
        setFile(null)
        setParsedData([])
        setErrors([])
        setStep('upload')
        setProgress(0)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    function downloadTemplate() {
        const headers = columns.map(c => c.csvName).join(',')
        const sample = columns.map(c => c.sample || '').join(',')
        const csv = `${headers}\n${sample}`
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `template_${table}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Import Data dari CSV
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Step: Upload */}
                {step === 'upload' && (
                    <>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-sm font-medium">Klik untuk pilih file CSV</p>
                            <p className="text-xs text-muted-foreground mt-1">atau drag & drop</p>
                        </div>

                        <Button variant="outline" onClick={downloadTemplate} className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Download Template CSV
                        </Button>
                    </>
                )}

                {/* Step: Preview */}
                {step === 'preview' && (
                    <>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{file?.name}</p>
                                <p className="text-sm text-muted-foreground">{parsedData.length} baris data</p>
                            </div>
                            <button onClick={reset} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {errors.length > 0 && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                <AlertCircle className="h-4 w-4 inline mr-2" />
                                {errors.join(', ')}
                            </div>
                        )}

                        {/* Data Preview */}
                        <div>
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="flex items-center gap-2 text-sm font-medium mb-2"
                            >
                                {showPreview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                Preview Data ({Math.min(5, parsedData.length)} dari {parsedData.length})
                            </button>

                            {showPreview && (
                                <div className="border rounded-lg overflow-x-auto max-h-60">
                                    <table className="w-full text-xs">
                                        <thead className="bg-muted">
                                            <tr>
                                                {columns.slice(0, 5).map(col => (
                                                    <th key={col.csvName} className="px-3 py-2 text-left font-medium">
                                                        {col.csvName}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.slice(0, 5).map((row, idx) => (
                                                <tr key={idx} className="border-t">
                                                    {columns.slice(0, 5).map(col => (
                                                        <td key={col.csvName} className="px-3 py-2 truncate max-w-[150px]">
                                                            {row[col.csvName] || '-'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={reset} className="flex-1">
                                Batal
                            </Button>
                            <Button onClick={handleImport} disabled={errors.length > 0} className="flex-1">
                                <Check className="h-4 w-4 mr-2" />
                                Import {parsedData.length} Data
                            </Button>
                        </div>
                    </>
                )}

                {/* Step: Importing */}
                {step === 'importing' && (
                    <div className="text-center py-8">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
                        <p className="font-medium">Mengimport data...</p>
                        <div className="mt-4 max-w-xs mx-auto">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
                        </div>
                    </div>
                )}

                {/* Step: Complete */}
                {step === 'complete' && (
                    <div className="text-center py-8">
                        <Check className="h-10 w-10 mx-auto mb-4 text-green-500" />
                        <p className="font-medium">Import Selesai!</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {parsedData.length} data berhasil diimport
                        </p>
                        {errors.length > 0 && (
                            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 text-yellow-600 text-sm text-left">
                                <p className="font-medium mb-1">Beberapa error:</p>
                                {errors.map((e, i) => <p key={i}>• {e}</p>)}
                            </div>
                        )}
                        <Button onClick={reset} className="mt-4">
                            Import Lagi
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
