import { useEffect, useState } from "react"
import { Settings, Loader2, Save, Bell, ScrollText, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { notificationsApi } from "@/api/notifications"
import { authApi } from "@/api/auth"

const EVENT_KEYS = [
  "signal",
  "trade_open",
  "trade_close",
  "trade_rejected",
  "news",
  "sl_adjust",
  "profit_lock",
  "system",
  "security",
]

const DEFAULT_AI_CHART = {
  enabled: true,
  cooldownSeconds: 120,
  modelId: "",
}
const DEFAULT_PRE = {
  enabled: false,
  mode: "warn",
  runQuickBacktest: true,
  candleCount: 180,
  timeframe: "H1",
  minTrades: 10,
  minWinRate: 40,
  minExpectancy: 0,
  maxDrawdownPercent: 25,
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState(null)
  const [aiChart, setAiChart] = useState(DEFAULT_AI_CHART)
  const [preSignal, setPreSignal] = useState(DEFAULT_PRE)
  const [audit, setAudit] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const [p, a, pref] = await Promise.all([
        notificationsApi.preferences(),
        notificationsApi.audit({ limit: 40 }),
        authApi.getPreferences().catch(() => ({ preferences: {} })),
      ])
      setPrefs(p.preferences)
      setAudit(a.logs || [])
      setPreSignal({
        ...DEFAULT_PRE,
        ...(pref.preferences?.preSignalValidation || {}),
      })
      setAiChart({
        ...DEFAULT_AI_CHART,
        ...(pref.preferences?.aiChartAssist || {}),
      })
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load settings"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const data = await notificationsApi.savePreferences(prefs)
      setPrefs(data.preferences)
      setSuccess("Notification preferences saved")
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const savePreSignal = async () => {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const data = await authApi.savePreferences({ preSignalValidation: preSignal, aiChartAssist: aiChart })
      setPreSignal({
        ...DEFAULT_PRE,
        ...(data.preferences?.preSignalValidation || preSignal),
      })
      setSuccess(data.message || "Pre-signal preferences saved")
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save pre-signal settings")
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
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="h-7 w-7 text-brand-cyan" />
            Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Notifications · pre-signal validation · audit trail
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
          <CardTitle>AI chart assist</CardTitle>
          <CardDescription>
            On-demand annotation on the Charts page always uses a selected strategy (rules + plotted levels).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Enable for my account</span>
            <ToggleSwitch
              checked={Boolean(aiChart.enabled)}
              onChange={(v) => setAiChart((c) => ({ ...c, enabled: v }))}
            />
          </div>
          <p className="text-xs text-slate-500">
            Open Charts → select strategy → AI annotate. Results are cached; admin sets hourly limits.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-gold" />
            Pre-signal validation
          </CardTitle>
          <CardDescription>
            Optional quick backtest and metric gates before a signal is accepted. Admin can force
            this globally; your settings apply when global is off or as additional preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Enable for my account</span>
            <ToggleSwitch
              checked={Boolean(preSignal.enabled)}
              onChange={(v) => setPreSignal((c) => ({ ...c, enabled: v }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Mode</Label>
            <select
              value={preSignal.mode}
              onChange={(e) => setPreSignal((c) => ({ ...c, mode: e.target.value }))}
              className="flex h-10 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-3 text-sm text-brand-silver"
            >
              <option value="warn">Warn only (still allow signal)</option>
              <option value="block">Block failing signals</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Run quick backtest</span>
            <ToggleSwitch
              checked={Boolean(preSignal.runQuickBacktest)}
              onChange={(v) => setPreSignal((c) => ({ ...c, runQuickBacktest: v }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["candleCount", "Backtest candles"],
              ["minTrades", "Min trades"],
              ["minWinRate", "Min win rate %"],
              ["minExpectancy", "Min expectancy"],
              ["maxDrawdownPercent", "Max DD %"],
            ].map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  type="number"
                  value={preSignal[key]}
                  onChange={(e) =>
                    setPreSignal((c) => ({
                      ...c,
                      [key]: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label>Timeframe</Label>
              <select
                value={preSignal.timeframe}
                onChange={(e) => setPreSignal((c) => ({ ...c, timeframe: e.target.value }))}
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
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save validation & AI chart prefs
          </Button>
        </CardContent>
      </Card>

      {prefs && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-brand-cyan" />
                Notification channels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">In-app</span>
                <ToggleSwitch
                  checked={prefs.inApp !== false}
                  onChange={(v) => setPrefs((p) => ({ ...p, inApp: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Email</span>
                <ToggleSwitch
                  checked={!!prefs.email}
                  onChange={(v) => setPrefs((p) => ({ ...p, email: v }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Telegram chat ID</Label>
                <Input
                  value={prefs.telegramChatId || ""}
                  onChange={(e) => setPrefs((p) => ({ ...p, telegramChatId: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Discord webhook URL</Label>
                <Input
                  value={prefs.discordWebhookUrl || ""}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, discordWebhookUrl: e.target.value }))
                  }
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event types</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {EVENT_KEYS.map((k) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-4 text-sm text-slate-300"
                >
                  <span>{k}</span>
                  <ToggleSwitch
                    checked={prefs.events?.[k] !== false}
                    onChange={(v) =>
                      setPrefs((p) => ({
                        ...p,
                        events: { ...p.events, [k]: v },
                      }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save notification preferences
          </Button>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-brand-cyan" />
            Your audit trail
          </CardTitle>
          <CardDescription>
            Includes pre-signal pass / warn / block events when validation is enabled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 max-h-80 overflow-y-auto">
          {!audit.length ? (
            <p className="text-sm text-slate-500">No audit entries yet</p>
          ) : (
            audit.map((log) => (
              <div
                key={log._id}
                className="rounded-lg border border-brand-slate/40 px-3 py-2 text-sm"
              >
                <p className="text-white">{log.summary}</p>
                <p className="text-xs text-slate-500">
                  {log.action} · {new Date(log.createdAt).toLocaleString()}
                  {log.success === false ? " · failed" : ""}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
