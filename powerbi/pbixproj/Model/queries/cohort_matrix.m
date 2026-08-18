let
    Source = Csv.Document(File.Contents("C:\Users\thanigaivel\Documents\Default Project\churn-analytics-portfolio\powerbi\data\cohort_matrix.csv"),[Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{{"CohortKey", Int64.Type}, {"Cohort", Text.Type}, {"Elapsed", Int64.Type}, {"ElapsedLabel", Text.Type}, {"Customers", Int64.Type}, {"RetentionPct", type number}})
in
    #"Changed Type"