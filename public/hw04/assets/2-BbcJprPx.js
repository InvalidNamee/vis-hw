import{D as e,E as t,H as n,N as r,T as i,U as a,W as o,tt as s}from"./src-Be-g8xjc.js";var c=async function(c,l){let u=(await l.csv(`./data/crime.csv`,r)).map(e=>({state:e.state,x:e.murder,y:e.robbery})),d={t:30,r:20,b:40,l:50},f=720-d.l-d.r,p=360-d.t-d.b,m=e().domain([0,s(u,e=>e.x)]).range([0,f]),h=e().domain([0,s(u,e=>e.y)]).range([p,0]),g=e().domain([0,f]).range([d.l,d.l+f]),_=e().domain([p,0]).range([d.t+p,d.t]);c.innerHTML=`<h4> 三层坐标变换</h4>
    <p class="demo-hint">数据空间 → 坐标系空间 → 屏幕空间。每一层职责不同，错位就会出问题。</p>
    <div class="demo-control">
      <label><input type="radio" name="xscale" value="linear" checked> x: linear</label>
      <label><input type="radio" name="xscale" value="log"> x: log</label>
      <label><input type="radio" name="xscale" value="sqrt"> x: sqrt</label>
    </div>
    <svg data-export-chart="" class="heatmap-svg" width="720" height="360" id="scatter"></svg>
    <div id="code-trace"></div>
  `;let v=n(c.querySelector(`#scatter`)),y=`linear`;function b(){let e;e=y===`log`?t().domain([1,s(u,e=>e.x)]).range([0,f]):y===`sqrt`?i().domain([0,s(u,e=>e.x)]).range([0,f]):m,v.selectAll(`*`).remove(),v.append(`g`).selectAll(`line`).data(e.ticks(5)).enter().append(`line`).attr(`x1`,t=>g(e(t))).attr(`x2`,t=>g(e(t))).attr(`y1`,d.t).attr(`y2`,d.t+p).attr(`stroke`,`#e2e8f0`);let n=a(e).ticks(5);v.append(`g`).attr(`transform`,`translate(${d.l},${d.t+p})`).call(n),v.append(`g`).attr(`transform`,`translate(${d.l},${d.t})`).call(o().scale(h)),v.selectAll(`circle`).data(u).enter().append(`circle`).attr(`cx`,t=>g(e(t.x))).attr(`cy`,e=>_(h(e.y))).attr(`r`,4).attr(`fill`,`#6366f1`).attr(`opacity`,.7),v.append(`text`).attr(`x`,d.l+f/2).attr(`y`,d.t+p+32).attr(`text-anchor`,`middle`).style(`font-size`,`12px`).text(`Murder rate →`),v.append(`text`).attr(`transform`,`translate(${d.l-36},${d.t+p/2}) rotate(-90)`).attr(`text-anchor`,`middle`).style(`font-size`,`12px`).text(`Robbery rate →`)}c.querySelectorAll(`input[name=xscale]`).forEach(e=>{e.addEventListener(`change`,e=>{y=e.target.value,b()})}),c.querySelector(`#code-trace`).innerHTML=`
    <h4 style="margin-top:14px"> 关键代码：三层映射</h4>
    <pre><code class="lang-js">// 数据空间：值域 → 坐标系（0..innerW）
const xData = d3.scaleLinear().domain([0, maxX]).range([0, innerW]);
// 坐标系空间 → 屏幕空间（加 margin 偏移）
const xScreen = d3.scaleLinear().domain([0, innerW]).range([M.l, M.l + innerW]);
// 渲染
.attr('cx', d => xScreen(xData(d.x)))</code></pre>
  `,b()};export{c as default};