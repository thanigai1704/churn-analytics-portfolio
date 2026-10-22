import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowRight, Crosshair, Target, TrendingDown } from 'lucide-react'
import {
  churnReasons,
  churnSummary,
  churnTrend,
  funnelStages,
  inactivity,
  journeyFlow,
  recommendations,
  riskDistribution,
} from '../data/analytics'
import GlassCard from './ui/GlassCard'
import Reveal from './ui/Reveal'
import SectionHeading from './ui/SectionHeading'

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string | number
}

function TrendTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl border border-white/10 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-200">{label}</p>
      <p className="mt-0.5 font-bold text-coral-brand">{payload[0]?.value}%</p>
    </div>
  )
}

function RadialGauge({
  value,
  label,
  color,
  delay,
}: {
  value: number
  label: string
  color: string
  delay: number
}) {
  const radius = 46
  const circumference = Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="130" height="76" viewBox="0 0 130 76">
          <path
            d="M 15 68 A 50 50 0 0 1 115 68"
            fill="none"
            stroke="rgba(148,163,184,0.15)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <motion.path
            d="M 15 68 A 50 50 0 0 1 115 68"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ delay, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="font-display text-2xl font-bold" style={{ color }}>
            {value}%
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-slate-400">{label}</p>
    </div>
  )
}

