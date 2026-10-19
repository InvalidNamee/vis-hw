var e=`### ★ Key Code

★ <strong>Key Point 1: the second argument of d3.csv = the type-conversion callback</strong>

\`\`\`javascript
//  自动类型推断（数字/日期/布尔）
const raw = await d3.csv('./data/crime.csv', d3.autoType);
console.log(raw[0]);  // {state: 'Alabama', population: 3979000, murder: 350, ...}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">★ <code>d3.autoType</code> internally walks each column using <code>Number()</code> / <code>Date()</code> / string detection. Recognized types are converted; unrecognized values stay as strings.</aside>

★ <strong>Key Point 2: wide → long (the flatMap pattern)</strong>

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

<aside class="course-callout course-callout--key-point" role="note">★ <code>flatMap</code> is ES2019, shorthand for “map + one-level flatten”. More intuitive than the <code>map().flat()</code> chain.</aside>
`;export{e as default};