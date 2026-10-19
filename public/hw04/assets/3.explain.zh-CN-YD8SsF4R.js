var e=`### 本节在流程中的位置：视觉映射（Visual Mapping）

接上一节 <strong>2.2 数据变换</strong>，我们有了"数据表"。本节的 <strong>2.3</strong> 是第二段箭头 <strong>「数据表 → 视觉结构」</strong> —— 也就是 <strong>视觉映射（Visual Mapping）</strong>。 它回答一个核心问题：<em>数据里每个属性，该用哪个视觉通道来表达？</em>

### 你的原案例

你的 4.2 节提到"树形结构可视化"。这节展开<strong>树布局算法</strong>原理 —— 拿到层级数据后，怎么把节点摆到屏幕上不打架？

### 理论核心：什么是视觉通道？Mackinlay 的排名

<strong>视觉通道（visual channel）</strong>是指"把数据编码到视觉元素上"的载体： 位置、长度、面积、角度、颜色、形状、纹理…… <strong>Mackinlay 1986</strong> 给出经典排名：对<em>不同数据类型</em>，各通道的<strong>量化精确度</strong>不一样。 这就是下面这张图。

![Mackinlay 1986 视觉通道排名](./img/01-mackinlay-ranking.png)

图 1 · Mackinlay 1986 通道排名：对 Quantitative（定量）/ Ordinal（有序）/ Nominal（名义）三类数据，各通道的量化精确度排序。位置（Position）永远最准。

-   <strong>位置（Position）</strong>：三种数据类型都是第一 —— 人眼对位置最敏感
-   <strong>定量数据</strong>：长度 → 角度 → 斜率 → 面积（长条形图比面积图准）
-   <strong>名义数据</strong>：位置 → 色调（hue）→ 纹理 → 连接 → 形状

### 理论核心：图元（marks）与视觉通道的构成

视觉结构由 <strong>图元（mark）</strong>打底：点（Point）、线（Line）、面（Area）。 然后通过 <strong>通道</strong>把这些图元"做记号"：位置、颜色、形状、倾斜、大小。 下面两张图拆开讲。

![图元：点/线/面](./img/02-marks-points-lines-areas.png)

图 2 · 图元（marks）三族：点（Points）、线（Lines）、面（Areas）。图元决定"一份数据长什么样"，是视觉结构的骨架。

![视觉通道：位置/颜色/形状/倾斜/大小](./img/03-channels-position-color-shape.png)

图 3 · 常用视觉通道族：位置（Position，含水平/垂直/两者）、颜色（Color）、形状（Shape）、倾斜（Tilt）、大小（Size，含长度/面积/体积）。

### 理论核心：两类通道 —— 幅度 vs 标识

按"能不能表达量的多少"，通道分两类： <strong>幅度通道（Magnitude）</strong>表达<em>有序/定量</em>属性；<strong>标识通道（Identity）</strong>表达<em>类别</em>属性。 选错类别 = 误导读者。

![幅度通道：有序属性](./img/04-magnitude-channels.png)

图 4 · 幅度通道（Magnitude Channels）：表达"有序属性"。按精确度排序 —— 共用尺度位置最准，长度/倾斜/面积次之，颜色亮度、饱和度和体积最弱（都标 "Same" 即排序有歧义）。

![标识通道：类别属性](./img/05-identity-channels.png)

图 5 · 标识通道（Identity Channels）：表达"类别属性" —— 空间区域、色调（hue）、运动（motion）、形状（shape）。它们能区分"不同类"，但分不出"谁多谁少"。

<strong>本节案例的落点</strong>：树布局（Reingold-Tilford）本质上就是一种<strong>视觉映射</strong> —— 用 <em>位置通道</em> 把层级关系编码成"父在上、子在下的树"。下面讲它的算法。

### 嵌入理论：Reingold-Tilford 算法（d3.tree 的核心）

Reingold & Tilford 1981 年提出的算法，至今仍是 d3.tree() 的实现核心。核心思路：

1.  <strong>第一遍（自底向上）：</strong>对每个父节点，计算其左右子树"占用多少横向空间"
2.  <strong>第二遍（自顶向下）：</strong>给每个节点分配<strong>绝对 x 坐标</strong>（保证兄弟节点紧贴父节点中线且不重叠）
3.  <strong>第三遍：</strong>处理"线程"（threads）—— 修复子节点跨父中线时的对齐

<strong>复杂度的处理</strong>：

-   <strong>O(n)</strong> 时间 —— 比简单的"递归平分"要快
-   节点的<strong>左右子树宽度的最小值</strong> = 至少容纳所有子节点的水平空间
-   不同布局策略选型：\`d3.tree\`（左右）、\`d3.cluster\`（左右紧贴）、\`d3.treemap\`（面积）

### 理论补丁：d3-hierarchy 模块全家桶

-   \`hierarchy(data)\`：把任意嵌套 data 转成 hierarchy 结构（每个节点加 parent/children/depth）
-   \`tree().size([h, w])\`：reingold-tilford 算法，左右布局
-   \`cluster().size([h, w])\`：所有叶子节点对齐到同一深度
-   \`treemap().tile(...)\`：面积（slice-and-dice / squarified / resquarify 算法）
-   \`pack().radius(d => ...)\`：圆环打包（circle packing）
-   \`partition().size([h, w])\`：icicle / sunburst 布局
`;export{e as default};