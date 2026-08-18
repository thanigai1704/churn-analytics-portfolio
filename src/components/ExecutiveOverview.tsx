import { motion } from 'framer-motion'
import {
  ArrowDownRight,
  ArrowUpRight,
  Database,
  DollarSign,
  LogOut,
  RefreshCcw,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { dataQuality, executiveMetrics, source } from '../data/analytics'
import GlassCard from './ui/GlassCard'
import Reveal from './ui/Reveal'
import SectionHeading from './ui/SectionHeading'

const iconMap: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  users: {
    icon: <Users className="h-5 w-5" />,
    color: 'text-cyan-brand',
    bg: 'bg-cyan-brand/15',
  },
  retention: {
    icon: <RefreshCcw className="h-5 w-5" />,
    color: 'text-emerald-brand',
    bg: 'bg-emerald-brand/15',
  },
  churn: {
    icon: <LogOut className="h-5 w-5" />,
    color: 'text-coral-brand',
    bg: 'bg-coral-brand/15',
  },
  money: {
    icon: <DollarSign className="h-5 w-5" />,
    color: 'text-purple-brand',
    bg: 'bg-purple-brand/15',
  },
  repeat: {
    icon: <ShoppingBag className="h-5 w-5" />,
    color: 'text-amber-brand',
    bg: 'bg-amber-brand/15',
  },
}

const sparkBars: Record<string, number[]> = {
  users: [40, 55, 48, 62, 70, 66, 82, 88],
  retention: [30, 42, 38, 52, 58, 60, 66, 74],
  churn: [88, 80, 74, 78, 66, 60, 54, 48],
  money: [35, 45, 40, 58, 55, 72, 78, 90],
  repeat: [42, 48, 52, 58, 62, 68, 72, 80],
}

export default function ExecutiveOverview() {
  return (
    <section id="dashboard" className="relative px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Executive Overview"
          title="The Retention"
          highlight="Command Center"
          description="A single pane of glass for customer health. Every metric below is computed from 541,909 real transactions via a reproducible Python/Pandas pipeline."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {executiveMetrics.map((metric, i) => {
            const meta = iconMap[metric.icon]
            const bars = sparkBars[metric.icon]
            return (
              <Reveal key={metric.label} delay={i * 0.08}>
                <div className="group">
                  <GlassCard className="h-full p-5">
                    <div className="flex items-start justify-between">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${meta.bg} ${meta.color}`}>
                        {meta.icon}
                      </span>
                      <span
                        title={metric.deltaNote}
                        className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-bold ${
                          metric.deltaPositive
                            ? 'bg-emerald-brand/10 text-emerald-brand'
                            : 'bg-coral-brand/10 text-coral-brand'
                        }`}
                      >
                        {metric.deltaPositive ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {metric.delta}
                      </span>
                    </div>

                    <p className="mt-5 font-display text-3xl font-bold text-softwhite">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                      {metric.label}
                    </p>

                    <div className="mt-4 flex h-8 items-end gap-1">
                      {bars.map((h, idx) => (
                        <motion.span
                          key={idx}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + idx * 0.05, duration: 0.5 }}
                          className={`flex-1 rounded-sm ${
                            metric.deltaPositive
                              ? 'bg-gradient-to-t from-cyan-brand/30 to-cyan-brand'
                              : 'bg-gradient-to-t from-coral-brand/30 to-coral-brand'
                          }`}
                        />
                      ))}
                    </div>
                  </GlassCard>
                </div>
              </Reveal>
            )
          })}
        </div>

        <Reveal delay={0.2} className="mt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
              <Database className="h-3 w-3 text-cyan-brand" />
              Data: <span className="font-semibold text-slate-300">{source.name}</span>
            </span>
            <span>{source.rows.toLocaleString()} raw rows</span>
            <span>·</span>
            <span>{dataQuality.cleanRows.toLocaleString()} cleaned ({dataQuality.cleanPct}%)</span>
            <span>·</span>
            <span>{source.customers.toLocaleString()} customers</span>
            <span>·</span>
            <span>{source.period} · {source.currency}</span>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-cyan-brand transition-colors hover:text-softwhite"
            >
              View dataset
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.3} className="mt-10">
          <div className="gradient-border relative overflow-hidden rounded-2xl p-6 sm:p-8">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-purple-brand/15 blur-3xl" />
            <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-brand">
                  Key Takeaway
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold text-softwhite">
                  The second purchase is the highest-leverage growth engine.
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                  Across {source.customers.toLocaleString()} customers,{' '}
                  <span className="font-semibold text-coral-brand">34.5% never make a second
                  purchase</span>. Retained customers are worth{' '}
                  <span className="font-semibold text-emerald-brand">7× more</span> (£2,917 vs
                  £414 LTV), and the top 20% of buyers drive{' '}
                  <span className="font-semibold text-cyan-brand">74.6% of revenue</span>. The
                  highest-impact moment is the first 30 days after a first purchase.
                </p>
              </div>
              <a
                href="#cohort"
                className="shrink-0 rounded-xl border border-cyan-brand/40 bg-cyan-brand/10 px-6 py-3 text-sm font-bold text-cyan-brand transition-all duration-300 hover:bg-cyan-brand hover:text-navy hover:shadow-glow-cyan"
              >
                Dive into the Cohort Analysis
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
