import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  BrainCircuit,
  Terminal,
  LineChart,
  BarChart3,
  Wallet,
  Clock,
  Newspaper,
  Settings,
  Bell,
  Users,
  Bot,
  ShieldBan,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import { MarketStatusBadge } from "./MarketStatusBadge"
import logoSymbol from "@/assets/logo-symbol.png"

const userNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Strategy Creation", href: "/dashboard/strategies", icon: BrainCircuit },
  { label: "Live Terminal", href: "/dashboard/terminal", icon: Terminal },
  { label: "Chart Workspace", href: "/dashboard/charts", icon: LineChart },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Broker Accounts", href: "/dashboard/brokers", icon: Wallet },
  { label: "Sessions & Constraints", href: "/dashboard/sessions", icon: Clock },
  { label: "News Filters", href: "/dashboard/news", icon: Newspaper },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Strategies", href: "/admin/strategies", icon: BrainCircuit },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "AI Models", href: "/admin/models", icon: Bot },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Block Users", href: "/admin/block", icon: ShieldBan },
]

export function Sidebar({ variant = "user" }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const navItems = variant === "admin" ? adminNav : userNav

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const SidebarContent = (
    <div
      className={cn(
        "flex h-full flex-col bg-brand-navy-light/95 border-r border-brand-slate/50 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-brand-slate/50 px-4">
        <img
          src={logoSymbol}
          alt="Altra-AuraTrade"
          className="h-9 w-9 rounded-lg object-contain shrink-0"
        />
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">Altra-AuraTrade</p>
            <p className="text-[10px] text-brand-cyan uppercase tracking-wider">
              Trade with Intelligence
            </p>
          </div>
        )}
      </div>

      <div className={cn("px-3 py-3", collapsed && "px-2")}>
        {collapsed ? (
          <div className="mx-auto h-3 w-3 rounded-full bg-emerald-400" title="Market Status" />
        ) : (
          <MarketStatusBadge className="w-full justify-center" />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/admin" &&
              location.pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30"
                  : "text-slate-400 hover:bg-brand-slate/40 hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-brand-slate/50 p-3 space-y-2">
        {!collapsed && user && (
          <div className="px-2 py-1">
            <p className="text-sm font-medium text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex w-full items-center justify-center rounded-lg py-2 text-slate-500 hover:text-white hover:bg-brand-slate/40 transition-all"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-navy-light border border-brand-slate md:hidden"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      <aside className="hidden md:flex h-screen sticky top-0">{SidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">{SidebarContent}</div>
        </div>
      )}
    </>
  )
}
