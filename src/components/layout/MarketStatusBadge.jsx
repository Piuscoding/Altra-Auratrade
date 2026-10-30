import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const SESSIONS = [
  { name: "Sydney", open: 21, close: 6 },
  { name: "Tokyo", open: 0, close: 9 },
  { name: "London", open: 7, close: 16 },
  { name: "New York", open: 12, close: 21 },
]

function getCurrentMarketStatus() {
  const now = new Date()
  const utcHour = now.getUTCHours()
  const activeSessions = SESSIONS.filter((s) => {
    if (s.open < s.close) {
      return utcHour >= s.open && utcHour < s.close
    }
    return utcHour >= s.open || utcHour < s.close
  })
  const isOpen = activeSessions.length > 0
  return {
    isOpen,
    currentSession: activeSessions.map((s) => s.name).join(" + ") || null,
  }
}

export function MarketStatusBadge({ className }) {
  const [status, setStatus] = useState(getCurrentMarketStatus())

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getCurrentMarketStatus())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border",
        status.isOpen
          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
          : "bg-red-500/15 border-red-500/40 text-red-400",
        className
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full animate-pulse",
          status.isOpen ? "bg-emerald-400" : "bg-red-400"
        )}
      />
      {status.isOpen ? (
        <>
          Market Open
          {status.currentSession && (
            <span className="opacity-80">· {status.currentSession}</span>
          )}
        </>
      ) : (
        "Market Closed"
      )}
    </div>
  )
}
