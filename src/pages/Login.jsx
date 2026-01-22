import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Lock, Mail, Eye, EyeOff, AlertCircle, User, CheckCircle } from "lucide-react"

export function Login() {
    const { login, register } = useAuth()
    const [isRegister, setIsRegister] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [fullName, setFullName] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError("")
        setSuccess("")
        setLoading(true)

        if (isRegister) {
            // Register
            if (password.length < 6) {
                setError("Password minimal 6 karakter")
                setLoading(false)
                return
            }
            const result = await register(email, password, fullName)
            if (result.success) {
                setSuccess(result.message)
                setIsRegister(false)
                setPassword("")
            } else {
                setError(result.error || "Registrasi gagal")
            }
        } else {
            // Login
            const result = await login(email, password)
            if (!result.success) {
                setError(result.error || "Login gagal")
            }
        }

        setLoading(false)
    }

    function toggleMode() {
        setIsRegister(!isRegister)
        setError("")
        setSuccess("")
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                        <span className="text-2xl font-bold text-primary">A</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">ASABRI CMS</h1>
                    <p className="text-muted-foreground mt-2">
                        {isRegister ? "Daftar akun baru" : "Masuk ke dashboard"}
                    </p>
                </div>

                {/* Login/Register Card */}
                <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                    {/* Tab Switcher */}
                    <div className="flex mb-6 bg-muted rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => { setIsRegister(false); setError(""); setSuccess(""); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isRegister
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Masuk
                        </button>
                        <button
                            type="button"
                            onClick={() => { setIsRegister(true); setError(""); setSuccess(""); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isRegister
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Daftar
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Success Message */}
                        {success && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Full Name Field (Register only) */}
                        {isRegister && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Nama Lengkap
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Nama lengkap Anda"
                                        className="w-full h-12 pl-10 pr-4 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@asabri.co.id"
                                    className="w-full h-12 pl-10 pr-4 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={isRegister ? "Minimal 6 karakter" : "••••••••"}
                                    className="w-full h-12 pl-10 pr-12 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    Memproses...
                                </span>
                            ) : (
                                isRegister ? "Daftar" : "Masuk"
                            )}
                        </button>
                    </form>

                    {/* Legacy Login Info */}
                    {!isRegister && (
                        <div className="mt-4 p-3 rounded-lg bg-muted text-xs text-muted-foreground">
                            <p className="font-medium mb-1">Akun Demo:</p>
                            <p>Email: admin@asabri.co.id</p>
                            <p>Password: admin123</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                    © 2025 PT ASABRI (Persero). All rights reserved.
                </p>
            </div>
        </div>
    )
}
