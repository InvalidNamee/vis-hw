var e=`### 你的原案例

原 6.2.4 节用《侏罗纪公园》5 个角色（Alan / T-REX / Raptors / Malcolm / Dilophosaurus）做 Storyline 时间线。事件层用红色半透明圆圈标注关键冲突。

### 嵌入陈为教材理论

-   <strong>Storyline 起源</strong>：2008 年斯坦福大学 Ogawa & Ma 提出，原本用于电影/学术合作者关系网。
-   <strong>核心</strong>：把每个角色/组织/进程抽象为"生命线"，<strong>线靠近 = 角色相遇 / 冲突，线分开 = 角色分离</strong>。
-   <strong>3 大元素</strong>：
    1.  <strong>时间尺度映射</strong>：电影时长 → SVG 宽度，x 轴严格按比例对齐
    2.  <strong>Catmull-Rom 样条</strong>：\`curveCatmullRom.alpha(0.5)\` 张力系数 0.5，"自然流动"但不"过度弯曲"
    3.  <strong>事件层</strong>：半透明红圈 + 文字，标注关键转折点
-   <strong>应用场景</strong>：电影分析、案件多人时间线、体育比赛互动、项目任务交接。

### 为什么 Catmull-Rom 不用 monotoneX？

monotoneX 保证"不过度弯曲"但会让线"过于直"，<strong>失去叙事的"河流感"</strong>。Catmull-Rom 张力系数 0.5 是经验值——既能流动又不震荡。
`;export{e as default};