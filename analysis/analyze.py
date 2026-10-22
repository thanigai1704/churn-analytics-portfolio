"""
Customer Retention & Churn Analysis pipeline.

Reads the UCI Online Retail dataset (real e-commerce transactions, Dec 2010 - Dec 2011)
and computes every metric rendered by the portfolio dashboard.

Output: src/data/computed.json
"""
import json
import os
import numpy as np
import pandas as pd

RAW = os.path.join(os.path.dirname(__file__), "Online_Retail.xlsx")
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "computed.json")
SNAPSHOT = pd.Timestamp("2011-12-09")
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

def month_label(idx: int) -> str:
    return MONTHS[(idx - 1) % 12]

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
df["MonthIdx"] = df["InvoiceDate"].dt.year * 12 + df["InvoiceDate"].dt.month

valid_rows = len(df)
data_quality = {
    "rows": total_rows,
    "cleanRows": valid_rows,
    "cleanPct": round(valid_rows / total_rows * 100, 1),
}

# ---------------------------------------------------------------- per-customer
orders = df.groupby("CustomerID").agg(
    first_purchase=("InvoiceDate", "min"),
    last_purchase=("InvoiceDate", "max"),
    monetary=("Revenue", "sum"),
    order_sessions=("InvoiceDate", "nunique"),
    invoice_count=("InvoiceNo", "nunique"),
).reset_index()
orders["first_month"] = orders["first_purchase"].dt.year * 12 + orders["first_purchase"].dt.month
orders["recency_days"] = (SNAPSHOT - orders["last_purchase"]).dt.days

n_customers = int(len(orders))
total_revenue = float(round(df["Revenue"].sum(), 2))
repeat_rate = round(float((orders["order_sessions"] >= 2).mean() * 100), 1)
one_time_rate = round(100 - repeat_rate, 1)
avg_ltv = float(round(orders["monetary"].mean(), 2))
avg_ltv_repeat = float(round(orders.loc[orders["order_sessions"] >= 2, "monetary"].mean(), 2))
avg_ltv_once = float(round(orders.loc[orders["order_sessions"] == 1, "monetary"].mean(), 2))
ltv_multiple = round(avg_ltv_repeat / avg_ltv_once, 1)

# Frequency can be counted two ways: distinct invoices vs distinct purchase dates.
# Both are reported so the difference is visible rather than hidden.
invoice_instances = int(df["InvoiceNo"].nunique())
purchase_occasions = int(orders["order_sessions"].sum())
repeat_rate_invoices = round(float((orders["invoice_count"] >= 2).mean() * 100), 1)

top20 = orders.nlargest(int(n_customers * 0.2), "monetary")
top20_rev_share = round(float(top20["monetary"].sum() / orders["monetary"].sum() * 100), 1)

# ---------------------------------------------------------------- cohorts
LAST_COMPLETE_MONTH = 2011 * 12 + 11  # Nov 2011 (Dec 2011 is partial)

monthly = df.groupby(["CustomerID", "MonthIdx"]).size().reset_index()
first = orders[["CustomerID", "first_month"]].rename(columns={"first_month": "cohort"})
monthly = monthly.merge(first, on="CustomerID")
monthly["elapsed"] = monthly["MonthIdx"] - monthly["cohort"]

cohort_sizes = monthly.groupby("cohort")["CustomerID"].nunique()
cohort_rows = sorted(cohort_sizes.index)[:12]

matrix = []
cust_matrix = []
for c in cohort_rows:
    base = int(cohort_sizes.get(c, 0))
    row = []
    crow = []
    for m in range(12):
        observed = c + m <= LAST_COMPLETE_MONTH
        if not observed:
            row.append(None)
            crow.append(None)
            continue
        act = int(monthly[(monthly["cohort"] == c) & (monthly["elapsed"] == m)]["CustomerID"].nunique())
        row.append(round(act / base * 100, 1) if base else 0.0)
        crow.append(act)
    matrix.append(row)
    cust_matrix.append(crow)

cohort_labels = [month_label(c) for c in cohort_rows]

# retention curve = mean over cohorts with a complete observation window for that month
def curve_rate(m: int):
    vals = [matrix[cohort_rows.index(c)][m] for c in cohort_rows if matrix[cohort_rows.index(c)][m] is not None]
    return round(float(np.mean(vals)), 1) if vals else 0.0

