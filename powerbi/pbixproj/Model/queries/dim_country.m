let
    Source = Csv.Document(File.Contents("C:\Users\thanigaivel\Documents\Default Project\churn-analytics-portfolio\powerbi\data\dim_country.csv"),[Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{{"Country", Text.Type}, {"Customers", Int64.Type}, {"Revenue", type number}, {"Orders", Int64.Type}, {"Region", Text.Type}})
in
    #"Changed Type"