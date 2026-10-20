import{C as e,H as t,b as n,f as r,g as i,t as a,v as o,w as s,x as c}from"./src-Bqv1NRT4.js";import{t as l}from"./weather-CgB47a-N.js";var u=async function(u,d){let f=await d.csv(`./data/weather_2024.csv`,l),p=new Map(f.map(e=>[e.date,e.temp_max])),m=new Date(2024,0,1),h=new Date(2025,0,1),g=s.range(m,h).map(e=>({date:e,value:p.get(o(`%Y-%m-%d`)(e))??0})),_=i(r).domain([30,-5]),v={t:30,l:30};function y(t){return e.count(n.floor(t),t)}function b(e){return e.getDay()}function x(e){return e.getDay()!==0&&e.getMonth()>0&&e.getDate()===1}function S(e){let t=s.offset(e,-7);return e.getFullYear()!==t.getFullYear()||e.getMonth()!==t.getMonth()}u.innerHTML=`
    <h4> 2024 年北京每日最高温（van Wijk 日历热图）</h4>
    <p class="demo-hint">x = 周（年内的第几周），y = 星期几，色 = 最高温（蓝=冷 / 红=热）。鼠标 hover 看具体数值。月份之间用红色分隔线。</p>
    <div class="ms-threshold-control">
      <label>colormap：</label>
      <select id="cmap">
        <option value="RdYlBu" selected>RdYlBu（红黄蓝）</option>
        <option value="Viridis">Viridis（顺序型）</option>
        <option value="Cividis">Cividis（顺序型 CVD）</option>
      </select>
    </div>
    <svg data-export-chart="" class="cal-svg" width="920" height="220" id="cal"></svg>
    <div id="cal-legend"></div>
  `;let C=t(u.querySelector(`#cal`)),w=u.querySelector(`#cmap`),T=u.querySelector(`#cal-legend`),E;function D(){C.selectAll(`*`).remove();let e=a[`interpolate`+w.value];_.interpolator(e),E=C.append(`g`).attr(`transform`,`translate(${v.l},${v.t})`),E.selectAll(`rect.cell`).data(g).join(`rect`).attr(`class`,`cell`).attr(`width`,16).attr(`height`,16).attr(`x`,e=>y(e.date)*16).attr(`y`,e=>b(e.date)*16).attr(`rx`,1.5).attr(`ry`,1.5).attr(`fill`,e=>_(e.value)).on(`mouseover`,function(e,n){t(this).attr(`stroke`,`#1e293b`).attr(`stroke-width`,1.5),O(e,`${o(`%Y-%m-%d`)(n.date)} ${n.value.toFixed(1)}°C`)}).on(`mouseout`,function(){t(this).attr(`stroke`,null),k()}),E.selectAll(`line.month-boundary`).data(g.filter(e=>x(e.date))).join(`line`).attr(`class`,`month-boundary`).attr(`x1`,e=>y(e.date)*16).attr(`x2`,e=>y(e.date)*16+16).attr(`y1`,e=>b(e.date)*16).attr(`y2`,e=>b(e.date)*16).attr(`stroke`,`#dc2626`).attr(`stroke-width`,1.5),E.selectAll(`line.month-divider`).data(g.filter(e=>S(e.date))).join(`line`).attr(`class`,`month-divider`).attr(`x1`,e=>y(e.date)*16).attr(`x2`,e=>y(e.date)*16).attr(`y1`,e=>b(e.date)*16).attr(`y2`,e=>b(e.date)*16+16).attr(`stroke`,`#dc2626`).attr(`stroke-width`,1.5);let n=c.range(m,h);E.selectAll(`text.month-label`).data(n).join(`text`).attr(`class`,`month-label`).attr(`x`,e=>y(e)*16+2).attr(`y`,-8).style(`font-size`,`10px`).style(`fill`,`#475569`).text(e=>o(`%b`)(e)),E.selectAll(`text.day-label`).data([`日`,`一`,`二`,`三`,`四`,`五`,`六`]).join(`text`).attr(`class`,`day-label`).attr(`x`,-4).attr(`y`,(e,t)=>t*16+16-4).attr(`text-anchor`,`end`).style(`font-size`,`9px`).style(`fill`,`#64748b`).text(e=>e),T.innerHTML=`
      <div class="cal-legend-bar">
        <span class="legend-low">-5°C</span>
        <div class="legend-strip" id="legend-strip"></div>
        <span class="legend-high">30°C</span>
      </div>
    `;let r=u.querySelector(`#legend-strip`);for(let e=0;e<=30;e++){let t=-5+e/30*35,n=document.createElement(`div`);n.style.background=_(t),r.appendChild(n)}}function O(e,t){let n=u.querySelector(`.ts-tip`);n||(n=document.createElement(`div`),n.className=`ts-tip`,n.style.cssText=`position:fixed;background:#1e293b;color:white;padding:4px 8px;border-radius:3px;font-size:11px;pointer-events:none;z-index:1000;`,u.appendChild(n)),n.textContent=t,n.style.left=e.clientX+10+`px`,n.style.top=e.clientY-24+`px`}function k(){let e=u.querySelector(`.ts-tip`);e&&e.remove()}w.addEventListener(`change`,D),D()};export{u as default};