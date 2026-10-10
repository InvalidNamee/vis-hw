import * as d3 from "d3";
import { calculate, presets, defaults } from "../model.mjs";
import { animateNumber } from "./motion";
import type { AiViz } from "../visualizations/charts";
const palette = [
  "var(--hw-blue)",
  "var(--hw-mint)",
  "var(--hw-purple)",
  "var(--hw-orange)",
];
export function renderLab(this: AiViz) {
  this.q<HTMLButtonElement>("[data-action=reset]").disabled = Array.from(
    this.controlDefaults,
  ).every(([key, value]) => this.value(key) === value);
  const input = Object.fromEntries(
    Object.keys(defaults).map((key) => [key, this.value(key)]),
  );
  const result = calculate(input);
  let presetName = "";
  this.querySelectorAll<HTMLElement>("[data-preset]").forEach((button) => {
    const values = presets[button.dataset.preset as keyof typeof presets];
    const active = Object.entries(values).every(
      ([key, value]) => result.params[key] === value,
    );
    button.setAttribute("aria-pressed", String(active));
    if (active) presetName = button.textContent ?? "";
  });
  this.q("[data-preset-label]").textContent =
    presetName || this.t("自定义 / 教学假设", "Custom / teaching assumptions");
  for (const [key, value] of Object.entries(result.params)) {
    const o = this.querySelector(`[data-output="${key}"]`);
    if (o) o.textContent = String(value);
  }
  animateNumber(
    this.q<HTMLElement>("[data-result=baseline]"),
    result.baseTotal / 60,
    ` ${this.t("小时", "h")}`,
  );
  animateNumber(
    this.q<HTMLElement>("[data-result=assisted]"),
    result.aiTotal / 60,
    ` ${this.t("小时", "h")}`,
  );
  animateNumber(this.q<HTMLElement>("[data-result=saved]"), result.saved, "%");
  const { svg, w } = this.svg(310),
    left = 18,
    right = w - 20;
  const total = Math.max(result.baseTotal, result.aiTotal),
    x = d3.scaleLinear().domain([0, total]).range([left, right]);
  const labels = [
    this.t("需求", "Brief"),
    this.t("生产", "Produce"),
    this.t("复核", "Review"),
    this.t("交付", "Deliver"),
  ];
  const rows = [result.baseline, result.assisted],
    trackY = [72, 185];
  rows.forEach((values, row) => {
    this.label(
      svg,
      left,
      trackY[row] - 20,
      row === 0
        ? this.t("原流程", "BASELINE")
        : this.t("AI 协作", "AI-ASSISTED"),
    );
    let start = 0;
    values.forEach((value, i) => {
      const x0 = x(start),
        width = x(start + value) - x(start);
      start += value;
      svg
        .append("rect")
        .attr("data-key", `stage-${row}-${i}`)
        .attr("data-phase", i)
        .attr("data-row", row)
        .attr("x", x0)
        .attr("y", trackY[row])
        .attr("width", Math.max(0, width - 2))
        .attr("height", 35)
        .attr("rx", 4)
        .attr("fill", palette[i])
        .attr("opacity", row === 0 ? 0.3 : 0.65);
      if (width > 42)
        this.label(
          svg,
          x0 + width / 2,
          trackY[row] + 22,
          labels[i],
          "label",
          "middle",
        )
          .style("font-size", "10px")
          .style("fill", "var(--text-primary)");
      this.label(
        svg,
        x0 + width / 2,
        trackY[row] + 54,
        `${(value / 60).toFixed(1)}h`,
        "label",
        "middle",
      ).style("font-size", "9px");
    });
  });
  const hours = d3
    .scaleLinear()
    .domain([0, total / 60])
    .range([left, right]);
  svg
    .append("g")
    .attr("transform", "translate(0,277)")
    .call(
      d3
        .axisBottom(hours)
        .ticks(w < 450 ? 4 : 8)
        .tickFormat((v) => `${v}h`),
    );
  svg
    .selectAll("circle.task")
    .data([0, 1])
    .join("circle")
    .attr("class", "task")
    .attr("cy", (d) => trackY[d] + 17)
    .attr("r", 6)
    .attr("fill", "var(--surface)")
    .attr("stroke", "var(--text-primary)")
    .attr("stroke-width", 2);
  svg
    .append("line")
    .attr("class", "play-marker")
    .attr("y1", 40)
    .attr("y2", 249)
    .attr("stroke", "var(--text-subtle)")
    .attr("stroke-dasharray", "3 5");
  const draw = (elapsed: number, live = false) => {
    const time = Math.min(total, (elapsed / 12000) * total);
    const plot = (
      live ? d3.select(this.q<SVGSVGElement>("[data-chart] > svg")) : svg
    ) as typeof svg;
    plot
      .selectAll<SVGCircleElement, number>("circle.task")
      .attr("cx", (d) =>
        x(Math.min(time, d === 0 ? result.baseTotal : result.aiTotal)),
      );
    plot.select(".play-marker").attr("x1", x(time)).attr("x2", x(time));
    plot
      .selectAll<SVGRectElement, unknown>("rect[data-phase]")
      .attr("stroke", "var(--text-primary)")
      .attr("stroke-width", function () {
        const row = Number(this.dataset.row),
          phase = Number(this.dataset.phase);
        const start = rows[row].slice(0, phase).reduce((a, b) => a + b, 0),
          end = start + rows[row][phase];
        return time >= start && time < end ? 2 : 0;
      });
    if (elapsed >= 12000)
      plot.selectAll("circle.task").attr("fill", "var(--hw-mint)");
  };
  if (this.playing && this.elapsed >= 12000) this.elapsed = 0;
  draw(this.elapsed);
  if (this.playing && this.motion()) {
    if (this.elapsed >= 12000) this.elapsed = 0;
    const initial = this.elapsed,
      speed = Number(this.value("playback")) || 1;
    this.timer = d3.timer((ms) => {
      this.elapsed = Math.min(12000, initial + ms * speed);
      draw(this.elapsed, true);
      if (this.elapsed >= 12000) {
        this.timer?.stop();
        this.playing = false;
        this.updatePlayButton();
      }
    });
  } else if (this.playing) {
    this.elapsed = 12000;
    draw(this.elapsed);
    this.playing = false;
  }
  this.updatePlayButton();
  const maxIdx = result.assisted.indexOf(Math.max(...result.assisted));
  this.status(
    `${result.saved === 0 ? this.t("生产节省与额外复核正好抵消。", "Production savings exactly offset extra review.") : result.saved < 0 ? this.t("额外复核超过了内容生产的节省。", "Extra review outweighs production savings.") : this.t("内容生产的节省超过了额外复核成本。", "Production savings exceed extra review costs.")} ${this.t("目前最耗时的阶段", "Largest effort stage")}: ${labels[maxIdx]}。 ${result.saved >= 0 ? this.t("节省", "Saves") : this.t("增加", "Adds")} ${Math.abs((result.baseTotal - result.aiTotal) / 60).toFixed(1)} ${this.t("小时。圆点表示同一批任务在整条流程里的推进位置；整段约 12 秒，可变速播放。", "hours. Dots show progress through serial effort for the same batch; playback takes about 12 seconds at 1×.")}`,
  );
}
export function renderSensitivity(this: AiViz) {
  const p = this.params(),
    result = calculate(p),
    { svg, w } = this.svg(280),
    left = 48,
    bottom = 225;
  const points = d3
    .range(0, 101, 5)
    .map((a) => ({ a, h: calculate({ ...p, adoption: a }).aiTotal / 60 }));
  const x = d3
    .scaleLinear()
    .domain([0, 100])
    .range([left, w - 22]);
  const y = d3
    .scaleLinear()
    .domain([
      0,
      Math.max(
        result.baseTotal / 60,
        d3.max(points, (d) => d.h)!,
      ) * 1.15,
    ])
    .nice()
    .range([bottom, 25]);
  const benefit = 30 * (1 - 1 / result.params.speed),
    threshold =
      benefit === 0 ? Infinity : (100 * result.params.review) / benefit;
  if (threshold < 100) {
    svg
      .append("rect")
      .attr("data-key", "savings-region")
      .attr("x", x(threshold))
      .attr("y", 25)
      .attr("width", x(100) - x(threshold))
      .attr("height", bottom - 25)
      .attr("fill", "var(--hw-mint)")
      .attr("opacity", 0.07);
    svg
      .append("line")
      .attr("x1", x(threshold))
      .attr("x2", x(threshold))
      .attr("y1", 25)
      .attr("y2", bottom)
      .attr("stroke", "var(--hw-mint)")
      .attr("stroke-dasharray", "3 4");
    this.label(
      svg,
      threshold > 55 ? w - 22 : left,
      14,
      this.t(
        `净节省区间 > ${threshold.toFixed(1)}%`,
        `Savings above ${threshold.toFixed(1)}%`,
      ),
      "label",
      threshold > 55 ? "end" : "start",
    ).style("font-size", "11px");
    svg
      .append("circle")
      .attr("data-key", "threshold")
      .attr("cx", x(threshold))
      .attr("cy", y(result.baseTotal / 60))
      .attr("r", 4)
      .attr("fill", "var(--hw-mint)");
  }
  svg
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${left},0)`)
    .call(
      d3
        .axisLeft(y)
        .ticks(4)
        .tickSize(-(w - left - 22))
        .tickFormat(() => ""),
    );
  svg
    .append("g")
    .attr("transform", `translate(0,${bottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(5)
        .tickFormat((v) => `${v}%`),
    );
  svg
    .append("g")
    .attr("transform", `translate(${left},0)`)
    .call(
      d3
        .axisLeft(y)
        .ticks(4)
        .tickFormat((v) => `${v}h`),
    );
  svg
    .append("line")
    .attr("x1", left)
    .attr("x2", w - 22)
    .attr("y1", y(result.baseTotal / 60))
    .attr("y2", y(result.baseTotal / 60))
    .attr("stroke", "var(--text-subtle)")
    .attr("stroke-dasharray", "5 5");
  svg
    .append("path")
    .datum(points)
    .attr(
      "d",
      d3
        .line<(typeof points)[number]>()
        .x((d) => x(d.a))
        .y((d) => y(d.h)),
    )
    .attr("fill", "none")
    .attr("stroke", "var(--hw-blue)")
    .attr("stroke-width", 2.5);
  svg
    .append("circle")
    .attr("data-key", "current")
    .attr("cx", x(result.params.adoption))
    .attr("cy", y(result.aiTotal / 60))
    .attr("r", 6)
    .attr("fill", "var(--hw-blue)")
    .append("title")
    .text(`${result.params.adoption}%: ${(result.aiTotal / 60).toFixed(1)}h`);
  this.label(
    svg,
    result.params.adoption > 50 ? w - 22 : left,
    bottom + 43,
    this.t(
      `当前 ${result.params.adoption}% · ${(result.aiTotal / 60).toFixed(1)} 小时`,
      `Current ${result.params.adoption}% · ${(result.aiTotal / 60).toFixed(1)} h`,
    ),
    "label",
    result.params.adoption > 50 ? "end" : "start",
  ).style("font-size", "11px");
  this.status(
    threshold >= 100
      ? this.t(
          "在当前的加速与复核条件下，参与比例再高，也省不下工时。",
          "At these speed and review settings, participation cannot produce positive net savings.",
        )
      : this.t(
          `参与比例超过 ${threshold.toFixed(1)}% 后，模型才开始省下工时。`,
          `The model produces net effort savings above ${threshold.toFixed(1)}% participation.`,
        ),
  );
}
