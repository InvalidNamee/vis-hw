var e=`### Key Code ① .join(enter, update, exit) Three States

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

<aside class="course-callout course-callout--key-point" role="note"><strong>Key-Point Explanation</strong>: The three callbacks of join are invoked in the enter / update / exit phases respectively. This 'declarative three-state' pattern is more concise than the v3 <code>enter().append()</code> + <code>exit().remove()</code> style, and less error-prone. <strong>Analogy</strong>: React's diff + patch — the same idea, but React does it for you, while D3 lets you write the transformation functions yourself.</aside>

### Key Code ② key Function Preserves Identity

\`\`\`javascript
 // 关键点 ②：key 函数 —— 元素身份的稳定器
//  不带 key：数据顺序变化 → 所有元素都"update"，过渡动画错乱
svg.selectAll("circle").data(newData);

//  带 key：用唯一字段绑定身份，元素"知道自己是哪个"
svg.selectAll("circle").data(newData, d => d.id);

// 同样的逻辑用 React 描述：key={item.id}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>Key-Point Explanation</strong>: <strong>The key function is the soul of D3 animation</strong>. Without a key, D3 binds identity by index: reordering data causes 'all elements to move'. With a key, each circle knows its id, and on reorder only cx changes, so the transition animation is natural. <strong>Analogy</strong>: Exactly the same idea as React's <code>key={item.id}</code>.</aside>

### Key Code ③ d3.select vs d3.selectAll

\`\`\`javascript
 // 关键点 ③：选择器的核心区别
// select：返回 1 个元素（第一个匹配）；数据绑定只对这一个元素
const title = d3.select("#title");

// selectAll：返回多个元素；数据绑定按顺序一一对应
const bars = d3.selectAll(".bar").data(values);
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>Key-Point Explanation</strong>: <code>select</code> is used to 'operate on a single element', and <code>selectAll</code> is used to 'bind data in bulk'. <strong>Common Mistake</strong>: When using <code>selectAll(".bar")</code> to bind data to an array, the number of elements must match the number of data items, otherwise it will 'leave gaps' or 'overflow'. <strong>Best Practice</strong>: First use <code>selectAll</code> to create placeholder elements (possibly empty), then <code>.data().join(...)</code>.</aside>
`;export{e as default};