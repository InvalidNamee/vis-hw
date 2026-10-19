var e=`### 你的原案例

原 6.2.2 节用日历热图展示 2024 年北京每日最高温度。每月之间用红线分隔。

### 嵌入陈为教材理论

-   <strong>日历热图 (Calendar Heatmap)</strong>：<strong>van Wijk 2008</strong> 提出，x = 周（年内的第几周），y = 星期几，颜色 = 数值。
-   <strong>适用场景</strong>：长时序（年）+ 周期性（星期 / 月）+ 异常检测（节假日、工作日 vs 周末）。
-   <strong>设计要点</strong>：
    -   每周从周日（或周一）开始——影响"周末"在视觉上的位置
    -   月份之间用红线分隔——比 7×53 网格更易读
    -   colormap 用顺序型（如 Viridis）——见 [第 3 章 3.2 colormap](../lesson-03/#ch-3-2)

### isMonthDivider 的巧妙之处

判断 7 天前与今天是否同月——是则同月分割线，否则需要画月线。这是日历可视化的核心算法。
`;export{e as default};