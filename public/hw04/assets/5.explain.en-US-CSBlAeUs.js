var e=`### Your Original Case (6 Selector Methods)

Your original text outlines 6 selector methods:

<table class="theory-table"><thead><tr><th>Method</th><th>Returns</th></tr></thead><tbody><tr><td><code>d3.select</code></td><td>single element</td></tr><tr><td><code>d3.selectAll</code></td><td>selection of multiple elements</td></tr><tr><td><code>selection.select</code></td><td>the first descendant of each selected element</td></tr><tr><td><code>selection.selectAll</code></td><td>all descendants</td></tr><tr><td><code>selection.selectChild</code></td><td>the first direct child element</td></tr><tr><td><code>selection.selectChildren</code></td><td>all direct child elements</td></tr></tbody></table>

### Embedded Theory: The Data-Join Three-State Model (Mike Bostock)

The core of D3 is <strong>Data-Join</strong>: 'binding' a data array to DOM elements.

When the data changes:

-   New data > old data: the extras enter <strong>enter</strong> (need to append)
-   New data = old data: the existing elements enter <strong>update</strong> (need attribute changes)
-   New data < old data: the surplus elements enter <strong>exit</strong> (need to remove)

![three states](./data/join.png)

### Data-Join vs Imperative DOM

<table class="theory-table"><thead><tr><th>Imperative</th><th>Declarative (Data-Join)</th></tr></thead><tbody><tr><td><code>createElement</code> then append one by one</td><td><code>.data(arr).join(...)</code> in one line</td></tr><tr><td>full re-render</td><td>incremental update (better performance)</td></tr><tr><td>element identity lost</td><td>key function preserves stable identity (natural animation)</td></tr><tr><td>disconnected from the data flow</td><td>naturally fits the functional data flow</td></tr></tbody></table>
`;export{e as default};