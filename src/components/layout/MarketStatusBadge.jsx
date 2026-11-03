import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import api from "@/api/client"

export function MarketStatusBadge({ className }) {
  const [status, setStatus] = useState({
    isOpen: false,
    label: "Checking…",
    sessionLabel: "",
  })

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const { data } = await api.get("/market/status")
        if (alive) setStatus(data)
      } catch {
        // client-side fallback
        const now = new Date()
        const day = now.getUTCDay()
        const mins = now.getUTCHours() * 60 + now.getUTCMinutes()
        let open = true
        if (day === 6) open = false
        else if (day === 0) open = mins >= 22 * 60
        else if (day === 5) open = mins < 22 * 60
        if (alive) {
          setStatus({
            isOpen: open,
            label: open ? "Market Open" : "Market Closed",
            sessionLabel: open ? "Session check offline" : "Weekend / closed",
          })
        }
      }
    }
    load()
    const id = setInterval(load, 60_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        status.isOpen
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : "border-slate-500/40 bg-slate-500/10 text-slate-400",
        className
      )}
      title="Forex: Sun 22:00 UTC – Fri 22:00 UTC"
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          status.isOpen ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
        )}
      />
      <span>
        {status.label}
        {status.sessionLabel ? ` · ${status.sessionLabel}` : ""}
      </span>
    </div>
  )
}
