import { useEffect, useState } from "react"
import { Clock, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { strategiesApi } from "@/api/strategies"
import { accountConfigApi } from "@/api/trading"
import { FOREX_PAIRS } from "@/lib/forexPairs"

const SESSION_OPTS = [
  { id: "london", label: "London" },
  { id: "newyork", label: "New York" },
  { id: "tokyo", label: "Tokyo / Asia" },
  { id: "sydney", label: "Sydney" },
]

const DAYS = [
  ["monday", "Mon"],
  ["tuesday", "Tue"],
  ["wednesday", "Wed"],
  ["thursday", "Thu"],
  ["friday", "Fri"],
  ["saturday", "Sat"],
  ["sunday", "Sun"],
]

const DEFAULT_CONFIG = {
  type: "demo",
  sessions: ["london", "newyork", "tokyo", "sydney"],
  tradeFrequency: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  },
  maxTradesPerWeek: null,
  oneSignalPerSession: true,
  allowMultipleSessions: true,
  tradeDirection: "long_short",
  allowedPairs: [],
  onlySignals: false,
  propFirmLimits: {
    maxDailyDD: 5,
    maxWeeklyDD: 10,
    maxOpenRisk: 2,
    maxConsecutiveLosses: 3,
    dailyLossCap: 3,
    weeklyLossCap: 6,
  },
}

const DEFAULT_RISK = {
  enabled: false,
  trendAlignment: false,
  newsImpactCheck: false,
  profitLock50: { enabled: false, activationLevel: 50 },
  drawdownGuard: true,
  capitalGuard: true,
}

function normalizeConfig(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_CONFIG }
  return {
    ...DEFAULT_CONFIG,
    ...raw,
    sessions: Array.isArray(raw.sessions) ? raw.sessions : DEFAULT_CONFIG.sessions,
    tradeFrequency: {
      ...DEFAULT_CONFIG.tradeFrequency,
      ...(raw.tradeFrequency || {}),
    },
    propFirmLimits: {
      ...DEFAULT_CONFIG.propFirmLimits,
      ...(raw.propFirmLimits || {}),
    },
    allowedPairs: Array.isArray(raw.allowedPairs) ? raw.allowedPairs : [],
  }
}

