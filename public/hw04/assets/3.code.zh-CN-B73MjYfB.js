var e=`### 关键代码

<strong>关键点 1：Lab 颜色对象</strong>

\`\`\`javascript
// 直接构造 Lab 颜色
const c = d3.lab(50, 30, -20);    // L*=50, a*=30, b*=-20
console.log(c.rgb());              // → RGB {r, g, b}（clamp 到 sRGB）
console.log(c.formatHex());       // → "#xxxxxx"

// 从 RGB 反向构造
const c2 = d3.color('#ff0080');
console.log(c2.lab());             // → {l, a, b}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">d3.lab() 返回的是 Lab 颜色对象，但显示时还是转回 RGB。Lab 是"思考空间"，RGB 是"显示空间"。</aside>

<strong>关键点 2：在 Lab 空间插值</strong>

\`\`\`javascript
// 在 Lab 空间插值（感知均匀）
const interp = d3.interpolateLab('#000000', '#ffffff');
interp(0.5);   // → 中间灰（Lab 空间线性插值，结果感知均匀）

// vs 在 RGB 空间插值（不均匀）
const interpRgb = d3.interpolateRgb('#000000', '#ffffff');
interpRgb(0.5);  // → 中间灰（RGB 空间插值，但在 Lab 看来"不是中间"）
\`\`\`
`;export{e as default};