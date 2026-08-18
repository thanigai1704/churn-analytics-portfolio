let
    Source = Csv.Document(File.Contents("C:\Users\thanigaivel\Documents\Default Project\churn-analytics-portfolio\powerbi\data\dim_date.csv"),[Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{{"Date", type date}, {"Year", Int64.Type}, {"MonthNum", Int64.Type}, {"MonthName", Text.Type}, {"MonthYear", Text.Type}, {"Quarter", Int64.Type}, {"QuarterLabel", Text.Type}, {"WeekNum", Int64.Type}, {"DayOfWeek", Text.Type}, {"IsWeekend", Logical.Type}, {"MonthKey", Int64.Type}, {"DateKey", Int64.Type}})
in
    #"Changed Type"