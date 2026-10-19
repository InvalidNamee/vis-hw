var e=`### Key Code

<strong>Key Point 1: d3.timeDay.range + d3.timeFormat.isoDate</strong>

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

<aside class="course-callout course-callout--key-point" role="note"><code>d3.timeDay.range(start, stop)</code> combines “intra-day continuity + structure”—it automatically slices a whole year by day, with <strong>leap-year 366 / common-year 365 handled correctly</strong>.</aside>

<strong>Key Point 2: Sunday-first layout</strong>

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

<aside class="course-callout course-callout--key-point" role="note"><strong>Sunday vs Monday layout</strong> is a calendar heatmap design fork: Sunday-first is the <strong>English calendar convention</strong> (2024-01-01 is Monday, so in its column row 1 is Mon→Sat and the last row is Sun). Chinese settings often switch to Monday-first.</aside>

<strong>Key Point 3: isMonthDivider month separation</strong>

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

<aside class="course-callout course-callout--key-point" role="note">Instead of looping to “find each month’s first day,” use “are 7 days ago and today in the same month?”—simple and correct, just an <strong>O(n) single-pass scan</strong>. This is the elegant algorithm from calendar heatmap author van Wijk.</aside>
`;export{e as default};