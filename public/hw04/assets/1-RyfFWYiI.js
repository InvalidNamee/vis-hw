import{N as e}from"./src-Bqv1NRT4.js";var t=async function(t,n){t.innerHTML=`
    <h4> 数据转换：长格式 vs 宽格式</h4>
    <p class="demo-hint">crime.csv 是宽格式（每个州一行，每个指标一列）。可视化和 d3 操作通常需要长格式（每行一个观测）。</p>
    <div id="data-shape"></div>
    <h4 style="margin-top:16px"> 转换代码</h4>
    <pre><code class="lang-js">//  d3.csv 第二参做类型转换
const raw = await d3.csv('./data/crime.csv', d3.autoType);
console.log(raw[0]);  // {state: 'Alabama', population: 3979000, ...}

// 宽格式 → 长格式：每行一个 (州, 指标, 值)
const long = raw.flatMap(d =>
  ['murder','robbery','burglary'].map(key => ({
    state: d.state, metric: key, value: d[key]
  }))
);</code></pre>
    <div id="data-preview"></div>
  `;let r=await n.csv(`./data/crime.csv`,e),i=t.querySelector(`#data-shape`);if(!i)return;i.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:8px 0;">
      <div>
        <h5 style="margin:0 0 6px;color:#4338ca">宽格式（CSV 原样）</h5>
        <pre style="font-size:11px;background:#f8fafc;color:#1e293b;padding:8px;border-radius:4px;overflow:auto;max-height:180px;">
${r.slice(0,3).map(e=>JSON.stringify(e,null,0)).join(`
`)}
...
共 ${r.length} 行 × ${Object.keys(r[0]).length} 列</pre>
      </div>
      <div>
        <h5 style="margin:0 0 6px;color:#4338ca">长格式（转换后）</h5>
        <pre style="font-size:11px;background:#f8fafc;color:#1e293b;padding:8px;border-radius:4px;overflow:auto;max-height:180px;">
${r.slice(0,3).flatMap(e=>[`murder`,`robbery`,`burglary`].map(t=>JSON.stringify({state:e.state,metric:t,value:e[t]}))).slice(0,9).join(`
`)}
...
共 ${r.length*3} 行 × 3 列</pre>
      </div>
    </div>
  `;let a=t.querySelector(`#data-preview`);a.innerHTML=`
    <h4 style="margin-top:12px"> 前 10 行预览</h4>
    <table class="decision-table" style="font-size:11px;">
      <thead><tr><th>州</th><th>人口</th><th>谋杀</th><th>抢劫</th><th>盗窃</th></tr></thead>
      <tbody>
        ${r.slice(0,10).map(e=>`<tr><td>${e.state}</td><td>${e.population.toLocaleString()}</td><td>${e.murder}</td><td>${e.robbery.toLocaleString()}</td><td>${e.burglary.toLocaleString()}</td></tr>`).join(``)}
      </tbody>
    </table>
  `};export{t as default};