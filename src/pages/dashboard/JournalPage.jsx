import { useEffect, useMemo, useState } from "react"
import { BookOpen, Loader2, ExternalLink, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { journalApi } from "@/api/journal"
import { strategiesApi } from "@/api/strategies"
import api from "@/api/client"

function outcomeBadge(out) {
  if (out === "win") return "bg-emerald-500/15 text-emerald-400"
  if (out === "loss") return "bg-red-500/15 text-red-400"
  if (out === "breakeven") return "bg-slate-500/15 text-slate-300"
  return "bg-slate-500/15 text-slate-500"
}

export default function JournalPage() {
  const now = new Date()
  const [trades, setTrades] = useState([])
  const [stats, setStats] = useState(null)
  const [signals, setSignals] = useState([])
  const [strategies, setStrategies] = useState([])
  const [calendar, setCalendar] = useState([])
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [noteEdit, setNoteEdit] = useState({})
  const [filters, setFilters] = useState({
    strategyId: "",
    accountType: "",
    outcome: "",
    from: "",
    to: "",
  })

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const params = {}
      if (filters.strategyId) params.strategyId = filters.strategyId
      if (filters.accountType) params.accountType = filters.accountType
      if (filters.outcome) params.outcome = filters.outcome
      if (filters.from) params.from = filters.from
      if (filters.to) params.to = filters.to

      const [t, s, st, cal] = await Promise.all([
        journalApi.trades(params),
        journalApi.signals(filters.strategyId ? { strategyId: filters.strategyId } : {}),
        strategiesApi.list(),
        journalApi.calendar({ year, month }),
      ])
      setTrades(t.trades || [])
      setStats(t.stats || null)
      setSignals(s.signals || [])
      setStrategies(st.strategies || [])
      setCalendar(cal.days || [])
      const notes = {}
      for (const tr of t.trades || []) notes[tr._id] = tr.journalNotes || ""
      setNoteEdit(notes)
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load journal")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filters.strategyId, filters.accountType, filters.outcome, filters.from, filters.to, year, month])

  const strategyName = (id) =>
    strategies.find((s) => String(s._id) === String(id))?.name || "—"

  const calMap = useMemo(() => {
    const m = {}
    for (const d of calendar) m[d.date] = d
    return m
  }, [calendar])

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()

  const saveNote = async (id) => {
    try {
      await journalApi.updateTrade(id, { journalNotes: noteEdit[id] || "" })
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save note")
    }
  }

  const exportCsv = async () => {
    try {
      const params = {}
      if (filters.strategyId) params.strategyId = filters.strategyId
      if (filters.accountType) params.accountType = filters.accountType
      if (filters.from) params.from = filters.from
      if (filters.to) params.to = filters.to
      const { data } = await api.get("/journal/export.csv", {
        params,
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([data]))
      const a = document.createElement("a")
      a.href = url
      a.download = "altra-journal.csv"
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      setError("CSV export failed — check you are logged in")
    }
  }

  const shiftMonth = (delta) => {
    let m = month + delta
    let y = year
    if (m < 1) {
      m = 12
      y -= 1
    }
    if (m > 12) {
      m = 1
      y += 1
    }
    setMonth(m)
    setYear(y)
  }

  if (loading && !trades.length) {
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
            <BookOpen className="h-7 w-7 text-brand-gold" />
            Trading Journal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            History, calendar, notes, and win / loss outcomes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <MarketStatusBadge />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-500">Closed</p>
            <p className="text-xl text-white font-semibold">{stats?.closed ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-500">Win rate</p>
            <p className="text-xl text-emerald-400 font-semibold">{stats?.winRate ?? 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-500">Wins / Losses</p>
            <p className="text-xl text-white font-semibold">
              {stats?.wins ?? 0} / {stats?.losses ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-500">Net PnL</p>
            <p
              className={`text-xl font-semibold ${
                Number(stats?.netPnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {stats?.netPnl ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Calendar</CardTitle>
            <CardDescription>
              {year}-{String(month).padStart(2, "0")}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => shiftMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e-${i}`} className="h-14 rounded-md bg-transparent" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const cell = calMap[key]
              const pnl = cell?.pnl || 0
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, from: key, to: key }))}
                  className={`h-14 rounded-md border border-brand-slate/40 p-1 text-left hover:border-brand-cyan/40 ${
                    cell ? "bg-brand-navy-light/50" : "bg-brand-navy/30"
                  }`}
                >
                  <div className="text-[10px] text-slate-400">{day}</div>
                  {cell && (
                    <>
                      <div className="text-[10px] text-white">{cell.trades}t</div>
                      <div
                        className={`text-[10px] ${
                          pnl >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {pnl.toFixed(0)}
                      </div>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label>Strategy</Label>
            <select
              value={filters.strategyId}
              onChange={(e) => setFilters((f) => ({ ...f, strategyId: e.target.value }))}
              className="flex h-10 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-3 text-sm text-brand-silver"
            >
              <option value="">All</option>
              {strategies.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Account type</Label>
            <select
              value={filters.accountType}
              onChange={(e) => setFilters((f) => ({ ...f, accountType: e.target.value }))}
              className="flex h-10 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-3 text-sm text-brand-silver"
            >
              <option value="">All</option>
              <option value="demo">Demo</option>
              <option value="live">Live</option>
              <option value="prop_firm">Prop firm</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Outcome</Label>
            <select
              value={filters.outcome}
              onChange={(e) => setFilters((f) => ({ ...f, outcome: e.target.value }))}
              className="flex h-10 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-3 text-sm text-brand-silver"
            >
              <option value="">All</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
              <option value="breakeven">Breakeven</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>From</Label>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trade history</CardTitle>
          <CardDescription>{trades.length} entries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[32rem] overflow-y-auto">
          {!trades.length ? (
            <p className="text-sm text-slate-500">No trades match these filters</p>
          ) : (
            trades.map((t) => {
              const out = t.computedOutcome || t.outcome || (t.status === "closed" ? "—" : t.status)
              return (
                <div
                  key={t._id}
                  className="rounded-lg border border-brand-slate/50 px-3 py-3 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-white font-medium">
                        {t.pair} {t.direction}{" "}
                        <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase ${outcomeBadge(out)}`}>
                          {out}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {strategyName(t.strategyId)} · {t.accountType || "—"} ·{" "}
                        {new Date(t.closedAt || t.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        Entry {t.entryPrice ?? "—"} · SL {t.stopLoss ?? "—"} · TP {t.takeProfit ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={Number(t.pnl) >= 0 ? "text-emerald-400" : "text-red-400"}>
                        PnL {t.pnl ?? "—"}
                      </span>
                      <Link
                        to={`/dashboard/charts?pair=${encodeURIComponent(t.pair || "EURUSD")}&strategyId=${t.strategyId || ""}&tradeId=${t._id}`}
                        className="inline-flex items-center gap-1 text-brand-cyan hover:underline"
                      >
                        Chart <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Journal notes"
                      value={noteEdit[t._id] ?? ""}
                      onChange={(e) =>
                        setNoteEdit((n) => ({ ...n, [t._id]: e.target.value }))
                      }
                    />
                    <Button size="sm" variant="secondary" onClick={() => saveNote(t._id)}>
                      Save
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-48 overflow-y-auto">
          {!signals.length ? (
            <p className="text-sm text-slate-500">No signals yet</p>
          ) : (
            signals.map((s) => (
              <div
                key={s._id}
                className="flex justify-between gap-2 rounded-lg border border-brand-slate/40 px-3 py-2 text-xs text-slate-400"
              >
                <span>
                  {s.pair} {s.direction} · {s.status}
                </span>
                <Link
                  to={`/dashboard/charts?pair=${encodeURIComponent(s.pair || "EURUSD")}&strategyId=${s.strategyId || ""}&signalId=${s._id}`}
                  className="text-brand-cyan hover:underline"
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
