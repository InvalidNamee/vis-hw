var e=`### Your Original Case

Section 5.1.2 used a scatter plot to display Crime data (murder vs. robbery), with the 1985 data on the coordinate axes.

### Embedded Theory

-   <strong>Three-layer space</strong>:
    1.  <strong>Data Space</strong>: raw values (e.g., population 27058000, murder rate 8)
    2.  <strong>Coordinate Space</strong>: normalized to 0..innerWidth (standardized coordinates)
    3.  <strong>Screen Space</strong>: add the margin offset (final pixel positions)
-   <strong>Why layer them</strong>: elements inside the coordinate system space (lines, points) can be shared — no recalculation when the screen size changes. d3.axisBottom handles the coordinate-system → screen step automatically.
-   <strong>Scale selection</strong>:
    -   \`scaleLinear\`: uniform distribution, most common
    -   \`scaleLog\`: spans orders of magnitude (population from 530k to 27M)
    -   \`scaleSqrt\`: area-aware (maps circle area to value)
    -   \`scaleBand\`: categorical axis (bar charts)
`;export{e as default};