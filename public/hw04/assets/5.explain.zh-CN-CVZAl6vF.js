var e=`### 你的原案例

原 5.2.2 节用 Marching Squares 提取 Crime 数据的等值线。原始代码是截图占位。

### 嵌入陈为教材理论

-   <strong>Marching Squares 原理</strong>：把标量场离散化为网格，每个 cell 4 个角的"是否大于阈值"决定 case 编号 0~15（2⁴=16 种）。每种 case 对应 0/1/2 条线段，把"超过阈值"和"未超过阈值"的两片区域分开。
-   <strong>16 种 case</strong>：编码 bit0=BL、bit1=BR、bit2=TR、bit3=TL。
-   <strong>扩展到 3D</strong>：Marching Cubes（Lorensen & Cline 1987），2⁸=256 种 case，常用于医学 MRI / CT 等值面提取。
-   <strong>应用场景</strong>：
    -   地形等高线（地图）
    -   医学影像（MRI/CT 等值面）
    -   密度等高图（核密度估计）
    -   天气预报（等温线、等压线）
`;export{e as default};