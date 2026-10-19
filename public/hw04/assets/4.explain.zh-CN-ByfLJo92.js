var e=`### 本节在流程中的位置：视图渲染 + 用户交互

接上节 <strong>2.3 视觉映射</strong>，我们有了"视觉结构"。本节 <strong>2.4</strong> 是最后两段箭头： <strong>「视觉结构 → 视图」（渲染）</strong> 和 <strong>「视图 用户」（交互反馈）</strong>。 Card 模型的 V 层，加上 van Wijk 的反馈环，都落在这里。

### 你的原案例

原文档用了 \`classed\` 控制节点样式、用 \`stopPropagation\` 阻止冒泡。重点是<strong>把 D3 树布局输出变成可交互的 HTML 列表</strong>。

### 嵌入理论：DOM 事件三阶段 + 事件委托

浏览器的事件流分三阶段（DOM 规范）：

1.  <strong>捕获 (capturing)：</strong>window → document → ... → 目标元素（从外到内）
2.  <strong>目标 (target)：</strong>目标元素本身
3.  <strong>冒泡 (bubbling)：</strong>目标元素 → ... → document → window（从内到外）

默认监听的是冒泡阶段。你可以在监听器里 \`e.stopPropagation()\` 截断冒泡，让上层的监听器不再触发。

### 理论补丁：动画 —— 视图渲染的"时间维"（van Wijk 反馈的直观体现）

<strong>动画（transition）</strong>不是"花哨"，而是视图渲染在<em>时间维</em>上的展开。 D3 里用 \`.transition().duration(ms)\`， 让属性从旧值<strong>平滑过渡</strong>到新值。教学价值在 \`duration\` 这一个参数：

-   \`duration=0\`：瞬间跳变，师生"看不出变化过程"
-   \`duration=500\`：0.5 秒过渡，能看到展开/收缩/位移的流畅过程
-   \`duration>1500\`：太慢，学生开始走神

<strong>本节的交互 demo</strong> 特意加了 <strong>duration 滑块</strong>， 让你现场改变这个参数，直观看到"渲染如何随时间展开"。这是理解"视图渲染 + 交互反馈"最直接的一课。

### 理论补丁：事件委托 (Event Delegation)

<strong>问题</strong>：列表里有 1000 个 li，给每个 li 都绑 click 监听器 → 慢、内存大、新增元素要重新绑。

<strong>解法</strong>：只给父元素（ul/div）绑 1 个 click 监听器，利用冒泡机制 —— 子元素的 click 最终会触发父元素的监听器。用 \`e.target.closest('.label')\` 找到"实际点击的是哪个子元素"。

<strong>优势</strong>：1 个监听器代替 N 个、未来新增元素自动支持。

### 关键 API：D3 classed()

\`\`\`javascript
selection.classed("selected", true);          // 1) 添加 class
selection.classed("selected", false);         // 2) 移除 class
selection.classed("selected", d => d.id === pickId); // 3) 函数式批量切换
\`\`\`
`;export{e as default};