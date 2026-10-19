var e=`### 关键代码

<strong>关键点 1：RGB → HSL 手写</strong>

\`\`\`javascript
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">自己写 RGBHSL 是为了理解每一步的物理含义——"最大通道决定色相、相减决定饱和度"——比用 d3 库更能理解色相为什么在 0-360° 循环。</aside>

<strong>关键点 2：CVD 模拟矩阵</strong>

\`\`\`javascript
const CVD_MATRICES = {
  deuteranopia: [
    [0.625, 0.375, 0.000],
    [0.700, 0.300, 0.000],
    [0.000, 0.300, 0.700]
  ],
  protanopia:   [[0.567, 0.433, 0.000], [0.558, 0.442, 0.000], [0.000, 0.242, 0.758]],
  tritanopia:   [[0.950, 0.050, 0.000], [0.000, 0.433, 0.567], [0.000, 0.475, 0.525]]
};

function simulateCVD([r, g, b], type) {
  const m = CVD_MATRICES[type];
  return [
    r * m[0][0] + g * m[0][1] + b * m[0][2],
    r * m[1][0] + g * m[1][1] + b * m[1][2],
    r * m[2][0] + g * m[2][1] + b * m[2][2]
  ].map(v => Math.round(Math.max(0, Math.min(255, v))));
}
\`\`\`

<strong>关键点 3：d3 内置多空间</strong>

\`\`\`javascript
const c = d3.color('rgb(100, 50, 200)');
c.rgb();   // {r, g, b}
c.hsl();   // {h, s, l}
c.lab();   // {l, a, b}  ← 感知均匀
c.hcl();   // {h, c, l}  ← Lab 极坐标版
\`\`\`
`;export{e as default};