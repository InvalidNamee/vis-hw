var e=`### Key Code

<strong>Key Point 1: each character = one path</strong>

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

<aside class="course-callout course-callout--key-point" role="note"><strong>Using y to encode “relationships”</strong> is the key: T-REX and Grant both at y=130 at t=78, so <strong>the two lines visually converge</strong> = “T-REX attacks Grant.” This isn’t algorithmically generated—it’s <strong>manual narrative design</strong>, but d3 gives you the tools to do it by hand.</aside>

<strong>Key Point 2: event layer (narrative anchors)</strong>

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

<aside class="course-callout course-callout--key-point" role="note"><strong>Decouple event layer from line layer</strong>: the line layer expresses “relationship flow,” the event layer expresses “narrative anchors.” This <strong>two-layer structure</strong> is the standard Storyline design—each can be animated or filtered independently.</aside>

<strong>Key Point 3: alpha(0.5) tension coefficient</strong>

\`\`\`javascript
// d3.curveCatmullRom.alpha(t) - t ∈ [0, 1]
// t=0: 接近 linear（接近直线）
// t=0.5: 标准 Catmull-Rom（推荐）
// t=1.0: 接近 cardinal（高度曲线化）
d3.line().curve(d3.curveCatmullRom.alpha(0.5));
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">0.5 is an empirical value: softer than 0 (looks narrative), steadier than 1.0 (no roller-coaster). Use 0.5 for time-based narratives; use 0.2–0.3 for scientific curve fitting (closer to data).</aside>
`;export{e as default};