import{A as e,H as t,i as n,j as r,rt as i}from"./src-Bqv1NRT4.js";var a=async(a,o)=>{let s=await o.students();a.innerHTML=`
    <div class="controls">
      <label>聚合层次：
        <select id="d-4-3-keys">
          <option value="major:class" selected>专业 → 班级</option>
          <option value="major:class:gender">专业 → 班级 → 性别</option>
          <option value="gender:major:class">性别 → 专业 → 班级</option>
          <option value="hometown:major">籍贯 → 专业</option>
        </select>
      </label>
      <label>节点间距：
        <input id="d-4-3-sep" type="range" min="0.1" max="2" step="0.05" value="0.6" />
        <span id="d-4-3-sep-out">0.6</span>
      </label>
    </div>
    <svg data-export-chart="" class="tree-svg tree-layout-svg" id="d-4-3-svg" viewBox="0 0 800 360"></svg>
    <p class="demo-legend">
      <strong>Reingold-Tilford 算法：</strong>1981 年提出，仍是 d3.tree() 的核心实现。每个父节点的子节点
      均匀分配左右两侧的空间，子节点的位置是递归计算父节点位置 ± 偏移。
    </p>
  `;let c=a.querySelector(`#d-4-3-keys`),l=a.querySelector(`#d-4-3-sep`),u=a.querySelector(`#d-4-3-sep-out`);function d(){let e=c.value.split(`:`),t={count:s.length},n=e.slice().reverse(),r=e=>e;for(let e=0;e<n.length;e++){let t=n[e],a=r;r=e=>i(e,a,e=>e[t])}return t.children=r(s),t}function f(e,t=`所有学生`){if(e instanceof Map){let n=[];for(let[t,r]of e)n.push(f(r,t));return{name:t,children:n}}return{name:`${t} (${e.length})`,value:e.length,_students:e}}function p(){let i=+l.value;u.textContent=i.toString();let o=d(),s=r(f(o.children)),c=e().size([320,720]).separation((e,t)=>e.parent===t.parent?1:i)(s),p=t(a.querySelector(`#d-4-3-svg`));p.selectAll(`*`).remove();let m=p.append(`g`).attr(`transform`,`translate(40, 20)`);m.selectAll(`.link`).data(c.links()).join(`path`).attr(`class`,`link`).attr(`d`,n().x(e=>e.y).y(e=>e.x));let h=m.selectAll(`.node`).data(c.descendants()).join(`g`).attr(`class`,`node`).attr(`transform`,e=>`translate(${e.y}, ${e.x})`);h.append(`circle`).attr(`r`,5),h.append(`text`).attr(`dy`,4).attr(`x`,e=>e.children?-8:8).attr(`text-anchor`,e=>e.children?`end`:`start`).text(e=>e.data.name)}c.addEventListener(`change`,p),l.addEventListener(`input`,p),p()};export{a as default};