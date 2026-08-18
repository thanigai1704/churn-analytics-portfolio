# Power BI — Customer Retention & Churn Dashboard

**Real dataset:** UCI Online Retail — 541,909 transactions, Dec 2010 – Dec 2011.
**Deliverable:** a real, buildable 5-page churn analytics dashboard that reproduces every
number on your React portfolio site — same cleaning, same metrics, same story.

> Everything is generated locally from `powerbi/data/*.csv` (built from the real dataset
> by `prepare_data.py`). No internet source required.

---

## 1. What you have

| File | What it is |
|---|---|
| `data/*.csv` | Star-schema data files (verified against the site's `computed.json`) |
| `measures.dax` | All 51 DAX measures with format annotations |
| `build_pbixproj.py` | Generates the full pbi-tools `pbixproj` (model + report) and compiles the `.pbit` |
| `pbixproj/` | Generated source-control-friendly project (model JSON, M queries, report pages) |
| `Churn Analytics.pbit` | **The buildable template** — open in Power BI Desktop, refresh, save as `.pbix` |

The 5 pages (all numbers match the website):

| Page | Focus | Visuals |
|---|---|---|
| 1. Executive Overview | Health of the business | 4 KPI cards, revenue trend, revenue by country |
| 2. Cohorts & Retention | Where customers leak | M1 cards, cohort retention matrix, retention curve |
| 3. Churn Deep-Dive | Why churn happens | Churn-rate cards, churn trend, active vs churned, status donut |
| 4. RFM & LTV | Who your customers are | LTV cards, segment donut, LTV by segment, journey funnel |
| 5. Product & Geography | What/where sells | Region treemap, country table |

---

## 2. Prerequisites

- Python 3.10+ with `pandas` (for `prepare_data.py`)
- Power BI Desktop (free) — Microsoft Store build (2.156.x) on this machine
- A local `pbi-tools` 1.3.0 **Desktop** build (see §4)

---

## 3. Build it (one command)

```powershell
cd powerbi
python prepare_data.py   # once: regenerates data/*.csv from the raw dataset
python build_pbixproj.py # generates pbixproj/ and compiles "Churn Analytics.pbit"
```

`build_pbixproj.py`:

1. Parses `measures.dax` (51 measures) and assigns each to its table + format string
   (`£#,##0.00` / `0.00%` / `#,##0` / `0.0"x"`).
2. Writes the pbi-tools `pbixproj`: 8 tables (star schema + `Funnel Stages` calculated
   table), 5 relationships, all columns/measures, and 5 report pages with 26 visuals
   (cards, line/column/donut charts, cohort matrix, funnel, treemap, table).
3. Compiles it with the local Desktop pbi-tools → `Churn Analytics.pbit`.

---

## 4. pbi-tools (Desktop edition, local build)

The Store edition of Power BI Desktop blocks the official `pbi-tools` installer from
finding it. This machine has a locally built **1.3.0 Desktop** edition at:

```
C:\Users\THANIG~1\AppData\Local\Temp\opencode\pbi-src\src\PBI-Tools\bin\Release\net472\win10-x64\pbi-tools.exe
```

It was built from `release/1.3.0` with three local patches (repointed PBI Desktop DLL
HintPaths to the WindowsApps `bin`, added `AssemblyVersionInformation`, and the
`dotnet build ... -c Release` command). `build_pbixproj.py` calls it directly — you do
not need to rebuild it.

---

## 5. From template to dashboard (.pbit → .pbix) — the only manual step

A `.pbit` is a *template*: it contains the model + report but **no data**. The data lives
in the M queries (they read `powerbi/data/*.csv`). To get the real `.pbix`:

1. Open **Power BI Desktop** → **File → Open** → select `powerbi/Churn Analytics.pbit`.
2. Desktop will prompt that data hasn't been loaded — click **Refresh** (or
   **File → Options → Data source settings** and point the queries at
   `powerbi/data/` if prompted).
