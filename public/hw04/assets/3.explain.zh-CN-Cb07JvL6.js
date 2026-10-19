var e=`### 你的原案例

原 5.1.3 节用折线 + 散点展示趋势。原始代码用了 \`curveCatmullRom\`，没讲为什么。

### 嵌入陈为教材理论

-   <strong>插值 vs 拟合</strong>：
    -   插值（interpolation）：曲线经过所有数据点（如 Catmull-Rom、Natural）
    -   拟合（fitting）：曲线不经过数据点，只反映趋势（如线性回归 LOESS）
-   <strong>d3.line().curve()</strong> 提供 10+ 种 curve，最常用：
-   <strong>step 系</strong>：用于离散阶跃（数字信号、状态切换）
-   <strong>catmullRom / natural</strong>：过所有点的张力样条，"看起来平滑"
-   <strong>monotoneX</strong>：保持原数据序列单调（不会出现伪震荡）
-   <strong>选择原则</strong>：数据有顺序性 → monotoneX / linear；数据本身抖动大 → catmullRom / basis 平滑；离散状态 → step
`;export{e as default};