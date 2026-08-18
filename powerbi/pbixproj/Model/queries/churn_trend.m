let
    Source = Csv.Document(File.Contents("C:\Users\thanigaivel\Documents\Default Project\churn-analytics-portfolio\powerbi\data\churn_trend.csv"),[Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{{"MonthKey", Int64.Type}, {"Month", Text.Type}, {"ActiveCustomers", Int64.Type}, {"ChurnedCustomers", Int64.Type}, {"ChurnRatePct", type number}})
in
    #"Changed Type"