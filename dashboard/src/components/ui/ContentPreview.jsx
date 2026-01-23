import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Instagram, Twitter, Facebook, Smartphone, Monitor, Eye } from "lucide-react"

const PLATFORMS = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'bg-black' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' }
]

export function ContentPreview({ title, content, image, date, author }) {
    const [platform, setPlatform] = useState('instagram')
    const [device, setDevice] = useState('mobile')

    const truncate = (text, length) => {
        if (!text) return ''
        return text.length > length ? text.substring(0, length) + '...' : text
    }

    const renderInstagram = () => (
        <div className="bg-white text-black rounded-lg overflow-hidden max-w-sm mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 p-3 border-b">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    A
                </div>
                <div>
                    <p className="text-sm font-semibold">asabri_official</p>
                    <p className="text-xs text-gray-500">Sponsored</p>
                </div>
            </div>

            {/* Image */}
            {image ? (
                <img src={image} alt="Preview" className="w-full aspect-square object-cover" />
            ) : (
                <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
                    <Instagram className="h-12 w-12 text-gray-400" />
                </div>
            )}

            {/* Actions */}
            <div className="p-3">
                <div className="flex items-center gap-4 mb-2">
                    <span className="text-2xl">❤️</span>
                    <span className="text-2xl">💬</span>
                    <span className="text-2xl">📤</span>
                </div>
                <p className="text-sm">
                    <span className="font-semibold">asabri_official</span>{' '}
                    {truncate(content || title, 150)}
                </p>
            </div>
        </div>
    )

    const renderTwitter = () => (
        <div className="bg-white text-black rounded-xl overflow-hidden max-w-md mx-auto border">
            <div className="p-4">
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                        A
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold">ASABRI</span>
                            <span className="text-gray-500">@asabri_official</span>
                            <span className="text-gray-500">· {date || 'Baru saja'}</span>
                        </div>
                        <p className="mt-2 text-[15px] leading-relaxed">
                            {truncate(title, 280)}
                        </p>
                        {content && (
                            <p className="mt-1 text-sm text-gray-700">
                                {truncate(content, 200)}
                            </p>
                        )}
                        {image && (
                            <img src={image} alt="Preview" className="mt-3 rounded-xl w-full" />
                        )}
                        <div className="flex items-center justify-between mt-4 text-gray-500">
                            <span>💬 0</span>
                            <span>🔄 0</span>
                            <span>❤️ 0</span>
                            <span>📊 0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderFacebook = () => (
        <div className="bg-white text-black rounded-lg overflow-hidden max-w-md mx-auto border">
            {/* Header */}
            <div className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    A
                </div>
                <div>
                    <p className="font-semibold">PT ASABRI (Persero)</p>
                    <p className="text-xs text-gray-500">{date || 'Baru saja'} · 🌐</p>
                </div>
            </div>

            {/* Content */}
            <div className="px-3 pb-2">
                <p className="text-sm">{truncate(title, 200)}</p>
                {content && (
                    <p className="text-sm text-gray-600 mt-1">{truncate(content, 300)}</p>
                )}
            </div>

            {/* Image */}
            {image && (
                <img src={image} alt="Preview" className="w-full" />
            )}

            {/* Actions */}
            <div className="flex items-center justify-around p-3 border-t text-gray-600 text-sm">
                <span>👍 Suka</span>
                <span>💬 Komentar</span>
                <span>↗️ Bagikan</span>
            </div>
        </div>
    )

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Preview Konten
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Platform Selector */}
                <div className="flex gap-2">
                    {PLATFORMS.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setPlatform(p.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${platform === p.id
                                    ? `${p.color} text-white`
                                    : 'bg-muted text-foreground hover:bg-accent'
                                }`}
                        >
                            <p.icon className="h-4 w-4" />
                            {p.name}
                        </button>
                    ))}
                </div>

                {/* Device Toggle */}
                <div className="flex items-center gap-2 border rounded-lg p-1 w-fit">
                    <button
                        onClick={() => setDevice('mobile')}
                        className={`p-2 rounded ${device === 'mobile' ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                        <Smartphone className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setDevice('desktop')}
                        className={`p-2 rounded ${device === 'desktop' ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                        <Monitor className="h-4 w-4" />
                    </button>
                </div>

                {/* Preview */}
                <div className={`bg-gray-100 dark:bg-gray-900 rounded-xl p-6 ${device === 'mobile' ? 'max-w-sm mx-auto' : ''
                    }`}>
                    {platform === 'instagram' && renderInstagram()}
                    {platform === 'twitter' && renderTwitter()}
                    {platform === 'facebook' && renderFacebook()}
                </div>
            </CardContent>
        </Card>
    )
}
