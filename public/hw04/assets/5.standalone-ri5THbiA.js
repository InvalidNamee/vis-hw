var e=`对应讲义章节 3.5.1 D3 数据选择器。本 demo 把 D3 最核心的 <strong>Data-Join 三态模型</strong>（enter / update / exit）可视化： 数据 > 元素 ⇒ 多出来的进入 enter，被替换的留在 update，多余元素进入 exit。

select vs selectAll

<table><thead><tr><th>方法</th><th>返回</th><th>典型用法</th></tr></thead><tbody><tr><td>d3.select("selector")</td><td>单个元素（或 null）</td><td>选中唯一的根元素</td></tr><tr><td>d3.selectAll("selector")</td><td>多个元素的 selection</td><td>绑定数据数组 → 三态模型</td></tr><tr><td>selection.select("selector")</td><td>每个选中元素的后代中第一个匹配</td><td>嵌套：父 → 子</td></tr><tr><td>selection.selectAll("selector")</td><td>每个选中元素的后代中所有匹配</td><td>嵌套：父 → 多个子</td></tr><tr><td>selection.selectChild()</td><td>直接子元素中的第一个</td><td>DOM 层级</td></tr><tr><td>selection.selectChildren()</td><td>所有直接子元素</td><td>DOM 层级</td></tr></tbody></table>

核心代码

\`\`\`javascript
const circles = svg.selectAll("circle")
  .data(currentData)
  .join(
    enter => enter.append("circle")
      .attr("fill", "green"),
    update => update.attr("fill", "cyan"),
    exit => exit.remove()
  );
\`\`\`

<aside class="course-callout course-callout--note" role="note"><strong>嵌入理论：</strong>D3 的 Data-Join 是 Mike Bostock 提出的声明式数据绑定模型。 与命令式 DOM 操作相比，三态模型的优势： (1) 增量更新而非全量重绘 → 性能好；(2) 元素身份稳定 → 过渡动画自然； (3) 与函数式数据流天然契合 → 易于推理。</aside>
`;export{e as default};