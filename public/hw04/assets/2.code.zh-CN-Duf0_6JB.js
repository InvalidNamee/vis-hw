var e=`### 关键代码

<strong>关键点 1：d3 三类 scale 速记</strong>

\`\`\`javascript
// 顺序型：[0, 1] → 颜色
d3.scaleSequential(d3.interpolateViridis);

// 发散型：[0, 1] → 颜色（带中点反转）
d3.interpolateRdBu;          // t=0 蓝，t=1 红，t=0.5 白
d3.interpolateBrBG;

// 定性型：离散类别 → 颜色
d3.scaleOrdinal(d3.schemeTableau10);
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">选错类型 = "撒谎"。比如用 Viridis 表示正负偏差，用户会以为"中点 = 白色"——但 Viridis 的中点是深紫色。</aside>

<strong>关键点 2：决策表</strong>

\`\`\`javascript
function pickColormap(data) {
  if (data.hasMeaningfulMidpoint) return 'diverging';
  if (data.isOrdered)              return 'sequential';
  return 'categorical';
}
\`\`\`
`;export{e as default};