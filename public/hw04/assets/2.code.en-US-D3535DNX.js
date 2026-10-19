var e=`### Key Code

<strong>Key Point 1: d3.timeParse + d3.timeFormat for time formatting</strong>

\`\`\`javascript
//  时间字符串 → Date 对象
const parseYear = d3.timeParse('%Y');        // '1965' → Date
// 时间 Date → 字符串
const formatYear = d3.timeFormat('%Y');     // Date → '1965'

// 典型 timeFormat tokens
//   %Y 4 位年    %y 2 位年
//   %m 月份 01-12   %B 月名 January
//   %d 日 01-31    %a 星期 Sun
//   %H 时 00-23    %M 分 00-59
//   %L 毫秒 000-999
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">d3-time is a core d3 module. d3.timeParse / timeFormat must be mastered first when handling <strong>any time series data</strong>—especially since CSV years are strings like “2024,” not Date objects.</aside>

<strong>Key Point 2: d3.scaleTime time axis</strong>

\`\`\`javascript
// 时间轴 = 数值轴的特化版（Date 在底层就是数字）
const xScale = d3.scaleTime()
  .domain([new Date(1900, 0, 1), new Date(2020, 11, 31)])
  .range([0, innerW]);
// d3.axisBottom 自动按"年/十年/世纪"切换 tick
svg.append('g')
  .attr('transform', \`translate(\${M.l},\${M.t + innerH})\`)
  .call(d3.axisBottom(xScale).ticks(10));
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><code>scaleTime</code> has two extra capabilities over <code>scaleLinear</code>: 1) auto-pick tick intervals based on time span (10 years / 12 months / 30 days); 2) timezone handling (in real projects, remember to set <code>utc()</code>).</aside>

<strong>Key Point 3: hover highlight + tooltip</strong>

\`\`\`javascript
// 透明覆盖层捕获鼠标事件
const focus = svg.append('g').style('display', 'none');
focus.append('line')             // 垂直参考线
  .attr('class', 'hover-line')
  .attr('y1', 0).attr('y2', innerH);
focus.append('circle')           // 圆点
  .attr('r', 5).attr('fill', 'steelblue');
focus.append('text')             // tip
  .attr('class', 'tip');

svg.append('rect')               // 覆盖矩形
  .attr('width', innerW).attr('height', innerH)
  .attr('fill', 'none').attr('pointer-events', 'all')
  .on('mouseover', () => focus.style('display', null))
  .on('mouseout',  () => focus.style('display', 'none'))
  .on('mousemove', (event) => {
    const xm = d3.pointer(event)[0];
    const date = xScale.invert(xm - M.l);
    // bisect 找最近点
    const i = d3.bisector(d => d.year).left(series, date);
    const d = series[i];
    focus.attr('transform', \`translate(\${xScale(d.year)},0)\`);
  });
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">Generic hover template: transparent rect + focus g (line + circle + text). d3.bisector finds the nearest point faster and more accurately than a hand-written loop.</aside>
`;export{e as default};