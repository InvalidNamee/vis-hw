var e=`### Key Code ① Field Name Mapping

<aside class="course-callout course-callout--code-purpose" role="note">Map Chinese column names to English variable names — to avoid syntax/encoding issues caused by Chinese keys in JS.</aside>

\`\`\`javascript
 // 关键点 ①：字段映射 —— 中文 → 英文
const COLUMN_MAP = {
  "序号": "id",
  "姓名": "name",
  "性别": "gender",
  "生日": "birthday",
  "年龄": "age",
  "班级": "class",
};
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>Key-Point Explanation:</strong> Why not use Chinese keys? (1) JS engines have poor tolerance for Chinese identifiers (older browsers throw errors); (2) backends, JSON, and URL encoding may introduce mojibake; (3) IDE autocomplete, search, and refactoring tools have inconsistent support for Chinese. <strong>Best Practice</strong>: Use human-readable Chinese names in CSV, and use unified English variables internally in JS.</aside>

### Key Code ② Type Conversion Functions

<aside class="course-callout course-callout--code-purpose" role="note">After CSV loading, all fields are strings; you need to convert the index/age to Number and the birthday to a Date object.</aside>

\`\`\`javascript
 // 关键点 ②：类型转换函数 —— 用户原文「推荐方式」
function transformRow(d) {
  return {
    id:       +d["序号"],              // 一元 + 把字符串转 Number
    name:     d["姓名"].trim(),       // trim() 去掉首尾空白
    birthday: new Date(d["生日"]), // 字符串 → Date 对象
    age:      +d["年龄"],
    class:    d["班级"].trim(),
  };
}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>Key-Point Explanation:</strong> <code>+d["年龄"]</code> is the unary plus operator, the fastest way in JS to convert a string to a number (shorter than <code>Number()</code> / <code>parseInt()</code>); <code>new Date(str)</code> can parse ISO formats like <code>"2007-08-15"</code>, but has poor compatibility with <code>"2007/8/15"</code>, so fall back to <code>d3.timeParse("%Y-%m-%d")</code>. <strong>Pitfall</strong>: Without <code>trim()</code>, the trailing space in "软件工程1班 " will cause later filtering/aggregation to fail.</aside>

### Key Code ③ Pass the row callback directly as the second argument of d3.csv

\`\`\`javascript
 // 关键点 ③：一行完成加载 + 转换（用户原文「代码示例 1」）
const data = await d3.csv("data/newstudent.csv", transformRow);

// 验证类型确实转换了：
console.log(typeof data[0].age);        // "number"
console.log(data[0].birthday instanceof Date); // true
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>Key-Point Explanation:</strong> d3.csv is an asynchronous function and must be <code>await</code>ed. The row callback in the second argument is <strong>invoked immediately after each row is parsed</strong> — which saves memory compared to first <code>await d3.csv(...)</code> then <code>.map(transformRow)</code> (transform while reading). <strong>Significance of Asynchronous Loading</strong>: It does not block page rendering, so the user can keep interacting.</aside>
`;export{e as default};