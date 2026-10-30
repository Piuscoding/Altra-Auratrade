import { useEffect, useState } from "react"
import { Users, Loader2, Ban, CheckCircle2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { adminApi } from "@/api/admin"

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [blockReason, setBlockReason] = useState({})

  const load = async (query) => {
    setLoading(true)
    setError("")
    try {
      const data = await adminApi.users(query)
      setUsers(data.users || [])
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const block = async (id) => {
    const reason = (blockReason[id] || "").trim()
    if (!reason) {
      setError("Enter a block reason")
      return
    }
    setBusyId(id)
    setError("")
    try {
      const data = await adminApi.blockUser(id, reason)
      setSuccess(data.message)
      await load(q)
    } catch (err) {
      setError(err?.response?.data?.message || "Block failed")
    } finally {
      setBusyId(null)
    }
  }

  const unblock = async (id) => {
    setBusyId(id)
    setError("")
    try {
      const data = await adminApi.unblockUser(id, "Unblocked by admin")
      setSuccess(data.message)
      await load(q)
    } catch (err) {
      setError(err?.response?.data?.message || "Unblock failed")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-7 w-7 text-brand-gold" />
            Users
          </h1>
          <p className="text-sm text-slate-400 mt-1">Block / unblock with reason · per-user model later</p>
        </div>
        <MarketStatusBadge />
      </div>

      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email or name"
        />
        <Button variant="outline" onClick={() => load(q)}>
          <Search className="h-4 w-4" />
          Search
        </Button>
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

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u._id}>
              <CardContent className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">
                    {u.firstName} {u.lastName}{" "}
                    <span className="text-slate-500 text-sm">({u.role})</span>
                  </p>
                  <p className="text-sm text-slate-400">{u.email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Model: {u.modelPreference || "default free"} ·{" "}
                    {u.isBlocked ? (
                      <span className="text-red-400">Blocked</span>
                    ) : (
                      <span className="text-emerald-400">Active</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                  {!u.isBlocked && u.role !== "admin" && u.role !== "owner" && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Block reason</Label>
                        <Input
                          value={blockReason[u._id] || ""}
                          onChange={(e) =>
                            setBlockReason((m) => ({ ...m, [u._id]: e.target.value }))
                          }
                          placeholder="Required reason"
                          className="min-w-[200px]"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busyId === u._id}
                        onClick={() => block(u._id)}
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Block
                      </Button>
                    </>
                  )}
                  {u.isBlocked && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busyId === u._id}
                      onClick={() => unblock(u._id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Unblock
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
