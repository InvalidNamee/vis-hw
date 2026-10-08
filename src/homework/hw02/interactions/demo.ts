import { canAnimate } from "./motion";
export interface DemoStep {
  label: string;
  apply: () => void;
  duration: number | (() => number);
}
/** Finite, opt-in presentation; input always takes control back. */
export class Demo {
  private timer?: ReturnType<typeof setTimeout>;
  private index = -1;
  private running = false;
  private complete = false;
  private remaining = 0;
  private due = 0;
  private initialLabel: string;
  constructor(
    private host: HTMLElement,
    private steps: DemoStep[],
    signal: AbortSignal,
    private onPause: () => void,
    private onResume: () => void = () => {},
  ) {
    this.initialLabel =
      host.querySelector('[data-action="demo"]')?.textContent ?? "";
    const opts = { signal };
    host.addEventListener(
      "click",
      (event) => {
        const action = (event.target as Element).closest<HTMLElement>(
          "[data-action]",
        )?.dataset.action;
        if (action === "demo") this.running ? this.pause() : this.start();
        if (action === "demo-replay") this.start(true);
      },
      opts,
    );
    const takeover = (event: Event) => {
      const target = event.target as Element;
      if (target.closest('[data-action="demo"],[data-action="demo-replay"]'))
        return;
      if (target.closest('button,input,select,svg [role="button"]'))
        this.cancel();
    };
    host.addEventListener("pointerdown", takeover, opts);
    host.addEventListener(
      "keydown",
      (event) => {
        if (
          [
            "Enter",
            " ",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Home",
            "End",
          ].includes(event.key)
        )
          takeover(event);
      },
      opts,
    );
    host.addEventListener("input", takeover, opts);
    host.addEventListener("change", takeover, opts);
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) this.pause();
      },
      opts,
    );
    matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
      "change",
      () => {
        this.pause();
        this.sync();
      },
      opts,
    );
    signal.addEventListener("abort", () => this.pause(), { once: true });
    this.sync();
  }
  private en() {
    return this.host.dataset.lang === "en";
  }
  private sync() {
    const button = this.host.querySelector<HTMLButtonElement>(
      '[data-action="demo"]',
    );
    if (button) {
      button.setAttribute("aria-pressed", String(this.running));
      button.disabled = !canAnimate();
      button.textContent = this.running
        ? this.en()
          ? "Pause demonstration"
          : "暂停演示"
        : this.complete
          ? this.en()
            ? "Replay demonstration"
            : "重新演示"
          : this.index >= 0
            ? this.en()
              ? "Continue demonstration"
              : "继续演示"
            : this.initialLabel;
    }
    const replay = this.host.querySelector<HTMLButtonElement>(
      '[data-action="demo-replay"]',
    );
    if (replay) replay.disabled = !canAnimate();
    const status = this.host.querySelector("[data-demo-status]");
    if (status)
      status.textContent = !canAnimate()
        ? this.en()
          ? "Reduced motion: select scenarios manually."
          : "已开启减少动态效果：可以手动选择情景。"
        : this.index < 0
          ? ""
          : `${this.index + 1}/${this.steps.length} · ${this.steps[this.index].label}${this.complete ? (this.en() ? " · Complete" : " · 演示完成") : ""}`;
  }
  private schedule(ms: number) {
    this.remaining = ms;
    this.due = performance.now() + ms;
    this.timer = setTimeout(() => this.advance(), ms);
  }
  private advance() {
    if (!this.running) return;
    if (this.index + 1 === this.steps.length) {
      this.running = false;
      this.complete = true;
      this.onPause();
      this.sync();
      return;
    }
    this.index++;
    const step = this.steps[this.index];
    step.apply();
    this.sync();
    this.schedule(
      typeof step.duration === "function" ? step.duration() : step.duration,
    );
  }
  start(replay = false) {
    if (!canAnimate() || document.hidden) return;
    clearTimeout(this.timer);
    if (replay || this.complete || this.index < 0) {
      this.index = -1;
      this.complete = false;
      this.running = true;
      this.advance();
    } else {
      this.running = true;
      this.onResume();
      this.schedule(this.remaining);
      this.sync();
    }
  }
  pause() {
    if (!this.running) return;
    clearTimeout(this.timer);
    this.remaining = Math.max(0, this.due - performance.now());
    this.running = false;
    this.onPause();
    this.sync();
  }
  cancel() {
    this.pause();
    this.index = -1;
    this.complete = false;
    this.sync();
  }
}
