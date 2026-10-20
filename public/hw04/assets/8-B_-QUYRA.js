import{X as e,c as t,z as n}from"./src-Bqv1NRT4.js";import{i as r,n as i,t as a}from"./colors-BTWGRfAr.js";var o=async function(o){o.innerHTML=`
    <h4> CVD 论文图测：你的图在色盲眼里还看得懂吗？</h4>
    <p class="demo-hint">下面 3 张"经典论文图"，模拟在 3 种视觉下的呈现。第一张常出现在 Nature Methods，第二张是顺序型热图，第三张是红绿对比。</p>
    <div class="cvd-paper" id="papers"></div>
    <div id="cvd-paper-note"></div>
  `;let s=o.querySelector(`#papers`);function c(t){let n=``;return e(40).forEach(e=>{let r=e%5,i=20+e*7%180,a=15+e*11%80;n+=`<circle cx="${i}" cy="${a}" r="5" fill="${t[r]}" opacity="0.85" />`}),`<svg data-export-chart="" width="220" height="110" style="background:#fff;border:1px solid #e2e8f0;">${n}</svg>`}function l(e){let t=``;for(let n=0;n<5;n++)for(let r=0;r<14;r++){let i=(n*14+r)/70;t+=`<rect x="${r*16}" y="${n*22}" width="16" height="22" fill="${e(i)}" />`}return`<svg data-export-chart="" width="220" height="110" style="background:#fff;border:1px solid #e2e8f0;">${t}</svg>`}function u(){let t=[`#dc2626`,`#16a34a`,`#dc2626`,`#16a34a`,`#dc2626`],n=``;return e(5).forEach(e=>{n+=`<rect x="${20+e*36}" y="${20+e%2*5}" width="30" height="${70-e*5}" fill="${t[e]}" />`}),`<svg data-export-chart="" width="220" height="110" style="background:#fff;border:1px solid #e2e8f0;">${n}</svg>`}function d(e,t){let a=new DOMParser().parseFromString(e,`image/svg+xml`);return a.querySelectorAll(`[fill]`).forEach(e=>{let a=n(e.getAttribute(`fill`));if(!a)return;let o=[Math.round(a.rgb().r),Math.round(a.rgb().g),Math.round(a.rgb().b)],s=r(o,t);e.setAttribute(`fill`,i(s))}),new XMLSerializer().serializeToString(a)}[{name:` 论文图 1：5 类别散点（Wong 配色）`,makeSvg:()=>c(a[`Wong 2011`])},{name:` 论文图 2：顺序型热图（Viridis）`,makeSvg:()=>l(t)},{name:` 论文图 3：红绿对比（错误案例）`,makeSvg:()=>u()}].forEach(e=>{let t=document.createElement(`div`);t.className=`cvd-paper-card`;let n=e.makeSvg(),r=d(n,`deuteranopia`),i=d(n,`protanopia`);t.innerHTML=`
      <h5>${e.name}</h5>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:9px;">
        <div><div style="color:#94a3b8;margin-bottom:2px">正常</div>${n}</div>
        <div><div style="color:#94a3b8;margin-bottom:2px">红盲</div>${i}</div>
        <div><div style="color:#94a3b8;margin-bottom:2px">绿盲</div>${r}</div>
      </div>
    `,s.appendChild(t)}),o.querySelector(`#cvd-paper-note`).innerHTML=`
    <h4> 关键点</h4>
    <ul>
      <li><strong>图 1（Wong）</strong>：5 类别散点在 CVD 眼中仍可分辨。 推荐</li>
      <li><strong>图 2（Viridis）</strong>：顺序型热图在 CVD 眼中亮度单调性保持。 推荐</li>
      <li><strong>图 3（红绿）</strong>：在绿盲眼里：红和绿几乎变成同色：（看 prota/deuta 列）。 禁用</li>
      <li><strong>实测流程</strong>：把图导出 PNG → 用 <a href="https://www.color-blindness.com/coblis-color-blindness-simulator/" target="_blank">Coblis</a> 模拟 → 看是否仍能区分</li>
      <li><strong>Wong 2011</strong> 是 Nature Methods 8:441 推荐，几乎所有顶标都改用 CVD 友好配色了</li>
    </ul>
  `};export{o as default};