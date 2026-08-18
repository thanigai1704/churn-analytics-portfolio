import {
  ArrowUpRight,
  BarChart3,
  Database,
  FileCode2,
  Layers,
  Map as MapIcon,
  PieChart,
  TrendingDown,
  Users,
} from 'lucide-react'
import GlassCard from './ui/GlassCard'
import Reveal from './ui/Reveal'
import SectionHeading from './ui/SectionHeading'
import PowerBIDashboard from './PowerBIDashboard'

const pages = [
  {
    icon: BarChart3,
    title: 'Executive Overview',
    body: 'KPI cards, revenue & churn trends, country map — the health of the base in one pane.',
    color: '#00E5FF',
  },
  {
    icon: Layers,
    title: 'Cohorts & Retention',
    body: '12-month cohort retention matrix with conditional formatting, M1 drop-off, acquisition funnel.',
    color: '#8B5CF6',
  },
  {
    icon: Users,
    title: 'RFM Segmentation',
    body: '5 action-ready segments scored on Recency, Frequency & Monetary value, with LTV per segment.',
    color: '#10B981',
  },
  {
    icon: TrendingDown,
    title: 'Churn Deep-Dive',
    body: 'Monthly churn trend vs target, churn composition by order frequency, recency-based risk buckets.',
    color: '#F59E0B',
  },
  {
    icon: MapIcon,
    title: 'Product & Geography',
    body: 'Top products by revenue, decomposition tree, revenue by country & region (UK vs Europe vs RoW).',
    color: '#FF5A5F',
  },
]

const dax = `Repeat Purchase Rate % =
VAR AllCust = [All-Time Customers]
VAR Repeat = CALCULATE(COUNTROWS(dim_customer),
    dim_customer[OrderSessions] >= 2, REMOVEFILTERS(dim_date))
RETURN DIVIDE(Repeat, AllCust, 0) * 100`

const POWER_BI_EMBED_URL = ''

export default function PowerBI() {
  return (
    <section id="powerbi" className="relative px-5 py-24 sm:px-8">
      <div className="absolute left-1/2 top-1/4 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-cyan-brand/10 blur-[140px]" />
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Interactive Layer"
          title="The Power BI"
          highlight="Retention Dashboard"
          description="The same pipeline, the same real data, now interactive. A 5-page Power BI report — star-schema model, 51 DAX measures — that reproduces every number on this page."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Live Power BI report embed */}
          <Reveal delay={0.05} className="lg:col-span-3">
            <GlassCard className="h-full p-5 sm:p-6">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-navy/80">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-coral-brand/80" />
                    <span className="h-3 w-3 rounded-full bg-amber-brand/80" />
                    <span className="h-3 w-3 rounded-full bg-emerald-brand/80" />
                  </div>
                  <span className="font-display text-xs font-semibold tracking-wide text-slate-400">
                    Customer Retention &amp; Churn · Live dashboard
                  </span>
                  <PieChart className="h-4 w-4 text-cyan-brand" />
                </div>

                {POWER_BI_EMBED_URL ? (
                  <iframe
                    src={POWER_BI_EMBED_URL}
                    title="Customer Retention & Churn — Power BI report"
                    className="aspect-[4/3] w-full sm:aspect-[16/10]"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <PowerBIDashboard />
                )}
              </div>
            </GlassCard>
          </Reveal>

          {/* Pages + DAX */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {pages.map((page, i) => (
              <Reveal key={page.title} delay={0.1 + i * 0.08}>
                <div className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md transition-colors duration-300 hover:border-white/20">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110"
                    style={{
                      background: `${page.color}15`,
                      border: `1px solid ${page.color}33`,
                      boxShadow: `0 0 20px ${page.color}22`,
                    }}
                  >
                    <page.icon className="h-5 w-5" style={{ color: page.color }} />
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold text-softwhite">{page.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{page.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.2} className="mt-10">
          <div className="gradient-border grid grid-cols-1 gap-6 rounded-2xl p-6 sm:p-8 lg:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-brand">
                <FileCode2 className="h-4 w-4" /> Real DAX · not screenshots
              </p>
              <h3 className="mt-3 font-display text-xl font-bold text-softwhite sm:text-2xl">
                51 measures in a star-schema model
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Cohort retention, churn, RFM, LTV and revenue concentration are all DAX measures —
                written by hand, computed live, and matching the Python pipeline to the penny.
                The dashboard is generated to <span className="font-mono text-cyan-brand">powerbi/Churn Analytics.pbit</span>
                and opens straight in Power BI Desktop.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <a
                  href="#overview"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-brand to-purple-brand px-5 py-2.5 text-sm font-bold text-navy transition-all duration-300 hover:shadow-glow-cyan hover:brightness-110"
                >
                  <Database className="h-4 w-4" />
                  Same data as this site
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-softwhite transition-all duration-300 hover:border-cyan-brand/50 hover:text-cyan-brand"
                >
                  <FileCode2 className="h-4 w-4" />
                  measures.dax · BUILD-GUIDE.md
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-navy/90">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  measures.dax
                </span>
                <span className="rounded-full border border-emerald-brand/30 bg-emerald-brand/10 px-2 py-0.5 text-[10px] font-bold text-emerald-brand">
                  DAX
                </span>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-cyan-brand/90">
                {dax}
              </pre>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
