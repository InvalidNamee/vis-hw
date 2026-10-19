var e=`### Key Code — SVG Flowchart Nodes + Arrows

<aside class="course-callout course-callout--code-purpose" role="note">5 step nodes arranged horizontally, connected by SVG-marker-drawn arrows between adjacent nodes.</aside>

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

<aside class="course-callout course-callout--key-point" role="note"><strong>Key explanation:</strong> <code>marker-end="url(#arrowhead)"</code> is SVG's referencing mechanism — it “embeds” a shape defined inside <code>&lt;defs&gt;</code> at the line's end; <code>classed("selected", predicate)</code> takes a boolean function and toggles the “selected” state of every node in one call, <strong>so you avoid writing forEach yourself</strong>.</aside>
`;export{e as default};