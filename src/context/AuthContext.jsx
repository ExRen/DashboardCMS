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

    // Role Constants - Simplified Per User Request
    const ROLE = {
        SUPER_ADMIN: 'super_admin',
        ADMIN_CABANG: 'admin_cabang',
        // Legacy mappings kept for backward compatibility
        LEGACY_PUSAT: ['admin', 'super_admin_pusat', 'editor_pusat', 'viewer_pusat'],
        LEGACY_CABANG: ['editor_cabang', 'viewer_cabang']
    }

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
                .select('*, offices(id, name, type)')
                .eq('email', email)
                .single()

            if (error || !profileData) {
                console.warn('User profile not found or create error, creating default viewer...')
                // Create profile if not exists (Default to viewer_pusat if undetermined, or handle error)
                // Note: In strict production, we might want to DISALLOW auto-creation/login without pre-assigned role
                const { data: newProfile } = await supabase
                    .from('user_profiles')
                    .insert([{
                        email: email,
                        full_name: email.split('@')[0],
                        role: ROLE.PUSAT_VIEWER // Default safe role
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
                    role: profileData.role,
                    avatar_url: profileData.avatar_url,
                    office_id: profileData.office_id,
                    office: profileData.offices,
                    status: profileData.status
                }

                // Block inactive users
                if (userProfile.status === 'inactive') {
                    throw new Error("Akun Anda telah dinonaktifkan.")
                }

                setUser(userProfile)
                setProfile(userProfile)
                localStorage.setItem('cms_user', JSON.stringify(userProfile))
            }
        } catch (error) {
            console.error("Profile fetch error:", error)
            throw error
        }
    }

    async function login(email, password) {
        console.log('[AUTH] Login attempt with:', email)
        try {
            // Clear any existing session
            localStorage.removeItem('cms_user')
            await supabase.auth.signOut()
            setUser(null)
            setProfile(null)

            // Try Supabase Auth first
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (data?.user) {
                await fetchProfile(data.user.email)
                return { success: true }
            }

            throw new Error(error?.message || "Login gagal")
        } catch (error) {
            console.error("[AUTH] Login error:", error)
            return { success: false, error: error.message }
        }
    }

    async function register(email, password, fullName) {
        // Registration is strictly controlled by Pusat in Master Execution Plan
        // But keeping this for Dev/Testing if needed, default to safe role
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
                    role: ROLE.PUSAT_VIEWER // Default safe role
                }], { onConflict: 'email' })
            }

            return {
                success: true,
                message: "Registrasi berhasil! Silakan hubungi Administrator Pusat untuk aktivasi."
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

    // --- Helper Flags & Functions ---

    // Normalize legacy roles to new roles for code logic
    const currentRole = (profile?.role || '').toLowerCase()

    // Pusat Check (includes new role + all legacy Pusat roles)
    const isPusat = currentRole === ROLE.SUPER_ADMIN || ROLE.LEGACY_PUSAT.includes(currentRole)
    const isSuperAdminPusat = isPusat // In simplified model, all Pusat are Super Admin

    // Cabang Check (includes new role + all legacy Cabang roles)
    const isCabang = currentRole === ROLE.ADMIN_CABANG || ROLE.LEGACY_CABANG.includes(currentRole)
    const isCabangAdmin = isCabang // In simplified model, all Cabang are Admin

    // Permission Helpers
    const canManageUsers = isSuperAdminPusat || isCabangAdmin
    const canEditContent = isPusat || isCabang // Both can edit
    const canDeleteContent = isSuperAdminPusat || isCabangAdmin

    // Legacy compatibility export
    const isAdmin = isSuperAdminPusat
    const isEditor = canEditContent

    // Current Office Context
    const userOfficeId = profile?.office_id

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            login,
            register,
            logout,
            // Roles & Permissions
            ROLE,
            isPusat,
            isCabang,
            isSuperAdminPusat,
            isCabangAdmin,
            canManageUsers,
            canEditContent,
            canDeleteContent,
            userOfficeId,
            // Legacy compatibility
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
