import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, Globe, Layers, TrendingDown, Users } from 'lucide-react'

const COLORS = {
  cyan: '#00E5FF',
  purple: '#8B5CF6',
  emerald: '#10B981',
  amber: '#F59E0B',
  coral: '#FF5A5F',
}

const SEGMENT_ORDER = ['Champions', 'Loyal', 'Potential Loyalists', 'At Risk', 'Lost']
const SEGMENT_COLORS: Record<string, string> = {
  Champions: COLORS.emerald,
  Loyal: COLORS.cyan,
  'Potential Loyalists': COLORS.purple,
  'At Risk': COLORS.amber,
  Lost: COLORS.coral,
}

const FREQ_COLORS = ['#00E5FF', '#8B5CF6', '#10B981', '#F59E0B']

interface RevenueRow {
  Month: string
  Revenue: number
}
interface ChurnRow {
  Month: string
  ActiveCustomers: number
  ChurnedCustomers: number
  ChurnRatePct: number
}
interface CohortRow {
  Cohort: string
  Elapsed: number
  RetentionPct: number
}
interface CountryRow {
  Country: string
  Customers: number
  Revenue: number
  Region: string
}
interface ProductRow {
  Description: string
  Revenue: number
  OrderCount: number
}
interface CustomerRow {
  RFM_Segment: string
  CustomerStatus: string
  FrequencyBucket: string
  LTV_GBP: number
}

interface DashboardData {
  revenue: RevenueRow[]
  churn: ChurnRow[]
  cohorts: CohortRow[]
  countries: CountryRow[]
  products: ProductRow[]
  customers: CustomerRow[]
}

interface TabProps {
  data: DashboardData
}

const tabs = [
  { key: 'overview', label: 'Executive Overview', icon: BarChart3 },
  { key: 'cohort', label: 'Cohorts & Retention', icon: Layers },
  { key: 'rfm', label: 'RFM Segmentation', icon: Users },
  { key: 'churn', label: 'Churn Deep-Dive', icon: TrendingDown },
  { key: 'geo', label: 'Product & Geography', icon: Globe },
]

function parseCSV(text: string): Record<string, string>[] {
  const rows: Record<string, string>[] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  let header: string[] | null = null

  const pushCell = () => {
    row.push(cell)
    cell = ''
  }
  const flushRow = () => {
    if (row.length) {
      if (!header) header = row
      else {
        const obj: Record<string, string> = {}
        header.forEach((h, i) => (obj[h] = row[i] ?? ''))
        rows.push(obj)
      }
      row = []
    }
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else inQuotes = false
      } else cell += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') pushCell()
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      pushCell()
      flushRow()
    } else cell += ch
  }
  if (cell !== '') pushCell()
  flushRow()
  return rows
}

async function loadCSV(path: string): Promise<Record<string, string>[]> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load ${path}`)
  return parseCSV(await res.text())
}

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const gbp = (n: number) => `£${Math.round(n).toLocaleString('en-US')}`
const gbpCompact = (n: number) =>
  n >= 1_000_000 ? `£${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `£${Math.round(n / 1_000)}K` : `£${Math.round(n)}`
const int = (n: number) => Math.round(n).toLocaleString('en-US')
const one = (n: number) => `${n.toFixed(1)}%`

function TooltipShell({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="glass rounded-xl border border-white/10 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-200">{title}</p>
      {rows.map(([label, value]) => (
        <p key={label} className="mt-0.5 flex items-center gap-2 text-slate-400">
          <span>{label}</span>
          <span className="ml-auto font-bold text-softwhite">{value}</span>
        </p>
      ))}
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  legend,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  legend?: Array<{ label: string; color: string }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-display text-sm font-bold text-softwhite">{title}</h4>
          {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
        </div>
        {legend && (
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="font-display text-xl font-bold sm:text-2xl" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
    </div>
  )
}

function Donut({
  data,
  colors,
  centerLabel,
  centerValue,
  height = 176,
}: {
  data: Array<{ name: string; value: number }>
  colors: string[]
  centerLabel: string
  centerValue: string
  height?: number
}) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <TooltipShell
                  title={String(payload[0].name)}
                  rows={[[String(payload[0].name), int(Number(payload[0].value))]]}
                />
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg font-bold text-softwhite">{centerValue}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{centerLabel}</span>
      </div>
    </div>
  )
}

function AxisLegend({ data, colors }: { data: Array<{ name: string; value: number }>; colors: string[] }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5">
      {data.map((d, i) => (
        <div key={d.name} className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: colors[i % colors.length] }} />
          <span className="truncate">{d.name}</span>
          <span className="ml-auto font-bold text-softwhite">{int(d.value)}</span>
        </div>
      ))}
    </div>
  )
}

