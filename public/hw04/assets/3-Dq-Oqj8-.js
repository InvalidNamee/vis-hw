import{D as e,E as t,H as n,M as r,N as i,U as a,W as o,it as s,o as c,t as l,tt as u}from"./src-Be-g8xjc.js";var d=async function(d,f){let p=(await f.csv(`./data/crime.csv`,i)).map(e=>({x:e.population,y:e.murder})),m={t:20,r:20,b:36,l:50},h=720-m.l-m.r,g=380-m.t-m.b,_=t().domain(s(p,e=>e.x)).range([0,h]),v=e().domain([0,u(p,e=>e.y)*1.1]).range([g,0]),y=e().domain([0,h]).range([m.l,m.l+h]),b=e().domain([g,0]).range([m.t+g,m.t]),x=[{name:`linear`,label:`Linear（直线）`},{name:`monotoneX`,label:`Monotone X`},{name:`natural`,label:`Natural`},{name:`basis`,label:`Basis`},{name:`cardinal`,label:`Cardinal`},{name:`catmullRom`,label:`Catmull-Rom`},{name:`step`,label:`Step`},{name:`stepBefore`,label:`Step Before`},{name:`stepAfter`,label:`Step After`},{name:`curveBundle`,label:`Bundle`}];d.innerHTML=`
    <h4> 曲线拟合：插值 vs 平滑</h4>
    <p class="demo-hint">同 50 个州的人口-谋杀率散点，用 10 种 curve 各画一条线。点击切换。</p>
    <div class="demo-control" id="curve-tabs" style="margin-bottom:12px"></div>
    <svg data-export-chart="" class="heatmap-svg" width="720" height="380" id="curves"></svg>
    <div id="curve-note"></div>
  `;let S=d.querySelector(`#curve-tabs`),C=n(d.querySelector(`#curves`)),w=d.querySelector(`#curve-note`);function T(e){let t=x[e],n=[...p].sort((e,t)=>e.x-t.x),i=c().x(e=>_(e.x)).y(e=>v(e.y));(t.name!==`linear`&&t.name!==`step`&&t.name!==`stepBefore`&&t.name!==`stepAfter`||t.name.startsWith(`step`))&&i.curve(l[t.name]),C.selectAll(`*`).remove(),C.append(`g`).selectAll(`line`).data(v.ticks(6)).enter().append(`line`).attr(`x1`,m.l).attr(`x2`,m.l+h).attr(`y1`,e=>b(v(e))).attr(`y2`,e=>b(v(e))).attr(`stroke`,`#e2e8f0`),C.append(`g`).attr(`transform`,`translate(${m.l},${m.t+g})`).call(a().scale(_).tickFormat(r(`.0s`))),C.append(`g`).attr(`transform`,`translate(${m.l},${m.t})`).call(o().scale(v)),C.selectAll(`circle`).data(p).enter().append(`circle`).attr(`cx`,e=>y(_(e.x))).attr(`cy`,e=>b(v(e.y))).attr(`r`,3).attr(`fill`,`#94a3b8`).attr(`opacity`,.5),C.append(`path`).datum(n).attr(`fill`,`none`).attr(`stroke`,`#6366f1`).attr(`stroke-width`,2).attr(`d`,i),w.innerHTML=`
      <h4> 关键点</h4>
      <ul>
        <li><code>linear</code>、<code>step*</code> 是基础</li>
        <li><code>monotoneX</code>：保证原序列单调不出现伪震荡</li>
        <li><code>natural</code>、<code>catmullRom</code>：过所有点的平滑样条</li>
        <li>拟合 vs 插值：插值过所有点但容易过拟合；拟合（regression）只看趋势</li>
      </ul>
    `}x.forEach((e,t)=>{let n=document.createElement(`label`);n.textContent=e.label,t===0&&n.classList.add(`active`),n.addEventListener(`click`,()=>{S.querySelectorAll(`label`).forEach(e=>e.classList.remove(`active`)),n.classList.add(`active`),T(t)}),S.appendChild(n)}),T(0)};export{d as default};