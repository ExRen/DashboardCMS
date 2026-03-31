import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Save, Database, RefreshCw } from "lucide-react"
import { useState } from "react"

export function Settings() {
    const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || "")
    const [supabaseKey, setSupabaseKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || "")
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        // In a real app, you'd save these to a config file or state management
        console.log("Saving config:", { supabaseUrl, supabaseKey })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Konfigurasi Supabase
                    </CardTitle>
                    <CardDescription>
                        Masukkan kredensial Supabase untuk menghubungkan dashboard ke database
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-foreground">Supabase URL</label>
                        <input
                            type="text"
                            value={supabaseUrl}
                            onChange={(e) => setSupabaseUrl(e.target.value)}
                            placeholder="https://your-project.supabase.co"
                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground">Supabase Anon Key</label>
                        <input
                            type="password"
                            value={supabaseKey}
                            onChange={(e) => setSupabaseKey(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            className="w-full mt-1 h-10 px-3 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <Button onClick={handleSave} className="w-full">
                        <Save className="h-4 w-4" />
                        {saved ? "Tersimpan!" : "Simpan Konfigurasi"}
                    </Button>
                </CardContent>
            </Card> */}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        Panduan Setup
                    </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm text-muted-foreground">
                    <ol className="list-decimal list-inside space-y-2">
                        <li>Buat project baru di <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com</a></li>
                        <li>Buka SQL Editor di dashboard Supabase</li>
                        <li>Jalankan file <code className="bg-muted px-1 rounded">supabase/001_schema.sql</code></li>
                        <li>Jalankan file <code className="bg-muted px-1 rounded">supabase/002_seed_data.sql</code></li>
                        <li>Salin Project URL dan anon key dari Settings {">"} API</li>
                        <li>Buat file <code className="bg-muted px-1 rounded">.env</code> dan masukkan kredensial</li>
                    </ol>

                    <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="font-medium text-foreground mb-2">Contoh .env file:</p>
                        <pre className="text-xs overflow-x-auto">
                            {`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJ...`}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
