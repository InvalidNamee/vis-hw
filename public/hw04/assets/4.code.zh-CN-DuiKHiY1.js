var e=`### 关键代码

<strong>关键点 1：极坐标转笛卡尔坐标</strong>

\`\`\`javascript
// 角度 → 屏幕坐标
function lineAtAngle(angleDeg, length = 240, origin = {x: 100, y: 240}) {
  const r = (angleDeg * Math.PI) / 180;
  return {
    x1: origin.x,
    y1: origin.y,
    x2: origin.x + length * Math.cos(r),
    y2: origin.y - length * Math.sin(r)   // SVG y 向下为正，所以取负
  };
}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">SVG 的 y 轴向下（与数学相反），所以 sin 角度项要取负。这是初学者最常踩的坑。</aside>

<strong>关键点 2：把抽象理论变成可调参数</strong>

\`\`\`javascript
// 让用户拖滑块改角度，立刻看到"哪段斜率最稳"
const slider = document.getElementById('angle');
slider.addEventListener('input', e => {
  const angle = +e.target.value;
  renderLine(angle);     // 30°~60° 误差小，0°/90° 误差大
});
\`\`\`
`;export{e as default};