import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { BarChart3, Loader2, TrendingUp, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { strategiesApi } from "@/api/strategies"
import { tradingApi } from "@/api/trading"
import { StrategyMetricsPanel } from "@/components/StrategyMetricsPanel"

export default function AnalyticsPage() {
  const [strategies, setStrategies] = useState([])
  const [trades, setTrades] = useState([])
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError("")
      try {
        const [s, t, sig] = await Promise.all([
          strategiesApi.list(),
          tradingApi.listTrades(),
          tradingApi.listSignals(),
        ])
        setStrategies(s.strategies || [])
        setTrades(t.trades || [])
        setSignals(sig.signals || [])
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load analytics")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const closed = trades.filter((t) => t.status === "closed")
  const open = trades.filter((t) => t.status === "open" || t.status === "pending")
  const totalPnl = closed.reduce((s, t) => s + (Number(t.pnl) || 0), 0)
  const wins = closed.filter((t) => (t.pnl || 0) > 0).length
  const losses = closed.filter((t) => (t.pnl || 0) < 0).length
  const winRate = closed.length ? ((wins / closed.length) * 100).toFixed(1) : "0.0"
  const rejected = trades.filter((t) =>
    ["skipped_due_to_news", "skipped_session", "skipped_risk", "rejected"].includes(t.status)
  ).length
  const acceptedSignals = signals.filter((s) =>
    ["validated", "executed", "signal_only"].includes(s.status)
  ).length

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
            <BarChart3 className="h-7 w-7 text-brand-cyan" />
            Performance Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Expectancy-focused overview from your strategies, signals, and trades
          </p>
        </div>
        <MarketStatusBadge />
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Strategies", value: strategies.length, icon: Activity },
          { label: "Open / pending", value: open.length, icon: Activity },
          { label: "Closed trades", value: closed.length, icon: Activity },
          { label: "Win rate", value: `${winRate}%`, icon: TrendingUp },
          { label: "Total PnL (closed)", value: totalPnl.toFixed(2), icon: TrendingUp },
          { label: "Wins / Losses", value: `${wins} / ${losses}`, icon: TrendingUp },
          { label: "Signals accepted", value: acceptedSignals, icon: Activity },
          { label: "Rejected / skipped", value: rejected, icon: Activity },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="py-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">{m.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Strategies</CardTitle>
          <CardDescription>Status, confidence, and recorded performance fields</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {!strategies.length ? (
            <p className="text-sm text-slate-500">No strategies yet</p>
          ) : (
            strategies.map((s) => (
              <div
                key={s._id}
                className="rounded-lg border border-brand-slate/50 px-3 py-2 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="text-white font-medium">
                    {s.name}{" "}
                    <span className="text-xs text-slate-500">({s.status})</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {s.sourceType} · confidence {s.overallConfidence || 0}
                  </p>
                </div>
                <div className="mt-2 w-full">
                  <StrategyMetricsPanel strategy={s} compact />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent trades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-80 overflow-y-auto">
          {!trades.length ? (
            <p className="text-sm text-slate-500">No trades yet — use the Terminal after approving a strategy</p>
          ) : (
            trades.slice(0, 30).map((t) => (
              <div
                key={t._id}
                className="flex items-center justify-between gap-2 rounded-lg border border-brand-slate/40 px-3 py-2 text-sm text-slate-300"
              >
                <div>
                <span className="text-white">{t.pair}</span> {t.direction} · {t.status}
                {t.pnl != null ? ` · PnL ${t.pnl}` : ""}
                {t.rejectReason ? ` · ${t.rejectReason}` : ""}
                <span className="text-xs text-slate-500 block">
                  {new Date(t.createdAt).toLocaleString()}
                </span>
                </div>
                <Link
                  to={`/dashboard/charts?pair=${encodeURIComponent(t.pair || "EURUSD")}&strategyId=${t.strategyId || ""}&tradeId=${t._id}`}
                  className="text-xs text-brand-cyan hover:underline shrink-0"
                >
                  Chart
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
