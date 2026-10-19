var e=`### ★ Key Code

★ <strong>Key Point 1: data space vs. screen space — two layers of scales</strong>

\`\`\`javascript
// 数据空间：值 → 坐标系
const xData = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.x)])
  .range([0, innerW]);

// 屏幕空间：坐标系 → 屏幕（加 margin）
const xScreen = d3.scaleLinear()
  .domain([0, innerW])
  .range([M.l, M.l + innerW]);

// 渲染：数据 → 坐标系 → 屏幕
.attr('cx', d => xScreen(xData(d.x)))
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">★ Misalignment example: writing <code>domain=max</code> and <code>range=[M.l, M.l+innerW]</code> in one scale → changing the margin means editing two places. The three-layer separation keeps things clean.</aside>

★ <strong>Key Point 2: log scale spans orders of magnitude</strong>

\`\`\`javascript
// 50 州人口从 53 万到 2700 万（差 50 倍）
// linear 缩放下，小州挤成一团，CA/NY/TX 占满屏幕
const xLog = d3.scaleLog()
  .domain([1, d3.max(data, d => d.x)])
  .range([0, innerW]);
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">★ A log axis is especially well-suited for “exponential growth” data. Human vision is “multiplicative” rather than “additive”, so log turns a “geometric sequence” into “equally-spaced” points on screen.</aside>
`;export{e as default};