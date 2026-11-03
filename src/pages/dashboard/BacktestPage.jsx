import { useEffect, useState } from "react"
import {
  FlaskConical,
  Loader2,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { strategiesApi } from "@/api/strategies"
import { backtestApi } from "@/api/backtest"
import { learningApi } from "@/api/learning"
import { FOREX_PAIRS, TIMEFRAMES, isSelectableStrategy } from "@/lib/forexPairs"

const PAIRS = FOREX_PAIRS
const TFS = TIMEFRAMES

export default function BacktestPage() {
  const [strategies, setStrategies] = useState([])
  const [runs, setRuns] = useState([])
  const [selected, setSelected] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [promotion, setPromotion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({
    strategyId: "",
    pair: "EURUSD",
    timeframe: "H1",
    mode: "historical",
    riskPerTradePercent: 1,
    initialBalance: 10000,
    candleCount: 500,
    trainBars: 200,
    testBars: 100,
    minRR: "2",
  })

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const [s, r, sn] = await Promise.all([
        strategiesApi.list(),
        backtestApi.list(),
        learningApi.listSnapshots({ limit: 20 }),
      ])
      const list = (s.strategies || []).filter(isSelectableStrategy)
      setStrategies(list)
      setRuns(r.runs || [])
      setSnapshots(sn.snapshots || [])
      if (!form.strategyId && list[0]) {
        setForm((f) => ({ ...f, strategyId: list[0]._id, minRR: String(list[0].designatedRR || list[0].rules?.minRR || 2) }))
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load backtests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const run = async (e) => {
    e.preventDefault()
    if (!form.strategyId) {
      setError("Select a strategy")
      return
    }
    setRunning(true)
    setError("")
    setSuccess("")
    try {
      const data = await backtestApi.run({
        ...form,
        riskPerTradePercent: Number(form.riskPerTradePercent),
        initialBalance: Number(form.initialBalance),
        candleCount: Number(form.candleCount),
        trainBars: Number(form.trainBars),
        testBars: Number(form.testBars),
        minRR: Number(form.minRR),
      })
      setSelected(data.run)
      setPromotion(data.run?.results?.promotion || null)
      setSuccess(
        `Completed · WR ${data.run.results?.winRate}% · Exp ${data.run.results?.expectancy} · DD ${data.run.results?.maxDrawdownPercent}%`
      )
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Backtest failed")
    } finally {
      setRunning(false)
    }
  }

  const openRun = async (id) => {
    try {
      const data = await backtestApi.get(id)
      setSelected(data.run)
      setPromotion(data.run?.results?.promotion || null)
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load run")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    )
  }

  const res = selected?.results

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="h-7 w-7 text-brand-gold" />
            Backtesting & Walk-Forward
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Historical simulation · walk-forward folds · expectancy & drawdown focus
          </p>
        </div>
        <MarketStatusBadge />
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
          <CardTitle>Run backtest</CardTitle>
          <CardDescription>
            Uses strategy direction / min RR rules on OHLC series. Promote only when expectancy and
            drawdown meet your gates (demo-first).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={run} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
              <Label>Strategy</Label>
              <select
                value={form.strategyId}
                onChange={(e) => setForm((f) => ({ ...f, strategyId: e.target.value }))}
                className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
                required
              >
                <option value="">Select strategy</option>
                {strategies.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Pair</Label>
              <select
                value={form.pair}
                onChange={(e) => setForm((f) => ({ ...f, pair: e.target.value }))}
                className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
              >
                {PAIRS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Timeframe</Label>
              <select
                value={form.timeframe}
                onChange={(e) => setForm((f) => ({ ...f, timeframe: e.target.value }))}
                className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
              >
                {TFS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Mode</Label>
              <select
                value={form.mode}
                onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}
                className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
              >
                <option value="historical">Historical</option>
                <option value="walk_forward">Walk-forward</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Designated RR (for this run)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.minRR}
                onChange={(e) => setForm((f) => ({ ...f, minRR: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Risk % / trade</Label>
              <Input
                type="number"
                step="0.1"
                value={form.riskPerTradePercent}
                onChange={(e) => setForm((f) => ({ ...f, riskPerTradePercent: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Initial balance</Label>
              <Input
                type="number"
                value={form.initialBalance}
                onChange={(e) => setForm((f) => ({ ...f, initialBalance: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Candle count</Label>
              <Input
                type="number"
                value={form.candleCount}
                onChange={(e) => setForm((f) => ({ ...f, candleCount: e.target.value }))}
              />
            </div>
            {form.mode === "walk_forward" && (
              <>
                <div className="space-y-1">
                  <Label>Train bars</Label>
                  <Input
                    type="number"
                    value={form.trainBars}
                    onChange={(e) => setForm((f) => ({ ...f, trainBars: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Test bars</Label>
                  <Input
                    type="number"
                    value={form.testBars}
                    onChange={(e) => setForm((f) => ({ ...f, testBars: e.target.value }))}
                  />
                </div>
              </>
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={running}>
                {running ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run {form.mode === "walk_forward" ? "walk-forward" : "historical"} backtest
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {res && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Trades", res.trades],
            ["Win rate", `${res.winRate}%`],
            ["Expectancy", res.expectancy],
            ["Profit factor", res.profitFactor],
            ["Max DD %", res.maxDrawdownPercent],
            ["Net profit", res.netProfit],
            ["Final balance", res.finalBalance],
            ["Wins / Losses", `${res.wins} / ${res.losses}`],
            ["Designated RR", res.designatedRR ?? form.minRR],
            ["RR hit rate", res.designatedRRHitRate != null ? `${res.designatedRRHitRate}%` : "—"],
            ["Likely RR", res.highProbabilityRR ?? "—"],
            ["Avg realized RR", res.avgRealizedRR ?? "—"],
            ["Stability score", res.stabilityScore ?? "—"],
            ["Fold pass %", res.foldPassRate != null ? `${res.foldPassRate}%` : "—"],
          ].map(([label, val]) => (
            <Card key={label}>
              <CardContent className="py-4">
                <p className="text-xs text-slate-500 uppercase">{label}</p>
                <p className="text-xl font-bold text-white mt-1">{val}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {res?.walkForwardFolds?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Walk-forward folds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {res.walkForwardFolds.map((f) => (
              <div
                key={f.fold}
                className="rounded-lg border border-brand-slate/50 px-3 py-2 text-sm text-slate-300"
              >
                Fold {f.fold}: test trades {f.trades} · WR {f.winRate}% · Exp {f.expectancy ?? "—"} · net{" "}
                {f.netProfit} · DD {f.maxDrawdownPercent}%
                {f.trainWinRate != null ? ` · train WR ${f.trainWinRate}%` : ""}
                {f.passed != null ? (f.passed ? " · pass" : " · fail") : ""}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {res?.tradeList?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sample trades (last 100)</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto space-y-1 text-sm">
            {res.tradeList.map((t, i) => (
              <div key={i} className="text-slate-400 border-b border-brand-slate/30 py-1">
                {t.direction} entry {t.entry} → {t.exit} · PnL {t.pnl} · {t.reason}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
      {(promotion || res?.promotion) && (
        <Card>
          <CardHeader>
            <CardTitle>Promotion check</CardTitle>
            <CardDescription>
              Optional admin gates for live readiness. Disabled gates always pass.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(() => {
              const p = promotion || res.promotion
              return (
                <>
                  <p className={p.passed ? "text-emerald-400" : "text-amber-400"}>
                    {p.passed ? "Passes promotion gates" : "Does not pass promotion gates"}
                  </p>
                  <p className="text-slate-500">{p.note}</p>
                  {p.failures?.length > 0 && (
                    <ul className="text-amber-400/90 text-xs space-y-1">
                      {p.failures.map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  )}
                </>
              )
            })()}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Performance snapshots</CardTitle>
          <CardDescription>History of backtest / learning evaluations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 max-h-48 overflow-y-auto">
          {!snapshots.length ? (
            <p className="text-sm text-slate-500">No snapshots yet — run a backtest</p>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap._id}
                className="rounded-lg border border-brand-slate/50 px-3 py-2 text-xs text-slate-400"
              >
                <span className="text-white">{snap.source}</span> · WR {snap.metrics?.winRate}% · Exp{" "}
                {snap.metrics?.expectancy} · DD {snap.metrics?.maxDD}% · stability{" "}
                {snap.metrics?.stabilityScore ?? "—"}
                <span className="block text-slate-500">
                  {snap.promotion?.passed ? "gates pass" : "gates fail"} ·{" "}
                  {new Date(snap.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

Previous runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!runs.length ? (
            <p className="text-sm text-slate-500">No runs yet</p>
          ) : (
            runs.map((r) => (
              <button
                key={r._id}
                type="button"
                onClick={() => openRun(r._id)}
                className="w-full text-left rounded-lg border border-brand-slate/50 px-3 py-2 text-sm hover:border-brand-cyan/40"
              >
                <span className="text-white font-medium">
                  {r.pair} {r.timeframe} · {r.mode}
                </span>
                <span className="text-slate-500 text-xs block">
                  {r.status} · WR {r.results?.winRate ?? "—"}% · Exp {r.results?.expectancy ?? "—"} ·{" "}
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-600">
        Uses live OHLC from the platform market-data provider when API keys are configured.
      </p>
    </div>
  )
}
