export function StrategyMetricsPanel({ strategy, compact = false }) {
  if (!strategy) return null
  const designatedRR = strategy.designatedRR ?? strategy.rules?.minRR ?? 2
  const targetWR = strategy.targetWinRate ?? 50
  const bt = strategy.metrics?.backtest || strategy.performance || {}
  const demo = strategy.metrics?.demo || {}
  const rrMode = strategy.rrMode || "designated"
  const empirical =
    (demo.highProbabilityRR > 0 && demo.trades > 0
      ? demo.highProbabilityRR
      : bt.highProbabilityRR) || designatedRR

  return (
    <div
      className={
        compact
          ? "text-xs text-slate-400 space-y-1"
          : "rounded-xl border border-brand-slate/50 bg-brand-navy-light/40 p-4 space-y-3"
      }
    >
      {!compact && (
        <p className="text-sm font-medium text-white">RR & win-rate profile</p>
      )}
      <div className={compact ? "space-y-0.5" : "grid gap-2 sm:grid-cols-3 text-sm"}>
        <div>
          <p className="text-xs text-slate-500 uppercase">Designated</p>
          <p className="text-white">
            RR 1:{designatedRR} · target WR {targetWR}%
          </p>
          <p className="text-xs text-slate-500">Mode: {rrMode}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase">Backtest realized</p>
          <p className="text-white">
            WR {bt.winRate ?? 0}% · trades {bt.trades ?? 0}
          </p>
          <p className="text-xs text-slate-400">
            Avg RR {bt.avgRealizedRR ?? "—"} · hit designated{" "}
            {bt.designatedRRHitRate ?? "—"}% · likely RR{" "}
            {bt.highProbabilityRR ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase">Demo realized</p>
          {(demo.trades || 0) > 0 ? (
            <>
              <p className="text-white">
                WR {demo.winRate ?? 0}% · trades {demo.trades ?? 0}
              </p>
              <p className="text-xs text-slate-400">
                Avg RR {demo.avgRealizedRR ?? "—"} · hit designated{" "}
                {demo.designatedRRHitRate ?? "—"}% · likely RR{" "}
                {demo.highProbabilityRR ?? "—"}
              </p>
            </>
          ) : (
            <p className="text-slate-500 text-xs">No closed demo trades yet</p>
          )}
        </div>
      </div>
      {!compact && (
        <p className="text-xs text-slate-500">
          Effective RR for automation helpers: 1:
          {rrMode === "empirical" ? empirical : designatedRR} ({rrMode})
        </p>
      )}
    </div>
  )
}
