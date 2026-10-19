var e=`### Key code

<strong>Key point 1: 7-color generation rule</strong>

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

<aside class="course-callout course-callout--key-point" role="note"><code>(H + offset + 360) % 360</code> is the safe way to cycle HSL hues—avoiding negatives or values &gt; 360.</aside>
`;export{e as default};