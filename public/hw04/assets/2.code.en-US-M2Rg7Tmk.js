var e=`### Key Code — Double-layer Rollup

<aside class="course-callout course-callout--code-purpose" role="note">Two key layers: outer = major, inner = class, reducer = count.</aside>

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

<aside class="course-callout course-callout--key-point" role="note"><strong>Key explanation:</strong> The key parameter of <code>d3.rollup</code> is a <strong>rest parameter</strong> (...keys), so passing 1 → single-layer Map, 2 → nested Map, 3 → 3-layer nesting. This is OLAP's “dimension combination.”</aside>

### Key Code — Extract the Major via Regex

<aside class="course-callout course-callout--code-purpose" role="note">The CSV only has a “class” field (e.g., “Software Engineering Class 1”), so a regex is needed to split out the “major” and the “class number.”</aside>

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

<aside class="course-callout course-callout--key-point" role="note"><strong>Key explanation:</strong> In the regex <code>/^(.+?)(\\d+班)$/</code>, the <code>.+?</code> is <strong>non-greedy</strong> matching — it keeps the middle as short as possible and leaves the tail for <code>\\d+班</code>. <strong>Without non-greedy</strong>: <code>.+</code> would consume the whole string, leaving nothing, and <code>m[1]</code> would be <code>undefined</code>. This is a regex pitfall students frequently step on; you must master it.</aside>
`;export{e as default};