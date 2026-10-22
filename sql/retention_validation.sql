-- =====================================================================
-- Customer Retention & Churn Analytics - SQL validation layer
-- Dialect: SQLite. Runs against the cleaned star schema produced by
-- powerbi/prepare_data.py (fact_sales, dim_customer).
-- Purpose: independently verify the headline metrics of the Python
-- pipeline (analysis/analyze.py). Harness: analysis/run_sql.py, which
-- executes these exact queries and writes src/data/sqlResults.json.
-- =====================================================================

-- Q1. Dataset scale ----------------------------------------------------
-- rows_analysed 397,884 | customers 4,338 | invoices 18,532 | occasions 18,440
-- "Occasion" = distinct InvoiceDate timestamp per customer (the metric the
-- dashboard uses); multiple invoices placed by the same customer at the
-- exact same moment (e.g. a credit note cancelling an invoice) collapse
-- into one occasion.
SELECT
    COUNT(*)                                                 AS rows_analysed,
    COUNT(DISTINCT CustomerID)                               AS customers,
    COUNT(DISTINCT InvoiceNo)                                AS invoices,
    COUNT(DISTINCT CustomerID || '_' || InvoiceDate)         AS purchase_occasions
FROM fact_sales;

-- Q2. Revenue reconciled two ways -> 8,911,407.90 ----------------------
SELECT
    ROUND(SUM(Quantity * UnitPrice), 2) AS revenue_qty_x_price,
    ROUND(SUM(Revenue), 2)              AS revenue_column
FROM fact_sales;

-- Q3. Repeat purchase rate, both counting methods ----------------------
-- 65.6% invoice-based | 65.5% occasion-based | 4,338 customers
WITH cust AS (
    SELECT
        CustomerID,
        COUNT(DISTINCT InvoiceNo)          AS invoice_count,
        COUNT(DISTINCT InvoiceDate)        AS occasion_count
    FROM fact_sales
    GROUP BY CustomerID
)
SELECT
    ROUND(100.0 * SUM(invoice_count  >= 2) / COUNT(*), 1) AS repeat_rate_invoices_pct,
    ROUND(100.0 * SUM(occasion_count >= 2) / COUNT(*), 1) AS repeat_rate_occasions_pct,
    COUNT(*) AS customers
FROM cust;

-- Q4. Value concentration: top-20% customers by spend ------------------
-- CAST truncates 4,338 * 0.2 = 867.6 -> 867 customers, matching analyze.py
WITH cust AS (
    SELECT CustomerID, SUM(Revenue) AS cltv
    FROM fact_sales
    GROUP BY CustomerID
), ranked AS (
    SELECT cltv,
           ROW_NUMBER() OVER (ORDER BY cltv DESC) AS rn,
           COUNT(*)     OVER ()                   AS n
    FROM cust
)
SELECT
    (SELECT COUNT(*)  FROM ranked WHERE rn <= CAST(n * 0.2 AS INTEGER)) AS top20_customers,
    ROUND(100.0 * (SELECT SUM(cltv) FROM ranked WHERE rn <= CAST(n * 0.2 AS INTEGER))
                / (SELECT SUM(cltv) FROM ranked), 1)                    AS top20_share_pct;

-- Q5. RFM segment distribution from the customer dimension ------------
-- Lost 1,535 | Champions 980 | Loyal 946 | Potential 578 | At Risk 299
SELECT RFM_Segment,
       COUNT(*)                                        AS customers,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct
FROM dim_customer
GROUP BY RFM_Segment
ORDER BY customers DESC;

-- Q6. Inactivity bands (recency cutoffs on the customer dimension) ----
-- active_60d | inactive_90d = 1,441 | inactive_180d = 858
SELECT
    SUM(RecencyDays <= 60) AS active_60d,
    SUM(RecencyDays > 90)  AS inactive_90d,
    SUM(RecencyDays > 180) AS inactive_180d
FROM dim_customer;

-- Q7. Monthly non-return (churn) series -------------------------------
-- Customers active in month M who do not appear in month M+1.
-- Base months run Dec 2010 (24132) .. Oct 2011 (24142); Nov 2011 is
-- excluded because its follow-up month (Dec 2011) is a partial snapshot.
WITH monthly AS (SELECT DISTINCT CustomerID, MonthKey FROM fact_sales)
SELECT
    a.MonthKey,
    COUNT(*)                                                                    AS active_in_m,
    ROUND(100.0 * SUM(CASE WHEN n.CustomerID IS NULL THEN 1 ELSE 0 END)
                / COUNT(*), 1)                                                  AS non_return_pct
FROM (SELECT DISTINCT MonthKey FROM monthly WHERE MonthKey < 24143) months
JOIN monthly a  ON a.MonthKey = months.MonthKey
LEFT JOIN monthly n ON n.CustomerID = a.CustomerID AND n.MonthKey = a.MonthKey + 1
GROUP BY a.MonthKey
ORDER BY a.MonthKey;
