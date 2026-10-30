import { useEffect, useState } from "react"
import { Loader2, Plus, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { visionApi } from "@/api/vision"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"

export default function AdminModelsPage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({
    tier: "free",
    name: "",
    id: "",
    description: "",
  })

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await visionApi.adminSettings()
      setSettings(data.settings)
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const togglePaid = async () => {
    setSaving(true)
    setError("")
    try {
      const data = await visionApi.updateAdminSettings({
        modelSwitching: {
          freeModelsEnabled: true,
          paidModelsEnabled: !settings.modelSwitching?.paidModelsEnabled,
        },
      })
      setSettings(data.settings)
      setSuccess("Model switching updated")
    } catch (err) {
      setError(err?.response?.data?.message || "Update failed")
    } finally {
      setSaving(false)
    }
  }

  const addModel = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const data = await visionApi.addModel(form)
      setSettings(data.settings)
      setForm({ tier: "free", name: "", id: "", description: "" })
      setSuccess("Model added — available for new analyses immediately")
    } catch (err) {
      setError(err?.response?.data?.message || "Add failed")
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
            <Bot className="h-7 w-7 text-brand-gold" />
            AI Models
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            OpenRouter only · free models default · one model per task
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
          <CardTitle>Model switching</CardTitle>
          <CardDescription>
            Paid models stay off until you enable them globally. Users keep free defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-slate-300">
            Paid models:{" "}
            <strong>
              {settings?.modelSwitching?.paidModelsEnabled ? "Enabled" : "Disabled"}
            </strong>
          </p>
          <Button variant="outline" disabled={saving} onClick={togglePaid}>
            {settings?.modelSwitching?.paidModelsEnabled ? "Disable paid models" : "Enable paid models"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Free models</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(settings?.freeModels || []).map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-brand-slate/50 px-3 py-2 text-sm"
              >
                <p className="font-medium text-white">{m.name}</p>
                <p className="text-xs text-slate-500">{m.id}</p>
                {m.description && (
                  <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paid models</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(settings?.paidModels || []).map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-brand-slate/50 px-3 py-2 text-sm"
              >
                <p className="font-medium text-white">{m.name}</p>
                <p className="text-xs text-slate-500">{m.id}</p>
                {m.description && (
                  <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add model (~10 seconds)</CardTitle>
          <CardDescription>
            New OpenRouter model ids become available for new strategy analyses immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addModel} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tier</Label>
              <select
                value={form.tier}
                onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
                className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="Qwen3-VL 72B"
              />
            </div>
            <div className="space-y-2">
              <Label>OpenRouter model id</Label>
              <Input
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                required
                placeholder="qwen/qwen3-vl-72b"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Best for ..."
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add model
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
