import * as d3 from "d3";
import type { Lang } from "../data";
type Svg = d3.Selection<SVGSVGElement, null, HTMLElement, unknown>;
export function drawScience(
  svg: Svg,
  w: number,
  kind: string,
  lang: Lang,
  status: (s: string) => void,
  options: {
    focus?: number;
    interactive?: boolean;
    onSelect?: (i: number) => void;
  } = {},
) {
  const en = lang === "en",
    weather = kind === "weather",
    mobile = w < 560;
  const nodes = weather
    ? [
        [
          "观测输入",
          "Observations",
          "卫星、地面站与探空气球提供观测。",
          "Satellites, stations and balloons supply observations.",
        ],
        [
          "AI 预报",
          "AI forecast",
          "Aardvark 将观测映射为全球与地方预报；不同变量与提前量需分别验证。",
          "Aardvark maps observations to global and local forecasts; validation depends on variable and lead time.",
        ],
        [
          "生产决策",
          "Decisions",
          "农业、交通、能源可以使用气象信息；预报研究本身没有测量这些行业的收益。",
          "Agriculture, transport and energy can use weather information; this study does not measure their economic gains.",
        ],
        [
          "人工校验",
          "Human checks",
          "实际应用仍需检查当地条件、误差与风险。",
          "Local conditions, errors and risks still need checking.",
        ],
      ]
    : [
        [
          "分子输入",
          "Molecules",
          "蛋白质、核酸及其他分子提供结构研究的输入。",
          "Proteins, nucleic acids and other molecules provide inputs for structural research.",
        ],
        [
          "结构预测",
          "Prediction",
          "AlphaFold 3 预测生物分子的结构与相互作用。",
          "AlphaFold 3 predicts biomolecular structures and interactions.",
        ],
        [
          "实验验证",
          "Validation",
          "模型输出为实验设计提供线索，并不等于已证实的发现。",
          "Predictions guide experimental design; they are not confirmed discoveries.",
        ],
        [
          "新问题",
          "New questions",
          "验证结果带来新的研究问题，回到下一轮预测与实验。",
          "Validated results raise new questions for another round of prediction and experiments.",
        ],
      ];
  const positions = nodes.map((_, i) =>
    mobile
      ? { x: (((i % 2) + 0.5) * w) / 2, y: 70 + Math.floor(i / 2) * 160 }
      : { x: ((i + 0.5) * w) / 4, y: 100 },
  );
  const width = mobile ? w / 2 - 16 : w / 4 - 14;
  svg.attr("role", "group");
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ];
  const paths = svg
    .append("g")
    .selectAll("path")
    .data(edges)
    .join("path")
    .attr("d", ([a, b]) => {
      const p = positions[a],
        q = positions[b];
      return a === 3
        ? `M${p.x},${p.y + 44} Q${w / 2},${mobile ? 328 : 205} ${q.x},${q.y + 44}`
        : `M${p.x},${p.y} L${q.x},${q.y}`;
    })
    .attr("stroke", "var(--hw-blue)")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4 4");
  const buttons = svg
    .append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("role", "button")
    .attr("tabindex", 0)
    .attr("aria-label", (d) => d[en ? 1 : 0])
    .attr(
      "transform",
      (_, i) => `translate(${positions[i].x},${positions[i].y})`,
    )
    .attr("class", "science-node");
  buttons
    .append("rect")
    .attr("x", -width / 2)
    .attr("y", -45)
    .attr("width", width)
    .attr("height", 90)
    .attr("rx", 12)
    .attr("fill", "var(--surface)")
    .attr("stroke", "var(--hw-blue)");
  buttons.each(function (_, i) {
    const g = d3.select(this);
    g.append("circle")
      .attr("cy", -12)
      .attr("r", 16)
      .attr("fill", "var(--accent-soft)");
    g.append("text")
      .attr("y", -8)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--hw-blue)")
      .attr("font-size", 12)
      .text(`0${i + 1}`);
  });
  buttons
    .append("text")
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .attr("fill", "var(--text-primary)")
    .attr("font-size", mobile ? 11 : 12)
    .text((d) => d[en ? 1 : 0]);
  const select = (i: number) => {
    svg.attr("data-focus", i);
    buttons.attr("aria-pressed", (_, j) => String(i === j));
    buttons.select("rect").attr("stroke-width", (_, j) => (i === j ? 3 : 1));
    paths.attr("opacity", ([a, b]) => (a === i || b === i ? 0.8 : 0.2));
    status(nodes[i][en ? 3 : 2]);
  };
  buttons
    .on("click", (_, d) =>
      options.onSelect
        ? options.onSelect(nodes.indexOf(d))
        : select(nodes.indexOf(d)),
    )
    .on("keydown", (e, d) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (options.onSelect) options.onSelect(nodes.indexOf(d));
        else select(nodes.indexOf(d));
      }
    });
  select(
    Math.min(
      3,
      Math.max(
        0,
        Math.round(options.focus ?? Number(svg.attr("data-focus"))) || 0,
      ),
    ),
  );
  if (options.interactive === false) {
    svg.attr("role", "img");
    buttons
      .on("click", null)
      .on("keydown", null)
      .attr("tabindex", null)
      .attr("role", null)
      .attr("aria-pressed", null);
  }
}
