/** Scroll changes the diagram's meaning. Axes, baselines and background tracks stay put. */
import { allowFilters, ensureGlow } from "./fx";
let nextClip = 0;
const SVG_NS = "http://www.w3.org/2000/svg";
/** Bright head that rides the leading edge of a growing mark. */
function head(svg: SVGSVGElement, color = "var(--hw-blue)") {
  const dot = document.createElementNS(SVG_NS, "circle");
  dot.setAttribute("r", "3.5");
  dot.setAttribute("fill", color);
  dot.classList.add("fx-head");
  if (allowFilters()) dot.setAttribute("filter", ensureGlow(svg, 3));
  svg.append(dot);
  return dot;
}
/** Counts a label from 0 to its drawn value, keeping its decimals and suffix. */
function counter(node?: SVGTextElement) {
  const text = node?.textContent ?? "";
  const match = text.match(/^(-?[\d.,]+)(.*)$/s);
  if (!node || !match) return () => {};
  const target = Number(match[1].replace(/,/g, ""));
  const decimals = (match[1].split(".")[1] ?? "").length;
  return (p: number) => {
    node.textContent = p >= 1 ? text : (target * p).toFixed(decimals) + match[2];
  };
}
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const attr = (node: Element, key: string) => Number(node.getAttribute(key));
const stagger = (phase: number, order: number, count: number) =>
  clamp((phase - order * 0.12) / (1 - Math.max(0, count - 1) * 0.12));