function OverviewTab({ data }: TabProps) {
  const totalRevenue = data.revenue.reduce((a, b) => a + b.Revenue, 0)
  const totalCustomers = data.customers.length
  const avgLtv = totalRevenue / totalCustomers
  const m1Rows = data.cohorts.filter((c) => c.Elapsed === 1)
  const m1Retention = m1Rows.length ? m1Rows.reduce((a, b) => a + b.RetentionPct, 0) / m1Rows.length : 0
  const lastChurn = data.churn[data.churn.length - 1]

  const regionData = useMemo(() => {
    const map = new Map<string, number>()
    data.countries.forEach((c) => map.set(c.Region, (map.get(c.Region) ?? 0) + c.Revenue))
    const order = ['Domestic (UK)', 'Europe', 'Rest of World']
    return order
      .filter((r) => map.has(r))
      .map((r) => ({ name: r === 'Domestic (UK)' ? 'Domestic' : r, value: Math.round(map.get(r) ?? 0) }))
  }, [data.countries])

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total Revenue" value={gbpCompact(totalRevenue)} sub="Dec 2010 – Dec 2011" color={COLORS.cyan} />
        <KpiCard label="Customers" value={int(totalCustomers)} sub="377K clean transactions" color={COLORS.purple} />
        <KpiCard label="Avg LTV" value={gbp(avgLtv)} sub="per customer" color={COLORS.emerald} />
        <KpiCard label="M1 Retention" value={one(m1Retention)} sub="across 13 cohorts" color={COLORS.amber} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ChartCard
          title="Revenue by Month"
          subtitle="Total revenue · £GBP"
          legend={[{ label: 'Revenue', color: COLORS.cyan }]}
          className="lg:col-span-3"
        >
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.cyan} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={COLORS.purple} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="Month" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => gbpCompact(v)}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(148,163,184,0.2)' }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <TooltipShell
                        title={String(label)}
                        rows={[['Revenue', gbp(Number(payload[0].value))]]}
                      />
                    ) : null
                  }
                />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  stroke={COLORS.cyan}
                  strokeWidth={2.5}
                  fill="url(#dashRev)"
                  dot={{ r: 3, fill: COLORS.cyan, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: COLORS.cyan, stroke: '#0B1020', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid grid-cols-1 gap-4 lg:col-span-2">
          <ChartCard
            title="Churn Rate Trend"
            subtitle={`${one(lastChurn.ChurnRatePct)} current · target 45%`}
            legend={[{ label: 'Churn', color: COLORS.coral }]}
          >
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.churn} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="Month" hide />
                  <YAxis
                    domain={[0, 80]}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <TooltipShell title={String(label)} rows={[['Churn', one(Number(payload[0].value))]]} />
                      ) : null
                    }
                  />
                  <ReferenceLine
                    y={45}
                    stroke={COLORS.emerald}
                    strokeDasharray="4 4"
                    label={{ value: 'Target 45%', position: 'insideTopRight', fill: COLORS.emerald, fontSize: 9 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ChurnRatePct"
                    stroke={COLORS.coral}
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: COLORS.coral, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Revenue by Region" subtitle="Dim country · live from CSV">
            <Donut data={regionData} colors={[COLORS.cyan, COLORS.purple, COLORS.emerald]} centerLabel="Revenue" centerValue={gbpCompact(totalRevenue)} height={130} />
            <AxisLegend data={regionData} colors={[COLORS.cyan, COLORS.purple, COLORS.emerald]} />
          </ChartCard>
        </div>
      </div>
    </div>
  )
}

