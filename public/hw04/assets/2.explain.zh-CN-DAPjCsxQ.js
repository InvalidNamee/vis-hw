var e=`### 三类 colormap 对应不同数据语义

-   <strong>顺序型（Sequential）</strong>：数据有自然顺序（人口、温度）。单调亮度 + 单调色相。例子：\`Viridis / Plasma / Cividis\`
-   <strong>发散型（Diverging）</strong>：数据有意义的"中点"（如 0、正负偏差、白人中位数）。两端异色，中间白/浅。例子：\`RdBu / BrBG / PiYG\`
-   <strong>定性型（Qualitative）</strong>：数据无序（如产品类别）。色相区分、亮度接近。例子：\`Tableau10 / Set1 / Set3\`

### 典型错误

用发散型 RdBu 画"50 州谋杀率"（有序数据）——中段接近白色，看上去"谋杀率 = 100 附近"的州是"中点"——但 100 没有任何语义，纯属误导。

### CVD 友好检查清单

-   Viridis / Cividis： 优（Nature Methods 推荐）
-   RdBu / BrBG：△ 中等（红绿对色盲不友好）
-   Tableau10（定性）：△ 与色相相关
-   Jet（彩虹谱）： 禁用
`;export{e as default};