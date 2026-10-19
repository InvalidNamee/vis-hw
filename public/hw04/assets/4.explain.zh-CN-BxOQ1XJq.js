var e=`### 你的原案例（8 个函数）

你的原文列出 D3 提供的 8 个常见函数：

1.  \`map(iterable, mapper)\` —— 类似 Array.map
2.  \`reduce(iterable, reducer, init)\` —— 类似 Array.reduce
3.  \`cross(...iterables, reducer)\` —— 笛卡尔积
4.  \`merge(iterables)\` —— 合并为扁平数组
5.  \`pairs(iterable, reducer)\` —— 相邻元素对
6.  \`transpose(matrix)\` —— 矩阵转置
7.  \`zip(...arrays)\` —— 按位合并
8.  \`filter(iterable, test)\` —— 类似 Array.filter

### 嵌入理论：函数式数据流

这 8 个函数的共同特点：

-   <strong>不可变（immutable）</strong>：输入不变，返回新数组
-   <strong>纯函数</strong>：相同输入 → 相同输出，无副作用
-   <strong>可链式</strong>：返回值是数组，可以接下一层变换

<strong>为什么函数式？</strong>

-   可推理：每层变换独立可测
-   可并行：map/reduce/filter 天然支持并行化
-   可缓存：纯函数的输出可以记忆化

<aside class="course-callout course-callout--note" role="note"><strong>数据立方体（OLAP）雏形</strong>：<code>transpose</code> 做宽/长格式转换，<code>group + rollup</code> 做切片/切块/钻取 —— 这正是 BI 系统的核心。</aside>
`;export{e as default};