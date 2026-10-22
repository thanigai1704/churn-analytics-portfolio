import computed from './computed.json'
import computedSql from './sqlResults.json'

interface SqlResultsFile {
  engine: string
  sourceFile: string
  queries: { id: string; title: string; sql: string; columns: string[]; rows: (string | number)[][] }[]
  checks: { check: string; expected: number; sql: number | null; pass: boolean }[]
  allPassed: boolean
}

export type SegmentKey =
  | 'champions'
  | 'loyal'
  | 'potential'
  | 'atRisk'
  | 'lost'

export interface KpiMetric {
  label: string
  value: string
  delta: string
  deltaNote: string
  deltaPositive: boolean
  icon: string
}

export const source = computed.source
export const dataQuality = computed.dataQuality
export const metrics = computed.metrics
export const deltas = computed.deltas
export const churnSummary = computed.churnSummary

export const m1Retention = computed.metrics.m1Retention
export const m1Dropoff = computed.metrics.m1Dropoff

export const inactivity = computed.inactivity
export const metricNotes = computed.metricDefinitionNotes
export const sqlResults = computedSql as SqlResultsFile
export const orderContext = {
  invoiceInstances: computed.metrics.invoiceInstances,
  purchaseOccasions: computed.metrics.purchaseOccasions,
  repeatRateInvoices: computed.metrics.repeatRateInvoices,
}

const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US')
const gbp = (n: number) => `£${fmtInt(n)}`

export const executiveMetrics: KpiMetric[] = [
  {
    label: 'Total Customers',
    value: fmtInt(computed.metrics.totalCustomers),
    delta: `${Math.abs(computed.deltas.customers.value)}%`,
    deltaNote: computed.deltas.customers.note,
    deltaPositive: computed.deltas.customers.positive,
    icon: 'users',
  },
  {
    label: 'Month-1 Retention',
    value: `${computed.metrics.m1Retention}%`,
    delta: `${Math.abs(computed.deltas.retention.value)}pts`,
    deltaNote: computed.deltas.retention.note,
    deltaPositive: computed.deltas.retention.positive,
    icon: 'retention',
  },
  {
    label: 'Monthly Non-Return',
    value: `${computed.metrics.churnRate}%`,
    delta: `${Math.abs(computed.deltas.churn.value)}pts`,
    deltaNote: computed.deltas.churn.note,
    deltaPositive: computed.deltas.churn.positive,
    icon: 'churn',
  },
  {
    label: 'Avg Customer Value',
    value: gbp(computed.metrics.avgLtv),
    delta: `${computed.deltas.ltv.value}×`,
    deltaNote: computed.deltas.ltv.note,
    deltaPositive: computed.deltas.ltv.positive,
    icon: 'money',
  },
  {
    label: 'Repeat Purchase Rate',
    value: `${computed.metrics.repeatPurchaseRate}%`,
    delta: `${computed.deltas.repeat.value}%`,
    deltaNote: computed.deltas.repeat.note,
    deltaPositive: computed.deltas.repeat.positive,
    icon: 'repeat',
  },
]

export const cohortMonths = computed.cohortMonths
export const cohortMatrix = computed.cohortMatrix
export const cohortCustomers = computed.cohortCustomers
export const retentionCurve = computed.retentionCurve

export interface RfmSegment {
  key: SegmentKey
  name: string
  description: string
  customers: number
  pct: number
  avgOrders: number
  avgLtv: number
  color: string
  action: string
}

const segData = computed.segments

