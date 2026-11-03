import { useEffect, useState } from "react"
import { Settings2, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { Input } from "@/components/ui/input"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { adminApi } from "@/api/admin"
import { learningApi } from "@/api/learning"

const TOGGLE_META = [
  { key: "strategyUploadStepByStep", label: "Step-by-step visual upload", desc: "4 steps · 1–3 images" },
  { key: "video", label: "Video-only upload", desc: "Up to ~12 min tutorials" },
  { key: "hybrid", label: "Hybrid upload", desc: "Video + images per step" },
  { key: "manual", label: "Manual strategy entry", desc: "Rules without vision assets" },
  { key: "newsFilter", label: "News filter engine", desc: "Block signals near high-impact events" },
  { key: "riskAdjustment", label: "Risk adjustment engine", desc: "Global allow (still default OFF per strategy)" },
  { key: "profitLock50", label: "Profit lock 50%", desc: "Allow profit-lock feature globally" },
  { key: "sessionConstraints", label: "Session constraints", desc: "Session / day / frequency gates" },
  { key: "preSignalValidation", label: "Pre-signal validation", desc: "Quick backtest + metric gates before signals" },
  { key: "aiChartAssist", label: "AI chart assist", desc: "On-demand chart annotation with cache & rate limits" },
]

export default function AdminFeatureTogglesPage() {
  const [toggles, setToggles] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [aiChartCfg, setAiChartCfg] = useState({
    cooldownSeconds: 120,
    cacheTtlSeconds: 900,
    maxPerHour: 10,
    candleCount: 80,
  })
  const [preSignalCfg, setPreSignalCfg] = useState({
    mode: "block",
    runQuickBacktest: true,
    candleCount: 180,
    timeframe: "H1",
    usePromotionGates: true,
    minTrades: 10,
    minWinRate: 40,
    minExpectancy: 0,
    maxDrawdownPercent: 25,
  })
  const [gates, setGates] = useState({
    enabled: false,
    minTrades: 20,
    minWinRate: 45,
    minExpectancy: 0,
    maxDrawdownPercent: 20,
    minProfitFactor: 1.1,
    minDesignatedRRHitRate: 40,
    minWalkForwardFoldPassRate: 50,
    minStabilityScore: 40,
  })
  const [dataProviders, setDataProviders] = useState({
    marketDataProvider: "twelvedata",
    newsDataProvider: "financecalendar",
  })

  useEffect(() => {
    ;(async () => {
      try {
        const [data, gatesRes] = await Promise.all([
          adminApi.settings(),
          learningApi.getGates().catch(() => ({ gates: null })),
        ])
        setToggles({ ...(data.settings?.globalFeatureToggles || {}) })
        if (gatesRes?.gates) {
          setGates((prev) => ({ ...prev, ...gatesRes.gates }))
        } else if (data.settings?.promotionGates) {
          setGates((prev) => ({ ...prev, ...data.settings.promotionGates }))
        }
        if (data.settings?.aiChartAssist) {
          setAiChartCfg((prev) => ({ ...prev, ...data.settings.aiChartAssist }))
        }
        if (data.settings?.preSignalValidation) {
          setPreSignalCfg((prev) => ({ ...prev, ...data.settings.preSignalValidation }))
        }
        setDataProviders({
          marketDataProvider: data.settings?.marketDataProvider || "twelvedata",
          newsDataProvider: data.settings?.newsDataProvider || "financecalendar",
        })
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  
  const saveAiChart = async () => {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const data = await adminApi.updateAiChart({
        enabled: toggles.aiChartAssist !== false,
        ...aiChartCfg,
      })
      if (data.aiChartAssist) setAiChartCfg((p) => ({ ...p, ...data.aiChartAssist }))
      setSuccess(data.message || "AI chart assist saved")
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save AI chart settings")
    } finally {
      setSaving(false)
    }
  }

  const savePreSignal = async () => {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const data = await adminApi.updatePreSignal({
        enabled: Boolean(toggles.preSignalValidation),
        ...preSignalCfg,
      })
      if (data.preSignalValidation) setPreSignalCfg((p) => ({ ...p, ...data.preSignalValidation }))
      setSuccess(data.message || "Pre-signal settings saved")
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save pre-signal settings")
    } finally {
      setSaving(false)
    }
  }

  const saveGates = async () => {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const data = await learningApi.updateGates(gates)
      setGates({ ...gates, ...data.gates })
      setSuccess(data.message || "Promotion gates saved")
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save gates")
    } finally {
      setSaving(false)
    }
  }

  const saveProviders = async () => {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const data = await adminApi.updateDataProviders(dataProviders)
      if (data.settings?.aiChartAssist) {
          setAiChartCfg((prev) => ({ ...prev, ...data.settings.aiChartAssist }))
        }
        if (data.settings?.preSignalValidation) {
          setPreSignalCfg((prev) => ({ ...prev, ...data.settings.preSignalValidation }))
        }
        setDataProviders({
        marketDataProvider: data.marketDataProvider,
        newsDataProvider: data.newsDataProvider,
      })
      setSuccess(data.message || "Data providers saved")
    } catch (err) {
      setError(err?.response?.data?.message || "Provider save failed")
    } finally {
      setSaving(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const data = await adminApi.updateFeatureToggles(toggles)
      setToggles({ ...data.globalFeatureToggles })
      setSuccess(data.message || "Saved")
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed")
    } finally {
      setSaving(false)
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
    <div className="space-y-8 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings2 className="h-7 w-7 text-brand-gold" />
            Global feature toggles
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Strategy upload methods and platform-wide feature gates
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
          <CardTitle>Controls</CardTitle>
          <CardDescription>
            Disabled upload methods disappear from the user strategy creator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {TOGGLE_META.map((t) => (
            <div
              key={t.key}
              className="flex items-center justify-between gap-4 rounded-lg border border-brand-slate/50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{t.label}</p>
                <p className="text-xs text-slate-500">{t.desc}</p>
              </div>
              <ToggleSwitch
                checked={Boolean(toggles?.[t.key])}
                onChange={(val) => setToggles((prev) => ({ ...prev, [t.key]: val }))}
                label={t.label}
              />
            </div>
          ))}
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save toggles
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Market data & news providers</CardTitle>
          <CardDescription>
            Platform-wide. Charts, backtests, and the economic calendar use these free vendors.
            OHLC: TWELVEDATA_API_KEY / FINNHUB_API_KEY. News: FINANCECALENDAR_API_KEY / JBNEWS_API_KEY (preferred), Finnhub/FMP as fallback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-slate-300">OHLC market data</p>
            <select
              value={dataProviders.marketDataProvider}
              onChange={(e) =>
                setDataProviders((d) => ({ ...d, marketDataProvider: e.target.value }))
              }
              className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
            >
              <option value="twelvedata">Twelve Data (free tier)</option>
              <option value="finnhub">Finnhub (free tier)</option>
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-300">Economic calendar</p>
            <select
              value={dataProviders.newsDataProvider}
              onChange={(e) =>
                setDataProviders((d) => ({ ...d, newsDataProvider: e.target.value }))
              }
              className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
            >
              <option value="financecalendar">Finance Calendar (financecalendar.com)</option>
              <option value="jbnews">JB News / JBlanked</option>
              <option value="finnhub">Finnhub (fallback)</option>
              <option value="fmp">Financial Modeling Prep (fallback)</option>
            </select>
          </div>
          <Button onClick={saveProviders} disabled={saving}>
            Save data providers
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promotion gates (optional)</CardTitle>
          <CardDescription>
            Informational live-readiness checks after backtests. When disabled, all strategies
            report pass. Does not block approve or demo trading.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Enable promotion gates</span>
            <ToggleSwitch
              checked={Boolean(gates.enabled)}
              onChange={(v) => setGates((g) => ({ ...g, enabled: v }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["minTrades", "Min trades"],
              ["minWinRate", "Min win rate %"],
              ["minExpectancy", "Min expectancy"],
              ["maxDrawdownPercent", "Max DD %"],
              ["minProfitFactor", "Min profit factor"],
              ["minDesignatedRRHitRate", "Min RR hit rate %"],
              ["minWalkForwardFoldPassRate", "Min WF fold pass %"],
              ["minStabilityScore", "Min stability score"],
            ].map(([key, label]) => (
              <div key={key} className="space-y-1">
                <p className="text-xs text-slate-500">{label}</p>
                <Input
                  type="number"
                  step="any"
                  value={gates[key]}
                  onChange={(e) =>
                    setGates((g) => ({ ...g, [key]: e.target.value === "" ? "" : Number(e.target.value) }))
                  }
                />
              </div>
            ))}
          </div>
          <Button onClick={saveGates} disabled={saving}>
            Save promotion gates
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pre-signal validation details</CardTitle>
          <CardDescription>
            When the global toggle is on, every manual and auto signal runs these checks first.
            Block mode rejects; warn mode allows with audit note.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Mode</p>
            <select
              value={preSignalCfg.mode}
              onChange={(e) => setPreSignalCfg((c) => ({ ...c, mode: e.target.value }))}
              className="flex h-10 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-3 text-sm text-brand-silver"
            >
              <option value="block">Block failing signals</option>
              <option value="warn">Warn only (allow signal)</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Run quick backtest</span>
            <ToggleSwitch
              checked={Boolean(preSignalCfg.runQuickBacktest)}
              onChange={(v) => setPreSignalCfg((c) => ({ ...c, runQuickBacktest: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Include promotion gates</span>
            <ToggleSwitch
              checked={Boolean(preSignalCfg.usePromotionGates)}
              onChange={(v) => setPreSignalCfg((c) => ({ ...c, usePromotionGates: v }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["candleCount", "Backtest candles"],
              ["minTrades", "Min trades"],
              ["minWinRate", "Min win rate %"],
              ["minExpectancy", "Min expectancy"],
              ["maxDrawdownPercent", "Max DD %"],
            ].map(([key, label]) => (
              <div key={key} className="space-y-1">
                <p className="text-xs text-slate-500">{label}</p>
                <Input
                  type="number"
                  value={preSignalCfg[key]}
                  onChange={(e) =>
                    setPreSignalCfg((c) => ({
                      ...c,
                      [key]: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                />
              </div>
            ))}
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Timeframe</p>
              <select
                value={preSignalCfg.timeframe}
                onChange={(e) => setPreSignalCfg((c) => ({ ...c, timeframe: e.target.value }))}
                className="flex h-10 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-3 text-sm text-brand-silver"
              >
                {["M15", "H1", "H4", "D1"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={savePreSignal} disabled={saving}>
            Save pre-signal settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI chart assist limits</CardTitle>
          <CardDescription>
            On-demand only (not every tick). Results cached in Redis. Hourly cap protects API cost.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["cooldownSeconds", "Cooldown (sec)"],
              ["cacheTtlSeconds", "Cache TTL (sec)"],
              ["maxPerHour", "Max / hour / user"],
              ["candleCount", "Candles sent"],
            ].map(([key, label]) => (
              <div key={key} className="space-y-1">
                <p className="text-xs text-slate-500">{label}</p>
                <Input
                  type="number"
                  value={aiChartCfg[key]}
                  onChange={(e) =>
                    setAiChartCfg((c) => ({
                      ...c,
                      [key]: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <Button onClick={saveAiChart} disabled={saving}>
            Save AI chart limits
          </Button>
        </CardContent>
      </Card>


    </div>
  )
}
