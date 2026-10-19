var e=`### 你的原案例

原 5.1.2 节用散点展示 Crime 数据（murder vs robbery），坐标轴是 1985 数据。

### 嵌入陈为教材理论

-   <strong>三层空间</strong>：
    1.  <strong>数据空间</strong>：原始数值（如人口 27058000、谋杀率 8）
    2.  <strong>坐标系空间</strong>：归一化到 0..innerWidth（标准化坐标）
    3.  <strong>屏幕空间</strong>：加上 margin 偏移（最终像素位置）
-   <strong>为什么分层</strong>：坐标系空间内的元素（线、点）可以共享，切换屏幕尺寸时无需重算。d3.axisBottom 自动帮你做坐标系→屏幕。
-   <strong>scale 选型</strong>：
    -   \`scaleLinear\`：均匀分布，最常用
    -   \`scaleLog\`：跨数量级（人口从 53 万到 2700 万）
    -   \`scaleSqrt\`：面积感知（圆面积映射到值）
    -   \`scaleBand\`：类别轴（柱状图）
`;export{e as default};