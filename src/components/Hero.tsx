import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import { churnSummary, heroStats, metrics, source } from '../data/analytics'
import Counter from './ui/Counter'
import { useState } from 'react'

function FloatingCard({
  className,
  delay,
  children,
}: {
  className: string
  delay: number
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute hidden xl:block ${className}`}
    >
      <div className="animate-float">{children}</div>
    </motion.div>
  )
}

function MiniSparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 36" className="h-9 w-24">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 28 L14 24 L28 27 L42 18 L56 21 L70 12 L84 15 L100 6 L100 36 L0 36 Z"
        fill={`url(#grad-${color.replace('#', '')})`}
      />
      <path
        d="M0 28 L14 24 L28 27 L42 18 L56 21 L70 12 L84 15 L100 6"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Hero() {
  const [ctaHover, setCtaHover] = useState(false)

  return (
    <section id="overview" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-28 pb-16 sm:px-8">
      <div className="absolute top-1/4 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-brand/10 blur-[130px] animate-pulse-glow" />
      <div className="absolute right-[12%] top-[18%] h-72 w-72 rounded-full bg-purple-brand/15 blur-[110px]" />

      <FloatingCard className="left-[7%] top-[24%]" delay={0.7}>
        <div className="glass rounded-2xl p-4 shadow-xl shadow-black/30">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-brand/15">
              <TrendingUp className="h-4 w-4 text-emerald-brand" />
            </span>
            <div>
              <p className="text-xs text-slate-400">Month-1 Retention</p>
              <p className="font-display text-lg font-bold text-emerald-brand">
                {metrics.m1Retention}%
              </p>
            </div>
          </div>
          <MiniSparkline color="#10B981" />
        </div>
      </FloatingCard>

      <FloatingCard className="right-[8%] top-[22%]" delay={0.9}>
        <div className="glass rounded-2xl p-4 shadow-xl shadow-black/30">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-coral-brand/15">
              <TrendingDown className="h-4 w-4 text-coral-brand" />
            </span>
            <div>
              <p className="text-xs text-slate-400">Monthly Churn</p>
              <p className="font-display text-lg font-bold text-coral-brand">
                {metrics.churnRate}%
              </p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">▾ {churnSummary.trajectory}pts YTD</p>
        </div>
      </FloatingCard>

      <FloatingCard className="left-[12%] bottom-[20%]" delay={1.1}>
        <div className="glass rounded-2xl p-4 shadow-xl shadow-black/30">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Avg. LTV</p>
          <div className="flex items-end gap-1">
            {[35, 52, 44, 66, 58, 82, 74, 96].map((h, i) => (
              <motion.span
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 1.3 + i * 0.1, duration: 0.6 }}
                className="w-2.5 rounded-sm bg-gradient-to-t from-cyan-brand/40 to-purple-brand"
              />
            ))}
          </div>
          <p className="mt-2 font-display text-sm font-bold text-softwhite">
            £{metrics.avgLtv.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </FloatingCard>

      <FloatingCard className="right-[11%] bottom-[18%]" delay={1.3}>
        <div className="glass rounded-2xl p-4 shadow-xl shadow-black/30">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-brand animate-pulse" />
            <p className="text-xs font-semibold text-slate-300">Live ETL Pipeline</p>
          </div>
          <div className="mt-2 space-y-1.5">
            {[
              { label: 'SQL Extraction', pct: 100, color: '#00E5FF' },
              { label: 'Power BI Modeling', pct: 100, color: '#8B5CF6' },
              { label: 'Insights Generation', pct: 82, color: '#10B981' },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-0.5 flex justify-between text-[9px] text-slate-500">
                  <span>{row.label}</span>
                  <span>{row.pct}%</span>
                </div>
                <div className="h-1 w-36 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.pct}%` }}
                    transition={{ delay: 1.6, duration: 1 }}
                    className="h-full rounded-full"
                    style={{ background: row.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </FloatingCard>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex max-w-5xl flex-col items-center text-center"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-md"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-brand" />
          Data Analyst · Business Intelligence Portfolio
          <span className="ml-1 h-1.5 w-1.5 rounded-full bg-cyan-brand animate-pulse" />
        </motion.span>

        <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-softwhite sm:text-6xl lg:text-7xl">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8 }}
            className="block"
          >
            Customer Retention &
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="block"
          >
            <span className="text-gradient-animated text-glow">Churn Analysis</span>
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.8 }}
            className="block text-2xl text-slate-300 sm:text-4xl lg:text-5xl"
          >
            for E-Commerce Growth
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg"
        >
          Transforming{' '}
          <span className="font-semibold text-cyan-brand">
            {source.rows.toLocaleString()} raw rows
          </span>{' '}
          from the public UCI Online Retail dataset into a cleaned set of{' '}
          <span className="font-semibold text-purple-brand">{(397884).toLocaleString()}</span> customer-analysable lines, delivered as{' '}
          <span className="font-semibold text-purple-brand">Python</span>,{' '}
          <span className="font-semibold text-purple-brand">Power BI</span>, and{' '}
          <span className="font-semibold text-purple-brand">React</span> dashboards.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.8 }}
          className="mt-8 flex flex-col gap-4 sm:flex-row"
        >
          <a
            href="#cohort"
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-brand to-purple-brand px-7 py-3.5 text-sm font-bold text-navy transition-all duration-300 hover:shadow-glow-cyan"
          >
            <span className="relative z-10 flex items-center gap-2">
              Explore the Analysis
              <ArrowRight
                className={`h-4 w-4 transition-transform duration-300 ${ctaHover ? 'translate-x-1' : ''}`}
              />
            </span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </a>
          <a
            href="#dashboard"
            className="rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-softwhite backdrop-blur-md transition-all duration-300 hover:border-cyan-brand/50 hover:bg-cyan-brand/10 hover:shadow-glow-cyan"
          >
            View Impact Dashboard
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15, duration: 0.9 }}
        className="relative z-10 mt-16 grid w-full max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {heroStats.map((stat, i) => (
          <div
            key={stat.label}
            className={`glass group rounded-2xl p-5 text-center transition-all duration-300 hover:border-cyan-brand/40 hover:shadow-glow-cyan ${
              i === 1 ? 'border-coral-brand/25' : ''
            }`}
          >
            <p className="font-display text-3xl font-bold text-gradient-animated">
              <Counter value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-1.5 text-xs leading-snug text-slate-400">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="flex h-9 w-6 items-start justify-center rounded-full border-2 border-white/20 p-1.5"
        >
          <div className="h-2 w-1 rounded-full bg-cyan-brand" />
        </motion.div>
      </div>
    </section>
  )
}
