var e=`### Your Original Case

Original section 6.2.2 used a calendar heatmap to show Beijing’s daily maximum temperature in 2024. Red lines separate each month.

### Embedding Chen Wei's Textbook Theory

-   <strong>Calendar Heatmap</strong>: proposed by <strong>van Wijk 2008</strong>, x = week (week-of-year), y = day of week, color = value.
-   <strong>Use cases</strong>: long time series (years) + periodicity (weekday / month) + anomaly detection (holidays, weekday vs weekend).
-   <strong>Design Considerations</strong>:
    -   Each week starts on Sunday (or Monday)—this affects where the “weekend” sits visually
    -   Separate months with red lines—more readable than a 7×53 grid
    -   Use a sequential colormap (e.g., Viridis)—see [Chapter 3 §3.2 Colormap](../lesson-03/#ch-3-2)

### The cleverness of isMonthDivider

Check whether 7 days ago and today are in the same month—if so, draw a same-month separator; otherwise draw a month-divider. This is the core algorithm of calendar visualization.
`;export{e as default};