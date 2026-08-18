"""
Generate a complete pbi-tools pbixproj for the Churn Analytics dashboard and
compile it to a Power BI Template (.pbit) using a locally built pbi-tools
(release/1.3.0, compatible with Power BI Desktop 2.156).

  - Model: star schema from powerbi/data/*.csv via Power Query M queries
  - Measures: parsed from powerbi/measures.dax, formatted per measure
  - Report: 5 pages (Overview, Retention, Churn, RFM & LTV, Regional)
            hand-authored as valid /Report/Layout JSON
  - Compile: pbi-tools compile -> powerbi/Churn Analytics.pbit

Usage:  python build_pbixproj.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA_DIR = HERE / "data"
OUT = HERE / "pbixproj"
PBIT_OUT = HERE / "Churn Analytics.pbit"

PBITOOLS = Path(
    r"C:\Users\THANIG~1\AppData\Local\Temp\opencode\pbi-src\src\PBI-Tools\bin\Release\net472\win10-x64\pbi-tools.exe"
)

MODEL_NAME = "Churn Analytics"
COMPAT = 1550

# --------------------------------------------------------------------------- #
# column typing
# --------------------------------------------------------------------------- #
TYPE_MAP = {
    # fact_sales
    "InvoiceNo": "string", "InvoiceDate": "dateTime", "CustomerID": "string",
    "Country": "string", "StockCode": "string", "Description": "string",
    "Quantity": "int64", "UnitPrice": "double", "Revenue": "double",
    "Year": "int64", "MonthNum": "int64", "MonthKey": "int64",
    "DateKey": "int64", "Region": "string",
    # dim_customer
    "FirstPurchaseDate": "dateTime", "LastPurchaseDate": "dateTime",
    "LTV_GBP": "double", "OrderSessions": "int64", "FirstMonthKey": "int64",
    "RecencyDays": "int64", "AvgOrderValue": "double", "RFM_Segment": "string",
    "CustomerStatus": "string", "FrequencyBucket": "string",
    # dim_product
    "MedianUnitPrice": "double", "UnitsSold": "int64", "FirstSoldDate": "dateTime",
    "LastSoldDate": "dateTime", "OrderCount": "int64",
    # dim_country
    "Customers": "int64", "Orders": "int64",
    # dim_date
    "Date": "dateTime", "MonthName": "string", "MonthYear": "string",
    "Quarter": "int64", "QuarterLabel": "string", "WeekNum": "int64",
    "DayOfWeek": "string", "IsWeekend": "boolean",
    # cohort_matrix
    "CohortKey": "int64", "Cohort": "string", "Elapsed": "int64",
    "ElapsedLabel": "string", "RetentionPct": "double",
    # churn_trend
    "ActiveCustomers": "int64", "ChurnedCustomers": "int64", "ChurnRatePct": "double",
}
M_TYPE = {
    "string": "Text.Type", "int64": "Int64.Type", "double": "type number",
    "dateTime": "type date", "boolean": "Logical.Type",
}
TOKEN_TYPE = {
    "string": "string", "int64": "int64", "double": "double",
    "dateTime": "dateTime", "boolean": "boolean",
}

CSV_TABLES = {
    "fact_sales": "fact_sales.csv",
    "dim_customer": "dim_customer.csv",
    "dim_product": "dim_product.csv",
    "dim_country": "dim_country.csv",
    "dim_date": "dim_date.csv",
    "cohort_matrix": "cohort_matrix.csv",
    "churn_trend": "churn_trend.csv",
}

FUNNEL_STAGES_TABLE = "Funnel Stages"


def csv_columns(name: str) -> list[tuple[str, str]]:
    """Return (column, tom_type) pairs for a CSV-backed table."""
    header = (DATA_DIR / CSV_TABLES[name]).read_text(encoding="utf-8").splitlines()[0]
    return [(c.strip(), TYPE_MAP.get(c.strip(), "string")) for c in header.split(",")]


# --------------------------------------------------------------------------- #
# measures
# --------------------------------------------------------------------------- #
MEASURE_TABLE = {
    "fact_sales": {
        "Total Revenue", "Total Orders", "Total Customers", "Avg Order Value",
        "Revenue per Customer", "Total Units Sold", "Customers by Country",
        "Avg Order Value (Country)", "Churn Rate (Dynamic) %",
    },
    "dim_customer": {
        "All-Time Customers", "Avg LTV", "Repeat Purchase Rate %",
        "One-Time Rate %", "Active Customers", "Churned Customers",
        "Churn Rate % (Snapshot)", "Customers by Segment", "% Customers by Segment",
        "Avg Orders by Segment", "Avg LTV by Segment", "Revenue by Segment",
        "% Revenue by Segment", "% Customers by Status", "Avg LTV (Repeat)",
        "Avg LTV (One-Time)", "LTV Multiple", "Top 20% LTV Share",
        "Funnel First Purchase %", "Funnel Repeat Purchase %", "Funnel 3+ Orders %",
        "Funnel 5+ Orders %", "Funnel 8+ Orders %",
        "% Low Risk Customers", "% Medium Risk Customers", "% High Risk Customers",
    },
    "dim_date": {
        "MoM Revenue %", "YoY Revenue %", "YTD Revenue", "New Customers",
        "Cumulative Customers",
    },
    "dim_country": {"% Revenue by Region"},
    "dim_product": {"% of Revenue (Product)"},
    "cohort_matrix": {
        "Cohort Retention (Customers)", "Cohort Retention %", "Avg M1 Retention %",
        "Avg M1 Drop-off %", "Avg Retention by Elapsed %",
    },
    "churn_trend": {"Churn Rate (Trend)", "Current Churn Rate %", "Avg Monthly Churn %"},
    FUNNEL_STAGES_TABLE: {"Funnel Value"},
}

CURRENCY = {
    "Total Revenue", "Avg Order Value", "Revenue per Customer", "Avg LTV",
    "Avg LTV by Segment", "Avg LTV (Repeat)", "Avg LTV (One-Time)",
    "Revenue by Segment", "Avg Order Value (Country)", "YTD Revenue",
}
PERCENT = {
    "Repeat Purchase Rate %", "One-Time Rate %", "Churn Rate % (Snapshot)",
    "MoM Revenue %", "YoY Revenue %", "Churn Rate (Trend)", "Current Churn Rate %",
    "Avg Monthly Churn %", "Churn Rate (Dynamic) %", "Avg M1 Retention %",
    "Avg M1 Drop-off %", "Avg Retention by Elapsed %", "Cohort Retention %",
    "% Customers by Segment", "% Revenue by Segment", "% Customers by Status",
    "% Revenue by Region", "% of Revenue (Product)", "Funnel First Purchase %",
    "Funnel Repeat Purchase %", "Funnel 3+ Orders %", "Funnel 5+ Orders %",
    "Funnel 8+ Orders %", "% Low Risk Customers",
    "% Medium Risk Customers", "% High Risk Customers", "Top 20% LTV Share",
    "Funnel Value",
}
COUNT = {
    "Total Orders", "Total Customers", "All-Time Customers", "Active Customers",
    "Churned Customers", "New Customers", "Cumulative Customers", "Total Units Sold",
    "Customers by Country", "Customers by Segment", "Avg Orders by Segment",
    "Cohort Retention (Customers)",
}
MULTIPLE = {"LTV Multiple"}


def measure_format(name: str) -> str | None:
    if name in CURRENCY:
        return "\u00a3#,##0.00"
    if name in PERCENT:
        return "0.00%"
    if name in COUNT:
        return "#,##0"
    if name in MULTIPLE:
        return '0.0"x"'
    return None


MEASURE_HEADER = re.compile(r"^([A-Za-z0-9%][^=\r\n]*?)\s*=\s*(.*)$")
# Lines that start a function/VAR/RETURN expression are never new measure headers.
FUNCTION_PREFIX = re.compile(r"^(VAR|RETURN)\b|[A-Za-z][A-Za-z0-9]*\(")

def is_measure_header(raw_line: str) -> tuple[str, str] | None:
    """Return (name, inline_expr) if raw_line begins a new measure definition."""
    if raw_line.startswith((" ", "\t")):
        return None  # indented -> continuation of previous expression
    if FUNCTION_PREFIX.match(raw_line):
        return None
    m = MEASURE_HEADER.match(raw_line)
    if not m:
        return None
    name = m.group(1).strip()
    if " " not in name and not re.search(r"[%()'#+.\-&]", name):
        return None  # bare identifier -> not a descriptive measure name
    return name, m.group(2).strip()

def parse_measures() -> dict[str, str]:
    """Parse measures.dax into {name: expression}. Funnel Stages table is returned separately."""
    text = (HERE / "measures.dax").read_text(encoding="utf-8")
    result: dict[str, str] = {}
    cur_name = None
    cur_parts: list[str] = []
    for raw in text.splitlines():
        stripped = raw.strip()
        if not stripped or stripped.startswith("//"):
            continue
        header = is_measure_header(raw.rstrip())
        if header is not None:
            if cur_name is not None and cur_name != "Funnel Stages":
                result[cur_name] = "\n".join(cur_parts)
            cur_name, inline = header
            cur_parts = [inline] if inline else []
        elif cur_name is not None:
            cur_parts.append(stripped)
    if cur_name is not None and cur_name != "Funnel Stages":
        result[cur_name] = "\n".join(cur_parts)
    return result


# --------------------------------------------------------------------------- #
# json / file helpers
# --------------------------------------------------------------------------- #
def jdump(obj) -> str:
    return json.dumps(obj, indent=2)


def write(rel: Path, content: str):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def clean_out():
    import shutil
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)


# --------------------------------------------------------------------------- #
# model
# --------------------------------------------------------------------------- #
def m_query(table: str) -> str:
    path = (DATA_DIR / CSV_TABLES[table]).resolve()
    cols = csv_columns(table)
    change = ", ".join(
        f'{{"{c}", {M_TYPE[t]}}}' for c, t in cols
    )
    return (
        'let\n'
        f'    Source = Csv.Document(File.Contents("{path}"),[Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),\n'
        '    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),\n'
        f'    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{{{change}}})\n'
        'in\n'
        '    #"Changed Type"'
    )


def table_json(table: str, calculated_expr: str | None = None) -> dict:
    if calculated_expr is not None:
        return {
            "name": table,
            "partitions": [
                {
                    "name": table,
                    "mode": "import",
                    "source": {"type": "calculated", "expression": calculated_expr},
                }
            ],
        }
    return {
        "name": table,
        "partitions": [
            {"name": table, "mode": "import", "source": {"type": "m"}}
        ],
    }


def column_json(col: str, typ: str, *, hidden: bool = False) -> dict:
    out = {"name": col, "dataType": typ, "sourceColumn": col}
    if hidden:
        out["isHidden"] = True
    return out


def measure_json(name: str) -> dict:
    fmt = measure_format(name)
    out = {"name": name}
    if fmt:
        out["formatString"] = fmt
    return out


def build_database() -> dict:
    return {
        "name": MODEL_NAME,
        "compatibilityLevel": COMPAT,
        "model": {
            "culture": "en-US",
            "defaultPowerBIDataSourceVersion": "powerBI_V3",
            "discourageImplicitMeasures": False,
            "relationships": [
                {"name": "Sales-Customer", "fromTable": "fact_sales",
                 "fromColumn": "CustomerID", "toTable": "dim_customer",
                 "toColumn": "CustomerID"},
                {"name": "Sales-Product", "fromTable": "fact_sales",
                 "fromColumn": "StockCode", "toTable": "dim_product",
                 "toColumn": "StockCode"},
                {"name": "Sales-Country", "fromTable": "fact_sales",
                 "fromColumn": "Country", "toTable": "dim_country",
                 "toColumn": "Country"},
                {"name": "Sales-Date", "fromTable": "fact_sales",
                 "fromColumn": "DateKey", "toTable": "dim_date", "toColumn": "DateKey"},
                {"name": "Customer-Country", "fromTable": "dim_customer",
                 "fromColumn": "Country", "toTable": "dim_country",
                 "toColumn": "Country", "isActive": False},
            ],
        },
    }


def build_model(measures: dict[str, str]):
    write(Path("Model") / "database.json", jdump(build_database()))
    for table in CSV_TABLES:
        write(Path("Model") / "queries" / f"{table}.m", m_query(table))
        write(Path("Model") / "tables" / table / "table.json", jdump(table_json(table)))
        for col, typ in csv_columns(table):
            write(Path("Model") / "tables" / table / "columns" / f"{col}.json",
                  jdump(column_json(col, typ)))
        for name, expr in measures.items():
            if MEASURE_TABLE.get(table) and name in MEASURE_TABLE[table]:
                write(Path("Model") / "tables" / table / "measures" / f"{name}.dax", expr)
                write(Path("Model") / "tables" / table / "measures" / f"{name}.json",
                      jdump(measure_json(name)))

    # Funnel Stages calculated table + Funnel Value measure
    funnel_expr = (
        'DATATABLE(\n'
        '    "Stage", STRING,\n'
        '    "Sort", INTEGER,\n'
        '    {\n'
        '        { "First Purchase", 1 },\n'
        '        { "Repeat Purchase", 2 },\n'
        '        { "3+ Orders", 3 },\n'
        '        { "5+ Orders", 4 },\n'
        '        { "8+ Orders (Advocates)", 5 }\n'
        '    }\n'
        ')'
    )
    write(Path("Model") / "tables" / FUNNEL_STAGES_TABLE / "table.json",
          jdump(table_json(FUNNEL_STAGES_TABLE, funnel_expr)))
    write(Path("Model") / "tables" / FUNNEL_STAGES_TABLE / "columns" / "Stage.json",
          jdump(column_json("Stage", "string")))
    write(Path("Model") / "tables" / FUNNEL_STAGES_TABLE / "columns" / "Sort.json",
          jdump(column_json("Sort", "int64")))
    for name in MEASURE_TABLE[FUNNEL_STAGES_TABLE]:
        write(Path("Model") / "tables" / FUNNEL_STAGES_TABLE / "measures" / f"{name}.dax",
              measures[name])
        write(Path("Model") / "tables" / FUNNEL_STAGES_TABLE / "measures" / f"{name}.json",
              jdump(measure_json(name)))

    # orphan-check: every parsed measure must be assigned to a table
    assigned = {n for names in MEASURE_TABLE.values() for n in names}
    missing = set(measures) - assigned
    if missing:
        raise SystemExit(f"Measures not assigned to a table: {sorted(missing)}")


# --------------------------------------------------------------------------- #
# report
# --------------------------------------------------------------------------- #
ALIAS = {
    "fact_sales": "f", "dim_customer": "c", "dim_product": "p",
    "dim_country": "co", "dim_date": "d", "cohort_matrix": "cm",
    "churn_trend": "ct", FUNNEL_STAGES_TABLE: "fs",
}


def from_entities(tables: list[str]) -> list[dict]:
    return [{"Name": ALIAS[t], "Entity": t, "Type": 0} for t in tables]


def col_expr(alias: str, col: str) -> dict:
    return {"Column": {"Expression": {"SourceRef": {"Source": alias}}, "Property": col}}


def agg_expr(alias: str, col: str) -> dict:
    return {"Aggregation": {"Expression": col_expr(alias, col), "Function": 0}}


def meas_expr(alias: str, meas: str) -> dict:
    return {"Measure": {"Expression": {"SourceRef": {"Source": alias}}, "Property": meas}}


def sel_col(table: str, col: str) -> dict:
    return {**col_expr(ALIAS[table], col), "Name": f"{table}.{col}"}


def sel_meas(table: str, meas: str) -> dict:
    return {**meas_expr(ALIAS[table], meas), "Name": f"{table}.{meas}"}


def order_col(table: str, col: str, direction: int = 1) -> dict:
    return {"Direction": direction, "Expression": col_expr(ALIAS[table], col)}


def order_meas(table: str, meas: str, direction: int = 2) -> dict:
    return {"Direction": direction, "Expression": meas_expr(ALIAS[table], meas)}


def make_query(select: list[dict], orderby: list[dict] | None, *, line: bool = False,
               pivot: bool = False, row_idx: list[int] | None = None,
               col_idx: list[int] | None = None, card: bool = False) -> dict:
    q: dict = {"Version": 2, "Select": select}
    # From entities derive from SourceRefs in select expressions
    sources = []
    for s in select:
        ref = s.get("Measure") or s.get("Aggregation") or s.get("Column")
        src = ref.get("Expression", {}).get("SourceRef", {}).get("Source")
        if src and src not in sources:
            sources.append(src)
    q["From"] = [{"Name": a, "Entity": e, "Type": 0}
                 for e, a in ALIAS.items() if a in sources]
    if orderby:
        q["OrderBy"] = orderby

    command: dict = {"SemanticQueryDataShapeCommand": {"Query": q}}
    binding: dict = {}
    if pivot:
        binding["Primary"] = {
            "Groupings": [
                {"Projections": row_idx or [], "Subtotal": 1},
                {"Projections": col_idx or [], "Subtotal": 1},
            ]
        }
        binding["DataReduction"] = {"DataVolume": 3, "Primary": {"Window": {"Count": 500}}}
    elif card:
        binding["Primary"] = {"Groupings": []}
        binding["DataReduction"] = {"DataVolume": 4, "Primary": {"Count": 1}}
    else:
        binding["Primary"] = {"Groupings": [{"Projections": list(range(len(select)))}]}
        binding["DataReduction"] = {
            "DataVolume": 4,
            "Primary": {"BinnedLineSample": {}} if line else {"TopN": {"Count": 500}},
        }
    binding["Version"] = 1
    command["SemanticQueryDataShapeCommand"]["Binding"] = binding
    command["SemanticQueryDataShapeCommand"]["ExecutionMetricsKind"] = 1
    return {"Commands": [command]}


class Visual:
    _counter = 0

    def __init__(self, vtype: str, title: str, x: int, y: int, w: int, h: int,
                 projections: dict, select: list[dict], orderby: list[dict] | None = None,
                 *, line: bool = False, pivot: bool = False, row_idx=None,
                 col_idx=None, card: bool = False):
        Visual._counter += 1
        self.id = Visual._counter
        self.hexid = f"{self.id:012x}"
        self.vtype = vtype
        self.title = title
        self.x, self.y, self.w, self.h = x, y, w, h
        self.z = (self.id - 1) * 1000
        self.projections = projections
        self.select = select
        self.orderby = orderby
        self.query = make_query(select, orderby, line=line, pivot=pivot,
                                row_idx=row_idx, col_idx=col_idx, card=card)

    def config(self) -> dict:
        single = {
            "visualType": self.vtype,
            "projections": self.projections,
            "prototypeQuery": {
                "Version": 2,
                "From": self.query["Commands"][0]["SemanticQueryDataShapeCommand"]["Query"]["From"],
                "Select": self.select,
            },
            "drillFilterOtherVisuals": True,
            "hasDefaultSort": True,
            "vcObjects": {
                "title": [{
                    "properties": {
                        "text": {"expr": {"Literal": {"Value": f"'{self.title}'"}}},
                        "fontSize": {"expr": {"Literal": {"Value": "13"}}},
                    }
                }]
            },
        }
        if self.orderby:
            single["prototypeQuery"]["OrderBy"] = self.orderby
        return {
            "name": self.hexid,
            "layouts": [{"id": 0, "position": {
                "x": self.x, "y": self.y, "z": self.z,
                "width": self.w, "height": self.h}}],
            "singleVisual": single,
        }

    def container(self) -> dict:
        return {"x": self.x, "y": self.y, "z": self.z,
                "width": self.w, "height": self.h, "tabOrder": self.id - 1}


def kpi(title: str, table: str, meas: str, x: int, y: int, w: int = 290, h: int = 100) -> Visual:
    return Visual("card", title, x, y, w, h,
                  {"Values": [{"queryRef": f"{table}.{meas}"}]},
                  [sel_meas(table, meas)], card=True)


def build_report():
    # report root
    write(Path("Report") / "report.json", jdump({
        "id": 0,
        "layoutOptimization": 0,
        "resourcePackages": [],
    }))
    write(Path("Report") / "config.json", jdump({
        "version": "5.21",
        "activeSectionIndex": 0,
        "defaultDrillFilterOtherVisuals": True,
        "linguisticSchemaSyncVersion": 2,
        "settings": {
            "hideVisualContainerHeader": False,
            "useStylableVisualContainerHeader": True,
            "exportDataMode": 1,
            "useNewFilterPaneExperience": True,
            "useEnhancedTooltips": True,
        },
    }))
    write(Path("Report") / "filters.json", "[]")

    pages = []

    # ----- Page 1: Overview -----
    v = []
    v.append(kpi("Total Revenue", "fact_sales", "Total Revenue", 40, 50))
    v.append(kpi("Total Customers", "fact_sales", "Total Customers", 345, 50))
    v.append(kpi("Churn Rate", "dim_customer", "Churn Rate % (Snapshot)", 650, 50))
    v.append(kpi("Avg LTV", "dim_customer", "Avg LTV", 955, 50))
    v.append(Visual("lineChart", "Revenue by Month", 40, 175, 610, 460,
                    {"Category": [{"queryRef": "dim_date.MonthYear", "active": True}],
                     "Y": [{"queryRef": "fact_sales.Total Revenue"}]},
                    [sel_meas("fact_sales", "Total Revenue"),
                     sel_col("dim_date", "MonthYear"), sel_col("dim_date", "MonthKey")],
                    [order_col("dim_date", "MonthKey")], line=True))
    v.append(Visual("clusteredColumnChart", "Top Countries by Revenue", 670, 175, 570, 460,
                    {"Category": [{"queryRef": "dim_country.Country", "active": True}],
                     "Y": [{"queryRef": "fact_sales.Total Revenue"}]},
                    [sel_meas("fact_sales", "Total Revenue"),
                     sel_col("dim_country", "Country")],
                    [order_meas("fact_sales", "Total Revenue")]))
    pages.append(("Overview", v))

    # ----- Page 2: Retention -----
    v = []
    v.append(kpi("Avg M1 Retention", "cohort_matrix", "Avg M1 Retention %", 40, 50))
    v.append(kpi("Avg M1 Drop-off", "cohort_matrix", "Avg M1 Drop-off %", 345, 50))
    v.append(Visual("pivotTable", "Cohort Retention Heatmap", 40, 175, 800, 460,
                    {"Rows": [{"queryRef": "cohort_matrix.Cohort", "active": True}],
                     "Columns": [{"queryRef": "cohort_matrix.ElapsedLabel", "active": True}],
                     "Values": [{"queryRef": "cohort_matrix.Cohort Retention %"}]},
                    [sel_meas("cohort_matrix", "Cohort Retention %"),
                     sel_col("cohort_matrix", "Cohort"),
                     sel_col("cohort_matrix", "ElapsedLabel")],
                    pivot=True, row_idx=[1], col_idx=[2]))
    v.append(Visual("lineChart", "Retention Curve", 860, 175, 380, 460,
                    {"Category": [{"queryRef": "cohort_matrix.ElapsedLabel", "active": True}],
                     "Y": [{"queryRef": "cohort_matrix.Avg Retention by Elapsed %"}]},
                    [sel_meas("cohort_matrix", "Avg Retention by Elapsed %"),
                     sel_col("cohort_matrix", "ElapsedLabel"),
                     sel_col("cohort_matrix", "Elapsed")],
                    [order_col("cohort_matrix", "Elapsed")], line=True))
    pages.append(("Retention", v))

    # ----- Page 3: Churn -----
    v = []
    v.append(kpi("Current Churn Rate", "churn_trend", "Current Churn Rate %", 40, 50))
    v.append(kpi("Avg Monthly Churn", "churn_trend", "Avg Monthly Churn %", 345, 50))
    v.append(kpi("Churned Customers", "dim_customer", "Churned Customers", 650, 50))
    v.append(Visual("lineChart", "Monthly Churn Rate", 40, 175, 780, 460,
                    {"Category": [{"queryRef": "churn_trend.Month", "active": True}],
                     "Y": [{"queryRef": "churn_trend.Churn Rate (Trend)"}]},
                    [sel_meas("churn_trend", "Churn Rate (Trend)"),
                     sel_col("churn_trend", "Month"), sel_col("churn_trend", "MonthKey")],
                    [order_col("churn_trend", "MonthKey")], line=True))
    v.append(Visual("clusteredColumnChart", "Active vs Churned Customers", 40, 175, 780, 460,
                    {"Category": [{"queryRef": "churn_trend.Month", "active": True}],
                     "Y": [{"queryRef": "churn_trend.ActiveCustomers"},
                           {"queryRef": "churn_trend.ChurnedCustomers"}]},
                    [sel_col("churn_trend", "Month"), sel_col("churn_trend", "MonthKey"),
                     sel_meas("churn_trend", "ActiveCustomers"),
                     sel_meas("churn_trend", "ChurnedCustomers")],
                    [order_col("churn_trend", "MonthKey")]))
    v.append(Visual("donutChart", "Customer Status", 840, 175, 400, 460,
                    {"Category": [{"queryRef": "dim_customer.CustomerStatus", "active": True}],
                     "Values": [{"queryRef": "dim_customer.% Customers by Status"}]},
                    [sel_meas("dim_customer", "% Customers by Status"),
                     sel_col("dim_customer", "CustomerStatus")]))
    pages.append(("Churn", v))

    # ----- Page 4: RFM & LTV -----
    v = []
    v.append(kpi("Avg LTV (Repeat)", "dim_customer", "Avg LTV (Repeat)", 40, 50))
    v.append(kpi("Avg LTV (One-Time)", "dim_customer", "Avg LTV (One-Time)", 345, 50))
    v.append(kpi("LTV Multiple", "dim_customer", "LTV Multiple", 650, 50))
    v.append(kpi("Top 20% LTV Share", "dim_customer", "Top 20% LTV Share", 955, 50))
    v.append(Visual("donutChart", "Customers by RFM Segment", 40, 175, 380, 460,
                    {"Category": [{"queryRef": "dim_customer.RFM_Segment", "active": True}],
                     "Values": [{"queryRef": "dim_customer.Customers by Segment"}]},
                    [sel_meas("dim_customer", "Customers by Segment"),
                     sel_col("dim_customer", "RFM_Segment")]))
    v.append(Visual("clusteredColumnChart", "Avg LTV by Segment", 440, 175, 380, 460,
                    {"Category": [{"queryRef": "dim_customer.RFM_Segment", "active": True}],
                     "Y": [{"queryRef": "dim_customer.Avg LTV by Segment"}]},
                    [sel_meas("dim_customer", "Avg LTV by Segment"),
                     sel_col("dim_customer", "RFM_Segment")]))
    v.append(Visual("funnel", "Customer Journey Funnel", 840, 175, 400, 460,
                    {"Category": [{"queryRef": "Funnel Stages.Stage", "active": True}],
                     "Values": [{"queryRef": "Funnel Stages.Funnel Value"}]},
                    [sel_meas(FUNNEL_STAGES_TABLE, "Funnel Value"),
                     sel_col(FUNNEL_STAGES_TABLE, "Stage"),
                     sel_col(FUNNEL_STAGES_TABLE, "Sort")],
                    [order_col(FUNNEL_STAGES_TABLE, "Sort")]))
    pages.append(("RFM & LTV", v))

    # ----- Page 5: Regional -----
    v = []
    v.append(kpi("Total Revenue", "fact_sales", "Total Revenue", 40, 50))
    v.append(Visual("treemap", "Revenue by Region", 40, 175, 700, 460,
                    {"Category": [{"queryRef": "dim_country.Region", "active": True}],
                     "Values": [{"queryRef": "fact_sales.Total Revenue"}]},
                    [sel_meas("fact_sales", "Total Revenue"),
                     sel_col("dim_country", "Region")]))
    v.append(Visual("table", "Country Performance", 760, 175, 480, 460,
                    {"Columns": [
                        {"queryRef": "dim_country.Country", "active": True},
                        {"queryRef": "fact_sales.Customers by Country"},
                        {"queryRef": "fact_sales.Total Revenue"},
                        {"queryRef": "fact_sales.Avg Order Value (Country)"},
                    ]},
                    [sel_col("dim_country", "Country"),
                     sel_meas("fact_sales", "Customers by Country"),
                     sel_meas("fact_sales", "Total Revenue"),
                     sel_meas("fact_sales", "Avg Order Value (Country)")]))
    pages.append(("Regional", v))

    # ----- write sections -----
    for ordinal, (page_name, visuals) in enumerate(pages):
        sec_name = f"ReportSection{ordinal:03d}"
        folder = Path("Report") / "sections" / f"{ordinal:03d}_{page_name}"
        write(folder / "section.json", jdump({
            "displayName": page_name,
            "displayOption": 1,
            "height": 720,
            "name": sec_name,
            "ordinal": ordinal,
            "width": 1280,
        }))
        write(folder / "config.json", "{}")
        write(folder / "filters.json", "[]")
        for vis in visuals:
            vf = folder / "visualContainers" / f"{vis.id:05d}_{vis.title}"
            write(vf / "visualContainer.json", jdump(vis.container()))
            write(vf / "config.json", jdump(vis.config()))
            write(vf / "filters.json", "[]")
            write(vf / "query.json", jdump(vis.query))


# --------------------------------------------------------------------------- #
# root files
# --------------------------------------------------------------------------- #
def build_root():
    write(Path(".pbixproj.json"), jdump({
        "version": "0.12",
        "settings": {"model": {"compatibilityLevel": COMPAT}},
    }))
    write(Path("Version.txt"), "1.25")
    write(Path("ReportMetadata.json"), jdump({
        "Version": 5,
        "AutoCreatedRelationships": [],
        "CreatedFrom": "Cloud",
        "CreatedFromRelease": "2022.06",
    }))
    write(Path("ReportSettings.json"), jdump({
        "Version": 1,
        "ReportSettings": {},
        "QueriesSettings": {
            "TypeDetectionEnabled": True,
            "RelationshipImportEnabled": True,
            "Version": "2.70.5494.701",
        },
    }))


# --------------------------------------------------------------------------- #
# main
# --------------------------------------------------------------------------- #
def main():
    clean_out()
    measures = parse_measures()
    build_model(measures)
    build_report()
    build_root()
    print(f"pbixproj written to {OUT}")

    if not PBITOOLS.exists():
        print("SKIP compile: pbi-tools not found")
        return
    import subprocess, sys
    r = subprocess.run([str(PBITOOLS), "compile", str(OUT), str(PBIT_OUT),
                        "-format", "PBIT", "-overwrite"], capture_output=True, text=True)
    print(r.stdout[-3000:] if r.stdout else "")
    print(r.stderr[-3000:] if r.stderr else "")
    sys.exit(r.returncode)


if __name__ == "__main__":
    main()