3. Wait for the ~398K-row fact table to import (a minute or two).
4. **File → Save As →** `Churn Analytics.pbx` next to the `.pbit`.

> Note: because it's a Store build, Windows doesn't register `.pbit`/`.pbix` file
> associations — always open via **File → Open** inside Desktop.

---

## 6. Sanity check — numbers that must match your website

| Measure | Value |
|---|---|
| `Total Revenue` | **£8,911,407.90** |
| `Total Customers` | **4,338** |
| `Avg LTV` | **£2,054.27** |
| `Repeat Purchase Rate %` | **65.5%** |
| `Avg M1 Retention %` | **21.5%** |
| `Current Churn Rate %` | **54.4%** |
| `Top 20% LTV Share` | **74.6%** |
| `LTV Multiple` | **7.0×** |

If any number differs, the CSV paths in the M queries point at the wrong files.

---

## 7. Model notes (for the interview)

- **Star schema:** `fact_sales` ↔ `dim_customer` / `dim_product` / `dim_country` /
  `dim_date` (on `DateKey`). `cohort_matrix` and `churn_trend` are pre-computed
  analysis tables sliced directly — a valid, defensible pattern that keeps the DAX
  simple and the workbook fast.
- **`Funnel Stages`** is a `DATATABLE` calculated table so the native **Funnel** visual
  has an axis; `Funnel Value` uses `SWITCH` to return each stage's `%` measure.
- **Formatting lives in the measures** — the report uses them directly, so the dashboard
  can't drift from the site's numbers.

---

## 8. Interview talking points

1. **"Why these metrics?"** — Churn (54.4% current, 60.8% avg) and M1 retention (21.5%)
   are the single biggest levers; the cohort matrix proves where the leak is.
2. **"How did you clean the data?"** — 541,909 → 397,884 rows: dropped missing CustomerID,
   cancellations (InvoiceNo starting `C`), and negative/zero quantity & unit price.
3. **"How is the model built?"** — Star schema: `fact_sales` ↔ dims on `DateKey`;
   pre-computed cohort & churn tables kept separate; one measure table with all DAX.
4. **"Explain your DAX."** — Walk through `Repeat Purchase Rate %`, `Avg M1 Retention %`,
   the `Top 20% LTV Share` (TOPN), and `Churn Rate (Dynamic) %` (derives churn live from
   the fact table, no pre-computed table).
5. **"What would you do next?"** — Conquer the month-1 cliff (incentivize a 2nd purchase
   within 30 days), champion program for the 980 Champions (22.6% of customers),
   win-back for the 1,535 Lost + 299 At Risk.

---

## 9. Optional: dynamic cohort & churn (extra credit)

The dashboard ships with pre-computed `cohort_matrix` and `churn_trend`. To prove you can
derive them live in DAX during an interview, `measures.dax` includes
`Churn Rate (Dynamic) %`. The live cohort matrix pattern:

```dax
Cohort Retention (Live) % =
VAR CohortMonth = MAX(cohort_matrix[CohortKey])          -- or a disconnected month table
VAR CurrentMonth = CohortMonth + MAX(cohort_matrix[Elapsed])
VAR Base = CALCULATE(DISTINCTCOUNT(fact_sales[CustomerID]),
            REMOVEFILTERS(dim_date), dim_customer[FirstMonthKey] = CohortMonth)
VAR Retained = CALCULATE(DISTINCTCOUNT(fact_sales[CustomerID]),
            REMOVEFILTERS(dim_date),
            dim_customer[FirstMonthKey] = CohortMonth,
            fact_sales[MonthKey] = CurrentMonth)
RETURN DIVIDE(Retained, Base, 0) * 100
```

---

## 10. Publishing (optional)

Publish to the **Power BI Service** (free) → File → **Publish to web** (public) or embed
in a report for your portfolio. Note: publish-to-web makes the report public — fine for a
portfolio.
