import { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  BrainCircuit,
  Shield,
  LineChart,
  Zap,
  Eye,
  Lock,
  ArrowRight,
  CheckCircle2,
  Play,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge"
import logoWordmark from "@/assets/logo-wordmark.png"
import logoSymbol from "@/assets/logo-symbol.png"

const features = [
  {
    icon: BrainCircuit,
    title: "AI Vision Strategy Builder",
    description:
      "Upload charts or short videos. Our OpenRouter vision models extract rules, levels, and structure with human-in-the-loop review.",
  },
  {
    icon: Shield,
    title: "Risk & Session Controls",
    description:
      "Session filters, prop-firm limits, news auto-skip, dynamic SL protection, and one-strategy-per-account discipline.",
  },
  {
    icon: LineChart,
    title: "Live Chart Workspace",
    description:
      "TradingView Lightweight Charts with RR boxes, entry/SL/TP overlays, news impact alerts, and profit-lock status.",
  },
  {
    icon: Zap,
    title: "Broker Connections",
    description:
      "MetaApi cloud terminals for MT4/MT5 + native OANDA/IBKR. Connect, assign one strategy, and trade with full audit.",
  },
  {
    icon: Eye,
    title: "Transparent AI",
    description:
      "Side-by-side original vs AI interpretation vs your corrections. Confidence scoring. Full audit trail on every decision.",
  },
  {
    icon: Lock,
    title: "Demo-First Safety",
    description:
      "Mandatory demo practice, configurable promotion gates, kill switches, and all smart adjustments OFF by default.",
  },
]

const steps = [
  {
    number: "01",
    title: "Build Your Strategy",
    description: "4-step guided visual, hybrid, or video builder. AI extracts rules; you approve every level.",
  },
  {
    number: "02",
    title: "Connect & Constrain",
    description: "Link a demo or prop account. Set sessions, direction, pairs, and risk limits once.",
  },
  {
    number: "03",
    title: "Review & Promote",
    description: "Backtest, paper trade, then promote only when expectancy and drawdown criteria are met.",
  },
  {
    number: "04",
    title: "Trade with Oversight",
    description: "Live terminal, news filters, optional dynamic SL, and real-time performance analytics.",
  },
]

const freeFeatures = [
  "Qwen3-VL, Gemma 4, Nemotron free models",
  "Full 4-step strategy builder",
  "Demo broker connections",
  "Session & news filters",
  "Backtesting engine",
  "Collapsible dashboard",
]

const proFeatures = [
  "Claude 4 Opus, Gemini 2.5 Pro, Grok vision",
  "Live & prop-firm account routing",
  "Risk Adjustment Engine + Profit Lock",
  "Priority OpenRouter throughput",
  "Admin model switching",
  "Full analytics & audit logs",
]

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
}

