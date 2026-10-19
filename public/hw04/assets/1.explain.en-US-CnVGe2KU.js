var e=`### Your Original Case

<strong>3 visualization pipeline models</strong>: ① Reference the Card 1999 model for box flowcharts → ② Mackinlay's automation principles → ③ van Wijk's model (with interaction feedback).

The original image is your concept map. <strong>This lesson</strong> uses D3 to redraw this concept map — every node expands details when clicked.

### Embedded Theory: Three Classic Models of the Visualization Pipeline

<table class="theory-table"><thead><tr><th>Model</th><th>Author / Year</th><th>Core Idea</th></tr></thead><tbody><tr><td><strong>Card Data Flow Model</strong></td><td>Card, Mackinlay &amp; Shneiderman, 1999</td><td>Raw data → data table → visual structure → view (nested transformations D→T→V→C/L/S)</td></tr><tr><td><strong>Mackinlay's Automation Principles</strong></td><td>Mackinlay, 1986</td><td>For each data type, automatically pick the visual channel with the highest “quantitative accuracy” (e.g., quantitative → position, categorical → hue)</td></tr><tr><td><strong>van Wijk Feedback Model</strong></td><td>van Wijk, 2005</td><td>View Filter Param Other Views — emphasizing the <strong>interaction feedback loop</strong></td></tr></tbody></table>

<strong>Core teaching points</strong>: the three models describe different facets of the same thing — Card gives you the “pipeline,” Mackinlay gives you “automated decisions,” and van Wijk gives you the “feedback loop.” <strong>They layer on top of each other rather than conflict.</strong>

-   <strong>Card model</strong>: tells you “after transform comes mapping, after mapping comes view”
-   <strong>Mackinlay</strong>: tells you “how to automate the mapping step”
-   <strong>van Wijk</strong>: tells you “after view, you still need to feed user actions back”
`;export{e as default};