export const rfmSegments: RfmSegment[] = [
  {
    key: 'champions',
    name: 'Champions',
    description: 'Recent buyers (≤60 days) with 5+ orders — the top of the base and the bulk of revenue.',
    ...segData.Champions,
    color: '#10B981',
    action: 'VIP perks, early access & referral rewards to protect the top of the base',
  },
  {
    key: 'loyal',
    name: 'Loyal Customers',
    description: 'Steady repeat buyers (3+ orders) still active within 180 days. The dependable core.',
    ...segData.Loyal,
    color: '#00E5FF',
    action: 'Tier-up loyalty program and bundle upsells',
  },
  {
    key: 'potential',
    name: 'Potential Loyalists',
    description: 'Recent buyers on their second order — one nudge away from real loyalty.',
    ...segData['Potential Loyalists'],
    color: '#8B5CF6',
    action: 'Second-purchase incentives while momentum is fresh',
  },
  {
    key: 'atRisk',
    name: 'At Risk',
    description: 'Repeat buyers who went quiet 4–10 months ago. The win-back window is now.',
    ...segData['At Risk'],
    color: '#F59E0B',
    action: 'Time-boxed win-back campaigns & personalized offers',
  },
  {
    key: 'lost',
    name: 'Lost Customers',
    description: 'Inactive for 10+ months or one-time buyers — the largest pool, cheapest to deprioritize.',
    ...segData.Lost,
    color: '#FF5A5F',
    action: 'Low-cost re-engagement email with a high-value incentive',
  },
]

export const churnTrend = computed.churnTrend
export const churnReasons = computed.churnReasons
export const funnelStages = computed.funnel

export const riskDistribution = [
  { name: 'Low Risk', value: computed.risk.low, color: '#10B981' },
  { name: 'Medium Risk', value: computed.risk.medium, color: '#F59E0B' },
  { name: 'High Risk', value: computed.risk.high, color: '#FF5A5F' },
]

const journeyColors = ['#00E5FF', '#8B5CF6', '#10B981', '#F59E0B', '#FF5A5F'] as const

export const journeyFlow = computed.journey.map((stage, i) => ({
  ...stage,
  color: journeyColors[i],
}))

export const recommendations = [
  {
    title: 'Attack the Month-1 Cliff',
    body: '34.5% of buyers never place a second order. Launch a post-purchase series with a second-purchase incentive inside the first 30 days — before the window closes.',
    impact: 'Target: +5pts M1 retention',
    color: '#00E5FF',
  },
  {
    title: 'Champion a Champion Program',
    body: '980 Champions (22.6% of customers) carry the base at £6,144 average observed value. Turn them into advocates with early access and referral rewards.',
    impact: 'Measured: £6.1K avg value',
    color: '#8B5CF6',
  },
  {
    title: 'Re-activate At-Risk Customers',
    body: '299 at-risk and 1,535 lost customers still hold real spend history. Historically 35.1% of the full base has returned after a 90+ day silence at least once — evidence that a 90-day win-back window is reachable, though campaign response should be measured, not assumed.',
    impact: 'Measured: 35.1% historic return rate',
    color: '#10B981',
  },
  {
    title: 'Stabilize the Funnel Top',
    body: 'H2 acquisition fell 40.4% vs H1 while the monthly non-return rate trended down to 54.4%. Rebalance spend toward the funnel top to sustain the base.',
    impact: 'Measured: 9pts non-return improvement YTD',
    color: '#F59E0B',
  },
]

export const heroStats = [
  {
    value: Math.round(computed.source.rows / 1000),
    suffix: 'K+',
    label: 'Transactions Analyzed',
    decimals: 0,
  },
  {
    value: Math.round(computed.metrics.m1Dropoff),
    suffix: '%',
    label: 'Month-1 Drop-off Identified',
    decimals: 0,
  },
  {
    value: 7,
    suffix: '×',
    label: 'LTV of Retained vs One-Time Buyers',
    decimals: 0,
  },
  {
    value: computed.source.countries,
    suffix: '',
    label: 'Countries Analyzed',
    decimals: 0,
  },
]

export const techStack = [
  'Python / Pandas',
  'Cohort Analysis',
  'RFM Segmentation',
  'SQL Validation (SQLite)',
  'Rule-Based Risk Scoring',
  'Power BI',
]
