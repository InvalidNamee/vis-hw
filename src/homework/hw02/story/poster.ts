/** Cover field, decoding titles and per-chapter poster transitions. Purely decorative. */
import { decodeText, prefersReduced, splitChars } from "./fx";

let dispose: (() => void) | undefined;

async function mount() {
  dispose?.();
  const cover = document.querySelector<HTMLElement>(".story-cover");
  if (!cover) return;
  const reduced = prefersReduced();
  const cleanups: (() => void)[] = [];
  let cancelled = false;
  dispose = () => {
    cancelled = true;
    cleanups.splice(0).forEach((fn) => fn());
    dispose = undefined;
  };
  document.documentElement.dataset.hw02Poster = "";
  cleanups.push(() => delete document.documentElement.dataset.hw02Poster);

  const [{ mountField }, { gsap }, { ScrollTrigger }] = await Promise.all([
    import("./cover-field"),
    import("gsap"),
    import("gsap/ScrollTrigger"),
  ]);
  if (cancelled) return;
  gsap.registerPlugin(ScrollTrigger);

  const fields = Array.from(
    document.querySelectorAll<HTMLCanvasElement>("[data-cover-field]"),
  ).map((canvas) => mountField(canvas, reduced));
  cleanups.push(() => fields.forEach((f) => f.destroy()));

  const ctx = gsap.context(() => {
    if (reduced) return;
    // Cover: decode once, then let scrolling collapse the field into a single line.
    const decoders = Array.from(
      cover.querySelectorAll<HTMLElement>("[data-decode]"),
    ).map((el, i) => decodeText(el, i ? 900 : 1200, i * 260));
    cleanups.push(() => decoders.forEach((d) => d()));
    gsap.from(cover.querySelectorAll(".story-cover-copy > :not(h1), .cover-index a, .poster-hud span"), {
      autoAlpha: 0,
      y: 18,
      duration: 0.7,
      stagger: 0.05,
      delay: 0.5,
      ease: "power3.out",
      clearProps: "opacity,visibility,transform",
    });
    ScrollTrigger.create({
      trigger: cover,
      start: "top top",
      end: "bottom top",
      scrub: 0.4,
      onUpdate: (self) => fields[0]?.setCollapse(self.progress * 1.4),
    });
    gsap.to(cover.querySelector("img"), {
      yPercent: 12,
      scale: 1.08,
      ease: "none",
      scrollTrigger: { trigger: cover, start: "top top", end: "bottom top", scrub: 0.5 },
    });
    // Explicit start values: never inherit a mid-flight entrance state.
    gsap.fromTo(
      cover.querySelector(".story-cover-copy"),
      { yPercent: 0, opacity: 1 },
      {
        yPercent: -18,
        opacity: 0.2,
        ease: "none",
        immediateRender: false,
        scrollTrigger: { trigger: cover, start: "40% top", end: "bottom top", scrub: 0.5 },
      },
    );

    // Chapter posters: number fills and slides, slab wipes open, title rises per character.
    document.querySelectorAll<HTMLElement>("[data-poster]").forEach((poster) => {
      const title = poster.querySelector<HTMLElement>("[data-poster-title]")!;
      const split = splitChars(title);
      cleanups.push(split.restore);
      const enter = gsap.timeline({
        scrollTrigger: { trigger: poster, start: "top 85%", end: "top 25%", scrub: 0.6 },
      });
      enter
        .fromTo(poster.querySelector(".poster-number"), { xPercent: -12, "--fill": 0 }, { xPercent: 0, "--fill": 1, ease: "none" }, 0)
        .fromTo(poster.querySelector(".poster-slab"), { clipPath: "polygon(0 0,0 0,0 100%,0 100%)" }, { clipPath: "polygon(0 0,100% 0,88% 100%,0 100%)", ease: "power2.out" }, 0)
        .fromTo(split.spans, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.02, ease: "power3.out" }, 0.1)
        .fromTo(poster.querySelectorAll(".chapter-position, .story-chapter-heading > p, .poster-meta > div"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, ease: "power2.out" }, 0.25);
      // Exit: the poster folds into a bright line as the stage takes over.
      gsap.fromTo(
        poster,
        { clipPath: "inset(0% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 100% 0%)",
          ease: "none",
          scrollTrigger: { trigger: poster, start: "bottom 45%", end: "bottom top", scrub: 0.4 },
        },
      );
    });

    const conclusion = document.querySelector<HTMLElement>(".story-conclusion");
    const line = conclusion?.querySelector<HTMLElement>("[data-decode]");
    if (conclusion && line) {
      ScrollTrigger.create({
        trigger: conclusion,
        start: "top 70%",
        once: true,
        onEnter: () => cleanups.push(decodeText(line, 1400)),
      });
    }
  });
  cleanups.push(() => ctx.revert());
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

const start = () => void mount();
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", start, { once: true });
else start();
document.addEventListener("astro:before-swap", () => dispose?.());
document.addEventListener("astro:after-swap", start);
