var e=`### 关键代码

<strong>关键点 1：d3.csv 第二参 = 类型转换回调</strong>

\`\`\`javascript
//  自动类型推断（数字/日期/布尔）
const raw = await d3.csv('./data/crime.csv', d3.autoType);
console.log(raw[0]);  // {state: 'Alabama', population: 3979000, murder: 350, ...}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><code>d3.autoType</code> 内部就是遍历每列、用 <code>Number()</code> / <code>Date()</code> / 字符串检测。能识别的就转、识别不了保持字符串。</aside>

<strong>关键点 2：宽 → 长（flatMap 模式）</strong>

\`\`\`javascript
//  flatMap：每行展开成多个观测
const long = raw.flatMap(d =>
  ['murder', 'robbery', 'burglary'].map(key => ({
    state:  d.state,
    metric: key,
    value:  d[key]
  }))
);
// 现在可以做：d3.group(long, d => d.metric)
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><code>flatMap</code> 是 ES2019，是 "map + 一维 flatten" 的简写。比 <code>map().flat()</code> 链式更直观。</aside>
`;export{e as default};