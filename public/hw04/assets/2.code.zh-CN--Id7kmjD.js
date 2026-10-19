var e=`### 关键代码 ① 双层 rollup

<aside class="course-callout course-callout--code-purpose" role="note">两层 key：外层 = 专业，内层 = 班级，reducer = 计数。</aside>

\`\`\`javascript
 // 双层 rollup：返回嵌套 Map，外层 key=专业，内层 key=班级
const nested = d3.rollup(
  students,
  v => v.length,           // 每组聚合为单一值（这里是 count）
  d => d.major,            // 外层 key
  d => d.class             // 内层 key（rest 参数，可继续加）
);

// 遍历嵌套 Map：
for (const [major, inner] of nested) {
  for (const [cls, count] of inner) {
    console.log(major, cls, count);
  }
}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释：</strong> <code>d3.rollup</code> 的 key 参数是<strong>rest 参数</strong>（...keys），所以传 1 个 → 单层 Map，传 2 个 → 嵌套 Map，传 3 个 → 3 层嵌套。 这就是 OLAP 的"维度组合"。</aside>

### 关键代码 ② 用正则提取专业

<aside class="course-callout course-callout--code-purpose" role="note">CSV 里只有"班级"字段（"软件工程1班"），需要用正则切出"专业"和"班级序号"。</aside>

\`\`\`javascript
 // d3.csv 第二参 row 回调里逐行 transform
const data = await d3.csv("./data/newstudent.csv", d => {
  const cls = d["班级"].trim();
  const m = cls.match(/^(.+?)(\\d+班)$/);  // 中间非贪婪 + 末尾"数字+班"
  return {
    id:    +d["序号"],
    name:  d["姓名"].trim(),
    class: cls,
    major: m ? m[1] : cls,  // "软件工程1班" → "软件工程"
  };
});
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释：</strong> 正则 <code>/^(.+?)(\\d+班)$/</code> 的 <code>.+?</code> 是<strong>非贪婪</strong>匹配，会让中间尽可能短、末尾留给 <code>\\d+班</code>。 <strong>没这个非贪婪</strong>：<code>.+</code> 会把整串都匹配走，剩下空，<code>m[1]</code> 就是 undefined。 这类正则坑学生常踩，必须掌握。</aside>
`;export{e as default};