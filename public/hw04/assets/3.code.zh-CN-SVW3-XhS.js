var e=`### 关键代码

<strong>关键点 1：d3.line + curve 一行切换</strong>

\`\`\`javascript
const line = d3.line()
  .x(d => xScale(d.x))
  .y(d => yScale(d.y))
  .curve(d3.curveCatmullRom);     // <- 这一行换 curve 类型

svg.append('path').datum(data).attr('d', line);
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><code>datum(data)</code> 把数组当整体传给 path（不是每个元素绑一个）。d3.line 内部循环生成 M/L/C 命令。</aside>

<strong>关键点 2：拟合 vs 插值的取舍</strong>

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

<aside class="course-callout course-callout--key-point" role="note">经验法则：散点超过 30 个 → 用拟合；散点 &lt; 10 个 → 用插值（保持信息完整）。Crime 数据 50 个州 → 拟合更稳。</aside>
`;export{e as default};