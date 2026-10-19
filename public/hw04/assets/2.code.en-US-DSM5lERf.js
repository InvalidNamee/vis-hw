var e=`### Key code

<strong>Key point 1: d3's three scale families at a glance</strong>

\`\`\`javascript
// 顺序型：[0, 1] → 颜色
d3.scaleSequential(d3.interpolateViridis);

// 发散型：[0, 1] → 颜色（带中点反转）
d3.interpolateRdBu;          // t=0 蓝，t=1 红，t=0.5 白
d3.interpolateBrBG;

// 定性型：离散类别 → 颜色
d3.scaleOrdinal(d3.schemeTableau10);
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">Choosing the wrong type = "lying". For example, using Viridis for signed deviations makes users assume "the midpoint is white" — but Viridis's midpoint is dark purple.</aside>

<strong>Key point 2: Decision table</strong>

\`\`\`javascript
function pickColormap(data) {
  if (data.hasMeaningfulMidpoint) return 'diverging';
  if (data.isOrdered)              return 'sequential';
  return 'categorical';
}
\`\`\`
`;export{e as default};