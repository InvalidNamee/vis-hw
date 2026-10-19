var e=`### Key Code ① Scale Selection

\`\`\`javascript
 // 关键点 ①：scale 选型 —— 属性  通道的映射
// 比率型数据 → scaleLinear（连续定量）
const x = d3.scaleLinear().domain([0, 100]).range([0, 800]);

// 名义/序数型数据 → scaleBand（离散分类）
const x = d3.scaleBand().domain(["软件1班", "软件2班"]).range([0, 800]);
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>Key-Point Explanation</strong>: A D3 scale's <code>domain()</code> is the data domain (input) and <code>range()</code> is the value range (output pixels). Choosing the wrong scale is the most common beginner mistake: <strong>using scaleLinear for categorical data produces meaningless intermediate values</strong> (e.g., class 0.5). <strong>Memory Aid</strong>: Use Linear for continuous quantitative, Band for discrete categorical, and Point for ordinal.</aside>

### Key Code ② Colormap Selection

\`\`\`javascript
 // 关键点 ②：颜色映射 —— 顺序型 vs 定性型 vs 发散型
// 顺序型（顺序有意义）→ interpolateViridis / interpolateBlues
const color = d3.scaleSequential(d3.interpolateViridis);

// 定性型（无顺序）→ schemeTableau10
const color = d3.scaleOrdinal().range(d3.schemeTableau10);

// 发散型（有中点）→ interpolateRdBu
const color = d3.scaleDiverging(d3.interpolateRdBu);
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>Key-Point Explanation</strong>: Viridis is the benchmark sequential colormap — color-vision-deficiency (CVD) friendly and perceptually uniform. <strong>Common Mistake</strong>: Using the rainbow colormap <code>interpolateRainbow</code> to encode numerical data — it is neither CVD-friendly nor free of false boundaries (blue→green jumps). <strong>Class Question</strong>: When to use a diverging colormap? Answer: Data that has a 'middle value' (e.g., positive/negative, temperature vs. average).</aside>
`;export{e as default};