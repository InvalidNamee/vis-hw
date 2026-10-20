import{L as e,l as t,u as n}from"./src-Bqv1NRT4.js";import{t as r}from"./colors-BTWGRfAr.js";var i=async function(i){let a=[{name:`A：彩虹谱 Jet`,type:`wrong`,reason:`Jet 非感知均匀 + CVD 不友好 + 打印不友好`,palette:n},{name:`B：红绿对比`,type:`wrong`,reason:`红绿对红绿色盲完全不可分辨（约 6% 男性）`,palette:t=>e(`#dc2626`,`#16a34a`)(t)},{name:`C：颜色过多 12 色`,type:`wrong`,reason:`类别超过 7 种时，眼睛无法区分；应合并或用连续 colormap`,palette:e=>t(e)},{name:`D：Wong 8 色（对）`,type:`correct`,reason:`Wong 2011 配色：CVD 友好 + 灰度打印友好 + 类别数 ≤ 8`,palette:e=>r[`Wong 2011`][Math.floor(e*7.99)]}];i.innerHTML=`
    <h4> 对错案例对比（4 张图，请你投票）</h4>
    <p class="demo-hint">同样 8 类数据，用 4 种配色方案。点击你认为"对"的那张。</p>
    <div class="quiz-grid" id="quiz"></div>
    <div id="quiz-result"></div>
  `;let o=i.querySelector(`#quiz`),s=i.querySelector(`#quiz-result`);function c(e){let t=Array.from({length:8},(e,t)=>2+(t*1.3+.5)%5+Math.sin(t)*1.2),n=``;return t.forEach((t,r)=>{let i=e(r/7);n+=`<rect x="${8+r*23}" y="${92-t*14}" width="21" height="${t*14}" fill="${i}" />`}),`<svg data-export-chart="" width="200" height="100" style="background:#fafafa;border:1px solid #e2e8f0;">${n}</svg>`}a.forEach((e,t)=>{let n=document.createElement(`div`);n.className=`quiz-card`,n.innerHTML=`
      <h5 style="margin:0 0 6px;font-size:12px;color:#475569">${e.name}</h5>
      ${c(e.palette)}
      <div class="quiz-card-label">点我投票</div>
    `,n.addEventListener(`click`,()=>{l.forEach((n,r)=>{n.classList.remove(`correct`,`wrong`),r===t?n.classList.add(e.type):e.type===`correct`&&n.classList.add(`wrong`)}),s.innerHTML=`
        <div class="quiz-result">
          <strong>答案：${e.name}</strong> ${e.type===`correct`?` 正确`:` 错`}<br>
          <span style="font-size:12px;">${e.reason}</span>
        </div>
      `}),o.appendChild(n)});let l=o.querySelectorAll(`.quiz-card`)};export{i as default};