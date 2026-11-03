import { useEffect, useState } from "react"
import { Shield, Loader2, RefreshCw, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { propApi } from "@/api/prop"
import { brokersApi } from "@/api/brokers"

export default function PropChallengePage() {
  const [challenges, setChallenges] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({
    brokerAccountId: "",
    name: "",
    firmName: "",
    startingBalance: "10000",
    phase: "challenge",
    maxDailyDDPercent: 5,
    maxOverallDDPercent: 10,
    profitTargetPercent: 8,
    maxOpenRiskPercent: 2,
    maxConsecutiveLosses: 3,
    maxTradesPerDay: 10,
    maxDayProfitSharePercent: 40,
    minTradingDays: 5,
    timezone: "America/New_York",
  })

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const [c, b] = await Promise.all([propApi.list(), brokersApi.list()])
      setChallenges(c.challenges || [])
      const propAccounts = (b.accounts || []).filter((a) => a.type === "prop_firm")
      setAccounts(propAccounts)
      if (!form.brokerAccountId && propAccounts[0]) {
        setForm((f) => ({ ...f, brokerAccountId: propAccounts[0]._id }))
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load challenges")
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
      const data = await propApi.create({
        brokerAccountId: form.brokerAccountId,
        name: form.name || undefined,
        firmName: form.firmName,
        startingBalance: Number(form.startingBalance),
        phase: form.phase,
        timezone: form.timezone,
        rules: {
          maxDailyDDPercent: Number(form.maxDailyDDPercent),
          maxOverallDDPercent: Number(form.maxOverallDDPercent),
          profitTargetPercent: Number(form.profitTargetPercent),
          maxOpenRiskPercent: Number(form.maxOpenRiskPercent),
          maxConsecutiveLosses: Number(form.maxConsecutiveLosses),
          maxTradesPerDay: Number(form.maxTradesPerDay),
          maxDayProfitSharePercent: Number(form.maxDayProfitSharePercent),
          minTradingDays: Number(form.minTradingDays),
        },
      })
      setSuccess(`Created ${data.challenge.name}`)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Create failed")
    } finally {
      setBusy(false)
    }
  }

  const refresh = async (id) => {
    try {
      await propApi.refresh(id)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Refresh failed")
    }
  }

  const setPhase = async (id, phase) => {
    try {
      await propApi.update(id, { phase })
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Update failed")
    }
  }

  const pauseChallenge = async (id) => {
    try {
      await propApi.pause(id, "Paused by user")
      setSuccess("Challenge paused — signals for this account stay blocked from prop gates until resume")
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Pause failed")
    }
  }

  const resumeChallenge = async (id) => {
    try {
      await propApi.resume(id)
      setSuccess("Challenge resumed")
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Resume failed")
    }
  }

  const failChallenge = async (id) => {
    const reason = window.prompt("Fail reason", "Manual fail")
    if (!reason) return
    try {
      await propApi.fail(id, reason)
      setSuccess("Challenge marked failed")
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Fail failed")
    }
  }

  const equityPath = (curve = []) => {
    if (!curve.length) return ""
    const vals = curve.map((p) => Number(p.equity) || 0)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const span = max - min || 1
    const w = 280
    const h = 56
    return curve
      .map((p, i) => {
        const x = (i / Math.max(1, curve.length - 1)) * w
        const y = h - ((Number(p.equity) - min) / span) * (h - 4) - 2
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(" ")
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
            <Shield className="h-7 w-7 text-teal-400" />
            Prop Firm Challenges
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Daily / overall DD, consistency, phase tracking — gates apply to signals automatically
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
          <CardTitle>How prop gates work</CardTitle>
          <CardDescription>
            Create a challenge on a broker account typed as prop_firm. While status is active,
            new signals on that account are blocked if daily DD, overall DD, consecutive losses,
            trades/day, or open risk limits would be violated. Closed trades update equity and can
            auto-advance challenge → verification → funded when profit target, min trading days,
            and consistency rules are met. Daily DD resets in the firm timezone you set.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> New challenge
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!accounts.length ? (
            <p className="text-sm text-slate-500">
              Add a broker account with type <strong>Prop firm</strong> first (Brokers page).
            </p>
          ) : (
            <form onSubmit={create} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <Label>Prop broker account</Label>
                <select
                  value={form.brokerAccountId}
                  onChange={(e) => setForm((f) => ({ ...f, brokerAccountId: e.target.value }))}
                  className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
                  required
                >
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} · bal {a.balance}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="FTMO 100k Challenge"
                />
              </div>
              <div className="space-y-1">
                <Label>Firm</Label>
                <Input
                  value={form.firmName}
                  onChange={(e) => setForm((f) => ({ ...f, firmName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Starting balance</Label>
                <Input
                  type="number"
                  value={form.startingBalance}
                  onChange={(e) => setForm((f) => ({ ...f, startingBalance: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Phase</Label>
                <select
                  value={form.phase}
                  onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value }))}
                  className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
                >
                  <option value="challenge">Challenge</option>
                  <option value="verification">Verification</option>
                  <option value="funded">Funded</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Firm timezone (daily reset)</Label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                  className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
                >
                  {[
                    "UTC",
                    "America/New_York",
                    "America/Chicago",
                    "Europe/London",
                    "Europe/Berlin",
                    "Asia/Tokyo",
                  ].map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
              {[
                ["maxDailyDDPercent", "Max daily DD %"],
                ["maxOverallDDPercent", "Max overall DD %"],
                ["profitTargetPercent", "Profit target %"],
                ["maxOpenRiskPercent", "Max open risk %"],
                ["maxConsecutiveLosses", "Max consecutive losses"],
                ["maxTradesPerDay", "Max trades / day"],
                ["maxDayProfitSharePercent", "Max day profit share %"],
                ["minTradingDays", "Min trading days"],
              ].map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <Input
                    type="number"
                    step="any"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Start challenge
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {!challenges.length ? (
          <p className="text-sm text-slate-500">No challenges yet</p>
        ) : (
          challenges.map((ch) => (
            <Card key={ch._id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    {ch.name}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      {ch.phase} · {ch.status}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {ch.firmName || "Prop firm"} · start {ch.startingBalance} · now{" "}
                    {ch.currentBalance}
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => refresh(ch._id)}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500">Daily DD</p>
                    <p>
                      {ch.stats?.dailyDDPercent ?? 0}% / {ch.rules?.maxDailyDDPercent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Overall DD</p>
                    <p>
                      {ch.stats?.overallDDPercent ?? 0}% / {ch.rules?.maxOverallDDPercent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Profit target</p>
                    <p>{ch.stats?.profitTargetProgressPercent ?? 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Consistency</p>
                    <p>{ch.stats?.consistencyScore ?? 100}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Trades today</p>
                    <p>
                      {ch.stats?.tradesToday ?? 0} / {ch.rules?.maxTradesPerDay}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Consec. losses</p>
                    <p>
                      {ch.stats?.consecutiveLosses ?? 0} / {ch.rules?.maxConsecutiveLosses}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Trading days</p>
                    <p>
                      {ch.stats?.tradingDays ?? 0} / {ch.rules?.minTradingDays}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Overall PnL</p>
                    <p>{ch.stats?.overallPnL ?? 0}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Profit target</span>
                      <span>{ch.stats?.profitTargetProgressPercent ?? 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-brand-slate/40 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500/80"
                        style={{
                          width: `${Math.min(100, Number(ch.stats?.profitTargetProgressPercent) || 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Overall DD</span>
                      <span>
                        {ch.stats?.overallDDPercent ?? 0}% / {ch.rules?.maxOverallDDPercent}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-brand-slate/40 overflow-hidden">
                      <div
                        className="h-full bg-red-500/70"
                        style={{
                          width: `${Math.min(
                            100,
                            ((Number(ch.stats?.overallDDPercent) || 0) /
                              (Number(ch.rules?.maxOverallDDPercent) || 10)) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Daily DD</span>
                      <span>
                        {ch.stats?.dailyDDPercent ?? 0}% / {ch.rules?.maxDailyDDPercent}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-brand-slate/40 overflow-hidden">
                      <div
                        className="h-full bg-amber-500/70"
                        style={{
                          width: `${Math.min(
                            100,
                            ((Number(ch.stats?.dailyDDPercent) || 0) /
                              (Number(ch.rules?.maxDailyDDPercent) || 5)) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {ch.equityCurve?.length > 1 && (
                  <div className="rounded-lg border border-brand-slate/40 p-2">
                    <p className="text-[10px] text-slate-500 mb-1">Equity curve</p>
                    <svg viewBox="0 0 280 56" className="w-full h-14 text-brand-cyan">
                      <path
                        d={equityPath(ch.equityCurve)}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                )}

                <p className="text-[10px] text-slate-500">
                  Timezone: {ch.timezone || "UTC"} · day key {ch.stats?.dayStartDate || "—"}
                </p>

                {ch.breachReason && (
                  <p className="text-red-400 text-xs">Failed: {ch.breachReason}</p>
                )}
                {ch.pauseReason && ch.status === "paused" && (
                  <p className="text-amber-400 text-xs">Paused: {ch.pauseReason}</p>
                )}
                {!!ch.failReasons?.length && (
                  <div className="text-[10px] text-slate-500 space-y-1">
                    <p className="text-slate-400">Fail history</p>
                    {ch.failReasons.slice(-3).map((f, i) => (
                      <p key={i}>
                        {f.reason} · {f.at ? new Date(f.at).toLocaleString() : ""}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => refresh(ch._id)}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                  {ch.status === "active" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPhase(ch._id, "verification")}
                      >
                        Mark verification
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPhase(ch._id, "funded")}>
                        Mark funded
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => pauseChallenge(ch._id)}>
                        <Pause className="h-3.5 w-3.5" />
                        Pause
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => failChallenge(ch._id)}>
                        <XCircle className="h-3.5 w-3.5" />
                        Fail
                      </Button>
                    </>
                  )}
                  {ch.status === "paused" && (
                    <Button size="sm" variant="secondary" onClick={() => resumeChallenge(ch._id)}>
                      <Play className="h-3.5 w-3.5" />
                      Resume
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
