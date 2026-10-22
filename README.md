# UK Online Retail — Customer Retention & Churn Analytics

Live dashboard: https://churn-analytics-portfolio.vercel.app
Dataset: [UCI Online Retail](https://archive.ics.uci.edu/dataset/352/online+retail) (541,909 raw rows, Dec 2010 – Dec 2011, GBP)

Every number shown on the dashboard and in the report is computed by the scripts in
this repository and cross-verified by the SQL layer — nothing is hard-coded or
modeled without being labelled as an assumption.

## Pipeline

```
data/Online_Retail.xlsx  (raw, 541,909 rows)
        │
        ├── analysis/analyze.py ──────────► src/data/computed.json
        │        cleaning → cohorts → RFM → churn/inactivity stats
        │
        ├── powerbi/prepare_data.py ──────► powerbi/data/*.csv (star schema)
        │        fact_sales · dim_customer · dim_date · dim_country
        │
        └── analysis/run_sql.py + sql/retention_validation.sql
                 SQLite in-memory DB   → src/data/sqlResults.json
                 7 queries / 17 pass-fail checks vs the Python pipeline
```

1. **Cleaning** — 144,025 rows excluded → **397,884 clean rows**, **4,338 customers**,
   **37 countries**, **GBP 8.9M** revenue. Exclusions: 135,080 rows with missing CustomerID,
   credit-note invoices (prefixed C), and lines with zero or negative quantity/price.
2. **Analytics** — `analysis/analyze.py` writes `src/data/computed.json` (cohort matrix,
   retention curve, RFM segments, monthly non-return series, inactivity gaps, funnel).
3. **SQL verification** — `python analysis/run_sql.py` loads the star schema CSVs into an
   in-memory SQLite database, executes the queries in `sql/retention_validation.sql` verbatim,
   and fails the run (exit 1) if any of 17 reconciliation checks disagrees with the Python
   pipeline. Results are rendered in the dashboard's "SQL Verification Layer" section.
4. **Frontend** — Vite + React + Recharts. Lazy-loaded sections read only `computed.json`
   and `sqlResults.json`; UI strings that restate metrics must match those files.
5. **Power BI** — `powerbi/prepare_data.py` writes the star schema plus `cohort_matrix.csv`;
   the `.pbit` streams it (51 DAX measures). Refresh by re-running prepare_data.py.

## Reproduce

```bash
python analysis/analyze.py             # dashboard metrics (writes src/data/computed.json)
python powerbi/prepare_data.py         # star-schema CSVs for Power BI / SQL layer
python analysis/run_sql.py             # SQL verification (writes src/data/sqlResults.json)
npm install
npm run build                          # type-check + production bundle
```

## Metric definitions (interview-defensible)

| Metric | Definition |
| --- | --- |
| Monthly non-return (a.k.a. monthly churn) | Customers active in month M absent in month M+1. Read for **trend**, not as a definitive churned count; labelled "monthly non-return" on the dashboards to avoid implying permanent departure. |
| Definitive separation | Recency-based: no activity in the last 90 days (inactive90 = 1,441 / 33.2%) or 180 days (858 / 19.8%). Thresholds come from the observed inter-purchase gap distribution (median gap 28 days, P90 = 110 days). |
| Cohort M1 retention | Share of a cohort ordering again within the first month. Curve values are **simple (unweighted) means across the cohorts with a complete observation window for that month** — the M1 average spans 11 cohorts, not 12. |
| Purchase occasion | Distinct `InvoiceDate` **timestamp** per customer (18,440 across the base). Distinct invoices are 18,532 because a few credit notes share the invoice's exact timestamp. Both repeat rates are reported: 65.6% (invoices) vs 65.5% (occasions). |
| Avg LTV / customer value | Total observed revenue per customer over the 12-month window (GBP 2,054 avg). A historical measure — **not** a predictive lifetime-value model. |
| Win-back rate (35.1%) | Share of **all** 4,338 customers with at least one observed gap ≥ 90 days followed by a later purchase. It is a base-level behavioural fact, **not** a campaign response rate. |
| Risk bands | Transparent recency rules: active ≤60 d → Low, silent 61–180 d → Medium, silent >180 d → High. Rule-based scoring; **no trained model is claimed**. |

## Repo layout

```
analysis/         analyze.py · run_sql.py · Online_Retail.xlsx
powerbi/          prepare_data.py · data/*.csv (star schema)
sql/              retention_validation.sql (single source of truth for the SQL layer)
src/data/         computed.json (authoritative metrics) · sqlResults.json (SQL audit)
src/components/   dashboard sections (lazy-loaded)
```

## Power BI dataset

`powerbi/prepare_data.py` writes:

- `fact_sales.csv` (397,884 rows, full InvoiceDate timestamps so occasion counts reconcile in SQL)
- `dim_customer.csv` (RFM segment, recency bands, status)
- `dim_date.csv`, `dim_country.csv`, `cohort_matrix.csv`, `churn_by_month.csv`

The 8 multi-country customers make dim_country customer counts (4,346) exceed the distinct
headcount (4,338) — documented, not a bug.
