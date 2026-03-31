import { useState, useEffect, lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeProvider } from "@/context/ThemeContext"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { DataProvider } from "@/context/DataContext"
import { ToastProvider } from "@/components/ui/Toast"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Login } from "@/pages/Login"
import "./index.css"

// Lazy load pages
const Dashboard = lazy(() => import("@/pages/Dashboard").then(m => ({ default: m.Dashboard })))
const PressReleases = lazy(() => import("@/pages/PressReleases").then(m => ({ default: m.PressReleases })))
const Commando = lazy(() => import("@/pages/Commando").then(m => ({ default: m.Commando })))
const Pipeline = lazy(() => import("@/pages/Pipeline").then(m => ({ default: m.Pipeline })))
const CalendarPage = lazy(() => import("@/pages/Calendar").then(m => ({ default: m.CalendarPage })))
const Analytics = lazy(() => import("@/pages/Analytics").then(m => ({ default: m.Analytics })))
const Settings = lazy(() => import("@/pages/Settings").then(m => ({ default: m.Settings })))
const MasterData = lazy(() => import("@/pages/MasterData").then(m => ({ default: m.MasterData })))
const UserManagement = lazy(() => import("@/pages/UserManagement").then(m => ({ default: m.UserManagement })))
const MediaLibrary = lazy(() => import("@/pages/MediaLibrary").then(m => ({ default: m.MediaLibrary })))
const MediaPlan = lazy(() => import("@/pages/MediaPlan").then(m => ({ default: m.MediaPlan })))
const ProfilKantor = lazy(() => import("@/pages/ProfilKantor").then(m => ({ default: m.ProfilKantor })))
const MonitoringCabang = lazy(() => import("@/pages/MonitoringCabang").then(m => ({ default: m.MonitoringCabang })))
const MediaSosial = lazy(() => import("@/pages/MediaSosial").then(m => ({ default: m.MediaSosial })))
const Pemberitaan = lazy(() => import("@/pages/Pemberitaan").then(m => ({ default: m.Pemberitaan })))
const AsetKomunikasi = lazy(() => import("@/pages/AsetKomunikasi").then(m => ({ default: m.AsetKomunikasi })))
const History = lazy(() => import("@/pages/History").then(m => ({ default: m.History })))

const pageTitles = {
  "/": "Dashboard Overview",
  "/dashboard": "Dashboard Overview",
  "/press-releases": "Siaran Pers",
  "/commando": "COMMANDO - Social Media Content",
  "/pipeline": "Content Pipeline",
  "/calendar": "Kalender Publikasi",
  "/media-plan": "Media Plan",
  "/analytics": "Analytics & Reports",
  "/media": "Media Library",
  "/master-data": "Master Data",
  "/users": "User Management",
  "/settings": "Settings",
  "/history": "Audit Log & Riwayat",
  "/monitoring-cabang": "Monitoring Kantor Cabang",
  "/profil-kantor": "Profil Kantor Cabang",
  "/media-sosial": "Monitoring Media Sosial",
  "/pemberitaan": "Monitoring Pemberitaan",
  "/aset-komunikasi": "Database Aset Komunikasi"
}

const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 }
}

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.3
}

function AnimatedRoutes() {
  const { user, loading, isCabang } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <PageLoader />
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={location.pathname} onNavigate={(path) => navigate(path)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={pageTitles[location.pathname] || "Dashboard"} onNavigate={(path) => navigate(path)} />

        <main className="flex-1 overflow-auto p-6">
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="h-full"
              >
                <Routes location={location}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* PUSAT ONLY / GUARDED */}
                  <Route path="/press-releases" element={isCabang ? <Navigate to="/" /> : <PressReleases />} />
                  <Route path="/commando" element={isCabang ? <Navigate to="/" /> : <Commando />} />
                  <Route path="/monitoring-cabang" element={isCabang ? <Navigate to="/" /> : <MonitoringCabang />} />
                  <Route path="/master-data" element={isCabang ? <Navigate to="/" /> : <MasterData />} />
                  <Route path="/users" element={isCabang ? <Navigate to="/" /> : <UserManagement />} />

                  {/* SHARED */}
                  <Route path="/pipeline" element={<Pipeline />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/media-plan" element={<MediaPlan />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/media" element={<MediaLibrary />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/history" element={<History />} />

                  {/* CABANG SPECIFIC */}
                  <Route path="/profil-kantor" element={<ProfilKantor />} />
                  <Route path="/media-sosial" element={<MediaSosial />} />
                  <Route path="/pemberitaan" element={<Pemberitaan />} />
                  <Route path="/aset-komunikasi" element={<AsetKomunikasi />} />

                  {/* FALLBACK */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App


