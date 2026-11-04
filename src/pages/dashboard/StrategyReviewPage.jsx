import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { strategiesApi } from "@/api/strategies"
import { StrategyMetricsPanel } from "@/components/StrategyMetricsPanel"
import { AutoSignalControls } from "@/components/AutoSignalControls"
import { visionApi } from "@/api/vision"

function confidenceColor(score) {
  if (score >= 80) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
  if (score >= 50) return "text-amber-300 border-amber-500/40 bg-amber-500/10"
  return "text-red-400 border-red-500/40 bg-red-500/10"
}

function confidenceLabel(score) {
  if (score >= 80) return "Ready"
  if (score >= 50) return "Needs attention"
  return "Major review required"
}

export default function StrategyReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [strategy, setStrategy] = useState(null)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [targets, setTargets] = useState({ designatedRR: "2", targetWinRate: "50", rrMode: "designated" })
  const [rules, setRules] = useState({
    entry: "",
    stopLoss: "",
    takeProfit: "",
    minRR: "",
    direction: "long_short",
  })
  const [corrections, setCorrections] = useState({})

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const sData = await strategiesApi.get(id)
      const s = sData.strategy
      setStrategy(s)
      const r = s.rules || {}
      setRules({
        entry: r.entry || "",
        stopLoss: r.stopLoss || "",
        takeProfit: r.takeProfit || "",
        minRR: String(s.designatedRR || r.minRR || 2),
        direction: r.direction || "long_short",
      })
      setTargets({
        designatedRR: String(s.designatedRR || r.minRR || 2),
        targetWinRate: String(s.targetWinRate || 50),
        rrMode: s.rrMode || "designated",
      })
      const corr = {}
      ;(sData.strategy.steps || []).forEach((st) => {
        corr[st.order] = st.userCorrections || ""
      })
      setCorrections(corr)
      try {
        const jData = await visionApi.getJob(id)
        setJob(jData.job)
      } catch {
        setJob(null)
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load strategy")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const runAnalysis = async (force = false) => {
    setAnalyzing(true)
    setError("")
    setSuccess("")
    try {
      const data = await visionApi.analyze(id, { force })
      setJob(data.job)
      setStrategy(data.strategy)
      const r = data.strategy.rules || {}
      setRules({
        entry: r.entry || "",
        stopLoss: r.stopLoss || "",
        takeProfit: r.takeProfit || "",
        minRR: r.minRR || s.designatedRR || "",

        direction: r.direction || "long_short",
      })
      setSuccess(
        data.cached
          ? "Loaded cached vision result"
          : data.offline
            ? "Offline analysis (configure OPENROUTER_API_KEY for live vision)"
            : "Vision analysis complete"
      )
    } catch (err) {
      setError(err?.response?.data?.message || "Analysis failed")
    } finally {
      setAnalyzing(false)
    }
  }

  const saveReview = async (approve) => {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const steps = Object.keys(corrections).map((order) => ({
        order: Number(order),
        userCorrections: corrections[order],
      }))
      const data = await visionApi.saveReview(id, {
        steps,
        rules,
        plottedLevels: strategy?.plottedLevels,
        approve,
      })
      setStrategy(data.strategy)
      setSuccess(approve ? "Strategy approved" : "Corrections saved")
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    )
  }

  if (!strategy) {
    return (
      <div className="space-y-4">
        <p className="text-red-400">{error || "Not found"}</p>
        <Link to="/dashboard/strategies">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>
    )
  }

  const score = strategy.overallConfidence || job?.overallConfidence || 0
  const breakdown = job?.confidenceBreakdown
  const structured = job?.structuredResult

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/dashboard/strategies/${id}`)}
            className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to builder
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-gold" />
            Analysis & Review
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {strategy.name} · {strategy.status} · OpenRouter only · one model per task
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={analyzing}
            onClick={() => runAnalysis(false)}
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Run analysis
          </Button>
          <Button
            variant="ghost"
            disabled={analyzing}
            onClick={() => runAnalysis(true)}
          >
            <RefreshCw className="h-4 w-4" />
            Force re-analyze
          </Button>
        </div>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={`border ${confidenceColor(score)}`}>
          <CardContent className="py-5">
            <p className="text-xs uppercase tracking-wide opacity-80">Confidence</p>
            <p className="text-3xl font-bold mt-1">{score}</p>
            <p className="text-sm mt-1">{confidenceLabel(score)}</p>
          </CardContent>
        </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Performance targets (RR / WR)</CardTitle>
              <CardDescription>
                Designated RR is used in backtests and as the default for future auto-signals.
                Empirical mode prefers the RR your strategy has realized most often in testing.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Designated RR (reward : 1 risk)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={targets.designatedRR}
                  onChange={(e) => setTargets((t) => ({ ...t, designatedRR: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Target win rate %</Label>
                <Input
                  type="number"
                  value={targets.targetWinRate}
                  onChange={(e) => setTargets((t) => ({ ...t, targetWinRate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>RR mode</Label>
                <select
                  value={targets.rrMode}
                  onChange={(e) => setTargets((t) => ({ ...t, rrMode: e.target.value }))}
                  className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver"
                >
                  <option value="designated">Designated RR</option>
                  <option value="empirical">High-probability (empirical)</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const data = await strategiesApi.updateMetricsTargets(id, {
                        designatedRR: Number(targets.designatedRR),
                        targetWinRate: Number(targets.targetWinRate),
                        rrMode: targets.rrMode,
                      })
                      setStrategy(data.strategy)
                      setRules((r) => ({ ...r, minRR: String(data.strategy.designatedRR) }))
                    } catch (err) {
                      setError(err?.response?.data?.message || "Failed to save targets")
                    }
                  }}
                >
                  Save targets
                </Button>
              </div>
              <div className="sm:col-span-3">
                <StrategyMetricsPanel strategy={strategy} />
              <div className="sm:col-span-3 mt-4">
                <Card>
          <CardHeader>
            <CardTitle className="text-base">Automatic signals</CardTitle>
            <CardDescription>
              When enabled, the system evaluates this strategy on a schedule and runs the same safety
              checks as the Terminal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AutoSignalControls strategy={strategy} onUpdated={setStrategy} />
          </CardContent>
        </Card>
              </div>
              </div>
            </CardContent>
          </Card>

        <Card>
          <CardContent className="py-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Model</p>
            <p className="text-lg font-semibold text-white mt-1">
              {job?.modelName || job?.modelId || "—"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {job?.cached ? "Cache hit" : job ? "Fresh run" : "Not analyzed yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Breakdown</p>
            {breakdown ? (
              <ul className="mt-2 text-xs text-slate-400 space-y-1 max-h-24 overflow-y-auto">
                {(breakdown.reasons || []).map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 mt-2">Run analysis to score</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Side-by-side steps */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-white">Side-by-side comparison</h2>
        {(strategy.steps || []).map((step) => {
          const aiStep = (structured?.steps || []).find((s) => s.order === step.order)
          return (
            <Card key={step.order}>
              <CardHeader>
                <CardTitle className="text-base">Step {step.order}</CardTitle>
                <CardDescription>
                  Original · AI interpretation · Your corrections
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-brand-cyan uppercase">Original</p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap min-h-[80px]">
                    {step.explanation || "—"}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(step.images || []).map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={`Step ${step.order} ${idx + 1}`}
                        className="rounded-md border border-brand-slate/50 object-contain max-h-28 w-full bg-black"
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-brand-gold uppercase">AI interpretation</p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap min-h-[80px]">
                    {aiStep?.summary || step.aiInterpretation || "Run analysis to populate"}
                  </p>
                  {aiStep?.patterns && (
                    <p className="text-xs text-slate-500">
                      Patterns: {aiStep.patterns.join(", ")}
                    </p>
                  )}
                  {aiStep?.levels && (
                    <p className="text-xs text-slate-500">
                      Entry: {aiStep.levels.entry || "—"} · SL: {aiStep.levels.stopLoss || "—"} · TP:{" "}
                      {aiStep.levels.takeProfit || "—"}
                    </p>
                  )}
                  {typeof (aiStep?.confidence ?? step.confidence) === "number" && (
                    <p className="text-xs text-slate-400">
                      Step confidence: {aiStep?.confidence ?? step.confidence}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-emerald-400 uppercase">Your corrections</p>
                  <textarea
                    value={corrections[step.order] || ""}
                    onChange={(e) =>
                      setCorrections((prev) => ({
                        ...prev,
                        [step.order]: e.target.value,
                      }))
                    }
                    rows={6}
                    className="flex w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-3 py-2 text-sm text-brand-silver focus:outline-none focus:ring-2 focus:ring-brand-cyan/50"
                    placeholder="Correct levels, rules, or notes for this step..."
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Executable rules (human-approved)</CardTitle>
          <CardDescription>
            Edit AI-extracted rules before approval. Nothing goes live without your confirmation.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Entry</Label>
            <Input
              value={rules.entry}
              onChange={(e) => setRules((r) => ({ ...r, entry: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Stop loss</Label>
            <Input
              value={rules.stopLoss}
              onChange={(e) => setRules((r) => ({ ...r, stopLoss: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Take profit</Label>
            <Input
              value={rules.takeProfit}
              onChange={(e) => setRules((r) => ({ ...r, takeProfit: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Min RR</Label>
            <Input
              value={rules.minRR}
              onChange={(e) => setRules((r) => ({ ...r, minRR: e.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Direction</Label>
            <select
              value={rules.direction}
              onChange={(e) => setRules((r) => ({ ...r, direction: e.target.value }))}
              className="flex h-11 w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 text-sm text-brand-silver focus:outline-none focus:ring-2 focus:ring-brand-cyan/50"
            >
              <option value="long">Long only</option>
              <option value="short">Short only</option>
              <option value="long_short">Long & Short</option>
            </select>
          </div>
          {structured?.overallSummary && (
            <div className="sm:col-span-2 rounded-lg border border-brand-slate/50 bg-brand-navy/50 p-4 text-sm text-slate-300">
              <p className="text-xs text-slate-500 mb-1">AI overall summary</p>
              {structured.overallSummary}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" disabled={saving} onClick={() => saveReview(false)}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save corrections
        </Button>
        <Button disabled={saving || score < 50} onClick={() => saveReview(true)}>
          <CheckCircle2 className="h-4 w-4" />
          Approve strategy
        </Button>
        {score < 50 && (
          <p className="text-xs text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Confidence below 50 — review carefully before approving
          </p>
        )}
      </div>
    </div>
  )
}
