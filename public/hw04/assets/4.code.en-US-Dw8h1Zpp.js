var e=`### Key Code

<strong>Key Point 1: polar → Cartesian coordinates</strong>

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

<aside class="course-callout course-callout--key-point" role="note">Polar = (r, θ), Cartesian = (x, y); <strong>θ grows by 2π, r grows by b</strong>—this produces a “one ring out per loop” spiral. If b=0, it becomes an ordinary circle.</aside>

<strong>Key Point 2: dynamic angle increment</strong>

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

<aside class="course-callout course-callout--key-point" role="note">This formula is the original document’s core insight: <strong>as the radius grows, the same angle spans a longer arc</strong>, so Δθ must shrink as r grows—keeping each sector ring’s arc length roughly equal and visually uniform.</aside>

<strong>Key Point 3: sector-ring path generation</strong>

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

<aside class="course-callout course-callout--key-point" role="note">SVG path in essence: <code>M</code> move, <code>L</code> line, <code>Z</code> close. Computing the 4 vertices by hand is more flexible than d3.arc() (which is built for circular arcs and cannot directly handle a spiral).</aside>
`;export{e as default};