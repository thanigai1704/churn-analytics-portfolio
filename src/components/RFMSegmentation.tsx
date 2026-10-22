import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
} from 'recharts'
import type { PieSectorDataItem, PieSectorShapeProps } from 'recharts'
import { CheckCircle2, Package, Wallet } from 'lucide-react'
import { rfmSegments } from '../data/analytics'
import type { SegmentKey } from '../data/analytics'
import GlassCard from './ui/GlassCard'
import Reveal from './ui/Reveal'
import SectionHeading from './ui/SectionHeading'

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: { name: string; value: number; color: string } }>
}

function DonutTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const seg = payload[0].payload
  return (
    <div className="glass rounded-xl border border-white/10 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-200">{seg.name}</p>
      <p className="font-bold" style={{ color: seg.color }}>
        {seg.value}% of customers
      </p>
    </div>
  )
}

export default function RFMSegmentation() {
  const [selected, setSelected] = useState<SegmentKey>('atRisk')
  const seg = rfmSegments.find((s) => s.key === selected)!
  const totalCustomers = rfmSegments.reduce((a, s) => a + s.customers, 0)

  const donutData = rfmSegments.map((s) => ({
    name: s.name,
    value: s.pct,
    color: s.color,
  }))

  const renderSectorShape = (props: PieSectorShapeProps) => {
    const { isActive, ...sectorProps } = props
    const outerRadius = (sectorProps.outerRadius ?? 96) + (isActive ? 10 : 0)
    const fill = sectorProps.fill ?? '#00E5FF'
    return (
      <Sector
        {...sectorProps}
        outerRadius={outerRadius}
        className="cursor-pointer"
        style={{
          filter: isActive ? `drop-shadow(0 0 10px ${fill})` : undefined,
          opacity: isActive ? 1 : 0.82,
          transition: 'opacity 0.25s, filter 0.25s',
        }}
      />
    )
  }

  const onPieClick = (data: PieSectorDataItem) => {
    const name = data.name as string | undefined
    if (!name) return
    const match = rfmSegments.find((s) => s.name === name)
    if (match) setSelected(match.key)
  }

  return (
    <section id="rfm" className="relative px-5 py-24 sm:px-8">
      <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-purple-brand/10 blur-[120px]" />
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="RFM Segmentation"
          title="Five Segments,"
          highlight="One Growth Playbook"
          description="Recency, Frequency and Monetary value score every customer into five action-ready segments. Click a segment to explore its economics and the play designed for it."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Reveal delay={0.1} className="lg:col-span-2">
            <GlassCard className="flex h-full flex-col p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-softwhite">Segment Mix</h3>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  n = {totalCustomers.toLocaleString()}
                </span>
              </div>

              <div className="relative mx-auto mt-2 h-64 w-full max-w-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={96}
                      paddingAngle={3}
                      strokeWidth={0}
                      shape={renderSectorShape}
                      onClick={onPieClick}
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} className="cursor-pointer" />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selected}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="text-center"
                    >
                      <p className="font-display text-3xl font-bold" style={{ color: seg.color }}>
                        {seg.pct}%
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                        {seg.name}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Package className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Avg Orders</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={seg.avgOrders}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mt-1.5 font-display text-xl font-bold text-softwhite"
                    >
                      {seg.avgOrders}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Wallet className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                      Avg Value <span className="normal-case font-normal text-slate-600">(observed)</span>
                    </span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={seg.avgLtv}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mt-1.5 font-display text-xl font-bold text-softwhite"
                    >
                      £{seg.avgLtv.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.2} className="lg:col-span-3">
            <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2">
              {rfmSegments.map((s, i) => {
                const isSelected = selected === s.key
                return (
                  <motion.button
                    key={s.key}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                    onClick={() => {
                      setSelected(s.key)
                    }}
                    className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
                      isSelected
                        ? 'scale-[1.02] border-transparent shadow-lg'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                    style={
                      isSelected
                        ? {
                            background: `linear-gradient(rgba(11,16,32,0.9), rgba(11,16,32,0.9)) padding-box, linear-gradient(135deg, ${s.color}, rgba(0,229,255,0.6)) border-box`,
                            boxShadow: `0 0 30px ${s.color}33`,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ background: s.color, boxShadow: `0 0 12px ${s.color}` }}
                      />
                      <span className="font-display text-2xl font-bold text-softwhite">
                        {s.pct}%
                      </span>
                    </div>
                    <h4 className="mt-3 font-display text-base font-bold text-softwhite">
                      {s.name}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {s.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px]">
                      <span className="text-slate-400">
                        {s.customers.toLocaleString()} customers
                      </span>
                      <span className="font-bold" style={{ color: s.color }}>
                        £{s.avgLtv.toLocaleString('en-US', { maximumFractionDigits: 0 })} LTV
                      </span>
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div
                            className="mt-3 flex items-start gap-2 rounded-xl p-3"
                            style={{ background: `${s.color}14`, border: `1px solid ${s.color}33` }}
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: s.color }} />
                            <p className="text-xs leading-relaxed text-slate-300">
                              <span className="font-bold" style={{ color: s.color }}>
                                Play:&nbsp;
                              </span>
                              {s.action}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )
              })}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.25} className="mt-8">
          <div className="gradient-border rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-brand/30 to-purple-brand/30">
                  <CheckCircle2 className="h-6 w-6 text-emerald-brand" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-softwhite">
                    Segmentation Value: <span className="text-emerald-brand">74.6% of revenue in 20% of customers</span>
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
                    Scoring all {totalCustomers.toLocaleString()} customers on Recency, Frequency
                    and Monetary value pinpoints exactly where the money is:{' '}
                    <span className="font-semibold text-amber-brand">top-20% customers</span> — mostly
                    Champions and Loyal — generate{' '}
                    <span className="font-bold text-emerald-brand">74.6% of all revenue</span>, while the
                    At-Risk and Lost pool (42.3% of customers) holds real spend history that
                    win-back flows can target without blanket discounting. Measured on this
                    dataset — no modeled lift is claimed here.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-cyan-brand">
                    {rfmSegments.find((s) => s.key === 'champions')!.pct}%
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Champions</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-purple-brand">
                    {(
                      rfmSegments.find((s) => s.key === 'potential')!.pct +
                      rfmSegments.find((s) => s.key === 'loyal')!.pct
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Ready to nurture</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-coral-brand">
                    {(
                      rfmSegments.find((s) => s.key === 'atRisk')!.pct +
                      rfmSegments.find((s) => s.key === 'lost')!.pct
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Recovery pool</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
