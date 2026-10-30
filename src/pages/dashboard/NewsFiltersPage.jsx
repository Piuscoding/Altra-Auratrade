import { useEffect, useState } from "react"
import { Newspaper, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { tradingApi } from "@/api/trading"

export default function NewsFiltersPage() {
  const [events, setEvents] = useState([])
  const [name, setName] = useState("FOMC")
  const [minutes, setMinutes] = useState(15)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const data = await tradingApi.upcomingNews()
      setEvents(data.events || [])
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const seed = async () => {
    setBusy(true)
    setMessage("")
    try {
      const data = await tradingApi.seedDemoNews({
        name,
        minutesFromNow: Number(minutes) || 15,
      })
      setMessage(data.message)
      await load()
    } catch (err) {
      setMessage(err?.response?.data?.message || "Seed failed")
    } finally {
      setBusy(false)
    }
  }

  const clear = async () => {
    setBusy(true)
    try {
      await tradingApi.clearDemoNews()
      setMessage("Demo events cleared")
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Newspaper className="h-7 w-7 text-brand-cyan" />
            News Filters
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            High-impact events block signals before session and risk checks
          </p>
        </div>
        <MarketStatusBadge />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
          <CardDescription>
            Built-in watch list includes FOMC, CPI, NFP, GDP, ECB, BOE, RBA, BOJ. When an event is
            within ±30 minutes, new signals are marked skipped_due_to_news. Risk adjustment only
            runs when news filter is disabled on the account.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo calendar (testing)</CardTitle>
          <CardDescription>
            Seed a high-impact event to verify the filter without a live economic calendar feed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Event name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Minutes from now</Label>
              <Input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={seed}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Seed event
            </Button>
            <Button variant="outline" disabled={busy} onClick={clear}>
              Clear demo events
            </Button>
          </div>
          {message && <p className="text-sm text-slate-400">{message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming / active demo events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-brand-cyan" />
          ) : events.length === 0 ? (
            <p className="text-sm text-slate-500">No demo events in window</p>
          ) : (
            <ul className="space-y-2">
              {events.map((ev, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-brand-slate/50 px-3 py-2 text-sm text-slate-300"
                >
                  <span className="text-white font-medium">{ev.name}</span> ·{" "}
                  {new Date(ev.time).toLocaleString()} · {ev.impact}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
