import * as d3 from "d3";
import type { Lang } from "../content";

type Svg = d3.Selection<SVGSVGElement, null, HTMLElement, unknown>;
type Scene = "data" | "compute" | "factory" | "person" | "energy" | "service";
type Item = { title: [string, string]; detail: [string, string]; scene: Scene };
let graphInstance = 0;
const graphs: Record<string, { nodes: Item[]; edges: [number, number][] }> = {
  pathway: {
    nodes: [
      {
        title: ["数据与投入", "Data & investment"],
        scene: "data",
        detail: [
          "投入支持数据准备、算力与人才，但投入规模本身不能证明生产率提高。",
          "Investment supports data, compute, and people. Its size alone does not establish productivity gains.",
        ],
      },
      {
        title: ["智能能力", "AI capability"],
        scene: "compute",
        detail: [
          "识别、预测与生成把信息转化为可调用的能力；能力还需要适配具体任务。",
          "Recognition, prediction, and generation turn information into capabilities that still need to fit particular tasks.",
        ],
      },
      {
        title: ["流程重组", "Workflow redesign"],
        scene: "factory",
        detail: [
          "把 AI 接入实际流程，同时安排培训、复核与责任，才有机会改变工作方式。",
          "Integrating AI with training, review, and clear responsibility creates opportunities to change how work is done.",
        ],
      },
      {
        title: ["检验产出", "Measure outcomes"],
        scene: "service",
        detail: [
          "在相同任务与资源口径下，分别检查完成数量、耗时和质量；用研究而非采用率验证收益。",
          "Compare volume, time, and quality on consistent tasks and resources. Evaluate gains using evidence, not adoption alone.",
        ],
      },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  },
  collaboration: {
    nodes: [
      {
        title: ["知识积累", "Knowledge"],
        scene: "data",
        detail: [
          "已有文档与经验提供参考信息；知识的质量和适用范围影响辅助结果。",
          "Documents and accumulated experience provide reference material. Their quality and relevance shape assistance.",
        ],
      },
      {
        title: ["AI 辅助", "AI assistance"],
        scene: "compute",
        detail: [
          "AI 提供检索、建议或草稿，减少寻找信息和组织表达的工作。",
          "AI can retrieve information, suggest responses, and draft text to support the task.",
        ],
      },
      {
        title: ["人的判断", "Human judgment"],
        scene: "person",
        detail: [
          "人结合现场情境判断、修正并承担责任，尤其需要处理异常与不确定性。",
          "People apply context, make corrections, and take responsibility, especially for exceptions and uncertainty.",
        ],
      },
      {
        title: ["服务现场", "Service delivery"],
        scene: "service",
        detail: [
          "建议被用于真实任务后，再观察结果。图中的回路表示复核与反馈，不表示系统会自动学习。",
          "Observe outcomes when suggestions enter real tasks. The loop indicates review and feedback, not automatic system learning.",
        ],
      },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 2],
    ],
  },
  infrastructure: {
    nodes: [
      {
        title: ["电力供给", "Electricity"],
        scene: "energy",
        detail: [
          "数据中心依赖持续供电，能源需求也受到设备效率、负载与部署方式影响。",
          "Data centres need dependable power. Demand also depends on efficiency, workloads, and deployment.",
        ],
      },
      {
        title: ["计算设施", "Compute"],
        scene: "compute",
        detail: [
          "服务器与网络承载模型计算；同时需要冷却和运维。全部数据中心用电不能都归因于 AI。",
          "Servers and networks run computations and need cooling and maintenance. Not all data-centre electricity is attributable to AI.",
        ],
      },
      {
        title: ["数据连接", "Data access"],
        scene: "data",
        detail: [
          "可用的数据与稳定的连接决定智能服务能够处理什么，以及谁能够获得服务。",
          "Usable data and dependable connectivity shape what services can process and who can access them.",
        ],
      },
      {
        title: ["产业应用", "Applications"],
        scene: "factory",
        detail: [
          "算力与数据进入应用后，还需要人才和组织能力，才能转化为实际生产收益。",
          "Applications need skills and organizational capabilities to turn compute and data into productive gains.",
        ],
      },
    ],
    edges: [
      [0, 1],
      [1, 3],
      [2, 3],
    ],
  },
};

