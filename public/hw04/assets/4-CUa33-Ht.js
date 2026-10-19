import{H as e}from"./src-Be-g8xjc.js";var t=async function(t){let n=45,r=e=>{let t=e*Math.PI/180;return[100,240,100+240*Math.cos(t),240-240*Math.sin(t)]};t.innerHTML=`
    <h4> 倾角感知（Cleveland 1984）</h4>
    <p class="demo-hint">人眼对斜率的感知 <strong>不是</strong> 线性。Cleveland 1984 实验：<strong>45° 倾角</strong> 是"看上去差距最小、最接近真实值"的角度。</p>
    <div class="slope-control">
      <label>角度：</label>
      <input type="range" id="angle" min="5" max="85" value="45">
      <span class="slope-readout" id="readout">45°</span>
    </div>
    <svg data-export-chart="" class="slope-svg" width="720" height="320" id="slope-svg"></svg>
    <div id="slope-expl"></div>
  `;let i=e(t.querySelector(`#slope-svg`)),a=t.querySelector(`#slope-expl`),o=t.querySelector(`#angle`),s=t.querySelector(`#readout`);function c(){n=+o.value,s.textContent=n+`°`,i.selectAll(`*`).remove();let[e,t,c,l]=r(45);i.append(`line`).attr(`x1`,e).attr(`y1`,t).attr(`x2`,c).attr(`y2`,l).attr(`stroke`,`#cbd5e1`).attr(`stroke-width`,1).attr(`stroke-dasharray`,`4 4`),i.append(`text`).attr(`x`,c+8).attr(`y`,l+4).attr(`font-size`,11).attr(`fill`,`#94a3b8`).text(`45° 参考`);let[u,d,f,p]=r(n);i.append(`line`).attr(`x1`,u).attr(`y1`,d).attr(`x2`,f).attr(`y2`,p).attr(`stroke`,`#6366f1`).attr(`stroke-width`,3),i.append(`circle`).attr(`cx`,u).attr(`cy`,d).attr(`r`,5).attr(`fill`,`#6366f1`),i.append(`circle`).attr(`cx`,f).attr(`cy`,p).attr(`r`,5).attr(`fill`,`#6366f1`),i.append(`text`).attr(`x`,u-10).attr(`y`,d+4).attr(`text-anchor`,`end`).attr(`font-size`,12).text(`起点`),i.append(`text`).attr(`x`,f+10).attr(`y`,p+4).attr(`font-size`,12).text(`终点`);let m=n*Math.PI/180,h=u+50*Math.cos(m/2),g=d-50*Math.sin(m/2);i.append(`text`).attr(`x`,h).attr(`y`,g).attr(`font-size`,12).attr(`fill`,`#4338ca`).attr(`font-weight`,600).text(n+`°`),a.innerHTML=`
      <h4> 关键点</h4>
      <ul>
        <li><strong>Stevens 幂律</strong>：斜率感知 ≈ (真实斜率)^1.0 ~ 1.3 区间</li>
        <li><strong>45°</strong> 是视觉"中点"：人眼对靠近 45° 的斜率估计最准</li>
        <li>设计图表时：让关键数据斜率落在 30°-60°，避免在 0° 或 90° 附近做趋势对比</li>
        <li>例：增长曲线若是指数增长，前期很缓、后期很陡，应换 log 轴让斜率落在 ~45°</li>
      </ul>
    `}o.addEventListener(`input`,c),c()};export{t as default};