var e=`### Your Original Case

Original section 6.2.3 used an Archimedean spiral (uniform-velocity spiral) to lay out dates, with each loop representing 1 year / 1 month / 1 week. Each date corresponds to a sector ring on the spiral.

### Embedding Chen Wei's Textbook Theory

-   <strong>Spiral vs line</strong>: a line captures “trend” in a linear time domain but struggles with “cycle”; a spiral repeats around the circle, highlighting periodicity.
-   <strong>Archimedean Spiral</strong>: \`r = a + bθ\`, with <strong>uniform unwinding</strong> (radius increases by a constant b per revolution).
-   <strong>Dynamic Δθ algorithm</strong>: the original document’s elegant move—\`Δθ = boxSize / √(b² + r²)\`, which <strong>keeps each sector ring’s arc length roughly equal</strong>, preserving visual consistency.
-   <strong>Practical trade-offs</strong>: spirals suit “year / season / week” cycles, but are <strong>unsuitable when there is “no cycle” or “the cycle is too long”</strong>.

### Key Path Generation

Each date maps to a sector ring on the spiral—4 key points: outer start / outer end / inner end / inner start, closing back to the start.
`;export{e as default};