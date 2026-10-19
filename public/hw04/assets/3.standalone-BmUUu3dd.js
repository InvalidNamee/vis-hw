var e=`对应讲义章节 3.3 数据属性。本 demo 把用户原文的"3 大属性"扩展为 <strong>Stevens 测量尺度（4 类）</strong>，并对照 Mackinlay 自动可视化框架给出的 <strong>视觉通道排序</strong>，演示"属性 → 通道"的匹配与错配。

Stevens 测量尺度 × 视觉通道排序（Mackinlay）

<table><thead><tr><th>属性类型</th><th>示例</th><th>推荐通道</th><th>不推荐通道</th></tr></thead><tbody><tr><td>名义（类别）</td><td>姓名、专业、民族</td><td>色相（Hue）、形状</td><td>大小、亮度（无意义）</td></tr><tr><td>序数</td><td>班级序号、等级</td><td>亮度、位置、密度</td><td>色相（顺序不明确）</td></tr><tr><td>区间</td><td>温度（°C）</td><td>位置、长度</td><td>比值（没有真零）</td></tr><tr><td>比率</td><td>年龄、价格、人口</td><td>位置、长度、面积</td><td>色相（顺序丢失）</td></tr></tbody></table>

<aside class="course-callout course-callout--note" role="note"><strong>嵌入理论（Mackinlay 1986）：</strong>视觉通道分为"定量型"（位置/长度/角度，能精确读数）与 "定性型"（色相/形状，仅能区分）。"顺序型"居中（亮度/密度）。把定量数据用定性通道编码， 会损失信息 —— 这就是 Demo 3.4 错配演示的根因。</aside>
`;export{e as default};