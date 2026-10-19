var e=`### 你的原案例（6 个选择器方法）

你的原文梳理了 6 个选择器方法：

<table class="theory-table"><thead><tr><th>方法</th><th>返回</th></tr></thead><tbody><tr><td><code>d3.select</code></td><td>单个元素</td></tr><tr><td><code>d3.selectAll</code></td><td>多个元素的 selection</td></tr><tr><td><code>selection.select</code></td><td>每个选中元素的后代中第一个</td></tr><tr><td><code>selection.selectAll</code></td><td>后代中所有</td></tr><tr><td><code>selection.selectChild</code></td><td>直接子元素第一个</td></tr><tr><td><code>selection.selectChildren</code></td><td>所有直接子元素</td></tr></tbody></table>

### 嵌入理论：Data-Join 三态模型（Mike Bostock）

D3 的核心是 <strong>Data-Join</strong>：把数据数组"绑定"到 DOM 元素上。

当数据变化时：

-   新数据 > 旧数据：多出来的进入 <strong>enter</strong>（要 append）
-   新数据 = 旧数据：原有元素进入 <strong>update</strong>（要改属性）
-   新数据 < 旧数据：多余的元素进入 <strong>exit</strong>（要 remove）

![three states](./data/join.png)

### Data-Join vs 命令式 DOM

<table class="theory-table"><thead><tr><th>命令式</th><th>声明式（Data-Join）</th></tr></thead><tbody><tr><td><code>createElement</code> 后逐个 append</td><td><code>.data(arr).join(...)</code> 一行</td></tr><tr><td>全量重绘</td><td>增量更新（性能好）</td></tr><tr><td>元素身份丢失</td><td>key 函数保留稳定身份（动画自然）</td></tr><tr><td>与数据流脱节</td><td>与函数式数据流天然契合</td></tr></tbody></table>
`;export{e as default};