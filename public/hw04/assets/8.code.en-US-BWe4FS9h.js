var e=`### Key code

<strong>Key point 1: Apply CVD simulation to every fill in an SVG</strong>

\`\`\`javascript
function cvdTransformSvg(svgString, type) {
  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
  doc.querySelectorAll('[fill]').forEach(el => {
    const c = d3.color(el.getAttribute('fill'));
    if (!c) return;
    const rgb = [Math.round(c.rgb().r), Math.round(c.rgb().g), Math.round(c.rgb().b)];
    const sim = simulateCVD(rgb, type);
    el.setAttribute('fill', \`rgb(\${sim.join(',')})\`);
  });
  return new XMLSerializer().serializeToString(doc);
}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">Use <code>DOMParser</code> to parse SVG strings, then walk all <code>fill</code> attributes and apply the CVD matrix. Safer than hand-concatenating SVG strings.</aside>
`;export{e as default};