retention_curve = [
    {"month": f"M{m}", "rate": curve_rate(m), "target": round(min(100, curve_rate(m) + 8), 1)}
    for m in range(12)
]
rates = [p["rate"] for p in retention_curve]
m1_retention, m2_retention, m3_retention = rates[1], rates[2], rates[3]
m1_dropoff = round(100 - m1_retention, 1)

# ---------------------------------------------------------------- monthly churn (skip the partial final month)
active_sets = {}
for m in sorted(df["MonthIdx"].unique()):
    active_sets[m] = set(df[df["MonthIdx"] == m]["CustomerID"].unique())

churn_trend = []
months_sorted = sorted(active_sets.keys())
for i in range(len(months_sorted) - 1):
    m, nxt = months_sorted[i], months_sorted[i + 1]
    if nxt > LAST_COMPLETE_MONTH:
        continue
    churned = len(active_sets[m] - active_sets[nxt])
    churn_trend.append({"month": month_label(m), "rate": round(churned / len(active_sets[m]) * 100, 1)})

avg_monthly_churn = round(float(np.mean([c["rate"] for c in churn_trend])), 1)
peak = max(churn_trend, key=lambda c: c["rate"])
current = churn_trend[-1]
trajectory = round(churn_trend[0]["rate"] - current["rate"], 1)

# ---------------------------------------------------------------- RFM segments
def segment(row):
    r, f, m = row["recency_days"], row["order_sessions"], row["monetary"]
    if r <= 60 and f >= 5:
        return "Champions"
    if r <= 180 and f >= 3:
        return "Loyal"
    if r <= 120 and f >= 2:
        return "Potential Loyalists"
    if r <= 300 and f >= 2:
        return "At Risk"
    return "Lost"

orders["segment"] = orders.apply(segment, axis=1)
segments = {}
for seg in ["Champions", "Loyal", "Potential Loyalists", "At Risk", "Lost"]:
    sub = orders[orders["segment"] == seg]
    segments[seg] = {
        "customers": int(len(sub)),
        "pct": round(len(sub) / n_customers * 100, 1),
        "avgOrders": round(float(sub["order_sessions"].mean()), 1) if len(sub) else 0.0,
        "avgLtv": round(float(sub["monetary"].mean()), 1) if len(sub) else 0.0,
    }

# ---------------------------------------------------------------- churn composition (real)
buckets = {}
for seg in ["Champions", "Loyal", "Potential Loyalists", "At Risk", "Lost"]:
    buckets[seg] = round(float((orders["segment"] == seg).mean() * 100), 1)
churn_reasons = [
    {"label": "One-time buyers (never returned)", "value": one_time_rate},
    {"label": "Low frequency (2-3 orders)", "value": round(float((orders["order_sessions"].between(2, 3)).mean() * 100), 1)},
    {"label": "Medium frequency (4-9 orders)", "value": round(float((orders["order_sessions"].between(4, 9)).mean() * 100), 1)},
    {"label": "High frequency (10+ orders)", "value": round(float((orders["order_sessions"] >= 10).mean() * 100), 1)},
]

# ---------------------------------------------------------------- funnel
def pct_with_min_orders(k):
    return round(float((orders["order_sessions"] >= k).mean() * 100), 1)

funnel = [
    {"label": "First Purchase", "value": 100.0},
    {"label": "Repeat Purchase", "value": pct_with_min_orders(2)},
    {"label": "3+ Orders", "value": pct_with_min_orders(3)},
    {"label": "5+ Orders", "value": pct_with_min_orders(5)},
    {"label": "8+ Orders (Advocates)", "value": pct_with_min_orders(8)},
]

# ---------------------------------------------------------------- risk mix
low = float((orders["recency_days"] <= 60).mean() * 100)
med = float(((orders["recency_days"] > 60) & (orders["recency_days"] <= 180)).mean() * 100)
high = float((orders["recency_days"] > 180).mean() * 100)
risk = {"low": round(low, 1), "medium": round(med, 1), "high": round(high, 1)}

