var e=`### 关键代码

<strong>关键点 1：极坐标 → 笛卡尔坐标</strong>

\`\`\`javascript
//  阿基米德螺旋公式：r = a + bθ
const boxSize = 32;                  // 每环宽度
const coilGap = boxSize * 1.2;       // 螺旋间距
const b = coilGap / (2 * Math.PI);   // 半径增长系数
const startRadius = 100;
let theta = (startRadius - 0) / b;   // 起始角度

function pos(t) {                    // t: 角度（弧度）
  const r = 0 + b * t;
  return {
    x: r * Math.cos(t),              // 极坐标转笛卡尔
    y: r * Math.sin(t),
    r
  };
}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">极坐标 = (r, θ)，笛卡尔 = (x, y)，<strong>θ 每增 2π，r 增 b</strong>——这就形成"每转一圈外扩一格"的螺旋。如果 b=0，就是普通圆周。</aside>

<strong>关键点 2：动态角度增量</strong>

\`\`\`javascript
//  弧长近似相等：Δθ = boxSize / √(b² + r²)
function angleDelta(currentRadius) {
  return boxSize / Math.sqrt(b * b + currentRadius * currentRadius);
}

// 沿螺旋前进 N 天
let t = startTheta;
for (let day = 0; day < 365; day++) {
  const p = pos(t);
  // ...画第 day 天的扇环
  t += angleDelta(p.r);   // 动态加角度
}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">这条公式是原文档的核心洞察：<strong>当半径增大时，相同角度对应的弧长会变长</strong>，所以要让 Δθ 随半径增大而减小——这样"每个扇环的弧长"近似相等，视觉上整齐一致。</aside>

<strong>关键点 3：扇环路径生成</strong>

\`\`\`javascript
//  4 关键点：起点外 → 终点外 → 终点内 → 起点内
function segmentPath(t0, t1) {
  const coords = (t, sign) => {
    const r = pos(t).r + sign * coilGap / 2;  // sign=+1 外圈 / -1 内圈
    return [r * Math.cos(t), r * Math.sin(t)];
  };
  const [x0o, y0o] = coords(t0, +1);
  const [x1o, y1o] = coords(t1, +1);
  const [x1i, y1i] = coords(t1, -1);
  const [x0i, y0i] = coords(t0, -1);
  return \`M \${x0o} \${y0o} L \${x1o} \${y1o} L \${x1i} \${y1i} L \${x0i} \${y0i} Z\`;
}
// d 属性 = 'M ... L ... L ... L ... Z'，4 个 L 描述一个 4 边形
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">SVG path 极简：<code>M</code> 移动、<code>L</code> 画线、<code>Z</code> 闭合。手算 4 顶点比用 d3.arc() 灵活（d3.arc 是从圆弧角度算的，对螺旋无法直接用）。</aside>
`;export{e as default};