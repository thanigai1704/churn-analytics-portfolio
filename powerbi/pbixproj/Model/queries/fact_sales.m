let
    Source = Csv.Document(File.Contents("C:\Users\thanigaivel\Documents\Default Project\churn-analytics-portfolio\powerbi\data\fact_sales.csv"),[Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{{"InvoiceNo", Text.Type}, {"InvoiceDate", type date}, {"CustomerID", Text.Type}, {"Country", Text.Type}, {"StockCode", Text.Type}, {"Description", Text.Type}, {"Quantity", Int64.Type}, {"UnitPrice", type number}, {"Revenue", type number}, {"Year", Int64.Type}, {"MonthNum", Int64.Type}, {"MonthKey", Int64.Type}, {"DateKey", Int64.Type}, {"Region", Text.Type}})
in
    #"Changed Type"