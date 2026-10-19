var e=`### 关键代码 ① hierarchy + tree 三步走

<aside class="course-callout course-callout--code-purpose" role="note">这是 d3-hierarchy 的标准模式：先建 hierarchy、再求 tree layout、最后画 links + nodes。</aside>

\`\`\`javascript
 // 1. hierarchy：从嵌套 JSON → 计算每个节点的 parent/children/depth
const root = d3.hierarchy(rootData);

 // 2. tree layout：给每个节点算 x/y 坐标
const treeLayout = d3.tree().size([360, 720]);
const treeData = treeLayout(root);

 // 3. 画 links：父-子连线（Reingold-Tilford 算法结果就在这里）
g.selectAll(".link").data(treeData.links()).join("path")
  .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));

 // 4. 画 nodes：圆 + 文字
const ng = g.selectAll(".node").data(treeData.descendants()).join("g")
  .attr("transform", d => \`translate(\${d.y}, \${d.x})\`);

ng.append("circle").attr("r", 5);
ng.append("text")
  .attr("text-anchor", d => d.children ? "end" : "start")
  .attr("x", d => d.children ? -8 : 8)
  .text(d => d.data.name);
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释：</strong> <code>treeData.x</code> 是<strong>深度方向</strong>（默认垂直），<code>treeData.y</code> 是<strong>水平方向</strong>（同一深度的不同节点）。 所以 linkHorizontal 用 <code>x=d.y, y=d.x</code> —— 横线方向走 y，垂直方向走 x。 <strong>这种"x 轴走 y、y 轴走 x"的 swap 是横向树特有的，记住。</strong></aside>

### 关键代码 ② separation 控制父子间距

<aside class="course-callout course-callout--code-purpose" role="note">separation 接收函数，返回 [node, parent] 之间的"间隔倍数"。</aside>

\`\`\`javascript
const treeLayout = d3.tree()
  .size([360, 720])
  .separation((a, b) => (a.parent === b.parent ? 1 : 2));
                              //   ↑ 兄弟节点紧贴        ↑ 非兄弟至少隔 2 倍
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释：</strong> separation 默认值 <code>(a, b) =&gt; a.parent === b.parent ? 1 : 2</code>。 改成 <code>0.5</code> → 全部挤一起；改成 <code>2.0</code> → 树变宽。 <strong>Demo 里有个 slider</strong> 让你实时调看效果。</aside>
`;export{e as default};