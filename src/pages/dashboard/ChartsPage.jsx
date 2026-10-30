import { useEffect, useRef, useState, useCallback } from "react"
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
} from "lightweight-charts"
import {
  LineChart,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import { chartsApi } from "@/api/charts"
import { strategiesApi } from "@/api/strategies"

const PAIRS = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "USDCAD",
  "USDCHF",
  "XAUUSD",
  "GBPJPY",
  "EURJPY",
]

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"]

export default function ChartsPage() {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)
  const priceLinesRef = useRef([])
  const [pair, setPair] = useState("EURUSD")
  const [timeframe, setTimeframe] = useState("M15")
  const [strategyId, setStrategyId] = useState("")
  const [strategies, setStrategies] = useState([])
  const [bundle, setBundle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    strategiesApi
      .list()
      .then((d) => {
        const list = (d.strategies || []).filter((s) =>
          ["approved", "demo", "live", "review"].includes(s.status)
        )
        setStrategies(list)
      })
      .catch(() => {})
  }, [])

  const clearPriceLines = () => {
    if (!seriesRef.current) return
    for (const line of priceLinesRef.current) {
      try {
        seriesRef.current.removePriceLine(line)
      } catch {
        /* already removed */
      }
    }
    priceLinesRef.current = []
  }

  const applyOverlays = useCallback((data) => {
    if (!seriesRef.current || !data) return
    clearPriceLines()

    const addLine = (price, color, title, style = LineStyle.Solid) => {
      if (price == null || Number.isNaN(Number(price))) return
      const line = seriesRef.current.createPriceLine({
        price: Number(price),
        color,
        lineWidth: 2,
        lineStyle: style,
        axisLabelVisible: true,
        title,
      })
      priceLinesRef.current.push(line)
    }

    // Strategy plotted levels
    const levels = data.strategyLevels?.plottedLevels || {}
    if (levels.entry) addLine(parseFloat(levels.entry), "#22d3ee", "Strategy entry", LineStyle.Dashed)
    if (levels.stopLoss) addLine(parseFloat(levels.stopLoss), "#f87171", "Strategy SL", LineStyle.Dashed)
    if (levels.takeProfit) addLine(parseFloat(levels.takeProfit), "#34d399", "Strategy TP", LineStyle.Dashed)

    // Live trade overlays
    for (const ov of data.overlays || []) {
      const dir = ov.direction === "short" ? "S" : "L"
      addLine(ov.entry, "#fbbf24", `${dir} entry`)
      const slTitle =
        ov.slStatus === "profit_lock"
          ? `${dir} SL (lock)`
          : ov.slStatus === "trend_lock"
            ? `${dir} SL (trend)`
            : `${dir} SL`
      addLine(ov.stopLoss, ov.profitLockActivated ? "#a78bfa" : "#ef4444", slTitle)
      addLine(ov.takeProfit, "#10b981", `${dir} TP`)
      if (ov.originalSL && ov.originalSL !== ov.stopLoss) {
        addLine(ov.originalSL, "#fb923c", "Orig SL", LineStyle.SparseDotted)
      }
    }
  }, [])

  const applyMarkers = useCallback((candles, newsMarkers) => {
    if (!seriesRef.current || !candles?.length) return
    const byTime = new Set(candles.map((c) => c.time))
    const markers = []

    for (const m of newsMarkers || []) {
      if (!m.withinChart) continue
      // Snap to nearest candle time
      let t = m.time
      if (!byTime.has(t)) {
        let best = candles[0].time
        let bestDist = Math.abs(best - t)
        for (const c of candles) {
          const d = Math.abs(c.time - t)
          if (d < bestDist) {
            best = c.time
            bestDist = d
          }
        }
        t = best
      }
      markers.push({
        time: t,
        position: "aboveBar",
        color: m.impact === "high" ? "#f43f5e" : "#fbbf24",
        shape: "arrowDown",
        text: `${m.label} ~${m.estimatedPips}p`,
      })
    }

    markers.sort((a, b) => a.time - b.time)
    seriesRef.current.setMarkers(markers)
  }, [])

  const renderChart = useCallback(
    (data) => {
      if (!containerRef.current || !data?.candles?.length) return

      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        seriesRef.current = null
        priceLinesRef.current = []
      }

      const chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#0a0e1a" },
          textColor: "#94a3b8",
        },
        grid: {
          vertLines: { color: "rgba(30, 41, 59, 0.6)" },
          horzLines: { color: "rgba(30, 41, 59, 0.6)" },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: "#1e293b" },
        timeScale: {
          borderColor: "#1e293b",
          timeVisible: true,
          secondsVisible: false,
        },
        width: containerRef.current.clientWidth,
        height: 480,
      })

      const series = chart.addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#f43f5e",
        borderUpColor: "#10b981",
        borderDownColor: "#f43f5e",
        wickUpColor: "#34d399",
        wickDownColor: "#fb7185",
      })

      series.setData(data.candles)
      chart.timeScale().fitContent()

      chartRef.current = chart
      seriesRef.current = series

      applyOverlays(data)
      applyMarkers(data.candles, data.newsMarkers)

      const onResize = () => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
        }
      }
      window.addEventListener("resize", onResize)
      return () => window.removeEventListener("resize", onResize)
    },
    [applyOverlays, applyMarkers]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await chartsApi.workspace({
        pair,
        timeframe,
        strategyId: strategyId || undefined,
        count: 220,
      })
      setBundle(data)
      // defer chart paint after DOM paint
      requestAnimationFrame(() => renderChart(data))
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load chart workspace")
    } finally {
      setLoading(false)
    }
  }, [pair, timeframe, strategyId, renderChart])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => {
      load()
    }, 30000)
    return () => clearInterval(id)
  }, [autoRefresh, load])

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LineChart className="h-7 w-7 text-brand-cyan" />
            Chart Workspace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Lightweight Charts · RR / entry / SL / TP overlays · news impact markers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MarketStatusBadge />
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="py-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label>Pair</Label>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-3 text-sm text-brand-silver"
            >
              {PAIRS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Timeframe</Label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-3 text-sm text-brand-silver"
            >
              {TIMEFRAMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Strategy levels</Label>
            <select
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-3 text-sm text-brand-silver"
            >
              <option value="">None</option>
              {strategies.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 flex flex-col justify-end">
            <label className="flex items-center gap-2 text-sm text-slate-300 h-10">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh 30s
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="relative rounded-xl border border-brand-slate/60 overflow-hidden bg-brand-navy">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-navy/60">
            <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
          </div>
        )}
        <div ref={containerRef} className="w-full" style={{ minHeight: 480 }} />
        {bundle && (
          <div className="absolute top-3 left-3 rounded-md bg-brand-navy/80 border border-brand-slate/50 px-2 py-1 text-xs text-slate-400">
            {bundle.pair} · {bundle.timeframe} · {bundle.source}
            {bundle.last ? ` · last ${bundle.last.close}` : ""}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trade overlays</CardTitle>
            <CardDescription>
              Open / pending trades for this pair with entry, SL, TP and RR
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!bundle?.overlays?.length ? (
              <p className="text-sm text-slate-500">
                No open overlays. Generate a signal from the Terminal to plot levels.
              </p>
            ) : (
              bundle.overlays.map((ov) => (
                <div
                  key={ov.tradeId}
                  className="rounded-lg border border-brand-slate/50 px-3 py-2 text-sm"
                >
                  <p className="text-white font-medium">
                    {ov.pair} {ov.direction} · {ov.status}
                    {ov.rr != null ? ` · RR 1:${ov.rr}` : ""}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Entry {ov.entry ?? "—"} · SL {ov.stopLoss ?? "—"} · TP {ov.takeProfit ?? "—"}
                    {ov.slStatus ? ` · SL status: ${ov.slStatus}` : ""}
                    {ov.profitLockActivated ? " · profit lock on" : ""}
                    {ov.newsImpact != null ? ` · news impact ~${ov.newsImpact}p` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              News impact alerts
            </CardTitle>
            <CardDescription>
              High-impact markers with estimated pip shock on the chart
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {!bundle?.newsMarkers?.length ? (
              <p className="text-sm text-slate-500">
                No markers. Seed a demo event under News Filters to see live impact windows.
              </p>
            ) : (
              bundle.newsMarkers.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm"
                >
                  <p className="text-white font-medium">{m.label}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(m.time * 1000).toLocaleString()} · {m.impact} · ~{m.estimatedPips}{" "}
                    pips estimated
                    {m.withinChart ? " · on chart" : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {bundle?.strategyLevels && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Strategy levels — {bundle.strategyLevels.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300 grid gap-2 sm:grid-cols-3">
            <p>Entry: {bundle.strategyLevels.plottedLevels?.entry || bundle.strategyLevels.rules?.entry || "—"}</p>
            <p>SL: {bundle.strategyLevels.plottedLevels?.stopLoss || bundle.strategyLevels.rules?.stopLoss || "—"}</p>
            <p>TP: {bundle.strategyLevels.plottedLevels?.takeProfit || bundle.strategyLevels.rules?.takeProfit || "—"}</p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-slate-600">
        OHLC source is synthetic (stable, seeded) until MARKET_DATA_URL / broker stream is configured.
        Overlays and news markers are live from your trades and news filter engine.
      </p>
    </div>
  )
}