function Funnel() {
  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      {funnelStages.map((stage, i) => {
        const width = 30 + (stage.value / 100) * 62
        return (
          <div key={stage.label} className="flex w-full flex-col items-center">
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: `${width}%`, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex h-12 items-center justify-center overflow-hidden rounded-lg"
              style={{
                background: `linear-gradient(90deg, rgba(0,229,255,0.9), rgba(139,92,246,0.85))`,
                clipPath: i < funnelStages.length - 1 ? 'polygon(3% 0, 100% 0, 97% 100%, 0 100%)' : undefined,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
              <div className="relative flex w-full items-center justify-between px-5">
                <span className="text-xs font-bold text-navy">{stage.label}</span>
                <span className="rounded-full bg-navy/25 px-2.5 py-0.5 text-[11px] font-bold text-white">
                  {stage.value}%
                </span>
              </div>
            </motion.div>
            {i < funnelStages.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 + 0.3 }}
                className="flex items-center gap-1 py-0.5 text-[10px] font-semibold text-slate-500"
              >
                <TrendingDown className="h-3 w-3" />
                -{100 - Math.round((stage.value / funnelStages[0].value) * 100)}% vs first purchase
              </motion.div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ChurnInsights() {
  return (
    <section id="churn" className="relative px-5 py-24 sm:px-8">
      <div className="absolute left-0 top-32 h-80 w-80 rounded-full bg-coral-brand/8 blur-[130px]" />
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Churn & Inactivity Insights"
          title="Understanding the"
          highlight="Silent Churn"
          description="A transparent, rule-based scorecard built on recency and frequency thresholds classifies every customer's separation status. No black-box model — every band is auditable with three lines of SQL, and thresholds come from the observed inter-purchase gap distribution."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Reveal delay={0.1}>
            <GlassCard className="h-full p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-coral-brand" />
                <h3 className="font-display text-base font-bold text-softwhite">Risk Distribution</h3>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {riskDistribution.map((risk, i) => (
                  <RadialGauge
                    key={risk.name}
                    value={risk.value}
                    label={risk.name}
                    color={risk.color}
                    delay={0.2 + i * 0.2}
                  />
                ))}
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                Transparent recency rules − not a trained model: active ≤60 days → Low, silent
                61–180 days → Medium, silent &gt;180 days → High. Every band is auditable in SQL
                (see the audit card below).
              </p>
              <div className="mt-6 space-y-3">
                {churnReasons.map((reason, i) => (
                  <div key={reason.label}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{reason.label}</span>
                      <span className="font-bold text-softwhite">{reason.value}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${reason.value * 2.6}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
                        className="h-full rounded-full bg-gradient-to-r from-coral-brand to-amber-brand"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                Top driver: <span className="font-semibold text-coral-brand">34.5% of customers buy
                once and never return</span> — best addressed with a second-purchase incentive, not
                blanket discounts.
              </p>
              <div className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-slate-500">
                <span className="font-semibold text-slate-300">Why these thresholds:</span> the
                median gap between purchases is <span className="font-bold text-softwhite">{inactivity.medianGapDays} days</span>{' '}
                (90th percentile {inactivity.p90GapDays} days). Only{' '}
                <span className="font-bold text-softwhite">{inactivity.gapOver180Pct}%</span> of observed
                gaps are longer than 180 days, and <span className="font-bold text-softwhite">{inactivity.inactive180}</span>{' '}
                customers ({inactivity.inactive180Pct}%) are currently silent that long — that band is
                treated as separated, not a one-month blip.
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.2} className="lg:col-span-2">
            <GlassCard className="flex h-full flex-col p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-softwhite">Monthly Non-Return Trend</h3>
                  <p className="text-xs text-slate-500">Customers active in month M who don't return in M+1 · Dec 2010 – Oct 2011</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-coral-brand" /> Non-return rate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-brand" /> Target
                  </span>
                </div>
              </div>
              <div className="mt-4 h-72 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={churnTrend} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="churnFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF5A5F" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#FF5A5F" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      unit="%"
                      domain={[0, 80]}
                    />
                    <Tooltip content={<TrendTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="#FF5A5F"
                      strokeWidth={2.5}
                      fill="url(#churnFill)"
                      dot={{ r: 3, fill: '#FF5A5F', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#FF5A5F', stroke: '#0B1020', strokeWidth: 2 }}
                    />
                    <ReferenceLine
                      y={churnSummary.target}
                      stroke="#10B981"
                      strokeDasharray="6 4"
                      label={{
                        value: `Target ${churnSummary.target}%`,
                        position: 'insideBottomLeft',
                        fill: '#10B981',
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-slate-600">
                A single month missed does not mean a customer is gone for good — this series is read
                for trend direction. Definitive separations use the 90/180-day recency cutoffs above.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'Peak rate', value: `${churnSummary.peak.rate}%`, note: churnSummary.peak.month, color: 'text-coral-brand' },
                  { label: 'Current', value: `${churnSummary.current.rate}%`, note: churnSummary.current.month, color: 'text-amber-brand' },
                  { label: 'Trajectory', value: `−${churnSummary.trajectory}pts`, note: 'YTD', color: 'text-emerald-brand' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {stat.label}
                    </p>
                    <p className={`mt-1 font-display text-lg font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-slate-600">{stat.note}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </Reveal>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal delay={0.15}>
            <GlassCard className="h-full p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-purple-brand" />
                <h3 className="font-display text-base font-bold text-softwhite">
                  Acquisition-to-Loyalty Funnel
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {funnelStages[1].value}% of buyers return —{' '}
                {funnelStages[4].value}% become advocates
              </p>
              <Funnel />
            </GlassCard>
          </Reveal>

          <Reveal delay={0.25}>
            <GlassCard className="h-full p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-softwhite">
                    Customer Journey Flow
                  </h3>
                  <p className="text-xs text-slate-500">
                    From first purchase to advocacy at 4,338-customer scale
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {journeyFlow.map((stage, i) => (
                  <div key={stage.stage}>
                    <div className="flex items-center gap-3">
                      <motion.span
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.12, type: 'spring', stiffness: 200 }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-navy"
                        style={{ background: stage.color, boxShadow: `0 0 14px ${stage.color}66` }}
                      >
                        {i + 1}
                      </motion.span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-softwhite">{stage.stage}</span>
                          <span className="font-bold" style={{ color: stage.color }}>
                            {stage.pct}%
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-[11px] text-slate-500">{stage.from}</p>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${stage.pct}%` }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 + i * 0.12, duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${stage.color}, #00E5FF)` }}
                          />
                        </div>
                      </div>
                    </div>
                    {i < journeyFlow.length - 1 && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + i * 0.12, duration: 0.4 }}
                        className="ml-[17px] mt-1 h-4 w-px origin-top bg-gradient-to-b from-white/25 to-white/5"
                      />
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="mt-14">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-display text-xl font-bold text-softwhite sm:text-2xl">
              Business Recommendations
            </h3>
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-brand/30 bg-emerald-brand/10 px-3 py-1 text-[11px] font-semibold text-emerald-brand sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-brand animate-pulse" />
              Real data · UCI Online Retail
            </span>
          </div>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recommendations.map((rec, i) => (
            <Reveal key={rec.title} delay={i * 0.08}>
              <div className="group h-full">
                <GlassCard className="flex h-full flex-col p-5">
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl font-display text-sm font-bold"
                      style={{ background: `${rec.color}18`, color: rec.color }}
                    >
                      0{i + 1}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                      style={{ background: `${rec.color}15`, color: rec.color }}
                    >
                      {rec.impact}
                    </span>
                  </div>
                  <h4 className="mt-4 font-display text-base font-bold text-softwhite transition-colors duration-300 group-hover:text-cyan-brand">
                    {rec.title}
                  </h4>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-400">{rec.body}</p>
                  <span className="mt-4 flex items-center gap-1 text-[11px] font-semibold transition-colors duration-300" style={{ color: rec.color }}>
                    View execution plan
                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </GlassCard>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
