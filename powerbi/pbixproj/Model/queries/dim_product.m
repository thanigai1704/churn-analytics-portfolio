let
    Source = Csv.Document(File.Contents("C:\Users\thanigaivel\Documents\Default Project\churn-analytics-portfolio\powerbi\data\dim_product.csv"),[Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{{"StockCode", Text.Type}, {"Description", Text.Type}, {"MedianUnitPrice", type number}, {"UnitsSold", Int64.Type}, {"Revenue", type number}, {"FirstSoldDate", type date}, {"LastSoldDate", type date}, {"OrderCount", Int64.Type}})
in
    #"Changed Type"