# HW1 交接：网页空间布局

- 路由：/hw1/；入口：src/pages/hw1/index.mdx。
- 内容：盒模型、Grid、Flex、容器查询；教师要求“讲解 / 关键代码 / 展示”。
- 演示：src/components/LayoutDemo.astro，使用手写示例布局，没有外部数据。可调宽窄屏、侧栏宽度、间距并重置。
- 技术：MDX、Starwind Tabs、Expressive Code。Lucide 已安装，当前作业未使用图标。
- 当前结构：整章一个 HomeworkTabs。用户要求这次先不改 Tab 的结构和对齐，未来可在单独任务中拆成每小节一组。
- 文档页已改为白底，桌面预留右侧 TOC。因为所有标题位于 Tabs 内，目录为空并自动隐藏，这是预期行为。
- 改成小节级 Tabs 时，将 Markdown h2/h3 放到 Tabs 外；各小节保持相互独立，目录自动生成。
- 初版与 Expressive Code 接入已通过类型检查、静态构建与产物检查；未进行浏览器交互测试。
- 下一会话先阅读 docs/HOMEWORK-HANDOFF.md。不要直接复制当前整章 Tab 结构作为后续作业模板。
- 本轮 TOC 验证：2 项插件测试通过；临时 MDX 页面验证了真实编译、目录链接和锚点，以及 Tab 内标题排除。测试页面已删除。现有 4 个 Expressive Code 代码块保持正常。未进行浏览器交互测试。
