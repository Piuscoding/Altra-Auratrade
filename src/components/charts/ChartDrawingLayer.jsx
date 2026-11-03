import { useCallback, useEffect, useRef, useState } from "react"

export const DRAW_TOOLS = [
  { id: "cursor", label: "Select", title: "Select / move drawings" },
  { id: "horizontal", label: "Horizontal", title: "Horizontal line" },
  { id: "trend", label: "Trend", title: "Trend line" },
  { id: "ray", label: "Ray", title: "Ray" },
  { id: "rectangle", label: "Rectangle", title: "Rectangle" },
  { id: "fibonacci", label: "Fibonacci", title: "Fibonacci retracement" },
  { id: "text", label: "Text", title: "Text label" },
]

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]

const TOOL_ICONS = {
  cursor: "↖",
  horizontal: "—",
  trend: "/",
  ray: "↗",
  rectangle: "▭",
  fibonacci: "ƒ",
  text: "T",
}

function uid() {
  return `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function nearestCandle(candles, time) {
  if (!candles?.length || time == null) return null
  let best = candles[0]
  let bestDiff = Math.abs(candles[0].time - time)
  for (const c of candles) {
    const d = Math.abs(c.time - time)
    if (d < bestDiff) {
      best = c
      bestDiff = d
    }
  }
  return best
}

function snapPrice(candles, time, price, enabled) {
  if (!enabled || !candles?.length || price == null) return price
  const c = nearestCandle(candles, time)
  if (!c) return price
  const candidates = [c.open, c.high, c.low, c.close]
  let best = candidates[0]
  let bestDiff = Math.abs(candidates[0] - price)
  for (const v of candidates) {
    const d = Math.abs(v - price)
    if (d < bestDiff) {
      best = v
      bestDiff = d
    }
  }
  // Only snap if within ~0.15% of price range of that candle
  const range = Math.abs(c.high - c.low) || Math.abs(price) * 0.0005
  if (bestDiff <= range * 0.35 + Math.abs(price) * 0.00005) return best
  return price
}

export function ChartDrawingToolbar({
  tool,
  onTool,
  onClear,
  onDeleteSelected,
  hasSelection,
  onFullscreen,
  snapEnabled,
  onToggleSnap,
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {DRAW_TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          title={t.title}
          aria-label={t.title}
          onClick={() => onTool(t.id)}
          className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition-colors ${
            tool === t.id
              ? "border-brand-cyan bg-brand-cyan/20 text-brand-cyan"
              : "border-brand-slate/60 text-slate-400 hover:border-brand-cyan/40 hover:text-white"
          }`}
        >
          {TOOL_ICONS[t.id] || t.label[0]}
        </button>
      ))}
      <span className="mx-1 h-6 w-px bg-brand-slate/50" />
      <button
        type="button"
        title={snapEnabled ? "Snap to OHLC: ON" : "Snap to OHLC: OFF"}
        onClick={() => onToggleSnap?.(!snapEnabled)}
        className={`flex h-9 items-center justify-center rounded-md border px-2 text-[10px] font-semibold uppercase tracking-wide ${
          snapEnabled
            ? "border-brand-gold/50 bg-brand-gold/15 text-brand-gold"
            : "border-brand-slate/60 text-slate-500"
        }`}
      >
        Snap
      </button>
      <button
        type="button"
        title="Delete selected"
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-brand-slate/60 text-slate-400 hover:text-red-400 disabled:opacity-40"
      >
        ⌫
      </button>
      <button
        type="button"
        title="Clear all unlocked drawings"
        onClick={onClear}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-brand-slate/60 text-xs text-slate-400 hover:text-amber-400"
      >
        ✕
      </button>
      {onFullscreen && (
        <button
          type="button"
          title="Toggle fullscreen"
          onClick={onFullscreen}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-brand-slate/60 text-xs text-slate-400 hover:text-white"
        >
          ⛶
        </button>
      )}
    </div>
  )
}

