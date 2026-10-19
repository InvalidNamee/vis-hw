var e=`### ★ Key Code

★ <strong>Key Point 1: switch curves with d3.line + curve in one line</strong>

\`\`\`javascript
const line = d3.line()
  .x(d => xScale(d.x))
  .y(d => yScale(d.y))
  .curve(d3.curveCatmullRom);     // <- 这一行换 curve 类型

svg.append('path').datum(data).attr('d', line);
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">★ <code>datum(data)</code> passes the array as a whole to the path (not one element at a time). Inside, d3.line loops to generate M/L/C commands.</aside>

★ <strong>Key Point 2: the trade-off between fitting and interpolation</strong>

\`\`\`javascript
// 拟合：d3.regressionLinear / d3.regressionLoess
import { regressionLinear } from 'd3-regression';
const lin = regressionLinear()
  .x(d => d.population)
  .y(d => d.murder)
  .domain([0, d3.max(data, d => d.population)]);
const points = lin(data);  // 起点-终点
svg.append('path').attr('d', d3.line()(points));
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">★ Rule of thumb: more than 30 points → use fitting; fewer than 10 points → use interpolation (preserve full information). Crime data has 50 states → fitting is more robust.</aside>
`;export{e as default};