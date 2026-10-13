# 数据织坊 / Data Loom

HW03 · 双语可视化数据分析网站 / Bilingual visual data analysis website

站点地址 / Site address: https://vis.starlab.top/hw03/
English: https://vis.starlab.top/en/hw03/
本次部署验证状态见提交清单；源码与视频对应本地已验收版本。 / See the submission manifest for deployment verification; the source and video represent the locally verified version.

## 1. 把分析过程做成可观察的工作流 / Make analysis visible

左侧的数据集、字段与操作时间线可以展开或收起。工具按任务分区，也能用中文、英文或 pandas 函数名搜索。中心在概述与数据表之间切换；操作先预览，再应用，并展示行数、字段数和缺失值的变化。

Collapsible datasets, fields and an operation timeline sit on the left. Tools are organized by task and searchable in Chinese, English or by pandas function name. The center switches between overview and table. Operations are previewed before applying, with row, column and missing-value changes shown explicitly.

## 2. 覆盖常用 pandas 分析工作流 / Cover common pandas workflows

- 加载与清洗：CSV/TSV/JSON、Excel 多工作表、Parquet LIST、公开 URL；类型转换、批量命名、筛选、排序、去重、缺失填充、位置与时间插值。
- 索引与关联：单层/多层索引、loc/iloc、部分层重置与排序、索引重建、索引关联/拼接/算术对齐、多键关联和 merge_asof。
- 分组与变形：多字段多方法聚合、命名聚合、transform、组过滤/排名、分类 observed 策略、透视/交叉表、melt、explode、stack/unstack。
- 统计与时序：描述统计、分位数、频数、Pearson/Spearman/cov、公式与条件赋值、分箱与加权分层抽样、日期/时区/重采样、滚动/扩展/累计、加权窗口与时间 EWM。

- Load and clean: CSV/TSV/JSON, multiple Excel worksheets, Parquet LIST and public URLs; casts, batch naming, filtering, sorting, deduplication, missing-value filling and positional/time interpolation.
- Index and join: single/MultiIndex, loc/iloc, partial resets and sorting, reindexing, index joins/concatenation/arithmetic alignment, multi-key joins and merge_asof.
- Group and reshape: multiple keys/reducers, named aggregation, transform, group filtering/ranking, categorical observed policy, pivots/crosstabs, melt, explode and stack/unstack.
- Statistics and time: summaries, quantiles, frequencies, Pearson/Spearman/covariance, visual formulas/conditional assignment, binning/weighted stratified sampling, dates/zones/resampling, rolling/expanding/cumulative, weighted windows and time EWM.

## 3. 图形帮助理解结果 / Graphics explain results

相关矩阵联动原始散点，箱线图解释分布和异常值，关联与索引位置图说明重复和未匹配，层级迁移图与热力矩阵说明表形变化，列表长度图解释展开，时间趋势与权重曲线解释时序计算。运算使用完整数据；大图的显示采样有明确说明。

Correlation matrices link to source scatterplots; boxplots explain distributions and outliers. Join/index mapping shows duplicates and unmatched rows. Level transitions and heatmaps explain shape changes; list-length charts explain expansion. Time-series and weight curves explain temporal calculations. Computation uses complete data; chart sampling is stated explicitly.

## 4. 本地保存与复现 / Local persistence and reproduction

原始数据与操作步骤分开保存到浏览器 IndexedDB，计算通过 Worker 执行；解析后的完整表不重复落盘。支持刷新恢复、撤销/重做、时间线分支与工作区 JSON 备份。导出 CSV/JSON，也能导出包含原始输入和可见步骤的 Node.js 离线重放脚本。

Raw sources and operations are stored separately in browser IndexedDB; a Worker performs computation, without duplicating parsed tables on disk. Reload recovery, undo/redo, timeline branches and JSON workspace backups are supported. Export CSV/JSON or a self-contained Node.js script containing raw inputs and visible steps.

Python/pandas 版本为桥接脚本：需要 Node.js 20+ 与 pandas，先用内嵌引擎重放，再恢复 pandas 的行列索引、可空列及分类类型；并非逐步翻译为原生 pandas 调用。

The Python/pandas export is a bridge requiring Node.js 20+ and pandas. It replays the embedded engine, then restores pandas row/column indexes, nullable columns and categorical types. It does not translate every step into native pandas calls.

## 5. 一致双语与可验证边界 / Consistent languages and verified limits

中英文共用操作模型，工具、参数、错误、图形说明对应，切换语言保留分析状态。支持浅色/深色与窄屏侧栏收起。207 项测试全部通过，0 失败/跳过，包含数千组真实 pandas 对照；生产构建通过，并完成核心交互、备份与双语移动端浏览器验收。

Both languages share one operation model and corresponding tools, parameters, errors and chart explanations; analysis state survives language changes. Light/dark themes and a collapsible narrow-screen sidebar are supported. All 207 tests passed with no failures/skips, including thousands of real pandas differential configurations. Production builds and core interaction/backup/bilingual mobile browser checks passed.

单文件 10 MB，原始源合计 20 MB/20 个数据集，结果最多 100,000 行、200 列、2,000,000 单元格。整数使用 JavaScript 安全范围，日期精度为毫秒；浏览器正则和 Python 正则部分语法不同，本站抽样种子序列不等同 NumPy。完整 pandas dtype、任意 UDF 与全部 API 并未宣称兼容。详细覆盖见 `docs/hw03-coverage.md`。

Limits: 10 MB per file, 20 MB of raw sources/20 datasets, and 100,000 output rows/200 columns/2,000,000 cells. Integers use JavaScript's safe range and dates have millisecond precision. Browser/Python regex dialects differ, and seeded sampling is not NumPy's sequence. Full pandas dtypes, arbitrary UDFs and every API are not claimed compatible. See `docs/hw03-coverage.md` for detailed coverage.

## 6. 运行与提交 / Run and submit

项目构建需要 Node.js >=22.12 与 npm >=9.6.5。 / Project builds require Node.js >=22.12 and npm >=9.6.5.

```sh
npm ci
npm run check
npm run build
npm run preview -- --host 127.0.0.1
```

`dist/` 可部署到支持目录 `index.html` 的静态托管平台。`predev/prebuild` 自动生成离线重放引擎，无需手工维护生成文件。

Deploy `dist/` to a static host supporting directory `index.html` files. `predev/prebuild` generates the offline replay engine automatically.

提交材料包括网站链接、源码 ZIP、约 2 分 42 秒中文讲解视频（附字幕与章节）、本双语亮点文档；另外提供工作区备份和重放示例。

Submission materials include the website URL, source ZIP, a roughly 2-minute-42-second narrated Chinese video with subtitles/chapters, and this bilingual highlights document. Workspace and replay examples are also included.
