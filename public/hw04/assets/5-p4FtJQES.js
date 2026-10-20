import{H as e,c as t,et as n,g as r,tt as i}from"./src-Bqv1NRT4.js";var a=async function(a){function o(e,t){return Math.exp(-((e-3.5)**2+(t-4)**2)/6)+.3*Math.exp(-((e-1)**2+(t-6)**2)/3)}let s=[];for(let e=0;e<8;e++){s.push([]);for(let t=0;t<8;t++)s[e].push(o(t,e))}let c=.5,l=[[],[[3,0]],[[0,1]],[[3,1]],[[1,2]],[[3,0],[1,2]],[[0,2]],[[3,2]],[[2,3]],[[2,0]],[[0,1],[2,3]],[[2,1]],[[1,3]],[[1,0]],[[0,3]],[]];a.innerHTML=`
    <h4> Marching Squares 等值线</h4>
    <p class="demo-hint">标量场被离散化为网格后，给定阈值，追踪 <strong>值=阈值</strong> 的曲线。拖滑块改变阈值。</p>
    <div class="ms-threshold-control">
      <label>阈值：</label>
      <input type="range" id="th" min="0.05" max="0.95" step="0.05" value="0.5">
      <span class="slope-readout" id="th-readout">0.50</span>
    </div>
    <svg data-export-chart="" class="ms-svg" width="720" height="460" id="ms-svg"></svg>
    <div id="ms-expl"></div>
  `;let u=e(a.querySelector(`#ms-svg`)),d=a.querySelector(`#th`),f=a.querySelector(`#th-readout`),p=a.querySelector(`#ms-expl`);function m(){c=+d.value,f.textContent=c.toFixed(2),u.selectAll(`*`).remove();let e=i(s.flat()),a=n(s.flat()),o=r(t).domain([a,e]);for(let e=0;e<8;e++)for(let t=0;t<8;t++){let n=30+t*40,r=30+e*40;u.append(`rect`).attr(`x`,n).attr(`y`,r).attr(`width`,40).attr(`height`,40).attr(`fill`,o(s[e][t])).attr(`stroke`,`#cbd5e1`).attr(`stroke-width`,.5)}for(let e=0;e<7;e++)for(let t=0;t<7;t++){let n=s[e][t],r=s[e][t+1],i=s[e+1][t],a=s[e+1][t+1],o=0;i>c&&(o|=1),a>c&&(o|=2),r>c&&(o|=4),n>c&&(o|=8);let d=l[o],f=30+t*40,p=30+e*40,m=[[f,p+20],[f+20,p+40],[f+40,p+20],[f+20,p]];d.forEach(([e,t])=>{u.append(`line`).attr(`x1`,m[e][0]).attr(`y1`,m[e][1]).attr(`x2`,m[t][0]).attr(`y2`,m[t][1]).attr(`class`,`ms-contour`)})}p.innerHTML=`
      <h4> 关键点</h4>
      <ul>
        <li><strong>16 种 case</strong>：每个 cell 4 个角的"是否大于阈值"决定 case 编号 0-15</li>
        <li>每种 case 对应 0/1/2 条线段，把"超过阈值"和"未超过阈值"的两片区域分开</li>
        <li>扩展到 3D 叫 Marching Cubes（128 种 case）</li>
        <li>应用：地形等高线、医学 MRI 等值面、密度等高图</li>
      </ul>
    `}d.addEventListener(`input`,m),m()};export{a as default};