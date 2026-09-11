# 作业开发与新会话交接

## 给每个新会话的起始提示词

复制下面的模板，替换方括号。每份作业开启一个新的会话，先阅读本文和该作业已有文件，再实现。

> 在本仓库完成 HW[N]，主题是[主题]。请先阅读 README.md、docs/HOMEWORK-HANDOFF.md 和 docs/hw[NN].md（若存在）。材料与要求：[材料、数据来源、教师要求]。范围仅限本作业；复用现有公共布局与组件。内容使用 MDX，每个小节可有独立的“讲解 / 关键代码 / 展示”三个 Tab，不要把整章固定成一个 Tab 容器。图标按需使用 @lucide/astro，禁止 emoji。完成后检查静态构建，更新 docs/hw[NN].md，说明实现、验证、限制与下一步。不要自动发布。

## 已确定的约定

- Astro 静态多页，路由 `/hw01/` 至 `/hw10/`；没有后端。
- Tailwind CSS + Starwind 按需组件；冷灰蓝主题。首页为两列作业卡片，文档页为无外框白底。
- 公共导航与元信息由 BaseLayout 提供。文档页可使用 DocumentLayout，大型可视化可只使用 BaseLayout。
- 固定 Tab 名称与 value：讲解 `explanation`、关键代码 `code`、展示 `demo`。
- HomeworkTabs 是可复用的小节组件；每个实例独立，不设置共享 syncKey。
- 当前 HW1 暂时保留整章一个 HomeworkTabs，其结构与内部对齐未经本轮修改；不要把这个临时例子当作未来章节的约束。
- 代码块由 Expressive Code 渲染，可使用 title 属性标注文件名。不要用全局 pre/code 样式覆盖其内部元素。
- 已获准使用 Lucide：从 @lucide/astro 按需导入。装饰图标设 aria-hidden，仅图标按钮要有可访问名称。禁止 emoji。

## 新增作业

1. 在 src/pages/hwNN/index.mdx 创建入口，使用下方 frontmatter。
2. 将本章演示放到 src/components/hwNN/，数据放 public/data/hwNN/。不要覆盖其他作业的数据或组件。
3. 更新 src/config/homework.ts 中本章 title、description 和 ready。ready 为 true 时占位路由自动排除该章，必须同时提供真实入口。
4. 链接与数据 URL 兼容部署 base；导航使用 src/config/homework.ts 的 href。
5. 文档只陈述已实现的效果；数据示例注明来源，不能把示例当真实结果。

## MDX 示例：每小节一个独立三标签

以下结构可重复。小节标题必须在 HomeworkTabs 外，目录才能链接到始终可见的位置。

````mdx
---
layout: ../../layouts/DocumentLayout.astro
title: 本章标题
description: 本章简介
homework: hw02
category: 可选分类
---

import HomeworkTabs from '../../components/HomeworkTabs.astro';
import { TabsContent } from '../../components/starwind/tabs';

## 第一个小节

这里写小节的简短介绍。

<HomeworkTabs>
<TabsContent keepMounted value="explanation">
<div className="prose">

这里写讲解。Tab 内的标题不进入本章目录。

</div>
</TabsContent>
<TabsContent keepMounted value="code">
<div className="prose">

```css title="example.css"
.container { display: grid; }
```

</div>
</TabsContent>
<TabsContent keepMounted value="demo">
<div className="prose">

此处导入并放置本小节的演示组件。

</div>
</TabsContent>
</HomeworkTabs>

## 第二个小节

继续添加独立的 HomeworkTabs。
````

## TOC 的实现与边界

- src/plugins/remark-section-toc.mjs：自定义 remark 插件，在构建时收集 Markdown h2/h3，并写入 frontmatter.toc。不是第三方文档框架或 Astro 自带的 TOC 界面。
- 递归排除 HomeworkTabs、TabsContent 内的所有标题，包括嵌套内容。不采集组件动态生成的标题或手写 JSX h2/h3；目录小节请使用 Markdown 的 ## / ###。
- 标题生成 chapter-section-N 锚点，不受中文、重复标题影响。插入或重排小节会改变编号锚点，不应将其当作永久外链标识。
- src/components/TableOfContents.astro：接收静态 entries，输出原生锚点；浏览器脚本负责滚动高亮和折叠行为，点击不会切换任何 Tab。
- 少于两个目录项时不显示目录；桌面仍保留 200px 目录列和 48px 间隔。小于 1024px 时目录移到正文之前并默认折叠。
- HW1 当前所有标题都在 Tab 内，因此目录为空是预期行为。重组 HW1 必须另行获得任务授权。
- 不要手动填写 frontmatter.toc；插件每次构建都会覆盖它。

## 验证与交接

执行 npm run check 和 npm run build。确认新增路由生成、代码块与数据引用正常。涉及 TOC 插件变更时运行 node --test tests/remark-section-toc.test.mjs。

如进行浏览器测试，应检查多个 HomeworkTabs 独立切换、键盘 Tab/方向键、TOC 锚点与当前小节高亮、窄屏目录、隐藏演示区重新显示后的尺寸计算。未做的检查请明确标注，不要声称通过。

每份作业结束时创建或更新 docs/hwNN.md：

- 主题、教师要求、材料与数据来源。
- 本章文件、页面路由与启动方式。
- 已完成内容和可操作的演示。
- 对公共文件的修改及原因。
- 实际执行的检查和结果。
- 已知限制、未完成事项、下一会话的具体工作。

除非明确要求，不创建新任务、不部署、不重组其他章节。需要公共层改动时先核对其他章节兼容性。

## 文档正文统一排版

DocumentLayout 中的 `.document-content .prose` 统一控制正文：取消限宽居中，使用左对齐和 `16px 0 4px` 内边距，移除首尾多余 margin，并统一代码块间距。此规则同时覆盖普通 MDX 正文和 Tab 内正文；HomeworkTabs 只负责标签栏及面板，不单独定义 prose 排版。所有使用 DocumentLayout 的作业自动继承。

## 首页入口与章节封面

首页桌面三列、平板两列、手机单列。作业配置可选 `cover`（相对 public/ 的图片路径，例如 covers/hw01.webp）和 `coverAlt`；添加实际图片文件后即可显示 16:9 封面，没有封面时不显示图片占位。入口统一来自 homework.ts；首页提供开始阅读、About、博客、档案库与仓库链接。

文档页已删除“全部作业 / HWxx”面包屑，保留编号、标题和简介；返回首页使用公共导航的课程名称。
