var e=`### Key code

<strong>Key point 1: HSL hue difference</strong>

\`\`\`javascript
// 5 大色系的"色相差"参数
const HUE_OFFSETS = {
  monochromatic: 0,     // 同色相
  analogous:     30,    // ±30°
  complementary: 180,   // 180° 对面
  triadic:       120,   // 120° 三等分
  split:         150    // 150° 邻补
};

// 生成 5 色调色板
function palette(baseH, offset) {
  return [-2, -1, 0, 1, 2].map(i => {
    const h = (baseH + i * offset + 360) % 360;
    return d3.hsl(h, 0.6, 0.55).formatHex();
  });
}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><code>d3.hsl(h, s, l)</code> directly constructs an HSL color object. In HSL, H cycles through 0–360°, so additions must be mod 360.</aside>
`;export{e as default};