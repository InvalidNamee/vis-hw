import type { gsap as GSAP } from "gsap";

/** One copy of each paragraph, one sticky boundary for both text and chart. */
export function mountNarration(
  host: HTMLElement,
  steps: HTMLElement[],
  gsap: typeof GSAP,
) {
  const viewport = host.querySelector<HTMLElement>(".story-viewport")!;
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
  viewport.prepend(stage);
  let current = -1;
  let transition: gsap.core.Timeline | undefined;
  const clear = "opacity,transform,visibility";
  const measure = () => {
    // All copies share a grid cell. Its natural height reserves the longest paragraph.
    // Reading distance grows with the actual content instead of a fixed title-band height.
    const available = viewport.clientHeight;
    copies.forEach((copy, i) => {
      steps[i].style.setProperty(
        "--step-span",
        `${Math.ceil(Math.max(available * 0.82, copy.offsetHeight * 1.65))}px`,
      );
    });
  };
  const resize = new ResizeObserver(measure);
  resize.observe(stack);
  resize.observe(viewport);
  measure();

  const show = (index: number, animate: boolean) => {
    if (index === current) return;
    const previous = current;
    const direction = index >= current ? 1 : -1;
    const interrupted = transition?.isActive();
    transition?.kill();
    copies.forEach((copy, i) => {
      copy.inert = i !== index;
      if (i !== index && i !== previous) {
        gsap.set(copy, { autoAlpha: 0 });
        gsap.set(copy.children, { clearProps: clear });
      }
    });
    current = index;
    if (!animate || previous < 0 || Math.abs(index - previous) > 1) {
      copies.forEach((copy, i) => {
        gsap.set(copy, { autoAlpha: i === index ? 1 : 0 });
        gsap.set(copy.children, { clearProps: clear });
      });
      return;
    }
    const incoming = copies[index];
    const outgoing = copies[previous];
    const distance = Math.min(24, incoming.offsetHeight * 0.065);
    const duration = interrupted ? 0.3 : 0.5;
    const wide = host.dataset.layout === "wide";
    const children = Array.from(incoming.children).filter(
      (el) => !el.classList.contains("step-static"),
    );
    // Interruptions continue from the displayed position; they never reset the outgoing copy.
    transition = gsap.timeline();
    transition.to(
      outgoing,
      {
        autoAlpha: 0,
        y: -distance * direction * 0.4,
        duration: duration * 0.55,
        ease: "power2.out",
      },
      0,
    );
    gsap.set(incoming, { autoAlpha: 1, y: 0 });
    children.forEach((child, i) => {
      const horizontal = wide && child.tagName === "H3";
      transition!.fromTo(
        child,
        {
          opacity: 0,
          x: horizontal ? distance * direction : 0,
          y: horizontal ? 0 : distance * direction,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration,
          ease: "power3.out",
          clearProps: clear,
        },
        0.06 + Math.min(i * 0.035, 0.1),
      );
    });
  };
  return {
    show,
    measure,
    destroy() {
      resize.disconnect();
      transition?.kill();
      copies.forEach((copy, i) => {
        gsap.set([copy, ...copy.children], { clearProps: clear });
        copy.inert = false;
        delete copy.dataset.narrationStep;
        steps[i].removeAttribute("aria-hidden");
        steps[i].style.removeProperty("--step-span");
        steps[i].append(copy);
      });
      stage.remove();
    },
  };
}
