var e=`### 为什么要学颜色模型？

设计 colormap 时，<strong>不能直接用 RGB 插值</strong>——因为 RGB 不是感知均匀的（255,0,0 与 0,255,0 "看上去"亮度差很多）。你需要感知均匀的颜色空间（Lab / HCL）来插值，才能得到平滑的渐变。

### 4 大颜色空间

-   <strong>RGB</strong>：加色模型，设备相关。屏幕显示的默认。
-   <strong>HSL</strong>：艺术家友好（色相/饱和度/亮度独立），但<strong>仍不感知均匀</strong>。
-   <strong>CIE Lab</strong>：感知均匀，<strong>设计 colormap 的黄金标准</strong>。
-   <strong>CMYK</strong>：减色（印刷），web 可视化用不到。

### CVD（色觉缺陷）

约 8% 男性、0.5% 女性是色盲。常见三种：

-   <strong>红色盲（protanopia）</strong>：约 1% 男性
-   <strong>绿色盲（deuteranopia）</strong>：约 6% 男性（最常见）
-   <strong>蓝色盲（tritanopia）</strong>：极罕见
`;export{e as default};