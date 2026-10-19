var e=`### Where This Sits: Visual Mapping

Following the <strong>2.2 data transformation</strong>, we now have a “data table.” Section <strong>2.3</strong> is the second arrow, <strong>“data table → visual structure”</strong> — i.e. <strong>Visual Mapping</strong>. It answers one core question: <em>for each data attribute, which visual channel should express it?</em>

### Your Original Case

Your Section 4.2 mentioned “tree-structure visualization.” This lesson expands on the <strong>tree layout algorithm</strong> — once you have hierarchical data, how do you place nodes on screen without overlap?

### Theory Core: What Is a Visual Channel? Mackinlay's Ranking

A <strong>visual channel</strong> is the carrier that “encodes data onto a visual element”: position, length, area, angle, color, shape, texture… <strong>Mackinlay (1986)</strong> gave the classic ranking: for <em>different data types</em>, the <strong>quantitative accuracy</strong> of each channel differs. That is the figure below.

![Mackinlay 1986 visual channel ranking](./img/01-mackinlay-ranking.png)

Figure 1 · Mackinlay (1986) channel ranking: for Quantitative / Ordinal / Nominal data, the quantitative-accuracy ordering of each channel. Position is always the most accurate.

-   <strong>Position</strong>: ranks #1 for all three types — the eye is most sensitive to position
-   <strong>Quantitative data</strong>: length → angle → slope → area (bar charts beat area charts)
-   <strong>Nominal data</strong>: position → hue → texture → connection → shape

### Theory Core: Marks and the Composition of Visual Channels

The visual structure is built on <strong>marks</strong>: Point, Line, Area. These marks are then “marked up” through <strong>channels</strong>: position, color, shape, tilt, size. The next two figures break this apart.

![Marks: Points / Lines / Areas](./img/02-marks-points-lines-areas.png)

Figure 2 · Three families of marks: Points, Lines, Areas. Marks determine “what a datum looks like” — the skeleton of the visual structure.

![Visual channels: Position / Color / Shape / Tilt / Size](./img/03-channels-position-color-shape.png)

Figure 3 · Common visual-channel families: Position (horizontal / vertical / both), Color, Shape, Tilt, Size (length / area / volume).

### Theory Core: Two Channel Classes — Magnitude vs Identity

By “whether it can express magnitude,” channels split into two classes: <strong>Magnitude channels</strong> express <em>ordered / quantitative</em> attributes; <strong>Identity channels</strong> express <em>categorical</em> attributes. Picking the wrong class misleads readers.

![Magnitude Channels: Ordered Attributes](./img/04-magnitude-channels.png)

Figure 4 · Magnitude Channels: express “ordered attributes.” Ordered by accuracy — position on a common scale is best; length / tilt / area next; color luminance, saturation, and volume are weakest (all marked “Same” — ambiguous ordering).

![Identity Channels: Categorical Attributes](./img/05-identity-channels.png)

Figure 5 · Identity Channels: express “categorical attributes” — spatial region, hue, motion, shape. They distinguish different categories but cannot rank “more vs less.”

<strong>Where this lesson lands</strong>: tree layout (Reingold-Tilford) is essentially a <strong>visual mapping</strong> — it uses the <em>position channel</em> to encode hierarchy as “parent above, children below.” The algorithm follows.

### Embedded Theory: The Reingold-Tilford Algorithm (the core of d3.tree)

The algorithm proposed by Reingold & Tilford in 1981 is still the implementation core of \`d3.tree()\`. Core idea:

1.  <strong>First pass (bottom-up):</strong> for each parent node, compute how much horizontal space its left and right subtrees “occupy”
2.  <strong>Second pass (top-down):</strong> assign every node an <strong>absolute x-coordinate</strong> (so siblings hug the parent's centerline without overlapping)
3.  <strong>Third pass:</strong> handle “threads” — fix the alignment when children cross the parent's centerline

<strong>Complexity handling</strong>:

-   <strong>O(n)</strong> time — faster than a naive “recursive halving”
-   A node's <strong>minimum left/right subtree width</strong> = the horizontal space needed at minimum to hold all its children
-   Layout-strategy options: \`d3.tree\` (left-right), \`d3.cluster\` (left-right, packed), \`d3.treemap\` (area)

### Theory Patch: The d3-hierarchy Module Family

-   \`hierarchy(data)\`: convert any nested data into a hierarchy structure (each node gets \`parent\` / \`children\` / \`depth\`)
-   \`tree().size([h, w])\`: Reingold-Tilford algorithm, left-right layout
-   \`cluster().size([h, w])\`: align all leaf nodes to the same depth
-   \`treemap().tile(...)\`: area-based (slice-and-dice / squarified / resquarify algorithms)
-   \`pack().radius(d => ...)\`: circle packing
-   \`partition().size([h, w])\`: icicle / sunburst layout
`;export{e as default};