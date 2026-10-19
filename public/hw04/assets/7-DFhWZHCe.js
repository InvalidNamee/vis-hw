var e=async function(e){let t=220,n=70,r=55;e.innerHTML=`
    <h4> 配色哲学：鲜艳 + 低饱和（耐看的设计）</h4>
    <p class="demo-hint">选主色 → 算法生成 5-7 色搭配：主色 + 2 类比色 + 1 互补强调 + 1 低饱和高亮。<br>
    <strong>用户原则</strong>：颜色数量 ≤ 7、鲜艳颜色（高 H 区分度）+ 低饱和度（S 30-50%）= <strong>好看又耐看</strong>。</p>
    <div class="philosophy-row">
      <div class="philosophy-inputs">
        <label>主色 H <input type="range" id="phH" min="0" max="360" value="220"></label>
        <label>主色 S <input type="range" id="phS" min="20" max="100" value="70"></label>
        <label>主色 L <input type="range" id="phL" min="30" max="80" value="55"></label>
        <p style="font-size:11px;color:#64748b;line-height:1.6;margin-top:10px">
          <strong>经验公式</strong>：<br>
          • 主色 S = 70-80%（鲜明）<br>
          • 配套色 S = 30-50%（低饱和，耐看）<br>
          • 强调色用互补或类比，<strong>不要全饱和</strong><br>
          • 高亮用 L=85-90%（如背景、注释）
        </p>
      </div>
      <div class="philosophy-output">
        <h5> 生成的 7 色板</h5>
        <div class="harmony-swatch" id="phPalette" style="height:48px;"></div>
        <h5 style="margin-top:12px"> 假论文插图（看效果）</h5>
        <div class="philosophy-paper" id="phPaper"></div>
      </div>
    </div>
  `;let i=e.querySelector(`#phH`),a=e.querySelector(`#phS`),o=e.querySelector(`#phL`),s=e.querySelector(`#phPalette`),c=e.querySelector(`#phPaper`);function l(e,t,n){t/=100,n/=100;let r=t=>(t+e/30)%12,i=t*Math.min(n,1-n),a=e=>n-i*Math.max(-1,Math.min(r(e)-3,Math.min(9-r(e),1)));return[Math.round(a(0)*255),Math.round(a(8)*255),Math.round(a(4)*255)]}function u(e,t,n){let[r,i,a]=l(e,t,n);return`#${r.toString(16).padStart(2,`0`)}${i.toString(16).padStart(2,`0`)}${a.toString(16).padStart(2,`0`)}`}function d(e,t,n){return[u((e-30+360)%360,t*.6,n*1.1),u((e-30+360)%360,t,n),u(e,t,n),u((e+30)%360,t,n),u((e+30)%360,t*.6,n*1.1),u((e+180)%360,t*.8,n*.95),u(e,t*.2,n*1.4)]}function f(e){return`
      <div class="philosophy-paper-card" style="background:${e[2]};color:#fff">
        <strong>实验组</strong><br>主色 HSL
      </div>
      <div class="philosophy-paper-card" style="background:${e[5]};color:#fff">
        <strong>对照组</strong><br>互补
      </div>
      <div class="philosophy-paper-card" style="background:${e[6]};color:#1e293b;border:1px solid #cbd5e1">
        <strong>注释层</strong><br>高亮低饱和
      </div>
    `}function p(){t=+i.value,n=+a.value,r=+o.value;let e=d(t,n,r);s.innerHTML=e.map(e=>`<div style="background:${e}"></div>`).join(``),c.innerHTML=f(e)}[i,a,o].forEach(e=>e.addEventListener(`input`,p)),p()};export{e as default};