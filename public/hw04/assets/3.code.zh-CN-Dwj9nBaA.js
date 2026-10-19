var e=`### 关键代码 ① 比例尺选型

\`\`\`javascript
 // 关键点 ①：scale 选型 —— 属性  通道的映射
// 比率型数据 → scaleLinear（连续定量）
const x = d3.scaleLinear().domain([0, 100]).range([0, 800]);

// 名义/序数型数据 → scaleBand（离散分类）
const x = d3.scaleBand().domain(["软件1班", "软件2班"]).range([0, 800]);
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释</strong>：D3 比例尺的 <code>domain()</code> 是数据域（输入），<code>range()</code> 是值域（输出像素）。 选错比例尺是初学者最常犯的错：<strong>类别数据用 scaleLinear 会算出没有意义的中间值</strong>（如 0.5 班）。 <strong>记忆口诀</strong>：连续定量用 Linear，离散分类用 Band，序数可用 Point。</aside>

### 关键代码 ② colormap 选型

\`\`\`javascript
 // 关键点 ②：颜色映射 —— 顺序型 vs 定性型 vs 发散型
// 顺序型（顺序有意义）→ interpolateViridis / interpolateBlues
const color = d3.scaleSequential(d3.interpolateViridis);

// 定性型（无顺序）→ schemeTableau10
const color = d3.scaleOrdinal().range(d3.schemeTableau10);

// 发散型（有中点）→ interpolateRdBu
const color = d3.scaleDiverging(d3.interpolateRdBu);
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释</strong>：Viridis 是顺序 colormap 的标杆，色觉缺陷（CVD）友好且感知均匀。 <strong>常见错误</strong>：用彩虹色 <code>interpolateRainbow</code> 编码数值数据 —— 既不 CVD 友好，又有假边界（蓝色→绿色跳跃）。 <strong>课堂提问</strong>：什么时候用发散型？答：有"中间值"的数据（如正负、温度 vs 平均值）。</aside>
`;export{e as default};