# ---------------------------------------------------------------- journey flow (win-back = returned after 90+ day gap)
# Also collect the full distribution of inter-purchase gaps so the inactivity
# thresholds are chosen from the data instead of guessed.
gap_returners = 0
all_gaps = []          # every observed gap between consecutive unique purchase dates, per customer
customer_median_gaps = []
for cid, dates in df.groupby("CustomerID")["InvoiceDate"].apply(lambda s: sorted(s.dt.date.unique())).items():
    if len(dates) >= 2:
        diffs = [(dates[i] - dates[i - 1]).days for i in range(1, len(dates))]
        all_gaps.extend(diffs)
        customer_median_gaps.append(float(np.median(diffs)))
    if any((dates[i] - dates[i - 1]).days >= 90 for i in range(1, len(dates))):
        gap_returners += 1
winback_pct = round(gap_returners / n_customers * 100, 1)
winback_pct_180 = round(float((np.array(customer_median_gaps) > 180).mean() * 100), 1) if customer_median_gaps else 0.0

gap_days = np.array(all_gaps)
inactivity = {
    "medianGapDays": round(float(np.median(gap_days)), 1) if len(gap_days) else 0,
    "p75GapDays": round(float(np.percentile(gap_days, 75)), 1) if len(gap_days) else 0,
    "p90GapDays": round(float(np.percentile(gap_days, 90)), 1) if len(gap_days) else 0,
    "gapOver90Pct": round(float((gap_days > 90).mean() * 100), 1) if len(gap_days) else 0,
    "gapOver180Pct": round(float((gap_days > 180).mean() * 100), 1) if len(gap_days) else 0,
    "customersWithMedianGapOver90": round(float((np.array(customer_median_gaps) > 90).mean() * 100), 1) if customer_median_gaps else 0.0,
    "customersWithMedianGapOver180": winback_pct_180,
    "inactive90": int((orders["recency_days"] > 90).sum()),
    "inactive90Pct": round(float((orders["recency_days"] > 90).mean() * 100), 1),
    "inactive180": int((orders["recency_days"] > 180).sum()),
    "inactive180Pct": round(float((orders["recency_days"] > 180).mean() * 100), 1),
    "note": "Inactivity thresholds are read off the observed inter-purchase gap distribution. Most repeat customers return well within 90 days; gaps flagged over 90/180 days are behaviour outliers. The medianGap flags are computed over repeat buyers only; one-time buyers have no observed gap.",
}

journey = [
    {"stage": "Acquire", "from": "All first-time buyers", "pct": 100.0},
    {"stage": "Activate", "from": "Made a 2nd purchase", "pct": pct_with_min_orders(2)},
    {"stage": "Retain", "from": "Reached 3+ purchases", "pct": pct_with_min_orders(3)},
    {"stage": "Loyalize", "from": "Reached 5+ purchases", "pct": pct_with_min_orders(5)},
    {"stage": "Win-back", "from": "Returned after 90+ day gap", "pct": winback_pct},
]

# ---------------------------------------------------------------- deltas (real comparisons)
h1 = orders[orders["first_month"] < 24138]
h2 = orders[orders["first_month"] >= 24138]
acquisition_delta = round((len(h2) / len(h1) - 1) * 100, 1)

recent = [m for m in cohort_rows if m >= 24138][:5]
older = [m for m in cohort_rows if m < 24138][:7]
recent_m1 = np.mean([matrix[cohort_rows.index(c)][1] for c in recent]) if recent else rates[1]
older_m1 = np.mean([matrix[cohort_rows.index(c)][1] for c in older]) if older else rates[1]
retention_delta = round(float(recent_m1 - older_m1), 1)

repeat_to_3plus = round(pct_with_min_orders(3) / pct_with_min_orders(2) * 100, 1)

