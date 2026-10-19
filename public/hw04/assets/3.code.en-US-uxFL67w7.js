var e=`### Key Code — hierarchy + tree in Three Steps

<aside class="course-callout course-callout--code-purpose" role="note">This is the standard d3-hierarchy pattern: first build the hierarchy, then compute the tree layout, and finally draw links + nodes.</aside>

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

<aside class="course-callout course-callout--key-point" role="note"><strong>Key explanation:</strong> <code>treeData.x</code> is the <strong>depth direction</strong> (vertical by default), while <code>treeData.y</code> is the <strong>horizontal direction</strong> (different nodes at the same depth). So <code>linkHorizontal</code> uses <code>x=d.y, y=d.x</code> — the horizontal direction rides on y, and the vertical direction rides on x. <strong>This “x-axis rides on y, y-axis rides on x” swap is unique to horizontal trees — commit it to memory.</strong></aside>

### Key Code — separation Controls Parent-Child Spacing

<aside class="course-callout course-callout--code-purpose" role="note"><code>separation</code> accepts a function and returns the “spacing multiplier” between [node, parent].</aside>

\`\`\`javascript
const treeLayout = d3.tree()
  .size([360, 720])
  .separation((a, b) => (a.parent === b.parent ? 1 : 2));
                              //   ↑ 兄弟节点紧贴        ↑ 非兄弟至少隔 2 倍
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>Key explanation:</strong> The default value of <code>separation</code> is <code>(a, b) =&gt; a.parent === b.parent ? 1 : 2</code>. Change it to <code>0.5</code> → everything squishes together; change it to <code>2.0</code> → the tree widens. <strong>There is a slider in the demo</strong> so you can adjust it in real time and see the effect.</aside>
`;export{e as default};