function CohortTab({ data }: TabProps) {
  const cohortNames = useMemo(() => {
    const seen = new Set<string>()
    return [...data.cohorts].sort((a, b) => a.Elapsed - b.Elapsed).map((c) => c.Cohort).filter((c) => (seen.has(c) ? false : (seen.add(c), true)))
  }, [data.cohorts])

  const matrix = useMemo(() => {
    const m = new Map<string, Map<number, number>>()
    data.cohorts.forEach((c) => {
      if (!m.has(c.Cohort)) m.set(c.Cohort, new Map())
      m.get(c.Cohort)!.set(c.Elapsed, c.RetentionPct)
    })
    return m
  }, [data.cohorts])

  const m1ByCohort = useMemo(() => {
    const map = new Map<string, number>()
    data.cohorts.forEach((c) => {
      if (c.Elapsed === 1) map.set(c.Cohort, c.RetentionPct)
    })
    return cohortNames.map((c) => ({ Cohort: c.replace(/ 20\d\d/, ''), RetentionPct: Math.round(map.get(c) ?? 0) }))
  }, [data.cohorts, cohortNames])

  const avgM1 = m1ByCohort.length
    ? Math.round(m1ByCohort.reduce((a, b) => a + b.RetentionPct, 0) / m1ByCohort.length)
    : 0

  const heatColor = (v: number) => {
    const t = Math.min(1, Math.max(0, v / 80))
    const r = Math.round(38 + (0 - 38) * t)
    const g = Math.round(48 + (229 - 48) * t)
    const b = Math.round(84 + (255 - 84) * t)
    return { rgb: `rgb(${r}, ${g}, ${b})`, rgba: `rgba(${r}, ${g}, ${b}, 0.92)` }
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-display text-sm font-bold text-softwhite">Cohort Retention Matrix</h4>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Avg M1 retention <span className="font-bold text-coral-brand">{avgM1}%</span> · hover cells for exact values
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="font-semibold text-cyan-brand">100%</span>
            <span className="h-2 w-24 rounded-full bg-gradient-to-r from-[#263054] to-[#00E5FF]" />
            <span className="font-semibold text-slate-500">15%</span>
          </div>
        </div>
        <div className="min-w-[560px]">
          <div className="grid gap-1" style={{ gridTemplateColumns: `92px repeat(12, minmax(40px, 1fr))` }}>
            <div />
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className={`pb-1 text-center text-[10px] font-semibold uppercase tracking-wider ${i === 1 ? 'text-coral-brand' : 'text-slate-500'}`}>
                M{i}
              </div>
            ))}
            {cohortNames.map((cohort) => (
              <div key={cohort} className="contents">
                <div className="flex items-center pr-1 text-[11px] font-semibold text-slate-400">
                  {cohort.replace(/ 20\d\d/, '')}
                </div>
                {Array.from({ length: 12 }, (_, col) => {
                  const v = matrix.get(cohort)?.get(col)
                  if (v === undefined) {
                    return <div key={col} className="rounded-md bg-white/[0.02] p-1.5 text-center text-[10px] text-slate-700">—</div>
                  }
                  const cell = heatColor(v)
                  return (
                    <div
                      key={col}
                      className="cursor-pointer rounded-md p-1.5 text-center text-[10px] font-semibold transition-transform duration-150 hover:scale-110"
                      style={{ background: cell.rgba, color: v > 52 ? '#0B1020' : '#A5B4D0' }}
                      title={`${cohort} · Month ${col}: ${v}%`}
                    >
                      {col === 0 ? `${v}%` : Math.round(v)}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="M1 Retention by Cohort" subtitle="% of each cohort returning in month 2" legend={[{ label: 'M1 retention', color: COLORS.coral }]}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m1ByCohort} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="Cohort" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 60]} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <TooltipShell title={String(label)} rows={[['Retained', one(Number(payload[0].value))]]} />
                    ) : null
                  }
                />
                <Bar dataKey="RetentionPct" radius={[5, 5, 0, 0]}>
                  {m1ByCohort.map((d, i) => (
                    <Cell key={i} fill={d.RetentionPct >= avgM1 ? COLORS.cyan : COLORS.coral} />
                  ))}
                </Bar>
                <ReferenceLine y={avgM1} stroke={COLORS.amber} strokeDasharray="4 4" label={{ value: `Avg ${avgM1}%`, position: 'insideTopRight', fill: COLORS.amber, fontSize: 9 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="rounded-xl border border-coral-brand/25 bg-coral-brand/10 p-5">
          <p className="font-display text-sm font-bold text-softwhite">The month-1 cliff</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Retention collapses from 100% to <span className="font-bold text-coral-brand">{100 - avgM1}% drop</span> in the
            first month. 34.5% of customers never make a second purchase, and lost customers (1,535) outnumber every other
            segment. A 5-point lift in M1 retention is the single biggest lever in the base.
          </p>
        </div>
      </div>
    </div>
  )
}

function RfmTab({ data }: TabProps) {
  const segments = useMemo(() => {
    const map = new Map<string, { customers: number; sumLtv: number }>()
    data.customers.forEach((c) => {
      const cur = map.get(c.RFM_Segment) ?? { customers: 0, sumLtv: 0 }
      cur.customers += 1
      cur.sumLtv += c.LTV_GBP
      map.set(c.RFM_Segment, cur)
    })
    return SEGMENT_ORDER.map((name) => {
      const s = map.get(name) ?? { customers: 0, sumLtv: 0 }
      return {
        name,
        customers: s.customers,
        pct: (s.customers / data.customers.length) * 100,
        avgLtv: s.customers ? s.sumLtv / s.customers : 0,
        revenue: s.sumLtv,
        color: SEGMENT_COLORS[name],
      }
    })
  }, [data.customers])

  const status = useMemo(() => {
    const map = new Map<string, number>()
    data.customers.forEach((c) => map.set(c.CustomerStatus, (map.get(c.CustomerStatus) ?? 0) + 1))
    return [...map.entries()].map(([name, value]) => ({ name, value }))
  }, [data.customers])

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ChartCard
          title="Customers by Segment"
          subtitle="RFM · 5 action-ready segments"
          legend={segments.map((s) => ({ label: s.name, color: s.color }))}
          className="lg:col-span-2"
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segments} layout="vertical" margin={{ top: 4, right: 20, left: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={92} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <TooltipShell
                        title={String(label)}
                        rows={[['Customers', int(Number(payload[0].value))]]}
                      />
                    ) : null
                  }
                />
                <Bar dataKey="customers" radius={[0, 5, 5, 0]}>
                  {segments.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Avg LTV by Segment" subtitle="Revenue per customer · £GBP" className="lg:col-span-3">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segments} layout="vertical" margin={{ top: 4, right: 20, left: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => gbpCompact(v)} />
                <YAxis type="category" dataKey="name" width={92} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <TooltipShell title={String(label)} rows={[['Avg LTV', gbp(Number(payload[0].value))]]} />
                    ) : null
                  }
                />
                <Bar dataKey="avgLtv" radius={[0, 5, 5, 0]}>
                  {segments.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ChartCard title="Customer Status" subtitle="Active vs churned at snapshot">
            <Donut
              data={status}
              colors={[COLORS.emerald, COLORS.coral]}
              centerLabel="Customers"
              centerValue={int(data.customers.length)}
              height={150}
            />
            <AxisLegend data={status} colors={[COLORS.emerald, COLORS.coral]} />
          </ChartCard>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] lg:col-span-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Segment</th>
                <th className="px-4 py-3">Customers</th>
                <th className="px-4 py-3">% of base</th>
                <th className="px-4 py-3">Avg LTV</th>
                <th className="px-4 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((s) => (
                <tr key={s.name} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-2.5 font-semibold" style={{ color: s.color }}>
                    {s.name}
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">{int(s.customers)}</td>
                  <td className="px-4 py-2.5 text-slate-400">{one(s.pct)}</td>
                  <td className="px-4 py-2.5 text-slate-300">{gbp(s.avgLtv)}</td>
                  <td className="px-4 py-2.5 text-slate-300">{gbpCompact(s.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ChurnTab({ data }: TabProps) {
  const lastChurn = data.churn[data.churn.length - 1]
  const freq = useMemo(() => {
    const map = new Map<string, number>()
    data.customers.forEach((c) => map.set(c.FrequencyBucket, (map.get(c.FrequencyBucket) ?? 0) + 1))
    return [...map.entries()].map(([name, value]) => ({ name, value }))
  }, [data.customers])

  const risk = useMemo(() => {
    const map = new Map<string, number>()
    data.customers.forEach((c) => {
      let bucket = ''
      if (c.LTV_GBP <= 0) bucket = 'One-time'
      else if (c.LTV_GBP < 500) bucket = 'Low value'
      else if (c.LTV_GBP < 2000) bucket = 'Mid value'
      else bucket = 'High value'
      map.set(bucket, (map.get(bucket) ?? 0) + 1)
    })
    return [...map.entries()].map(([name, value]) => ({ name, value }))
  }, [data.customers])

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Current Churn" value={one(lastChurn.ChurnRatePct)} sub="Dec 2011" color={COLORS.coral} />
        <KpiCard
          label="Avg Monthly Churn"
          value={one(data.churn.reduce((a, b) => a + b.ChurnRatePct, 0) / data.churn.length)}
          sub="across 11 months"
          color={COLORS.amber}
        />
        <KpiCard label="Churned Customers" value={int(lastChurn.ChurnedCustomers)} sub="in Dec 2011" color={COLORS.coral} />
        <KpiCard label="Active Customers" value={int(lastChurn.ActiveCustomers)} sub="in Dec 2011" color={COLORS.emerald} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ChartCard
          title="Monthly Churn vs Target"
          subtitle="Churn rate % · reference line at 45%"
          legend={[{ label: 'Churn rate', color: COLORS.coral }, { label: 'Target', color: COLORS.emerald }]}
          className="lg:col-span-3"
        >
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.churn} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="Month" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 80]} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <TooltipShell title={String(label)} rows={[['Churn rate', one(Number(payload[0].value))]]} />
                    ) : null
                  }
                />
                <ReferenceLine y={45} stroke={COLORS.emerald} strokeDasharray="4 4" label={{ value: 'Target 45%', position: 'insideTopRight', fill: COLORS.emerald, fontSize: 9 }} />
                <Line type="monotone" dataKey="ChurnRatePct" stroke={COLORS.coral} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.coral, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid grid-cols-1 gap-4 lg:col-span-2">
          <ChartCard
            title="Base Composition"
            subtitle="One-time buyers are the biggest leak"
            legend={[{ label: 'Churned', color: COLORS.coral }, { label: 'Active', color: COLORS.emerald }]}
          >
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.churn} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="Month" hide />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <TooltipShell
                          title={String(label)}
                          rows={payload.map((p) => [String(p.name), int(Number(p.value))])}
                        />
                      ) : null
                    }
                  />
                  <Bar dataKey="ActiveCustomers" stackId="a" fill={COLORS.emerald} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="ChurnedCustomers" stackId="a" fill={COLORS.coral} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Churn Composition" subtitle="Customers by order frequency">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Donut data={freq} colors={FREQ_COLORS} centerLabel="Customers" centerValue={int(data.customers.length)} height={140} />
            </div>
            <div className="flex-1">
              <AxisLegend data={freq} colors={FREQ_COLORS} />
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Customer Value" subtitle="LTV distribution of the base">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Donut data={risk} colors={[COLORS.coral, COLORS.amber, COLORS.cyan, COLORS.emerald]} centerLabel="Customers" centerValue={int(data.customers.length)} height={140} />
            </div>
            <div className="flex-1">
              <AxisLegend data={risk} colors={[COLORS.coral, COLORS.amber, COLORS.cyan, COLORS.emerald]} />
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

