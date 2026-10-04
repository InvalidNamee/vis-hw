import { restoreLegacyAnchor } from "../compatibility";
let cleanup = () => {};
let initial = true;
function mount() {
  cleanup();
  const shell = document.querySelector<HTMLElement>(".hw-story-shell");
  if (!shell) return;
  const abort = new AbortController();
  let frame = 0;
  let viewportWidth = innerWidth;
  let readingStep: HTMLElement | undefined;
  let anchorStop: AbortController | undefined;
  const chapters = Array.from(
    shell.querySelectorAll<HTMLElement>("[data-story-chapter]"),
  );
  const menu = shell.querySelector<HTMLDetailsElement>(".story-menu")!;
  const openTarget = () => {
    const target = document.getElementById(
      decodeURIComponent(location.hash.slice(1)),
    );
    const details = target?.closest<HTMLDetailsElement>("details");
    if (details) details.open = true;
    if (target?.classList.contains("story-explore"))
      target
        .querySelector<HTMLDetailsElement>("details")
        ?.setAttribute("open", "");
  };
  const update = () => {
    frame = 0;
    // Keep the last reading position before a responsive layout changes height.
    if (viewportWidth === innerWidth && !anchorStop) {
      readingStep = Array.from(
        shell.querySelectorAll<HTMLElement>(".story-step[data-active]"),
      ).find((step) => {
        const box = step.getBoundingClientRect();
        return box.top < innerHeight && box.bottom > innerHeight * 0.5;
      });
    }
    const line =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--site-header-height",
        ),
      ) + 90;
    const active = chapters
      .filter((c) => c.getBoundingClientRect().top <= line)
      .at(-1);
    shell
      .querySelectorAll<HTMLAnchorElement>("[data-chapter-link]")
      .forEach((a) => {
        if (a.dataset.chapterLink === active?.id)
          a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
    const label = shell.querySelector("[data-story-current]");
    if (label && chapters.length)
      label.textContent =
        active?.querySelector("h2")?.textContent ??
        (shell.dataset.lang === "en"
          ? "AI and productive forces"
          : "人工智能与新质生产力");
    const progress = shell.querySelector<HTMLElement>("[data-story-progress]");
    if (progress)
      progress.style.transform = `scaleX(${Math.min(1, Math.max(0, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)))})`;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  shell.addEventListener(
    "click",
    (e) => {
      if ((e.target as Element).closest(".story-menu a")) menu.open = false;
    },
    { signal: abort.signal },
  );
  shell.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    },
    { signal: abort.signal },
  );
  window.addEventListener("scroll", schedule, {
    passive: true,
    signal: abort.signal,
  });
  window.addEventListener("hashchange", openTarget, { signal: abort.signal });
  const cover = shell.querySelector<HTMLElement>(".story-cover-copy");
  if (cover && !matchMedia("(prefers-reduced-motion:reduce)").matches)
    cover.animate(
      [
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 850, easing: "cubic-bezier(.22,1,.36,1)" },
    );
  restoreLegacyAnchor();
  openTarget();
  const settleAnchor = (readingTarget?: HTMLElement) => {
    const target =
      readingTarget ??
      document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    if (!readingTarget) openTarget();
    anchorStop?.abort();
    const stop = new AbortController();
    anchorStop = stop;
    stop.signal.addEventListener(
      "abort",
      () => {
        if (anchorStop === stop) anchorStop = undefined;
        schedule();
      },
      { once: true },
    );
    for (const event of ["wheel", "touchstart", "pointerdown", "keydown"])
      window.addEventListener(event, () => stop.abort(), {
        once: true,
        passive: true,
        signal: stop.signal,
      });
    let ticks = 0;
    const settle = () => {
      if (stop.signal.aborted) return;
      target.scrollIntoView({ behavior: "instant", block: "start" });
      if (++ticks < 35) requestAnimationFrame(settle);
      else stop.abort();
    };
    requestAnimationFrame(settle);
  };
  window.addEventListener("hashchange", () => settleAnchor(), {
    signal: abort.signal,
  });
  window.addEventListener(
    "resize",
    () => {
      if (viewportWidth === innerWidth) return;
      viewportWidth = innerWidth;
      if (readingStep) settleAnchor(readingStep);
      schedule();
    },
    { signal: abort.signal },
  );
  if (initial) {
    initial = false;
    settleAnchor();
  }
  schedule();
  cleanup = () => {
    abort.abort();
    anchorStop?.abort();
    cancelAnimationFrame(frame);
  };
}
document.addEventListener("astro:before-swap", () => cleanup());
document.addEventListener("astro:after-swap", mount);
mount();
