var e=`### 3 个"经典论文图"案例

-   <strong>图 1：5 类别散点（Wong 配色）</strong>——Nature 风格
-   <strong>图 2：顺序型热图（Viridis）</strong>——最常见的科研图
-   <strong>图 3：红绿对比（错误案例）</strong>——常见但严重

### CVD 测试流程

1.  把图导出 PNG
2.  用 [Coblis](https://www.color-blindness.com/coblis-color-blindness-simulator/) 或 [Color Oracle](https://colororacle.org/) 模拟
3.  看是否仍能区分（亮度对比 / 形状 / 标签）

### 实测结论

-   Wong / Okabe-Ito / Paul Tol： 在 3 种 CVD 下都能区分
-   红绿对比： 在绿盲眼中几乎同色（最严重）
-   Nature/Science/Cell 已逐步迁移到 CVD 友好配色
`;export{e as default};