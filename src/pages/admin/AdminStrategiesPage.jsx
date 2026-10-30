import { useEffect, useState } from "react"
import { BrainCircuit, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { adminApi } from "@/api/admin"

export default function AdminStrategiesPage() {
  const [strategies, setStrategies] = useState([])
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await adminApi.strategies(status || undefined)
      setStrategies(data.strategies || [])
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status])

  const remove = async (id) => {
    if (!confirm("Permanently delete this strategy? This cannot be undone. Users can only disable.")) {
      return
    }
    setBusyId(id)
    setError("")
    try {
      const data = await adminApi.deleteStrategy(id)
      setSuccess(data.message)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Delete failed")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-brand-gold" />
            All strategies
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Admin-only permanent delete · users may only disable
          </p>
        </div>
        <MarketStatusBadge />
      </div>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="flex h-10 rounded-lg border border-brand-slate bg-brand-navy-light/80 px-3 text-sm text-brand-silver"
      >
        <option value="">All statuses</option>
        {["draft", "review", "approved", "demo", "live", "disabled", "archived"].map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

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

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
        </div>
      ) : (
        <div className="space-y-3">
          {strategies.map((s) => (
            <Card key={s._id}>
              <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">
                    {s.name}{" "}
                    <span className="text-xs text-slate-500">({s.status})</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {s.userId?.email || "user"} · {s.sourceType} · conf {s.overallConfidence || 0}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busyId === s._id}
                  onClick={() => remove(s._id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
          {strategies.length === 0 && (
            <p className="text-sm text-slate-500">No strategies found</p>
          )}
        </div>
      )}
    </div>
  )
}
