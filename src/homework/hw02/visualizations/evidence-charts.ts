import * as d3 from "d3";
import { recordById, formatRecord, type Lang } from "../content";

type Svg = d3.Selection<SVGSVGElement, null, HTMLElement, unknown>;
const colors = [
  "var(--hw-blue)",
  "var(--hw-mint)",
  "var(--hw-purple)",
  "var(--hw-orange)",
];
function label(
  svg: Svg,
  x: number,
  y: number,
  text: string,
  anchor = "start",
  size = 12,
) {
  return svg
    .append("text")
    .attr("x", x)
    .attr("y", y)
    .attr("text-anchor", anchor)
    .attr("fill", "var(--text-secondary)")
    .attr("font-size", size)
    .text(text);
}
export function drawEvidence(svg: Svg, w: number, kind: string, lang: Lang) {
  const en = lang === "en",
    t = (z: string, e: string) => (en ? e : z);
  if (kind === "enterprise" || kind === "robots" || kind === "exposure") {
    const ids =
      kind === "enterprise"
        ? ["eu-small", "eu-medium", "eu-large"]
        : kind === "robots"
          ? ["robots-cn", "robots-us", "robots-jp"]
          : ["exposure-low", "exposure-global", "exposure-high"];
    const rows = ids.map(recordById),
      max = kind === "enterprise" ? 60 : kind === "robots" ? 400000 : 40;
    const x = d3
      .scaleLinear()
      .domain([0, max])
      .range([14, w - 72]);
    rows.forEach((r, i) => {
      const y = 42 + i * 72;
      label(svg, 14, y - 14, r.label[lang], "start", 12);
      if (kind === "enterprise")
        label(
          svg,
          w - 8,
          y - 14,
          ["10–49", "50–249", "250+"][i] + t(" 人", " people"),
          "end",
          11,
        );
      svg
        .append("rect")
        .attr("x", 14)
        .attr("y", y)
        .attr("width", x(max) - 14)
        .attr("height", 16)
        .attr("rx", 8)
        .attr("fill", "var(--surface-muted)");
      svg
        .append("rect")
        .attr("x", 14)
        .attr("y", y)
        .attr("width", x(r.value) - 14)
        .attr("height", 16)
        .attr("rx", 8)
        .attr("fill", colors[i]);
      label(
        svg,
        x(r.value) + 8,
        y + 13,
        formatRecord(r.id, lang) + (kind === "robots" ? "" : "%"),
        "start",
        11,
      ).attr("fill", colors[i]);
    });
    svg
      .append("g")
      .attr("transform", "translate(0,252)")
      .call(
        d3
          .axisBottom(x)
          .ticks(w < 400 ? 3 : 5)
          .tickFormat((v) =>
            kind === "robots" ? `${Number(v) / 1000}k` : `${v}%`,
          ),
      );
    return kind === "enterprise"
      ? t(
          "大型与小型企业相差 38 个百分点。企业规模分组互不重叠。",
          "Large and small firms differ by 38 percentage points. Size groups do not overlap.",
        )
      : kind === "robots"
        ? t(
            "2025 年年度新增，约数保持原始精度；不代表 AI 直接造成的收益。",
            "Annual installations in 2025; approximations retain source precision. Not a causal AI benefit.",
          )
        : t(
            "全球最高暴露类别占 3.3%，属于总体暴露的子集，不能与 25% 相加。",
            "The global highest-exposure category is 3.3%, a subset of the 25% overall exposure, not an additional group.",
          );
  }
  if (kind === "medical") {
    const sections = [
      {
        ids: ["medical-detection-base", "medical-detection-ai"],
        title: t("癌症检出率", "Cancer detection"),
        max: 8,
      },
      {
        ids: ["medical-recall-base", "medical-recall-ai"],
        title: t("进一步检查率", "Recall for assessment"),
        max: 45,
      },
    ];
    sections.forEach((section, i) => {
      const y = i * 155,
        x = d3
          .scaleLinear()
          .domain([0, section.max])
          .range([16, w - 24]);
      label(
        svg,
        16,
        y + 20,
        section.title + " " + t("（每千人）", "(per 1,000)"),
      );
      const [a, b] = section.ids.map(recordById);
      svg
        .append("line")
        .attr("x1", x(a.value))
        .attr("x2", x(b.value))
        .attr("y1", y + 72)
        .attr("y2", y + 72)
        .attr("stroke", "var(--border-strong)")
        .attr("stroke-width", 3);
      [a, b].forEach((r, j) => {
        svg
          .append("circle")
          .attr("cx", x(r.value))
          .attr("cy", y + 72)
          .attr("r", 6)
          .attr("fill", colors[j]);
        label(
          svg,
          16,
          y + 43 + j * 65,
          `${j ? t("AI 辅助", "AI-assisted") : t("常规", "Standard")}: ${r.value}`,
          "start",
          11,
        ).attr("fill", colors[j]);
      });
      svg
        .append("g")
        .attr("transform", `translate(0,${y + 127})`)
        .call(d3.axisBottom(x).ticks(4));
    });
    return t(
      "研究关联：检出率提高；进一步检查率差异未达统计显著。两组图使用各自刻度，不表示治愈率。",
      "Study association: detection improved; the recall difference was not statistically significant. Separate scales; these are not cure rates.",
    );
  }
  if (kind === "developers") {
    const items = [
      {
        id: "dev-tasks",
        title: t(
          "企业实验 · 完成任务数",
          "Enterprise trials · completed tasks",
        ),
        detail: t(
          "4,867 人 · 2026 年发表",
          "4,867 developers · published 2026",
        ),
      },
      {
        id: "dev-time",
        title: t("熟悉项目 · 完成耗时", "Familiar projects · completion time"),
        detail: t(
          "16 人 / 246 个任务 · 2025 年早期",
          "16 developers / 246 tasks · early 2025",
        ),
      },
    ];
    items.forEach((item, i) => {
      const r = recordById(item.id),
        y = 170 * i,
        x = d3
          .scaleLinear()
          .domain([80, 150])
          .range([20, w - 24]);
      label(svg, 16, y + 20, item.title);
      label(svg, 16, y + 41, item.detail, "start", 10);
      svg
        .append("line")
        .attr("x1", x(100))
        .attr("x2", x(100 + r.value))
        .attr("y1", y + 80)
        .attr("y2", y + 80)
        .attr("stroke", colors[i ? 3 : 1])
        .attr("stroke-width", 4);
      label(svg, x(100), y + 65, "100", "middle", 10);
      label(svg, x(100 + r.value), y + 65, String(100 + r.value), "middle", 10);
      svg
        .append("circle")
        .attr("cx", x(100))
        .attr("cy", y + 80)
        .attr("r", 5)
        .attr("fill", "var(--surface)")
        .attr("stroke", "var(--text-subtle)");
      if (r.confidenceInterval) {
        svg
          .append("line")
          .attr("x1", x(100 + r.confidenceInterval[0]))
          .attr("x2", x(100 + r.confidenceInterval[1]))
          .attr("y1", y + 80)
          .attr("y2", y + 80)
          .attr("stroke", colors[3])
          .attr("stroke-width", 2);
      }
      svg
        .append("circle")
        .attr("cx", x(100 + r.value))
        .attr("cy", y + 80)
        .attr("r", 6)
        .attr("fill", colors[i ? 3 : 1]);
      label(
        svg,
        16,
        y + 111,
        `+${r.value}% · ${i ? t("耗时增加", "more time") : t("任务增加", "more tasks")}`,
        "start",
        12,
      ).attr("fill", colors[i ? 3 : 1]);
      label(
        svg,
        16,
        y + 132,
        i
          ? "95% CI: +2% … +39%"
          : t("标准误：10.3 个百分点", "SE: 10.3 percentage points"),
        "start",
        10,
      );
      label(
        svg,
        w - 24,
        y + 154,
        t("各研究基准 = 100", "Each study baseline = 100"),
        "end",
        10,
      );
    });
    return t(
      "指标与场景不同，不能平均或排名。METR 后续实验存在选择偏差，旧结果不能代表当前工具。",
      "Different measures and settings cannot be averaged or ranked. METR’s follow-up has selection bias; old results do not describe current tools.",
    );
  }
  return "";
}