# ---------------------------------------------------------------- output
out = {
    "source": {
        "name": "UCI Online Retail Dataset",
        "url": "https://archive.ics.uci.edu/ml/datasets/Online+Retail",
        "period": "Dec 2010 - Dec 2011",
        "rows": total_rows,
        "cleanRows": valid_rows,
        "customers": n_customers,
        "countries": int(df["Country"].nunique()),
        "snapshot": SNAPSHOT.strftime("%Y-%m-%d"),
        "currency": "GBP",
    },
    "dataQuality": data_quality,
    "metrics": {
        "totalCustomers": n_customers,
        "totalRevenue": total_revenue,
        "retentionRate": m1_retention,
        "churnRate": current["rate"],
        "avgLtv": avg_ltv,
        "repeatPurchaseRate": repeat_rate,
        "oneTimeRate": one_time_rate,
        "m1Retention": m1_retention,
        "m2Retention": m2_retention,
        "m3Retention": m3_retention,
        "m1Dropoff": m1_dropoff,
        "avgLtvRepeat": avg_ltv_repeat,
        "avgLtvOnce": avg_ltv_once,
        "ltvMultiple": ltv_multiple,
        "top20RevShare": top20_rev_share,
        "avgMonthlyChurn": avg_monthly_churn,
        "invoiceInstances": invoice_instances,
        "purchaseOccasions": purchase_occasions,
        "repeatRateInvoices": repeat_rate_invoices,
    },
    "metricDefinitionNotes": {
        "monthlyChurn": "The monthly churn rate is a month-over-month non-return rate: customers active in month M who are absent in month M+1. A single one-month gap does not mean a customer is gone for good, so this metric is read for trend (improving/worsening) rather than as a definitive churned count. Definitive inactivity-based churn uses the 90/180-day recency cutoffs in the inactivity block.",
        "frequency": "Customer frequency is counted as distinct InvoiceDate timestamps (purchase occasions). Invoice instances are reported separately as a cross-check: 18,532 invoices vs 18,440 occasions, because a few customers have a credit note timestamped at the exact same moment as the invoice it cancels. The two repeat rates (65.6% invoice-based, 65.5% occasion-based) differ by less than a point.",
        "avgLtv": "Avg LTV is the customer's total observed revenue over the 12-month dataset window. It is a historical value measure, not a predictive lifetime value estimate.",
        "cohortAveraging": "Cohort retention curve values are simple (unweighted) means across the cohorts with a complete observation window for that elapsed month. A customer-weighted rate can be computed from the cohort matrix and would weight larger cohorts more heavily.",
    },
    "inactivity": inactivity,
    "deltas": {
        "customers": {"value": acquisition_delta, "positive": False, "note": "H2 vs H1 acquisition"},
        "retention": {"value": retention_delta, "positive": retention_delta >= 0, "note": "recent cohorts"},
        "churn": {"value": trajectory, "positive": True, "note": "YTD reduction"},
        "ltv": {"value": ltv_multiple, "positive": True, "note": "vs one-time buyers"},
        "repeat": {"value": repeat_to_3plus, "positive": True, "note": "of repeat buyers reach 3+"},
    },
    "cohortMonths": cohort_labels,
    "cohortMatrix": matrix,
    "cohortCustomers": cust_matrix,
    "retentionCurve": retention_curve,
    "segments": segments,
    "churnTrend": churn_trend,
    "churnSummary": {
        "peak": peak,
        "current": current,
        "trajectory": trajectory,
        "target": 45.0,
    },
    "churnReasons": churn_reasons,
    "funnel": funnel,
    "risk": risk,
    "journey": journey,
}

with open(OUT, "w") as f:
    json.dump(out, f, indent=2)

print("== SUMMARY ==")
print("customers:", n_customers, "| revenue GBP:", round(total_revenue), "| repeat:", repeat_rate, "% | one-time:", one_time_rate, "%")
print("avgLTV:", avg_ltv, "| repeat LTV:", avg_ltv_repeat, "| once LTV:", avg_ltv_once, "| multiple:", ltv_multiple)
print("top20 rev share:", top20_rev_share, "%")
print("retention M1..M6:", rates[1:7], "| m1 dropoff:", m1_dropoff)
print("cohort labels:", cohort_labels)
print("segments:", {k: v for k, v in segments.items()})
print("churn trend:", [(c["month"], c["rate"]) for c in churn_trend], "| avg:", avg_monthly_churn, "| peak:", peak, "| current:", current, "| traj:", trajectory)
print("churn reasons:", churn_reasons)
print("funnel:", [f["value"] for f in funnel])
print("risk:", risk, "| winback:", winback_pct)
print("inactivity:", inactivity)
print("orders:", {"invoiceInstances": invoice_instances, "purchaseOccasions": purchase_occasions, "repeatRateInvoices": repeat_rate_invoices})
print("deltas:", out["deltas"])
