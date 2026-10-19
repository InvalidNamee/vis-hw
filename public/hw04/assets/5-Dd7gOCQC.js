import{D as e,H as t,O as n,X as r,o as i,r as a}from"./src-Be-g8xjc.js";import{t as o}from"./colors-BTWGRfAr.js";var s=async function(s){let c=Array.from({length:20},(e,t)=>({x:t,y:Math.sin(t/3)*5+t*.5+t%3}));s.innerHTML=`
    <h4> 科研经典配色横评</h4>
    <p class="demo-hint">6 大经典科研配色：Wong 2011（Nature 推荐）/ Paul Tol / Okabe-Ito / Tableau / Paired / Viridis。每种都 CVD 友好，<strong>其中 Wong / Okabe-Ito / Paul Tol 是 Nature/Science/Cell 实际在用的</strong>。</p>

    <div class="palette-matrix" id="palettes"></div>

    <h4 style="margin-top:14px"> 同样数据 + 不同配色（看哪个"耐看"）</h4>
    <div class="demo-control" id="pal-tabs"></div>
    <svg data-export-chart="" class="heatmap-svg" id="pal-svg" width="720" height="240"></svg>
    <div id="pal-note"></div>
  `;let l=s.querySelector(`#palettes`),u={"Wong 2011":`Nature Methods 2011 - 8 色 CVD 友好`,"Paul Tol bright":`SRON Tech Note 2021 - 7 色白底`,"Paul Tol muted":`SRON Tech Note 2021 - 8 色深底`,"Okabe-Ito":`Okabe & Ito 2002 - 8 色 CVD 友好`,"Tableau 10":`Tableau 10 - 10 色通用`,"Paired (12)":`ColorBrewer 12 - 12 色配对`,"Viridis (seq)":`Smith et al. 2017 - 顺序型`,"Cividis (seq)":`Nuñez et al. 2018 - 顺序型 CVD`,"RdBu (div)":`ColorBrewer - 发散型红蓝`};Object.entries(o).forEach(([e,t])=>{let n=document.createElement(`div`);n.className=`palette-name`,n.textContent=e,l.appendChild(n);let r=document.createElement(`div`);r.className=`palette-strip`,t.forEach(e=>{let t=document.createElement(`div`);t.style.background=e,r.appendChild(t)}),l.appendChild(r);let i=document.createElement(`div`);i.className=`palette-source`,i.textContent=u[e]||``,l.appendChild(i)});let d=s.querySelector(`#pal-tabs`),f=t(s.querySelector(`#pal-svg`)),p=s.querySelector(`#pal-note`);function m(t){f.selectAll(`*`).remove();let s=o[t],l=s.length,u={t:30,r:20,b:30,l:30},d=720-u.l-u.r,m=240-u.t-u.b,h=n().domain(r(l)).range([0,d]).padding(.2),g=e().domain([0,15]).range([m,0]);f.selectAll(`rect`).data(s).enter().append(`rect`).attr(`x`,(e,t)=>u.l+h(t)).attr(`y`,(e,t)=>u.t+g(t+1)).attr(`width`,h.bandwidth()).attr(`height`,(e,t)=>m-g(t+1)).attr(`fill`,e=>e).attr(`opacity`,.9);let _=i().x((e,t)=>u.l+h(t)+h.bandwidth()/2).y(e=>u.t+g(e.y)).curve(a);c.forEach((e,t)=>{if(t>=l)return;let n=c.slice(0,l);f.append(`path`).datum(n).attr(`d`,_).attr(`fill`,`none`).attr(`stroke`,s[t%l]).attr(`stroke-width`,2.5).attr(`opacity`,.6)}),f.append(`text`).attr(`x`,u.l).attr(`y`,u.t-8).attr(`font-size`,12).attr(`font-weight`,600).attr(`fill`,`#1e293b`).text(t),p.innerHTML=`
      <h4> 关键点</h4>
      <ul>
        <li><strong>Wong / Okabe-Ito / Paul Tol</strong>：3 大科研配色黄金标准，色盲友好 + 灰度打印友好</li>
        <li><strong>Tableau 10</strong>：商业图表之王，适合 5-7 类，但红绿对色盲不友好</li>
        <li><strong>Paired (12)</strong>：配对设计（如处理前/后），但 12 色过载眼睛</li>
        <li><strong>顺序型 colormap</strong>（Viridis / Cividis）：仅用于连续数值，不能用于离散类别</li>
        <li>一般原则：<strong>类别数 ≤ 7</strong>，否则用连续 colormap 替代</li>
      </ul>
    `}Object.keys(o).forEach((e,t)=>{let n=document.createElement(`label`);n.textContent=e,t===0&&n.classList.add(`active`),n.addEventListener(`click`,()=>{d.querySelectorAll(`label`).forEach(e=>e.classList.remove(`active`)),n.classList.add(`active`),m(e)}),d.appendChild(n)}),m(`Wong 2011`)};export{s as default};