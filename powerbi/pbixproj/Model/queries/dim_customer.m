let
    Source = Csv.Document(File.Contents("C:\Users\thanigaivel\Documents\Default Project\churn-analytics-portfolio\powerbi\data\dim_customer.csv"),[Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{{"CustomerID", Text.Type}, {"FirstPurchaseDate", type date}, {"LastPurchaseDate", type date}, {"LTV_GBP", type number}, {"OrderSessions", Int64.Type}, {"Country", Text.Type}, {"FirstMonthKey", Int64.Type}, {"RecencyDays", Int64.Type}, {"AvgOrderValue", type number}, {"RFM_Segment", Text.Type}, {"CustomerStatus", Text.Type}, {"FrequencyBucket", Text.Type}, {"Region", Text.Type}})
in
    #"Changed Type"