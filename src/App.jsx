import { useState, useEffect, lazy, Suspense } from "react"
import { ThemeProvider } from "@/context/ThemeContext"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { DataProvider } from "@/context/DataContext"
import { ToastProvider } from "@/components/ui/Toast"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Login } from "@/pages/Login"
import "./index.css"

// Lazy load pages for code splitting (handling named exports)
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

const pageTitles = {
  "dashboard": "Dashboard Overview",
  "press-releases": "Siaran Pers",
  "commando": "COMMANDO - Social Media Content",
  "pipeline": "Content Pipeline",
  "calendar": "Kalender Publikasi",
  "media-plan": "Media Plan",
  "analytics": "Analytics & Reports",
  "media": "Media Library",
  "master-data": "Master Data",
  "users": "User Management",
  "settings": "Settings"
}

// Loading component for Suspense
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-sm text-muted-foreground">Memuat halaman...</span>
      </div>
    </div>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  // Use URL hash for navigation persistence
  const getPageFromHash = () => {
    const hash = window.location.hash.replace('#', '')
    return hash || 'dashboard'
  }

  const [currentPage, setCurrentPage] = useState(getPageFromHash)

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Update URL hash when page changes
  const handleNavigate = (page) => {
    window.location.hash = page
    setCurrentPage(page)
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login />
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />
      case "press-releases":
        return <PressReleases />
      case "commando":
        return <Commando />
      case "pipeline":
        return <Pipeline />
      case "calendar":
        return <CalendarPage />
      case "media-plan":
        return <MediaPlan />
      case "analytics":
        return <Analytics />
      case "media":
        return <MediaLibrary />
      case "master-data":
        return <MasterData />
      case "users":
        return <UserManagement />
      case "settings":
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={pageTitles[currentPage]} onNavigate={handleNavigate} />

        <main className="flex-1 overflow-auto p-6">
          <Suspense fallback={<PageLoader />}>
            {renderPage()}
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
            <AppContent />
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App


