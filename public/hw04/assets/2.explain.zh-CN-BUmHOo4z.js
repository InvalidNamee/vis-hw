var e=`### 本节在流程中的位置：数据变换（Data Transformation）

<strong>Card 1999 数据流模型</strong>把可视化拆成四段： <em>原始数据 → (变换) → 数据表 → (映射) → 视觉结构 → (渲染) → 视图</em>。 本节讲的 <strong>2.2</strong>，就是第一段箭头 <strong>「原始数据 → 数据表」</strong>—— 这正是 <strong>数据变换（Data Transformation）</strong>。

### 你的原案例

用新生数据按 "专业 / 班级" 做 <strong>rollup 分桶聚合</strong>。 你演示的核心是 d3.rollup 的链式调用 —— 一个函数完成多维度分组。

### 理论补丁：数据变换的四大操作（Card 1999 D 层）

从「原始数据」到「数据表」，D 层做四类操作<strong>（注意：原文 4.2 节只讲了"分桶聚合"，这里把它放到完整的数据变换框架里）</strong>：

<table class="theory-table"><thead><tr><th>操作</th><th>做什么</th><th>D3 实现</th></tr></thead><tbody><tr><td><strong>清洗 / 过滤</strong> (clean / filter)</td><td>去缺失、去异常、筛选满足条件的行</td><td><code>.filter()</code>、<code>d3.csv(row)</code> 回调</td></tr><tr><td><strong>聚合 / 汇总</strong> (aggregate)</td><td>按 key 分组，把同组归约为一个值</td><td><code>d3.rollup()</code>、<code>d3.group()</code></td></tr><tr><td><strong>连接 / 关联</strong> (join)</td><td>按键把两张表拼起来（如把学生表 join 班级表）</td><td><code>d3.map</code> + 手动索引</td></tr><tr><td><strong>派生 / 衍生</strong> (derive)</td><td>由已有列算出新列（如从"班级"切出"专业"）</td><td>row 回调里算一个新字段</td></tr></tbody></table>

<strong>本节演示的 rollup 聚合，属于"聚合"这一行</strong>。但读懂这张表，你才知道 数据变换是整个可视化流水线的"第一公里" —— 数据表没整理好，后面映射/渲染全都白搭。

### 嵌入理论：函数式聚合与 OLAP 切片

<strong>d3.rollup 是"按 key 分桶、再 reduce 一次"的函数式组合</strong>：

\`\`\`javascript
const result = d3.rollup(
  data,                    // 输入数组
  v => v.length,          // reducer
  d => d.major,           // key1（外层）
  d => d.class           // key2（内层，可选）
);
\`\`\`

它返回 \`Map\`（不是数组、不是对象），所以：

-   遍历用 \`for ([k, v] of m)\` 或 \`m.entries()\`
-   嵌套 rollup 出嵌套 Map
-   与 \`d3.group\` 的差别：rollup 把组内数据归约成<strong>一个值</strong>，group 保留<strong>原数组</strong>

### 理论补丁：OLAP 切片/切块/钻取

1993 年 Codd 提出 OLAP 12 条准则，其中 3 个核心操作用 rollup 就能模拟：

-   <strong>切片 (Slice)：</strong>固定一维度（如只看 2025 级）→ 等价于 \`.filter()\` 后 rollup
-   <strong>切块 (Dice)：</strong>按两个维度分组 → 等价于双 key rollup
-   <strong>钻取 (Drill)：</strong>层层下钻 → 等价于嵌套 rollup + 递归展开

<strong>教学要点</strong>：可视化系统的"下钻交互"通常背后就是 rollup + hierarchy 的组合。本节课演示 d3.rollup 的多层级能力。
`;export{e as default};