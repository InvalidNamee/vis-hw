import{D as e,Ht as t,On as n,T as r,Ut as i,_ as a,b as o,bt as s,ct as c,g as l,it as u,k as d,mt as f,o as p,tr as m,tt as h}from"./runtime-core.esm-bundler-DVRkMeDb.js";import{_ as g,t as _}from"./_plugin-vue_export-helper-cuMpPp_3.js";import{O as v}from"./index-B8EMWgck.js";import{t as y}from"./MarkdownView-u8yeaqcj.js";import{t as b}from"./TableOfContents-Bq4zMXBJ.js";var x=`《可视化导论》课程站用于课堂讲解、学生自学与可视化实践。课程来自中国石油大学（华东），授课教师为[李昕](https://cinger007.github.io)，主要参考教材为陈为《可视化导论》。

## 原来的课程站

原站使用 HTML、CSS、JavaScript ES modules 和 D3.js v7 编写，通过 CDN 加载 D3。课程以独立的 HTML 页面组织，页面中包含讲解、关键代码和交互演示，也配有讲义、图片、数据及补充案例。原版可以直接通过静态 HTTP 服务访问，开发时无需 npm 构建。

随着章节与案例增加，页面结构、教学内容、界面样式和演示逻辑分散在不同文件中，部分功能也存在重复实现。后续维护需要同时核对多份内容与代码。

## InvalidNamee 的重构

[InvalidNamee](https://github.com/invalidnamee) 在原站基础上，使用 **Vue 3、TypeScript 和 Vite** 重构了课程站，继续保留 D3 承担可视化计算与绘图。

重构将页面布局、课程内容、交互演示、数据处理和可视化算法分别组织，统一了导航、目录、语言切换、代码展示与加载状态。课程以整章文档呈现，每个小节分别保留「讲解 / 关键代码 / 演示」三个 Tab；手机端使用下拉导航和可展开的小节目录。

目前已迁移五章课程、覆盖五章的二十七个独立演示入口，以及十四个现存补充案例。原有课程正文、讲义、数据和教学说明予以保留；原站保留在项目的 Git 历史中。目录中原本缺失的两个补充案例继续单独排期。

运行依赖通过 npm 管理，并随构建打包。重构版需要先安装依赖、完成构建，再使用静态 HTTP 服务提供访问；核心演示不再依赖公共 CDN。

## 使用方式

### 课堂讲解与学生自学

从首页选择章节，在章节目录中定位小节，再切换该小节的讲解、关键代码或演示。目录会随滚动高亮当前小节，补充案例可通过导航单独打开。

教师可以结合讲义与演示授课，学生可以按章节顺序学习，并调整演示参数观察结果。五章的每个小节均提供独立演示入口，可从各章目录进入；独立页与课程页复用演示模块。项目目前没有为每章提供独立打包命令。

### 本地开发

安装 Node.js 后，在项目根目录执行：

\`\`\`bash
npm ci
npm run dev
\`\`\`

打开终端显示的地址即可进行开发和调试。

### 构建后使用 Python 启动

在项目根目录安装依赖并构建，然后进入生成的 \`dist\` 目录启动静态服务：

\`\`\`bash
npm ci
npm run build
cd dist
python -m http.server 8080
\`\`\`

在本机浏览器打开 \`http://localhost:8080/\`。如果系统中的 Python 命令是 \`python3\`，将最后一行改为 \`python3 -m http.server 8080\`。

局域网内的其他设备可通过 \`http://<本机局域网 IP>:8080/\` 访问，前提是设备之间可以互通，且防火墙允许访问该端口。

### 数据与离线使用

课程使用的新生 CSV、Crime 数据、图片及讲义等资源随构建一并提供，由浏览器通过 HTTP 服务加载。

首次安装依赖通常需要联网。**完成构建、保留完整的 \`dist\` 目录，并运行本地 HTTP 服务后，即使断开公网，也可以使用本地课程内容和核心演示。** 外部参考网站和链接仍需要网络。

这里的离线使用指本地部署，不代表访问过线上页面后就能自动断网打开。请通过 HTTP 地址访问构建产物，不要直接双击 \`index.html\`。
`,S=`Introduction to Visualization supports classroom teaching, self-study, and visualization practice. The course is from China University of Petroleum (East China), taught by [Li Xin](https://cinger007.github.io), with Chen Wei’s *Introduction to Visualization* as its main textbook.

## The original course site

The original site was written with HTML, CSS, JavaScript ES modules, and D3.js v7, loading D3 from a CDN. Separate HTML pages brought together explanations, key code, and interactive demonstrations, alongside lectures, images, datasets, and supplementary examples. The original version could run on a static HTTP server without an npm build step.

As chapters and examples grew, page structure, teaching content, styles, and demonstration logic were spread across different files, with some repeated implementations. Maintenance required checking multiple copies of content and code.

## The rebuild by InvalidNamee

[InvalidNamee](https://github.com/invalidnamee) rebuilt the course site with **Vue 3, TypeScript, and Vite**, retaining D3 for visualization calculations and drawing.

The rebuild separates page layouts, course content, interactive demonstrations, data processing, and visualization algorithms. It brings shared navigation, tables of contents, language switching, code display, and loading indicators to the site. Each chapter is a continuous document, with separate Explain / Key Code / Demo tabs for each section. On mobile, navigation uses a dropdown and the chapter’s section list can be expanded.

The five chapters, twenty-seven standalone demonstration entries across all chapters, and fourteen existing supplementary examples have been migrated. Original course text, lectures, data, and teaching explanations are retained; the original site is preserved in the project’s Git history. The two supplementary pages missing from the original site remain scheduled separately.

Runtime dependencies are managed through npm and bundled with the build. The rebuilt site requires dependency installation and a build before it can be served by a static HTTP server. Core demonstrations no longer depend on a public CDN.

## How to use

### Classroom teaching and self-study

Choose a chapter from the home page, locate a section using its table of contents, and switch between that section’s explanation, key code, and demonstration. The table of contents highlights the current section as you scroll. Supplementary examples have their own navigation entry.

Teachers can use the lectures alongside demonstrations. Students can follow the chapters and adjust demonstration parameters to explore the results. Each section in all five chapters also has a standalone demonstration entry, available from its chapter’s demo index. Standalone and course pages share the same demonstration modules. The project does not currently provide a separate build command for each chapter.

### Local development

Install Node.js, then run these commands in the project root:

\`\`\`bash
npm ci
npm run dev
\`\`\`

Open the address printed in the terminal to develop and debug the site.

### Build and serve with Python

Install dependencies and build in the project root, then enter the generated \`dist\` directory and start a static server:

\`\`\`bash
npm ci
npm run build
cd dist
python -m http.server 8080
\`\`\`

Open \`http://localhost:8080/\` on the same computer. If your system uses the \`python3\` command, replace the last line with \`python3 -m http.server 8080\`.

Other devices on the local network can visit \`http://<local IP address>:8080/\`, provided the devices can reach each other and the firewall allows access to that port.

### Data and offline use

Resources such as the student CSV, Crime data, images, and lectures are included in the build and loaded by the browser over HTTP.

Installing dependencies for the first time usually requires an internet connection. **Once the site is built, the complete \`dist\` directory is available, and a local HTTP server is running, local course content and core demonstrations can be used without public internet access.** External reference sites and links still require a network connection.

Offline use here means a local deployment. Visiting the online site does not automatically make it available offline. Access the build through its HTTP address rather than opening \`index.html\` directly.
`,C={class:`about-page page-shell`},w={class:`about-hero`},T={class:`about-hero-copy`},E={class:`about-eyebrow`},D={class:`about-course`},O={class:`about-hero-art`,viewBox:`0 0 320 240`,fill:`none`,"aria-hidden":`true`,focusable:`false`},k={class:`art-dots`},A=[`cx`,`cy`],j={class:`about-body`},M={class:`about-aside`},N={class:`about-aside-label`},P={id:`about-document`,class:`about-document`},F=[`id`],I={class:`about-section-heading`},L={class:`about-section-number`,"aria-hidden":`true`},R=_(d({__name:`AboutPage`,setup(d){let{t:_,locale:R}=v(),z=g();function B(){/^#about-\d+$/.test(z.hash)&&h(()=>document.getElementById(z.hash.slice(1))?.scrollIntoView({block:`start`}))}t(()=>z.hash,B,{immediate:!0,flush:`post`}),c(()=>window.addEventListener(`search-navigate`,B)),u(()=>window.removeEventListener(`search-navigate`,B));let V=l(()=>R.value===`en-US`?S:x),H=l(()=>{let[e=``,...t]=V.value.split(/^## /m);return{intro:e.trim(),sections:t.map((e,t)=>{let n=e.indexOf(`
`);return{id:`about-${t+1}`,number:String(t+1).padStart(2,`0`),title:(n===-1?e:e.slice(0,n)).trim(),body:n===-1?``:e.slice(n+1).trim()}})}}),U=l(()=>H.value.sections.map(e=>({id:e.id,label:e.title,href:`#${e.id}`})));function W(e){document.getElementById(e)?.scrollIntoView({block:`start`,behavior:window.matchMedia(`(prefers-reduced-motion: reduce)`).matches?`instant`:`smooth`})}return i(()=>{document.title=`${_(`portal.section.about`)} · ${_(`portal.title`)}`}),(t,i)=>(f(),o(`main`,C,[a(`header`,w,[a(`div`,T,[a(`p`,E,m(n(_)(`about.eyebrow`)),1),a(`h1`,null,m(n(_)(`portal.section.about`)),1),a(`p`,D,m(n(_)(`portal.title`)),1),e(y,{class:`about-intro`,source:H.value.intro},null,8,[`source`])]),(f(),o(`svg`,O,[a(`g`,k,[(f(),o(p,null,s(7,e=>(f(),o(p,{key:e},[(f(),o(p,null,s(9,t=>a(`circle`,{key:t,cx:24+(t-1)*34,cy:24+(e-1)*32,r:`1.6`},null,8,A)),64))],64))),64))]),i[0]||=r(`<path class="art-area" d="M24 196C70 196 84 120 132 128S196 70 238 82S282 40 300 36V216H24Z" data-v-7cd5d7dc></path><path class="art-curve" pathLength="1" d="M24 196C70 196 84 120 132 128S196 70 238 82S282 40 300 36" data-v-7cd5d7dc></path><path class="art-dash" d="M24 170L300 60" data-v-7cd5d7dc></path><rect class="art-bar art-bar-1" x="40" y="150" width="18" height="66" rx="4" data-v-7cd5d7dc></rect><rect class="art-bar art-bar-2" x="66" y="174" width="18" height="42" rx="4" data-v-7cd5d7dc></rect><rect class="art-bar art-bar-3" x="92" y="134" width="18" height="82" rx="4" data-v-7cd5d7dc></rect><circle class="art-node art-coral" cx="132" cy="128" r="7" data-v-7cd5d7dc></circle><circle class="art-node art-lemon" cx="238" cy="82" r="9" data-v-7cd5d7dc></circle><circle class="art-node art-primary" cx="300" cy="36" r="6" data-v-7cd5d7dc></circle><circle class="art-ring" cx="238" cy="82" r="18" data-v-7cd5d7dc></circle>`,10)]))]),a(`div`,j,[a(`aside`,M,[a(`p`,N,m(n(_)(`about.toc`)),1),e(b,{items:U.value,label:n(_)(`about.toc`),"content-id":`about-document`,onNavigate:W},null,8,[`items`,`label`])]),a(`div`,P,[(f(!0),o(p,null,s(H.value.sections,t=>(f(),o(`section`,{id:t.id,key:`${n(R)}-${t.id}`,class:`about-section surface-card`},[a(`header`,I,[a(`span`,L,m(t.number),1),a(`h2`,null,m(t.title),1)]),e(y,{source:t.body},null,8,[`source`])],8,F))),128))])])]))}}),[[`__scopeId`,`data-v-7cd5d7dc`]]);export{R as default};