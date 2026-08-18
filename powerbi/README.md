# Power BI Dashboard — Customer Retention & Churn

Power BI deliverables for the churn analytics portfolio, built from the **real**
UCI Online Retail dataset (541,909 transactions, Dec 2010 – Dec 2011).

## Files

| Path | Purpose |
|---|---|
| `Churn Analytics.pbit` | **Generated template** — model + 5-page report, no data yet |
| `build_pbixproj.py` | Generates the pbi-tools `pbixproj/` and compiles the `.pbit` |
| `pbixproj/` | Generated source-control-friendly project (model, M queries, report pages) |
| `prepare_data.py` | Reproduces the star-schema CSVs from the raw dataset |
| `data/fact_sales.csv` | 397,884 cleaned transactions |
| `data/dim_customer.csv` | 4,338 customers + RFM segment + LTV + status |
| `data/dim_product.csv` | Product master |
| `data/dim_country.csv` | Country + region roll-up |
| `data/dim_date.csv` | Calendar table |
| `data/cohort_matrix.csv` | Pre-computed cohort retention matrix |
| `data/churn_trend.csv` | Pre-computed monthly churn trend |
| `measures.dax` | All 51 DAX measures with format annotations |
| `BUILD-GUIDE.md` | How it's built, the pbit→pbix step, and interview prep |

## Quick start

```powershell
python powerbi/prepare_data.py
python powerbi/build_pbixproj.py
```

Then the only manual step: open `powerbi/Churn Analytics.pbit` in Power BI Desktop,
**Refresh** (imports the CSVs via the M queries), and **Save As** `Churn Analytics.pbx`.
Full details in `BUILD-GUIDE.md`.

Every number matches the React site: revenue £8.91M, 4,338 customers, M1 retention 21.5%,
current churn 54.4%, LTV multiple 7×, top-20% LTV share 74.6%.
