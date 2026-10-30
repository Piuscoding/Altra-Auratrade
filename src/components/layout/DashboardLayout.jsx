import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"

export function DashboardLayout({ variant = "user" }) {
  return (
    <div className="flex min-h-screen bg-brand-navy">
      <Sidebar variant={variant} />
      <main className="flex-1 overflow-x-hidden">
        <div className="min-h-screen p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
