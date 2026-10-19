var e=`### 关键代码

<strong>关键点 1：每个角色 = 一条 path</strong>

\`\`\`javascript
//  时间尺度：0-127 分钟 → 屏幕宽度
const xScale = d3.scaleLinear()
  .domain([0, 127])
  .range([50, width - 50]);

// 每个角色是一组 [time, y] 关键点（手工调 y 实现聚散）
const characters = [
  { name: 'T-REX', color: '#d32f2f', points: [
    {time: 75, y: 280}, {time: 78, y: 130},   // 攻击现场
    {time: 88, y: 200}, {time:120, y: 290}
  ]},
  { name: 'Grant', color: '#1976d2', points: [
    {time:  0, y: 100}, {time: 78, y: 130},   // 与 T-REX 聚拢
    {time:120, y:  50}
  ]}
];

// 路径生成器
const line = d3.line()
  .curve(d3.curveCatmullRom.alpha(0.5))   // 张力 0.5
  .x(d => xScale(d.time))
  .y(d => d.y);

characters.forEach(c => {
  svg.append('path')
    .datum(c.points)
    .attr('d', line)
    .attr('stroke', c.color)
    .attr('stroke-width', 3)
    .attr('fill', 'none');
});
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>用 y 值表达"关系"</strong>是关键：T-REX 和 Grant 在 t=78 都画到 y=130，<strong>视觉上两条线聚拢</strong>= "T-REX 攻击 Grant"。这不是算法生成，是<strong>手工叙事设计</strong>——但 d3 提供工具让你能这样手工做。</aside>

<strong>关键点 2：事件层（叙事锚点）</strong>

\`\`\`javascript
//  事件层：半透明红圈 + 文字标签
const events = [
  { time: 78, x: xScale(78), y: 130, name: 'T-REX 攻击',
    desc: 'T-REX 冲出围栏攻击 Alan & Kids 的车' },
  { time: 48, x: xScale(48), y: 320, name: 'Nedry 事件',
    desc: 'Dilophosaurus 攻击 Nedry' }
];

const eventLayer = svg.append('g').attr('class', 'event-layer');

eventLayer.selectAll('g.event')
  .data(events).enter().append('g')
  .attr('class', 'event')
  .style('cursor', 'pointer')
  .on('mouseenter', (e, d) => showTip(\`\${d.name}\\n\${d.desc}\`))
  .each(function (d) {
    // 半透明背景圈
    d3.select(this).append('circle')
      .attr('cx', d.x).attr('cy', d.y).attr('r', 20)
      .attr('fill', 'rgba(255,0,0,0.15)');
    // 文字
    d3.select(this).append('text')
      .attr('x', d.x).attr('y', d.y - 9)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10).attr('font-weight', 600)
      .attr('fill', '#cc0000')
      .text(d.name);
  });
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>事件层与线层解耦</strong>：线层表达"关系流动"，事件层表达"叙事锚点"。这种<strong>双层结构</strong>是 Storyline 的标准设计——可分别动画、可独立筛选。</aside>

<strong>关键点 3：alpha(0.5) 张力系数</strong>

\`\`\`javascript
// d3.curveCatmullRom.alpha(t) - t ∈ [0, 1]
// t=0: 接近 linear（接近直线）
// t=0.5: 标准 Catmull-Rom（推荐）
// t=1.0: 接近 cardinal（高度曲线化）
d3.line().curve(d3.curveCatmullRom.alpha(0.5));
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">选 0.5 是经验值：比 0 更"软"（看起来有故事感），比 1.0 更"稳"（不会过山车）。做时间叙事就用 0.5；做科学曲线拟合就用 0.2-0.3（更接近数据）。</aside>
`;export{e as default};