import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Upload,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { strategiesApi } from "@/api/strategies"

const STEP_META = [
  {
    order: 1,
    title: "Market Structure & Trend",
    hint: "Identify the overall trend on the higher timeframe. Look for consistent higher highs and higher lows (bullish) or lower highs and lower lows (bearish).",
  },
  {
    order: 2,
    title: "BOS + CHoCH",
    hint: "Wait for a clear Break of Structure (BOS) and Change of Character (CHoCH). This confirms the trend is still intact.",
  },
  {
    order: 3,
    title: "Key Confluence Zones",
    hint: "Look for the strongest order block or fair value gap in the direction of the trend. This is the ideal entry area.",
  },
  {
    order: 4,
    title: "Entry, Stop Loss, Take Profit & RR",
    hint: "Entry at the zone, Stop Loss beyond structure, Take Profit at 1:3 or better. Invalidation if CHoCH happens against the trend.",
  },
]

export default function StrategyBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [strategy, setStrategy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [name, setName] = useState("")
  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await strategiesApi.get(id)
      setStrategy(data.strategy)
      setName(data.strategy.name)
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load strategy")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const sourceType = strategy?.sourceType || "visual_steps"
  const allowsImages = sourceType === "visual_steps" || sourceType === "hybrid"
  const allowsVideo = sourceType === "video" || sourceType === "hybrid"
  const maxImagesPerStep = 3
  const maxVideoMinutes = sourceType === "hybrid" ? 8 : 12

  const stepData = strategy?.steps?.find((s) => s.order === currentStep) || {
    order: currentStep,
    explanation: "",
    images: [],
  }
  const meta = STEP_META.find((m) => m.order === currentStep)

  const progressPct = Math.round((currentStep / 4) * 100)

  const handleSaveStep = async () => {
    if (!strategy) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const steps = strategy.steps.map((s) =>
        s.order === currentStep
          ? { ...s, explanation: stepData.explanation }
          : s
      )
      const data = await strategiesApi.update(strategy._id, {
        name,
        steps,
      })
      setStrategy(data.strategy)
      setSuccess("Step saved")
      setTimeout(() => setSuccess(""), 2000)
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleExplanationChange = (value) => {
    setStrategy((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.order === currentStep ? { ...s, explanation: value } : s
      ),
    }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !strategy) return
    const currentCount = stepData.images?.length || 0
    if (currentCount + files.length > maxImagesPerStep) {
      setError(`Max ${maxImagesPerStep} images per step`)
      e.target.value = ""
      return
    }
    setUploading(true)
    setError("")
    try {
      const data = await strategiesApi.uploadStepImages(
        strategy._id,
        currentStep,
        files
      )
      setStrategy(data.strategy)
      setSuccess("Images uploaded")
      setTimeout(() => setSuccess(""), 2000)
    } catch (err) {
      setError(err?.response?.data?.message || "Image upload failed")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleRemoveImage = async (imageIndex) => {
    if (!strategy) return
    setUploading(true)
    setError("")
    try {
      const data = await strategiesApi.removeImage(
        strategy._id,
        currentStep,
        imageIndex
      )
      setStrategy(data.strategy)
    } catch (err) {
      setError(err?.response?.data?.message || "Remove failed")
    } finally {
      setUploading(false)
    }
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !strategy) return
    setUploading(true)
    setError("")
    try {
      const data = await strategiesApi.uploadVideo(strategy._id, file)
      setStrategy(data.strategy)
      setSuccess("Video uploaded")
      setTimeout(() => setSuccess(""), 2000)
    } catch (err) {
      setError(err?.response?.data?.message || "Video upload failed")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleSubmitReview = async () => {
    if (!strategy) return
    setSaving(true)
    setError("")
    try {
      await handleSaveStep()
      const data = await strategiesApi.submitReview(strategy._id)
      setStrategy(data.strategy)
      setSuccess(data.message || "Submitted for review")
      navigate(`/dashboard/strategies/${strategy._id}/review`)
    } catch (err) {
      setError(err?.response?.data?.message || "Submit failed")
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
        <p className="text-red-400">{error || "Strategy not found"}</p>
        <Link to="/dashboard/strategies">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to strategies
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/strategies")}
            className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            All strategies
          </button>
          <h1 className="text-2xl font-bold text-white">{strategy.name}</h1>
          <p className="text-sm text-slate-400">
            {sourceType === "visual_steps" && "Step-by-Step Visual · 1–3 images per step"}
            {sourceType === "hybrid" && `Hybrid · max 3 images/step · video ≤ ${maxVideoMinutes} min`}
            {sourceType === "video" && `Video-Only · video ≤ ${maxVideoMinutes} min · AI key frames later`}
            {" · "}
            <span className="capitalize">{strategy.status}</span>
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-400">
          <span>
            Step {currentStep} of 4 — {meta?.title}
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-brand-slate/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-brand-gold transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCurrentStep(n)}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                n <= currentStep ? "bg-brand-cyan" : "bg-brand-slate/40"
              }`}
              title={`Step ${n}`}
            />
          ))}
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

      <Card>
        <CardHeader>
          <CardTitle>
            Step {currentStep}: {meta?.title}
          </CardTitle>
          <CardDescription>{meta?.hint}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="strat-name">Strategy name</Label>
            <Input
              id="strat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={strategy.status === "disabled"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation for this step</Label>
            <textarea
              id="explanation"
              value={stepData.explanation || ""}
              onChange={(e) => handleExplanationChange(e.target.value)}
              rows={5}
              disabled={strategy.status === "disabled"}
              className="flex w-full rounded-lg border border-brand-slate bg-brand-navy-light/80 px-4 py-3 text-sm text-brand-silver placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-brand-cyan"
              placeholder="Describe what the trader should see and do on this step..."
            />
          </div>

          {allowsImages && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>
                  Chart images ({stepData.images?.length || 0}/{maxImagesPerStep})
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    uploading ||
                    strategy.status === "disabled" ||
                    (stepData.images?.length || 0) >= maxImagesPerStep
                  }
                  onClick={() => imageInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload images
                </Button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(stepData.images || []).map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg border border-brand-slate/60 overflow-hidden bg-brand-navy aspect-video"
                  >
                    <img
                      src={img.url}
                      alt={`Step ${currentStep} image ${idx + 1}`}
                      className="h-full w-full object-contain"
                    />
                    {strategy.status !== "disabled" && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 rounded-md bg-red-600/90 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-white" />
                      </button>
                    )}
                  </div>
                ))}
                {(stepData.images?.length || 0) === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-10 rounded-lg border border-dashed border-brand-slate text-slate-500">
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <p className="text-sm">
                      {sourceType === "visual_steps"
                        ? "Add 1–3 clean chart screenshots for this step"
                        : "Optional supporting images (max 3) for hybrid"}
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Annotation-ready: draw boxes/arrows on your chart before upload, or add notes in the explanation.
                Full in-app annotation canvas ships with the Chart Workspace phase.
              </p>
            </div>
          )}

          {allowsVideo && currentStep === 1 && (
            <div className="space-y-3 border-t border-brand-slate/40 pt-6">
              <div className="flex items-center justify-between">
                <Label>
                  Strategy video (max ~{maxVideoMinutes} minutes recommended)
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploading || strategy.status === "disabled"}
                  onClick={() => videoInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Video className="h-4 w-4" />
                  )}
                  Upload video
                </Button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoUpload}
                />
              </div>
              {strategy.video?.url ? (
                <div className="rounded-lg border border-brand-slate/60 overflow-hidden bg-black">
                  <video
                    src={strategy.video.url}
                    controls
                    className="w-full max-h-64"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 rounded-lg border border-dashed border-brand-slate text-slate-500">
                  <Video className="h-8 w-8 mb-2" />
                  <p className="text-sm">
                    {sourceType === "video"
                      ? "Required: upload your strategy tutorial video"
                      : "Upload a short tutorial video (hybrid)"}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={currentStep <= 1}
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={saving || strategy.status === "disabled"}
            onClick={handleSaveStep}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save step
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={async () => {
                await handleSaveStep()
                setCurrentStep((s) => Math.min(4, s + 1))
              }}
              disabled={saving || strategy.status === "disabled"}
            >
              Next step
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={saving || strategy.status === "disabled" || strategy.status === "review"}
              onClick={handleSubmitReview}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Submit for review
            </Button>
          )}
        </div>
      </div>

      {strategy.status === "review" && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4 text-sm text-amber-200">
            This strategy is in <strong>review</strong>. OpenRouter vision analysis (confidence
            scoring, structured rules, side-by-side comparison) runs in Phase 4. You can still open
            the builder to view your steps.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