export default function LandingPage() {
  const [billing, setBilling] = useState("free")

  return (
    <div className="min-h-screen bg-brand-navy text-brand-silver overflow-x-hidden">
      <header className="fixed top-0 inset-x-0 z-50 border-b border-brand-slate/40 bg-brand-navy/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoSymbol} alt="Altra-AuraTrade symbol" className="h-9 w-9 rounded-lg" />
            <img src={logoWordmark} alt="Altra-AuraTrade" className="hidden h-8 sm:block object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <MarketStatusBadge className="hidden lg:inline-flex" />
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero with video + still fallback */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-bg.jpg"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/70 via-brand-navy/80 to-brand-navy" />
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 h-96 w-96 rounded-full bg-brand-cyan/20 blur-[100px] animate-pulse-glow" />
          <div className="absolute bottom-1/3 right-1/4 h-80 w-80 rounded-full bg-brand-gold/15 blur-[90px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-1.5 text-xs font-medium text-brand-cyan">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Assisted Forex · Human Oversight · Risk First
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Trade with{" "}
              <span className="text-gradient-gold">Intelligence</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-slate-300 leading-relaxed">
              Altra-AuraTrade turns your chart ideas into disciplined, risk-controlled strategies.
              Vision AI extracts the rules. You keep the final say. Every trade is audited.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="min-w-[180px]">
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="min-w-[180px]">
                  <Play className="h-4 w-4" />
                  See How It Works
                </Button>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-16 flex flex-wrap justify-center gap-3"
          >
            {["4-Step Vision Builder", "OpenRouter Models", "MetaApi Brokers", "News Filter", "Prop Firm Ready"].map(
              (label) => (
                <span
                  key={label}
                  className="rounded-full border border-brand-slate/60 bg-brand-navy-light/70 px-4 py-1.5 text-xs font-medium text-slate-300 backdrop-blur"
                >
                  {label}
                </span>
              )
            )}
          </motion.div>
        </div>
      </section>

      <section id="features" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Built for disciplined traders
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-slate-400">
              Every capability is designed to maximize positive expectancy while keeping losses
              minimal through structure, risk controls, and human oversight.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="group rounded-2xl border border-brand-slate/50 bg-brand-navy-light/40 p-6 backdrop-blur transition-all hover:border-brand-cyan/40 hover:bg-brand-navy-light/70"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan group-hover:glow-cyan transition-all">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative py-24 sm:py-32 bg-brand-navy-light/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">How Altra-AuraTrade works</h2>
            <p className="mt-4 max-w-2xl mx-auto text-slate-400">
              From idea to live trade in four clear stages — always with your approval.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                className="relative rounded-2xl border border-brand-slate/40 bg-brand-navy/50 p-6"
              >
                <div className="text-5xl font-bold text-brand-gold/25 mb-3">{s.number}</div>
                <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Simple, transparent pricing</h2>
            <p className="mt-4 text-slate-400">
              Free models by default. Upgrade when you need frontier vision performance.
            </p>
          </motion.div>

          <div className="mb-10 flex justify-center">
            <div className="inline-flex rounded-full border border-brand-slate/60 bg-brand-navy-light/60 p-1">
              <button
                type="button"
                onClick={() => setBilling("free")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  billing === "free"
                    ? "bg-brand-cyan text-brand-navy"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Free models
              </button>
              <button
                type="button"
                onClick={() => setBilling("pro")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  billing === "pro"
                    ? "bg-gradient-to-r from-brand-gold to-brand-amber text-brand-navy"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Pro / Live
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <motion.div
              {...fadeUp}
              className={`rounded-2xl border p-8 transition-all ${
                billing === "free"
                  ? "border-brand-cyan/50 bg-brand-navy-light/60 ring-1 ring-brand-cyan/30"
                  : "border-brand-slate/50 bg-brand-navy-light/40"
              }`}
            >
              <h3 className="text-xl font-semibold text-white">Research / Demo</h3>
              <p className="mt-1 text-3xl font-bold text-brand-cyan">Free</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                {freeFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-cyan shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="mt-8 block">
                <Button variant={billing === "free" ? "secondary" : "outline"} className="w-full">
                  Start Free
                </Button>
              </Link>
            </motion.div>

            <motion.div
              {...fadeUp}
              className={`rounded-2xl border p-8 relative overflow-hidden transition-all ${
                billing === "pro"
                  ? "border-brand-gold/50 bg-gradient-to-b from-brand-gold/15 to-brand-navy-light/50 ring-1 ring-brand-gold/30"
                  : "border-brand-gold/30 bg-gradient-to-b from-brand-gold/10 to-brand-navy-light/40"
              }`}
            >
              <div className="absolute top-4 right-4 rounded-full bg-brand-gold/20 px-3 py-0.5 text-xs font-semibold text-brand-gold">
                Recommended
              </div>
              <h3 className="text-xl font-semibold text-white">Pro / Live</h3>
              <p className="mt-1 text-3xl font-bold text-gradient-gold">Custom</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                {proFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-gold shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="mt-8 block">
                <Button className="w-full">Get Started</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to trade with structure?
            </h2>
            <p className="mt-4 text-slate-400">
              Join Altra-AuraTrade and turn your edge into a controlled, auditable system.
            </p>
            <Link to="/register" className="mt-8 inline-block">
              <Button size="lg">
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-brand-slate/40 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoSymbol} alt="" className="h-8 w-8 rounded-lg" />
            <span className="text-sm text-slate-500">© 2026 Altra-AuraTrade. Trade with Intelligence.</span>
          </div>
          <p className="text-xs text-slate-600 max-w-md text-center sm:text-right">
            This platform is an AI assistant, not a guarantee of profit. Always practice risk management.
            Past performance does not guarantee future results.
          </p>
        </div>
      </footer>
    </div>
  )
}
