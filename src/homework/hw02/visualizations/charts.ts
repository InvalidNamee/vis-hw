import * as d3 from "d3";
import { industryCases, dataset, text, type Lang } from "../data";
import { defaults, presets } from "../model.mjs";
import { drawEvidence } from "./evidence-charts";
import { drawScience } from "./science-graphs";
import { drawOutcome, drawAdoption, drawEnergy } from "./quantitative-charts";
import { renderIndustry } from "../interactions/industry";
import { renderLab, renderSensitivity } from "../interactions/lab";
import { Demo } from "../interactions/demo";
import { commitPlot, enterPlot } from "../interactions/motion";
import {
  stateEvent,
  setParams,
  fromUrl,
  restoreControl,
} from "../interactions/url-state";

import type { ChartKind } from "./types";
type Svg = d3.Selection<SVGSVGElement, null, HTMLElement, unknown>;
export class AiViz extends HTMLElement {
  abort?: AbortController;
  resize?: ResizeObserver;
  theme?: MutationObserver;
  frame = 0;
  timer?: d3.Timer;
  locale: Lang = "zh";
  kind: ChartKind = "adoption";
  view = "network";
  playing = false;
  elapsed = 0;
  lastWidth = 0;
  t = (zh: string, en: string) => text(this.locale, zh, en);
  q<T extends Element = HTMLElement>(s: string) {
    return this.querySelector<T>(s)!;
  }
  status(message: string) {
    const p = this.querySelector("[data-status]");
    if (p) p.textContent = message;
  }
  value(key: string) {
    return (
      this.q<HTMLInputElement | HTMLSelectElement>(`[data-control="${key}"]`)
        ?.value ?? ""
    );
  }
  motion() {
    return !matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  duration() {
    return this.motion() ? 450 : 0;
  }
  controlDefaults = new Map<string, string>();
  loader?: IntersectionObserver;
  visibility?: IntersectionObserver;
  mounted = false;
  connectedCallback() {
    this.loader = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((e) => e.isIntersecting) &&
          !this.closest("details:not([open])")
        ) {
          this.loader?.disconnect();
          this.mount();
        }
      },
      { rootMargin: "900px 0px" },
    );
    this.loader.observe(this);
  }
  disconnectedCallback() {
    cancelAnimationFrame(this.frame);
    this.loader?.disconnect();
    this.visibility?.disconnect();
    this.mounted = false;
    this.abort?.abort();
    this.resize?.disconnect();
    this.theme?.disconnect();
    this.timer?.stop();
    this.entrance?.disconnect();
    this.demo?.pause();
    d3.select(this).selectAll("*").interrupt("update").interrupt("number");
  }
  mount() {
    if (!this.isConnected || this.mounted) return;
    this.mounted = true;
    this.dataset.ready = "";
    this.kind = this.dataset.kind as ChartKind;
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
      const restore = () =>
        restoreControl(control, this.controlDefaults.get(key)!);
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
        restoreControl(c, this.controlDefaults.get(c.dataset.control!)!);
      });
      this.view =
        fromUrl("view", "network") === "matrix" ? "matrix" : "network";
      this.demo?.cancel();
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
        this.demo?.pause();
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
    this.visibility = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) {
        this.demo?.pause();
        this.timer?.stop();
        this.playing = false;
        this.updatePlayButton();
      }
    });
    this.visibility.observe(this);
    this.render();
    this.entrance = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.entered = true;
          const svg = this.querySelector<SVGSVGElement>("svg");
          if (svg) enterPlot(svg);
          this.entrance?.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    this.entrance.observe(this.q("[data-chart]"));
    if (this.kind === "industry" || this.kind === "lab") {
      const steps =
        this.kind === "industry"
          ? industryCases.map((c) => ({
              label: c.name[this.locale],
              duration: 3000,
              apply: () => {
                this.view = "network";
                setParams({ view: "network" });
                this.selectIndustry(c.id);
              },
            }))
          : Object.entries(presets).map(([id, values]) => ({
              label: this.q(`[data-preset="${id}"]`).textContent!,
              duration: () => 12600 / (Number(this.value("playback")) || 1),
              apply: () => {
                for (const [key, value] of Object.entries(values))
                  this.q<HTMLInputElement>(`[data-control="${key}"]`).value =
                    String(value);
                setParams(
                  Object.fromEntries(
                    Object.entries(values).map(([key, value]) => [
                      key,
                      String(value),
                    ]),
                  ),
                );
                this.elapsed = 0;
                this.playing = true;
                this.render();
              },
            }));
      this.demo = new Demo(
        this,
        steps,
        this.abort.signal,
        () => {
          this.timer?.stop();
          this.playing = false;
          this.updatePlayButton();
        },
        () => {
          if (this.kind === "lab") {
            this.playing = true;
            this.render();
          }
        },
      );
    }
  }
  async share() {
    setParams(
      Object.fromEntries(
        Array.from(
          this.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
            "[data-control]",
          ),
        ).map((c) => [c.dataset.control!, c.value]),
      ),
    );
    const url = new URL(location.href);
    url.hash = this.kind === "lab" ? "parameters" : "applications";
    history.replaceState(history.state, "", url);
    try {
      await navigator.clipboard.writeText(url.href);
      this.status(this.t("情景链接已复制。", "Scenario link copied."));
    } catch {
      this.status(
        this.t(
          "请手动复制地址栏链接，参数已经保存在其中。",
          "Copy the address bar URL; your parameters are saved.",
        ),
      );
    }
  }
  pendingPlot?: SVGSVGElement;
  entered = false;
  entrance?: IntersectionObserver;
  demo?: Demo;
  svg(height: number): { svg: Svg; w: number; h: number } {
    const stage = this.q<HTMLElement>("[data-chart]");
    const w = Math.max(260, stage.clientWidth);
    const node = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    node.dataset.view = this.kind === "industry" ? this.view : this.kind;
    this.pendingPlot = node;
    const svg = d3
      .select(node)
      .attr("viewBox", `0 0 ${w} ${height}`)
      .attr("role", "img")
      .attr("aria-label", this.q("h2").textContent) as unknown as Svg;
    return { svg, w, h: height };
  }
  render() {
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
        drawScience(
          svg,
          w,
          this.kind,
          this.locale,
          (message) => this.status(message),
          {
            focus: Number(fromUrl(`${this.kind}Step`, "0")) || 0,
            onSelect: (focus) => {
              setParams({ [`${this.kind}Step`]: String(focus) });
              this.render();
            },
          },
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
    }
    if (this.pendingPlot) {
      const stage = this.q<HTMLElement>("[data-chart]");
      commitPlot(
        stage,
        this.pendingPlot,
        this.entered ? this.duration() : 0,
        this.pendingPlot.dataset.view!,
      );
      this.pendingPlot = undefined;
    }
    if (focusLabel)
      this.querySelectorAll<SVGElement>("svg [tabindex]").forEach((node) => {
        if (node.getAttribute("aria-label") === focusLabel) node.focus();
      });
  }
  label(
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
  adoption() {
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
  investment() {
    const { svg, w } = this.svg(265);
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
    rows.attr("transform", (d) => `translate(0,${y(d.id)})`);
    rows
      .select("rect")
      .attr("x", left)
      .attr("height", y.bandwidth())
      .attr("fill", "var(--hw-blue)")
      .attr("opacity", (d) => (d.id === "investment-us" ? 0.9 : 0.5))

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

      .attr("x", (d) => x(d.value) + 6);
    this.status(
      this.t(
        "2025 年快照：只比较投资规模，不据此推断国家生产率。",
        "A 2025 snapshot of investment, not a productivity comparison.",
      ),
    );
  }
  capability() {
    const id = fromUrl("capability", "");
    return dataset.capabilities.some((c) => c.id === id) ? id : "";
  }
  selectIndustry(id: string) {
    const control = this.q<HTMLSelectElement>("[data-control=industry]");
    control.value = id;
    setParams({ industry: id, capability: "" });
    this.render();
  }
  industry() {
    renderIndustry.call(this);
  }
  effects() {
    const { svg, w } = this.svg(225);
    this.status(
      drawOutcome(svg, w, this.value("effect") || "support", this.locale),
    );
  }
  params() {
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
  updatePlayButton() {
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
  lab() {
    renderLab.call(this);
  }
  sensitivity() {
    renderSensitivity.call(this);
  }
  energy() {
    const indexed = this.value("energy") === "index";
    this.q(".viz-heading p").textContent = indexed
      ? this.t(
          "全球全部数据中心 · 指数（2025 = 100）",
          "All global data centres · index (2025 = 100)",
        )
      : this.t(
          "全球全部数据中心用电 · TWh · IEA 2026 版",
          "Global electricity use of all data centres · TWh · IEA 2026 edition",
        );
    const { svg, w } = this.svg(280);
    this.status(drawEnergy(svg, w, this.locale, indexed));
  }
}
if (!customElements.get("ai-viz")) customElements.define("ai-viz", AiViz);
