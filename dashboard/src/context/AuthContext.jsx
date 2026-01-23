import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

const AuthContext = createContext({
    user: null,
    profile: null,
    loading: true,
    login: async () => { },
    register: async () => { },
    logout: async () => { },
    isAdmin: false,
    isEditor: false
})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkSession()
    }, [])

    async function checkSession() {
        try {
            // Check localStorage first for legacy/current users
            const savedUser = localStorage.getItem('cms_user')
            if (savedUser) {
                const parsed = JSON.parse(savedUser)
                setUser(parsed)
                setProfile(parsed)
                setLoading(false)
                return
            }

            // No localStorage user - sign out from Supabase Auth to ensure clean state
            // This prevents old Supabase Auth sessions from persisting
            await supabase.auth.signOut()

            // Check if there's still a Supabase Auth session (newly created)
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                await fetchProfile(session.user.email)
            }
        } catch (error) {
            console.error("Session check error:", error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchProfile(email) {
        try {
            let { data: profileData, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', email)
                .single()

            if (error || !profileData) {
                // Create profile if not exists
                const { data: newProfile } = await supabase
                    .from('user_profiles')
                    .insert([{
                        email: email,
                        full_name: email.split('@')[0],
                        role: 'viewer'
                    }])
                    .select()
                    .single()

                profileData = newProfile
            }

            if (profileData) {
                const userProfile = {
                    id: profileData.id,
                    email: profileData.email,
                    full_name: profileData.full_name,
                    role: profileData.role || 'viewer',
                    avatar_url: profileData.avatar_url
                }
                setUser(userProfile)
                setProfile(userProfile)
                localStorage.setItem('cms_user', JSON.stringify(userProfile))
            }
        } catch (error) {
            console.error("Profile fetch error:", error)
        }
    }

    async function login(email, password) {
        console.log('[AUTH] Login attempt with:', email)
        try {
            // Clear any existing session first
            localStorage.removeItem('cms_user')
            await supabase.auth.signOut()
            setUser(null)
            setProfile(null)
            console.log('[AUTH] Cleared existing sessions')

            // Try Supabase Auth first
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })
            console.log('[AUTH] Supabase Auth result:', { data: data?.user?.email, error: error?.message })

            if (!error && data?.user) {
                // Supabase Auth login successful
                console.log('[AUTH] Supabase Auth success, fetching profile for:', data.user.email)
                await fetchProfile(data.user.email)
                return { success: true }
            }

            // Fallback to legacy login
            console.log('[AUTH] Fallback to legacy login for:', email)
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', email)
                .single()

            console.log('[AUTH] Profile query result:', { profileData, profileError })

            if (profileError || !profileData) {
                throw new Error("Email tidak ditemukan")
            }

            // Legacy password check
            if (password !== 'admin123' && password !== 'password') {
                throw new Error("Password salah")
            }

            // Set legacy user profile
            const userProfile = {
                id: profileData.id,
                email: profileData.email,
                full_name: profileData.full_name,
                role: profileData.role || 'viewer',
                avatar_url: profileData.avatar_url
            }

            console.log('[AUTH] Setting user profile:', userProfile)
            setUser(userProfile)
            setProfile(userProfile)
            localStorage.setItem('cms_user', JSON.stringify(userProfile))
            console.log('[AUTH] Saved to localStorage')

            return { success: true, isLegacy: true }
        } catch (error) {
            console.error("[AUTH] Login error:", error)
            return { success: false, error: error.message }
        }
    }

    async function register(email, password, fullName) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName } }
            })

            if (error) throw error

            if (data.user) {
                await supabase.from('user_profiles').upsert([{
                    email: email,
                    full_name: fullName,
                    role: 'viewer'
                }], { onConflict: 'email' })
            }

            return {
                success: true,
                message: "Registrasi berhasil! Silakan cek email untuk verifikasi."
            }
        } catch (error) {
            console.error("Register error:", error)
            return { success: false, error: error.message }
        }
    }

    async function logout() {
        try {
            await supabase.auth.signOut()
        } catch (error) {
            console.error("Logout error:", error)
        }
        localStorage.removeItem('cms_user')
        setUser(null)
        setProfile(null)
    }

    const isAdmin = profile?.role === 'admin'
    const isEditor = profile?.role === 'editor' || profile?.role === 'admin'

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            login,
            register,
            logout,
            isAdmin,
            isEditor
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
