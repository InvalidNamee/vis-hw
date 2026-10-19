var e=`### ★ Key Code

★ <strong>Key Point 1: convert polar to Cartesian coordinates</strong>

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

<aside class="course-callout course-callout--key-point" role="note">★ SVG’s y axis points downward (opposite to math convention), so the sine term must be negated. This is the most common pitfall for beginners.</aside>

★ <strong>Key Point 2: turn abstract theory into tunable parameters</strong>

\`\`\`javascript
// 让用户拖滑块改角度，立刻看到"哪段斜率最稳"
const slider = document.getElementById('angle');
slider.addEventListener('input', e => {
  const angle = +e.target.value;
  renderLine(angle);     // 30°~60° 误差小，0°/90° 误差大
});
\`\`\`
`;export{e as default};