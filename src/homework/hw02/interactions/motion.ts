import * as d3 from "d3";
export const canAnimate = () =>
  !matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = "cubic-bezier(.22,1,.36,1)";
/** One owner per element: new input takes over at its current visual position. */
const animations = new WeakMap<Element, Animation>();
export function reveal(element: Element, duration = 650) {
  if (!canAnimate()) return;
  animations.get(element)?.cancel();
  const animation = element.animate(
    [
      { opacity: 0, transform: "translateY(8px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    { duration, easing: ease },
  );
  animations.set(element, animation);
}
export function showPanel(element: HTMLElement, visible: boolean) {
  element.removeAttribute("data-initial-hidden");
  if (element.hidden === !visible) return;
  element.hidden = !visible;
  if (visible) reveal(element, 280);
}
export function resizePanel(element: HTMLElement, before: number) {
  const after = element.getBoundingClientRect().height;
  if (!canAnimate() || !before || !after || Math.abs(after - before) < 2)
    return;
  animations.get(element)?.cancel();
  const animation = element.animate(
    [{ height: `${before}px` }, { height: `${after}px` }],
    { duration: 280, easing: ease },
  );
  animations.set(element, animation);
}
export function animateNumber(
  element: HTMLElement,
  value: number,
  suffix: string,
) {
  const selection = d3.select(element);
  selection.interrupt("number");
  const old = Number.parseFloat(element.textContent ?? "");
  const start = Number.isFinite(old) ? old : value;
  if (!canAnimate() || start === value) {
    element.textContent = `${value.toFixed(1)}${suffix}`;
    return;
  }
  selection
    .transition("number")
    .duration(450)
    .ease(d3.easeCubicOut)
    .tween("text", () => {
      const interpolate = d3.interpolateNumber(start, value);
      return (t) => {
        element.textContent = `${interpolate(t).toFixed(1)}${suffix}`;
      };
    });
}

type BoundElement = Element & {
  __data__?: unknown;
  __on?: {
    type: string;
    name: string;
    value: (...args: any[]) => void;
    options?: AddEventListenerOptions;
  }[];
};
function key(element: BoundElement, index: number): string {
  const datum = element.__data__ as
    { id?: string; industry?: string; cap?: string } | undefined;
  const identity =
    element.getAttribute("data-key") ??
    datum?.id ??
    (datum?.industry ? `${datum.industry}:${datum.cap}` : undefined);
  return `${element.tagName}:${identity ?? `${element.getAttribute("class") ?? ""}:${index}`}`;
}
const tweened = new Set([
  "x",
  "y",
  "x1",
  "x2",
  "y1",
  "y2",
  "cx",
  "cy",
  "r",
  "width",
  "height",
  "d",
  "transform",
  "opacity",
  "stroke-width",
  "fill",
  "stroke",
]);
function paint(element: Element, value: string) {
  const variable = /^var\((--[\w-]+)\)$/.exec(value);
  return variable
    ? getComputedStyle(element).getPropertyValue(variable[1]).trim()
    : value;
}
/** Reconcile detached drawing instructions into persistent, keyed SVG elements. */
function reconcile(
  current: BoundElement,
  next: BoundElement,
  duration: number,
) {
  const selection = d3.select(current);
  selection.interrupt("update");
  current.__data__ = next.__data__;
  for (const listener of current.__on ?? [])
    selection.on(`${listener.type}.${listener.name}`, null);
  for (const listener of next.__on ?? [])
    selection.on(
      `${listener.type}.${listener.name}`,
      listener.value,
      listener.options,
    );
  const incoming = new Set(Array.from(next.attributes, (a) => a.name));
  for (const attr of Array.from(current.attributes))
    if (!incoming.has(attr.name)) current.removeAttribute(attr.name);
  let transition: ReturnType<typeof selection.transition> | undefined;
  for (const attr of Array.from(next.attributes)) {
    const from = current.getAttribute(attr.name),
      to = attr.value;
    if (from === to) continue;
    const color = attr.name === "fill" || attr.name === "stroke";
    if (
      duration &&
      from !== null &&
      tweened.has(attr.name) &&
      (!color || (from !== "none" && to !== "none"))
    ) {
      transition ??= selection
        .transition("update")
        .delay(
          current.tagName === "path" && next.getAttribute("opacity") === "1"
            ? Math.min(Number(next.getAttribute("data-order")) || 0, 4) * 35
            : 0,
        )
        .duration(duration)
        .ease(d3.easeCubicOut);
      transition.attrTween(attr.name, () =>
        color
          ? d3.interpolateRgb(paint(current, from), paint(current, to))
          : d3.interpolateString(from, to),
      );
      if (color)
        transition.on(`end.${attr.name}`, () =>
          current.setAttribute(attr.name, to),
        );
    } else current.setAttribute(attr.name, to);
  }
  if (!next.children.length) {
    if (current.textContent !== next.textContent)
      current.textContent = next.textContent;
    return;
  }
  const oldChildren = Array.from(current.children) as BoundElement[];
  const old = new Map(oldChildren.map((node, i) => [key(node, i), node]));
  const kept = new Set<Element>();
  Array.from(next.children).forEach((child, index) => {
    const template = child as BoundElement;
    const existing = old.get(key(template, index));
    const node = existing ?? template;
    if (existing) reconcile(existing, template, duration);
    else if (duration) reveal(node, 280);
    kept.add(node);
    if (current.children[index] !== node)
      current.insertBefore(node, current.children[index] ?? null);
  });
  for (const child of oldChildren) if (!kept.has(child)) child.remove();
}
export function commitPlot(
  stage: HTMLElement,
  next: SVGSVGElement,
  duration: number,
  view: string,
) {
  const previous = stage.querySelector<SVGSVGElement>("svg");
  if (!previous) {
    stage.append(next);
    return;
  }
  if (previous.dataset.view !== view) {
    const ghost = previous.cloneNode(true) as SVGSVGElement;
    ghost.setAttribute("aria-hidden", "true");
    ghost.setAttribute("inert", "");
    ghost
      .querySelectorAll("[tabindex]")
      .forEach((n) => n.removeAttribute("tabindex"));
    ghost.style.cssText = "position:absolute;inset:0;pointer-events:none";
    stage.replaceChildren(next);
    if (duration) {
      stage.append(ghost);
      ghost.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 280,
        easing: ease,
      }).onfinish = () => ghost.remove();
      reveal(next, 280);
    }
    return;
  }
  // Remove a previous cross-fade before accepting another update.
  stage.querySelectorAll('svg[aria-hidden="true"]').forEach((n) => n.remove());
  reconcile(previous as BoundElement, next as BoundElement, duration);
}
export function enterPlot(svg: SVGSVGElement) {
  if (!canAnimate()) return;
  reveal(svg, 650);
  svg
    .querySelectorAll<SVGPathElement>('path[fill="none"]:not(.domain)')
    .forEach((path, i) => {
      const length = path.getTotalLength();
      if (!length || path.hasAttribute("stroke-dasharray")) return;
      path.animate(
        [
          { strokeDasharray: `${length} ${length}`, strokeDashoffset: length },
          { strokeDasharray: `${length} ${length}`, strokeDashoffset: 0 },
        ],
        { duration: 650, delay: Math.min(i * 40, 160), easing: ease },
      );
    });
}
