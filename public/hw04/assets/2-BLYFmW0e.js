import{c as e,g as t,k as n,m as r,p as i}from"./src-Be-g8xjc.js";var a=async function(a){let o=[0,2,4,7,9,12,15,18,21,24,28,32,35,38,41,45,48,51,55,58,62,66,70,74,78,82,86,90,94,98,102,106,110,114,115,122,126,130,135,140,145,150,160,170,180,200,220,240,280,350],s=t(e).domain([0,350]),c=i;a.innerHTML=`
    <h4> colormap 三类选择</h4>
    <p class="demo-hint">三类 colormap 对应不同数据语义。选错类型 = 误导读者。</p>

    <h4 style="margin-top:14px"> 三类速记</h4>
    <table class="decision-table">
      <thead><tr><th>类型</th><th>适用</th><th>例子</th><th>CVD 友好</th></tr></thead>
      <tbody>
        <tr><td><strong>顺序型</strong></td><td>有序数值（人口、温度）</td>
            <td><div class="colormap-strip" id="strip-seq"></div>Viridis</td><td>✓ 优</td></tr>
        <tr><td><strong>发散型</strong></td><td>偏离中位数（±%、Z 分数）</td>
            <td><div class="colormap-strip" id="strip-div"></div>RdBu</td><td>△ 中</td></tr>
        <tr><td><strong>定性型</strong></td><td>无序类别（产品、性别）</td>
            <td><div class="colormap-strip" id="strip-cat"></div>Tableau10</td><td>△ 与色相相关</td></tr>
      </tbody>
    </table>

    <h4 style="margin-top:14px"> 50 州谋杀率（顺序型 Viridis 演示）</h4>
    <div id="seq-bar"></div>

    <h4 style="margin-top:14px"> 错误示例：发散型 RdBu 画有序数据</h4>
    <p class="demo-hint" style="color:#dc2626">用 RdBu（发散型）画"50 州谋杀率"会让"中段 100 附近的州看上去"接近白色"——但 100 没有任何语义意义，纯属误导。</p>
    <div id="div-bar"></div>
  `;function l(e,t,n=16){let r=a.querySelector(`#`+e);r.innerHTML=``;for(let e=0;e<n;e++){let i=document.createElement(`div`);i.style.background=t(e/(n-1)),r.appendChild(i)}}l(`strip-seq`,t(e)),l(`strip-div`,i),l(`strip-cat`,n(r));function u(e,t){let n=a.querySelector(`#`+e);n.innerHTML=``,o.forEach(e=>{let r=document.createElement(`div`);r.style.cssText=`display:inline-block;width:14px;height:50px;background:${t(typeof t==`function`?e/350:1-e/350)};`,n.appendChild(r)})}u(`seq-bar`,s),u(`div-bar`,c)};export{a as default};