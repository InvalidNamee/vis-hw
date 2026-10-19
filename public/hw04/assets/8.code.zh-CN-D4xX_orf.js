var e=`### 关键代码

<strong>关键点 1：把 SVG 中所有 fill 做 CVD 模拟</strong>

\`\`\`javascript
function cvdTransformSvg(svgString, type) {
  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
  doc.querySelectorAll('[fill]').forEach(el => {
    const c = d3.color(el.getAttribute('fill'));
    if (!c) return;
    const rgb = [Math.round(c.rgb().r), Math.round(c.rgb().g), Math.round(c.rgb().b)];
    const sim = simulateCVD(rgb, type);
    el.setAttribute('fill', \`rgb(\${sim.join(',')})\`);
  });
  return new XMLSerializer().serializeToString(doc);
}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">用 <code>DOMParser</code> 解析 SVG 字符串，遍历所有 <code>fill</code> 属性应用 CVD 矩阵。比手写 SVG 字符串拼接安全。</aside>
`;export{e as default};