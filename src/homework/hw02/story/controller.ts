import { storyChapters } from "./content";
import { mountNarration } from "./narration";
import type { Scene } from "./graphics";
import type { ScrollTrigger as Trigger } from "gsap/ScrollTrigger";
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleRefresh(refresh: () => void) {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refresh, 80);
}
/** Small shell; drawing and scrolling libraries are fetched near the first scene. */
class StoryScene extends HTMLElement {
  abort?: AbortController;
  near?: IntersectionObserver;
  headerSize?: MutationObserver;
  resize?: ResizeObserver;
  trigger?: Trigger;
  scene?: Scene;
  statics: Scene[] = [];
  disposeMedia?: () => void;
  positions: number[] = [];
  active = false;
  pending = false;
  remount = false;
  lastWidth = 0;
  lastHeight = 0;
  connectedCallback() {
    this.abort = new AbortController();
    const canEnhance = () => {
      const header =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--site-header-height",
          ),
        ) || 65;
      return (
        !matchMedia("(prefers-reduced-motion:reduce)").matches &&
        innerHeight - header - 44 >= (innerWidth >= 1024 ? 560 : 520)
      );
    };
    this.toggleAttribute("data-reserved", canEnhance());
    let eligible = canEnhance();
    const reconsider = () => {
      const next = canEnhance();
      if (next !== eligible) {
        eligible = next;
        const initialized =
          !!this.scene || this.statics.length > 0 || this.pending;
        this.disposeMedia?.();
        this.scene = undefined;
        this.statics = [];
        this.toggleAttribute("data-reserved", next);
        if (this.pending) this.remount = true;
        else if (initialized) void this.mount();
      }
    };
    window.addEventListener("resize", reconsider, {
      signal: this.abort.signal,
    });
    // The shared header measures itself after fonts, language and wrapping settle.
    this.headerSize = new MutationObserver(reconsider);
    this.headerSize.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
    this.near = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void this.mount();
      },
      { rootMargin: `${Math.max(1400, innerHeight * 2)}px 0px` },
    );
    this.near.observe(this);
    // Prepare the opening diagram while the cover is still being read.
    if (this.dataset.chapter === "workplace") void this.mount();
  }
  async mount() {
    if (this.pending || this.scene || this.statics.length) return;
    this.pending = true;
    try {
      const [{ mountScene }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("./graphics"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (!this.isConnected || this.abort?.signal.aborted) return;
      gsap.registerPlugin(ScrollTrigger);
      const chapter = storyChapters.find((c) => c.id === this.dataset.chapter)!;
      const lang = this.dataset.lang === "en" ? "en" : "zh";
      const mm = gsap.matchMedia();
      this.disposeMedia = () => mm.revert();
      mm.add(
        {
          desktop: "(min-width:1024px)",
          mobile: "(max-width:1023px)",
          reduce: "(prefers-reduced-motion:reduce)",
        },
        (context) => {
          const header = () =>
            parseFloat(
              getComputedStyle(document.documentElement).getPropertyValue(
                "--site-header-height",
              ),
            ) || 65;
          const available = innerHeight - header() - 44;
          const enhanced =
            !context.conditions!.reduce &&
            available >= (context.conditions!.desktop ? 560 : 520);
          const steps = Array.from(
            this.querySelectorAll<HTMLElement>(".story-step"),
          );
          if (!enhanced) {
            this.removeAttribute("data-reserved");
            this.removeAttribute("data-enhanced");
            this.statics = steps.map((step, i) => {
              const chart = mountScene(
                step.querySelector<HTMLElement>(".step-static")!,
                [chapter.steps[i]],
                lang,
              );
              chart.seek(0, 1);
              return chart;
            });
            const resize = new ResizeObserver(() => {
              const width = Math.round(this.clientWidth);
              if (width !== this.lastWidth) {
                this.lastWidth = width;
                this.statics.forEach((scene) => scene.resize());
              }
            });
            resize.observe(this);
            return () => {
              resize.disconnect();
              this.statics.forEach((s) => s.destroy());
              this.statics = [];
            };
          }
          this.scene = mountScene(
            this.querySelector<HTMLElement>(".story-plot")!,
            chapter.steps,
            lang,
          );
          this.scene.seek(0, 1);
          this.dataset.enhanced = "";
          this.dataset.reserved = "";
          const narration = context.conditions!.desktop
            ? mountNarration(this, steps, gsap)
            : undefined;
          const measure = () => {
            narration?.measure();
            const stageHeight = context.conditions!.desktop
              ? 0
              : this.querySelector(".story-stage")!.getBoundingClientRect()
                  .height;
            const line =
              header() +
              44 +
              stageHeight +
              (context.conditions!.desktop
                ? 0
                : Math.max(
                    60,
                    (innerHeight - header() - 44 - stageHeight) * 0.36,
                  ));
            this.positions = steps.map(
              (s) => scrollY + s.getBoundingClientRect().top - line,
            );
            return steps;
          };
          const proxy = { position: scrollY };
          const render = (animate = this.active) => {
            if (!this.scene) return;
            const y = proxy.position;
            let index = this.positions.findLastIndex((p) => y >= p);
            index = Math.max(0, index);
            const end =
              this.positions[index + 1] ??
              this.positions[index] + steps[index].offsetHeight;
            const p = Math.min(
              1,
              Math.max(
                0,
                (y - this.positions[index]) /
                  Math.max(1, end - this.positions[index]),
              ),
            );
            this.scene.seek(index, p);
            narration?.show(index, animate);
            steps.forEach((s, i) =>
              s.toggleAttribute("data-active", i === index),
            );
          };
          measure();
          render(false);
          // Reuse one follower tween; repeated wheel events retain its current position.
          const follow = gsap.quickTo(proxy, "position", {
            duration: 0.42,
            ease: "power3.out",
            onUpdate: () => render(),
          });
          this.trigger = ScrollTrigger.create({
            trigger: this,
            start: "top bottom",
            end: "bottom top",
            onRefresh: () => {
              measure();
              follow.tween.pause();
              proxy.position = scrollY;
              this.scene?.resize();
              render(false);
            },
            onUpdate: (self) => {
              this.active = self.isActive;
              if (document.hidden) return;
              if (
                !self.isActive ||
                Math.abs(scrollY - proxy.position) > innerHeight
              ) {
                follow.tween.pause();
                proxy.position = scrollY;
                render(false);
              } else follow(scrollY);
            },
          });
          const refresh = () => scheduleRefresh(() => ScrollTrigger.refresh());
          const local = new AbortController();
          document
            .querySelectorAll("details.explore-disclosure")
            .forEach((d) =>
              d.addEventListener("toggle", refresh, { signal: local.signal }),
            );
          window.addEventListener(
            "hashchange",
            () => {
              measure();
              follow.tween.pause();
              proxy.position = scrollY;
              render(false);
            },
            { signal: local.signal },
          );
          document.addEventListener(
            "visibilitychange",
            () => {
              if (document.hidden) follow.tween.pause();
              else {
                proxy.position = scrollY;
                render(false);
              }
            },
            { signal: local.signal },
          );
          const theme = new MutationObserver(() => {
            this.scene?.resize();
            render();
          });
          theme.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
          });
          this.resize = new ResizeObserver(() => {
            const w = Math.round(this.clientWidth);
            const h = Math.round(
              this.parentElement!.getBoundingClientRect().height,
            );
            if (w !== this.lastWidth || h !== this.lastHeight) {
              this.lastWidth = w;
              this.lastHeight = h;
              refresh();
            }
          });
          this.resize.observe(this.parentElement!);
          // Cover parallax and poster transitions live in poster.ts.
          requestAnimationFrame(refresh);
          return () => {
            local.abort();
            theme.disconnect();
            this.resize?.disconnect();
            follow.tween.kill();
            narration?.destroy();
            this.trigger?.kill();
            this.scene?.destroy();
            this.scene = undefined;
            this.removeAttribute("data-enhanced");
          };
        },
        this,
      );
      this.near?.disconnect();
    } catch {
      this.removeAttribute("data-reserved");
      this.removeAttribute("data-enhanced");
      this.dataset.sceneFailed =
        ""; /* Static text and source links remain readable. */
    } finally {
      this.pending = false;
      if (this.remount && this.isConnected && !this.abort?.signal.aborted) {
        this.remount = false;
        this.disposeMedia?.();
        this.scene = undefined;
        this.statics = [];
        void this.mount();
      }
    }
  }
  disconnectedCallback() {
    this.abort?.abort();
    this.near?.disconnect();
    this.headerSize?.disconnect();
    this.disposeMedia?.();
    this.resize?.disconnect();
  }
}
if (!customElements.get("story-scene"))
  customElements.define("story-scene", StoryScene);
