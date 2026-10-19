var e=`### Key Code ① Chained Composition of map / reduce

\`\`\`javascript
 // 关键点 ①：函数式数据流 —— map 后接 filter 再 reduce
const avgAge =
  students
    .filter(s => s.gender === "男")    // ① 过滤男生
    .map(s => s.age)                    // ② 提取年龄
    .reduce((sum, a) => sum + a, 0) // ③ 合计
  / students.filter(s => s.gender === "男").length; // ④ 求平均
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>Key-Point Explanation</strong>: Each step of the chained call returns a new array and does not modify the original array. <strong>Compared with Imperative</strong>: The imperative style needs 4 temporary variables + a for loop, while the functional style does it in one line. <strong>Performance Trade-off</strong>: Each map/filter creates a new array, which incurs a performance cost for very large arrays (only significant above the million level).</aside>

### Key Code ② cross (Cartesian Product)

\`\`\`javascript
 // 关键点 ②：cross —— 笛卡尔积，用于两两组合
const genders = ["男", "女"];
const majors  = ["软件工程", "数据科学"];
const combos  = d3.cross(genders, majors);
// → [["男","软件工程"], ["男","数据科学"], ["女","软件工程"], ["女","数据科学"]]
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>Key-Point Explanation</strong>: The Cartesian product is commonly used in 'pairwise combination' analysis (e.g., counting students by gender × major). The second reducer argument is optional and is used to 'combine' the two elements. <strong>Extension</strong>: The Cartesian product of 3 arrays yields 8 combinations; for n arrays it is the product of their sizes.</aside>

### Key Code ③ group / rollup (Aggregation)

\`\`\`javascript
 // 关键点 ③：group 与 rollup —— 层次聚合
// group 返回 Map（保留所有元素）
const byClass = d3.group(students, s => s.class);
// rollup 返回 Map（每个 key 只保留聚合值）
const countByClass = d3.rollup(
  students,
  v => v.length,
  s => s.class
);
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>Key-Point Explanation</strong>: <code>group</code> vs <code>rollup</code> is the difference between 'keep groups' and 'aggregate groups'. The second argument of <code>rollup</code> is a reducer function (here it takes the length); in later chapter doc-02, rollup will be used in detail for tree-structured data.</aside>
`;export{e as default};