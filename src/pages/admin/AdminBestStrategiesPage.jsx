import { useEffect, useState } from "react"
import { Trophy, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { adminApi } from "@/api/admin"

function RankList({ title, items }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!items?.length ? (
          <p className="text-sm text-slate-500">No entries yet</p>
        ) : (
          items.map((s, i) => (
            <div
              key={s._id}
              className="rounded-lg border border-brand-slate/50 px-3 py-2 text-sm"
            >
              <p className="text-white font-medium">
                #{i + 1} {s.name}{" "}
                <span className="text-xs text-slate-500">({s.status})</span>
              </p>
              <p className="text-xs text-slate-500">
                {s.userId?.email || "—"} · WR {(s.performance?.winRate || 0).toFixed?.(1) ?? s.performance?.winRate ?? 0}% · Exp{" "}
                {s.performance?.expectancy ?? 0} · PF {s.performance?.profitFactor ?? 0} · DD{" "}
                {s.performance?.maxDD ?? 0}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminBestStrategiesPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const d = await adminApi.bestStrategies()
        setData(d)
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="h-7 w-7 text-brand-gold" />
            Best-performing strategies
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ranked by expectancy, profit factor, win rate · demo / live / prop
          </p>
        </div>
        <MarketStatusBadge />
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <RankList title="Demo / Approved" items={data?.demo} />
        <RankList title="Live" items={data?.live} />
        <RankList title="Prop firm assigned" items={data?.prop} />
      </div>

      <RankList title="Overall ranked" items={data?.ranked} />
    </div>
  )
}
