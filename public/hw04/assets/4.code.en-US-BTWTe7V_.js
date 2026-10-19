var e=`### Key Code — Event Delegation (one-to-many listening)

<aside class="course-callout course-callout--code-purpose" role="note">Use recursive <code>buildList</code> to construct the collapsible tree; use the click on <code>liSel</code> for event delegation rather than binding to each label.</aside>

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

<aside class="course-callout course-callout--key-point" role="note"><strong>Key explanation:</strong> This is the classic pattern of “<strong>stopping the toggle button from bubbling up to the <code>li</code>'s select listener</strong>.” Without <code>stopPropagation</code>, clicking the toggle would simultaneously trigger “toggle collapse” and “select the node,” which would confuse users. <strong>This is a core teaching point about the DOM event mechanism.</strong></aside>

### Key Code — Nested Recursive buildList

<aside class="course-callout course-callout--code-purpose" role="note">Recursive rendering with d3 selections: every li contains another ul/li, then buildList recurses into it.</aside>

\`\`\`javascript
function render() {
  $tree.innerHTML = "";
  const ul = d3.create("ul");
  ul.selectAll("li").data([root]).join("li")
    .each(function(d) { buildList(d3.select(this), d); });
  $tree.appendChild(ul.node());
}
\`\`\`

### Key Code — D3 Transition (transition + duration)

<aside class="course-callout course-callout--code-purpose" role="note">The “time dimension” of view rendering: smoothly interpolate node expand / collapse instead of an instant jump. <code>duration</code> is controlled by a live slider.</aside>

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

### Key Code — Animation Duration Slider

\`\`\`javascript
<!-- HTML 滑块：监听 input 事件即可改 DURATION -->
<input id="dur" type="range" min="0" max="1500" step="50" value="500">

// JS：改变 DURATION 后重放动画
document.getElementById("dur").addEventListener("input", e => {
  DURATION = +e.target.value;
  render();   // 用新时长重新做一次过渡
});
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>Key explanation:</strong> <strong>Why use <code>innerHTML = ""</code> to clear and redraw?</strong> D3 has no “smart-update” API for tree structures (where hierarchy changes) — expanding or collapsing a node changes the parent-child structure, and the simplest approach is a full re-render. Use <code>selection.each()</code> together with <code>d3.select(this)</code> to convert the raw element back into a selection — <strong>this is the key pattern for D3-native-DOM interop</strong>.</aside>
`;export{e as default};