export function ChartDrawingLayers({
  drawings,
  selectedId,
  onSelect,
  onToggleVisible,
  onToggleLock,
  onDelete,
  onReorder,
}) {
  if (!drawings?.length) {
    return (
      <div className="rounded-lg border border-brand-slate/40 px-3 py-2 text-xs text-slate-500">
        No drawings yet — use the toolbar icons
      </div>
    )
  }
  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {[...drawings].reverse().map((d, idx) => {
        const realIndex = drawings.length - 1 - idx
        return (
          <div
            key={d.id}
            className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${
              selectedId === d.id
                ? "border-brand-cyan/50 bg-brand-cyan/10"
                : "border-brand-slate/40 bg-brand-navy/30"
            }`}
          >
            <button
              type="button"
              className="flex-1 text-left text-slate-300 truncate"
              onClick={() => onSelect(d.id)}
              title={d.type}
            >
              {d.type}
              {d.text ? `: ${d.text}` : ""}
              {d.price != null ? ` @ ${Number(d.price).toFixed(5)}` : ""}
            </button>
            <button
              type="button"
              title={d.hidden ? "Show" : "Hide"}
              className="text-slate-500 hover:text-white w-6"
              onClick={() => onToggleVisible(d.id)}
            >
              {d.hidden ? "○" : "●"}
            </button>
            <button
              type="button"
              title={d.locked ? "Unlock" : "Lock"}
              className="text-slate-500 hover:text-white w-6"
              onClick={() => onToggleLock(d.id)}
            >
              {d.locked ? "🔒" : "🔓"}
            </button>
            <button
              type="button"
              title="Move up"
              className="text-slate-500 hover:text-white w-5"
              onClick={() => onReorder(realIndex, realIndex + 1)}
            >
              ↑
            </button>
            <button
              type="button"
              title="Delete"
              className="text-slate-500 hover:text-red-400 w-5"
              onClick={() => onDelete(d.id)}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}

/**
 * SVG overlay on lightweight-charts
 * props.series — ISeriesApi, props.chart — IChartApi
 * props.candles — OHLC for snap
 */
export function ChartDrawingLayer({
  chart,
  series,
  chartRef: chartRefProp,
  seriesRef: seriesRefProp,
  containerRef: _containerRef,
  candles = [],
  drawings = [],
  onChange,
  tool = "cursor",
  selectedId,
  setSelectedId,
  onSelect,
  snapEnabled = true,
  pair: _pair,
  timeframe: _timeframe,
}) {
  const chartRef = useRef(chart || chartRefProp?.current)
  const seriesRef = useRef(series || seriesRefProp?.current)
  const [draft, setDraft] = useState(null)
  const dragRef = useRef(null)
  const select = onSelect || setSelectedId

  useEffect(() => {
    chartRef.current = chart || chartRefProp?.current || null
    seriesRef.current = series || seriesRefProp?.current || null
  }, [chart, series, chartRefProp, seriesRefProp])

  // Re-bind when refs populate after chart create
  useEffect(() => {
    const id = setInterval(() => {
      if (chartRefProp?.current) chartRef.current = chartRefProp.current
      if (seriesRefProp?.current) seriesRef.current = seriesRefProp.current
    }, 500)
    return () => clearInterval(id)
  }, [chartRefProp, seriesRefProp])

  const toXY = useCallback((time, price) => {
    if (!chartRef.current || !seriesRef.current || time == null || price == null) return null
    const x = chartRef.current.timeScale().timeToCoordinate(time)
    const y = seriesRef.current.priceToCoordinate(price)
    if (x == null || y == null) return null
    return { x, y }
  }, [])

  const fromEvent = useCallback(
    (e) => {
      if (!chartRef.current || !seriesRef.current) return null
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const time = chartRef.current.timeScale().coordinateToTime(x)
      let price = seriesRef.current.coordinateToPrice(y)
      if (time == null || price == null) return null
      price = snapPrice(candles, time, price, snapEnabled)
      return { time, price, x, y }
    },
    [candles, snapEnabled]
  )

  const commit = useCallback(
    (nextList) => {
      onChange?.(nextList)
    },
    [onChange]
  )

  const updateDrawing = useCallback(
    (id, patch) => {
      const next = drawings.map((d) => (d.id === id ? { ...d, ...patch } : d))
      commit(next)
    },
    [drawings, commit]
  )

  const onPointerDown = (e) => {
    if (e.button !== 0) return
    const pt = fromEvent(e)
    if (!pt) return

    // Select / move mode
    if (tool === "cursor") {
      // Hit test existing drawings (reverse = top first)
      for (let i = drawings.length - 1; i >= 0; i--) {
        const d = drawings[i]
        if (d.hidden || d.locked) continue
        if (hitTest(d, pt, toXY)) {
          select?.(d.id)
          dragRef.current = {
            id: d.id,
            mode: "move",
            start: pt,
            origin: { ...d },
          }
          e.preventDefault()
          return
        }
      }
      select?.(null)
      return
    }

    // Drawing tools
    if (tool === "horizontal") {
      const d = {
        id: uid(),
        type: "horizontal",
        price: pt.price,
        time: pt.time,
        color: "#22d3ee",
        locked: false,
        hidden: false,
      }
      commit([...drawings, d])
      select?.(d.id)
      return
    }

    if (tool === "text") {
      const label = window.prompt("Label text", "Note")
      if (!label) return
      const d = {
        id: uid(),
        type: "text",
        price: pt.price,
        time: pt.time,
        text: label,
        color: "#fbbf24",
        locked: false,
        hidden: false,
      }
      commit([...drawings, d])
      select?.(d.id)
      return
    }

    // multi-point tools
    if (!draft) {
      setDraft({
        type: tool,
        t1: pt.time,
        p1: pt.price,
        t2: pt.time,
        p2: pt.price,
      })
      return
    }

    const finished = {
      id: uid(),
      type: draft.type,
      t1: draft.t1,
      p1: draft.p1,
      t2: pt.time,
      p2: pt.price,
      color:
        draft.type === "fibonacci"
          ? "#a78bfa"
          : draft.type === "rectangle"
            ? "#34d399"
            : "#38bdf8",
      locked: false,
      hidden: false,
    }
    setDraft(null)
    commit([...drawings, finished])
    select?.(finished.id)
  }

  const onPointerMove = (e) => {
    const pt = fromEvent(e)
    if (!pt) return

    if (dragRef.current?.mode === "move") {
      const { id, start, origin } = dragRef.current
      const dPrice = pt.price - start.price
      const dTime = (pt.time || 0) - (start.time || 0)
      const patch = {}
      if (origin.type === "horizontal" || origin.type === "text") {
        patch.price = snapPrice(candles, pt.time, origin.price + dPrice, snapEnabled)
        if (origin.time != null) patch.time = origin.time + dTime
      } else {
        patch.p1 = origin.p1 + dPrice
        patch.p2 = origin.p2 + dPrice
        if (origin.t1 != null) patch.t1 = origin.t1 + dTime
        if (origin.t2 != null) patch.t2 = origin.t2 + dTime
        if (snapEnabled) {
          patch.p1 = snapPrice(candles, patch.t1, patch.p1, true)
          patch.p2 = snapPrice(candles, patch.t2, patch.p2, true)
        }
      }
      updateDrawing(id, patch)
      return
    }

    if (draft) {
      setDraft((d) => (d ? { ...d, t2: pt.time, p2: pt.price } : d))
    }
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  useEffect(() => {
    const up = () => {
      dragRef.current = null
    }
    window.addEventListener("mouseup", up)
    return () => window.removeEventListener("mouseup", up)
  }, [])

  const all = draft
    ? [
        ...drawings,
        {
          id: "__draft",
          type: draft.type,
          t1: draft.t1,
          p1: draft.p1,
          t2: draft.t2,
          p2: draft.p2,
          color: "#94a3b8",
        },
      ]
    : drawings

  function hitTest(d, pt, toXYFn) {
    const threshold = 8
    if (d.type === "horizontal") {
      const y = seriesRef.current?.priceToCoordinate(d.price)
      if (y == null) return false
      return Math.abs(y - pt.y) < threshold
    }
    if (d.type === "text") {
      const a = toXYFn(d.time, d.price)
      if (!a) return false
      return Math.hypot(a.x - pt.x, a.y - pt.y) < 16
    }
    if (["trend", "ray", "rectangle", "fibonacci"].includes(d.type)) {
      const a = toXYFn(d.t1, d.p1)
      const b = toXYFn(d.t2, d.p2)
      if (!a || !b) return false
      // distance to segment
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len2 = dx * dx + dy * dy || 1
      let t = ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / len2
      t = Math.max(0, Math.min(1, t))
      const px = a.x + t * dx
      const py = a.y + t * dy
      if (Math.hypot(px - pt.x, py - pt.y) < threshold) return true
      if (d.type === "rectangle") {
        const minX = Math.min(a.x, b.x)
        const maxX = Math.max(a.x, b.x)
        const minY = Math.min(a.y, b.y)
        const maxY = Math.max(a.y, b.y)
        return pt.x >= minX - 2 && pt.x <= maxX + 2 && pt.y >= minY - 2 && pt.y <= maxY + 2
      }
    }
    return false
  }

  function renderShape(d) {
    if (d.hidden) return null
    const stroke = d.color || "#22d3ee"
    const selected = selectedId === d.id
    const sw = selected ? 2.5 : 1.5

    if (d.type === "horizontal") {
      const y = seriesRef.current?.priceToCoordinate(d.price)
      if (y == null) return null
      return (
        <g key={d.id}>
          <line
            x1={0}
            y1={y}
            x2="100%"
            y2={y}
            stroke={stroke}
            strokeWidth={sw}
            strokeDasharray={d.locked ? "6 4" : undefined}
          />
          {selected && (
            <circle cx="50%" cy={y} r={5} fill={stroke} stroke="#0f172a" strokeWidth={1} />
          )}
        </g>
      )
    }

    if (d.type === "text") {
      const a = toXY(d.time, d.price)
      if (!a) return null
      return (
        <g key={d.id}>
          <text x={a.x} y={a.y} fill={stroke} fontSize="12" fontWeight={selected ? 700 : 500}>
            {d.text || "Note"}
          </text>
        </g>
      )
    }

    if (d.type === "trend" || d.type === "ray") {
      const a = toXY(d.t1, d.p1)
      const b = toXY(d.t2, d.p2)
      if (!a || !b) return null
      let x2 = b.x
      let y2 = b.y
      if (d.type === "ray") {
        const dx = b.x - a.x || 1
        const dy = b.y - a.y
        x2 = a.x + dx * 50
        y2 = a.y + dy * 50
      }
      return (
        <g key={d.id}>
          <line x1={a.x} y1={a.y} x2={x2} y2={y2} stroke={stroke} strokeWidth={sw} />
          {selected && (
            <>
              <circle cx={a.x} cy={a.y} r={4} fill={stroke} />
              <circle cx={b.x} cy={b.y} r={4} fill={stroke} />
            </>
          )}
        </g>
      )
    }

    if (d.type === "rectangle") {
      const a = toXY(d.t1, d.p1)
      const b = toXY(d.t2, d.p2)
      if (!a || !b) return null
      const x = Math.min(a.x, b.x)
      const y = Math.min(a.y, b.y)
      const w = Math.abs(b.x - a.x)
      const h = Math.abs(b.y - a.y)
      return (
        <g key={d.id}>
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            fill={stroke}
            fillOpacity={0.12}
            stroke={stroke}
            strokeWidth={sw}
          />
          {selected && (
            <>
              <circle cx={a.x} cy={a.y} r={4} fill={stroke} />
              <circle cx={b.x} cy={b.y} r={4} fill={stroke} />
            </>
          )}
        </g>
      )
    }

    if (d.type === "fibonacci") {
      const a = toXY(d.t1, d.p1)
      const b = toXY(d.t2, d.p2)
      if (!a || !b) return null
      const pHigh = Math.max(d.p1, d.p2)
      const pLow = Math.min(d.p1, d.p2)
      const range = pHigh - pLow || 1
      const x1 = Math.min(a.x, b.x)
      const x2 = Math.max(a.x, b.x)
      return (
        <g key={d.id}>
          {FIB_LEVELS.map((lv) => {
            const price = pHigh - range * lv
            const y = seriesRef.current?.priceToCoordinate(price)
            if (y == null) return null
            return (
              <g key={String(lv)}>
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke={stroke}
                  strokeWidth={selected ? 1.5 : 1}
                  strokeOpacity={0.85}
                />
                <text x={x2 + 4} y={y + 3} fill={stroke} fontSize="10">
                  {(lv * 100).toFixed(1)}% {Number(price).toFixed(5)}
                </text>
              </g>
            )
          })}
        </g>
      )
    }
    return null
  }

  const interactive = tool !== "cursor" || dragRef.current || drawings.some((d) => !d.hidden)

  return (
    <svg
      className="absolute inset-0 z-10"
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: tool === "cursor" ? "auto" : "auto",
        cursor: tool === "cursor" ? (dragRef.current ? "grabbing" : "default") : "crosshair",
      }}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
    >
      <rect width="100%" height="100%" fill="transparent" pointerEvents={interactive ? "all" : "all"} />
      {all.map((d) => renderShape(d))}
    </svg>
  )
}

export function drawingsStorageKey(pair, timeframe) {
  return `altra-drawings:${pair}:${timeframe}`
}

export function loadDrawingsLocal(pair, timeframe) {
  try {
    const raw = localStorage.getItem(drawingsStorageKey(pair, timeframe))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveDrawingsLocal(pair, timeframe, drawings) {
  try {
    localStorage.setItem(drawingsStorageKey(pair, timeframe), JSON.stringify(drawings))
  } catch {
    /* quota */
  }
}
