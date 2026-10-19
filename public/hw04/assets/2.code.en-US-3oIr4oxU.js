var e=`### Key Code ① SVG Pyramid Path

<aside class="course-callout course-callout--code-purpose" role="note">The pyramid is composed of 4 trapezoids joined together — the d attribute of the D3 path.</aside>

\`\`\`javascript
 // 关键点 ①：trapezoid 路径 —— 从上到下 4 个点的连线
const topW = 60, botW = 120;
const yTop = 20, yBot = 100;
const path = \`
  M \${cx - topW/2} \${yTop}
  L \${cx + topW/2} \${yTop}
  L \${cx + botW/2} \${yBot}
  L \${cx - botW/2} \${yBot}
  Z
\`;
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>Key-Point Explanation</strong>: The SVG path commands <code>M</code> (moveto), <code>L</code> (lineto), and <code>Z</code> (close) are the three most commonly used. Template literals <code>\`\${...}\`</code> can embed JS variables directly, making them more readable than string concatenation. <strong>Practice</strong>: For complex shapes, use D3's <code>d3.symbol()</code> (which has built-in ★●▲ etc.); hand-writing paths is error-prone.</aside>

### Key Code ② Interactive Highlighting (hover/click)

\`\`\`javascript
 // 关键点 ②：选择集绑定事件 —— D3 的事件模型
const g = svg.append("g")
  .style("cursor", "pointer")
  .on("mouseover", function() {       // 注意 function 而非箭头函数
    d3.select(this).select("path")
       .transition().duration(150)
       .attr("fill", d3.color(layer.color).brighter(0.5));
  })
  .on("click", () => showDetail(layer));
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>Key-Point Explanation</strong>: <strong>You must use <code>function()</code> instead of arrow functions</strong> — because D3 callbacks use <code>this</code> to access the current element, and arrow functions capture the outer <code>this</code>, causing it to fail. This is the most common D3 pitfall. <code>transition().duration()</code> is D3's built-in animation API, even more concise than jQuery.</aside>
`;export{e as default};