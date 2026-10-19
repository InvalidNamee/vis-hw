var e=`### Where This Sits: Data Transformation

<strong>The Card 1999 data-flow model</strong> splits visualization into four stages: <em>raw data → (transform) → data table → (map) → visual structure → (render) → view</em>. Section <strong>2.2</strong> is the first arrow, <strong>“raw data → data table”</strong> — i.e. <strong>Data Transformation</strong>.

### Your Original Case

Use the freshman data to do <strong>rollup bucketed aggregation</strong> by “major / class”. The core of your demo is d3.rollup's chained calls — one function that performs multi-dimensional grouping.

### Theory Patch: Four Operations of Data Transformation (Card ’s D layer)

Going from “raw data” to a “data table,” the D layer performs four kinds of operations:

<table class="theory-table"><thead><tr><th>Operation</th><th>What it does</th><th>D3 implementation</th></tr></thead><tbody><tr><td><strong>Clean / filter</strong></td><td>Remove missing/outliers; keep rows matching a condition</td><td><code>.filter()</code>, <code>d3.csv(row)</code> callback</td></tr><tr><td><strong>Aggregate</strong></td><td>Group by key, reduce each group to a single value</td><td><code>d3.rollup()</code>, <code>d3.group()</code></td></tr><tr><td><strong>Join</strong></td><td>Combine two tables by key (e.g., student table joined to class table)</td><td><code>d3.map</code> + manual indexing</td></tr><tr><td><strong>Derive</strong></td><td>Compute a new column from existing ones (e.g., extract “major” from “class”)</td><td>compute a new field in the row callback</td></tr></tbody></table>

<strong>The rollup aggregation demonstrated here belongs to the “aggregate” row</strong>. But reading this table, you realize data transformation is the “first kilometer” of the whole pipeline — if the data table isn't clean, all the mapping and rendering downstream is wasted.

### Embedded Theory: Functional Aggregation and OLAP Slicing

<strong>d3.rollup is a functional composition of “bucket by key, then reduce once”</strong>:

\`\`\`javascript
const result = d3.rollup(
  data,                    // 输入数组
  v => v.length,          // reducer
  d => d.major,           // key1（外层）
  d => d.class           // key2（内层，可选）
);
\`\`\`

It returns a \`Map\` (not an array, not an object), so:

-   Iterate using \`for ([k, v] of m)\` or \`m.entries()\`
-   Nested rollup produces a nested Map
-   Difference from \`d3.group\`: rollup reduces the in-group data to <strong>a single value</strong>, while group preserves <strong>the original array</strong>

### Theory Patch: OLAP Slice / Dice / Drill

In 1993 Codd proposed 12 OLAP rules; three of their core operations can be simulated with rollup:

-   <strong>Slice:</strong> fix one dimension (e.g., only look at the 2025 cohort) → equivalent to \`.filter()\` then rollup
-   <strong>Dice:</strong> group by two dimensions → equivalent to a double-key rollup
-   <strong>Drill:</strong> drill down level by level → equivalent to nested rollup + recursive expansion

<strong>Classroom Takeaway</strong>: a visualization system's “drill-down interaction” is typically backed by a combination of rollup + hierarchy. This lesson demonstrates d3.rollup's multi-level capability.
`;export{e as default};