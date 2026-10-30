import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  BrainCircuit,
  Users,
  Bot,
  BarChart3,
  Settings2,
  ShieldBan,
  Trophy,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { useAuthStore } from "@/store/authStore"
import { adminApi } from "@/api/admin"

const adminLinks = [
  { label: "Feature toggles", href: "/admin/settings", icon: Settings2 },
  { label: "Strategies", href: "/admin/strategies", icon: BrainCircuit },
  { label: "Best strategies", href: "/admin/analytics", icon: Trophy },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "AI Models", href: "/admin/models", icon: Bot },
  { label: "Block users", href: "/admin/block", icon: ShieldBan },
]

export default function AdminHome() {
  const user = useAuthStore((s) => s.user)
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi
      .overview()
      .then(setOverview)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Control Center</h1>
          <p className="mt-1 text-slate-400">
            Logged in as {user?.firstName} ({user?.role})
          </p>
        </div>
        <MarketStatusBadge />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
        </div>
      ) : overview ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Users", overview.counts?.users],
            ["Blocked", overview.counts?.blocked],
            ["Strategies", overview.counts?.strategies],
            ["Trades", overview.counts?.trades],
            ["Brokers", overview.counts?.brokers],
            ["Vision jobs", overview.counts?.visionJobs],
          ].map(([label, val]) => (
            <Card key={label}>
              <CardContent className="py-4">
                <p className="text-xs text-slate-500 uppercase">{label}</p>
                <p className="text-2xl font-bold text-white mt-1">{val ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminLinks.map((item) => (
          <Link key={item.href} to={item.href}>
            <Card className="h-full transition-all hover:border-brand-gold/40 hover:bg-brand-navy-light/80 cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="rounded-lg bg-brand-slate/50 p-2 text-brand-gold">
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
          <CardTitle>Admin capabilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-400">
          <p>• Toggle strategy upload methods (step-by-step, video, hybrid, manual)</p>
          <p>• Global gates for news filter, risk adjustment, profit lock, sessions</p>
          <p>• Add / edit free & paid OpenRouter models</p>
          <p>• Block / unblock users with required reason</p>
          <p>• Best-performing strategies (demo / live / prop)</p>
          <p>• Only admin can permanently delete a strategy</p>
        </CardContent>
      </Card>
    </div>
  )
}
