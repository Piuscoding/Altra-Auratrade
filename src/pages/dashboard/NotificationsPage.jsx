import { useEffect, useState } from "react"
import { Bell, Loader2, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { notificationsApi } from "@/api/notifications"

const severityClass = {
  info: "border-slate-500/40",
  success: "border-emerald-500/40 bg-emerald-500/5",
  warning: "border-amber-500/40 bg-amber-500/5",
  critical: "border-red-500/40 bg-red-500/5",
}

export default function NotificationsPage() {
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const data = await notificationsApi.list()
      setItems(data.notifications || [])
      setUnread(data.unread || 0)
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const markOne = async (id) => {
    await notificationsApi.markRead(id)
    await load()
  }

  const markAll = async () => {
    await notificationsApi.markAllRead()
    await load()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="h-7 w-7 text-brand-gold" />
            Notifications
            {unread > 0 && (
              <span className="text-xs rounded-full bg-brand-cyan/20 text-brand-cyan px-2 py-0.5">
                {unread} unread
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-1">Alerts for signals, trades, and account events</p>
        </div>
        <div className="flex items-center gap-2">
          <MarketStatusBadge />
          <Button size="sm" variant="outline" onClick={markAll}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No notifications yet. Process a signal from the Terminal to generate events.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n._id}
              type="button"
              onClick={() => !n.read && markOne(n._id)}
              className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                severityClass[n.severity] || severityClass.info
              } ${n.read ? "opacity-70" : "border-brand-cyan/30"}`}
            >
              <div className="flex justify-between gap-2">
                <p className="font-medium text-white text-sm">{n.title}</p>
                <span className="text-xs text-slate-500 shrink-0">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 whitespace-pre-wrap">{n.body}</p>
              <p className="text-xs text-slate-600 mt-1">
                {n.type} · {n.read ? "read" : "unread"}
                {n.delivery?.email === "sent" ? " · email sent" : ""}
                {n.delivery?.telegram === "sent" ? " · telegram sent" : ""}
                {n.delivery?.discord === "sent" ? " · discord sent" : ""}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
