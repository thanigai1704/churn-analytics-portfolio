import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, Flame } from 'lucide-react'
import {
  cohortCustomers,
  cohortMatrix,
  cohortMonths,
  recoverableLtv,
  retentionCurve,
} from '../data/analytics'
import GlassCard from './ui/GlassCard'
import Reveal from './ui/Reveal'
import SectionHeading from './ui/SectionHeading'

const COLOR_HIGH = { r: 0, g: 229, b: 255 }
const COLOR_LOW = { r: 38, g: 48, b: 84 }

function heatColor(value: number) {
  const t = Math.min(1, Math.max(0, value / 80))
  const r = Math.round(COLOR_LOW.r + (COLOR_HIGH.r - COLOR_LOW.r) * t)
  const g = Math.round(COLOR_LOW.g + (COLOR_HIGH.g - COLOR_LOW.g) * t)
  const b = Math.round(COLOR_LOW.b + (COLOR_HIGH.b - COLOR_LOW.b) * t)
  return { rgb: `rgb(${r}, ${g}, ${b})`, rgba: `rgba(${r}, ${g}, ${b}, 0.92)` }
}

function textColor(value: number) {
  return value > 52 ? '#0B1020' : '#A5B4D0'
}

const m1Avg = retentionCurve[1].rate
const m1Dropoff = Math.round(100 - m1Avg)

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string | number }>
  label?: string | number
}

function CurveTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const isTarget = payload[0]?.dataKey === 'target'
  return (
    <div className="glass rounded-xl border border-white/10 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-200">
        {isTarget ? 'Target' : 'Retention'} · {label}
      </p>
      <p className={`mt-0.5 font-bold ${isTarget ? 'text-emerald-brand' : 'text-cyan-brand'}`}>
        {payload[0]?.value}%
      </p>
    </div>
  )
}

function BarTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl border border-white/10 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-200">{label}</p>
      <p className="mt-0.5 font-bold text-softwhite">{payload[0]?.value}% retained</p>
    </div>
  )
}

