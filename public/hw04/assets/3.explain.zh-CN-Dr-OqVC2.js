var e=`### 为什么需要 Lab 色域图？

RGB 空间是立方体，但你不知道"哪些颜色真的存在、哪些会失真"。CIE Lab 是感知均匀空间，<strong>距离 ≈ 人眼感知差</strong>，是设计 colormap 和检查色域的标准。

### 三个色域（嵌套关系）

-   <strong>sRGB</strong>：屏幕通用标准（Web/PPT/一般科研图）
-   <strong>Adobe RGB</strong>：摄影/印刷，绿域更广
-   <strong>Rec.2020</strong>：4K 电视/HDR，色域最大

超出 sRGB 的颜色（如高饱和度的纯绿）在普通屏幕上<strong>显示不出来</strong>，会被 clamp。

### 实战用法

-   从 \`d3.lab(L, a, b).rgb()\` 转换时，超出 sRGB 的颜色会自动 clamp
-   设计 colormap 时用 \`d3.interpolateLab\`（在 Lab 空间插值），比 \`d3.interpolateRgb\` 平滑得多
-   高饱和度色仅在打印/4K 屏幕上"存在"，Web 上看不一定准确
`;export{e as default};