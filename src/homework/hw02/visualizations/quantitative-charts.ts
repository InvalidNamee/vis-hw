import * as d3 from "d3";
import { dataset, recordById, energyBaseline, type Lang } from "../data";
export type Plot = d3.Selection<SVGSVGElement, null, HTMLElement, unknown>;
const text = (
  svg: Plot,
  x: number,
  y: number,
  value: string,
  anchor = "start",
) =>
  svg
    .append("text")
    .attr("x", x)
    .attr("y", y)
    .attr("fill", "var(--text-secondary)")
    .attr("font-size", 12)
    .attr("text-anchor", anchor)
    .text(value);
export function drawOutcome(svg: Plot, w: number, key: string, lang: Lang) {
  const r = recordById(key),
    x = d3
      .scaleLinear()
      .domain([0, 140])
      .range([38, w - 24]);
  svg
    .append("g")
    .attr("transform", "translate(0,195)")
    .call(d3.axisBottom(x).ticks(w < 400 ? 3 : 5));
  svg
    .append("line")
    .attr("x1", x(100))
    .attr("x2", x(100))
    .attr("y1", 65)
    .attr("y2", 172)
    .attr("stroke", "var(--border-strong)")
    .attr("stroke-dasharray", "4 5");
  svg
    .append("line")
    .attr("x1", x(100))
    .attr("x2", x(100 + r.value))
    .attr("y1", 115)
    .attr("y2", 115)
    .attr("stroke", "var(--hw-mint)")
    .attr("stroke-width", 5);
  svg
    .append("circle")
    .attr("cx", x(100))
    .attr("cy", 115)
    .attr("r", 7)
    .attr("fill", "var(--surface)")
    .attr("stroke", "var(--text-subtle)")
    .attr("stroke-width", 2);
  svg
    .append("circle")
    .attr("cx", x(100 + r.value))
    .attr("cy", 115)
    .attr("r", 7)
    .attr("fill", "var(--hw-mint)");
  text(
    svg,
    x(100),
    156,
    `${lang === "en" ? "Baseline" : "基准"} 100`,
    "middle",
  );
  text(svg, x(100 + r.value), 82, `AI ${100 + r.value}`, "middle")
    .attr("font-weight", 600)
    .attr("fill", "var(--hw-mint)");
  text(svg, 38, 28, r.label[lang]);
  return `${r.value > 0 ? "+" : ""}${r.value}% · ${key === "time" ? (lang === "en" ? "Less completion time; lower means faster." : "完成时间缩短，数值越低表示越快。") : lang === "en" ? "A higher value indicates improvement on this outcome." : "同一指标下，数值越高表示改善越大。"} ${lang === "en" ? "Index derived from the reported change." : "指数由研究报告的相对变化换算。"}`;
}
export function drawAdoption(
  svg: Plot,
  w: number,
  revealedYears: number[] = [2023, 2024, 2025],
  focusYear?: number,
) {
  const rows = dataset.records
    .filter((r) => r.id.startsWith("adoption-"))
    .map((r) => ({ ...r, period: Number(r.period) }));
  const x = d3
      .scaleLinear()
      .domain([2022.85, 2025.15])
      .range([42, w - 28]),
    y = d3.scaleLinear().domain([0, 100]).range([230, 30]);
  svg
    .append("g")
    .attr("transform", "translate(0,230)")
    .call(
      d3
        .axisBottom(x)
        .tickValues([2023, 2024, 2025])
        .tickFormat(d3.format("d")),
    );
  svg
    .append("g")
    .attr("transform", "translate(42,0)")
    .call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat((v) => `${v}%`),
    );
  const shown = rows.filter((r) => revealedYears.includes(r.period));
  svg
    .append("path")
    .datum(shown)
    .attr(
      "d",
      d3
        .area<(typeof rows)[number]>()
        .x((r) => x(r.period))
        .y0(230)
        .y1((r) => y(r.value)),
    )
    .attr("fill", "var(--hw-blue)")
    .attr("opacity", 0.07);
  svg
    .append("path")
    .datum(shown)
    .attr(
      "d",
      d3
        .line<(typeof rows)[number]>()
        .x((r) => x(r.period))
        .y((r) => y(r.value)),
    )
    .attr("fill", "none")
    .attr("stroke", "var(--hw-blue)")
    .attr("stroke-width", 2.5);
  svg
    .selectAll<SVGGElement, (typeof rows)[number]>("g.adoption-point")
    .data(shown, (r) => r.id)
    .join("g")
    .attr("class", "adoption-point")
    .attr("opacity", (r) => (focusYear && focusYear !== r.period ? 0.25 : 1))
    .each(function (r) {
      const g = d3.select(this);
      g.append("circle")
        .attr("cx", x(r.period))
        .attr("cy", y(r.value))
        .attr("r", 5)
        .attr("fill", "var(--surface)")
        .attr("stroke", "var(--hw-blue)")
        .attr("stroke-width", 2.5);
      g.append("text")
        .attr("x", x(r.period))
        .attr("y", y(r.value) - 15)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--text-primary)")
        .attr("font-size", 13)
        .attr("font-weight", 600)
        .text(`${r.value}%`);
    });
  return rows
    .filter((r) => !focusYear || r.period === focusYear)
    .map((r) => `${r.period}: ${r.value}%`)
    .join(" / ");
}
export function drawEnergy(svg: Plot, w: number, lang: Lang, indexed = false) {
  const rows = dataset.records
    .filter((r) => r.id.startsWith("energy-"))
    .map((r) => ({
      ...r,
      plot: indexed ? (r.value / energyBaseline.value) * 100 : r.value,
    }));
  const x = d3
      .scaleBand()
      .domain(rows.map((r) => String(r.period)))
      .range([50, w - 22])
      .padding(0.45),
    y = d3
      .scaleLinear()
      .domain([0, (d3.max(rows, (r) => r.plot) ?? 1) * 1.15])
      .nice()
      .range([220, 30]);
  svg
    .append("g")
    .attr("transform", "translate(50,0)")
    .call(d3.axisLeft(y).ticks(4));
  text(
    svg,
    50,
    16,
    indexed ? (lang === "en" ? "2025 = 100" : "2025 = 100") : "TWh",
  );
  rows.forEach((r, i) => {
    const center = x(String(r.period))! + x.bandwidth() / 2;
    svg
      .append("rect")
      .attr("x", x(String(r.period))!)
      .attr("width", x.bandwidth())
      .attr("y", y(r.plot))
      .attr("height", 220 - y(r.plot))
      .attr("rx", 4)
      .attr("fill", i ? "var(--hw-orange)" : "var(--hw-blue)")
      .attr("fill-opacity", i ? 0.14 : 0.75)
      .attr("stroke", i ? "var(--hw-orange)" : "var(--hw-blue)")
      .attr("stroke-dasharray", i ? "5 4" : null);
    text(
      svg,
      center,
      y(r.plot) - 12,
      `${r.precision === "approximate" ? "≈ " : ""}${indexed ? r.plot.toFixed(1) : r.value}`,
      "middle",
    ).attr("font-weight", 600);
    text(svg, center, 243, String(r.period), "middle");
    text(
      svg,
      center,
      263,
      i
        ? lang === "en"
          ? "Projection"
          : "预测"
        : lang === "en"
          ? "Estimate"
          : "估计",
      "middle",
    ).attr("font-size", 11);
  });
  return lang === "en"
    ? "Solid: historical estimate. Dashed: central projection. No missing annual values are interpolated."
    : "实心柱是历史估计，虚线柱是基准情景预测；未报告的年度数值不补画。";
}
