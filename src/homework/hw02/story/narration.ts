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
  host.prepend(stage);
  let current = -1;
  let transition: gsap.core.Timeline | undefined;
  const show = (index: number, animate: boolean) => {
    if (index === current) return;
    const previous = current;
    const direction = index >= current ? 1 : -1;
    transition?.kill();
    copies.forEach((copy, i) => {
      copy.inert = i !== index;
      gsap.set(copy, { autoAlpha: i === index || i === previous ? 1 : 0 });
      gsap.set(copy.children, { clearProps: "opacity,transform,filter" });
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
    transition = gsap.timeline();
    transition.to(
      outgoing,
      { autoAlpha: 0, duration: 0.18, ease: "power1.out" },
      0,
    );
    transition.to(
      outgoing.children,
      { y: -12 * direction, duration: 0.22, ease: "power2.in" },
      0,
    );
    transition.fromTo(
      incoming.children,
      { opacity: 0, y: 22 * direction, filter: "blur(3px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.48,
        stagger: 0.045,
        ease: "power3.out",
        clearProps: "opacity,transform,filter",
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
          clearProps: "opacity,visibility,transform,filter",
        });
        copy.inert = false;
        delete copy.dataset.narrationStep;
        steps[i].removeAttribute("aria-hidden");
        steps[i].append(copy);
      });
      stage.remove();
    },
  };
}
