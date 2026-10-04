/** Fetch the chart runtime only when a visible/open chart approaches the reader. */
let observer: IntersectionObserver | undefined;
let abort: AbortController | undefined;
let runtime: Promise<unknown> | undefined;
function mount() {
  observer?.disconnect();
  abort?.abort();
  abort = new AbortController();
  const load = () => {
    runtime ??= import("../visualizations/charts").catch(() => {
      runtime = undefined;
    });
  };
  observer = new IntersectionObserver(
    (entries) => {
      if (
        entries.some(
          (e) => e.isIntersecting && !e.target.closest("details:not([open])"),
        )
      ) {
        load();
      }
    },
    { rootMargin: "900px 0px" },
  );
  document.querySelectorAll("ai-viz").forEach((el) => observer!.observe(el));
  document.querySelectorAll("details.explore-disclosure").forEach((el) =>
    el.addEventListener(
      "toggle",
      () => {
        if ((el as HTMLDetailsElement).open) load();
      },
      { signal: abort!.signal },
    ),
  );
}
document.addEventListener("astro:before-swap", () => {
  observer?.disconnect();
  abort?.abort();
});
document.addEventListener("astro:after-swap", mount);
mount();
