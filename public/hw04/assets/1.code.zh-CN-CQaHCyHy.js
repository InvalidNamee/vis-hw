var e=`### 关键代码 ① SVG 流程图节点 + 箭头

<aside class="course-callout course-callout--code-purpose" role="note">5 个 step 节点横向排列，相邻节点之间用 SVG marker 画的箭头连接。</aside>

\`\`\`javascript
 // 1. 用 <defs> + <marker> 定义箭头
svg.append("defs").append("marker")
   .attr("id", "arrowhead")
   .attr("viewBox", "0 -5 10 10")
   .attr("refX", 8)            // 箭头位置校准
   .attr("markerWidth", 6)
   .attr("orient", "auto")       // 跟随线方向旋转
   .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#94a3b8");

 // 2. 用 marker-end 引用箭头（重要）
svg.append("line")
   .attr("marker-end", "url(#arrowhead)")
   .attr("x1", x1).attr("y1", y).attr("x2", x2).attr("y2", y);

 // 3. 节点  数据 绑定：d3.data + click 事件
svg.selectAll(".node").data(nodes)
   .join("g")
   .on("click", (event, d) => {
     //  关键：classed 是 D3 状态管理核心 API
     svg.selectAll(".node").classed("selected", n => n.id === d.id);
     document.getElementById("d-4-1-detail").innerHTML = d.detail;
   });
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释：</strong> <code>marker-end="url(#arrowhead)"</code> 是 SVG 引用的方式 —— 把 &lt;defs&gt; 里定义的形状"嵌入"到线段末端； <code>classed("selected", predicate)</code> 接收布尔函数，一次性切换所有节点的"selected"状态，<strong>避免自己写 forEach</strong>。</aside>
`;export{e as default};