import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Terminal,
  Loader2,
  ShieldOff,
  Play,
  XCircle,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { tradingApi } from "@/api/trading"
import { FOREX_PAIRS, isSelectableStrategy } from "@/lib/forexPairs"
import { strategiesApi } from "@/api/strategies"

export default function TerminalPage() {
  const [trades, setTrades] = useState([])
  const [signals, setSignals] = useState([])
  const [strategies, setStrategies] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({
    strategyId: "",
    pair: "EURUSD",
    direction: "long",
    entryPrice: "",
    stopLoss: "",
    takeProfit: "",
  })

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const [t, s, st] = await Promise.all([
        tradingApi.listTrades(),
        tradingApi.listSignals(),
        strategiesApi.list(),
      ])
      setTrades(t.trades || [])
      setSignals(s.signals || [])
      const approved = (st.strategies || []).filter(isSelectableStrategy)
      setStrategies(approved)
      if (!form.strategyId && approved[0]) {
        setForm((f) => ({ ...f, strategyId: approved[0]._id }))
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load terminal")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submitSignal = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError("")
    setSuccess("")
    try {
      const payload = {
        strategyId: form.strategyId,
        pair: form.pair,
        direction: form.direction,
        entryPrice: form.entryPrice ? Number(form.entryPrice) : null,
        stopLoss: form.stopLoss ? Number(form.stopLoss) : null,
        takeProfit: form.takeProfit ? Number(form.takeProfit) : null,
      }
      const data = await tradingApi.createSignal(payload)
      if (data.accepted) {
        setSuccess(`Signal accepted (${data.stage})`)
      } else {
        setError(`Rejected at ${data.stage}: ${data.trade?.rejectReason || data.signal?.rejectReason || "blocked"}`)
      }
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Signal failed")
    } finally {
      setBusy(false)
    }
  }

  const kill = async () => {
    if (!confirm("Cancel all open/pending trades?")) return
    setBusy(true)
    try {
      const data = await tradingApi.killSwitch()
      setSuccess(`Kill switch: cancelled ${data.cancelled} trades`)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Kill switch failed")
    } finally {
      setBusy(false)
    }
  }

  const syncStatus = async (id) => {
    setBusy(true)
    setError("")
    try {
      const data = await tradingApi.syncTradeStatus(id)
      setSuccess(
        data.fillState
          ? `Order ${data.orderStatus || data.fillState}`
          : "Status synced"
      )
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Status sync failed")
    } finally {
      setBusy(false)
    }
  }

  const openT = async (id) => {
    setBusy(true)
    try {
      await tradingApi.openTrade(id)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Open failed")
    } finally {
      setBusy(false)
    }
  }

  const closeT = async (id) => {
    setBusy(true)
    try {
      await tradingApi.closeTrade(id, 0)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Close failed")
    } finally {
      setBusy(false)
    }
  }

  const adjust = async (id) => {
    setBusy(true)
    setError("")
    try {
      const data = await tradingApi.riskAdjust(id)
      setSuccess(data.reason || (data.adjusted ? "Adjusted" : "No adjustment"))
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Adjust failed")
    } finally {
      setBusy(false)
    }
  }

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
            <Terminal className="h-7 w-7 text-brand-gold" />
            Live Terminal
          </h1>
          <p className="text-sm text-slate-400 mt-1">Generate and manage trades. Enable auto-signal from a strategy’s Review page when you are ready.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MarketStatusBadge />
          <Button variant="destructive" disabled={busy} onClick={kill}>
            <ShieldOff className="h-4 w-4" />
            Kill switch
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generate signal</CardTitle>
          <CardDescription>
            Choose an approved strategy. Signals respect your news, session, and risk settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitSignal} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label>Strategy</Label>
              <select
                value={form.strategyId}
                onChange={(e) => setForm((f) => ({ ...f, strategyId: e.target.value }))}
                required
                className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
              >
                <option value="">Select strategy</option>
                {strategies.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Pair</Label>
              <select
                value={form.pair}
                onChange={(e) => setForm((f) => ({ ...f, pair: e.target.value }))}
                required
                className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
              >
                {FOREX_PAIRS.map((pr) => (
                  <option key={pr} value={pr}>{pr}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <select
                value={form.direction}
                onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))}
                className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Entry</Label>
              <Input
                type="number"
                step="any"
                value={form.entryPrice}
                onChange={(e) => setForm((f) => ({ ...f, entryPrice: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Stop loss</Label>
              <Input
                type="number"
                step="any"
                value={form.stopLoss}
                onChange={(e) => setForm((f) => ({ ...f, stopLoss: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Take profit</Label>
              <Input
                type="number"
                step="any"
                value={form.takeProfit}
                onChange={(e) => setForm((f) => ({ ...f, takeProfit: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={busy || !form.strategyId}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Process signal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trades.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              No trades yet. Generate a signal above when your strategy is approved.
            </p>
          ) : (
            trades.map((t) => (
              <div
                key={t._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-brand-slate/50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">
                    {t.pair} {t.direction} ·{" "}
                    <span className="text-slate-400">{t.status}</span>
                    {t.status === "closed" && (
                      <span
                        className={`ml-2 text-[10px] uppercase ${
                          (t.pnl || 0) > 0
                            ? "text-emerald-400"
                            : (t.pnl || 0) < 0
                              ? "text-red-400"
                              : "text-slate-500"
                        }`}
                      >
                        {(t.pnl || 0) > 0 ? "win" : (t.pnl || 0) < 0 ? "loss" : "flat"}
                      </span>
                    )}
                    <Link
                      to={`/dashboard/charts?pair=${encodeURIComponent(t.pair || "EURUSD")}&strategyId=${t.strategyId || ""}&tradeId=${t._id}`}
                      className="ml-2 text-xs text-brand-cyan hover:underline"
                    >
                      Chart
                    </Link>
                  </p>
                  <p className="text-xs text-slate-500">
                    Session: {t.session || "—"} · SL: {t.stopLoss ?? "—"} · TP: {t.takeProfit ?? "—"}
                    {t.rejectReason ? ` · ${t.rejectReason}` : ""}
                    {t.slAdjustment?.applied
                      ? ` · SL adj: ${t.slAdjustment.adjustmentReason}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {t.status === "pending" && (
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => openT(t._id)}>
                      <Play className="h-3.5 w-3.5" />
                      Open
                    </Button>
                  )}
                  {["open", "pending"].includes(t.status) && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => closeT(t._id)}>
                      <XCircle className="h-3.5 w-3.5" />
                      Close
                    </Button>
                  )}
                  {t.status === "open" && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => adjust(t._id)}>
                      Suggest SL adjust
                    </Button>
                  )}
                  {["open", "pending"].includes(t.status) && t.brokerAccountId && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => syncStatus(t._id)}>
                      Sync status
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent signals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!signals.length ? (
            <p className="text-sm text-slate-500 text-center py-4">No signals yet</p>
          ) : (
          signals.slice(0, 15).map((s) => (
            <div
              key={s._id}
              className="flex items-center justify-between gap-2 text-sm text-slate-400 border-b border-brand-slate/30 py-2"
            >
              <div>
                <span className="text-white">{s.pair}</span> {s.direction} · {s.status}
                {s.rejectReason ? ` — ${s.rejectReason}` : ""}
              </div>
              <Link
                to={`/dashboard/charts?pair=${encodeURIComponent(s.pair || "EURUSD")}&strategyId=${s.strategyId || ""}&signalId=${s._id}`}
                className="shrink-0 text-xs text-brand-cyan hover:underline"
              >
                View chart
              </Link>
            </div>
          ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
