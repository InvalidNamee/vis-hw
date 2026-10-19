var e=`### 关键代码 ① 事件委托（一对多监听）

<aside class="course-callout course-callout--code-purpose" role="note">用递归 buildList 构建可折叠树；用 liSel 上的 click 做事件委托，不绑到每个 label。</aside>

\`\`\`javascript
 // 父 ul 上绑一次 click，所有子 li 共享
function buildList(liSel, d) {
  const label = liSel.append("span").attr("class", "label");

  label.on("click.toggle", (event) => {
    //  关键 ①：阻止冒泡 —— toggle 按钮不该触发"选中"
    event.stopPropagation();
    d.data._collapsed = !d.data._collapsed;
    render();
  });

  liSel.on("click.select", (event) => {
    //  关键 ②：如果 click 来自 toggle，已经被 stopPropagation 阻断，不会到这里
    document.querySelectorAll("li").forEach(li => li.classList.remove("selected"));
    liSel.classed("selected", true);
  });
}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释：</strong> 这是经典的「<strong>阻止 toggle 按钮冒泡到 li 的 select 监听器</strong>」模式。如果不 stopPropagation， 点 toggle 时会同时触发"切换折叠"和"选中节点"，用户看着会困惑。 <strong>这是 DOM 事件机制的核心教学点。</strong></aside>

### 关键代码 ② 嵌套递归 buildList

<aside class="course-callout course-callout--code-purpose" role="note">d3 selection 的递归渲染：每个 li 内部再有 ul/li，再递归 buildList。</aside>

\`\`\`javascript
function render() {
  $tree.innerHTML = "";
  const ul = d3.create("ul");
  ul.selectAll("li").data([root]).join("li")
    .each(function(d) { buildList(d3.select(this), d); });
  $tree.appendChild(ul.node());
}
\`\`\`

### 关键代码 ③ D3 过渡动画（transition + duration）

<aside class="course-callout course-callout--code-purpose" role="note">视图渲染的"时间维"：让节点展开/收缩时平滑过渡，不是瞬间跳变。duration 由滑块实时控制。</aside>

\`\`\`javascript
 // 关键：transition + duration = 让属性随时间平滑变化
svg.selectAll(".node")
  .transition()                                  // 进入过渡状态
  .duration(DURATION)                          // 时长（ms），滑块控制
  .attr("transform", d => \`translate(\${d.y}, \${d.x})\`)
  .attr("opacity", 1);

// 新节点进入时：先设 opacity=0，再过渡到 1 → 淡入效果
ng.attr("opacity", 0)
  .transition().duration(DURATION).attr("opacity", 1);
\`\`\`

### 关键代码 ④ 动画时长滑块（直接在 HTML/CSS 里控制）

\`\`\`javascript
<!-- HTML 滑块：监听 input 事件即可改 DURATION -->
<input id="dur" type="range" min="0" max="1500" step="50" value="500">

// JS：改变 DURATION 后重放动画
document.getElementById("dur").addEventListener("input", e => {
  DURATION = +e.target.value;
  render();   // 用新时长重新做一次过渡
});
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释：</strong> <strong>为什么用 innerHTML = "" 清空再重画？</strong> D3 没有"智能更新"树结构（层级变化）的 API —— 节点展开/折叠会改变父子结构，最简单的做法是全量重新渲染。 用 <code>selection.each()</code> 配合 <code>d3.select(this)</code> 把原生元素转回 selection，<strong>这是 D3 与原生 DOM 互操作的关键模式</strong>。</aside>
`;export{e as default};