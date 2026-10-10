/**
 * Canvas particle network for the cover and the conclusion.
 * `collapse` (0..1) pulls particles onto a horizontal line, driven by scroll.
 * Mode "grid" lets particles settle into a lattice and then stop animating.
 */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gx: number;
  gy: number;
  hue: number;
}
const COLORS = ["62,230,255", "255,61,139", "198,255,61", "138,125,255"];

export function mountField(canvas: HTMLCanvasElement, reduced: boolean) {
  const ctx = canvas.getContext("2d")!;
  const grid = canvas.dataset.mode === "grid";
  let w = 0,
    h = 0,
    dpr = 1,
    frame = 0,
    visible = false,
    collapse = 0,
    settle = 0;
  const pointer = { x: -9999, y: -9999 };
  let particles: Particle[] = [];
  let colors = COLORS;
  let dark = true;
  const readPalette = () => {
    const style = getComputedStyle(canvas);
    colors = ["--hw-blue", "--hw-orange", "--hw-mint", "--hw-purple"].map(
      (name, i) => {
        const hex = style.getPropertyValue(name).trim();
        return /^#[\da-f]{6}$/i.test(hex)
          ? [1, 3, 5]
              .map((offset) => parseInt(hex.slice(offset, offset + 2), 16))
              .join(",")
          : COLORS[i];
      },
    );
    dark = style.colorScheme === "dark";
  };

  const build = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(130, Math.max(46, (w * h) / 11000)));
    const cols = Math.ceil(Math.sqrt((count * w) / Math.max(1, h)));
    const rows = Math.ceil(count / cols);
    particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      gx: ((i % cols) + 0.5) * (w / cols),
      gy: (Math.floor(i / cols) + 0.5) * (h / rows),
      hue: Math.random() < 0.72 ? 0 : 1 + ((Math.random() * 3) | 0),
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const link = Math.min(150, w / 7);
    const lineY = h * 0.72;
    for (const p of particles) {
      if (!reduced) {
        if (grid && settle > 0) {
          p.x += (p.gx - p.x) * 0.04 * settle;
          p.y += (p.gy - p.y) * 0.04 * settle;
        } else {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
        }
      }
    }
    // Collapse is applied at draw time so scrolling back restores the free field.
    const pos = particles.map((p) => ({
      x: p.x,
      y: p.y + (lineY - p.y) * collapse * collapse,
      c: colors[p.hue],
    }));
    ctx.lineWidth = 1;
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[i].x - pos[j].x,
          dy = pos[i].y - pos[j].y;
        const d = Math.hypot(dx, dy);
        if (d < link) {
          const near =
            Math.hypot(pos[i].x - pointer.x, pos[i].y - pointer.y) < 160;
          const a =
            (1 - d / link) * (near ? 0.55 : 0.18) * (1 - collapse * 0.6);
          ctx.strokeStyle = `rgba(${pos[i].c},${a})`;
          ctx.beginPath();
          ctx.moveTo(pos[i].x, pos[i].y);
          ctx.lineTo(pos[j].x, pos[j].y);
          ctx.stroke();
        }
      }
    }
    for (const p of pos) {
      const near = Math.hypot(p.x - pointer.x, p.y - pointer.y) < 160;
      ctx.fillStyle = `rgba(${p.c},${near ? 1 : 0.75})`;
      ctx.shadowColor = `rgba(${p.c},0.9)`;
      ctx.shadowBlur = dark ? (near ? 14 : 6) : near ? 4 : 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, near ? 2.4 : 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    if (collapse > 0.02) {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, `rgba(${colors[0]},0)`);
      g.addColorStop(0.5, `rgba(${colors[0]},${collapse})`);
      g.addColorStop(1, `rgba(${colors[0]},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, lineY - 1, w, 2);
    }
  };

  const loop = () => {
    draw();
    if (grid && settle > 0) settle = Math.min(1, settle + 0.004);
    const still = grid && settle >= 1;
    frame =
      visible && !document.hidden && !still ? requestAnimationFrame(loop) : 0;
  };
  const start = () => {
    if (reduced) return draw();
    if (!frame && visible) frame = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };

  readPalette();
  build();
  draw();
  // Repaint even a paused/reduced-motion field without resetting its particle positions.
  const theme = new MutationObserver(() => {
    readPalette();
    draw();
  });
  theme.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme"],
  });
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      if (grid && settle === 0) settle = 0.001;
      start();
    } else stop();
  });
  io.observe(canvas);
  const ro = new ResizeObserver(() => {
    build();
    draw();
  });
  ro.observe(canvas);
  const local = new AbortController();
  const host = canvas.parentElement!;
  host.addEventListener(
    "pointermove",
    (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      if (reduced) draw();
    },
    { signal: local.signal },
  );
  host.addEventListener(
    "pointerleave",
    () => {
      pointer.x = pointer.y = -9999;
    },
    { signal: local.signal },
  );
  document.addEventListener(
    "visibilitychange",
    () => (document.hidden ? stop() : start()),
    { signal: local.signal },
  );

  return {
    setCollapse(value: number) {
      collapse = Math.max(0, Math.min(1, value));
      if (!frame) draw();
    },
    destroy() {
      stop();
      io.disconnect();
      ro.disconnect();
      theme.disconnect();
      local.abort();
    },
  };
}
