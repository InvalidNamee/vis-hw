var e=`### Three colormap families match three data semantics

-   <strong>Sequential</strong>: data with a natural order (population, temperature). Monotonic lightness + monotonic hue. Examples: \`Viridis / Plasma / Cividis\`
-   <strong>Diverging</strong>: data with a meaningful "midpoint" (e.g., zero, signed deviation, white median). Different hues at the two ends, white/light in the middle. Examples: \`RdBu / BrBG / PiYG\`
-   <strong>Qualitative</strong>: unordered data (e.g., product categories). Distinct hues, similar lightness. Examples: \`Tableau10 / Set1 / Set3\`

### Common mistakes

Using the diverging palette RdBu for "murder rates in 50 states" (ordinal data)—the middle band looks near-white, so states with a murder rate "around 100" appear to be the "midpoint"—but 100 has no semantic meaning, so this is purely misleading.

### CVD-friendly checklist

-   Viridis / Cividis: excellent (recommended by Nature Methods)
-   RdBu / BrBG: △ moderate (red-green pairs are not CVD-friendly)
-   Tableau10 (qualitative): △ hue-related issues
-   Jet (rainbow): do not use
`;export{e as default};