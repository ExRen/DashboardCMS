import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { MediaUpload } from "@/components/ui/MediaUpload"
import { useToast } from "@/components/ui/Toast"
import { supabase } from "@/lib/supabase"
import {
    Image, Trash2, Copy, Download, RefreshCw, FolderOpen,
    Grid, List, X, ExternalLink, FileText, Film, Search
} from "lucide-react"

export function MediaLibrary() {
    const toast = useToast()
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState("grid")
    const [showUpload, setShowUpload] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [search, setSearch] = useState("")

    const bucket = "media"

    useEffect(() => {
        fetchFiles()
    }, [])

    async function fetchFiles() {
        setLoading(true)
        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .list('uploads', {
                    limit: 100,
                    sortBy: { column: 'created_at', order: 'desc' }
                })

            if (error) throw error

            // Get public URLs for each file
            const filesWithUrls = (data || []).map(file => {
                const { data: { publicUrl } } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(`uploads/${file.name}`)
                return {
                    ...file,
                    url: publicUrl,
                    path: `uploads/${file.name}`
                }
            })

            setFiles(filesWithUrls)
        } catch (error) {
            console.error("Error fetching files:", error)
            toast.error("Gagal memuat file: " + error.message)
        }
        setLoading(false)
    }

    async function handleDelete(file) {
        toast.confirm(`Hapus file "${file.name}"?`, async () => {
            try {
                const { error } = await supabase.storage
                    .from(bucket)
                    .remove([file.path])

                if (error) throw error

                toast.success("File berhasil dihapus!")
                await fetchFiles()
                setSelectedFile(null)
            } catch (error) {
                toast.error("Gagal menghapus: " + error.message)
            }
        })
    }

    function handleCopyUrl(url) {
        navigator.clipboard.writeText(url)
        toast.success("URL berhasil disalin!")
    }

    function handleUploadComplete(fileInfo) {
        setShowUpload(false)
        fetchFiles()
    }

    function getFileIcon(file) {
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
            return <Image className="h-8 w-8 text-blue-500" />
        }
        if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
            return <Film className="h-8 w-8 text-purple-500" />
        }
        return <FileText className="h-8 w-8 text-gray-500" />
    }

    function isImage(file) {
        const ext = file.name.split('.').pop()?.toLowerCase()
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
    }

    function formatFileSize(bytes) {
        if (!bytes) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Media Library</h1>
                    <p className="text-sm text-muted-foreground">Kelola file dan gambar</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchFiles} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowUpload(true)}>
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Upload File
                    </Button>
                </div>
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-lg mx-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Upload File</CardTitle>
                            <button onClick={() => setShowUpload(false)}>
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <MediaUpload
                                onUpload={handleUploadComplete}
                                accept="image/*,video/*,.pdf,.doc,.docx"
                                maxSize={10}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* File Detail Modal */}
            {selectedFile && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedFile(null)}>
                    <Card className="w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="truncate pr-4">{selectedFile.name}</CardTitle>
                            <button onClick={() => setSelectedFile(null)}>
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Preview */}
                                {isImage(selectedFile) ? (
                                    <img
                                        src={selectedFile.url}
                                        alt={selectedFile.name}
                                        className="w-full max-h-80 object-contain rounded-lg bg-muted"
                                    />
                                ) : (
                                    <div className="h-40 flex items-center justify-center bg-muted rounded-lg">
                                        {getFileIcon(selectedFile)}
                                    </div>
                                )}

                                {/* Info */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Ukuran</p>
                                        <p className="font-medium">{formatFileSize(selectedFile.metadata?.size)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Dibuat</p>
                                        <p className="font-medium">
                                            {selectedFile.created_at
                                                ? new Date(selectedFile.created_at).toLocaleDateString('id-ID')
                                                : '-'
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* URL */}
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Public URL</p>
                                    <div className="flex gap-2">
                                        <input
                                            readOnly
                                            value={selectedFile.url}
                                            className="flex-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm"
                                        />
                                        <Button variant="outline" onClick={() => handleCopyUrl(selectedFile.url)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" onClick={() => window.open(selectedFile.url, '_blank')} className="flex-1">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Buka
                                    </Button>
                                    <Button variant="outline" onClick={() => handleDelete(selectedFile)} className="text-red-600 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Hapus
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Cari file..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted border border-border text-sm"
                    />
                </div>
                <div className="flex border rounded-lg">
                    <button
                        onClick={() => setView("grid")}
                        className={`p-2 ${view === "grid" ? "bg-muted" : ""}`}
                    >
                        <Grid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setView("list")}
                        className={`p-2 ${view === "list" ? "bg-muted" : ""}`}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Files */}
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>{search ? "File tidak ditemukan" : "Belum ada file"}</p>
                            <Button onClick={() => setShowUpload(true)} className="mt-4">
                                Upload File
                            </Button>
                        </div>
                    ) : view === "grid" ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    onClick={() => setSelectedFile(file)}
                                    className="group cursor-pointer border rounded-lg overflow-hidden hover:border-primary transition-colors"
                                >
                                    {isImage(file) ? (
                                        <img
                                            src={file.url}
                                            alt={file.name}
                                            className="w-full h-28 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-28 flex items-center justify-center bg-muted">
                                            {getFileIcon(file)}
                                        </div>
                                    )}
                                    <div className="p-2">
                                        <p className="text-xs truncate">{file.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    onClick={() => setSelectedFile(file)}
                                    className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted cursor-pointer"
                                >
                                    {isImage(file) ? (
                                        <img
                                            src={file.url}
                                            alt={file.name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 flex items-center justify-center bg-muted rounded">
                                            {getFileIcon(file)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(file.metadata?.size)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCopyUrl(file.url); }}
                                        className="p-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
