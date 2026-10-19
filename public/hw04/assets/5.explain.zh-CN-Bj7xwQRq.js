var e=`### 3 大黄金标准

-   <strong>Wong 2011</strong>：Nature Methods 8:441 推荐，8 色 CVD 友好，灰度打印友好
-   <strong>Paul Tol</strong>：SRON Tech Note，bright（白底）/ muted（深底）/ high-contrast（对比
-   <strong>Okabe-Ito 2002</strong>：8 色，CVD 友好，早期 Nature/Science 默认

### 商业 / 通用

-   <strong>Tableau 10</strong>：商业图表之王，10 色，红绿对色盲不友好
-   <strong>Paired (12)</strong>：配对设计（处理前/后），12 色过载

### 顺序型 / 发散型

-   <strong>Viridis</strong>：matplotlib/d3 默认，感知均匀 + CVD 友好
-   <strong>Cividid</strong>：Viridis 的 CVD 强化版（更蓝/黄分明）
-   <strong>RdBu</strong>：发散型红蓝

### 实战原则

-   类别数 ≤ 7，类别多时改用连续 colormap
-   必须经过 CVD 模拟测试
-   优先使用 CVD 友好 + 灰度友好的（顶标都用这套）
`;export{e as default};