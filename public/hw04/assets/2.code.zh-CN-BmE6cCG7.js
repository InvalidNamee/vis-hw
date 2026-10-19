var e=`### 关键代码 ① SVG 金字塔路径

<aside class="course-callout course-callout--code-purpose" role="note">金字塔由 4 个 trapezoid 拼接而成 —— D3 path 的 d 属性。</aside>

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

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释</strong>：SVG path 的 <code>M</code>(moveto)、<code>L</code>(lineto)、<code>Z</code>(close) 是 3 个最常用指令。 模板字符串 <code>\`\${...}\`</code> 可以直接嵌入 JS 变量，比字符串拼接更可读。 <strong>实践</strong>：复杂形状用 D3 的 <code>d3.symbol()</code>（内置 ★●▲ 等），自己 path 容易出错。</aside>

### 关键代码 ② 交互高亮（hover/click）

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

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释</strong>：<strong>必须用 <code>function()</code> 而非箭头函数</strong>—— 因为 D3 回调里要用 <code>this</code> 访问当前元素，箭头函数会捕获外层 <code>this</code> 导致失效。这是 D3 最常见的坑。 <code>transition().duration()</code> 是 D3 内置动画 API，比 jQuery 还简洁。</aside>
`;export{e as default};