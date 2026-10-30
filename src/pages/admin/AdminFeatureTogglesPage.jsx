import { useEffect, useState } from "react"
import { Settings2, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { adminApi } from "@/api/admin"

const TOGGLE_META = [
  { key: "strategyUploadStepByStep", label: "Step-by-step visual upload", desc: "4 steps · 1–3 images" },
  { key: "video", label: "Video-only upload", desc: "Up to ~12 min tutorials" },
  { key: "hybrid", label: "Hybrid upload", desc: "Video + images per step" },
  { key: "manual", label: "Manual strategy entry", desc: "Rules without vision assets" },
  { key: "newsFilter", label: "News filter engine", desc: "Block signals near high-impact events" },
  { key: "riskAdjustment", label: "Risk adjustment engine", desc: "Global allow (still default OFF per strategy)" },
  { key: "profitLock50", label: "Profit lock 50%", desc: "Allow profit-lock feature globally" },
  { key: "sessionConstraints", label: "Session constraints", desc: "Session / day / frequency gates" },
]

export default function AdminFeatureTogglesPage() {
  const [toggles, setToggles] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const data = await adminApi.settings()
        setToggles({ ...(data.settings?.globalFeatureToggles || {}) })
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

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
            <label
              key={t.key}
              className="flex items-start gap-3 rounded-lg border border-brand-slate/50 px-4 py-3 cursor-pointer hover:border-brand-slate"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(toggles?.[t.key])}
                onChange={(e) =>
                  setToggles((prev) => ({ ...prev, [t.key]: e.target.checked }))
                }
              />
              <span>
                <span className="block text-sm font-medium text-white">{t.label}</span>
                <span className="block text-xs text-slate-500">{t.desc}</span>
              </span>
            </label>
          ))}
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save toggles
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
