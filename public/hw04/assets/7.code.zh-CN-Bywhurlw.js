var e=`### 关键代码

<strong>关键点 1：7 色生成规则</strong>

\`\`\`javascript
function genPalette(H, S, L) {
  return [
    hslHex((H - 30 + 360) % 360, S * 0.6, L * 1.1),  // 类比 1 低饱和
    hslHex((H - 30 + 360) % 360, S, L),              // 类比 1
    hslHex(H, S, L),                                 // 主色
    hslHex((H + 30) % 360, S, L),                    // 类比 2
    hslHex((H + 30) % 360, S * 0.6, L * 1.1),        // 类比 2 低饱和
    hslHex((H + 180) % 360, S * 0.8, L * 0.95),      // 互补
    hslHex(H, S * 0.2, L * 1.4)                      // 高亮（极低饱和）
  ];
}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><code>(H + offset + 360) % 360</code> 是 HSL 色相循环的安全写法——避免负数或 &gt; 360。</aside>
`;export{e as default};