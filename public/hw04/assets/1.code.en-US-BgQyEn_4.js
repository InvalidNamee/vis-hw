var e=`### Key Code

<strong>Key Point 1: the 5 properties are organized as an array of objects</strong>

\`\`\`javascript
//  单一数据源：5 个属性 + 含义 + 例子 + 颜色
const TIME_ATTRIBUTES = [
  { key: 'ordered',          name: '有序性',     icon: '',
    desc: '时间是有序的。两个事件发生的时间有先后次序，与因果关系紧密相连。',
    example: '火车时刻表、事件日志、git commit history', color: '#3b82f6' },
  { key: 'continuous',       name: '连续性',     icon: '∞',
    desc: '时间是连续的。两个时间点之间总存在另一个时间点。',
    example: '实时传感器数据（温度、心率）、流式数据流', color: '#10b981' },
  { key: 'periodic',         name: '周期性',     icon: '',
    desc: '许多自然过程有循环规律（季节、昼夜）。可采用循环时间域表示。',
    example: '24h 体温、12 个月气温、年周期销售', color: '#f59e0b' },
  { key: 'spatial_independent', name: '独立于空间', icon: '',
    desc: '时间与空间紧相关，但科学过程大多将它们独立处理。',
    example: '折线图 x 轴只用时间、y 轴只用度量', color: '#8b5cf6' },
  { key: 'structured',       name: '结构性',     icon: '',
    desc: '时间尺度分年/月/日/时/分/秒，分割既有自然反映（昼夜）也有人为定义。',
    example: '日历/周排列、闰年调整、工作日 vs 周末', color: '#ec4899' }
];
\`\`\`

<aside class="course-callout course-callout--key-point" role="note">Array of objects = one data source, many uses. Card rendering, detailed explanations, and filtering all derive from the same source—so you never miss a spot when editing.</aside>

<strong>Key Point 2: d3.timeDay.range generates an equally-spaced day sequence</strong>

\`\`\`javascript
// 生成 2024-01-01 到 2024-12-31 之间所有日期（366 天）
const days = d3.timeDay.range(new Date(2024, 0, 1), new Date(2025, 0, 1));
// 输出：[Date(2024-01-01), Date(2024-01-02), ..., Date(2024-12-31)]
console.log(days.length);  // 366（闰年）
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><code>d3.timeDay</code> is the core of the d3-time module: <code>range(start, stop)</code> returns a discrete array of every “day” between two moments; <code>offset(date, n)</code> adds or subtracts n days. <strong>Structure (structural) is achieved through this kind of “time-scale” operation</strong>.</aside>
`;export{e as default};