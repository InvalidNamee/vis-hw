# HW03 提交说明 / Submission guide

生成的提交文件位于 `output/submission/`：

- `hw03-source.zip`：完整项目源码；不包含 node_modules、dist、用户已有 src.zip、私有目录或生成的提交材料。解压后进入 hw03-source，使用 Node.js >=22.12，执行 npm ci 与 npm run build。
- `hw03-static.zip`：可直接部署的 dist，压缩包根目录有 index.html；不需要服务器或 SPA 回退。
- `hw03-demo.mp4`：约 2 分 42 秒中文讲解，H.264/AAC，含字幕轨及六个章节；`hw03-demo.srt` 提供独立字幕。
- `hw03-highlights.pdf`：4 页双语亮点说明；可编辑文案在 docs/hw03-highlights.md。
- `demo-workspace.json` 与 `demo-analysis.mjs`：使用合成默认数据的备份和离线重放示例。
- `checksums.json`：交付文件大小与 SHA-256。线上版本核验与最终链接记录在提交目录的 submission.md。

Generated submission files are in `output/submission/`: source ZIP, static deployment ZIP, a roughly 2:42 narrated video with subtitles/chapters, a four-page bilingual highlights PDF, synthetic-data backup/replay examples, and SHA-256 checksums. The final links and deployment verification are recorded in that directory's submission.md.

重新生成源码和部署包 / Rebuild packages:

```sh
npm run build
python3 scripts/hw03-package.py
```

站点使用现有 EdgeOne Makers 域名 `vis.starlab.top`，中文入口 `/hw03/`，英文 `/en/hw03/`。只有线上页面的新版工具、脚本引擎和核心操作通过核验后，才将本次部署记为完成。

The existing EdgeOne Makers domain is `vis.starlab.top`, with `/hw03/` and `/en/hw03/`. Mark deployment complete only after the new tools, replay engine and core behavior are verified on the live site.
