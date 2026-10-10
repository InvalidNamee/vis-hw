/** Shared title and SVG poster effects. */
/** Original character stagger, with English words kept together for wrapping. */
export function splitChars(el: HTMLElement) {
  const original = el.innerHTML;
  const text = el.textContent ?? "";
  const english = el.closest("[data-lang]")?.getAttribute("data-lang") === "en";
  el.setAttribute("aria-label", text);
  el.replaceChildren();
  const spans: HTMLSpanElement[] = [];
  for (const token of english ? text.match(/\S+|\s+/g) ?? [] : Array.from(text)) {
    if (english && /^\s+$/.test(token)) {
      el.append(document.createTextNode(token));
      continue;
    }
    const host = english ? document.createElement("span") : el;
    if (english) {
      host.className = "fx-word";
      el.append(host);
    }
    for (const char of Array.from(token)) {
      const span = document.createElement("span");
      span.className = "fx-char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = char;
      host.append(span);
      spans.push(span);
    }
  }
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
