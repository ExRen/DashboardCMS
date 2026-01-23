import { useState } from "react"
import { FileText, ChevronDown, Check, Sparkles } from "lucide-react"

/**
 * Predefined Press Release Templates
 */
const TEMPLATES = [
    {
        id: 'corporate',
        name: 'Berita Korporat',
        icon: '🏢',
        description: 'Template untuk berita perusahaan umum',
        data: {
            "KETEGORI": "Corporate Action",
            "JENIS RILIS": "Rilis Pusat",
            "JUDUL SIARAN PERS": "ASABRI [JUDUL BERITA]",
        }
    },
    {
        id: 'event',
        name: 'Liputan Kegiatan',
        icon: '📅',
        description: 'Template untuk liputan event atau kegiatan',
        data: {
            "KETEGORI": "Event Coverage",
            "JENIS RILIS": "Rilis Pusat",
            "JUDUL SIARAN PERS": "ASABRI Gelar [NAMA KEGIATAN]",
        }
    },
    {
        id: 'award',
        name: 'Penghargaan',
        icon: '🏆',
        description: 'Template untuk berita penghargaan',
        data: {
            "KETEGORI": "Achievement",
            "JENIS RILIS": "Rilis Pusat",
            "JUDUL SIARAN PERS": "ASABRI Raih [NAMA PENGHARGAAN]",
        }
    },
    {
        id: 'csr',
        name: 'CSR/TJSL',
        icon: '💚',
        description: 'Template untuk kegiatan tanggung jawab sosial',
        data: {
            "KETEGORI": "CSR",
            "JENIS RILIS": "Rilis Pusat",
            "JUDUL SIARAN PERS": "ASABRI Salurkan Bantuan [JENIS BANTUAN] untuk [PENERIMA]",
        }
    },
    {
        id: 'partnership',
        name: 'Kerjasama',
        icon: '🤝',
        description: 'Template untuk pengumuman kerjasama',
        data: {
            "KETEGORI": "Partnership",
            "JENIS RILIS": "Rilis Pusat",
            "JUDUL SIARAN PERS": "ASABRI Jalin Kerjasama dengan [MITRA]",
        }
    },
    {
        id: 'product',
        name: 'Layanan Baru',
        icon: '🚀',
        description: 'Template untuk peluncuran layanan/produk baru',
        data: {
            "KETEGORI": "Product Launch",
            "JENIS RILIS": "Rilis Pusat",
            "JUDUL SIARAN PERS": "ASABRI Luncurkan [NAMA LAYANAN]",
        }
    },
]

/**
 * ContentTemplates - Template selector untuk Press Releases
 */
export function ContentTemplates({ onApply }) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState(null)

    function handleSelect(template) {
        setSelectedTemplate(template)
    }

    function handleApply() {
        if (selectedTemplate && onApply) {
            onApply(selectedTemplate.data)
            setIsOpen(false)
            setSelectedTemplate(null)
        }
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 border border-primary/20 rounded-lg text-primary text-sm font-medium transition-all"
            >
                <Sparkles className="h-4 w-4" />
                Gunakan Template
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-50 left-0 mt-2 w-[400px] bg-card border border-border rounded-xl shadow-xl">
                        <div className="p-3 border-b border-border">
                            <h3 className="font-semibold">Pilih Template</h3>
                            <p className="text-xs text-muted-foreground">Template siaran pers yang dapat disesuaikan</p>
                        </div>

                        <div className="p-2 max-h-[350px] overflow-auto">
                            {TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => handleSelect(template)}
                                    className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors ${selectedTemplate?.id === template.id
                                        ? 'bg-primary/10 border border-primary/30'
                                        : 'hover:bg-muted'
                                        }`}
                                >
                                    <span className="text-2xl">{template.icon}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{template.name}</span>
                                            {selectedTemplate?.id === template.id && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {selectedTemplate && (
                            <div className="p-3 border-t border-border bg-muted/30">
                                <div className="text-xs text-muted-foreground mb-2">Preview:</div>
                                <div className="bg-background p-2 rounded text-xs max-h-[100px] overflow-auto whitespace-pre-wrap font-mono">
                                    {selectedTemplate.data["JUDUL SIARAN PERS"]}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleApply}
                                    className="w-full mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                                >
                                    Terapkan Template
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default ContentTemplates
