import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// The story controller restores reading/focus after responsive layout changes.
// Refresh decorative triggers separately without restoring their old scroll.
ScrollTrigger.config({
  autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
});

/** Decorative motion only: native anchors and the D3 scene controller own reading. */
class StoryExperience extends HTMLElement {
  private context?: ReturnType<typeof gsap.context>;
  private abort?: AbortController;
  private resize?: ResizeObserver;
  private frame = 0;
  private refreshTimer = 0;
  connectedCallback() {
    this.frame = requestAnimationFrame(() => this.mount());
  }
  disconnectedCallback() {
    cancelAnimationFrame(this.frame);
    clearTimeout(this.refreshTimer);
    this.resize?.disconnect();
    this.abort?.abort();
    this.context?.revert();
  }
  private mount() {
    if (!this.isConnected) return;
    this.abort = new AbortController();
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const setup = () => {
      this.context = gsap.context(() => {
        const cover = this.querySelector(".story-cover")!;
        gsap.fromTo(
          cover.querySelector("img"),
          { scale: 1.08, yPercent: 0 },
          {
            scale: 1.18,
            yPercent: 12,
            ease: "none",
            scrollTrigger: {
              trigger: cover,
              start: "top top",
              end: "bottom top",
              scrub: 0.6,
            },
          },
        );
      }, this);
    };
    if (!motion.matches) setup();
    motion.addEventListener(
      "change",
      () => {
        // ScrollTrigger reversion can restore an old scroll position. Preserve the
        // reader's current position when accessibility settings change mid-story.
        const position = {
          left: scrollX,
          top: scrollY,
          behavior: "instant" as ScrollBehavior,
        };
        this.context?.revert();
        this.context = undefined;
        if (!motion.matches) setup();
        window.scrollTo(position);
        ScrollTrigger.refresh();
        window.scrollTo(position);
      },
      { signal: this.abort.signal },
    );
    // Lazy D3 drawing and an opened data table can alter document height.
    const refresh = () => {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = window.setTimeout(() => {
        if (!this.isConnected) return;
        const position = {
          left: scrollX,
          top: scrollY,
          behavior: "instant" as ScrollBehavior,
        };
        ScrollTrigger.refresh();
        window.scrollTo(position);
      }, 180);
    };
    this.resize = new ResizeObserver(refresh);
    this.resize.observe(this);
    window.addEventListener("resize", refresh, { signal: this.abort.signal });
  }
}
if (!customElements.get("story-experience"))
  customElements.define("story-experience", StoryExperience);
