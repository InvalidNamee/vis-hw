var e=`本节使用了 colormap（Viridis）画热图。colormap 理论详见 [第 3 章 3.2 colormap 三类选择](../lesson-03/#ch-3-2)。

### Your Original Case

Section 5.1 used 1985 U.S. crime data (CSV) for the 50 states, with 8 crime-indicator columns.

### Embedded Theory

-   <strong>Long format (long)</strong>: one observation per row, columns = fields (e.g., \`{state, metric, value}\`). Pros: easy to filter, group, and bind to a d3 join.
-   <strong>Wide format (wide)</strong>: one entity per row, columns = metrics (e.g., \`{state, murder, robbery, ...}\`). Pros: human-readable and intuitive.
-   <strong>Conversion</strong>: \`flatMap\` + iterating over key names = a few lines of code.
-   <strong>d3.autoType</strong>: auto-infers column types (number, date, boolean), saving you from manual \`+d.field\`.
`;export{e as default};