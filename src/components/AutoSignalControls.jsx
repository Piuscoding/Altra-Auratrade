import { useEffect, useState } from "react"
import { Loader2, Play, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { strategiesApi } from "@/api/strategies"
import { FOREX_PAIRS, TIMEFRAMES } from "@/lib/forexPairs"

const HEALTH_COLOR = {
  idle: "text-slate-400",
  ok: "text-emerald-400",
  skipped: "text-amber-400",
  error: "text-red-400",
  disabled: "text-slate-500",
  no_account: "text-red-400",
}

export function AutoSignalControls({ strategy, onUpdated }) {
  const tradable = ["approved", "demo", "live"].includes(strategy?.status)
  const [cfg, setCfg] = useState({
    enabled: false,
    intervalMinutes: 15,
    timeframe: "H1",
    pairs: "EURUSD",
    maxSignalsPerDay: 5,
    requireAssignedAccount: true,
    minSignalGapMinutes: 30,
  })
  const [health, setHealth] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const [msg, setMsg] = useState("")

  const loadHealth = async () => {
    if (!strategy?._id) return
    try {
      const data = await strategiesApi.autoSignalHealth(strategy._id)
      setHealth(data.health)
    } catch {
      /* optional */
    }
  }

  useEffect(() => {
    const a = strategy?.autoSignal || {}
    setCfg({
      enabled: Boolean(a.enabled),
      intervalMinutes: a.intervalMinutes || 15,
      timeframe: a.timeframe || "H1",
      pairs: (a.pairs || ["EURUSD"]).join(","),
      maxSignalsPerDay: a.maxSignalsPerDay || 5,
      requireAssignedAccount: a.requireAssignedAccount !== false,
      minSignalGapMinutes: a.minSignalGapMinutes || 30,
    })
    loadHealth()
  }, [strategy?._id, strategy?.autoSignal?.lastRunAt, strategy?.autoSignal?.enabled])

  const save = async () => {
    setBusy(true)
    setErr("")
    setMsg("")
    try {
      const data = await strategiesApi.updateAutoSignal(strategy._id, {
        enabled: cfg.enabled,
        intervalMinutes: Number(cfg.intervalMinutes),
        timeframe: cfg.timeframe,
        pairs: cfg.pairs
          .split(",")
          .map((p) => p.trim().toUpperCase())
          .filter(Boolean),
        maxSignalsPerDay: Number(cfg.maxSignalsPerDay),
        requireAssignedAccount: cfg.requireAssignedAccount,
        minSignalGapMinutes: Number(cfg.minSignalGapMinutes),
      })
      setMsg("Auto-signal settings saved")
      onUpdated?.(data.strategy || data)
      await loadHealth()
    } catch (e) {
      setErr(e?.response?.data?.message || "Save failed")
    } finally {
      setBusy(false)
    }
  }

  const runNow = async () => {
    setBusy(true)
    setErr("")
    setMsg("")
    try {
      const data = await strategiesApi.runAutoSignal(strategy._id)
      if (data.result?.accepted) setMsg("Run complete — signal accepted")
      else if (data.result?.skipped) setMsg("Skipped: " + (data.result.reason || "no setup"))
      else if (data.result?.ok) setMsg("Run complete — see health for details")
      else setMsg(data.result?.error || data.message || "Run finished")
      if (data.strategy) onUpdated?.(data.strategy)
      else {
        const fresh = await strategiesApi.get(strategy._id)
        onUpdated?.(fresh.strategy)
      }
      await loadHealth()
    } catch (e) {
      setErr(e?.response?.data?.message || "Run failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Auto-signal</p>
          <p className="text-xs text-slate-500">
            Worker evaluates OHLC on an interval. Signals use the same news, session, risk, prop,
            and pre-validation gates as Terminal.
          </p>
        </div>
        <ToggleSwitch
          checked={cfg.enabled}
          disabled={!tradable}
          onChange={(v) => setCfg((c) => ({ ...c, enabled: v }))}
        />
      </div>

      {!tradable && (
        <p className="text-xs text-amber-400">Approve the strategy before enabling auto-signal.</p>
      )}

      <div className="rounded-lg border border-brand-slate/50 bg-brand-navy/40 px-3 py-3 space-y-1 text-xs">
        <p className="flex items-center gap-2 text-sm text-white">
          <Activity className="h-4 w-4 text-brand-cyan" />
          Health:{" "}
          <span className={HEALTH_COLOR[health?.healthStatus] || "text-slate-400"}>
            {health?.healthStatus || strategy?.autoSignal?.healthStatus || "idle"}
          </span>
        </p>
        <p className="text-slate-500">
          Last run:{" "}
          {health?.lastRunAt || strategy?.autoSignal?.lastRunAt
            ? new Date(health?.lastRunAt || strategy.autoSignal.lastRunAt).toLocaleString()
            : "—"}
        </p>
        <p className="text-slate-500">
          Next tick: {health?.nextRunAt ? new Date(health.nextRunAt).toLocaleString() : "—"}
        </p>
        <p className="text-slate-500">
          Last signal:{" "}
          {health?.lastSignalAt || strategy?.autoSignal?.lastSignalAt
            ? new Date(health?.lastSignalAt || strategy.autoSignal.lastSignalAt).toLocaleString()
            : "—"}
        </p>
        <p className="text-slate-500">
          Last result: {health?.lastResult || strategy?.autoSignal?.lastResult || "—"}
        </p>
        {(health?.lastError || strategy?.autoSignal?.lastError) && (
          <p className="text-red-400">Error: {health?.lastError || strategy.autoSignal.lastError}</p>
        )}
        <p className="text-slate-500">
          Account:{" "}
          {health?.assignedAccount
            ? `${health.assignedAccount.name} (${health.assignedAccount.status})`
            : "none assigned / connected"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Interval (minutes)</Label>
          <Input
            type="number"
            min={5}
            max={240}
            value={cfg.intervalMinutes}
            onChange={(e) => setCfg((c) => ({ ...c, intervalMinutes: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Timeframe</Label>
          <select
            value={cfg.timeframe}
            onChange={(e) => setCfg((c) => ({ ...c, timeframe: e.target.value }))}
            className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
          >
            {TIMEFRAMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Pairs (comma-separated)</Label>
          <Input
            value={cfg.pairs}
            onChange={(e) => setCfg((c) => ({ ...c, pairs: e.target.value }))}
            placeholder="EURUSD,GBPUSD"
          />
          <p className="text-[10px] text-slate-600">Common: {FOREX_PAIRS.slice(0, 6).join(", ")}…</p>
        </div>
        <div className="space-y-1">
          <Label>Max signals / day</Label>
          <Input
            type="number"
            min={1}
            max={50}
            value={cfg.maxSignalsPerDay}
            onChange={(e) => setCfg((c) => ({ ...c, maxSignalsPerDay: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Min gap between signals (min)</Label>
          <Input
            type="number"
            min={5}
            max={240}
            value={cfg.minSignalGapMinutes}
            onChange={(e) => setCfg((c) => ({ ...c, minSignalGapMinutes: e.target.value }))}
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-slate/40 px-3 py-2 sm:col-span-2">
          <span className="text-sm text-slate-300">Require assigned connected account</span>
          <ToggleSwitch
            checked={cfg.requireAssignedAccount}
            onChange={(v) => setCfg((c) => ({ ...c, requireAssignedAccount: v }))}
          />
        </div>
      </div>

      {err && <p className="text-sm text-red-400">{err}</p>}
      {msg && <p className="text-sm text-emerald-400">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={save} disabled={busy || !tradable}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save auto-signal
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={runNow}
          disabled={busy || !cfg.enabled || !tradable}
        >
          <Play className="h-4 w-4" />
          Run once now
        </Button>
        <Button type="button" variant="ghost" onClick={loadHealth} disabled={busy}>
          Refresh health
        </Button>
      </div>
    </div>
  )
}
