var e=`### 关键代码 ① 字段名映射

<aside class="course-callout course-callout--code-purpose" role="note">中文列名映射成英文变量名 —— 避免 JS 中带中文 key 引发语法/编码隐患。</aside>

\`\`\`javascript
 // 关键点 ①：字段映射 —— 中文 → 英文
const COLUMN_MAP = {
  "序号": "id",
  "姓名": "name",
  "性别": "gender",
  "生日": "birthday",
  "年龄": "age",
  "班级": "class",
};
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释：</strong>为什么不用中文 key？ (1) JS 引擎对中文标识符的容错性差（老浏览器报错）；(2) 后端、JSON、URL 编码都可能引入乱码； (3) IDE 自动补全、搜索、重构工具对中文支持不一致。 <strong>最佳实践</strong>：CSV 用人可读的中文名，JS 内部统一英文变量。</aside>

### 关键代码 ② 类型转换函数

<aside class="course-callout course-callout--code-purpose" role="note">CSV 加载后所有字段都是字符串，需要把序号/年龄 → Number，生日 → Date 对象。</aside>

\`\`\`javascript
 // 关键点 ②：类型转换函数 —— 用户原文「推荐方式」
function transformRow(d) {
  return {
    id:       +d["序号"],              // 一元 + 把字符串转 Number
    name:     d["姓名"].trim(),       // trim() 去掉首尾空白
    birthday: new Date(d["生日"]), // 字符串 → Date 对象
    age:      +d["年龄"],
    class:    d["班级"].trim(),
  };
}
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释：</strong> <code>+d["年龄"]</code> 是一元加运算符，是 JS 里把字符串转数字的最快写法（比 <code>Number()</code> / <code>parseInt()</code> 都短）； <code>new Date(str)</code> 能解析 <code>"2007-08-15"</code> 这类 ISO 格式，但对 <code>"2007/8/15"</code> 兼容性差，要用 <code>d3.timeParse("%Y-%m-%d")</code> 兜底。 <strong>坑</strong>：没有 <code>trim()</code> 的话，"软件工程1班 " 里的空格会让后续过滤/聚合出错。</aside>

### 关键代码 ③ d3.csv 第二参直接传 row 回调

\`\`\`javascript
 // 关键点 ③：一行完成加载 + 转换（用户原文「代码示例 1」）
const data = await d3.csv("data/newstudent.csv", transformRow);

// 验证类型确实转换了：
console.log(typeof data[0].age);        // "number"
console.log(data[0].birthday instanceof Date); // true
\`\`\`

<aside class="course-callout course-callout--key-point" role="note"><strong>关键点解释：</strong>d3.csv 是异步函数，必须 <code>await</code>。 第二参的 row 回调会在<strong>每一行解析后立即调用</strong>——比先 <code>await d3.csv(...)</code> 再 <code>.map(transformRow)</code> 更省内存（边读边转）。 <strong>异步加载的意义</strong>：不阻塞页面渲染，用户能继续交互。</aside>
`;export{e as default};