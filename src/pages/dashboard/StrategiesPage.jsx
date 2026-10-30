import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  BrainCircuit,
  Plus,
  Loader2,
  Ban,
  CheckCircle2,
  Pencil,
  Video,
  Image,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { strategiesApi } from "@/api/strategies"
import api from "@/api/client"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"

const SOURCE_LABELS = {
  visual_steps: "Step-by-Step Visual",
  hybrid: "Hybrid",
  video: "Video-Only",
  manual: "Manual",
}

const STATUS_STYLES = {
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  review: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  demo: "bg-sky-500/20 text-sky-300 border-sky-500/40",
  live: "bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40",
  disabled: "bg-red-500/20 text-red-300 border-red-500/40",
  archived: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40",
}

export default function StrategiesPage() {
  const navigate = useNavigate()
  const [strategies, setStrategies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [sourceType, setSourceType] = useState("visual_steps")
  const [creating, setCreating] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [featureToggles, setFeatureToggles] = useState({
    strategyUploadStepByStep: true,
    video: true,
    hybrid: true,
    manual: true,
  })

  useEffect(() => {
    api
      .get("/strategies/meta/feature-toggles")
      .then((r) => {
        if (r.data?.globalFeatureToggles) setFeatureToggles(r.data.globalFeatureToggles)
      })
      .catch(() => {})
  }, [])

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await strategiesApi.list()
      setStrategies(data.strategies || [])
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load strategies")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError("")
    try {
      const data = await strategiesApi.create({ name: name.trim(), sourceType })
      setShowCreate(false)
      setName("")
      setSourceType("visual_steps")
      navigate(`/dashboard/strategies/${data.strategy._id}`)
    } catch (err) {
      setError(err?.response?.data?.message || "Create failed")
    } finally {
      setCreating(false)
    }
  }

  const handleDisable = async (id) => {
    setActionId(id)
    try {
      await strategiesApi.disable(id)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Disable failed")
    } finally {
      setActionId(null)
    }
  }

  const handleEnable = async (id) => {
    setActionId(id)
    try {
      await strategiesApi.enable(id)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Enable failed")
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-brand-cyan" />
            Strategy Creation
          </h1>
          <p className="mt-1 text-slate-400">
            4-step guided builder · Visual · Hybrid · Video-Only
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MarketStatusBadge />
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New Strategy
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {showCreate && (
        <Card className="border-brand-cyan/30">
          <CardHeader>
            <CardTitle>Create strategy draft</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Strategy name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. London BOS Order Block"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Build method</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      id: "visual_steps",
                      title: "Step-by-Step Visual",
                      desc: "4 steps · 1–3 images each · no video",
                      icon: Image,
                      enabled: featureToggles.strategyUploadStepByStep !== false,
                    },
                    {
                      id: "hybrid",
                      title: "Hybrid",
                      desc: "4 steps · max 3 images/step · video ≤ 8 min",
                      icon: Layers,
                      enabled: featureToggles.hybrid !== false,
                    },
                    {
                      id: "video",
                      title: "Video-Only",
                      desc: "4 steps · AI key frames · video ≤ 12 min",
                      icon: Video,
                      enabled: featureToggles.video !== false,
                    },
                  ]
                    .filter((m) => m.enabled)
                    .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSourceType(m.id)}
                      className={`text-left rounded-xl border p-4 transition-all ${
                        sourceType === m.id
                          ? "border-brand-cyan bg-brand-cyan/10"
                          : "border-brand-slate/50 hover:border-brand-slate"
                      }`}
                    >
                      <m.icon className="h-5 w-5 text-brand-cyan mb-2" />
                      <p className="font-semibold text-white text-sm">{m.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Continue to builder"
                  )}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
        </div>
      ) : strategies.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-400">
            <BrainCircuit className="h-12 w-12 mx-auto mb-4 text-brand-slate" />
            <p>No strategies yet. Create your first 4-step strategy.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {strategies.map((s) => (
            <Card key={s._id} className="hover:border-brand-slate transition-colors">
              <CardContent className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{s.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        STATUS_STYLES[s.status] || STATUS_STYLES.draft
                      }`}
                    >
                      {s.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      {SOURCE_LABELS[s.sourceType] || s.sourceType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    v{s.version} · Updated {new Date(s.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.status !== "disabled" && s.status !== "archived" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/dashboard/strategies/${s._id}`)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Open builder
                    </Button>
                  )}
                  {(s.status === "review" || s.status === "approved" || s.overallConfidence > 0) && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/dashboard/strategies/${s._id}/review`)}
                    >
                      Analysis & Review
                    </Button>
                  )}
                  {s.status === "disabled" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actionId === s._id}
                      onClick={() => handleEnable(s._id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Enable
                    </Button>
                  ) : s.status !== "archived" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={actionId === s._id}
                      onClick={() => handleDisable(s._id)}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Disable
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-600">
        Users can disable strategies but cannot delete them. Only Admin can permanently delete.
        One active strategy per broker account is enforced when accounts are assigned (Phase 6).
      </p>
    </div>
  )
}
