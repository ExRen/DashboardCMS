import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

const AuthContext = createContext({
    user: null,
    profile: null,
    loading: true,
    login: async () => { },
    logout: async () => { },
    isAdmin: false,
    isEditor: false
})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkUser()
    }, [])

    async function checkUser() {
        try {
            // Check localStorage for saved user
            const savedUser = localStorage.getItem('cms_user')
            if (savedUser) {
                const parsed = JSON.parse(savedUser)
                setUser(parsed)
                setProfile(parsed)
            }
        } catch (error) {
            console.error("Auth check error:", error)
        } finally {
            setLoading(false)
        }
    }

    async function login(email, password) {
        try {
            // Simple login - check against user_profiles table
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', email)
                .single()

            if (error || !data) {
                throw new Error("Email tidak ditemukan")
            }

            // For demo purposes, accept any password for existing users
            // In production, use Supabase Auth or proper password hashing
            if (password !== 'admin123' && password !== 'password') {
                throw new Error("Password salah")
            }

            const userProfile = {
                id: data.id,
                email: data.email,
                full_name: data.full_name,
                role: data.role,
                avatar_url: data.avatar_url
            }

            setUser(userProfile)
            setProfile(userProfile)
            localStorage.setItem('cms_user', JSON.stringify(userProfile))

            return { success: true }
        } catch (error) {
            console.error("Login error:", error)
            return { success: false, error: error.message }
        }
    }

    async function logout() {
        setUser(null)
        setProfile(null)
        localStorage.removeItem('cms_user')
    }

    const isAdmin = profile?.role === 'admin'
    const isEditor = profile?.role === 'editor' || profile?.role === 'admin'

    return (
        <AuthContext.Provider value={{ user, profile, loading, login, logout, isAdmin, isEditor }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
