import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { formatShortDate } from "@/lib/utils"
import { ExternalLink } from "lucide-react"

export function RecentTable({ data = [], limit = 10 }) {
    const recentData = data.slice(0, limit)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Siaran Pers Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
                {recentData.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Tanggal</TableHead>
                                <TableHead>Judul</TableHead>
                                <TableHead className="hidden md:table-cell">Kategori</TableHead>
                                <TableHead className="hidden lg:table-cell">Lingkup</TableHead>
                                <TableHead className="w-[80px]">Link</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentData.map((item, index) => (
                                <TableRow key={item.id || index}>
                                    <TableCell className="font-medium text-sm">
                                        {formatShortDate(item.publish_date)}
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate">
                                        {item.title}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                                            {item.categories?.name || "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                        {item.scope || "-"}
                                    </TableCell>
                                    <TableCell>
                                        {item.website_url ? (
                                            <a
                                                href={item.website_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-primary hover:text-primary/80"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        Tidak ada data
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
