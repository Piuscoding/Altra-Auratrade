import { useEffect, useState } from "react"
import { Settings, Loader2, Save, Bell, ScrollText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { notificationsApi } from "@/api/notifications"

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

export default function SettingsPage() {
  const [prefs, setPrefs] = useState(null)
  const [audit, setAudit] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const [p, a] = await Promise.all([
        notificationsApi.preferences(),
        notificationsApi.audit({ limit: 40 }),
      ])
      setPrefs(p.preferences)
      setAudit(a.logs || [])
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load settings")
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
      setSuccess("Preferences saved")
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const test = async (channel) => {
    setSaving(true)
    setError("")
    try {
      await notificationsApi.test(channel)
      setSuccess(`Test notification sent (${channel})`)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Test failed")
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
            Notifications · Telegram · Discord · Email · Audit trail
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

      {prefs && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-brand-gold" />
                Channels
              </CardTitle>
              <CardDescription>
                In-app is always recommended. Email uses Zoho SMTP. Telegram needs bot token on
                server + your chat id. Discord uses an incoming webhook URL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["inApp", "In-app notifications"],
                ["email", "Email (Zoho)"],
                ["telegram", "Telegram"],
                ["discord", "Discord webhook"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(prefs[key])}
                    onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                  />
                  {label}
                </label>
              ))}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Telegram chat id</Label>
                  <Input
                    value={prefs.telegramChatId || ""}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, telegramChatId: e.target.value }))
                    }
                    placeholder="123456789"
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event types</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {EVENT_KEYS.map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={prefs.events?.[k] !== false}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        events: { ...p.events, [k]: e.target.checked },
                      }))
                    }
                  />
                  {k}
                </label>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save preferences
            </Button>
            <Button variant="outline" disabled={saving} onClick={() => test("inApp")}>
              Test in-app
            </Button>
            <Button variant="outline" disabled={saving} onClick={() => test("email")}>
              Test email path
            </Button>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-brand-cyan" />
            Your audit trail
          </CardTitle>
          <CardDescription>Recent actions recorded for this account</CardDescription>
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
