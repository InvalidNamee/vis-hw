var e=`本节使用了 colormap（Viridis）画热图。colormap 理论详见 [第 3 章 3.2 colormap 三类选择](../lesson-03/#ch-3-2)。

### 你的原案例

原 5.1 节用了 1985 美国 50 州犯罪数据（CSV），含 8 个犯罪指标列。

### 嵌入陈为教材理论

-   <strong>长格式（long）</strong>：每行一个观测，列 = 字段（如 \`{state, metric, value}\`）。优点：方便过滤、分组、绑定到 d3 join。
-   <strong>宽格式（wide）</strong>：每行一个实体，列 = 指标（如 \`{state, murder, robbery, ...}\`）。优点：人眼读得懂、直观。
-   <strong>转换</strong>：\`flatMap\` + 循环键名 = 几行代码搞定。
-   <strong>d3.autoType</strong>：自动推断列类型（数字、日期、布尔），省得手动 \`+d.field\`。
`;export{e as default};