# HW04 独立课程站接入

`cinger-vis-rebuild`保持独立的 Vue 源码；本项目登记作业入口、提供导航目录数据，并将课程构建产物作为 `public/hw04/` 副本提交到 Git。云端仅检出本仓库即可构建，无需课程源码。

默认目录：

```text
Projects/
├── vis-hw/
└── cinger-vis-rebuild/
```

普通使用只需在本项目执行 `npm ci`，然后运行 `npm run dev` 或 `npm run build`。这两个命令使用已提交的课程副本，不访问同级仓库。

更新课程时，两个项目分别安装依赖，在本项目运行 `npm run sync:hw04`。同步命令使用 `/hw04/` 基路径构建课程，清空旧副本后复制完整 `dist/`；随后提交 `public/hw04/` 的全部变化（包括旧哈希文件的删除），再触发云端构建。

可用环境变量：

- `HW04_SOURCE_DIR`：显式同步时的课程源码位置，默认使用同级 `cinger-vis-rebuild`。设置此变量会触发同步；云端常规部署无需设置。
- `HW04_DIST_DIR`：已构建课程目录；设置后跳过课程构建。CI 可以分别检出和构建课程项目，再传入此目录。应由支持悬浮导航的课程源码构建，推荐 `VITE_BASE_PATH=/hw04/ npm run build`。
- `VITE_HOMEWORK_SITE_URL`（课程构建时）：独立预览时悬浮导航的作业站地址，默认 `https://vis.starlab.top`；部署在 `/hw04/` 下时默认使用当前域名。

中文入口 `/hw04/` 通过 Astro 页面原样输出课程构建的 HTML，兼容开发服务与静态发布（开发服务不会自动把 public 子目录映射到 index.html），英文入口 `/en/hw04/` 跳转到 `/hw04/#/?lang=en`。五章课程仍使用 hash 路由，刷新无需额外路由回退。上传整个本项目 `dist/`，不要再手动往部署目录补文件。

课程项目的 `src/components/HomeworkNavigation.vue` 适配自本项目 `FloatingNavigation.astro`：相同的右下角圆形入口、单列作业菜单、原生 Popover、外链和语言切换。样式使用 Vue scoped CSS；标题通过本项目构建生成的 `/site-navigation.json` 读取，读取失败时六个作业入口仍可用。HW04 高亮并保留当前课程位置，切换语言调用课程自身的 i18n，保留课程路由和 Tab 参数。课程站目前只有浅色界面，因此悬浮球不提供无效的深色模式开关。

两个网站分别维护源码和依赖；浏览器中也没有通过 iframe 或注入主站全局 CSS 嵌套页面。课程内容和演示的原有行为保持独立。

`src/pages/hw04/[...path].astro` 根据课程构建中实际存在的 `index.html` 自动生成子目录入口，覆盖保留的独立演示和旧入口跳转页。开发访问与静态发布使用相同路径。课程项目已删除 `old/` 归档，重新同步时会清理旧产物；`/hw04/old/` 不再提供页面。
