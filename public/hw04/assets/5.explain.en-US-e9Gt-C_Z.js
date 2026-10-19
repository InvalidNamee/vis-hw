var e=`### Your Original Case

Original section 6.2.4 used five characters from <em>Jurassic Park</em> (Alan / T-REX / Raptors / Malcolm / Dilophosaurus) to build a Storyline timeline. The event layer marks key conflicts with semi-transparent red circles.

### Embedding Chen Wei's Textbook Theory

-   <strong>Storyline origin</strong>: introduced by Ogawa & Ma at Stanford in 2008, originally for movie / academic collaborator networks.
-   <strong>Core idea</strong>: abstract each character / organization / process as a “life line,” where <strong>lines close = meeting / conflict, lines apart = separation</strong>.
-   <strong>Three Key Elements</strong>:
    1.  <strong>Time-scale Mapping</strong>: movie duration → SVG width, with the x-axis strictly proportional
    2.  <strong>Catmull-Rom Spline</strong>: \`curveCatmullRom.alpha(0.5)\` tension coefficient 0.5, “naturally flowing” but not “over-curved”
    3.  <strong>Event Layer</strong>: semi-transparent red circles + text, marking key turning points
-   <strong>Use cases</strong>: film analysis, multi-party case timelines, sports interactions, project task handovers.

### Why Catmull-Rom instead of monotoneX?

monotoneX guarantees “no over-curving” but makes lines “too straight,” <strong>losing the narrative “river feel”</strong>. Catmull-Rom’s 0.5 tension is an empirical value—flows well without oscillating.
`;export{e as default};