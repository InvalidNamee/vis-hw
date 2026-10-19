var e=`### 关键代码

<strong>关键点 1：数据空间 vs 屏幕空间，两层 scale</strong>

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

<aside class="course-callout course-callout--key-point" role="note">错位示范：直接把 domain/max 和 range/[M.l, M.l+innerW] 写在一个 scale 里 → 改 margin 要改两处。三层分立就清爽。</aside>

<strong>关键点 2：log scale 跨数量级</strong>

\`\`\`javascript
// 50 州人口从 53 万到 2700 万（差 50 倍）
// linear 缩放下，小州挤成一团，CA/NY/TX 占满屏幕
const xLog = d3.scaleLog()
  .domain([1, d3.max(data, d => d.x)])
  .range([0, innerW]);
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">log 轴对"指数增长"数据特别合适。人的视觉是"乘法"而不是"加法"，所以 log 让"等比数列"在屏幕上"等距"。</aside>
`;export{e as default};