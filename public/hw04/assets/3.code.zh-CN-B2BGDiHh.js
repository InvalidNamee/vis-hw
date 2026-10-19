var e=`### 关键代码

<strong>关键点 1：d3.timeDay.range + d3.timeFormat.isoDate</strong>

\`\`\`javascript
//  把"年"拆成"日"列表
const days = d3.timeDay.range(
  new Date(2024, 0, 1),         // 2024-01-01
  new Date(2025, 0, 1)          // 2025-01-01
).map(d => ({
  date:  d,
  value: byKey.get(d3.timeFormat('%Y-%m-%d')(d)) ?? 0
}));
// 现在 days.length === 366（2024 闰年）
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><code>d3.timeDay.range(start, stop)</code> 是"日内连续性 + 结构性"两个属性的合击——自动按日粒度切分整年，<strong>闰年 366 / 平年 365 自动正确</strong>。</aside>

<strong>关键点 2：周日为起点布局</strong>

\`\`\`javascript
function weekColSunday(date) {
  // 周日为每列起点 (getDay()=0)
  return Math.floor((d3.timeDay.count(
    d3.timeYear.floor(date), date)) / 7);
}
function dayIndexSunday(date) {
  return date.getDay();    // 0=周日, 1=周一, ..., 6=周六
}

// 渲染每个日格
g.selectAll('rect.cell')
  .data(days).join('rect')
  .attr('class', 'cell')
  .attr('width',  cellSize)
  .attr('height', cellSize)
  .attr('x', d => weekColSunday(d.date) * cellSize)
  .attr('y', d => dayIndexSunday(d.date) * cellSize)
  .attr('rx', 2).attr('ry', 2)
  .attr('fill', d => color(d.value));
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>周日 vs 周一布局</strong>是日历热图的设计分歧：周日为起点是<strong>英文日历传统</strong>（2024-01-01 是周一，所在列第 1 行往下是 周一→周六，最末行是周日）。中文场景常改成周一起点。</aside>

<strong>关键点 3：isMonthDivider 月份分隔</strong>

\`\`\`javascript
//  巧妙算法：判断 7 天前是否同月
function isMonthDivider(date) {
  const sevenDaysAgo = d3.timeDay.offset(date, -7);
  return date.getFullYear() !== sevenDaysAgo.getFullYear()
      || date.getMonth()    !== sevenDaysAgo.getMonth();
}
// 同月：不画分割线；跨月：画一条上边框

function isFirstDayOfMonth(date) {
  return date.getDay() !== 0         // 排除周日（被周列开头替代）
      && date.getMonth() > 0         // 排除一月（画上边框没意义）
      && date.getDate() === 1;
}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">不用循环"找每个月的第一天"，改用"7 天前是否同月"——简洁又正确，<strong>O(n) 一遍扫描即可</strong>。这是日历热图作者 van Wijk 的精妙算法。</aside>
`;export{e as default};