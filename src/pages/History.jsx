import { useState } from "react"
import {
    History as HistoryIcon,
    Search,
    Calendar,
    Filter,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    FileText,
    Download,
    Edit,
    Trash2
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { AuditTrail } from "@/components/ui/AuditTrail"

/**
 * Page: History (Audit Log)
 * Centralized view for all system activities
 */
export function History() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedType, setSelectedType] = useState("all")

    return (
        <div className="space-y-6">
            {/* Header Analysis */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Audit Log & Riwayat</h1>
                    <p className="text-muted-foreground">
                        Pantau seluruh perubahan data dan aktivitas pengguna di sistem.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                        <Download className="h-4 w-4" />
                        Ekspor Log
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Full Audit Trail Component */}
                <Card className="border-none shadow-none bg-transparent">
                    <AuditTrail />
                </Card>

                {/* Legend/Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Informasi Pelacakan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div className="flex items-start gap-2">
                                <div className="p-1 rounded bg-green-500/10 text-green-600 mt-0.5">
                                    <FileText className="h-3 w-3" />
                                </div>
                                <div>
                                    <p className="font-bold">CREATE</p>
                                    <p className="text-muted-foreground text-[10px]">Penambahan data baru ke sistem.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="p-1 rounded bg-blue-500/10 text-blue-600 mt-0.5">
                                    <Edit className="h-3 w-3" />
                                </div>
                                <div>
                                    <p className="font-bold">UPDATE</p>
                                    <p className="text-muted-foreground text-[10px]">Perubahan pada data yang sudah ada.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="p-1 rounded bg-red-500/10 text-red-600 mt-0.5">
                                    <Trash2 className="h-3 w-3" />
                                </div>
                                <div>
                                    <p className="font-bold">DELETE</p>
                                    <p className="text-muted-foreground text-[10px]">Penghapusan data permanent dari database.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default History
