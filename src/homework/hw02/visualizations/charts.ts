import * as d3 from "d3";
import { dataset, text, type Lang } from "../content";
import { calculate, defaults, presets } from "../model.mjs";
import { drawExplanation } from "./graphs";
import { drawEvidence } from "./evidence-charts";
import { drawScience } from "./science-graphs";
import { drawOutcome, drawAdoption, drawEnergy } from "./quantitative-charts";
import { drawIndustryNetwork } from "./industry-network";

type Svg = d3.Selection<SVGSVGElement, null, HTMLElement, unknown>;
const palette = [
  "var(--hw-blue)",
  "var(--hw-mint)",
  "var(--hw-purple)",
  "var(--hw-orange)",
];
const stateEvent = "hw02:state";
function setParams(values: Record<string, string>) {
  const url = new URL(location.href);
  for (const [key, value] of Object.entries(values))
    url.searchParams.set(key, value);
  history.replaceState(history.state, "", url);
  window.dispatchEvent(new Event(stateEvent));
}
const fromUrl = (key: string, fallback: string) =>
  new URL(location.href).searchParams.get(key) ?? fallback;

class AiViz extends HTMLElement {
  private abort?: AbortController;
  private resize?: ResizeObserver;
  private theme?: MutationObserver;
  private frame = 0;
  private timer?: d3.Timer;
  private locale: Lang = "zh";
  private kind = "";
  private view = "network";
  private playing = false;
  private elapsed = 0;
  private lastWidth = 0;
  private t = (zh: string, en: string) => text(this.locale, zh, en);
  private q<T extends Element = HTMLElement>(s: string) {
    return this.querySelector<T>(s)!;
  }
  private status(message: string) {
    const p = this.querySelector("[data-status]");
    if (p) p.textContent = message;
  }
  private value(key: string) {
    return (
      this.q<HTMLInputElement | HTMLSelectElement>(`[data-control="${key}"]`)
        ?.value ?? ""
    );
  }
  private motion() {
    return !matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  private duration() {
    return this.motion() ? 450 : 0;
  }
  private controlDefaults = new Map<string, string>();
  connectedCallback() {
    this.frame = requestAnimationFrame(() => this.mount());
  }
  disconnectedCallback() {
    cancelAnimationFrame(this.frame);
    this.abort?.abort();
    this.resize?.disconnect();
    this.theme?.disconnect();
    this.timer?.stop();
    d3.select(this).selectAll("*").interrupt();
  }
  private mount() {
    if (!this.isConnected) return;
    this.kind = this.dataset.kind!;
    this.locale = this.dataset.lang as Lang;
    this.abort = new AbortController();
    const opts = { signal: this.abort.signal };
    this.querySelectorAll<HTMLInputElement>("[data-choice]").forEach((radio) =>
      radio.addEventListener(
        "change",
        () => {
          const select = this.q<HTMLSelectElement>(
            `[data-control="${radio.dataset.choice}"]`,
          );
          select.value = radio.value;
          select.dispatchEvent(new Event("change"));
        },
        opts,
      ),
    );
    this.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      "[data-control]",
    ).forEach((control) => {
      const key = control.dataset.control!;
      this.controlDefaults.set(key, control.value);
      const restore = () => {
        const raw = fromUrl(key, this.controlDefaults.get(key)!);
        if (control instanceof HTMLSelectElement)
          control.value = Array.from(control.options).some(
            (o) => o.value === raw,
          )
            ? raw
            : this.controlDefaults.get(key)!;
        else if (control.type === "range") {
          const v = Number(raw);
          control.value = String(
            Number.isFinite(v)
              ? Math.min(Number(control.max), Math.max(Number(control.min), v))
              : this.controlDefaults.get(key),
          );
        } else control.value = raw;
      };
      restore();
      const event = control instanceof HTMLInputElement ? "input" : "change";
      control.addEventListener(
        event,
        () => {
          if (key !== "playback") {
            this.playing = false;
            this.elapsed = 0;
          }
          if (key === "industry") setParams({ capability: "" });
          if (key === "year") {
            const url = new URL(location.href);
            url.searchParams.delete("range");
            history.replaceState(history.state, "", url);
          }
          setParams({ [key]: control.value });
          this.render();
        },
        opts,
      );
    });
    const restore = () => {
      this.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        "[data-control]",
      ).forEach((c) => {
        const raw = fromUrl(
          c.dataset.control!,
          this.controlDefaults.get(c.dataset.control!)!,
        );
        if (c instanceof HTMLSelectElement)
          c.value = Array.from(c.options).some((o) => o.value === raw)
            ? raw
            : this.controlDefaults.get(c.dataset.control!)!;
        else c.value = raw;
      });
      this.view =
        fromUrl("view", "network") === "matrix" ? "matrix" : "network";
      this.playing = false;
      this.elapsed = 0;
      this.render();
    };
    window.addEventListener("popstate", restore, opts);
    this.view = fromUrl("view", "network") === "matrix" ? "matrix" : "network";
    this.addEventListener(
      "click",
      (e) => {
        const target = (e.target as Element).closest<HTMLElement>("button");
        if (!target) return;
        if (target.dataset.preset && target.dataset.preset in presets) {
          const values = presets[target.dataset.preset as keyof typeof presets];
          for (const [key, value] of Object.entries(values))
            this.q<HTMLInputElement>(`[data-control="${key}"]`).value =
              String(value);
          this.elapsed = 0;
          this.playing = false;
          setParams(
            Object.fromEntries(
              Object.entries(values).map(([k, v]) => [k, String(v)]),
            ),
          );
          this.render();
        }
        if (target.dataset.view) {
          this.view = target.dataset.view;
          setParams({ view: this.view });
          this.render();
        }
        switch (target.dataset.action) {
          case "reset":
            if (this.kind === "adoption") {
              const url = new URL(location.href);
              url.searchParams.delete("range");
              history.replaceState(history.state, "", url);
            }
            this.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
              "[data-control]",
            ).forEach(
              (c) => (c.value = this.controlDefaults.get(c.dataset.control!)!),
            );
            if (this.kind === "industry") this.view = "network";
            setParams({
              ...Object.fromEntries(this.controlDefaults),
              ...(this.kind === "industry" ? { view: "network" } : {}),
            });
            this.elapsed = 0;
            this.playing = false;
            this.render();
            break;
          case "play":
            this.playing = !this.playing;
            this.render();
            break;
          case "share":
            void this.share();
            break;
        }
      },
      opts,
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          this.timer?.stop();
          if (this.playing) {
            this.playing = false;
            this.updatePlayButton();
          }
        }
      },
      opts,
    );
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    reduced.addEventListener(
      "change",
      () => {
        this.playing = false;
        this.elapsed = 0;
        this.render();
      },
      opts,
    );
    if (this.kind === "sensitivity")
      window.addEventListener(stateEvent, () => this.render(), opts);
    this.theme = new MutationObserver(() => this.render());
    this.theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const style = getComputedStyle(this);
    this.lastWidth = Math.round(
      this.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight),
    );
    this.resize = new ResizeObserver((entries) => {
      const width = Math.round(entries[0].contentRect.width);
      if (Math.abs(width - this.lastWidth) > 2) {
        this.lastWidth = width;
        cancelAnimationFrame(this.frame);
        this.frame = requestAnimationFrame(() => this.render());
      }
    });
    this.resize.observe(this);
    this.render();
  }
  private async share() {
    setParams(
      Object.fromEntries(
        Array.from(
          this.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
            "[data-control]",
          ),
        ).map((c) => [c.dataset.control!, c.value]),
      ),
    );
    try {
      await navigator.clipboard.writeText(location.href);
      this.status(this.t("情景链接已复制。", "Scenario link copied."));
    } catch {
      this.status(
        this.t(
          "请复制地址栏中的链接，参数已保存。",
          "Copy the address bar URL; your parameters are saved.",
        ),
      );
    }
  }
  private svg(
    height: number,
    clear = true,
  ): { svg: Svg; w: number; h: number } {
    const stage = this.q("[data-chart]"),
      w = Math.max(260, stage.clientWidth);
    const svg = d3
      .select(stage)
      .selectAll<SVGSVGElement, unknown>("svg")
      .data([null])
      .join("svg")
      .attr("viewBox", `0 0 ${w} ${height}`)
      .attr("role", "img")
      .attr("aria-label", this.q("h2").textContent) as Svg;
    if (clear) {
      svg.selectAll("*").interrupt();
      svg.selectAll("*").remove();
    }
    return { svg, w, h: height };
  }
  private render() {
    if (!this.isConnected) return;
    this.timer?.stop();
    const focused = this.querySelector("svg :focus");
    const focusLabel = focused?.getAttribute("aria-label");
    this.querySelectorAll<HTMLInputElement>("[data-choice]").forEach(
      (radio) =>
        (radio.checked =
          radio.value === this.value(radio.dataset.choice!) &&
          !(radio.dataset.choice === "industry" && this.capability())),
    );
    switch (this.kind) {
      case "adoption":
        this.adoption();
        break;
      case "investment":
        this.investment();
        break;
      case "industry":
        this.industry();
        break;
      case "effects":
        this.effects();
        break;
      case "enterprise":
      case "robots":
      case "medical":
      case "developers":
      case "exposure": {
        const { svg, w } = this.svg(
          this.kind === "medical"
            ? 310
            : this.kind === "developers"
              ? 340
              : 285,
        );
        this.status(drawEvidence(svg, w, this.kind, this.locale));
        break;
      }
      case "weather":
      case "discovery": {
        const { svg, w } = this.svg(
          this.q("[data-chart]").clientWidth < 560 ? 340 : 220,
        );
        drawScience(svg, w, this.kind, this.locale, (message) =>
          this.status(message),
        );
        break;
      }
      case "lab":
        this.lab();
        break;
      case "sensitivity":
        this.sensitivity();
        break;
      case "energy":
        this.energy();
        break;
      case "sources":
        this.sources();
        break;
      case "pathway":
      case "collaboration":
      case "infrastructure": {
        const { svg, w } = this.svg(
          this.q("[data-chart]").clientWidth < 600 ? 340 : 250,
        );
        drawExplanation(svg, w, this.kind, this.locale, (message) =>
          this.status(message),
        );
        break;
      }
    }
    if (focusLabel)
      this.querySelectorAll<SVGElement>("svg [tabindex]").forEach((node) => {
        if (node.getAttribute("aria-label") === focusLabel) node.focus();
      });
  }
  private label(
    svg: Svg,
    x: number,
    y: number,
    message: string,
    cls = "label",
    anchor = "start",
  ) {
    return svg
      .append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("class", cls)
      .attr("text-anchor", anchor)
      .text(message);
  }
  private adoption() {
    const { svg, w } = this.svg(265),
      year = this.value("year");
    this.status(
      drawAdoption(
        svg,
        w,
        undefined,
        year === "all" ? undefined : Number(year),
      ),
    );
  }
  private investment() {
    const { svg, w } = this.svg(265, false);
    const records = dataset.records
      .filter((r) => r.id.startsWith("investment-"))
      .sort((a, b) => b.value - a.value);
    const left = this.locale === "en" ? 102 : 54,
      right = 40;
    const x = d3
      .scaleLinear()
      .domain([0, (d3.max(records, (d) => d.value) ?? 1) * 1.05])
      .nice()
      .range([left, w - right]);
    const y = d3
      .scaleBand()
      .domain(records.map((d) => d.id))
      .range([35, 218])
      .padding(0.44);
    svg
      .selectAll<SVGGElement, null>("g.x-axis")
      .data([null])
      .join("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0,225)")
      .call(d3.axisBottom(x).ticks(w < 400 ? 3 : 5));
    const rows = svg
      .selectAll<SVGGElement, (typeof records)[number]>("g.bar-row")
      .data(records, (d) => d.id)
      .join((enter) => {
        const row = enter.append("g").attr("class", "bar-row");
        row.append("rect").attr("rx", 4);
        row.append("text").attr("class", "name label");
        row.append("text").attr("class", "value value-label");
        return row;
      });
    rows
      .transition()
      .duration(this.duration())
      .attr("transform", (d) => `translate(0,${y(d.id)})`);
    rows
      .select("rect")
      .attr("x", left)
      .attr("height", y.bandwidth())
      .attr("fill", "var(--hw-blue)")
      .attr("opacity", (d) => (d.id === "investment-us" ? 0.9 : 0.5))
      .transition()
      .duration(this.duration())
      .attr("width", (d) => x(d.value) - left);
    rows
      .select(".name")
      .attr("x", left - 10)
      .attr("y", y.bandwidth() / 2 + 4)
      .attr("text-anchor", "end")
      .style("font-size", "10px")
      .text((d) => d.label[this.locale]);
    rows
      .select(".value")
      .attr("y", y.bandwidth() / 2 + 4)
      .style("font-size", "12px")
      .text((d) => d.value)
      .transition()
      .duration(this.duration())
      .attr("x", (d) => x(d.value) + 6);
    this.status(
      this.t(
        "2025 年快照：比较投资规模，不推断国家生产率。",
        "A 2025 snapshot of investment, not a productivity comparison.",
      ),
    );
  }
  private capability() {
    const id = fromUrl("capability", "");
    return dataset.capabilities.some((c) => c.id === id) ? id : "";
  }
  private selectIndustry(id: string) {
    const control = this.q<HTMLSelectElement>("[data-control=industry]");
    control.value = id;
    setParams({ industry: id, capability: "" });
    this.render();
  }
  private industry() {
    const selected = this.value("industry") || "manufacturing",
      capability = this.capability();
    this.closest("hw02-shell")
      ?.querySelectorAll<HTMLElement>("[data-evidence]")
      .forEach(
        (panel) =>
          (panel.hidden = !!capability || panel.dataset.evidence !== selected),
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
        placeholder.textContent = this.t("选择关联产业", "Choose an industry");
        select.prepend(placeholder);
      }
      select.value = "";
    } else {
      placeholder?.remove();
      select.value = selected;
    }
    const relatedCases = dataset.cases.filter((c) =>
      c.capabilities.includes(capability),
    );
    const panel = document.querySelector<HTMLElement>(
      "[data-capability-panel]",
    )!;
    panel.hidden = !capability;
    if (capability) {
      panel.querySelector("[data-capability-title]")!.textContent =
        dataset.capabilities.find((c) => c.id === capability)!.name[
          this.locale
        ];
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
      c.hidden = !!capability || c.dataset.case !== selected;
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
        .domain(dataset.cases.map((c) => c.id))
        .range([top, 390])
        .padding(0.18);
      dataset.capabilities.forEach((c) => {
        const heading = svg
          .append("g")
          .attr("role", "button")
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
      dataset.cases.forEach((c) => {
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

    if (capability) {
      this.status(
        `${dataset.capabilities.find((c) => c.id === capability)!.name[this.locale]} · ${relatedCases.map((c) => c.name[this.locale]).join(" / ")} — ${this.t("选择关联产业查看案例。", "Choose a connected industry to view its case.")}`,
      );
      return;
    }
    const c = dataset.cases.find((c) => c.id === selected)!;
    this.status(
      `${c.name[this.locale]} · ${c.task[this.locale]} — ${this.t("案例与来源已联动更新。布局距离不代表相似度。", "Linked case and source updated. Layout distance is not a similarity metric.")}`,
    );
  }
  private effects() {
    const { svg, w } = this.svg(225);
    this.status(
      drawOutcome(
        svg,
        w,
        this.value("effect") || "support",
        this.locale,
        this.duration(),
      ),
    );
  }
  private params() {
    const lab = this.closest("hw02-shell")?.querySelector(
      "ai-viz[data-kind=lab]",
    );
    return Object.fromEntries(
      Object.keys(defaults).map((k) => [
        k,
        lab?.querySelector<HTMLInputElement>(`[data-control="${k}"]`)?.value ??
          fromUrl(k, String(defaults[k as keyof typeof defaults])),
      ]),
    );
  }
  private updatePlayButton() {
    const b = this.querySelector("[data-action=play]");
    if (b)
      b.textContent = this.playing
        ? this.t("暂停", "Pause")
        : this.elapsed >= 12000
          ? this.t("重播", "Replay")
          : this.elapsed > 0
            ? this.t("继续", "Resume")
            : this.t("播放流程", "Play workflow");
  }
  private lab() {
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
      presetName ||
      this.t("自定义 / 教学假设", "Custom / teaching assumptions");
    for (const [key, value] of Object.entries(result.params)) {
      const o = this.querySelector(`[data-output="${key}"]`);
      if (o) o.textContent = String(value);
    }
    this.q("[data-result=baseline]").textContent =
      `${(result.baseTotal / 60).toFixed(1)} ${this.t("小时", "h")}`;
    this.q("[data-result=assisted]").textContent =
      `${(result.aiTotal / 60).toFixed(1)} ${this.t("小时", "h")}`;
    this.q("[data-result=saved]").textContent = `${result.saved.toFixed(1)}%`;
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
    const dots = svg
      .selectAll("circle.task")
      .data([0, 1])
      .join("circle")
      .attr("class", "task")
      .attr("cy", (d) => trackY[d] + 17)
      .attr("r", 6)
      .attr("fill", "var(--surface)")
      .attr("stroke", "var(--text-primary)")
      .attr("stroke-width", 2);
    const marker = svg
      .append("line")
      .attr("y1", 40)
      .attr("y2", 249)
      .attr("stroke", "var(--text-subtle)")
      .attr("stroke-dasharray", "3 5");
    const draw = (elapsed: number) => {
      const time = Math.min(total, (elapsed / 12000) * total);
      dots.attr("cx", (d) =>
        x(Math.min(time, d === 0 ? result.baseTotal : result.aiTotal)),
      );
      marker.attr("x1", x(time)).attr("x2", x(time));
    };
    draw(this.elapsed);
    if (this.playing && this.motion()) {
      if (this.elapsed >= 12000) this.elapsed = 0;
      const initial = this.elapsed,
        speed = Number(this.value("playback")) || 1;
      this.timer = d3.timer((ms) => {
        this.elapsed = Math.min(12000, initial + ms * speed);
        draw(this.elapsed);
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
      `${result.saved === 0 ? this.t("生产节省与额外复核恰好抵消。", "Production savings exactly offset extra review.") : result.saved < 0 ? this.t("额外复核超过了内容生产节省。", "Extra review outweighs production savings.") : this.t("内容生产节省超过额外复核成本。", "Production savings exceed extra review costs.")} ${this.t("当前耗时最多的阶段", "Largest effort stage")}: ${labels[maxIdx]}。 ${result.saved >= 0 ? this.t("节省", "Saves") : this.t("增加", "Adds")} ${Math.abs((result.baseTotal - result.aiTotal) / 60).toFixed(1)} ${this.t("小时。圆点表示同一批任务在串行总工时中的进度；整段约 12 秒，支持变速播放。", "hours. Dots show progress through serial effort for the same batch; playback takes about 12 seconds at 1×.")}`,
    );
  }
  private sensitivity() {
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
          `节省区间 > ${threshold.toFixed(1)}%`,
          `Savings above ${threshold.toFixed(1)}%`,
        ),
        "label",
        threshold > 55 ? "end" : "start",
      ).style("font-size", "11px");
      svg
        .append("circle")
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
            "在当前加速与复核条件下，提高参与比例也无法获得正的净工时节省。",
            "At these speed and review settings, participation cannot produce positive net savings.",
          )
        : this.t(
            `参与比例超过 ${threshold.toFixed(1)}% 时，模型才产生净工时节省。`,
            `The model produces net effort savings above ${threshold.toFixed(1)}% participation.`,
          ),
    );
  }
  private energy() {
    const indexed = this.value("energy") === "index";
    this.q(".viz-heading p").textContent = indexed
      ? this.t(
          "全球全部数据中心 · 指数（2025 = 100）",
          "All global data centres · index (2025 = 100)",
        )
      : this.t(
          "全球全部数据中心用电 · TWh · IEA 2026版",
          "Global electricity use of all data centres · TWh · IEA 2026 edition",
        );
    const { svg, w } = this.svg(280);
    this.status(drawEnergy(svg, w, this.locale, indexed, this.duration()));
  }
  private sources() {
    const query = this.value("search").trim().toLocaleLowerCase();
    let count = 0;
    this.querySelectorAll<HTMLElement>("[data-source-row]").forEach((row) => {
      row.hidden =
        !((row.textContent ?? "") + " " + (row.querySelector("a")?.href ?? ""))
          .toLocaleLowerCase()
          .includes(query) ||
        (this.value("sourceType") !== "all" &&
          row.dataset.evidenceType !== this.value("sourceType"));
      if (!row.hidden) count++;
    });
    this.q("[data-count]").textContent = this.t(
      `${count} 个来源`,
      `${count} sources`,
    );
    this.status(
      count
        ? ""
        : this.t(
            "没有匹配的来源，请换一个关键词。",
            "No matching sources. Try another term.",
          ),
    );
  }
}
if (!customElements.get("ai-viz")) customElements.define("ai-viz", AiViz);
