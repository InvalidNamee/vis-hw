import{$ as e,rt as t}from"./src-Bqv1NRT4.js";var n=async(n,r)=>{let i=await r.students();n.innerHTML=`
    <div class="controls">
      <label>第 1 层分组：
        <select id="d-4-2-k1">
          <option value="gender" selected>gender 性别</option>
          <option value="major">major 专业</option>
          <option value="class">class 班级</option>
          <option value="hometown">hometown 籍贯</option>
        </select>
      </label>
      <label>第 2 层分组：
        <select id="d-4-2-k2">
          <option value="" selected>— 无（单层）—</option>
          <option value="gender">gender</option>
          <option value="major">major</option>
          <option value="class">class</option>
        </select>
      </label>
      <label>每组聚合：
        <select id="d-4-2-val">
          <option value="count" selected>count 计数</option>
          <option value="ages">ages 年龄列表</option>
          <option value="avgAge">avgAge 平均年龄</option>
        </select>
      </label>
    </div>
    <div class="console" id="d-4-2-out">计算中...</div>
    <p class="demo-legend">
      <span style="color:#a855f7">★</span> <strong>d3.rollup(data, reduceFn, key1, key2)</strong>：
      多层 key 时，外层为 key1、内层为 key2；reduceFn 把同组数据聚合为单一值。
    </p>
  `;let a=n.querySelector(`#d-4-2-k1`),o=n.querySelector(`#d-4-2-k2`),s=n.querySelector(`#d-4-2-val`),c=n.querySelector(`#d-4-2-out`);function l(){let n=a.value,r=o.value,l=s.value,d=t(i,l===`count`?e=>e.length:l===`avgAge`?t=>+e(t,e=>e.age).toFixed(2):e=>e.map(e=>e.age).join(`,`),e=>e[n],...r?[e=>e[r]]:[]);c.innerText=u(d,n)}function u(e,t){let n=[`d3.rollup 按「${t}」聚合的结果 →`];function r(e,t){if(e instanceof Map)for(let[i,a]of e)n.push(`  ${`  `.repeat(t)}├── "${i}"`),r(a,t+1);else n.push(`  ${`  `.repeat(t)}└── ${JSON.stringify(e)}`)}return r(e,1),n.join(`
`)}a.addEventListener(`change`,l),o.addEventListener(`change`,l),s.addEventListener(`change`,l),l()};export{n as default};