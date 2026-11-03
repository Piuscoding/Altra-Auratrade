import { useEffect, useState } from "react"
import { Newspaper, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import api from "@/api/client"
import { brokersApi } from "@/api/brokers"

export default function NewsFiltersPage() {
  const [events, setEvents] = useState([])
  const [source, setSource] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState([])
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const [{ data }, b] = await Promise.all([
        api.get("/market/calendar", { params: { days: 7 } }),
        brokersApi.list(),
      ])
      setEvents(data.events || [])
      setSource(data.source || "")
      setMessage(data.message || "")
      setAccounts(b.accounts || [])
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load calendar")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const toggleAccountNews = async (acc) => {
    try {
      await brokersApi.updateSettings(acc._id, {
        isNewsFilterEnabled: !acc.isNewsFilterEnabled,
      })
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || "Update failed")
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Newspaper className="h-7 w-7 text-rose-400" />
            News Filters
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Live economic calendar · blocks new signals near high-impact releases
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MarketStatusBadge />
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How news filtering works</CardTitle>
          <CardDescription>
            When enabled on a broker account, the trading engine checks the live calendar before
            accepting a signal. If a high-impact event falls inside the blackout window, the signal is
            skipped (not sent to the broker). You can customize watched events per account from Brokers.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-400 space-y-1">
          <p>• Providers: Finance Calendar and JB News / JBlanked (primary); Finnhub and FMP as fallbacks. Admin selects the preferred source.</p>
          <p>• Default watch list includes FOMC, CPI, NFP, GDP, ECB, BOE when configured on the account.</p>
          <p>• Charts also plot nearby high-impact markers with estimated pip shock.</p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upcoming economic events</CardTitle>
          <CardDescription>
            Source: {source || "—"}
            {message ? ` · ${message}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
            </div>
          ) : !events.length ? (
            <p className="text-sm text-slate-500">
              No events returned. Set FINANCECALENDAR_API_KEY and/or JBNEWS_API_KEY on the API server, then choose the provider in Admin → Settings.
            </p>
          ) : (
            events.map((e) => (
              <div
                key={e.id}
                className="rounded-lg border border-brand-slate/50 px-3 py-2 text-sm"
              >
                <p className="text-white font-medium">
                  {e.name}{" "}
                  <span className="text-xs text-slate-500 uppercase">{e.impact}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {e.country} · {new Date(e.time).toLocaleString()}
                  {e.estimate != null ? ` · est ${e.estimate}` : ""}
                  {e.actual != null ? ` · act ${e.actual}` : ""}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-600">
        Economic calendar data may include sources such as{" "}
        <a
          href="https://www.financecalendar.com"
          target="_blank"
          rel="noreferrer"
          className="text-brand-cyan hover:underline"
        >
          Finance Calendar
        </a>{" "}
        and JBlanked / JB News per admin configuration.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Broker account news switches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!accounts.length ? (
            <p className="text-sm text-slate-500">No broker accounts yet</p>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc._id}
                className="flex items-center justify-between rounded-lg border border-brand-slate/50 px-3 py-2 text-sm"
              >
                <span className="text-white">{acc.name}</span>
                <Button size="sm" variant="outline" onClick={() => toggleAccountNews(acc)}>
                  News filter {acc.isNewsFilterEnabled ? "ON" : "OFF"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
