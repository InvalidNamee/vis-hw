var e=`### 关键代码 ① .join(enter, update, exit) 三态

\`\`\`javascript
 // 关键点 ①：D3 v5+ 的 join() API —— 优雅处理三态
const circles = svg.selectAll("circle")
  .data(currentData)
  .join(
    enter  => enter.append("circle").attr("fill", "green"),  // enter
    update => update.attr("fill", "cyan"),                              // update
    exit   => exit.remove()                                                   // exit
  );
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释</strong>：join 的三个回调分别在 enter / update / exit 阶段被调用。 这种"声明式三态"比 v3 的 <code>enter().append()</code> + <code>exit().remove()</code> 写法更简洁，逻辑更不易出错。 <strong>类比</strong>：React 的 diff + patch —— 同样思想，但 React 帮你做了，D3 让你自己写变换函数。</aside>

### 关键代码 ② key 函数保身份

\`\`\`javascript
 // 关键点 ②：key 函数 —— 元素身份的稳定器
//  不带 key：数据顺序变化 → 所有元素都"update"，过渡动画错乱
svg.selectAll("circle").data(newData);

//  带 key：用唯一字段绑定身份，元素"知道自己是哪个"
svg.selectAll("circle").data(newData, d => d.id);

// 同样的逻辑用 React 描述：key={item.id}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释</strong>：<strong>key 函数是 D3 动画的灵魂</strong>。 没有 key 时，D3 按 index 绑定身份：数据重排会导致"所有元素都换位置"。 带 key 后，每个 circle 知道自己的 id 是什么，重排时只是 cx 变化，过渡动画自然。 <strong>类比</strong>：与 React 的 <code>key={item.id}</code> 完全相同的思想。</aside>

### 关键代码 ③ d3.select vs d3.selectAll

\`\`\`javascript
 // 关键点 ③：选择器的核心区别
// select：返回 1 个元素（第一个匹配）；数据绑定只对这一个元素
const title = d3.select("#title");

// selectAll：返回多个元素；数据绑定按顺序一一对应
const bars = d3.selectAll(".bar").data(values);
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释</strong>：<code>select</code> 用于"操作单个元素"，<code>selectAll</code> 用于"批量绑定数据"。 <strong>常见错误</strong>：用 <code>selectAll(".bar")</code> 给一个数组绑定数据时，元素数量与数据数量必须匹配，否则会"留空"或"溢出"。 <strong>最佳实践</strong>：先用 <code>selectAll</code> 创建占位元素（可能为空），再 <code>.data().join(...)</code>。</aside>
`;export{e as default};