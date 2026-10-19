var e=async function(e){let t=[{key:`ordered`,name:`有序性`,icon:``,color:`#3b82f6`,desc:`时间是有序的。两个事件发生的时间有先后次序，与因果关系紧密相连。`,example:`火车时刻表、事件日志（log）、git commit history`},{key:`continuous`,name:`连续性`,icon:`∞`,color:`#10b981`,desc:`时间是连续的。两个时间点之间总存在另一个时间点。`,example:`实时传感器数据（温度、心率）、流式数据流`},{key:`periodic`,name:`周期性`,icon:``,color:`#f59e0b`,desc:`许多自然过程有循环规律（季节、昼夜）。可采用循环时间域表示。`,example:`24h 体温、12 个月气温、年周期销售`},{key:`spatial_independent`,name:`独立于空间`,icon:``,color:`#8b5cf6`,desc:`时间与空间紧相关，但科学过程大多将它们独立处理。`,example:`折线图 x 轴只用时间、y 轴只用度量；时序不混用空间`},{key:`structured`,name:`结构性`,icon:``,color:`#ec4899`,desc:`时间尺度分年/月/日/时/分/秒，分割既有自然反映（昼夜）也有人为定义。`,example:`日历/周排列、闰年调整、工作日 vs 周末`}];e.innerHTML=`
    <h4> 时间的 5 个核心属性</h4>
    <p class="demo-hint">点每张卡片 → 显示详细解释 + 影响哪些可视化设计。设计时序图前先确认这 5 个属性。</p>
    <div class="attr-grid" id="attr-grid"></div>
    <div class="attr-detail" id="attr-detail" style="margin-top:14px;">
      <p style="color:#94a3b8;font-size:13px;">↑ 点卡片查看详情</p>
    </div>
  `;let n=e.querySelector(`#attr-grid`),r=e.querySelector(`#attr-detail`);function i(e){r.innerHTML=`
      <div class="attr-detail-card" style="border-left:4px solid ${e.color};">
        <h4>${e.icon} ${e.name} <small style="font-size:11px;color:#94a3b8;font-weight:400">key: ${e.key}</small></h4>
        <p style="margin:6px 0 10px;color:#334155;line-height:1.7;">${e.desc}</p>
        <div class="example">
          <strong>实际例子：</strong> ${e.example}
        </div>
        <div class="visual-hint" style="margin-top:8px;font-size:12px;color:#64748b;">
          <strong>影响可视化：</strong>
          ${e.key===`ordered`?`线图、散点图按时间排序，乱序会导致语义错误`:e.key===`continuous`?`线图 vs 柱图的选用——连续数据用线，离散事件用柱/点`:e.key===`periodic`?`螺旋图 / polar / 日历热图能更好表达周期性`:e.key===`spatial_independent`?`避免在时序图中混用空间编码（颜色映射空间）`:`日历/工作日/闰年等特殊时间尺度要在数据预处理时正确处理`}
        </div>
      </div>
    `}t.forEach(e=>{let t=document.createElement(`div`);t.className=`attr-card`,t.style.borderTop=`4px solid ${e.color}`,t.innerHTML=`
      <div class="attr-icon" style="color:${e.color}">${e.icon}</div>
      <div class="attr-name">${e.name}</div>
      <div class="attr-key">key: ${e.key}</div>
    `,t.addEventListener(`click`,()=>i(e)),n.appendChild(t)})};export{e as default};