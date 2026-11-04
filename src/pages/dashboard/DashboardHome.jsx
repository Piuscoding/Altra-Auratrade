import { Link } from "react-router-dom"
import {
  BrainCircuit,
  LineChart,
  Terminal,
  Wallet,
  BarChart3,
  FlaskConical,
  Newspaper,
  Shield,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { useAuthStore } from "@/store/authStore"

const quickLinks = [
  { label: "Strategies", href: "/dashboard/strategies", icon: BrainCircuit, color: "text-brand-cyan" },
  { label: "Terminal", href: "/dashboard/terminal", icon: Terminal, color: "text-brand-gold" },
  { label: "Charts", href: "/dashboard/charts", icon: LineChart, color: "text-emerald-400" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, color: "text-sky-400" },
  { label: "Backtesting", href: "/dashboard/backtest", icon: FlaskConical, color: "text-amber-400" },
  { label: "Brokers", href: "/dashboard/brokers", icon: Wallet, color: "text-violet-400" },
  { label: "News Filters", href: "/dashboard/news", icon: Newspaper, color: "text-rose-400" },
  { label: "Prop Challenges", href: "/dashboard/prop", icon: Shield, color: "text-teal-400" },
  { label: "Sessions", href: "/dashboard/sessions", icon: Shield, color: "text-teal-400" },
]

export default function DashboardHome() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome back, {user?.firstName || "Trader"}
          </h1>
          <p className="mt-1 text-slate-400">Overview of strategies, trades, and market status</p>
        </div>
        <MarketStatusBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((item) => (
          <Link key={item.href} to={item.href}>
            <Card className="h-full transition-all hover:border-brand-cyan/40 hover:bg-brand-navy-light/80 cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className={`rounded-lg bg-brand-slate/50 p-2 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Open {item.label.toLowerCase()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
