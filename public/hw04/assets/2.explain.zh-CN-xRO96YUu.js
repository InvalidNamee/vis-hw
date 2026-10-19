var e=`### 你的原案例

原 6.2.1 节用折线图展示法国几十年人名（Marie / Jean / Camille）的使用频率变化。  
原始页面附带"词云 + 鼠标高亮 + 时间段筛选"，但代码只给了关键折线段。

### 嵌入陈为教材理论

-   <strong>标准时序图本质</strong>：二维线图，x = 时间，y = 度量。优势是<strong>在线性时间域</strong>中的变化趋势一目了然。
-   <strong>缺点</strong>：难以表达<strong>周期性</strong>——所以才有了 5.3 日历图和 5.4 螺旋图。
-   <strong>交互</strong>：鼠标 hover 高亮、tip 显示、筛选时间段——是数据新闻标配。
-   <strong>实战选择</strong>：数据点数 ≤ 50 用 linear；点数 50-500 用 monotoneX / curveCatmullRom；点数 > 500 才考虑面积 / 箱形。
`;export{e as default};