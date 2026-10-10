import * as d3 from "d3";
import { industryCases, dataset } from "../data";
import { setParams } from "./url-state";
import { showPanel, resizePanel } from "./motion";
import { drawIndustryNetwork } from "../visualizations/industry-network";
import type { AiViz } from "../visualizations/charts";
export function renderIndustry(this: AiViz) {
  const containers = Array.from(
    this.closest("hw02-shell")!.querySelectorAll<HTMLElement>(
      ".case-collection,.industry-evidence",
    ),
  );
  const heights = containers.map((el) => el.getBoundingClientRect().height);

  const selected = this.value("industry") || "manufacturing",
    capability = this.capability();
  this.closest("hw02-shell")
    ?.querySelectorAll<HTMLElement>("[data-evidence]")
    .forEach((panel) =>
      showPanel(panel, !capability && panel.dataset.evidence === selected),
    );
  const select = this.q<HTMLSelectElement>("[data-control=industry]");
  let placeholder = select.querySelector<HTMLOptionElement>(
    "[data-capability-placeholder]",
  );
  if (capability) {
    if (!placeholder) {
      placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.disabled = true;
      placeholder.dataset.capabilityPlaceholder = "";
      placeholder.textContent = this.t("请选择关联产业", "Choose an industry");
      select.prepend(placeholder);
    }
    select.value = "";
  } else {
    placeholder?.remove();
    select.value = selected;
  }
  const relatedCases = industryCases.filter((c) =>
    c.capabilities.includes(capability),
  );
  const panel = document.querySelector<HTMLElement>("[data-capability-panel]")!;
  showPanel(panel, !!capability);
  if (capability) {
    panel.querySelector("[data-capability-title]")!.textContent =
      dataset.capabilities.find((c) => c.id === capability)!.name[this.locale];
    const links = panel.querySelector("[data-capability-cases]")!;
    links.replaceChildren();
    for (const c of relatedCases) {
      const button = document.createElement("button");
      button.textContent = c.name[this.locale];
      button.addEventListener("click", () => {
        this.selectIndustry(c.id);
        const radio = this.querySelector<HTMLInputElement>(
          "[data-choice=industry]:checked",
        );
        (radio?.getClientRects().length ? radio : select).focus();
      });
      links.append(button);
    }
  }
  const isActiveLink = (industry: string, cap: string) =>
    capability ? cap === capability : industry === selected;
  document.querySelectorAll<HTMLElement>("[data-case]").forEach((c) => {
    showPanel(c, !capability && c.dataset.case === selected);
  });
  this.querySelectorAll<HTMLElement>("[data-view]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.view === this.view)),
  );
  const { svg, w } = this.svg(420);
  svg.attr("role", "group");
  if (this.view === "matrix") {
    const left = this.locale === "en" ? 108 : 65,
      top = 60;
    const x = d3
      .scaleBand()
      .domain(dataset.capabilities.map((c) => c.id))
      .range([left, w - 10])
      .padding(0.1);
    const y = d3
      .scaleBand()
      .domain(industryCases.map((c) => c.id))
      .range([top, 390])
      .padding(0.18);
    dataset.capabilities.forEach((c) => {
      const heading = svg
        .append("g")
        .attr("role", "button")
        .attr("data-key", `capability-${c.id}`)
        .attr("tabindex", 0)
        .attr("aria-label", c.name[this.locale])
        .attr("aria-pressed", String(capability === c.id));
      heading
        .append("rect")
        .attr("x", x(c.id)!)
        .attr("y", 4)
        .attr("width", x.bandwidth())
        .attr("height", 44)
        .attr("rx", 5)
        .attr(
          "fill",
          capability === c.id ? "var(--accent-soft)" : "transparent",
        );
      heading
        .append("text")
        .attr("x", x(c.id)! + x.bandwidth() / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("class", "label")
        .style("font-size", w < 450 ? "9px" : "12px")
        .text(c.name[this.locale]);
      const choose = () => {
        setParams({ capability: c.id });
        this.render();
      };
      heading.on("click", choose).on("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          choose();
        }
      });
    });
    industryCases.forEach((c) => {
      this.label(
        svg,
        left - 10,
        y(c.id)! + y.bandwidth() / 2 + 4,
        c.name[this.locale],
        "label",
        "end",
      ).style("font-size", "11px");
      dataset.capabilities.forEach((cap) => {
        const related = c.capabilities.includes(cap.id);
        const g = svg
          .append("g")
          .attr("tabindex", 0)
          .attr("data-key", `${c.id}:${cap.id}`)
          .attr("role", "button")
          .attr(
            "aria-label",
            `${c.name[this.locale]} / ${cap.name[this.locale]}: ${related ? this.t("有应用关系", "application shown") : this.t("未收录关系", "not documented")}`,
          )
          .on("click", () => this.selectIndustry(c.id))
          .on("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              this.selectIndustry(c.id);
            }
          });
        g.append("rect")
          .attr("x", x(cap.id)!)
          .attr("y", y(c.id)!)
          .attr("width", x.bandwidth())
          .attr("height", y.bandwidth())
          .attr("rx", 5)
          .attr("fill", related ? "var(--hw-mint)" : "var(--surface-muted)")
          .attr(
            "opacity",
            related ? (isActiveLink(c.id, cap.id) ? 1 : 0.35) : 1,
          )
          .attr(
            "stroke",
            (capability ? cap.id === capability : c.id === selected)
              ? "var(--hw-blue)"
              : "var(--border-soft)",
          );
        if (related)
          g.append("circle")
            .attr("cx", x(cap.id)! + x.bandwidth() / 2)
            .attr("cy", y(c.id)! + y.bandwidth() / 2)
            .attr("r", 3)
            .attr("fill", "var(--surface)");
      });
    });
  } else {
    drawIndustryNetwork(
      svg,
      w,
      this.locale,
      selected,
      capability,
      (id, group) => {
        if (group) {
          setParams({ capability: id });
          this.render();
        } else this.selectIndustry(id);
      },
    );
  }

  containers.forEach((el, i) => resizePanel(el, heights[i]));
  if (capability) {
    this.status(
      `${dataset.capabilities.find((c) => c.id === capability)!.name[this.locale]} · ${relatedCases.map((c) => c.name[this.locale]).join(" / ")} — ${this.t("选择关联产业，查看对应案例。", "Choose a connected industry to view its case.")}`,
    );
    return;
  }
  const c = industryCases.find((c) => c.id === selected)!;
  this.status(
    `${c.name[this.locale]} · ${c.task[this.locale]} — ${this.t("案例与来源已同步更新。图中位置远近不代表相似程度。", "Linked case and source updated. Layout distance is not a similarity metric.")}`,
  );
}
