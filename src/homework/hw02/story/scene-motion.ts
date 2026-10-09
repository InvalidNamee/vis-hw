/** Scroll changes the diagram's meaning. Axes, baselines and background tracks stay put. */
let nextClip = 0;
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
    return (phase) => {
      const x = start + (end - start) * phase;
      line.setAttribute("x2", String(x));
      point.setAttribute("cx", String(x));
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
    return (phase) => {
      rect.setAttribute("width", String(width * phase));
      points.forEach((point) => {
        const x = attr(point.querySelector("circle")!, "cx");
        point.style.opacity = String(clamp((width * phase - x + 8) / 24));
      });
    };
  }
  if (kind === "foundations") {
    const paths = Array.from(
      svg.querySelectorAll<SVGPathElement>(":scope > path"),
    ).map((node) => ({ node, length: node.getTotalLength() }));
    return (phase) => {
      paths.forEach(({ node, length }, i) => {
        const p = stagger(phase, i, paths.length);
        node.style.strokeDasharray = `${length} ${length}`;
        node.style.strokeDashoffset = String(length * (1 - p));
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
    }));
    return (phase) => {
      bars.forEach(({ node, width, height, x, y, value }, i) => {
        const p = stagger(phase, i, bars.length);
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
