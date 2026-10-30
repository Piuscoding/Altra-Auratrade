import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { authApi } from "@/api/auth"
import LandingPage from "@/pages/LandingPage"
import LoginPage from "@/pages/auth/LoginPage"
import RegisterPage from "@/pages/auth/RegisterPage"
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import DashboardHome from "@/pages/dashboard/DashboardHome"
import StrategiesPage from "@/pages/dashboard/StrategiesPage"
import StrategyBuilderPage from "@/pages/dashboard/StrategyBuilderPage"
import StrategyReviewPage from "@/pages/dashboard/StrategyReviewPage"
import TerminalPage from "@/pages/dashboard/TerminalPage"
import SessionsPage from "@/pages/dashboard/SessionsPage"
import NewsFiltersPage from "@/pages/dashboard/NewsFiltersPage"
import BrokersPage from "@/pages/dashboard/BrokersPage"
import ChartsPage from "@/pages/dashboard/ChartsPage"
import SettingsPage from "@/pages/dashboard/SettingsPage"
import NotificationsPage from "@/pages/dashboard/NotificationsPage"
import AdminModelsPage from "@/pages/admin/AdminModelsPage"
import AdminHome from "@/pages/admin/AdminHome"
import AdminFeatureTogglesPage from "@/pages/admin/AdminFeatureTogglesPage"
import AdminUsersPage from "@/pages/admin/AdminUsersPage"
import AdminStrategiesPage from "@/pages/admin/AdminStrategiesPage"
import AdminBestStrategiesPage from "@/pages/admin/AdminBestStrategiesPage"

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-navy">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-cyan border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function PublicOnly({ children }) {
  const { isAuthenticated, user, isLoading } = useAuthStore()
  if (isLoading) return null
  if (isAuthenticated) {
    return (
      <Navigate
        to={user?.role === "admin" || user?.role === "owner" ? "/admin" : "/dashboard"}
        replace
      />
    )
  }
  return children
}

export default function App() {
  const { token, setAuth, setLoading, logout } = useAuthStore()

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const user = await authApi.me()
        setAuth(user, token)
      } catch {
        logout()
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <RegisterPage />
          </PublicOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnly>
            <ForgotPasswordPage />
          </PublicOnly>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicOnly>
            <ResetPasswordPage />
          </PublicOnly>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout variant="user" />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="strategies" element={<StrategiesPage />} />
        <Route path="strategies/:id" element={<StrategyBuilderPage />} />
        <Route path="strategies/:id/review" element={<StrategyReviewPage />} />
        <Route path="terminal" element={<TerminalPage />} />
        <Route path="charts" element={<ChartsPage />} />
        <Route path="analytics" element={<DashboardHome />} />
        <Route path="brokers" element={<BrokersPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="news" element={<NewsFiltersPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin", "owner"]}>
            <DashboardLayout variant="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="strategies" element={<AdminStrategiesPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="models" element={<AdminModelsPage />} />
        <Route path="analytics" element={<AdminBestStrategiesPage />} />
        <Route path="settings" element={<AdminFeatureTogglesPage />} />
        <Route path="block" element={<AdminUsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
