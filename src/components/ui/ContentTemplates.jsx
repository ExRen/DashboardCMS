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
            "KATEGORI": "Corporate News",
            "JENIS": "Press Release",
            "HIGHLIGHT/CAPTIONS": "ASABRI [JUDUL BERITA]\n\n[LOKASI], [TANGGAL] - [Paragraf pembuka dengan informasi utama]\n\n[Paragraf detail]\n\n\"[Kutipan pejabat],\" ujar [Nama Pejabat], [Jabatan].\n\n[Paragraf penutup]\n\n---\nNarahubung:\n[Nama]\n[Jabatan]\n[Email/Telepon]",
        }
    },
    {
        id: 'event',
        name: 'Liputan Kegiatan',
        icon: '📅',
        description: 'Template untuk liputan event atau kegiatan',
        data: {
            "KATEGORI": "Event Coverage",
            "JENIS": "Press Release",
            "HIGHLIGHT/CAPTIONS": "ASABRI Gelar [NAMA KEGIATAN]\n\n[LOKASI], [TANGGAL] - PT ASABRI (Persero) menyelenggarakan [nama kegiatan] yang berlangsung di [lokasi] pada [tanggal].\n\nKegiatan ini dihadiri oleh [daftar hadir penting].\n\n[Detail kegiatan]\n\n\"[Kutipan],\" kata [Nama], [Jabatan].\n\n[Penutup]",
        }
    },
    {
        id: 'award',
        name: 'Penghargaan',
        icon: '🏆',
        description: 'Template untuk berita penghargaan',
        data: {
            "KATEGORI": "Achievement",
            "JENIS": "Press Release",
            "HIGHLIGHT/CAPTIONS": "ASABRI Raih [NAMA PENGHARGAAN]\n\n[LOKASI], [TANGGAL] - PT ASABRI (Persero) kembali menorehkan prestasi dengan meraih [nama penghargaan] dari [pemberi penghargaan].\n\nPenghargaan diserahkan oleh [nama penyerah], [jabatan] kepada [nama penerima], [jabatan] dalam acara [nama acara] di [lokasi].\n\n\"[Kutipan],\" ungkap [Nama], [Jabatan].\n\n[Paragraf tentang pencapaian/kontribusi]",
        }
    },
    {
        id: 'csr',
        name: 'CSR/TJSL',
        icon: '💚',
        description: 'Template untuk kegiatan tanggung jawab sosial',
        data: {
            "KATEGORI": "CSR",
            "JENIS": "Press Release",
            "HIGHLIGHT/CAPTIONS": "ASABRI Salurkan Bantuan [JENIS BANTUAN] untuk [PENERIMA]\n\n[LOKASI], [TANGGAL] - Sebagai wujud kepedulian sosial, PT ASABRI (Persero) menyalurkan bantuan [jenis bantuan] kepada [penerima] di [lokasi].\n\n[Detail penyaluran]\n\n\"[Kutipan tentang komitmen CSR],\" kata [Nama], [Jabatan].\n\n[Paragraf penutup tentang program CSR ASABRI]",
        }
    },
    {
        id: 'partnership',
        name: 'Kerjasama',
        icon: '🤝',
        description: 'Template untuk pengumuman kerjasama',
        data: {
            "KATEGORI": "Partnership",
            "JENIS": "Press Release",
            "HIGHLIGHT/CAPTIONS": "ASABRI Jalin Kerjasama dengan [MITRA]\n\n[LOKASI], [TANGGAL] - PT ASABRI (Persero) menandatangani perjanjian kerjasama dengan [nama mitra] dalam bidang [bidang kerjasama].\n\nPenandatanganan dilakukan oleh [nama ASABRI], [jabatan] dan [nama mitra], [jabatan mitra] di [lokasi].\n\nKerjasama ini meliputi:\n• [Poin 1]\n• [Poin 2]\n• [Poin 3]\n\n\"[Kutipan],\" jelas [Nama], [Jabatan].",
        }
    },
    {
        id: 'product',
        name: 'Layanan Baru',
        icon: '🚀',
        description: 'Template untuk peluncuran layanan/produk baru',
        data: {
            "KATEGORI": "Product Launch",
            "JENIS": "Press Release",
            "HIGHLIGHT/CAPTIONS": "ASABRI Luncurkan [NAMA LAYANAN]\n\n[LOKASI], [TANGGAL] - PT ASABRI (Persero) resmi meluncurkan [nama layanan], sebuah [deskripsi singkat] untuk meningkatkan [manfaat].\n\nPeluncuran dilakukan oleh [nama], [jabatan] di [lokasi].\n\nFitur utama [nama layanan]:\n• [Fitur 1]\n• [Fitur 2]\n• [Fitur 3]\n\n\"[Kutipan tentang inovasi],\" ujar [Nama], [Jabatan].\n\n[Cara akses/informasi lebih lanjut]",
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
                                    {selectedTemplate.data["HIGHLIGHT/CAPTIONS"].slice(0, 200)}...
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
