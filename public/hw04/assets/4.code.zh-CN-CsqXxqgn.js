var e=`### 关键代码 ① map / reduce 的链式组合

\`\`\`javascript
 // 关键点 ①：函数式数据流 —— map 后接 filter 再 reduce
const avgAge =
  students
    .filter(s => s.gender === "男")    // ① 过滤男生
    .map(s => s.age)                    // ② 提取年龄
    .reduce((sum, a) => sum + a, 0) // ③ 合计
  / students.filter(s => s.gender === "男").length; // ④ 求平均
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释</strong>：链式调用的每一步返回新数组，不会修改原数组。 <strong>与命令式对比</strong>：命令式需要 4 个临时变量 + 一个 for 循环，函数式一行搞定。 <strong>性能权衡</strong>：每次 map/filter 都会创建新数组，对超大数组有性能损耗（百万级以上才显著）。</aside>

### 关键代码 ② cross（笛卡尔积）

\`\`\`javascript
 // 关键点 ②：cross —— 笛卡尔积，用于两两组合
const genders = ["男", "女"];
const majors  = ["软件工程", "数据科学"];
const combos  = d3.cross(genders, majors);
// → [["男","软件工程"], ["男","数据科学"], ["女","软件工程"], ["女","数据科学"]]
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释</strong>：笛卡尔积常用在"两两组合"分析（如性别 × 专业的人数统计）。 第二参 reducer 可选，用来"合并"两个元素。 <strong>扩展</strong>：3 个数组的笛卡尔积是 8 种，n 个数组的笛卡尔积是乘积大小。</aside>

### 关键代码 ③ group / rollup（聚合）

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

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释</strong>：<code>group</code> vs <code>rollup</code> 是"分组保留"vs"分组聚合"的区别。 <code>rollup</code> 第二参是 reducer 函数（这里取长度），后续章节 doc-02 会详细用 rollup 做树形数据。</aside>
`;export{e as default};