export function drawingMotion(
  svg: SVGSVGElement,
  kind: string,
): (phase: number) => void {
  if (kind.startsWith("effects-")) {
    const line = svg.querySelector<SVGLineElement>('line[stroke-width="5"]')!;
    const point = svg.querySelector<SVGCircleElement>(
      'circle[fill="var(--hw-mint)"]',
    )!;
    const value = Array.from(svg.querySelectorAll("text")).find((node) =>
      node.textContent?.startsWith("AI "),
    )!;
    const start = attr(line, "x1"),
      end = attr(line, "x2");
    if (allowFilters()) {
      const glow = ensureGlow(svg, 4);
      point.setAttribute("filter", glow);
      line.setAttribute("filter", glow);
    }
    // Short afterimages show the direction of the reported change.
    const ghosts = [0.06, 0.12, 0.18].map((lag, i) => {
      const ghost = point.cloneNode() as SVGCircleElement;
      ghost.removeAttribute("filter");
      ghost.style.opacity = String(0.35 - i * 0.1);
      point.before(ghost);
      return { ghost, lag };
    });
    return (phase) => {
      const x = start + (end - start) * phase;
      line.setAttribute("x2", String(x));
      point.setAttribute("cx", String(x));
      ghosts.forEach(({ ghost, lag }) => {
        const gp = Math.max(0, phase - lag);
        ghost.setAttribute("cx", String(start + (end - start) * gp));
        ghost.style.visibility = phase > 0 && phase < 1 ? "visible" : "hidden";
      });
      value.setAttribute("x", String(x));
      value.style.opacity = String(clamp((phase - 0.55) / 0.45));
    };
  }
  if (kind === "adoption") {
    const paths = Array.from(
      svg.querySelectorAll<SVGPathElement>(":scope > path"),
    );
    const points = Array.from(
      svg.querySelectorAll<SVGGElement>(".adoption-point"),
    );
    const width = svg.viewBox.baseVal.width;
    // Reveal by time along the x-axis, not by the line's geometric length.
    const clip = document.createElementNS(svg.namespaceURI, "clipPath");
    const rect = document.createElementNS(svg.namespaceURI, "rect");
    clip.id = `story-trend-${++nextClip}`;
    rect.setAttribute("height", String(svg.viewBox.baseVal.height));
    clip.append(rect);
    const defs = document.createElementNS(svg.namespaceURI, "defs");
    defs.append(clip);
    svg.prepend(defs);
    paths.forEach((path) => path.setAttribute("clip-path", `url(#${clip.id})`));
    const line = paths.find((p) => p.getAttribute("fill") === "none") ?? paths.at(-1);
    const dot = head(svg);
    const total = line?.getTotalLength() ?? 0;
    return (phase) => {
      rect.setAttribute("width", String(width * phase));
      if (line && total) {
        // Find the point on the line at the current x by bisection along its length.
        let lo = 0,
          hi = total;
        for (let k = 0; k < 14; k++) {
          const mid = (lo + hi) / 2;
          if (line.getPointAtLength(mid).x < width * phase) lo = mid;
          else hi = mid;
        }
        const pt = line.getPointAtLength(lo);
        dot.setAttribute("cx", String(pt.x));
        dot.setAttribute("cy", String(pt.y));
        dot.style.opacity = phase > 0.01 && phase < 0.995 ? "1" : "0";
      }
      points.forEach((point) => {
        const x = attr(point.querySelector("circle")!, "cx");
        point.style.opacity = String(clamp((width * phase - x + 8) / 24));
      });
    };
  }
  if (kind === "foundations") {
    const paths = Array.from(
      svg.querySelectorAll<SVGPathElement>(":scope > path"),
    ).map((node) => ({
      node,
      length: node.getTotalLength(),
      dot: head(svg, "var(--hw-mint)"),
    }));
    if (allowFilters()) {
      const glow = ensureGlow(svg, 2.5);
      paths.forEach(({ node }) => node.setAttribute("filter", glow));
    }
    return (phase) => {
      paths.forEach(({ node, length, dot }, i) => {
        const p = stagger(phase, i, paths.length);
        node.style.strokeDasharray = `${length} ${length}`;
        node.style.strokeDashoffset = String(length * (1 - p));
        const pt = node.getPointAtLength(length * p);
        dot.setAttribute("cx", String(pt.x));
        dot.setAttribute("cy", String(pt.y));
        dot.style.opacity = p > 0 && p < 1 ? "1" : "0";
      });
    };
  }
  if (["energy", "enterprise", "investment", "exposure"].includes(kind)) {
    const bars = Array.from(
      svg.querySelectorAll<SVGRectElement>('rect[fill^="var(--hw-"]'),
    ).map((node) => ({
      node,
      width: attr(node, "width"),
      height: attr(node, "height"),
      x: attr(node, "x"),
      y: attr(node, "y"),
      value:
        node.nextElementSibling?.tagName === "text"
          ? (node.nextElementSibling as SVGTextElement)
          : undefined,
    })).map((bar) => {
      const cap = document.createElementNS(SVG_NS, "rect");
      cap.setAttribute("fill", "var(--hw-fx-cap)");
      cap.classList.add("fx-cap");
      if (kind === "energy") {
        cap.setAttribute("x", String(bar.x));
        cap.setAttribute("width", String(bar.width));
        cap.setAttribute("height", "2");
      } else {
        cap.setAttribute("y", String(bar.y));
        cap.setAttribute("height", String(bar.height));
        cap.setAttribute("width", "2");
      }
      bar.node.after(cap);
      return { ...bar, cap, count: counter(bar.value) };
    });
    return (phase) => {
      bars.forEach(({ node, width, height, x, y, value, cap, count }, i) => {
        const p = stagger(phase, i, bars.length);
        count(p);
        cap.style.opacity = p > 0 && p < 1 ? "0.9" : "0";
        if (kind === "energy") cap.setAttribute("y", String(y + height * (1 - p)));
        else cap.setAttribute("x", String(x + Math.max(0, width * p - 2)));
        if (kind === "energy") {
          node.setAttribute("height", String(height * p));
          node.setAttribute("y", String(y + height * (1 - p)));
          value?.setAttribute("y", String(y + height * (1 - p) - 12));
        } else {
          node.setAttribute("width", String(width * p));
          value?.setAttribute(
            "x",
            String(x + width * p + (kind === "investment" ? 6 : 8)),
          );
        }
        if (value) value.style.opacity = String(clamp((p - 0.6) / 0.4));
      });
    };
  }
  // A complete network changes emphasis; unrelated studies retain their separate scales.
  return () => {};
}
