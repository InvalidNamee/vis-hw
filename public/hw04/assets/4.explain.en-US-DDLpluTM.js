var e=`### Your Original Case (8 Functions)

Your original text lists 8 common functions provided by D3:

1.  \`map(iterable, mapper)\` — similar to Array.map
2.  \`reduce(iterable, reducer, init)\` — similar to Array.reduce
3.  \`cross(...iterables, reducer)\` — Cartesian product
4.  \`merge(iterables)\` — merge into a flat array
5.  \`pairs(iterable, reducer)\` — adjacent element pairs
6.  \`transpose(matrix)\` — matrix transpose
7.  \`zip(...arrays)\` — combine by position
8.  \`filter(iterable, test)\` — similar to Array.filter

### Embedded Theory: Functional Data Flow

Common characteristics of these 8 functions:

-   <strong>Immutable</strong>: input unchanged, returns a new array
-   <strong>Pure function</strong>: same input → same output, no side effects
-   <strong>Chainable</strong>: returns an array, can be followed by the next transformation

<strong>Why Functional?</strong>

-   Can be reasoned about: each transformation layer is independent and testable
-   Parallelizable: map/reduce/filter are naturally parallelizable
-   Cacheable: outputs of pure functions can be memoized

<aside class="course-callout course-callout--note" role="note"><strong>The Prototype of the Data Cube (OLAP)</strong>: <code>transpose</code> performs wide/long format conversion, and <code>group + rollup</code> performs slicing/dicing/drilling — this is exactly the core of BI systems.</aside>
`;export{e as default};