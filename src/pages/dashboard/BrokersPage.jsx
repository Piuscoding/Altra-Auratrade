import { useEffect, useState } from "react"
import {
  Link2,
  Loader2,
  Plus,
  Unplug,
  Plug,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { brokersApi } from "@/api/brokers"
import { strategiesApi } from "@/api/strategies"

const STATUS_CLASS = {
  connected: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  live: "text-brand-cyan border-brand-cyan/40 bg-brand-cyan/10",
  testing: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  disconnected: "text-slate-400 border-slate-500/40 bg-slate-500/10",
}

export default function BrokersPage() {
  const [accounts, setAccounts] = useState([])
  const [strategies, setStrategies] = useState([])
  const [metaApiConfigured, setMetaApiConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: "",
    type: "demo",
    provider: "metaapi",
    login: "",
    password: "",
    server: "",
    platform: "mt5",
    oandaAccountId: "",
    oandaToken: "",
    ibkrAccountId: "",
    ibkrToken: "",
    balance: "10000",
  })
  const [assignMap, setAssignMap] = useState({})

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const [b, s] = await Promise.all([brokersApi.list(), strategiesApi.list()])
      setAccounts(b.accounts || [])
      setMetaApiConfigured(Boolean(b.metaApiConfigured))
      const ok = (s.strategies || []).filter((x) =>
        ["approved", "demo", "live"].includes(x.status)
      )
      setStrategies(ok)
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load brokers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError("")
    setSuccess("")
    try {
      const payload = {
        ...form,
        balance: Number(form.balance) || 10000,
      }
      const data = await brokersApi.create(payload)
      setSuccess(
        data.connection?.message ||
          `Account created (${data.account?.status})`
      )
      setShowForm(false)
      setForm({
        name: "",
        type: "demo",
        provider: "metaapi",
        login: "",
        password: "",
        server: "",
        platform: "mt5",
        oandaAccountId: "",
        oandaToken: "",
        ibkrAccountId: "",
    ibkrToken: "",
        balance: "10000",
      })
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Create failed")
    } finally {
      setBusy(false)
    }
  }

  const toggleConnect = async (acc) => {
    setBusy(true)
    setError("")
    try {
      if (acc.status === "disconnected") {
        await brokersApi.connect(acc._id)
        setSuccess("Connected")
      } else {
        await brokersApi.disconnect(acc._id)
        setSuccess("Disconnected")
      }
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Connection change failed")
    } finally {
      setBusy(false)
    }
  }

  const assign = async (accountId) => {
    const strategyId = assignMap[accountId]
    if (!strategyId) {
      setError("Select a strategy first")
      return
    }
    setBusy(true)
    setError("")
    try {
      const data = await brokersApi.assignStrategy(accountId, strategyId)
      setSuccess(data.message)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Assign failed")
    } finally {
      setBusy(false)
    }
  }

  const unassign = async (accountId) => {
    setBusy(true)
    try {
      const data = await brokersApi.unassignStrategy(accountId)
      setSuccess(data.message)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Unassign failed")
    } finally {
      setBusy(false)
    }
  }

  const sync = async (id) => {
    setBusy(true)
    try {
      const data = await brokersApi.sync(id)
      setSuccess(data.message)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Sync failed")
    } finally {
      setBusy(false)
    }
  }

  const toggleNews = async (acc) => {
    setBusy(true)
    try {
      await brokersApi.updateSettings(acc._id, {
        isNewsFilterEnabled: !acc.isNewsFilterEnabled,
      })
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Update failed")
    } finally {
      setBusy(false)
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Link2 className="h-7 w-7 text-brand-cyan" />
            Broker Connections
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            MetaApi · OANDA · IBKR · one strategy per account
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MarketStatusBadge />
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add account
          </Button>
        </div>
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

      {showForm && (
        <Card className="border-brand-cyan/30">
          <CardHeader>
            <CardTitle>Connect broker account</CardTitle>
            <CardDescription>
              Passwords are encrypted at rest. Full secrets are never returned to the browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Display name</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="My FTMO Demo"
                />
              </div>
              <div className="space-y-2">
                <Label>Account type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
                >
                  <option value="demo">Demo</option>
                  <option value="live">Live</option>
                  <option value="prop_firm">Prop firm</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                  className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
                >
                  <option value="metaapi">MetaApi (MT4/MT5)</option>
                  <option value="oanda">OANDA</option>
                  <option value="ibkr">Interactive Brokers</option>
                  <option value="others">Other</option>
                </select>
              </div>
              {form.type === "demo" && (
              <div className="space-y-2">
                <Label>Starting balance (demo only)</Label>
                <Input
                  type="number"
                  value={form.balance}
                  onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
                />
              </div>
              )}
              {form.type !== "demo" && (
                <p className="text-xs text-slate-500 sm:col-span-2">
                  Live / prop balance is pulled automatically after a successful broker connection and Sync.
                </p>
              )}

              {form.provider === "metaapi" && (
                <>
                  <div className="space-y-2">
                    <Label>MT login</Label>
                    <Input
                      required
                      value={form.login}
                      onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Server</Label>
                    <Input
                      required
                      value={form.server}
                      onChange={(e) => setForm((f) => ({ ...f, server: e.target.value }))}
                      placeholder="ICMarketsSC-Demo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <select
                      value={form.platform}
                      onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                      className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
                    >
                      <option value="mt5">MT5</option>
                      <option value="mt4">MT4</option>
                    </select>
                  </div>
                </>
              )}

              {form.provider === "oanda" && (
                <>
                  <div className="space-y-2">
                    <Label>OANDA account id</Label>
                    <Input
                      required
                      value={form.oandaAccountId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, oandaAccountId: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>OANDA API token</Label>
                    <Input
                      type="password"
                      required
                      value={form.oandaToken}
                      onChange={(e) => setForm((f) => ({ ...f, oandaToken: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {form.provider === "ibkr" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>IBKR account id</Label>
                  <Input
                    required
                    value={form.ibkrAccountId}
                    onChange={(e) => setForm((f) => ({ ...f, ibkrAccountId: e.target.value }))}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Requires IBKR Client Portal Gateway (IBKR_GATEWAY_URL). Optional session token field: ibkrToken in payload.
                  </p>
                </div>
              )}

              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
                  Connect
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            No broker accounts yet. Add a MetaApi, OANDA, or IBKR account to start.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((acc) => (
            <Card key={acc._id}>
              <CardContent className="py-5 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{acc.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          STATUS_CLASS[acc.status] || STATUS_CLASS.disconnected
                        }`}
                      >
                        {acc.status}
                      </span>
                      <span className="text-xs text-slate-500 uppercase">{acc.provider}</span>
                      <span className="text-xs text-slate-500">{acc.type}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      Balance: {acc.balance} · Equity: {acc.equity}
                      {acc.credentials?.loginHint
                        ? ` · Login ${acc.credentials.loginHint}`
                        : ""}
                      {acc.credentials?.serverHint
                        ? ` · ${acc.credentials.serverHint}`
                        : ""}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Strategy:{" "}
                      {acc.assignedStrategy
                        ? typeof acc.assignedStrategy === "object"
                          ? acc.assignedStrategy.name
                          : acc.assignedStrategy
                        : "None (required for live routing)"}
                      {" · "}
                      News filter: {acc.isNewsFilterEnabled ? "ON" : "OFF"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => toggleConnect(acc)}
                    >
                      {acc.status === "disconnected" ? (
                        <>
                          <Plug className="h-3.5 w-3.5" /> Connect
                        </>
                      ) : (
                        <>
                          <Unplug className="h-3.5 w-3.5" /> Disconnect
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => sync(acc._id)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Sync
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => toggleNews(acc)}
                    >
                      News {acc.isNewsFilterEnabled ? "ON" : "OFF"}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end border-t border-brand-slate/40 pt-4">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Assign strategy (one per account)</Label>
                    <select
                      value={assignMap[acc._id] || ""}
                      onChange={(e) =>
                        setAssignMap((m) => ({ ...m, [acc._id]: e.target.value }))
                      }
                      className="flex h-10 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-3 text-sm text-brand-silver"
                    >
                      <option value="">Select approved strategy</option>
                      {strategies.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    size="sm"
                    disabled={busy || acc.status === "disconnected"}
                    onClick={() => assign(acc._id)}
                  >
                    Assign
                  </Button>
                  {acc.assignedStrategy && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => unassign(acc._id)}
                    >
                      Unassign
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
