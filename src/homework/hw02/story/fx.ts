/** Shared poster effects. Every effect ends on the real DOM text and returns a disposer. */
const GLYPHS = "01<>/\\[]{}#*+=-_░▒▓█ΔΣΩλ∑∂";
const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

/** Scramble characters, then resolve them left to right. The text node is restored on dispose. */
export function decodeText(el: HTMLElement, duration = 1100, delay = 0) {
  const finalText = el.textContent ?? "";
  const chars = Array.from(finalText);
  // Hold the final box size so scrambling never reflows the poster.
  el.setAttribute("aria-label", finalText);
  let frame = 0;
  let start = 0;
  const tick = (now: number) => {
    if (!start) start = now + delay;
    const t = Math.max(0, (now - start) / duration);
    const resolved = Math.floor(t * chars.length * 1.15);
    el.textContent = chars
      .map((c, i) => (c.trim() === "" || i < resolved ? c : pick()))
      .join("");
    if (resolved < chars.length) frame = requestAnimationFrame(tick);
    else el.textContent = finalText;
  };
  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    el.textContent = finalText;
    el.removeAttribute("aria-label");
  };
}

/** Split text into per-character spans for staggered GSAP motion; reversible. */
export function splitChars(el: HTMLElement) {
  const original = el.innerHTML;
  const text = el.textContent ?? "";
  el.setAttribute("aria-label", text);
  el.innerHTML = "";
  const spans = Array.from(text).map((c) => {
    const span = document.createElement("span");
    span.className = "fx-char";
    span.setAttribute("aria-hidden", "true");
    span.textContent = c;
    el.append(span);
    return span;
  });
  return {
    spans,
    restore() {
      el.innerHTML = original;
      el.removeAttribute("aria-label");
    },
  };
}

let glowId = 0;
/** Inject one glow filter per SVG; returns its url() reference. */
export function ensureGlow(svg: SVGSVGElement, blur = 3) {
  const existing = svg.querySelector<SVGFilterElement>("filter[data-fx-glow]");
  if (existing) return `url(#${existing.id})`;
  const ns = "http://www.w3.org/2000/svg";
  let defs = svg.querySelector<SVGDefsElement>("defs");
  if (!defs) {
    defs = document.createElementNS(ns, "defs");
    svg.prepend(defs);
  }
  const filter = document.createElementNS(ns, "filter");
  filter.id = `hw02-glow-${++glowId}`;
  filter.dataset.fxGlow = "";
  filter.setAttribute("x", "-50%");
  filter.setAttribute("y", "-50%");
  filter.setAttribute("width", "200%");
  filter.setAttribute("height", "200%");
  filter.innerHTML = `<feGaussianBlur stdDeviation="${blur}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>`;
  defs.append(filter);
  return `url(#${filter.id})`;
}

/** Heavy SVG filters are skipped on small screens and WebKit-on-touch. */
export const allowFilters = () =>
  matchMedia("(min-width:1024px) and (pointer:fine)").matches;

export const prefersReduced = () =>
  matchMedia("(prefers-reduced-motion:reduce)").matches;