function GeoTab({ data }: TabProps) {
  const topProducts = useMemo(
    () => [...data.products].sort((a, b) => b.Revenue - a.Revenue).slice(0, 15).map((p) => ({
      name: p.Description.length > 32 ? `${p.Description.slice(0, 32)}…` : p.Description,
      Revenue: Math.round(p.Revenue),
    })),
    [data.products],
  )

  const topCountries = useMemo(
    () => [...data.countries].sort((a, b) => b.Revenue - a.Revenue).slice(0, 10).map((c) => ({
      name: c.Country,
      Revenue: Math.round(c.Revenue),
    })),
    [data.countries],
  )

  const regionData = useMemo(() => {
    const map = new Map<string, number>()
    data.countries.forEach((c) => map.set(c.Region, (map.get(c.Region) ?? 0) + c.Revenue))
    const order = ['Domestic (UK)', 'Europe', 'Rest of World']
    return order
      .filter((r) => map.has(r))
      .map((r) => ({ name: r === 'Domestic (UK)' ? 'Domestic' : r, value: Math.round(map.get(r) ?? 0) }))
  }, [data.countries])

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ChartCard title="Top 15 Products by Revenue" subtitle="From dim_product.csv · £GBP" className="lg:col-span-3">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 24, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => gbpCompact(v)} />
                <YAxis type="category" dataKey="name" width={190} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <TooltipShell title={String(label)} rows={[['Revenue', gbp(Number(payload[0].value))]]} />
                    ) : null
                  }
                />
                <Bar dataKey="Revenue" radius={[0, 5, 5, 0]} fill={COLORS.cyan}>
                  {topProducts.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? COLORS.cyan : i < 5 ? '#4DD7F7' : '#2A7F9E'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid grid-cols-1 gap-4 lg:col-span-2">
          <ChartCard title="Revenue by Region" subtitle="Live from dim_country.csv">
            <Donut data={regionData} colors={[COLORS.cyan, COLORS.purple, COLORS.emerald]} centerLabel="Total" centerValue={gbpCompact(regionData.reduce((a, b) => a + b.value, 0))} height={140} />
            <AxisLegend data={regionData} colors={[COLORS.cyan, COLORS.purple, COLORS.emerald]} />
          </ChartCard>
          <ChartCard title="Top 10 Countries by Revenue" subtitle="From dim_country.csv">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCountries} layout="vertical" margin={{ top: 4, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fill: '#94A3B8', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <TooltipShell title={String(label)} rows={[['Revenue', gbp(Number(payload[0].value))]]} />
                      ) : null
                    }
                  />
                  <Bar dataKey="Revenue" radius={[0, 5, 5, 0]} fill={COLORS.purple} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}

