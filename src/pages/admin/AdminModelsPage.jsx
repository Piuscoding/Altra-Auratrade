import { useEffect, useState } from "react"
import { Loader2, Plus, Bot, Star, UserCog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { visionApi } from "@/api/vision"
import { adminApi } from "@/api/admin"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"

export default function AdminModelsPage() {
  const [settings, setSettings] = useState(null)
  const [users, setUsers] = useState([])
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
  const [userModelMap, setUserModelMap] = useState({})
  const [userSearch, setUserSearch] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const [s, u] = await Promise.all([
        visionApi.adminSettings(),
        adminApi.users(),
      ])
      setSettings(s.settings)
      setUsers(u.users || [])
      const map = {}
      ;(u.users || []).forEach((user) => {
        map[user._id] = user.modelPreference || ""
      })
      // overlay perUserModelUsage
      ;(s.settings?.perUserModelUsage || []).forEach((p) => {
        if (p.userId) map[String(p.userId)] = p.modelPreference
      })
      setUserModelMap(map)
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

  const setDefaultFree = async (modelId) => {
    setSaving(true)
    setError("")
    try {
      await adminApi.updateDefaultModels({ defaultFreeModelId: modelId })
      setSettings((s) => ({ ...s, defaultFreeModelId: modelId }))
      setSuccess(`Default free model set to ${modelId}`)
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to set default free model")
    } finally {
      setSaving(false)
    }
  }

  const setDefaultPaid = async (modelId) => {
    setSaving(true)
    setError("")
    try {
      await adminApi.updateDefaultModels({ defaultPaidModelId: modelId })
      setSettings((s) => ({ ...s, defaultPaidModelId: modelId }))
      setSuccess(`Default paid model set to ${modelId}`)
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to set default paid model")
    } finally {
      setSaving(false)
    }
  }

  const assignUserModel = async (userId) => {
    const modelId = userModelMap[userId]
    if (!modelId) {
      setError("Select a model for this user")
      return
    }
    setSaving(true)
    setError("")
    try {
      const data = await adminApi.setUserModel(userId, modelId)
      setSuccess(data.message || "User model preference updated")
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Assign failed")
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

  const allModelOptions = [
    ...(settings?.freeModels || []).map((m) => ({ ...m, tier: "free" })),
    ...(settings?.modelSwitching?.paidModelsEnabled
      ? (settings?.paidModels || []).map((m) => ({ ...m, tier: "paid" }))
      : []),
  ]

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true
    const q = userSearch.toLowerCase()
    return (
      u.email?.toLowerCase().includes(q) ||
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="h-7 w-7 text-brand-gold" />
            AI Models
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            OpenRouter only · set global defaults · assign models per user
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
            Paid models stay off until enabled globally. Platform default for new analyses without a
            user override is the default free model.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-slate-300">
            Paid models:{" "}
            <strong>
              {settings?.modelSwitching?.paidModelsEnabled ? "Enabled" : "Disabled"}
            </strong>
          </p>
          <ToggleSwitch
            checked={Boolean(settings?.modelSwitching?.paidModelsEnabled)}
            onChange={() => togglePaid()}
            disabled={saving}
            label="Paid models enabled"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Free models</CardTitle>
            <CardDescription>
              Default free:{" "}
              <span className="text-brand-cyan">
                {settings?.defaultFreeModelId || "qwen/qwen3-vl-7b"}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(settings?.freeModels || []).map((m) => {
              const isDefault = settings?.defaultFreeModelId === m.id
              return (
                <div
                  key={m.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    isDefault ? "border-brand-cyan/50 bg-brand-cyan/10" : "border-brand-slate/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white flex items-center gap-1">
                        {m.name}
                        {isDefault && <Star className="h-3.5 w-3.5 text-brand-gold fill-brand-gold" />}
                      </p>
                      <p className="text-xs text-slate-500">{m.id}</p>
                      {m.description && (
                        <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isDefault ? "secondary" : "outline"}
                      disabled={saving || isDefault}
                      onClick={() => setDefaultFree(m.id)}
                    >
                      {isDefault ? "Default" : "Make default"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paid models</CardTitle>
            <CardDescription>
              Default paid:{" "}
              <span className="text-brand-gold">
                {settings?.defaultPaidModelId || "—"}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(settings?.paidModels || []).map((m) => {
              const isDefault = settings?.defaultPaidModelId === m.id
              return (
                <div
                  key={m.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    isDefault ? "border-brand-gold/50 bg-brand-gold/10" : "border-brand-slate/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white flex items-center gap-1">
                        {m.name}
                        {isDefault && <Star className="h-3.5 w-3.5 text-brand-gold fill-brand-gold" />}
                      </p>
                      <p className="text-xs text-slate-500">{m.id}</p>
                      {m.description && (
                        <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isDefault ? "secondary" : "outline"}
                      disabled={saving || isDefault}
                      onClick={() => setDefaultPaid(m.id)}
                    >
                      {isDefault ? "Default" : "Make default"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-brand-cyan" />
            Per-user model assignment
          </CardTitle>
          <CardDescription>
            Override the global free default for a specific account (free or paid if paid enabled).
            Changes apply to new strategy analyses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search users by email or name"
          />
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredUsers.map((u) => (
              <div
                key={u._id}
                className="flex flex-col sm:flex-row sm:items-end gap-2 rounded-lg border border-brand-slate/50 px-3 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">
                    {u.firstName} {u.lastName}{" "}
                    <span className="text-slate-500 text-xs">({u.role})</span>
                  </p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Current: {u.modelPreference || settings?.defaultFreeModelId || "platform free default"}
                  </p>
                </div>
                <select
                  value={userModelMap[u._id] || ""}
                  onChange={(e) =>
                    setUserModelMap((m) => ({ ...m, [u._id]: e.target.value }))
                  }
                  className="flex h-10 rounded-lg border border-brand-slate bg-brand-navy-light/80 px-3 text-sm text-brand-silver min-w-[200px]"
                >
                  <option value="">Select model</option>
                  {allModelOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.tier}] {m.name}
                    </option>
                  ))}
                </select>
                <Button size="sm" disabled={saving} onClick={() => assignUserModel(u._id)}>
                  Assign
                </Button>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-sm text-slate-500">No users found</p>
            )}
          </div>
        </CardContent>
      </Card>

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
