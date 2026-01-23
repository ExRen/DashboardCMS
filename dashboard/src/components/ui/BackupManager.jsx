import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { useData } from "@/context/DataContext"
import { useToast } from "@/components/ui/Toast"
import { Download, Upload, Database, AlertCircle, CheckCircle, FileJson, RefreshCw } from "lucide-react"

/**
 * BackupManager - Export and import full data backups
 */
export function BackupManager() {
    const { commandoContents, pressReleases, fetchAll } = useData()
    const toast = useToast()
    const [importing, setImporting] = useState(false)
    const [restoreData, setRestoreData] = useState(null)

    // Export all data as JSON backup
    function handleExport() {
        const backup = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            data: {
                commando: commandoContents,
                pressReleases: pressReleases
            },
            meta: {
                commandoCount: commandoContents.length,
                pressReleasesCount: pressReleases.length
            }
        }

        const json = JSON.stringify(backup, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `asabri_cms_backup_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success(`Backup berhasil! ${commandoContents.length} commando + ${pressReleases.length} siaran pers`)
    }

    // Handle file upload for restore
    function handleFileUpload(e) {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result)
                if (!data.version || !data.data) {
                    throw new Error("Format backup tidak valid")
                }
                setRestoreData(data)
            } catch (error) {
                toast.error("Gagal membaca file: " + error.message)
            }
        }
        reader.readAsText(file)
    }

    // Handle restore
    async function handleRestore() {
        if (!restoreData) return

        setImporting(true)
        try {
            // Note: Actual restore would require Supabase bulk insert
            // Here we just show the preview and confirmation
            toast.success(`Backup dari ${new Date(restoreData.timestamp).toLocaleDateString('id-ID')} dipilih. Restore manual diperlukan.`)

            // Download as CSV for manual import
            const commandoCSV = restoreData.data.commando.map(c => Object.values(c).join(',')).join('\n')
            const blob = new Blob([commandoCSV], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `restore_commando_${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            setRestoreData(null)
        } catch (error) {
            toast.error("Gagal restore: " + error.message)
        } finally {
            setImporting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Backup & Restore
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                        <div className="text-2xl font-bold text-blue-500">{commandoContents.length}</div>
                        <div className="text-xs text-muted-foreground">Commando</div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10 text-center">
                        <div className="text-2xl font-bold text-green-500">{pressReleases.length}</div>
                        <div className="text-xs text-muted-foreground">Siaran Pers</div>
                    </div>
                </div>

                {/* Export Section */}
                <div className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                        <Download className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Export Backup</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                        Download semua data sebagai file JSON untuk backup
                    </p>
                    <Button onClick={handleExport} className="w-full" variant="outline">
                        <FileJson className="h-4 w-4 mr-2" />
                        Download Backup JSON
                    </Button>
                </div>

                {/* Import Section */}
                <div className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                        <Upload className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Restore dari Backup</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                        Upload file backup JSON untuk melihat isinya
                    </p>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
                    />
                </div>

                {/* Restore Preview */}
                {restoreData && (
                    <div className="p-3 rounded-lg border border-yellow-500/50 bg-yellow-500/5">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium text-sm">Backup dipilih</span>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground mb-3">
                            <div>Tanggal: {new Date(restoreData.timestamp).toLocaleString('id-ID')}</div>
                            <div>Commando: {restoreData.meta?.commandoCount || 0} item</div>
                            <div>Siaran Pers: {restoreData.meta?.pressReleasesCount || 0} item</div>
                        </div>
                        <Button
                            onClick={handleRestore}
                            disabled={importing}
                            className="w-full"
                            variant="outline"
                        >
                            {importing ? (
                                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Memproses...</>
                            ) : (
                                <><CheckCircle className="h-4 w-4 mr-2" />Download CSV untuk Import</>
                            )}
                        </Button>
                    </div>
                )}

                {/* Info */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                        Backup disimpan secara lokal di perangkat Anda. Untuk restore penuh,
                        gunakan fitur Import CSV di halaman COMMANDO atau Siaran Pers.
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}

export default BackupManager
