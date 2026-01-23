import { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText, FileJson, ChevronDown } from 'lucide-react'
import { Button } from './Button'
import { exportToCSV, exportToExcel, exportToPDF, exportToJSON } from '@/lib/export'

export function ExportMenu({ data, filename, title = "Export Data", columns = null }) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    function handleExport(format) {
        switch (format) {
            case 'csv':
                exportToCSV(data, filename, columns)
                break
            case 'excel':
                exportToExcel(data, filename, columns)
                break
            case 'pdf':
                exportToPDF(data, filename, title, columns)
                break
            case 'json':
                exportToJSON(data, filename)
                break
        }
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={menuRef}>
            <Button variant="outline" onClick={() => setIsOpen(!isOpen)}>
                <Download className="h-4 w-4 mr-1" />
                Export
                <ChevronDown className="h-3 w-3 ml-1" />
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <button
                        onClick={() => handleExport('csv')}
                        className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                        <FileText className="h-4 w-4 text-green-600" />
                        <span>Export CSV</span>
                    </button>
                    <button
                        onClick={() => handleExport('excel')}
                        className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        <span>Export Excel</span>
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                        <FileText className="h-4 w-4 text-red-600" />
                        <span>Export PDF</span>
                    </button>
                    <button
                        onClick={() => handleExport('json')}
                        className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2 transition-colors border-t border-border"
                    >
                        <FileJson className="h-4 w-4 text-blue-600" />
                        <span>Export JSON</span>
                    </button>
                </div>
            )}
        </div>
    )
}
