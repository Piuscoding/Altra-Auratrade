import { useEffect, useState } from "react"
import { Clock, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { strategiesApi } from "@/api/strategies"
import { accountConfigApi } from "@/api/trading"

const SESSION_OPTS = [
  { id: "london", label: "London" },
  { id: "newyork", label: "New York" },
  { id: "tokyo", label: "Tokyo / Asia" },
  { id: "sydney", label: "Sydney / Australia" },
]

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export default function SessionsPage() {
  const [strategies, setStrategies] = useState([])
  const [strategyId, setStrategyId] = useState("")
  const [config, setConfig] = useState(null)
  const [riskAdj, setRiskAdj] = useState({
    enabled: false,
    trendAlignment: false,
    newsImpactCheck: false,
    profitLock50: { enabled: false, activationLevel: 50 },
    drawdownGuard: true,
    capitalGuard: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [pairInput, setPairInput] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const data = await strategiesApi.list()
        setStrategies(data.strategies || [])
        if (data.strategies?.[0]) setStrategyId(data.strategies[0]._id)
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load strategies")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!strategyId) return
    ;(async () => {
      setError("")
      try {
        const data = await accountConfigApi.getForStrategy(strategyId)
        setConfig(data.config)
        const st = await strategiesApi.get(strategyId)
        if (st.strategy?.riskAdjustment) {
          setRiskAdj({
            enabled: !!st.strategy.riskAdjustment.enabled,
            trendAlignment: !!st.strategy.riskAdjustment.trendAlignment,
            newsImpactCheck: !!st.strategy.riskAdjustment.newsImpactCheck,
            profitLock50: {
              enabled: !!st.strategy.riskAdjustment.profitLock50?.enabled,
              activationLevel: st.strategy.riskAdjustment.profitLock50?.activationLevel || 50,
            },
            drawdownGuard: st.strategy.riskAdjustment.drawdownGuard !== false,
            capitalGuard: st.strategy.riskAdjustment.capitalGuard !== false,
          })
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load config")
      }
    })()
  }, [strategyId])

  const toggleSession = (id) => {
    setConfig((c) => {
      const sessions = c.sessions || []
      const next = sessions.includes(id)
        ? sessions.filter((s) => s !== id)
        : [...sessions, id]
      return { ...c, sessions: next }
    })
  }

  const toggleDay = (day) => {
    setConfig((c) => ({
      ...c,
      tradeFrequency: {
        ...c.tradeFrequency,
        [day]: !c.tradeFrequency?.[day],
      },
    }))
  }

  const save = async () => {
    if (!strategyId || !config) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      await accountConfigApi.saveForStrategy(strategyId, {
        type: config.type,
        sessions: config.sessions,
        tradeFrequency: config.tradeFrequency,
        maxTradesPerWeek: config.maxTradesPerWeek,
        oneSignalPerSession: config.oneSignalPerSession,
        allowMultipleSessions: config.allowMultipleSessions,
        tradeDirection: config.tradeDirection,
        allowedPairs: config.allowedPairs,
        onlySignals: config.onlySignals,
        propFirmLimits: config.propFirmLimits,
      })
      await accountConfigApi.saveRiskAdjustment(strategyId, riskAdj)
      setSuccess("Session, account, and risk-adjustment settings saved")
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const addPair = () => {
    const p = pairInput.trim().toUpperCase()
    if (!p) return
    setConfig((c) => ({
      ...c,
      allowedPairs: [...new Set([...(c.allowedPairs || []), p])],
    }))
    setPairInput("")
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="h-7 w-7 text-brand-cyan" />
            Sessions & Constraints
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Per-strategy session filters, direction, prop limits, only-signals mode
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

      <div className="space-y-2">
        <Label>Strategy</Label>
        <select
          value={strategyId}
          onChange={(e) => setStrategyId(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
        >
          {strategies.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.status})
            </option>
          ))}
        </select>
      </div>

      {config && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Trading sessions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {SESSION_OPTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSession(s.id)}
                  className={`rounded-full px-4 py-2 text-sm border transition-all ${
                    (config.sessions || []).includes(s.id)
                      ? "border-brand-cyan bg-brand-cyan/15 text-brand-cyan"
                      : "border-brand-slate text-slate-400"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trade frequency</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`rounded-lg px-3 py-2 text-xs capitalize border ${
                    config.tradeFrequency?.[d]
                      ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
                      : "border-brand-slate text-slate-500"
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limits & direction</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Account type</Label>
                <select
                  value={config.type}
                  onChange={(e) => setConfig((c) => ({ ...c, type: e.target.value }))}
                  className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
                >
                  <option value="demo">Demo</option>
                  <option value="live">Live</option>
                  <option value="prop_firm">Prop firm</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
                <select
                  value={config.tradeDirection}
                  onChange={(e) => setConfig((c) => ({ ...c, tradeDirection: e.target.value }))}
                  className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
                >
                  <option value="long_short">Long & Short</option>
                  <option value="long">Long only</option>
                  <option value="short">Short only</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Max trades / week (empty = unlimited)</Label>
                <Input
                  type="number"
                  value={config.maxTradesPerWeek ?? ""}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      maxTradesPerWeek: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2 flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={!!config.oneSignalPerSession}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, oneSignalPerSession: e.target.checked }))
                    }
                  />
                  One signal per session
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={!!config.onlySignals}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, onlySignals: e.target.checked }))
                    }
                  />
                  Only generate signals (no trades)
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allowed pairs</CardTitle>
              <CardDescription>Leave empty for AI / manual any-pair</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={pairInput}
                  onChange={(e) => setPairInput(e.target.value)}
                  placeholder="EURUSD"
                />
                <Button type="button" variant="outline" onClick={addPair}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(config.allowedPairs || []).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="rounded-full border border-brand-slate px-3 py-1 text-xs text-slate-300"
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        allowedPairs: c.allowedPairs.filter((x) => x !== p),
                      }))
                    }
                  >
                    {p} ×
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {config.type === "prop_firm" && (
            <Card>
              <CardHeader>
                <CardTitle>Prop firm limits</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {["maxDailyDD", "maxWeeklyDD", "maxOpenRisk", "maxConsecutiveLosses", "dailyLossCap", "weeklyLossCap"].map(
                  (k) => (
                    <div key={k} className="space-y-1">
                      <Label className="text-xs">{k}</Label>
                      <Input
                        type="number"
                        value={config.propFirmLimits?.[k] ?? ""}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            propFirmLimits: {
                              ...c.propFirmLimits,
                              [k]: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-amber-500/20">
            <CardHeader>
              <CardTitle>Risk adjustment (default OFF)</CardTitle>
              <CardDescription>
                Only runs when enabled AND news filter is disabled. Single adjustment per trade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={riskAdj.enabled}
                  onChange={(e) => setRiskAdj((r) => ({ ...r, enabled: e.target.checked }))}
                />
                Enable risk adjustment engine
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={riskAdj.trendAlignment}
                  onChange={(e) => setRiskAdj((r) => ({ ...r, trendAlignment: e.target.checked }))}
                  disabled={!riskAdj.enabled}
                />
                Trend-aligned SL
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={riskAdj.newsImpactCheck}
                  onChange={(e) => setRiskAdj((r) => ({ ...r, newsImpactCheck: e.target.checked }))}
                  disabled={!riskAdj.enabled}
                />
                News impact estimation before SL move
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={riskAdj.profitLock50.enabled}
                  onChange={(e) =>
                    setRiskAdj((r) => ({
                      ...r,
                      profitLock50: { ...r.profitLock50, enabled: e.target.checked },
                    }))
                  }
                  disabled={!riskAdj.enabled}
                />
                Profit lock at 50%+
              </label>
            </CardContent>
          </Card>

          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </Button>
        </>
      )}
    </div>
  )
}
