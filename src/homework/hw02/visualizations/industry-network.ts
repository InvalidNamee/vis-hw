import { dataset, type Lang } from "../data";
import type { Plot } from "./quantitative-charts";
export function drawIndustryNetwork(
  svg: Plot,
  w: number,
  lang: Lang,
  activeIndustry: string,
  capability = "",
  select?: (id: string, group: number) => void,
  height = 420,
) {
  const compact = height < 400;
  const rowGap = compact ? 43 : 74;
  const nodeWidth = Math.min(180, w * 0.39),
    left = nodeWidth / 2 + 4,
    right = w - nodeWidth / 2 - 4;
  const nodes = [
    ...dataset.cases.map((c, i) => ({
      id: c.id,
      label: c.name[lang],
      group: 0,
      x: left,
      y: (compact ? 43 : 65) + i * rowGap,
    })),
    ...dataset.capabilities.map((c, i) => ({
      id: c.id,
      label: c.name[lang],
      group: 1,
      x: right,
      y: (compact ? 64 : 102) + i * rowGap,
    })),
  ];
  const related = capability
    ? dataset.cases
        .filter((c) => c.capabilities.includes(capability))
        .map((c) => c.id)
    : dataset.cases.find((c) => c.id === activeIndustry)!.capabilities;
  const active = capability || activeIndustry,
    isActive = (industry: string, cap: string) =>
      capability ? cap === capability : industry === activeIndustry;
  const label = (x: number, y: number, value: string) =>
    svg
      .append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--text-secondary)")
      .attr("font-size", compact ? 14 : 11)
      .text(value);
  label(left, 22, lang === "en" ? "Industries" : "产业场景");
  label(right, 22, lang === "en" ? "Capabilities" : "智能能力");
  const links = dataset.cases.flatMap((c) =>
    c.capabilities.map((cap) => ({
      industry: c.id,
      cap,
      source: nodes.find((n) => n.id === c.id)!,
      target: nodes.find((n) => n.id === cap)!,
    })),
  );
  svg
    .append("g")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr(
      "d",
      (d) =>
        `M${d.source.x + nodeWidth / 2},${d.source.y} C${w / 2},${d.source.y} ${w / 2},${d.target.y} ${d.target.x - nodeWidth / 2},${d.target.y}`,
    )
    .attr("data-key", (d) => `${d.industry}:${d.cap}`)
    .attr("data-order", (_, i) => i)
    .attr("fill", "none")
    .attr("stroke", "var(--hw-blue)")
    .attr("stroke-width", (d) => (isActive(d.industry, d.cap) ? 3 : 1.5))
    .attr("opacity", (d) => (isActive(d.industry, d.cap) ? 1 : 0.16));
  const g = svg
    .append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "node")
    .attr("data-key", (d) => d.id)
    .attr("transform", (d) => `translate(${d.x},${d.y})`)
    .attr("role", select ? "button" : null)
    .attr("tabindex", select ? 0 : null)
    .attr("aria-label", (d) => d.label)
    .attr("aria-pressed", select ? (d) => String(d.id === active) : null)
    .attr("opacity", (d) =>
      d.id === active || related.includes(d.id) ? 1 : 0.6,
    );
  g.append("rect")
    .attr("x", -nodeWidth / 2)
    .attr("y", compact ? -18 : -25)
    .attr("width", nodeWidth)
    .attr("height", compact ? 36 : 50)
    .attr("rx", 12)
    .attr("fill", (d) =>
      d.id === active ? "var(--hw-blue)" : "var(--surface)",
    )
    .attr("stroke", (d) => (d.group ? "var(--hw-mint)" : "var(--hw-blue)"))
    .attr("stroke-width", 1.6);
  g.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 4)
    .attr("font-size", compact ? 14 : w < 400 ? 10 : 12)
    .attr("fill", (d) =>
      d.id === active
        ? "var(--hw-on-blue)"
        : d.group
          ? "var(--hw-mint)"
          : "var(--hw-blue)",
    )
    .text((d) => d.label);
  if (select)
    g.on("click", (_, d) => select(d.id, d.group)).on("keydown", (event, d) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select(d.id, d.group);
      }
    });
}
