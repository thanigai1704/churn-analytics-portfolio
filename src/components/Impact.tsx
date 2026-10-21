import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  BarChart3,
  Database,
  GitBranch,
  Lightbulb,
  Rocket,
} from 'lucide-react'
import { techStack } from '../data/analytics'
import GlassCard from './ui/GlassCard'
import Reveal from './ui/Reveal'
import SectionHeading from './ui/SectionHeading'

const impacts = [
  {
    icon: Database,
    title: 'Cohort Retention Matrix',
    body: 'Engineered a cohort retention matrix in Python/Pandas on 397,884 cleaned transaction rows from the UCI Online Retail dataset, surfacing a 78.5% Month-1 drop-off — 34.5% of customers buy once and never return.',
    metric: '78.5% drop-off',
    metricLabel: 'Month 1 · observed',
    color: '#00E5FF',
    stat: '397.9K',
    statLabel: 'clean rows analyzed',
  },
  {
    icon: BarChart3,
    title: 'RFM Segmentation',
    body: 'Scored all 4,338 customers on recency, frequency and monetary value into five explicit, rule-based segments with values traceable to the source data and consistent across Power BI and the web dashboard.',
    metric: '5 segments',
    metricLabel: 'rule-based, traceable',
    color: '#8B5CF6',
    stat: '4,338',
    statLabel: 'customers segmented',
  },
]

export default function Impact() {
  return (
    <section id="impact" className="relative px-5 py-24 sm:px-8">
      <div className="absolute left-1/2 top-1/3 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-purple-brand/10 blur-[140px]" />
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Business Impact"
          title="From Raw Data to"
          highlight="Revenue Decisions"
          description="This project is not just analysis — it is a decision engine. Here is what was built, what it found, and what it is worth."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {impacts.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.15}>
              <div className="group h-full">
                <GlassCard className="flex h-full flex-col p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110"
                      style={{
                        background: `${item.color}15`,
                        border: `1px solid ${item.color}33`,
                        boxShadow: `0 0 24px ${item.color}22`,
                      }}
                    >
                      <item.icon className="h-7 w-7" style={{ color: item.color }} />
                    </span>
                    <span className="font-display text-5xl font-bold text-white/5 transition-colors duration-500 group-hover:text-white/10">
                      0{i + 1}
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-xl font-bold text-softwhite sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{item.body}</p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div
                      className="rounded-xl p-4"
                      style={{ background: `${item.color}12`, border: `1px solid ${item.color}26` }}
                    >
                      <p className="font-display text-2xl font-bold" style={{ color: item.color }}>
                        {item.metric}
                      </p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">
                        {item.metricLabel}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="font-display text-2xl font-bold text-softwhite">{item.stat}</p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">
                        {item.statLabel}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-10">
          <div className="gradient-border relative overflow-hidden rounded-3xl p-8 sm:p-12">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-brand/15 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-brand/15 blur-3xl" />

            <div className="relative flex flex-col items-center gap-10 lg:flex-row lg:justify-between">
              <div className="max-w-xl text-center lg:text-left">
                <div className="flex items-center justify-center gap-2 lg:justify-start">
                  <Lightbulb className="h-5 w-5 text-amber-brand" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-brand">
                    The Takeaway for Recruiters
                  </span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold leading-snug text-softwhite sm:text-3xl">
                  I turn <span className="text-gradient-animated">customer data</span> into
                  decisions that move revenue — end to end, from raw SQL to executive dashboards.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Every number on this page is computed from the public UCI Online Retail dataset
                  through a reproducible Python pipeline — not simulated figures.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-4 sm:flex-row lg:flex-col xl:flex-row">
                <motion.a
                  href="https://github.com/thanigai1704/churn-analytics-portfolio"
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-brand to-purple-brand px-8 py-4 font-display text-sm font-bold text-navy shadow-glow-cyan"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    View on GitHub
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </motion.a>
                <motion.a
                  href="https://churn-analytics-portfolio.vercel.app/#overview"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="group flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 font-display text-sm font-bold text-softwhite backdrop-blur-md transition-colors duration-300 hover:border-emerald-brand/50 hover:text-emerald-brand hover:shadow-glow-cyan"
                >
                  <Rocket className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                  Live Dashboard
                </motion.a>
              </div>
            </div>

            <div className="relative mt-10 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              <span className="mr-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                <Database className="h-3.5 w-3.5" /> Toolchain
              </span>
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-all duration-300 hover:border-cyan-brand/40 hover:text-cyan-brand"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