export default function PowerBIDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    let alive = true
    Promise.all([
      loadCSV('powerbi/monthly_revenue.csv'),
      loadCSV('powerbi/churn_trend.csv'),
      loadCSV('powerbi/cohort_matrix.csv'),
      loadCSV('powerbi/dim_country.csv'),
      loadCSV('powerbi/dim_product.csv'),
      loadCSV('powerbi/dim_customer.csv'),
    ])
      .then(([rev, churn, cohort, country, product, customer]) => {
        if (!alive) return
        setData({
          revenue: rev.map((r) => ({ Month: r.Month, Revenue: num(r.Revenue, 0) })),
          churn: churn
            .sort((a, b) => num(a.MonthKey, 0) - num(b.MonthKey, 0))
            .map((r) => ({
              Month: r.Month,
              ActiveCustomers: num(r.ActiveCustomers, 0),
              ChurnedCustomers: num(r.ChurnedCustomers, 0),
              ChurnRatePct: num(r.ChurnRatePct, 0),
            })),
          cohorts: cohort
            .sort((a, b) => num(a.CohortKey, 0) - num(b.CohortKey, 0) || num(a.Elapsed, 0) - num(b.Elapsed, 0))
            .map((r) => ({
              Cohort: r.Cohort,
              Elapsed: Number(r.Elapsed),
              RetentionPct: num(r.RetentionPct, 0),
            })),
          countries: country.map((r) => ({
            Country: r.Country,
            Customers: num(r.Customers, 0),
            Revenue: num(r.Revenue, 0),
            Region: r.Region,
          })),
          products: product.map((r) => ({
            Description: r.Description,
            Revenue: num(r.Revenue, 0),
            OrderCount: num(r.OrderCount, 0),
          })),
          customers: customer.map((r) => ({
            RFM_Segment: r.RFM_Segment,
            CustomerStatus: r.CustomerStatus,
            FrequencyBucket: r.FrequencyBucket,
            LTV_GBP: num(r.LTV_GBP, 0),
          })),
        })
      })
      .catch((err: Error) => alive && setError(err.message))
    return () => {
      alive = false
    }
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <p className="font-display text-sm font-bold text-coral-brand">Could not load dashboard data</p>
        <p className="max-w-md text-xs text-slate-500">
          The CSV files in <span className="font-mono text-cyan-brand">public/powerbi/</span> could not be fetched ({error}).
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-28">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-brand/20 border-t-cyan-brand" />
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex overflow-x-auto rounded-xl border border-white/10 bg-navy/60 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-300 sm:text-sm ${
                tab === t.key
                  ? 'bg-gradient-to-r from-cyan-brand to-purple-brand text-navy shadow-glow-cyan'
                  : 'text-slate-400 hover:text-softwhite'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-wider text-slate-500">
          Live from <span className="font-mono text-cyan-brand">powerbi/data/*.csv</span>
        </p>
      </div>

      {tab === 'overview' && <OverviewTab data={data} />}
      {tab === 'cohort' && <CohortTab data={data} />}
      {tab === 'rfm' && <RfmTab data={data} />}
      {tab === 'churn' && <ChurnTab data={data} />}
      {tab === 'geo' && <GeoTab data={data} />}
    </div>
  )
}
