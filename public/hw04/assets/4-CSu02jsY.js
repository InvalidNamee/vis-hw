import{H as e,V as t,j as n,rt as r}from"./src-Be-g8xjc.js";var i=async(i,a)=>{let o=await a.students(),s=r(o,e=>e,e=>e.major,e=>e.class);function c(e,t=`全部新生`){if(e instanceof Map){let n=[];for(let[t,r]of e)n.push(c(r,t));return{name:t,children:n}}return{name:`${t} (${e.length}人)`,students:e}}let l=c(s,`2025 级新生`),u=n(l);u.descendants().forEach(e=>e.data._collapsed=!1);let d=500;i.innerHTML=`
    <div class="controls">
      <button id="d-4-4-expand-all"  class="demo-btn">全部展开</button>
      <button id="d-4-4-collapse-all" class="demo-btn secondary">全部折叠</button>
      <label style="font-size:13px;color:#475569;">动画时长
        <input id="d-4-4-dur" type="range" min="0" max="1500" step="50" value="500" style="vertical-align:middle;">
        <span id="d-4-4-dur-out" style="width:40px;display:inline-block;text-align:right;">500ms</span>
      </label>
      <span style="font-size:12px;color:#64748b;"> 点 toggle 折叠 · 点「选中」看事件委托 · 拖滑块看 transition</span>
    </div>
    <div class="tree-list" id="d-4-4-tree"></div>
    <p class="console" id="d-4-4-info">点击任意班级条目 → 看事件冒泡 & delegated handler 的日志</p>
    <p class="demo-legend">
      <strong>关键技术：</strong>
      <code>classed("selected", bool)</code> 链式状态控制 ·
      <code>stopPropagation()</code> 阻止冒泡 ·
      <code>e.target.closest(".label")</code> 事件委托 ·
      <code>.transition().duration(ms)</code> 动画
    </p>
  `;let f=i.querySelector(`#d-4-4-tree`),p=i.querySelector(`#d-4-4-info`);function m(){f.innerHTML=``;let n=t(`ul`);n.selectAll(`li`).data([u]).join(`li`).each(function(t){h(e(this),t)}),f.appendChild(n.node())}function h(t,n){t.attr(`class`,n.data._collapsed?`collapsed`:``);let r=t.append(`span`).attr(`class`,`label`);if(n.children?r.append(`span`).attr(`class`,`toggle`).text(n.data._collapsed?``:`▼`):r.append(`span`).attr(`class`,`toggle`).text(`·`),r.append(`span`).text(n.data.name),n.data.students&&r.append(`span`).attr(`class`,`count`).text(n.data.students.length),r.on(`click.toggle`,e=>{e.stopPropagation(),n.data._collapsed=!n.data._collapsed,m()}),t.on(`click.select`,e=>{e.target.classList.contains(`toggle`)||(f.querySelectorAll(`li`).forEach(e=>e.classList.remove(`selected`)),t.classed(`selected`,!0),p.innerHTML=`<strong>事件冒泡日志：</strong><br>  · 触发节点：<code>${n.data.name}</code><br>  · e.target = 元素 .label（不是 ul）<br>  · li 的 click 监听器被调用（事件委托）<br>  · toggle 按钮上 stopPropagation() 阻止冒泡，所以不触发本监听器`)}),n.children&&!n.data._collapsed){let r=t.append(`ul`);d>0&&r.style(`opacity`,0).transition().duration(d).style(`opacity`,1),r.selectAll(`li`).data(n.children).join(`li`).each(function(t){h(e(this),t)})}}i.querySelector(`#d-4-4-expand-all`).onclick=()=>{u.descendants().forEach(e=>e.data._collapsed=!1),m()},i.querySelector(`#d-4-4-collapse-all`).onclick=()=>{u.descendants().forEach(e=>e.data._collapsed=!0),m()};let g=i.querySelector(`#d-4-4-dur`),_=i.querySelector(`#d-4-4-dur-out`);g.addEventListener(`input`,()=>{d=+g.value,_.textContent=d+`ms`,m()}),m()};export{i as default};