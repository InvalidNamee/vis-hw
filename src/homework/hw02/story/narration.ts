import type { gsap as GSAP } from "gsap";

/** Move the real copy into one sticky stage; keep the original step anchors. */
export function mountNarration(
  host: HTMLElement,
  steps: HTMLElement[],
  gsap: typeof GSAP,
) {
  const stage = document.createElement("div");
  stage.className = "story-narration";
  const stack = document.createElement("div");
  stack.className = "story-narration-stack";
  stage.append(stack);
  const copies = steps.map((step) => {
    const copy = step.querySelector<HTMLElement>(".story-step-copy")!;
    copy.dataset.narrationStep = step.id;
    copy.inert = true;
    step.setAttribute("aria-hidden", "true");
    stack.append(copy);
    return copy;
  });
  const graphic = host.querySelector<HTMLElement>(".story-stage")!;
  const viewport =
    host.dataset.layout === "wide" ? document.createElement("div") : undefined;
  if (viewport) {
    // One sticky boundary: the caption band must leave with its chart.
    viewport.className = "story-viewport";
    graphic.before(viewport);
    viewport.append(stage, graphic);
  } else host.prepend(stage);
  let current = -1;
  let transition: gsap.core.Timeline | undefined;
  const clear = "opacity,transform,filter,clipPath,transformOrigin";
  const show = (index: number, animate: boolean) => {
    if (index === current) return;
    const previous = current;
    const direction = index >= current ? 1 : -1;
    transition?.kill();
    copies.forEach((copy, i) => {
      copy.inert = i !== index;
      gsap.set(copy, { autoAlpha: i === index || i === previous ? 1 : 0 });
      gsap.set(copy.children, { clearProps: clear });
    });
    current = index;
    if (!animate || previous < 0) {
      copies.forEach((copy, i) =>
        gsap.set(copy, { autoAlpha: i === index ? 1 : 0 }),
      );
      return;
    }
    const incoming = copies[index];
    const outgoing = copies[previous];
    const enter: gsap.TweenVars = { opacity: 0 };
    const exit: gsap.TweenVars = {};
    let stagger = 0.045;
    switch (host.dataset.motion) {
      case "slide":
        enter.x = 30 * direction;
        exit.x = -18 * direction;
        stagger = 0.03;
        break;
      case "focus":
        enter.scale = 0.97;
        exit.scale = 1.015;
        stagger = 0.015;
        break;
      case "trace":
        enter.x = 12 * direction;
        stagger = 0.025;
        break;
      case "reveal":
        enter.y = 10 * direction;
        enter.clipPath = "inset(18% 0 0 0)";
        stagger = 0.06;
        break;
      case "assemble":
        enter.y = 14 * direction;
        stagger = 0.085;
        break;
      default:
        enter.y = 22 * direction;
        exit.y = -12 * direction;
    }
    transition = gsap.timeline();
    transition.to(
      outgoing,
      { autoAlpha: 0, duration: 0.18, ease: "power1.out" },
      0,
    );
    transition.to(
      outgoing.children,
      { ...exit, duration: 0.22, ease: "power2.in" },
      0,
    );
    transition.fromTo(
      incoming.children,
      enter,
      {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        clipPath: "inset(0% 0 0 0)",
        duration: 0.48,
        stagger,
        ease: "power3.out",
        clearProps: clear,
      },
      0.13,
    );
  };
  return {
    show,
    destroy() {
      transition?.kill();
      copies.forEach((copy, i) => {
        gsap.set([copy, ...copy.children], {
          clearProps: `${clear},visibility`,
        });
        copy.inert = false;
        delete copy.dataset.narrationStep;
        steps[i].removeAttribute("aria-hidden");
        steps[i].append(copy);
      });
      stage.remove();
      if (viewport) viewport.replaceWith(graphic);
    },
  };
}
