# 可视化导论作业

Astro 静态多页网站，使用 MDX 编写教学内容、Tailwind CSS 组织样式，按需使用 Starwind UI。无后端。

## 本地开发

```sh
npm install
npm run dev
```

## 检查与构建

```sh
npm run check
npm run build
npm run preview
```

构建产物在 `dist/`。静态托管需要支持目录下的 `index.html`，无需 SPA 回退规则。若部署到仓库子路径，在 `astro.config.mjs` 中设置 `base`；公共导航使用统一的基础路径函数。

## 内容组织

- `src/homework/hwNN/meta.ts`：每章唯一的标题、简介、状态和封面配置；`src/config/homework.ts` 汇总并提供 getHomework。
- `src/layouts/BaseLayout.astro`：导航、页面元信息与公共外壳。
- `src/layouts/ArticleLayout.astro`：About 与教程共用的文章排版；`DocumentLayout.astro` 从作业 ID 获取元信息。
- `src/pages/hw01/index.mdx`：HW1 的讲解、关键代码、展示三个标签内容。
- `src/components/HomeworkTabs.astro`：固定三标签页，可在后续 MDX 中复用。
- `src/homework/hw01/components/LayoutDemo.astro`：HW1 的布局实验，样式与脚本独立。
- `src/pages/[homework].astro`：仅为尚未完成的作业生成占位页。

新增作业时，创建并注册独立的 `meta.ts`，设置 `ready`、标题和简介，再创建对应 `src/pages/hwNN/index.mdx` 或 `index.astro`。占位路由会自动排除已完成作业，避免重复路径。大型可视化页面可直接使用 BaseLayout，不必使用文档布局。

三标签中的内容写在 MDX 的 `TabsContent` 内；交互演示作为独立 Astro 组件导入。全站为冷灰蓝浅色主题，不使用 emoji。后续图标统一使用已安装的 `@lucide/astro`，按需导入，不全量加载。

## 代码块与图标

MDX 围栏代码块由 Expressive Code 自动渲染，使用 GitHub Light 主题，提供语法高亮、复制按钮，以及 `title="layout.css"` 文件名标题。集成配置位于 `astro.config.mjs`，Expressive Code 排在 MDX 之前。

Lucide 已安装供后续界面使用，例如在 Astro 的 frontmatter 中 `import { ArrowRight } from "@lucide/astro"`，再渲染 `<ArrowRight size={18} aria-hidden="true" />`。装饰图标隐藏于辅助技术；仅图标按钮必须提供可访问名称。

## 新会话交接与文档目录

每份作业的新会话先读 [作业开发与交接指南](docs/HOMEWORK-HANDOFF.md)，其中包含可直接复制的提示词、小节级三标签 MDX 模板与验证要求。当前作业状态见 [HW1 交接](docs/hw01.md)。

文档页使用白底并预留右侧目录。自定义 remark 插件在构建时采集 Tab 外的 Markdown h2/h3，TableOfContents 组件负责展示、锚点与阅读位置高亮。目录少于两项时隐藏；当前 HW1 保留原有整章 Tab 结构，因此暂不显示目录。

## 中英文内容

- 中文沿用 `/`、`/about/`、`/hw01/` 等地址；英文使用 `/en/` 前缀。
- 导航的「中文 / EN」异步加载同页译文，无整页刷新；保留滚动位置、标签页、演示参数、主题、查询参数与章节锚点，支持浏览器前进后退。加载失败时保留当前页面并提示重试；禁用 JavaScript 时仍可通过普通链接访问。站内导航沿用当前语言。
- 通用界面文案位于 `src/i18n/index.ts`，首页、关于和占位页共用 `src/views/` 中的页面组件。
- HW01 英文全文位于 `src/pages/en/hw01/index.mdx`，与中文共用交互组件。修改章节结构时需同步两份 MDX，保证目录锚点对应。
- 验证：`npm run check && npm run build && node --test tests/*.test.mjs`。构建测试检查双语路由、内部链接、英文文案和章节对应关系。
