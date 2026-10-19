var e=`### The 3 gold standards

-   <strong>Wong 2011</strong>: recommended in Nature Methods 8:441, 8-color, CVD-friendly and grayscale-print-friendly
-   <strong>Paul Tol</strong>: SRON Tech Note, bright (on white background) / muted (on dark background) / high-contrast
-   <strong>Okabe-Ito 2002</strong>: 8 colors, CVD-friendly, the default in early Nature/Science

### Commercial / general purpose

-   <strong>Tableau 10</strong>: the king of commercial charts, 10 colors, red-green pairs are not CVD-friendly
-   <strong>Paired (12)</strong>: paired designs (pre/post), 12 colors are too many

### Sequential / Diverging

-   <strong>Viridis</strong>: default in matplotlib / d3, perceptually uniform + CVD-friendly
-   <strong>Cividis</strong>: a CVD-reinforced version of Viridis (more distinct blue/yellow)
-   <strong>RdBu</strong>: diverging red-blue

### Practical principles

-   If the number of categories ≤ 7; for more categories, switch to a continuous colormap
-   Must pass CVD simulation testing
-   Prefer CVD-friendly + grayscale-friendly palettes (this is what top journals use)
`;export{e as default};