export default function CohortAnalysis() {
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null)
  const [focusMonth1, setFocusMonth1] = useState(true)

  const visibleCols = useMemo(
    () => (focusMonth1 ? [0, 1, 2, 3] : Array.from({ length: 12 }, (_, i) => i)),
    [focusMonth1],
  )

  const activeCell = hovered
    ? {
        cohort: cohortMonths[hovered.row],
        month: hovered.col,
        value: cohortMatrix[hovered.row][hovered.col],
        customers: cohortCustomers[hovered.row][hovered.col],
      }
    : null

  return (
    <section id="cohort" className="relative px-5 py-24 sm:px-8">
      <div className="absolute left-1/2 top-24 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-cyan-brand/8 blur-[130px]" />
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Cohort Retention Analysis"
          title="Where Customers"
          highlight="Disappear"
          description="Each row tracks a monthly acquisition cohort. Reading across, you watch the same customers fade — and the month where it happens tells you exactly where to intervene."
        />

        <Reveal delay={0.1} className="mt-8">
          <div className="flex items-center justify-center">
            <div className="glass inline-flex rounded-xl border border-white/10 p-1">
              {[
                { key: true, label: 'Month 1 Focus' },
                { key: false, label: 'Full 12-Month View' },
              ].map((opt) => (
                <button
                  key={String(opt.key)}
                  onClick={() => setFocusMonth1(opt.key)}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                    focusMonth1 === opt.key
                      ? 'bg-gradient-to-r from-cyan-brand to-purple-brand text-navy shadow-glow-cyan'
                      : 'text-slate-400 hover:text-softwhite'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Reveal delay={0.15} className="lg:col-span-3">
            <GlassCard className="p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-softwhite">
                    Retention Heatmap Matrix
                  </h3>
                  <p className="text-xs text-slate-500">Hover any cell for exact values</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="font-semibold text-cyan-brand">100%</span>
                  <span className="h-2 w-24 rounded-full bg-gradient-to-r from-[#263054] to-[#00E5FF]" />
                  <span className="font-semibold text-slate-500">15%</span>
                </div>
              </div>

              {activeCell && activeCell.value !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 flex items-center gap-3 rounded-xl border border-cyan-brand/20 bg-cyan-brand/5 px-4 py-3"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: heatColor(activeCell.value).rgb }}
                  />
                  <p className="text-sm text-slate-300">
                    <span className="font-bold text-softwhite">{activeCell.cohort} cohort</span>
                    {' · '}Month {activeCell.month}
                    <span className="mx-2 text-slate-600">|</span>
                    <span className="font-bold text-cyan-brand">{activeCell.value}%</span> retained
                    <span className="mx-2 text-slate-600">|</span>
                    <span className="font-bold text-purple-brand">
                      {activeCell.customers?.toLocaleString()}
                    </span>{' '}
                    customers
                  </p>
                </motion.div>
              )}

              <div className="overflow-x-auto pb-2">
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `64px repeat(${visibleCols.length}, minmax(46px, 1fr))` }}
                >
                  <div className="pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Cohort
                  </div>
                  {visibleCols.map((col) => (
                    <div
                      key={col}
                      className={`pb-1 text-center text-[10px] font-semibold uppercase tracking-wider ${
                        col === 1 ? 'text-coral-brand' : 'text-slate-500'
                      }`}
                    >
                      M{col}
                      {col === 1 && (
                        <span className="ml-1 inline-block h-1 w-1 rounded-full bg-coral-brand" />
                      )}
                    </div>
                  ))}

                  {cohortMonths.map((cohort, row) =>
                    visibleCols.map((col) => {
                      const value = cohortMatrix[row][col]
                      const isM1 = col === 1
                      const isHovered = hovered?.row === row && hovered?.col === col

                      if (value === null) {
                        return (
                          <div
                            key={`${cohort}-${col}`}
                            className="flex items-center justify-center rounded-md bg-white/[0.02] p-1.5 text-center text-[10px] font-semibold text-slate-700"
                            title={`${cohort} · Month ${col}: outside observation window`}
                          >
                            —
                          </div>
                        )
                      }

                      const cell = heatColor(value)
                      return (
                        <div
                          key={`${cohort}-${col}`}
                          onMouseEnter={() => setHovered({ row, col })}
                          onMouseLeave={() => setHovered(null)}
                          className="relative cursor-pointer rounded-md p-1.5 text-center text-[11px] font-semibold transition-transform duration-150 hover:scale-110"
                          style={{
                            background: cell.rgba,
                            color: textColor(value),
                            boxShadow: isHovered
                              ? `0 0 0 2px rgba(255,255,255,0.35), 0 4px 16px ${cell.rgb}66`
                              : isM1
                                ? '0 0 10px rgba(255,90,95,0.35)'
                                : 'none',
                          }}
                          title={`${cohort} · Month ${col}: ${value}%`}
                        >
                          {col === 0 ? `${value}%` : value}
                        </div>
                      )
                    }),
                  )}
                </div>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.25} className="lg:col-span-2">
            <GlassCard className="flex h-full flex-col p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-softwhite">Retention Curve</h3>
                  <p className="text-xs text-slate-500">Average across cohorts · target modeled</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-brand" /> Retention
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-brand" /> Target
                  </span>
                </div>
              </div>
              <div className="mt-4 h-64 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={retentionCurve} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                      unit="%"
                    />
                    <Tooltip content={<CurveTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="#00E5FF"
                      strokeWidth={2.5}
                      fill="url(#curveFill)"
                      dot={{ r: 3, fill: '#00E5FF', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#00E5FF', stroke: '#0B1020', strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="#10B981"
                      strokeWidth={1.5}
                      strokeDasharray="6 4"
                      fill="none"
                    />
                    <ReferenceLine
                      x="M1"
                      stroke="#FF5A5F"
                      strokeDasharray="4 4"
                      label={{
                        value: 'M1 cliff',
                        position: 'top',
                        fill: '#FF5A5F',
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 rounded-xl border border-coral-brand/25 bg-coral-brand/10 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-coral-brand/20">
                    <AlertTriangle className="h-4 w-4 text-coral-brand" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-softwhite">
                      {m1Avg}% retention at Month 1
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                      Average retention collapses from 100% to {m1Avg}% in a single month — a{' '}
                      <span className="font-bold text-coral-brand">{m1Dropoff}-point cliff</span>.
                      34.5% of customers never make a second purchase, and the modeled target for
                      Month 1 is {retentionCurve[1].target}%.
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </Reveal>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Reveal delay={0.1}>
            <GlassCard className="h-full p-5 sm:p-6">
              <h3 className="font-display text-lg font-bold text-softwhite">
                Month-over-Month Analysis
              </h3>
              <p className="text-xs text-slate-500">All cohorts · first 7 months</p>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={retentionCurve.slice(0, 7).map((d, i) => ({ ...d, month: `M${i}` }))}
                    margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                    <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                      {retentionCurve.slice(0, 7).map((_, i) => (
                        <Cell
                          key={i}
                          fill={i === 1 ? '#FF5A5F' : i > 1 ? '#8B5CF6' : '#00E5FF'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                The <span className="font-bold text-coral-brand">Month-1 collapse</span> is the
                sharpest single-month decay in the entire journey — 34.5% of customers buy once and
                never come back.
              </p>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.2}>
            <GlassCard className="flex h-full flex-col p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-coral-brand" />
                <h3 className="font-display text-lg font-bold text-softwhite">Cohort Drop-Off Heat</h3>
              </div>
              <div className="mt-5 flex flex-1 flex-col justify-center gap-4">
                {[0, 1, 2, 3, 4, 5].map((m) => {
                  const vals = cohortMatrix.map((row) => row[m]).filter((v): v is number => v !== null)
                  const prevVals = cohortMatrix
                    .map((row) => (m > 0 ? row[m - 1] : null))
                    .filter((v): v is number => v !== null)
                  const avgVal = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
                  const prev =
                    m > 0
                      ? Math.round(prevVals.reduce((a, b) => a + b, 0) / prevVals.length)
                      : 100
                  const change = avgVal - prev
                  const isM1 = m === 1
                  return (
                    <div key={m}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className={isM1 ? 'font-bold text-coral-brand' : 'text-slate-400'}>
                          Month {m}
                        </span>
                        <span className={`font-bold ${isM1 ? 'text-coral-brand' : 'text-cyan-brand'}`}>
                          {avgVal}%
                          <span className={`ml-1.5 font-semibold ${change < 0 ? 'text-coral-brand/80' : 'text-emerald-brand/80'}`}>
                            {change <= 0 ? `▼ ${Math.abs(change)}` : `▲ ${change}`}
                          </span>
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {vals.map((v, i) => (
                          <div
                            key={i}
                            className="h-2 flex-1 rounded-sm transition-all"
                            style={{
                              background: heatColor(v).rgba,
                              opacity: isM1 && i !== 1 ? 0.45 : 1,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                Month 1 shows the deepest average decline of{' '}
                <span className="font-bold text-coral-brand">{m1Dropoff} points</span> across all
                twelve cohorts — a systematic, fixable pattern.
              </p>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.3}>
            <GlassCard className="flex h-full flex-col p-5 sm:p-6">
              <h3 className="font-display text-lg font-bold text-softwhite">What This Means</h3>
              <div className="mt-4 flex flex-1 flex-col justify-center gap-4 text-sm leading-relaxed text-slate-400">
                <p>
                  <span className="font-bold text-cyan-brand">01 ·</span> The first purchase is
                  easy. <span className="font-bold text-softwhite">The second purchase is everything</span>{' '}
                  — 34.5% of buyers never come back.
                </p>
                <p>
                  <span className="font-bold text-purple-brand">02 ·</span> Retained customers are
                  worth <span className="font-bold text-softwhite">7× more</span> — £2,917 vs £414
                  in average LTV.
                </p>
                <p>
                  <span className="font-bold text-emerald-brand">03 ·</span> A 5-point lift in
                  Month-1 retention recovers an estimated{' '}
                  <span className="font-bold text-emerald-brand">
                    £{Math.round(recoverableLtv / 1000)}K
                  </span>{' '}
                  in annual LTV.
                </p>
                <p>
                  <span className="font-bold text-amber-brand">04 ·</span> Action: deploy a{' '}
                  <span className="font-bold text-softwhite">30-day re-engagement flow</span> with a
                  second-purchase incentive before Day 30.
                </p>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
