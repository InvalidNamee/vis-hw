import{D as e,H as t,R as n}from"./src-Be-g8xjc.js";var r=async function(r){let i=60;r.innerHTML=`
    <h4> CIE Lab 色域图</h4>
    <p class="demo-hint">CIE Lab 是感知均匀的颜色空间。a* 横轴（红绿），b* 纵轴（黄蓝），L* 决定亮度。<br>
    三种 RGB 工作色域（sRGB / Adobe RGB / Rec.2020）嵌套在 Lab 空间里 —— 越大越能表示更广的颜色。</p>
    <div class="ms-threshold-control">
      <label>L* 亮度：</label>
      <input type="range" id="labL" min="20" max="90" value="60">
      <span class="slope-readout" id="labLReadout">60</span>
    </div>
    <svg data-export-chart="" class="lab-gamut-svg" width="600" height="420" id="lab-svg"></svg>
    <div id="lab-note"></div>
  `;let a=t(r.querySelector(`#lab-svg`)),o=r.querySelector(`#labL`),s=r.querySelector(`#labLReadout`),c=r.querySelector(`#lab-note`),l=e().domain([-128,128]).range([40,560]),u=e().domain([128,-128]).range([20,400]);function d(){i=+o.value,s.textContent=i,a.selectAll(`*`).remove();for(let e=-128;e<=128;e+=4)for(let t=-128;t<=128;t+=4){let r=n(i,e,t).rgb(),o=Math.max(0,Math.min(255,r.r)),s=Math.max(0,Math.min(255,r.g)),c=Math.max(0,Math.min(255,r.b));a.append(`rect`).attr(`x`,l(e)).attr(`y`,u(t)).attr(`width`,9.125).attr(`height`,6.9375).attr(`fill`,`rgb(${o},${s},${c})`).attr(`opacity`,.85)}a.append(`line`).attr(`x1`,40).attr(`x2`,560).attr(`y1`,210).attr(`y2`,210).attr(`stroke`,`#1e293b`).attr(`stroke-width`,1),a.append(`line`).attr(`x1`,300).attr(`x2`,300).attr(`y1`,20).attr(`y2`,400).attr(`stroke`,`#1e293b`).attr(`stroke-width`,1),a.append(`text`).attr(`x`,564).attr(`y`,204).attr(`font-size`,12).attr(`fill`,`#1e293b`).text(`a* = +128 红`),a.append(`text`).attr(`x`,44).attr(`y`,204).attr(`font-size`,12).attr(`fill`,`#1e293b`).text(`绿 a* = -128`),a.append(`text`).attr(`x`,306).attr(`y`,24).attr(`font-size`,12).attr(`fill`,`#1e293b`).text(`黄 b* = +128`),a.append(`text`).attr(`x`,306).attr(`y`,408).attr(`font-size`,12).attr(`fill`,`#1e293b`).text(`蓝 b* = -128`),c.innerHTML=`
      <h4> 关键点</h4>
      <ul>
        <li><strong>Lab 空间感知均匀</strong>：色域内任意两点距离 ≈ 人眼感知差</li>
        <li>实际显示色域是 sRGB（约三角内），超出色域的颜色会被 clamp 回 sRGB → 出现"失真"</li>
        <li>Adobe RGB 涵盖绿色更广（看印刷/摄影），Rec.2020 涵盖 4K 电视</li>
        <li>调整 L* 滑块：L* 越低，色域面积越小（暗色只能 saturate 有限）</li>
        <li><strong>实战意义</strong>：从 Lab→RGB 转换（d3.lab(...).rgb()）会让你设计 colormap 时自动处理感知线性</li>
      </ul>
    `}o.addEventListener(`input`,d),d()};export{r as default};