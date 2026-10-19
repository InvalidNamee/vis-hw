var e=`### Your Original Case

Section 5.1.3 used a line + scatter plot to show trends. The original code used \`curveCatmullRom\` without explaining why.

### Embedded Theory

-   <strong>Interpolation vs. Fitting</strong>:
    -   <strong>Interpolation</strong>: the curve passes through every data point (e.g., Catmull-Rom, Natural)
    -   <strong>Fitting</strong>: the curve does not necessarily pass through data points, only reflects the trend (e.g., linear regression, LOESS)
-   <strong>d3.line().curve()</strong> offers 10+ curves; the most commonly used are:
-   <strong>step family</strong>: for discrete steps (digital signals, state transitions)
-   <strong>catmullRom / natural</strong>: tension splines that pass through all points — “looks smooth”
-   <strong>monotoneX</strong>: preserves the monotonicity of the original data sequence (no spurious oscillations)
-   <strong>Selection principles</strong>: ordered data → \`monotoneX\` / \`linear\`; jittery data → \`catmullRom\` / \`basis\` to smooth; discrete states → \`step\`
`;export{e as default};