"""
Prepare Power BI import-ready files from the real UCI Online Retail dataset.

Applies the same cleaning rules as ../analysis/analyze.py so every number on the
Power BI dashboard matches the React portfolio site. Emits a star schema:

    fact_sales    - order-line level transactions (clean rows only)
    dim_customer  - one row per customer + RFM segment + LTV + status
    dim_product   - one row per StockCode
    dim_country   - one row per country + region roll-up
    dim_date      - calendar table (2010-01-01 .. 2011-12-31)
    cohort_matrix - long-format cohort retention table (pre-computed)

Output: ./data/*.csv
"""
import json
import os
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
RAW = HERE.parent / "analysis" / "Online_Retail.xlsx"
OUT = HERE / "data"
SNAPSHOT = pd.Timestamp("2011-12-09")
LAST_COMPLETE_MONTH = 2011 * 12 + 11  # Nov 2011; Dec 2011 is partial

OUT.mkdir(exist_ok=True)

# ---------------------------------------------------------------- load & clean
df = pd.read_excel(RAW, dtype={"CustomerID": str}, parse_dates=["InvoiceDate"])
total_rows = len(df)

df = df[df["CustomerID"].notna()].copy()
df["CustomerID"] = df["CustomerID"].str.strip()
df["InvoiceNo"] = df["InvoiceNo"].astype(str).str.strip().str.upper()

df = df[
    (~df["InvoiceNo"].str.startswith("C"))
    & (df["Quantity"] > 0)
    & (df["UnitPrice"] > 0)
].copy()

df["Revenue"] = df["Quantity"] * df["UnitPrice"]
df["MonthKey"] = df["InvoiceDate"].dt.year * 12 + df["InvoiceDate"].dt.month
df["Year"] = df["InvoiceDate"].dt.year
df["MonthNum"] = df["InvoiceDate"].dt.month

# ---------------------------------------------------------------- dim_country
EU = {
    "France", "Germany", "Netherlands", "Belgium", "Spain", "Italy", "Portugal",
    "Ireland", "Sweden", "Finland", "Denmark", "Poland", "Austria", "Czech Republic",
    "Lithuania", "Iceland", "Luxembourg", "Malta", "Cyprus", "Slovenia", "Slovakia",
    "Hungary", "Romania", "Bulgaria", "Greece", "Croatia", "Estonia", "Latvia",
    "Norway", "Switzerland", "Channel Islands", "RSA",
}

def region_of(country: str) -> str:
    if country == "United Kingdom":
        return "Domestic (UK)"
    if country in EU:
        return "Europe"
    return "Rest of World"

country_df = (
    df.groupby("Country")
    .agg(
        Customers=("CustomerID", "nunique"),
        Revenue=("Revenue", "sum"),
        Orders=("InvoiceNo", "nunique"),
    )
    .reset_index()
    .rename(columns={"Country": "Country"})
)
country_df["Region"] = country_df["Country"].map(region_of)
country_df.to_csv(OUT / "dim_country.csv", index=False)

# ---------------------------------------------------------------- dim_customer
orders = df.groupby("CustomerID").agg(
    FirstPurchaseDate=("InvoiceDate", "min"),
    LastPurchaseDate=("InvoiceDate", "max"),
    Monetary=("Revenue", "sum"),
    OrderSessions=("InvoiceDate", "nunique"),
    Country=("Country", lambda s: s.mode().iloc[0] if not s.mode().empty else "Unknown"),
).reset_index()
orders["FirstMonthKey"] = orders["FirstPurchaseDate"].dt.year * 12 + orders["FirstPurchaseDate"].dt.month
orders["RecencyDays"] = (SNAPSHOT - orders["LastPurchaseDate"]).dt.days
orders["AvgOrderValue"] = orders["Monetary"] / orders["OrderSessions"]

def segment(row):
    r, f = row["RecencyDays"], row["OrderSessions"]
    if r <= 60 and f >= 5:
        return "Champions"
    if r <= 180 and f >= 3:
        return "Loyal"
    if r <= 120 and f >= 2:
        return "Potential Loyalists"
    if r <= 300 and f >= 2:
        return "At Risk"
    return "Lost"

orders["RFM_Segment"] = orders.apply(segment, axis=1)
orders["CustomerStatus"] = np.where(orders["RecencyDays"] <= 180, "Active", "Churned")

def freq_bucket(f):
    if f == 1:
        return "1 order"
    if f <= 3:
        return "2-3 orders"
    if f <= 9:
        return "4-9 orders"
    return "10+ orders"

orders["FrequencyBucket"] = orders["OrderSessions"].map(freq_bucket)
orders["Country"] = orders["Country"].astype(str)
orders["Region"] = orders["Country"].map(region_of)

customer_df = orders.rename(columns={"Monetary": "LTV_GBP"}).sort_values("CustomerID")
customer_df.to_csv(OUT / "dim_customer.csv", index=False)

# ---------------------------------------------------------------- dim_product
product_df = (
    df.groupby("StockCode")
    .agg(
        Description=("Description", lambda s: s.mode().iloc[0] if not s.mode().empty else ""),
        MedianUnitPrice=("UnitPrice", "median"),
        UnitsSold=("Quantity", "sum"),
        Revenue=("Revenue", "sum"),
        FirstSoldDate=("InvoiceDate", "min"),
        LastSoldDate=("InvoiceDate", "max"),
        OrderCount=("InvoiceNo", "nunique"),
    )
    .reset_index()
)
product_df["Description"] = product_df["Description"].astype(str).str.strip()
product_df = product_df[product_df["Description"].str.len() > 0]
product_df.to_csv(OUT / "dim_product.csv", index=False)

