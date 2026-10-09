import * as d3 from "d3";
import { dataset, type Lang } from "../data";
import { calculate, defaults } from "../model.mjs";
import { drawIndustryNetwork } from "../visualizations/industry-network";
import { drawEvidence } from "../visualizations/evidence-charts";
import {
  drawOutcome,
  drawAdoption,
  drawEnergy,
  type Plot,
} from "../visualizations/quantitative-charts";
import { canAnimate, commitPlot } from "../interactions/motion";
import type { StoryStep } from "./content";
import { drawingMotion } from "./scene-motion";
import { allowFilters, ensureGlow } from "./fx";
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const label = (svg: Plot, x: number, y: number, value: string, size = 13) =>
  svg
    .append("text")
    .attr("x", x)
    .attr("y", y)
    .attr("font-size", size)
    .text(value);
function flow(svg: Plot, w: number, lang: Lang) {
  const names =
    lang === "en"
      ? ["Retrieve", "Produce", "Review", "Deliver"]
      : ["检索知识", "形成答案", "人工复核", "交付结果"];
  const narrow = w < 560,
    cols = narrow ? 2 : 4,
    gap = 16,
    box = (w - 32 - (cols - 1) * gap) / cols;
  names.forEach((name, i) => {
    const x = 16 + (i % cols) * (box + gap),
      y = 120 + Math.floor(i / cols) * 120;
    const g = svg
      .append("g")
      .attr("data-key", `task-${i}`)
      .attr("data-flow-node", i);
    g.append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", box)
      .attr("height", 72)
      .attr("rx", 8)
      .attr("fill", "var(--surface-muted)")
      .attr("stroke", i === 2 ? "var(--hw-purple)" : "var(--border-soft)");
    // Expanding ring marks the node that gains emphasis; driven by scroll phase.
    g.append("rect")
      .attr("data-flow-ring", i)
      .attr("x", x)
      .attr("y", y)
      .attr("width", box)
      .attr("height", 72)
      .attr("rx", 8)
      .attr("fill", "none")
      .attr("stroke", i >= 2 ? "var(--hw-mint)" : "var(--hw-blue)")
      .attr("stroke-width", 1.5)
      .style("transform-box", "fill-box")
      .style("transform-origin", "center")
      .style("opacity", 0);
    label(g as unknown as Plot, x + 14, y + 24, `0${i + 1}`, 11).attr(
      "fill",
      "var(--hw-blue)",
    );
    label(g as unknown as Plot, x + 14, y + 51, name, 13);
    if (i < 3) {
      const nx = 16 + ((i + 1) % cols) * (box + gap),
        ny = 120 + Math.floor((i + 1) / cols) * 120;
      svg
        .append("path")
        .attr("data-flow-link", i)
        .attr(
          "d",
          ny === y
            ? `M${x + box} ${y + 36}H${nx}`
            : `M${x + box / 2} ${y + 72}V${y + 94}H${nx + box / 2}V${ny}`,
        )
        .attr("fill", "none")
        .attr("stroke", "var(--hw-blue)")
        .attr("stroke-width", 2);
    }
    if (i < 2) {
      svg
        .append("path")
        .attr("data-ai-link", i)
        .attr(
          "d",
          `M${w / 2} 62 C${w / 2} 92 ${x + box / 2} 86 ${x + box / 2} ${y}`,
        )
        .attr("fill", "none")
        .attr("stroke", "var(--hw-mint)")
        .attr("stroke-width", 2);
      [0.09, 0.06, 0.03].forEach((lag, k) =>
        svg
          .append("circle")
          .attr("data-ai-trail", i)
          .attr("data-lag", lag)
          .attr("r", 1.5 + k * 0.7)
          .attr("fill", "var(--hw-mint)")
          .style("opacity", 0),
      );
      svg
        .append("circle")
        .attr("data-ai-packet", i)
        .attr("r", 4.5)
        .attr("fill", "var(--hw-mint)");
    }
  });
  label(svg, w / 2, 44, lang === "en" ? "AI assistance" : "AI 辅助", 17)
    .attr("data-ai-label", "")
    .attr("text-anchor", "middle")
    .attr("fill", "var(--hw-mint)");
  label(
    svg,
    16,
    narrow ? 355 : 265,
    lang === "en"
      ? "A workflow illustration, not measured time"
      : "流程关系示意，不表示实测耗时",
    11,
  );
}
function lab(svg: Plot, w: number, lang: Lang) {
  const names =
    lang === "en"
      ? ["Needs", "Produce", "Review", "Deliver"]
      : ["需求", "生产", "复核", "交付"];
  const colors = [
    "var(--hw-blue)",
    "var(--hw-mint)",
    "var(--hw-purple)",
    "var(--hw-orange)",
  ];
  for (let row = 0; row < 2; row++) {
    label(
      svg,
      16,
      54 + row * 125,
      row
        ? lang === "en"
          ? "AI-assisted"
          : "AI 协作"
        : lang === "en"
          ? "Original workflow"
          : "原流程",
      14,
    );
    names.forEach((name, i) => {
      const g = svg.append("g").attr("data-key", `flow-${row}-${i}`);
      g.append("rect")
        .attr("data-segment", `${row}-${i}`)
        .attr("y", 70 + row * 125)
        .attr("height", 44)
        .attr("rx", 4)
        .attr("fill", colors[i])
        .attr("opacity", row ? 0.9 : 0.45);
      label(g as unknown as Plot, 0, 98 + row * 125, name, w < 430 ? 10 : 12)
        .attr("text-anchor", "middle")
        .attr("data-segment-label", `${row}-${i}`);
    });
  }
  label(svg, 16, 330, "", 26)
    .attr("data-total", "")
    .attr("fill", "var(--hw-mint)");
}
function foundations(svg: Plot, w: number, lang: Lang) {
  const names =
    lang === "en"
      ? ["Data", "Connection", "Compute", "Energy"]
      : ["数据", "连接", "算力", "能源"];
  const cx = w / 2,
    cy = 200;
  names.forEach((name, i) => {
    const x = i % 2 ? w - 65 : 65,
      y = i < 2 ? 85 : 305;
    svg
      .append("path")
      .attr("d", `M${x} ${y}Q${cx} ${y} ${cx} ${cy}`)
      .attr("fill", "none")
      .attr("stroke", "var(--hw-mint)")
      .attr("stroke-width", 2);
    svg
      .append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 40)
      .attr("fill", "var(--surface-muted)")
      .attr("stroke", "var(--border-soft)");
    label(svg, x, y + 5, name, 13).attr("text-anchor", "middle");
  });
  svg
    .append("circle")
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("r", 48)
    .attr("fill", "var(--accent-soft)");
  label(svg, cx, cy + 5, lang === "en" ? "Application" : "应用", 16).attr(
    "text-anchor",
    "middle",
  );
}
function investment(svg: Plot, w: number, lang: Lang) {
  const rows = dataset.records
    .filter((r) => r.id.startsWith("investment-"))
    .sort((a, b) => b.value - a.value);
  const left = lang === "en" ? 110 : 65,
    scale = d3
      .scaleLinear()
      .domain([0, d3.max(rows, (r) => r.value)! * 1.15])
      .range([0, w - left - 35]);
  rows.forEach((r, i) => {
    const y = 65 + i * 70;
    label(svg, left - 10, y + 23, r.label[lang], 12).attr("text-anchor", "end");
    svg
      .append("rect")
      .attr("data-key", r.id)
      .attr("x", left)
      .attr("y", y)
      .attr("width", scale(r.value))
      .attr("height", 32)
      .attr("rx", 4)
      .attr("fill", "var(--hw-blue)");
    label(svg, left + scale(r.value) + 6, y + 23, String(r.value), 12);
  });
  label(
    svg,
    16,
    310,
    lang === "en"
      ? "2025 · USD billion · three selected countries"
      : "2025 年 · 十亿美元 · 所选三个国家",
    11,
  );
}
export interface Scene {
  seek(index: number, progress: number): void;
  resize(): void;
  destroy(): void;
}
export function mountScene(
  host: HTMLElement,
  steps: StoryStep[],
  lang: Lang,
): Scene {
  let index = -1,
    progress = 1,
    width = 0;
  let updateDrawing = (_phase: number) => {};
  const number = host.parentElement?.querySelector("[data-scene-number]");
  const caption = host.parentElement?.querySelector("[data-scene-caption]");
  function draw(animate = false) {
    width = Math.max(280, host.clientWidth);
    const step = steps[index],
      kind = step.scene;
    const node = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const svg = d3.select(node) as unknown as Plot;
    let h = 380,
      note =
        lang === "en"
          ? "Mechanism illustration · not an effect size"
          : "机制示意 · 不表示收益大小";
    if (kind.startsWith("workflow")) flow(svg, width, lang);
    else if (kind.startsWith("lab")) {
      lab(svg, width, lang);
      note =
        lang === "en"
          ? "Teaching model · shared time scale"
          : "教学模拟 · 两种流程使用同一时间比例";
    } else if (kind.startsWith("industry-")) {
      h = width < 500 ? 250 : 420;
      drawIndustryNetwork(svg, width, lang, kind.slice(9), "", undefined, h);

      note =
        lang === "en"
          ? "Links show applications, not their strength. Full evidence follows below."
          : "连线只表示应用关系，不代表强度；完整证据见下方探索区。";
    } else if (kind.startsWith("effects-")) {
      h = 225;
      note = drawOutcome(svg, width, kind.slice(8), lang);
    } else if (kind === "adoption") {
      h = 265;
      note = drawAdoption(svg, width);
    } else if (kind === "energy") {
      h = 280;
      note = drawEnergy(svg, width, lang, false);
    } else if (kind === "investment") {
      investment(svg, width, lang);
      note =
        lang === "en"
          ? "Private investment is not a measure of productivity."
          : "私人投资不等于生产率收益。";
    } else if (kind === "foundations") foundations(svg, width, lang);
    else {
      h = kind === "developers" ? 340 : 285;
      note = drawEvidence(
        svg,
        width,
        kind as "developers" | "enterprise" | "exposure",
        lang,
      );
    }
    svg
      .attr("viewBox", `0 0 ${width} ${h}`)
      .attr("role", "img")
      .attr("aria-label", step.title[lang]);
    // Guided scenes have no competing controls; the chapter-end explorer owns interaction.
    node.querySelectorAll("[tabindex]").forEach((el) => {
      el.removeAttribute("tabindex");
      el.removeAttribute("role");
    });
    node.dataset.view = kind.startsWith("industry")
      ? "industry"
      : kind.startsWith("lab")
        ? "lab"
        : kind.startsWith("workflow")
          ? "workflow"
          : kind;
    const previousView = host.querySelector("svg")?.getAttribute("data-view");
    const duration =
      animate &&
      canAnimate() &&
      (previousView !== node.dataset.view || node.dataset.view === "industry")
        ? 280
        : 0;
    commitPlot(host, node, duration, node.dataset.view);
    if (number)
      number.textContent = `${String(index + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`;
    if (caption) caption.textContent = note;
    const live = host.querySelector<SVGSVGElement>("svg:not([aria-hidden])")!;
    if (allowFilters() && kind.startsWith("workflow")) {
      const glow = ensureGlow(live, 3);
      live
        .querySelectorAll("[data-ai-packet], [data-ai-link]")
        .forEach((el) => el.setAttribute("filter", glow));
    }
    updateDrawing = drawingMotion(live, kind);
  }
  function seek(next: number, p: number) {
    const changed = index !== next;
    index = next;
    progress = clamp(p);
    if (changed) {
      draw(steps.length > 1);
    }
    const phase = d3.easeCubicInOut(clamp(progress / 0.48)),
      k = steps[index].scene;
    updateDrawing(phase);
    if (k.startsWith("workflow")) {
      const stage = Number(k.slice(-1));
      const states = [
        [1, 1, 1, 1],
        [1, 1, 0.45, 0.45],
        [0.6, 0.6, 1, 1],
      ];
      const from = states[Math.max(0, stage - 1)],
        to = states[stage];
      host
        .querySelectorAll<SVGElement>("[data-flow-node]")
        .forEach(
          (n, i) =>
            (n.style.opacity = String(from[i] + (to[i] - from[i]) * phase)),
        );
      const ai = host.querySelector<SVGElement>("[data-ai-label]");
      if (ai)
        ai.style.opacity = String(stage === 0 ? 0 : stage === 1 ? phase : 1);
      host
        .querySelectorAll<SVGPathElement>("[data-ai-link]")
        .forEach((path, i) => {
          const length = path.getTotalLength();
          const arrival =
            stage === 0 ? 0 : stage === 1 ? clamp(phase * 1.25 - i * 0.12) : 1;
          path.style.strokeDasharray = `${length} ${length}`;
          path.style.strokeDashoffset = String(length * (1 - arrival));
          const point = path.getPointAtLength(length * arrival);
          const packet = host.querySelector<SVGCircleElement>(
            `[data-ai-packet="${i}"]`,
          )!;
          packet.setAttribute("cx", String(point.x));
          packet.setAttribute("cy", String(point.y));
          const moving = stage === 1 && arrival > 0 && arrival < 1;
          packet.style.opacity = String(moving ? 1 : 0);
          host
            .querySelectorAll<SVGCircleElement>(`[data-ai-trail="${i}"]`)
            .forEach((dot) => {
              const lagged = Math.max(0, arrival - Number(dot.dataset.lag));
              const pt = path.getPointAtLength(length * lagged);
              dot.setAttribute("cx", String(pt.x));
              dot.setAttribute("cy", String(pt.y));
              dot.style.opacity = String(moving && lagged > 0 ? 0.5 : 0);
            });
        });
      // Rings pulse outward on the nodes this stage brings forward.
      const focus = stage === 1 ? [0, 1] : stage === 2 ? [2, 3] : [];
      host
        .querySelectorAll<SVGRectElement>("[data-flow-ring]")
        .forEach((ring, i) => {
          const on = focus.includes(i) && phase > 0 && phase < 1;
          ring.style.opacity = String(on ? 0.8 * (1 - phase) : 0);
          ring.style.transform = `scale(${1 + 0.12 * phase})`;
        });
    }
    if (k.startsWith("lab")) {
      const stage = Number(k.slice(-1));
      const prev =
        stage === 0
          ? { ...defaults, speed: 1, review: 0 }
          : stage === 1
            ? { ...defaults, speed: 1, review: 0 }
            : { ...defaults, review: 0 };
      const target =
        stage === 0
          ? prev
          : stage === 1
            ? { ...defaults, review: 0 }
            : defaults;
      const a = calculate(prev),
        b = calculate(target),
        scale = (width - 32) / Math.max(a.baseTotal, a.aiTotal, b.aiTotal);
      for (let row = 0; row < 2; row++) {
        let x = 16;
        const vals = row
          ? b.assisted.map(
              (v: number, i: number) =>
                a.assisted[i] + (v - a.assisted[i]) * phase,
            )
          : b.baseline;
        vals.forEach((v: number, i: number) => {
          const sw = v * scale;
          const rect = host.querySelector(`[data-segment="${row}-${i}"]`);
          rect?.setAttribute("x", String(x));
          rect?.setAttribute("width", String(Math.max(0, sw - 2)));
          host
            .querySelector(`[data-segment-label="${row}-${i}"]`)
            ?.setAttribute("x", String(x + sw / 2));
          x += sw;
        });
      }
      host.querySelector("[data-total]")!.textContent =
        `${lang === "en" ? "Time saved" : "节省工时"} ${(a.saved + (b.saved - a.saved) * phase).toFixed(1)}%`;
    }
    const meter =
      host.parentElement?.querySelector<HTMLElement>(".scene-progress i");
    if (meter)
      meter.style.transform = `scaleX(${(index + progress) / steps.length})`;
  }
  return {
    seek,
    resize() {
      if (index >= 0) {
        draw();
        seek(index, progress);
      }
    },
    destroy() {
      host.replaceChildren();
    },
  };
}
