import{n as e}from"./colors-BTWGRfAr.js";var t=async function(t){let n=[{name:`单色 Monochromatic`,offset:0,desc:`同一色相不同亮度/饱和`},{name:`类比 Analogous`,offset:30,desc:`色轮相邻 ±30°`},{name:`互补 Complementary`,offset:180,desc:`色轮正对面 180°`},{name:`三等分 Triadic`,offset:120,desc:`色轮 120° 等分`},{name:`分裂互补 Split`,offset:150,desc:`互补色相邻 150°`}],r=210;t.innerHTML=`
    <h4> 色系搭配规则（5 大类）</h4>
    <p class="demo-hint">选主色 → 5 张配色方案同时生成。每张色板用一张"假论文插图"展示。</p>
    <div class="ms-threshold-control">
      <label>主色 H：</label>
      <input type="range" id="baseH" min="0" max="360" value="210">
      <span class="slope-readout" id="baseHReadout">210°</span>
    </div>
    <div class="harmony-grid" id="harmony"></div>
    <div id="harmony-note"></div>
  `;let i=t.querySelector(`#harmony`),a=t.querySelector(`#baseH`),o=t.querySelector(`#baseHReadout`),s=t.querySelector(`#harmony-note`);function c(e,t,n){t/=100,n/=100;let r=t=>(t+e/30)%12,i=t*Math.min(n,1-n),a=e=>n-i*Math.max(-1,Math.min(r(e)-3,Math.min(9-r(e),1)));return[Math.round(a(0)*255),Math.round(a(8)*255),Math.round(a(4)*255)]}function l(t,n){let r=[];for(let i=-2;i<=2;i++){let a=(t+i*n+360)%360;r.push(e(c(a,60,55)))}return r}function u(e){return`<svg data-export-chart="" width="200" height="80">
      ${[10,30,50,70,90,110,130,150,170,190].map((t,n)=>`<rect x="${t-8}" y="${70-n*7%60}" width="14" height="${n*7%60+5}" fill="${e[n%e.length]}" />`).join(``)}
    </svg>`}function d(){r=+a.value,o.textContent=r+`°`,i.innerHTML=``,n.forEach((e,t)=>{let n=l(r,e.offset),a=document.createElement(`div`);a.className=`harmony-card`,a.innerHTML=`
        <h5>${e.name}</h5>
        <div class="harmony-swatch">
          ${n.map(e=>`<div style="background:${e}"></div>`).join(``)}
        </div>
        <p>${e.desc}</p>
        <div class="harmony-preview" style="background:${n[2]}">假论文图</div>
        <div style="margin-top:4px">${u(n,t)}</div>
      `,i.appendChild(a)}),s.innerHTML=`
      <h4> 关键点</h4>
      <ul>
        <li><strong>单色</strong>：最安全、最不刺眼。适合"严肃"科研图（如 Nature 黑白经济型配色）</li>
        <li><strong>类比</strong>：和谐但缺少对比度。适合"层级"或"分组"少的情况</li>
        <li><strong>互补</strong>：对比度强但易刺眼。适合"突出重点"（如对照实验组）</li>
        <li><strong>三等分</strong>：3 种类别时最常用（如 处理/对照/安慰剂）</li>
        <li><strong>分裂互补</strong>：互补的"温和版"——主色 1 + 强调 2（主对比但不刺眼）</li>
      </ul>
    `}a.addEventListener(`input`,d),d()};export{t as default};