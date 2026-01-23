import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/Toast"
import { Upload, X, Image, FileText, Film, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function MediaUpload({ onUpload, accept = "image/*", maxSize = 5, bucket = "media" }) {
    const toast = useToast()
    const fileInputRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState(null)
    const [progress, setProgress] = useState(0)

    const maxSizeBytes = maxSize * 1024 * 1024

    function handleDragOver(e) {
        e.preventDefault()
        setIsDragging(true)
    }

    function handleDragLeave(e) {
        e.preventDefault()
        setIsDragging(false)
    }

    function handleDrop(e) {
        e.preventDefault()
        setIsDragging(false)
        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleFile(files[0])
        }
    }

    function handleFileSelect(e) {
        const files = e.target.files
        if (files.length > 0) {
            handleFile(files[0])
        }
    }

    function handleFile(file) {
        // Validate file size
        if (file.size > maxSizeBytes) {
            toast.error(`File terlalu besar. Maksimal ${maxSize}MB`)
            return
        }

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (e) => setPreview({ url: e.target.result, file, type: 'image' })
            reader.readAsDataURL(file)
        } else if (file.type.startsWith('video/')) {
            setPreview({ file, type: 'video', name: file.name })
        } else {
            setPreview({ file, type: 'file', name: file.name })
        }
    }

    async function handleUpload() {
        if (!preview?.file) return

        setUploading(true)
        setProgress(0)

        try {
            const file = preview.file
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `uploads/${fileName}`

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) throw error

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath)

            setProgress(100)
            toast.success("File berhasil diupload!")

            // Callback with file info
            if (onUpload) {
                onUpload({
                    path: filePath,
                    url: publicUrl,
                    name: file.name,
                    type: file.type,
                    size: file.size
                })
            }

            // Reset
            setPreview(null)
            setProgress(0)
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Gagal upload: " + error.message)
        } finally {
            setUploading(false)
        }
    }

    function clearPreview() {
        setPreview(null)
        setProgress(0)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    function getFileIcon() {
        if (preview?.type === 'image') return <Image className="h-8 w-8 text-blue-500" />
        if (preview?.type === 'video') return <Film className="h-8 w-8 text-purple-500" />
        return <FileText className="h-8 w-8 text-gray-500" />
    }

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            {!preview ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={accept}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">Drag & drop file atau klik untuk pilih</p>
                    <p className="text-xs text-muted-foreground mt-1">Maksimal {maxSize}MB</p>
                </div>
            ) : (
                /* Preview */
                <div className="border rounded-xl p-4 bg-muted/30">
                    <div className="flex items-start gap-4">
                        {/* Preview Image/Icon */}
                        <div className="shrink-0">
                            {preview.type === 'image' && preview.url ? (
                                <img
                                    src={preview.url}
                                    alt="Preview"
                                    className="w-20 h-20 object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-20 h-20 flex items-center justify-center bg-muted rounded-lg">
                                    {getFileIcon()}
                                </div>
                            )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{preview.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(preview.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>

                            {/* Progress Bar */}
                            {uploading && (
                                <div className="mt-2">
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <button onClick={clearPreview} className="text-muted-foreground hover:text-foreground">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Upload Button */}
                    <div className="mt-4 flex gap-2">
                        <Button onClick={handleUpload} disabled={uploading} className="flex-1">
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Upload
                                </>
                            )}
                        </Button>
                        <Button variant="outline" onClick={clearPreview} disabled={uploading}>
                            Batal
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