# ---------------------------------------------------------------- dim_date
date_df = pd.DataFrame({"Date": pd.date_range("2010-01-01", "2011-12-31", freq="D")})
date_df["Year"] = date_df["Date"].dt.year
date_df["MonthNum"] = date_df["Date"].dt.month
date_df["MonthName"] = date_df["Date"].dt.strftime("%b")
date_df["MonthYear"] = date_df["Date"].dt.strftime("%Y-%m")
date_df["Quarter"] = date_df["Date"].dt.quarter
date_df["QuarterLabel"] = "Q" + date_df["Quarter"].astype(str) + " " + date_df["Date"].dt.strftime("%Y")
date_df["WeekNum"] = date_df["Date"].dt.isocalendar().week.astype(int)
date_df["DayOfWeek"] = date_df["Date"].dt.day_name()
date_df["IsWeekend"] = date_df["Date"].dt.weekday >= 5
date_df["MonthKey"] = date_df["Year"] * 12 + date_df["MonthNum"]
date_df["DateKey"] = date_df["Date"].dt.strftime("%Y%m%d").astype(int)
date_df.to_csv(OUT / "dim_date.csv", index=False)

# ---------------------------------------------------------------- fact_sales
fact_df = df.rename(columns={"InvoiceNo": "InvoiceNo", "Country": "Country"})[
    ["InvoiceNo", "InvoiceDate", "CustomerID", "Country", "StockCode", "Description",
     "Quantity", "UnitPrice", "Revenue", "Year", "MonthNum", "MonthKey"]
].copy()
fact_df["DateKey"] = fact_df["InvoiceDate"].dt.strftime("%Y%m%d").astype(int)
fact_df["Region"] = fact_df["Country"].map(region_of)
fact_df["InvoiceDate"] = fact_df["InvoiceDate"].dt.strftime("%Y-%m-%d")
fact_df = fact_df.sort_values("InvoiceDate")
fact_df.to_csv(OUT / "fact_sales.csv", index=False)

# ---------------------------------------------------------------- cohort_matrix
monthly = df.groupby(["CustomerID", "MonthKey"]).size().reset_index()
first = orders[["CustomerID", "FirstMonthKey"]].rename(columns={"FirstMonthKey": "cohort"})
monthly = monthly.merge(first, on="CustomerID")
monthly["elapsed"] = monthly["MonthKey"] - monthly["cohort"]

cohort_sizes = monthly.groupby("cohort")["CustomerID"].nunique()
cohort_rows = sorted(cohort_sizes.index)

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

def month_label(idx: int) -> str:
    return f"{MONTHS[(idx - 1) % 12]} {(idx - 1) // 12}"

cohort_records = []
for c in cohort_rows:
    base = int(cohort_sizes.get(c, 0))
    for m in range(12):
        observed = c + m <= LAST_COMPLETE_MONTH
        if not observed:
            continue
        act = int(monthly[(monthly["cohort"] == c) & (monthly["elapsed"] == m)]["CustomerID"].nunique())
        cohort_records.append({
            "CohortKey": int(c),
            "Cohort": month_label(c),
            "Elapsed": int(m),
            "ElapsedLabel": f"M{m}",
            "Customers": act,
            "RetentionPct": round(act / base * 100, 1) if base else 0.0,
        })
cohort_df = pd.DataFrame(cohort_records)
cohort_df.to_csv(OUT / "cohort_matrix.csv", index=False)

# ---------------------------------------------------------------- churn_trend
active_sets = {}
for m in sorted(df["MonthKey"].unique()):
    active_sets[m] = set(df[df["MonthKey"] == m]["CustomerID"].unique())

churn_records = []
months_sorted = sorted(active_sets.keys())
for i in range(len(months_sorted) - 1):
    m, nxt = months_sorted[i], months_sorted[i + 1]
    if nxt > LAST_COMPLETE_MONTH:
        continue
    churned = len(active_sets[m] - active_sets[nxt])
    active = len(active_sets[m])
    churn_records.append({
        "MonthKey": int(m),
        "Month": month_label(m),
        "ActiveCustomers": active,
        "ChurnedCustomers": churned,
        "ChurnRatePct": round(churned / active * 100, 1) if active else 0.0,
    })
churn_df = pd.DataFrame(churn_records)
churn_df.to_csv(OUT / "churn_trend.csv", index=False)

# ---------------------------------------------------------------- verify vs site
n_customers = int(len(orders))
total_revenue = float(round(df["Revenue"].sum(), 2))
repeat_rate = round(float((orders["OrderSessions"] >= 2).mean() * 100), 1)
avg_ltv = float(round(orders["Monetary"].mean(), 2))
seg = {s: int((orders["RFM_Segment"] == s).sum()) for s in
       ["Champions", "Loyal", "Potential Loyalists", "At Risk", "Lost"]}

summary = {
    "source_rows": total_rows,
    "clean_rows": int(len(df)),
    "customers": n_customers,
    "countries": int(df["Country"].nunique()),
    "revenue_gbp": total_revenue,
    "repeat_rate_pct": repeat_rate,
    "avg_ltv_gbp": avg_ltv,
    "segments": seg,
}
with open(OUT / "prep_summary.json", "w") as f:
    json.dump(summary, f, indent=2)

print(json.dumps(summary, indent=2))
print("files written to:", OUT)
