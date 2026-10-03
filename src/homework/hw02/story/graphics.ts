import * as d3 from "d3";
import { dataset, recordById, formatRecord, type Lang } from "../content";
import { calculate, reviewBreakEven } from "../model.mjs";
import { drawEvidence } from "../visualizations/evidence-charts";
import type { Plot } from "../visualizations/quantitative-charts";
import type { StoryStep } from "./content";
import { sceneFamily, type SceneState } from "./state";

type G = d3.Selection<SVGGElement, string, SVGSVGElement, unknown>;
const blue = "var(--hw-blue)",
  mint = "var(--hw-mint)",
  orange = "var(--hw-orange)",
  purple = "var(--hw-purple)";
/** Presentation progress never interpolates measured values between studies. */
export function drawScrollPhase(
  svg: SVGSVGElement,
  step: StoryStep,
  phase: number,
  reduced: boolean,
) {
  const layer = d3.select(svg).select<SVGGElement>("g.story-plot-layer");
  const enter = reduced ? 1 : Math.min(1, 0.35 + phase * 5);
  layer
    .attr("opacity", enter)
    .attr("transform", reduced ? null : `translate(0,${(1 - enter) * 20})`);
  svg.dataset.scrollPhase = phase.toFixed(3);
  if (step.scene === "collaboration") {
    const nodes = Array.from(
      svg.querySelectorAll<SVGGElement>(".workflow-node"),
    );
    const index = step.focus ?? 0,
      current = nodes[index],
      next = nodes[Math.min(index + 1, nodes.length - 1)];
    if (current && next) {
      const a = current.transform.baseVal.consolidate()?.matrix,
        b = next.transform.baseVal.consolidate()?.matrix;
      const width = Number(
        current.querySelector("rect")?.getAttribute("width"),
      );
      const t = reduced ? 0 : Math.max(0, Math.min(1, (phase - 0.2) / 0.65));
      if (a && b)
        layer
          .select(".workflow-packet")
          .attr("cx", a.e + (b.e - a.e) * t + width / 2)
          .attr("cy", a.f + (b.f - a.f) * t - 10);
    }
  }
  if (sceneFamily(step) === "industry")
    layer
      .selectAll<SVGPathElement, unknown>(".industry-link")
      .attr("stroke-dasharray", function () {
        const length = this.getTotalLength();
        return `${length} ${length}`;
      })
      .attr("stroke-dashoffset", function () {
        return this.getTotalLength() * (1 - enter);
      });
}
export function explorableHeight(step: StoryStep, w: number) {
  const family = sceneFamily(step);
  return family === "collaboration"
    ? w < 500
      ? 360
      : 290
    : family === "industry"
      ? 380
      : family === "effects"
        ? 280
        : family === "mosaic"
          ? w >= 600
            ? 330
            : 370
          : family === "lab"
            ? 350
            : family === "infrastructure"
              ? 300
              : family === "energy"
                ? 290
                : family === "exposure"
                  ? 330
                  : step.scene === "medical"
                    ? 310
                    : 340;
}
function text(
  g: G,
  key: string,
  x: number,
  y: number,
  value: string,
  size = 12,
  color = "var(--text-secondary)",
  anchor = "start",
) {
  return g
    .selectAll<SVGTextElement, string>(`text[data-text="${key}"]`)
    .data([key])
    .join("text")
    .attr("data-text", key)
    .attr("x", x)
    .attr("y", y)
    .attr("font-size", size)
    .attr("fill", color)
    .attr("text-anchor", anchor)
    .text(value);
}
export function drawExplorable(
  svg: Plot,
  w: number,
  step: StoryStep,
  lang: Lang,
  state: SceneState,
  animate = true,
) {
  const family = sceneFamily(step),
    h = explorableHeight(step, w),
    ms =
      animate && !matchMedia("(prefers-reduced-motion:reduce)").matches
        ? 650
        : 0;
  svg
    .attr("viewBox", `0 0 ${w} ${h}`)
    .attr("role", "img")
    .attr("data-plot-family", family);
  // The SVG and current layer survive updates. Keys identify real objects, not screen positions.
  svg
    .selectAll<SVGGElement, string>("g.story-plot-layer")
    .filter((d) => d !== family)
    .interrupt()
    .remove();
  const g = svg
    .selectAll<SVGGElement, string>("g.story-plot-layer")
    .data([family], (d) => d)
    .join("g")
    .attr("class", "story-plot-layer");
  if (family === "collaboration") workflow(g, w, state, step, lang, ms);
  else if (family === "industry") industry(g, w, state, lang, ms);
  else if (family === "effects") effects(g, w, state, lang, ms);
  else if (family === "mosaic") mosaic(g, w, step, state, lang, ms);
  else if (family === "lab") lab(g, w, state, lang, ms);
  else if (family === "infrastructure") foundation(g, w, state, lang, ms);
  else if (family === "energy") energy(g, w, state, lang, ms);
  else if (family === "exposure") exposure(g, w, state, lang, ms);
  else {
    // Different studies keep their independent scales. Rebuild only this isolated layer.
    const key = `${w}-${lang}-${family}`;
    if (g.attr("data-evidence-key") !== key) {
      g.selectAll("*").remove();
      g.attr("data-evidence-key", key);
      const inner = g
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("viewBox", `0 0 ${w} ${h}`);
      drawEvidence(inner as unknown as Plot, w, step.scene, lang);
      if (ms)
        inner.attr("opacity", 0.3).transition().duration(ms).attr("opacity", 1);
    }
  }
  return h;
}
function workflow(
  g: G,
  w: number,
  s: SceneState,
  step: StoryStep,
  lang: Lang,
  ms: number,
) {
  const en = lang === "en",
    mobile = w < 500,
    phase = step.focus ?? 0;
  const names = en
    ? ["Find knowledge", "AI draft", "Human review", "Deliver"]
    : ["查找知识", "AI 草稿", "人的复核", "服务交付"];
  const details = en
    ? ["Documents", "Suggestion", "Check context", "Resolve issue"]
    : ["文档与经验", "生成建议", "检查情境", "解决问题"];
  const nodes = names.map((label, i) => ({
    id: i,
    label,
    detail: details[i],
    x: mobile ? 24 + ((i % 2) * (w - 48)) / 2 : 18 + (i * (w - 36)) / 4,
    y: mobile ? 45 + Math.floor(i / 2) * 105 : 65,
    width: mobile ? (w - 64) / 2 : (w - 62) / 4,
  }));
  const links = nodes
    .slice(0, -1)
    .map((a, i) => ({ id: i, a, b: nodes[i + 1] }));
  g.selectAll<SVGPathElement, (typeof links)[number]>("path.workflow-link")
    .data(links, (d) => d.id)
    .join("path")
    .attr("class", "workflow-link")
    .attr(
      "d",
      (d) =>
        `M${d.a.x + d.a.width / 2},${d.a.y + 30} L${d.b.x + d.b.width / 2},${d.b.y + 30}`,
    )
    .attr("fill", "none")
    .attr("stroke", blue)
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4 5")
    .attr("opacity", (d) => (d.id < phase + 0.1 ? 0.6 : 0.15));
  const node = g
    .selectAll<SVGGElement, (typeof nodes)[number]>("g.workflow-node")
    .data(nodes, (d) => d.id)
    .join((enter) => {
      const n = enter.append("g").attr("class", "workflow-node");
      n.append("rect");
      n.append("text").attr("class", "name");
      n.append("text").attr("class", "detail");
      return n;
    });
  node
    .transition()
    .duration(ms)
    .attr("transform", (d) => `translate(${d.x},${d.y})`);
  node
    .select("rect")
    .attr("height", 65)
    .attr("width", (d) => d.width)
    .attr("rx", 12)
    .attr("stroke", (d) => (d.id === phase ? blue : "var(--border-strong)"))
    .attr("stroke-width", (d) => (d.id === phase ? 2 : 1))
    .transition()
    .duration(ms)
    .attr("fill", (d) =>
      d.id === phase ? "var(--accent-soft)" : "var(--surface)",
    )
    .attr("opacity", (d) => (d.id <= phase + 1 ? 1 : 0.45));
  node
    .select("text.name")
    .attr("x", (d) => d.width / 2)
    .attr("y", 26)
    .attr("text-anchor", "middle")
    .attr("fill", "var(--text-primary)")
    .attr("font-size", mobile ? 11 : 12)
    .text((d) => d.label);
  node
    .select("text.detail")
    .attr("x", (d) => d.width / 2)
    .attr("y", 47)
    .attr("text-anchor", "middle")
    .attr("fill", "var(--text-secondary)")
    .attr("font-size", 10)
    .text((d) => d.detail);
  const packet = g
    .selectAll<SVGCircleElement, number>("circle.workflow-packet")
    .data([0])
    .join("circle")
    .attr("class", "workflow-packet")
    .attr("r", 5)
    .attr("fill", s.reviewed ? mint : blue);
  packet
    .transition()
    .duration(ms)
    .attr("cx", nodes[phase].x + nodes[phase].width / 2)
    .attr("cy", nodes[phase].y - 10);
  const y = mobile ? 280 : 185;
  g.selectAll("rect.draft-card")
    .data([0])
    .join("rect")
    .attr("class", "draft-card")
    .attr("x", 18)
    .attr("y", y - 35)
    .attr("width", w - 36)
    .attr("height", 70)
    .attr("rx", 10)
    .attr("fill", "var(--surface-muted)")
    .attr("stroke", s.reviewed ? mint : orange);
  text(
    g,
    "draft-title",
    30,
    y - 13,
    en ? "A CUSTOMER ASKS ABOUT A REPLACEMENT" : "客户询问：商品能直接换新吗？",
    10,
  );
  text(
    g,
    "draft-copy",
    30,
    y + 12,
    s.reviewed
      ? en
        ? "Check purchase date and warranty first."
        : "先核对购买时间与保修条件，再确认换新。"
      : phase === 0
        ? en
          ? "What information do we need first?"
          : "需要哪些信息，才能判断是否可以换新？"
        : en
          ? "AI draft: “Replace it immediately.”"
          : "AI 草稿：“可以直接换新。”",
    w < 400 ? 11 : 13,
    s.reviewed ? mint : orange,
  );
  if (phase === 2)
    text(
      g,
      "result",
      18,
      mobile ? 355 : 280,
      `+${formatRecord("support", lang)}% · ${en ? "observed average in the support study" : "客服研究总体平均提升"}`,
      12,
      blue,
    );
  else g.select('text[data-text="result"]').remove();
}
function industry(g: G, w: number, s: SceneState, lang: Lang, ms: number) {
  const cases = dataset.cases,
    capabilities = dataset.capabilities,
    nw = Math.min(156, w * 0.38),
    lx = 18,
    rx = w - nw - 18;
  const nodes = [
    ...cases.map((c, i) => ({
      id: c.id,
      label: c.name[lang],
      x: lx,
      y: 38 + i * 57,
      group: 0,
    })),
    ...capabilities.map((c, i) => ({
      id: c.id,
      label: c.name[lang],
      x: rx,
      y: 58 + i * 65,
      group: 1,
    })),
  ];
  const related = cases.find((c) => c.id === s.industry)!.capabilities;
  const links = cases.flatMap((c) =>
    c.capabilities.map((cap) => ({
      id: c.id + "-" + cap,
      industry: c.id,
      a: nodes.find((n) => n.id === c.id)!,
      b: nodes.find((n) => n.id === cap)!,
    })),
  );
  g.selectAll<SVGPathElement, (typeof links)[number]>("path.industry-link")
    .data(links, (d) => d.id)
    .join("path")
    .attr("class", "industry-link")
    .attr(
      "d",
      (d) =>
        `M${d.a.x + nw},${d.a.y + 20} C${w / 2},${d.a.y + 20} ${w / 2},${d.b.y + 20} ${d.b.x},${d.b.y + 20}`,
    )
    .attr("fill", "none")
    .attr("stroke", blue)
    .transition()
    .duration(ms)
    .attr("stroke-width", (d) => (d.industry === s.industry ? 3 : 1))
    .attr("opacity", (d) => (d.industry === s.industry ? 1 : 0.14));
  const n = g
    .selectAll<SVGGElement, (typeof nodes)[number]>("g.industry-node")
    .data(nodes, (d) => d.id)
    .join((enter) => {
      const n = enter.append("g").attr("class", "industry-node");
      n.append("rect");
      n.append("text");
      return n;
    })
    .attr("transform", (d) => `translate(${d.x},${d.y})`);
  n.select("rect")
    .attr("width", nw)
    .attr("height", 40)
    .attr("rx", 9)
    .attr("stroke", (d) => (d.group ? mint : blue))
    .transition()
    .duration(ms)
    .attr("fill", (d) => (d.id === s.industry ? blue : "var(--surface)"))
    .attr("opacity", (d) =>
      d.id === s.industry || related.includes(d.id) ? 1 : 0.5,
    );
  n.select("text")
    .attr("x", nw / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .attr("font-size", w < 450 ? 10 : 12)
    .attr("fill", (d) =>
      d.id === s.industry ? "var(--hw-on-blue)" : d.group ? mint : blue,
    )
    .text((d) => d.label);
  const roles =
    s.industry === "science"
      ? lang === "en"
        ? ["Candidate", "Predict", "Validate"]
        : ["候选对象", "结构预测", "实验确认"]
      : s.industry === "health"
        ? lang === "en"
          ? ["Image", "Flag", "Review"]
          : ["影像输入", "识别可疑", "医生复核"]
        : lang === "en"
          ? ["Product", "Flag", "Act"]
          : ["产品图像", "识别异常", "产线处置"];
  const fw = (w - 60) / 3;
  g.selectAll<SVGLineElement, number>("line.task-link")
    .data([0, 1])
    .join("line")
    .attr("class", "task-link")
    .attr("x1", (i) => 18 + i * (fw + 12) + fw)
    .attr("x2", (i) => 18 + (i + 1) * (fw + 12))
    .attr("y1", 339)
    .attr("y2", 339)
    .attr("stroke", mint)
    .attr("stroke-width", 2);
  const task = g
    .selectAll<SVGGElement, number>("g.task-path")
    .data([0, 1, 2], (d) => d)
    .join((enter) => {
      const n = enter.append("g").attr("class", "task-path");
      n.append("rect");
      n.append("text");
      return n;
    })
    .attr("transform", (i) => `translate(${18 + i * (fw + 12)},320)`);
  task
    .select("rect")
    .attr("width", fw)
    .attr("height", 38)
    .attr("rx", 7)
    .attr("stroke", mint)
    .transition()
    .duration(ms)
    .attr("fill", (_, i) =>
      i === 2 ? "var(--accent-soft)" : "var(--surface)",
    );
  task
    .select("text")
    .attr("x", fw / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("fill", "var(--text-primary)")
    .attr("font-size", w < 400 ? 10 : 12)
    .text((i) => roles[i]);
  text(
    g,
    "scale",
    w / 2,
    373,
    lang === "en"
      ? "Connections show applications, not measured gains."
      : "连线表示应用关系，不编码实测收益。",
    10,
    "var(--text-secondary)",
    "middle",
  );
}
function effects(g: G, w: number, s: SceneState, lang: Lang, ms: number) {
  const en = lang === "en",
    rows = [
      {
        id: "time",
        label: en ? "Completion time" : "完成时间",
        color: blue,
        y: 75,
      },
      {
        id: "quality",
        label: en ? "Quality score" : "质量评分",
        color: mint,
        y: 182,
      },
    ],
    x = d3
      .scaleLinear()
      .domain([0, 130])
      .range([18, w - 45]);
  const groups = g
    .selectAll<SVGGElement, (typeof rows)[number]>("g.effect-row")
    .data(rows, (d) => d.id)
    .join((enter) => {
      const r = enter.append("g").attr("class", "effect-row");
      r.append("text").attr("class", "row-label");
      r.append("rect").attr("class", "baseline");
      r.append("rect").attr("class", "assisted");
      r.append("text").attr("class", "value");
      return r;
    });
  groups
    .attr("transform", (d) => `translate(0,${d.y})`)
    .transition()
    .duration(ms)
    .attr("opacity", (d) => (d.id === "quality" && !s.compare ? 0.2 : 1));
  groups
    .select("text.row-label")
    .attr("x", 18)
    .attr("y", -16)
    .attr("fill", "var(--text-primary)")
    .attr("font-size", 13)
    .text((d) => d.label);
  groups
    .select("rect.baseline")
    .attr("x", 18)
    .attr("y", 0)
    .attr("width", x(100) - 18)
    .attr("height", 10)
    .attr("fill", "var(--border-strong)")
    .attr("rx", 4);
  groups
    .select("rect.assisted")
    .attr("x", 18)
    .attr("y", 17)
    .attr("height", 20)
    .attr("rx", 4)
    .attr("fill", (d) => d.color)
    .transition()
    .duration(ms)
    .attr(
      "width",
      (d) =>
        x(
          d.id === "quality" && !s.compare ? 100 : 100 + recordById(d.id).value,
        ) - 18,
    );
  groups
    .select("text.value")
    .attr("x", w - 10)
    .attr("y", 31)
    .attr("text-anchor", "end")
    .attr("fill", (d) => d.color)
    .attr("font-size", 18)
    .text((d) =>
      d.id === "quality" && !s.compare
        ? "?"
        : String(100 + recordById(d.id).value),
    );
  text(
    g,
    "reference",
    18,
    260,
    en
      ? "Grey: baseline 100 · Color: AI-assisted"
      : "灰色：原基准100 · 彩色：AI辅助",
    11,
  );
}
function mosaic(
  g: G,
  w: number,
  step: StoryStep,
  s: SceneState,
  lang: Lang,
  ms: number,
) {
  const en = lang === "en",
    record = recordById(
      step.scene === "adoption" ? `adoption-${s.year}` : s.firm,
    ),
    columns = w >= 600 ? 20 : 10,
    size = Math.min(columns === 20 ? 32 : 21, (w - 36) / columns - 5),
    gap = 5,
    span = columns * (size + gap) - gap,
    left = (w - span) / 2,
    top = 79;
  const cells = d3
    .range(100)
    .map((i) => ({
      id: i,
      fraction: Math.max(0, Math.min(1, record.value - i)),
    }));
  const nodes = g
    .selectAll<SVGGElement, (typeof cells)[number]>("g.mosaic-cell")
    .data(cells, (d) => d.id)
    .join((enter) => {
      const n = enter.append("g").attr("class", "mosaic-cell");
      n.append("rect").attr("class", "empty");
      n.append("rect").attr("class", "filled");
      return n;
    })
    .attr(
      "transform",
      (d) =>
        `translate(${left + (d.id % columns) * (size + gap)},${top + Math.floor(d.id / columns) * (size + gap)})`,
    );
  nodes
    .select("rect.empty")
    .attr("width", size)
    .attr("height", size)
    .attr("rx", 3)
    .attr("fill", "var(--surface-muted)")
    .attr("stroke", "var(--border-soft)");
  nodes
    .select("rect.filled")
    .attr("height", size)
    .attr("rx", 3)
    .attr("fill", step.scene === "adoption" ? blue : mint)
    .transition()
    .duration(ms)
    .delay((d) => (ms ? d.id * 3 : 0))
    .attr("width", (d) => size * d.fraction);
  text(
    g,
    "population",
    w / 2,
    22,
    step.scene === "adoption"
      ? `${s.year} · ${en ? "SURVEYED ORGANIZATIONS" : "受访组织"}`
      : `2025 · ${record.label[lang]}`,
    w < 400 ? 11 : 13,
    "var(--text-secondary)",
    "middle",
  );
  text(
    g,
    "percentage",
    w / 2,
    59,
    `${formatRecord(record.id, lang)}%`,
    30,
    step.scene === "adoption" ? blue : mint,
    "middle",
  );
  text(
    g,
    "units",
    w / 2,
    columns === 20 ? 319 : 359,
    en
      ? "100 cells = 100%; a partial cell preserves decimals."
      : "100格代表100%；不足1%的部分按比例填充。",
    10,
    "var(--text-secondary)",
    "middle",
  );
}
function lab(g: G, w: number, s: SceneState, lang: Lang, ms: number) {
  const en = lang === "en",
    result = calculate({
      tasks: 20,
      adoption: s.adoption,
      speed: s.speed,
      review: s.review,
    }),
    colors = [blue, mint, purple, orange],
    names = en
      ? ["Brief", "Produce", "Review", "Deliver"]
      : ["需求", "生产", "复核", "交付"],
    x = d3
      .scaleLinear()
      .domain([0, 85 * 20])
      .range([18, w - 20]);
  const segments = [result.baseline, result.assisted].flatMap((values, row) => {
    let start = 0;
    return values.map((value, i) => {
      const d = { id: `${row}-${i}`, row, i, value, start };
      start += value;
      return d;
    });
  });
  const n = g
    .selectAll<SVGGElement, (typeof segments)[number]>("g.time-segment")
    .data(segments, (d) => d.id)
    .join((enter) => {
      const n = enter.append("g").attr("class", "time-segment");
      n.append("rect");
      n.append("text");
      return n;
    });
  n.transition()
    .duration(ms)
    .attr("transform", (d) => `translate(${x(d.start)},${d.row ? 153 : 65})`);
  n.select("rect")
    .attr("height", 36)
    .attr("rx", 4)
    .attr("fill", (d) => colors[d.i])
    .attr("opacity", (d) => (d.row ? 0.8 : 0.32))
    .transition()
    .duration(ms)
    .attr("width", (d) => Math.max(1, x(d.start + d.value) - x(d.start) - 2));
  n.select("text")
    .attr("y", 57)
    .attr("font-size", 10)
    .attr("fill", "var(--text-secondary)")
    .attr("text-anchor", "middle")
    .text((d) => `${(d.value / 60).toFixed(1)}h`)
    .transition()
    .duration(ms)
    .attr("x", (d) => (x(d.start + d.value) - x(d.start)) / 2);
  text(
    g,
    "baseline",
    18,
    48,
    `${en ? "Baseline" : "原流程"} · ${(result.baseTotal / 60).toFixed(1)}h`,
    12,
  );
  text(
    g,
    "scenario",
    18,
    137,
    `${en ? "Your scenario" : "当前情景"} · ${(result.aiTotal / 60).toFixed(1)}h`,
    12,
  );
  const axis = g
    .selectAll<SVGGElement, string>("g.effort-axis")
    .data(["axis"])
    .join("g")
    .attr("class", "effort-axis")
    .attr("transform", "translate(0,235)");
  axis.call(
    d3
      .axisBottom(x)
      .ticks(w < 400 ? 3 : 5)
      .tickFormat((v) => `${(Number(v) / 60).toFixed(0)}h`),
  );
  text(
    g,
    "saving",
    18,
    285,
    `${result.saved.toFixed(1)}%`,
    32,
    result.saved < 0 ? orange : mint,
  );
  text(
    g,
    "saving-label",
    w - 20,
    281,
    en ? "EFFORT SAVED" : "节省总工时",
    11,
    "var(--text-secondary)",
    "end",
  );
  const boundary = reviewBreakEven(s);
  text(
    g,
    "boundary",
    18,
    311,
    `${en ? "Break-even review" : "复核临界点"} ${boundary.toFixed(1)} ${en ? "min/task" : "分钟/任务"}`,
    11,
  );
  const legend = g
    .selectAll<SVGGElement, string>("g.segment-legend")
    .data(names)
    .join((enter) => {
      const n = enter.append("g").attr("class", "segment-legend");
      n.append("circle");
      n.append("text");
      return n;
    })
    .attr("transform", (_, i) => `translate(${18 + (i * (w - 36)) / 4},338)`);
  legend
    .select("circle")
    .attr("r", 4)
    .attr("fill", (_, i) => colors[i]);
  legend
    .select("text")
    .attr("x", 9)
    .attr("y", 4)
    .attr("font-size", w < 400 ? 9 : 11)
    .attr("fill", "var(--text-secondary)")
    .text((d) => d);
}
function foundation(g: G, w: number, s: SceneState, lang: Lang, ms: number) {
  const available = [s.power, s.compute, s.data],
    ready = available.every(Boolean);
  const labels =
      lang === "en"
        ? ["Power", "Compute", "Data", "Applications"]
        : ["电力", "算力", "数据", "产业应用"],
    nx = [w * 0.18, w * 0.5, w * 0.82],
    ny = [68, 68, 68];
  const lines = nx.map((x, i) => ({ id: i, x }));
  g.selectAll<SVGPathElement, (typeof lines)[number]>("path.resource-link")
    .data(lines, (d) => d.id)
    .join("path")
    .attr("class", "resource-link")
    .attr("d", (d) => `M${d.x},103 Q${d.x},167 ${w / 2},202`)
    .attr("fill", "none")
    .attr("stroke", (d) => [blue, mint, purple][d.id])
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5 5")
    .transition()
    .duration(ms)
    .attr("opacity", (d) => (available[d.id] ? 1 : 0.15));
  const nodes = [
    ...nx.map((x, i) => ({ id: i, x, y: ny[i], label: labels[i], r: 32 })),
    { id: 3, x: w / 2, y: 227, label: labels[3], r: 45 },
  ];
  const n = g
    .selectAll<SVGGElement, (typeof nodes)[number]>("g.resource-node")
    .data(nodes, (d) => d.id)
    .join((enter) => {
      const n = enter.append("g").attr("class", "resource-node");
      n.append("circle");
      n.append("text");
      return n;
    })
    .attr("transform", (d) => `translate(${d.x},${d.y})`);
  n.select("circle")
    .attr("stroke", (_, i) => [blue, mint, purple, orange][i])
    .transition()
    .duration(ms)
    .attr("fill", (d) =>
      d.id === 3 && ready ? "var(--accent-soft)" : "var(--surface)",
    )
    .attr("r", (d) => d.r)
    .attr("opacity", (d) => (d.id === 3 || available[d.id] ? 1 : 0.3));
  n.select("text")
    .attr("text-anchor", "middle")
    .attr("y", 4)
    .attr("font-size", 12)
    .attr("fill", "var(--text-primary)")
    .text((d) =>
      d.id === 3 && !ready ? (lang === "en" ? "Blocked" : "等待条件") : d.label,
    );
  text(
    g,
    "foundation",
    w / 2,
    294,
    lang === "en"
      ? "Skills and workflows connect resources to value."
      : "人才与流程，把资源连接到价值。",
    11,
    "var(--text-secondary)",
    "middle",
  );
}
function energy(g: G, w: number, s: SceneState, lang: Lang, ms: number) {
  const en = lang === "en",
    rows = ["energy-2025", "energy-2030"].map(recordById),
    max = 1000,
    barw = Math.min(130, w * 0.28),
    top = 59,
    bottom = 239;
  const n = g
    .selectAll<SVGGElement, (typeof rows)[number]>("g.energy-column")
    .data(rows, (d) => d.id)
    .join((enter) => {
      const n = enter.append("g").attr("class", "energy-column");
      n.append("rect").attr("class", "capacity");
      n.append("rect").attr("class", "level");
      n.append("text").attr("class", "value");
      n.append("text").attr("class", "year");
      n.append("text").attr("class", "kind");
      return n;
    })
    .attr(
      "transform",
      (_, i) => `translate(${w * (i ? 0.7 : 0.3) - barw / 2},0)`,
    );
  n.select("rect.capacity")
    .attr("x", 0)
    .attr("y", top)
    .attr("width", barw)
    .attr("height", bottom - top)
    .attr("fill", "var(--surface-muted)")
    .attr("rx", 10);
  n.select("rect.level")
    .attr("width", barw)
    .attr("rx", 8)
    .attr("stroke", (_, i) => (i ? orange : blue))
    .attr("stroke-dasharray", (_, i) => (i ? "5 4" : null))
    .attr("fill", (_, i) => (i ? "var(--surface)" : blue))
    .transition()
    .duration(ms)
    .attr(
      "y",
      (d, i) =>
        bottom - ((!i || s.forecast ? d.value : 0) / max) * (bottom - top),
    )
    .attr(
      "height",
      (d, i) => ((!i || s.forecast ? d.value : 0) / max) * (bottom - top),
    );
  n.select("text.value")
    .attr("x", barw / 2)
    .attr("y", 37)
    .attr("text-anchor", "middle")
    .attr("fill", (_, i) => (i ? orange : blue))
    .attr("font-size", 22)
    .text((d, i) => (i && !s.forecast ? "?" : formatRecord(d.id, lang)));
  n.select("text.year")
    .attr("x", barw / 2)
    .attr("y", 262)
    .attr("text-anchor", "middle")
    .attr("fill", "var(--text-primary)")
    .attr("font-size", 12)
    .text((_, i) => (i ? "2030" : "2025"));
  n.select("text.kind")
    .attr("x", barw / 2)
    .attr("y", 282)
    .attr("text-anchor", "middle")
    .attr("fill", "var(--text-secondary)")
    .attr("font-size", 10)
    .text((_, i) =>
      i
        ? en
          ? "Central projection"
          : "中央情景预测"
        : en
          ? "Historical estimate"
          : "历史估计",
    );
  text(
    g,
    "energy-unit",
    w / 2,
    16,
    en ? "ALL DATA CENTRES · TWh" : "全部数据中心 · TWh",
    11,
    "var(--text-secondary)",
    "middle",
  );
}
function exposure(g: G, w: number, s: SceneState, lang: Lang, ms: number) {
  const en = lang === "en",
    overall = recordById(s.exposure).value,
    highest =
      s.exposure === "exposure-global"
        ? recordById("exposure-highest").value
        : 0,
    size = Math.min(20, (w - 36) / 10 - 5),
    gap = 5,
    left = (w - (size + gap) * 10 + gap) / 2;
  const cells = d3
    .range(100)
    .map((i) => ({
      id: i,
      part: Math.max(0, Math.min(1, overall - i)),
      high: Math.max(0, Math.min(1, highest - i)),
    }));
  const n = g
    .selectAll<SVGGElement, (typeof cells)[number]>("g.exposure-cell")
    .data(cells, (d) => d.id)
    .join((enter) => {
      const n = enter.append("g").attr("class", "exposure-cell");
      n.append("rect").attr("class", "empty");
      n.append("rect").attr("class", "part");
      n.append("rect").attr("class", "high");
      return n;
    })
    .attr(
      "transform",
      (d) =>
        `translate(${left + (d.id % 10) * (size + gap)},${55 + Math.floor(d.id / 10) * (size + gap)})`,
    );
  n.select("rect.empty")
    .attr("width", size)
    .attr("height", size)
    .attr("rx", 3)
    .attr("fill", "var(--surface-muted)")
    .attr("stroke", "var(--border-soft)");
  for (const key of ["part", "high"] as const)
    n.select(`rect.${key}`)
      .attr("height", size)
      .attr("rx", 3)
      .attr("fill", key === "high" ? orange : blue)
      .transition()
      .duration(ms)
      .attr("width", (d) => size * d[key]);
  text(
    g,
    "exposure-title",
    w / 2,
    28,
    highest
      ? en
        ? `${overall}% potentially exposed · ${highest}% highest exposure`
        : `${overall}% 潜在暴露，其中 ${highest}% 为最高暴露`
      : `${recordById(s.exposure).label[lang]} · ${overall}%`,
    w < 450 ? 11 : 13,
    "var(--text-primary)",
    "middle",
  );
  text(
    g,
    "exposure-note",
    w / 2,
    326,
    highest
      ? en
        ? "Orange is within blue. Exposure is not job loss."
        : "橙色包含在蓝色中；暴露不等于失业。"
      : en
        ? "Potential task overlap is not a job-loss probability."
        : "潜在任务重叠，不是岗位消失概率。",
    11,
    "var(--text-secondary)",
    "middle",
  );
}