// Small vector scenes: their geometry is illustrative, never a quantitative encoding.
function scene(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  kind: Scene,
) {
  const path = (d: string) => g.append("path").attr("d", d);
  const rect = (x: number, y: number, w: number, h: number) =>
    g
      .append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", w)
      .attr("height", h)
      .attr("rx", 3);
  const circle = (x: number, y: number, r: number) =>
    g.append("circle").attr("cx", x).attr("cy", y).attr("r", r);
  g.attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 1.8)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round");
  path("M-49,32 L0,43 L49,32 L0,21 Z")
    .attr("fill", "currentColor")
    .attr("opacity", 0.08)
    .attr("stroke", "none");
  if (kind === "data") {
    path("M-30,-18 V17 C-30,30 30,30 30,17 V-18").attr(
      "fill",
      "var(--surface)",
    );
    g.append("ellipse")
      .attr("cx", 0)
      .attr("cy", -18)
      .attr("rx", 30)
      .attr("ry", 10)
      .attr("fill", "var(--surface)");
    path("M-30,-2 C-30,11 30,11 30,-2 M-30,12 C-30,25 30,25 30,12");
    circle(20, 14, 2).attr("fill", "currentColor");
  } else if (kind === "compute") {
    rect(-26, -25, 52, 52).attr("fill", "var(--surface)");
    rect(-15, -14, 30, 30)
      .attr("fill", "currentColor")
      .attr("fill-opacity", 0.12);
    for (const p of [-16, 0, 16]) {
      path(`M${p},-34 V-25 M${p},27 V36 M-35,${p} H-26 M26,${p} H35`);
    }
    path("M-7,5 L0,-6 L7,5 M-4,1 H4 M12,-6 V6");
  } else if (kind === "factory") {
    path("M-38,28 V-10 L-14,2 V-10 L10,2 V-10 L34,2 V28 Z").attr(
      "fill",
      "var(--surface)",
    );
    rect(18, -31, 10, 28);
    for (const x of [-27, -7, 13]) rect(x, 10, 10, 10);
    path("M22,-39 Q35,-47 41,-38").attr("opacity", 0.5);
  } else if (kind === "person") {
    circle(0, -20, 12).attr("fill", "var(--surface)");
    path("M-24,20 V12 C-24,-5 24,-5 24,12 V20");
    rect(-31, 8, 62, 30).attr("fill", "var(--surface)");
    circle(0, 22, 3);
    path("M-40,38 H40");
  } else if (kind === "energy") {
    circle(-17, -13, 3);
    path(
      "M-17,-13 V32 M-17,-13 L-20,-39 L-12,-39 Z M-17,-13 L7,-5 L3,2 Z M-17,-13 L-36,7 L-41,1 Z",
    );
    path(
      "M11,16 L37,16 L43,33 L5,33 Z M14,23 H39 M22,16 L20,33 M32,16 L34,33 M24,33 V39",
    );
  } else {
    rect(-36, -27, 72, 49).attr("fill", "var(--surface)");
    path("M-12,33 H12 M0,22 V33");
    rect(-24, -15, 48, 24)
      .attr("fill", "currentColor")
      .attr("fill-opacity", 0.08);
    path("M-13,-3 L-4,4 L14,-11");
  }
}