export default function SessionsPage() {
  const [strategies, setStrategies] = useState([])
  const [strategyId, setStrategyId] = useState("")
  const [config, setConfig] = useState(null)
  const [riskAdj, setRiskAdj] = useState(DEFAULT_RISK)
  const [loading, setLoading] = useState(true)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [pairInput, setPairInput] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const data = await strategiesApi.list()
        const list = data.strategies || []
        setStrategies(list)
        if (list[0]?._id) setStrategyId(list[0]._id)
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load strategies")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!strategyId) {
      setConfig(null)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingConfig(true)
      setError("")
      try {
        const data = await accountConfigApi.getForStrategy(strategyId)
        if (cancelled) return
        setConfig(normalizeConfig(data.config))
        try {
          const st = await strategiesApi.get(strategyId)
          const ra = st.strategy?.riskAdjustment
          if (ra) {
            setRiskAdj({
              enabled: !!ra.enabled,
              trendAlignment: !!ra.trendAlignment,
              newsImpactCheck: !!ra.newsImpactCheck,
              profitLock50: {
                enabled: !!ra.profitLock50?.enabled,
                activationLevel: ra.profitLock50?.activationLevel || 50,
              },
              drawdownGuard: ra.drawdownGuard !== false,
              capitalGuard: ra.capitalGuard !== false,
            })
          } else {
            setRiskAdj(DEFAULT_RISK)
          }
        } catch {
          setRiskAdj(DEFAULT_RISK)
        }
      } catch (err) {
        if (cancelled) return
        setError(err?.response?.data?.message || "Failed to load config — showing defaults")
        setConfig(normalizeConfig(null))
      } finally {
        if (!cancelled) setLoadingConfig(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [strategyId])

  const toggleSession = (id) => {
    setConfig((c) => {
      if (!c) return c
      const sessions = c.sessions || []
      const next = sessions.includes(id)
        ? sessions.filter((s) => s !== id)
        : [...sessions, id]
      return { ...c, sessions: next }
    })
  }

  const toggleDay = (day) => {
    setConfig((c) => {
      if (!c) return c
      return {
        ...c,
        tradeFrequency: {
          ...c.tradeFrequency,
          [day]: !c.tradeFrequency?.[day],
        },
      }
    })
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
      setSuccess("Session settings saved")
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const addPair = () => {
    const p = pairInput.trim().toUpperCase().replace(/[^A-Z]/g, "")
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
            Choose a strategy, then set sessions, trade days, pairs, and risk controls.
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
          <option value="">Select a strategy to configure</option>
          {strategies.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.status})
            </option>
          ))}
        </select>
        {!strategies.length && (
          <p className="text-sm text-slate-500">
            Create a strategy first from Strategies, then set sessions here.
          </p>
        )}
      </div>

      {loadingConfig && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
        </div>
      )}

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
                      : "border-brand-slate/60 text-slate-400 hover:border-brand-slate"
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
              {DAYS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(key)}
                  className={`rounded-full px-3 py-2 text-sm border ${
                    config.tradeFrequency?.[key]
                      ? "border-brand-gold bg-brand-gold/15 text-brand-gold"
                      : "border-brand-slate/60 text-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limits & direction</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
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
              <div className="space-y-1">
                <Label>Direction</Label>
                <select
                  value={config.tradeDirection}
                  onChange={(e) => setConfig((c) => ({ ...c, tradeDirection: e.target.value }))}
                  className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
                >
                  <option value="long_short">Long & short</option>
                  <option value="long">Long only</option>
                  <option value="short">Short only</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Max trades / week</Label>
                <Input
                  type="number"
                  value={config.maxTradesPerWeek ?? ""}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      maxTradesPerWeek: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  placeholder="Unlimited"
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-slate/40 px-3 py-2">
                <span className="text-sm text-slate-300">One signal per session</span>
                <ToggleSwitch
                  checked={!!config.oneSignalPerSession}
                  onChange={(v) => setConfig((c) => ({ ...c, oneSignalPerSession: v }))}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-slate/40 px-3 py-2">
                <span className="text-sm text-slate-300">Allow multiple sessions</span>
                <ToggleSwitch
                  checked={!!config.allowMultipleSessions}
                  onChange={(v) => setConfig((c) => ({ ...c, allowMultipleSessions: v }))}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-slate/40 px-3 py-2">
                <span className="text-sm text-slate-300">Signals only (no auto-open)</span>
                <ToggleSwitch
                  checked={!!config.onlySignals}
                  onChange={(v) => setConfig((c) => ({ ...c, onlySignals: v }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allowed pairs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(config.allowedPairs || []).length === 0 ? (
                  <p className="text-sm text-slate-500">All pairs allowed</p>
                ) : (
                  config.allowedPairs.map((p) => (
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
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={pairInput}
                  onChange={(e) => setPairInput(e.target.value)}
                  className="flex h-11 flex-1 rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
                >
                  <option value="">Select pair</option>
                  {FOREX_PAIRS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="secondary" onClick={addPair}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {config.type === "prop_firm" && (
            <Card>
              <CardHeader>
                <CardTitle>Prop firm limits</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {Object.keys(DEFAULT_CONFIG.propFirmLimits).map((k) => (
                  <div key={k} className="space-y-1">
                    <Label>{k}</Label>
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
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Risk adjustment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["enabled", "Enable risk adjustment"],
                ["trendAlignment", "Trend alignment"],
                ["newsImpactCheck", "News impact check"],
                ["drawdownGuard", "Drawdown guard"],
                ["capitalGuard", "Capital guard"],
              ].map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-brand-slate/40 px-3 py-2"
                >
                  <span className="text-sm text-slate-300">{label}</span>
                  <ToggleSwitch
                    checked={!!riskAdj[key]}
                    onChange={(v) => setRiskAdj((r) => ({ ...r, [key]: v }))}
                  />
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-slate/40 px-3 py-2">
                <span className="text-sm text-slate-300">Profit lock 50%</span>
                <ToggleSwitch
                  checked={!!riskAdj.profitLock50?.enabled}
                  onChange={(v) =>
                    setRiskAdj((r) => ({
                      ...r,
                      profitLock50: { ...r.profitLock50, enabled: v },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={save} disabled={saving || !strategyId}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </Button>
        </>
      )}
    </div>
  )
}
