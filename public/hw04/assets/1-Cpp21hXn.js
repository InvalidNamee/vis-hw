import{R as e,z as t}from"./src-Bqv1NRT4.js";import{i as n,n as r,r as i}from"./colors-BTWGRfAr.js";var a=async function(a){a.innerHTML=`
    <h4> 颜色模型基础</h4>
    <p class="demo-hint">拖动滑块改变颜色，下方 4 个色块同时显示四种颜色空间的呈现，CVD 模拟显示 3 种色盲眼中所见。</p>
    <div class="color-picker-row">
      <label>R <input type="range" id="cr" min="0" max="255" value="100"></label>
      <label>G <input type="range" id="cg" min="0" max="255" value="50"></label>
      <label>B <input type="range" id="cb" min="0" max="255" value="200"></label>
      <div id="rgb-preview" style="height:32px;border-radius:4px;background:rgb(100,50,200);"></div>
    </div>

    <div class="color-grid" id="color-grid"></div>

    <div class="color-space-cards">
      <div class="color-space-card">
        <h5>RGB · 加色模型</h5>
        <p>红绿蓝三色光按强度（0-255）混合。<strong>不感知均匀</strong>：(255,0,0) 与 (0,255,0) 在屏幕上看上去"亮度差很多"。</p>
      </div>
      <div class="color-space-card">
        <h5>HSL · 艺术家友好</h5>
        <p>色相(H)·饱和度(S)·亮度(L)。H 与 L 直观，但 <strong>也不是感知均匀</strong>：HSL=50 与 HSL=80 的"亮差"在 Lab 空间里不相等。</p>
      </div>
      <div class="color-space-card">
        <h5>CIE Lab · 感知均匀</h5>
        <p>由人眼对色彩的实验测量构造，<strong>距离 ≈ 感知差</strong>。设计 colormap 时常用（d3.interpolateLab 是 Lab 空间插值）。</p>
      </div>
      <div class="color-space-card">
        <h5>CMYK · 减色（印刷）</h5>
        <p>青·品红·黄·黑。屏幕显示用不到，但印刷/出版场景必须知道。<span class="note">Web 可视化默认 RGB。</span></p>
      </div>
    </div>

    <h4> CVD（色觉缺陷）模拟</h4>
    <p class="demo-hint">约有 8% 男性、0.5% 女性是色盲。下图把同一颜色在三种常见色盲眼中模拟呈现。</p>
    <div class="cvd-row" id="cvd-row"></div>
  `;let o=a.querySelector(`#color-grid`),s=a.querySelector(`#cvd-row`),c=a.querySelector(`#rgb-preview`),l=a.querySelector(`#cr`),u=a.querySelector(`#cg`),d=a.querySelector(`#cb`);function f(){let a=+l.value,f=+u.value,p=+d.value;c.style.background=r([a,f,p]);let m=i(a,f,p),h=t(r([a,f,p])),g=e(h),_=`L*${g.l.toFixed(0)} a*${g.a.toFixed(0)} b*${g.b.toFixed(0)}`,v=`H*${m[0].toFixed(0)}° S*${m[1].toFixed(0)}% L*${m[2].toFixed(0)}%`,y=a/255,b=f/255,x=p/255,S=1-Math.max(y,b,x),C={c:S===1?0:(1-y-S)/(1-S),m:S===1?0:(1-b-S)/(1-S),y:S===1?0:(1-x-S)/(1-S),k:S},w=`C*${(C.c*100).toFixed(0)} M*${(C.m*100).toFixed(0)} Y*${(C.y*100).toFixed(0)} K*${(C.k*100).toFixed(0)}`;o.innerHTML=`
      <div class="color-cell" style="background:${r([a,f,p])}">RGB<small>(${a}, ${f}, ${p})</small></div>
      <div class="color-cell" style="background:${r([a,f,p])}">HSL<small>${v}</small></div>
      <div class="color-cell" style="background:${r([a,f,p])}">Lab<small>${_}</small></div>
      <div class="color-cell" style="background:${r([a,f,p])}">CMYK<small>${w}</small></div>
    `;let T=n([a,f,p],`protanopia`),E=n([a,f,p],`deuteranopia`),D=n([a,f,p],`tritanopia`);s.innerHTML=`
      <div class="cvd-cell" style="background:${r([a,f,p])}">正常视觉</div>
      <div class="cvd-cell" style="background:${r(T)}">红色盲</div>
      <div class="cvd-cell" style="background:${r(E)}">绿色盲</div>
      <div class="cvd-cell" style="background:${r(D)}">蓝色盲</div>
    `}[l,u,d].forEach(e=>e.addEventListener(`input`,f)),f()};export{a as default};