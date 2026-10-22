import { useMemo, useState } from 'react'
import { CheckCircle2, Database, Terminal, XCircle } from 'lucide-react'
import Reveal from './ui/Reveal'
import SectionHeading from './ui/SectionHeading'
import GlassCard from './ui/GlassCard'
import { sqlResults } from '../data/analytics'

const MONTHS: Record<number, string> = {
  24132: 'Dec 10', 24133: 'Jan 11', 24134: 'Feb 11', 24135: 'Mar 11', 24136: 'Apr 11',
  24137: 'May 11', 24138: 'Jun 11', 24139: 'Jul 11', 24140: 'Aug 11', 24141: 'Sep 11',
  24142: 'Oct 11', 24143: 'Nov 11', 24144: 'Dec 11',
}

const LABELS: Record<string, string> = {
  rows_analysed: 'Cleaned rows', customers: 'Customers', invoices: 'Invoices',
  purchase_occasions: 'Occasions', revenue_qty_x_price: 'Σ(Qty × Price)',
  revenue_column: 'Σ(Revenue col.)', repeat_rate_invoices_pct: 'Repeat (invoices) %',
  repeat_rate_occasions_pct: 'Repeat (occasions) %', top20_customers: 'Top-20% customers',
  top20_share_pct: 'Top-20% rev share %', active_60d: 'Active ≤60d',
  inactive_90d: 'Silent >90d', inactive_180d: 'Silent >180d',
  RFM_Segment: 'Segment', pct: 'Share %', MonthKey: 'Month', non_return_pct: 'Non-return %',
}

const fmtCell = (col: string, v: string | number) => {
  if (col === 'MonthKey' && typeof v === 'number') return MONTHS[v] ?? String(v)
  if (col === 'RFM_Segment') return String(v)
  if (typeof v === 'number' && v > 100 && !Number.isInteger(v)) return v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return typeof v === 'number' ? v.toLocaleString('en-GB') : String(v)
}

export default function SqlAudit() {
  const [open, setOpen] = useState(0)
  const passed = sqlResults.checks.filter((c) => c.pass).length

  // Q7 series formatted for a compact table
  const q7 = sqlResults.queries.find((q) => q.id === 'Q7')!
  const series = q7.rows.map((r) => ({ month: MONTHS[r[0] as number]!, active: r[1], rate: r[2] }))

  const summaryCols = useMemo(
    () => ['rows_analysed', 'customers', 'invoices', 'purchase_occasions'],
    [],
  )

  return (
    <section id="sql-audit" className="relative px-5 py-24 sm:px-8">
      <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-cyan-brand/8 blur-[130px]" />
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="SQL Verification Layer"
          title="Numbers You Can"
          highlight="Audit in SQL"
          description="Every headline metric is re-derived with 7 hand-written SQLite queries against the cleaned star schema (fact_sales · dim_customer), executed by analysis/run_sql.py exactly as printed below. Cross-checks where SQL and the Python pipeline disagree would fail the build."
        />

        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 text-emerald-brand">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-display text-2xl font-bold">{passed}/{sqlResults.checks.length}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">reconciliation checks passed</p>
            </GlassCard>
            <GlassCard className="p-5 col-span-2 lg:col-span-3">
              <div className="flex items-center gap-2 text-cyan-brand">
                <Database className="h-4 w-4" />
                <span className="font-display text-2xl font-bold">SQLite</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                in-memory DB loaded from powerbi/data/*.csv · queries verbatim from
                sql/retention_validation.sql
              </p>
            </GlassCard>
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 text-purple-brand">
                <Terminal className="h-4 w-4" />
                <span className="font-display text-2xl font-bold">7</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">validation queries executed</p>
            </GlassCard>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <GlassCard className="mt-6 overflow-hidden p-0">
            <div className="border-b border-white/10 px-5 py-4">
              <h3 className="font-display text-base font-bold text-softwhite">Reconciliation results</h3>
              <p className="text-[11px] text-slate-500">
                SQL value vs pipeline value — any mismatch fails the runner and the build
              </p>
            </div>
            <div className="max-h-[420px] overflow-y-auto px-5 py-3">
              <div className="space-y-1.5">
                {sqlResults.checks.map((c) => (
                  <div
                    key={c.check}
                    className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs"
                  >
                    {c.pass ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-brand" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-coral-brand" />
                    )}
                    <span className="flex-1 text-slate-300">{c.check.replace(' = ', ' ')} <span className="text-slate-600">(expect {c.expected})</span></span>
                    <span className={`font-mono font-bold ${c.pass ? 'text-emerald-brand' : 'text-coral-brand'}`}>
                      {c.sql ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Reveal delay={0.2} className="lg:col-span-2">
            <GlassCard className="h-full p-5 sm:p-6">
              <h3 className="font-display text-base font-bold text-softwhite">Q7 · Monthly non-return series</h3>
              <p className="text-[11px] text-slate-500">
                LEFT JOIN between consecutive monthly customer sets
              </p>
              <div className="mt-4 space-y-1">
                {series.map((s) => (
                  <div key={s.month} className="flex items-center gap-3 text-xs">
                    <span className="w-12 text-slate-400">{s.month}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-coral-brand to-amber-brand"
                        style={{ width: `${(s.rate as number) / 0.75}%` }}
                      />
                    </div>
                    <span className="font-mono text-slate-300">{s.rate}%</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.25} className="lg:col-span-3">
            <GlassCard className="h-full p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-base font-bold text-softwhite">
                  Executed SQL {sqlResults.queries[open] ? `· ${sqlResults.queries[open].id}` : ''}
                </h3>
                <div className="flex gap-1">
                  {sqlResults.queries.map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() => setOpen(i)}
                      className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold transition-colors ${
                        i === open ? 'bg-cyan-brand/20 text-cyan-brand' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                      }`}
                    >
                      Q{q.id.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {sqlResults.queries[open] && (
                <>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">{sqlResults.queries[open].title}</p>
                  <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-navy/80 p-4 font-mono text-[10.5px] leading-relaxed text-slate-300">
                    {sqlResults.queries[open].sql}
                  </pre>
                  <table className="mt-3 w-full text-left text-[11px]">
                    <thead>
                      <tr className="text-slate-500">
                        {sqlResults.queries[open].columns.map((col) => (
                          <th key={col} className="border-b border-white/10 pb-1 pr-3 font-semibold">
                            {LABELS[col] ?? col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-mono text-slate-300">
                      {sqlResults.queries[open].rows.slice(0, open === 0 ? summaryCols.length : 5).map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="py-1 pr-3">
                              {fmtCell(sqlResults.queries[open].columns[ci], cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
