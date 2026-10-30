import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { useAuthStore } from "@/store/authStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BrainCircuit, Terminal, LineChart, Wallet, BarChart3, Shield } from "lucide-react"
import { Link } from "react-router-dom"

const quickLinks = [
  { label: "Create Strategy", href: "/dashboard/strategies", icon: BrainCircuit, color: "text-brand-cyan" },
  { label: "Live Terminal", href: "/dashboard/terminal", icon: Terminal, color: "text-brand-gold" },
  { label: "Chart Workspace", href: "/dashboard/charts", icon: LineChart, color: "text-emerald-400" },
  { label: "Broker Accounts", href: "/dashboard/brokers", icon: Wallet, color: "text-violet-400" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, color: "text-sky-400" },
  { label: "Sessions & Risk", href: "/dashboard/sessions", icon: Shield, color: "text-amber-400" },
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
          <p className="mt-1 text-slate-400">Your AI-assisted trading command center</p>
        </div>
        <MarketStatusBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <Card>
        <CardHeader>
          <CardTitle>Platform Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-400">
          <p>• Vision Pipeline: OpenRouter (free models default — Qwen3-VL, Gemma 4, Nemotron)</p>
          <p>• Smart adjustments: OFF by default (enable per strategy when ready)</p>
          <p>• One active strategy per broker account enforced</p>
          <p>• Strategies can be disabled by you; only Admin can permanently delete</p>
          <p>• All critical actions require human review where specified</p>
        </CardContent>
      </Card>
    </div>
  )
}
