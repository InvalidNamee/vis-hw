var e=`### Key code

<strong>Key point 1: Hard-coding classic palettes as arrays</strong>

\`\`\`javascript
const CLASSIC_PALETTES = {
  'Wong 2011':       ['#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'],
  'Paul Tol bright': ['#4477AA', '#EE6677', '#228833', '#CCBB44', '#66CCEE', '#AA3377', '#BBBBBB'],
  'Okabe-Ito':       ['#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'],
  'Tableau 10':      ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC'],
  'Viridis (seq)':   d3.range(0, 1.01, 0.1).map(d3.interpolateViridis),
  'RdBu (div)':      d3.range(0, 1.01, 0.1).map(t => d3.interpolateRdBu(1 - t))
};
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">Hard-coding as hex arrays is more stable than using d3's built-in schemes—because scheme names change across d3 versions.</aside>
`;export{e as default};