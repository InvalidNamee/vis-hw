var e=`### 关键代码

<strong>关键点 1：经典配色硬编码数组</strong>

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

<aside class="course-callout course-callout--key-point" role="note">直接用 hex 数组硬编码比用 d3 内置 scheme 更稳——因为 scheme 名字在不同 d3 版本会变。</aside>
`;export{e as default};