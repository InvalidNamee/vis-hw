var e=`### 你的原案例

<strong>3 个可视化流程模型</strong>：① 参考 Card 1999 模型绘制流程图（Box Flowcharts）→ ② Mackinlay 自动化准则 → ③ van Wijk 模型（含交互反馈）。

原始图片是你的概念图。<strong>本节课</strong>用 D3 重画这张概念图，每个节点点击后能展开细节。

### 嵌入理论：可视化流程的三个经典模型

<table class="theory-table"><thead><tr><th>模型</th><th>作者 / 年份</th><th>核心思想</th></tr></thead><tbody><tr><td><strong>Card 数据流模型</strong></td><td>Card, Mackinlay &amp; Shneiderman, 1999</td><td>原始数据 → 数据表 → 视觉结构 → 视图（嵌套变换 D→T→V→C/L/S）</td></tr><tr><td><strong>Mackinlay 自动化准则</strong></td><td>Mackinlay 1986</td><td>对每种数据类型，自动选「量化准确性最高」的视觉通道（如：数值→位置、类别→色调）</td></tr><tr><td><strong>van Wijk 反馈模型</strong></td><td>van Wijk 2005</td><td>View ⇆ Filter ⇆ Param ⇆ Other Views —— 强调<strong>交互反馈循环</strong></td></tr></tbody></table>

<strong>核心教学要点</strong>：三个模型描述同一件事的不同侧面—— Card 给"管道"，Mackinlay 给"自动决策"，van Wijk 给"反馈环"。 <strong>三者是叠加关系，不是冲突关系。</strong>

-   <strong>Card 模型</strong>：告诉你"transform 之后该 mapping，mapping 之后该 view"
-   <strong>Mackinlay</strong>：告诉你"mapping 这一步怎么自动决策"
-   <strong>van Wijk</strong>：告诉你"view 之后还要把用户操作 feed 回去"
`;export{e as default};