export function drawExplanation(
  svg: Svg,
  w: number,
  kind: string,
  lang: Lang,
  status: (value: string) => void,
  options: { focus?: number; interactive?: boolean } = {},
) {
  const { nodes, edges } = graphs[kind],
    en = lang === "en",
    mobile = w < 600;
  const colors = [
    "var(--hw-blue)",
    "var(--hw-purple)",
    "var(--hw-mint)",
    "var(--hw-orange)",
  ];
  const cardW = mobile
      ? Math.min(190, (w - 32) / 2)
      : Math.min(205, (w - 72) / 4),
    cardH = 120;
  const positions = nodes.map((_, i) =>
    mobile
      ? { x: ((i % 2 ? 3 : 1) * w) / 4, y: i < 2 ? 70 : 240 }
      : { x: (w * (i + 0.5)) / 4, y: 115 },
  );
  svg.attr("role", "group");
  const defs = svg.append("defs");
  const instance = svg.attr("data-graph-instance") || String(++graphInstance);
  svg.attr("data-graph-instance", instance);
  const markerId = `hw02-arrow-${kind}-${instance}`;
  defs
    .append("marker")
    .attr("id", markerId)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 9)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-4 L9,0 L0,4")
    .attr("fill", "none")
    .attr("stroke", "var(--hw-blue)")
    .attr("stroke-width", 1.5);
  const edge = svg
    .append("g")
    .selectAll("path")
    .data(edges)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", "var(--hw-blue)")
    .attr("stroke-width", 2)
    .attr("marker-end", `url(#${markerId})`)
    .attr("d", ([a, b]) => {
      const p = positions[a],
        q = positions[b];
      if (mobile) {
        if (b < a)
          return `M${p.x},${p.y + cardH / 2} C${p.x},${p.y + 100} ${q.x},${q.y + 100} ${q.x},${q.y + cardH / 2 + 3}`;
        if (p.y === q.y) {
          const direction = q.x > p.x ? 1 : -1;
          return `M${p.x + (direction * cardW) / 2},${p.y + 20} H${q.x - direction * (cardW / 2 + 3)}`;
        }
        return `M${p.x},${p.y + cardH / 2} C${p.x},155 ${q.x},155 ${q.x},${q.y - cardH / 2 - 3}`;
      }
      if (b === a + 1)
        return `M${p.x + cardW / 2},${p.y} H${q.x - cardW / 2 - 3}`;
      const y = b < a ? 230 : 15,
        start = b < a ? cardH / 2 : -cardH / 2;
      return `M${p.x},${p.y + start} C${p.x},${y} ${q.x},${y} ${q.x},${q.y + start}`;
    });
  const node = svg
    .append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "explanation-node")
    .attr(
      "transform",
      (_, i) => `translate(${positions[i].x},${positions[i].y})`,
    )
    .attr("role", "button")
    .attr("tabindex", 0)
    .attr("aria-label", (d) => d.title[en ? 1 : 0])
    .style("color", (_, i) => colors[i]);
  node
    .append("rect")
    .attr("x", -cardW / 2)
    .attr("y", -cardH / 2)
    .attr("width", cardW)
    .attr("height", cardH)
    .attr("rx", 18)
    .attr("fill", "var(--surface)")
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.3);
  node
    .append("circle")
    .attr("cy", -10)
    .attr("r", 35)
    .attr("fill", "currentColor")
    .attr("opacity", 0.06);
  node.each(function (d) {
    scene(
      d3
        .select(this)
        .append("g")
        .attr("transform", "translate(0,-10) scale(.8)"),
      d.scene,
    );
  });
  node
    .append("text")
    .attr("text-anchor", "middle")
    .attr("y", 43)
    .attr("fill", "var(--text-primary)")
    .attr("font-size", mobile && en ? 10 : 13)
    .attr("font-weight", 600)
    .text((d) => d.title[en ? 1 : 0]);
  node
    .append("text")
    .attr("x", -cardW / 2 + 12)
    .attr("y", -cardH / 2 + 21)
    .attr("fill", "currentColor")
    .attr("font-size", 9)
    .text((_, i) => `0${i + 1}`);
  const select = (index: number) => {
    svg.attr("data-focus", index);
    node.attr("aria-pressed", (_, i) => String(i === index));
    node
      .select("rect")
      .attr("stroke-opacity", (_, i) => (i === index ? 1 : 0.3))
      .attr("stroke-width", (_, i) => (i === index ? 2 : 1));
    edge.attr("opacity", ([a, b]) => (a === index || b === index ? 1 : 0.2));
    status(nodes[index].detail[en ? 1 : 0]);
  };
  node
    .on("click", (_, d) => select(nodes.indexOf(d)))
    .on("keydown", (e, d) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select(nodes.indexOf(d));
      }
    });
  select(options.focus ?? Number(svg.attr("data-focus") || 0));
  if (options.interactive === false) {
    svg.attr("role", "img");
    node
      .on("click", null)
      .on("keydown", null)
      .attr("tabindex", null)
      .attr("role", null)
      .attr("aria-pressed", null);
  }
}
