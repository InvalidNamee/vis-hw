var e=`### 关键代码

<strong>关键点 1：5 个属性以对象数组组织</strong>

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

<aside class="course-callout course-callout--key-point" role="note">对象数组 = 一份数据 + 多处使用。卡片渲染、详细解释、筛选过滤都从同一数据源派生，避免改一处漏一处。</aside>

<strong>关键点 2：d3.timeDay.range 生成等间距日序列</strong>

\`\`\`javascript
// 生成 2024-01-01 到 2024-12-31 之间所有日期（366 天）
const days = d3.timeDay.range(new Date(2024, 0, 1), new Date(2025, 0, 1));
// 输出：[Date(2024-01-01), Date(2024-01-02), ..., Date(2024-12-31)]
console.log(days.length);  // 366（闰年）
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><code>d3.timeDay</code> 是 d3-time 模块的核心：<code>range(start, stop)</code> 返回两个时刻之间所有"日"的离散数组，<code>offset(date, n)</code> 加减 n 天。<strong>结构性（structural）就靠这种"时间尺度"操作实现</strong>。</aside>
`;export{e as default};