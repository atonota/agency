import { useEffect, useRef } from 'react';

/**
 * Etkileşimli isometric arka plan — görüntü alanı boyutunda, kaydırmada SIFIR çizim.
 *
 * Kaydırma yolu (jank'ı önleyen tasarım):
 * - Canvas kabı .fe-zone-bg içinde görüntü alanı yüksekliğindedir (CSS: height: min(100%, 100vh)) ve
 *   bölge kaydırılırken translate3d ile görüntü alanını izler. Bu ofset yalnızca `scrollY` ile önbellekteki
 *   bölge konumundan hesaplanır: scroll olayında HİÇ layout okuması (getBoundingClientRect) yapılmaz.
 * - Desen görüntü alanına bağlıdır (sabit arka plan etkisi): kaydırma canvas'ı yeniden çizmez.
 *   Scroll'da yalnızca bir transform ve bir CSS değişkeni (--iso-p, bölge sonuna doğru sönme) yazılır —
 *   ikisi de kompozitör işidir, repaint gerektirmez.
 * - Hover'da yükselen küpler ve dokunmada yayılan dalga canvas (ekran) koordinatlarındadır; koordinatlar
 *   önbellekteki bölge konumu + ofset ile hesaplanır (yine layout okuması yok).
 * - rAF döngüsü yalnızca enerji değişirken veya dalga varken sürer; imleç sabitken durur.
 * - Base katman (ızgara + dekor küpler) yalnızca boyut/tema değişince çizilir. DPR üst sınırı 1.5.
 * - Bölge görüntü alanı dışındayken (IntersectionObserver) hiçbir iş yapılmaz.
 * - prefers-reduced-motion: yalnızca statik ızgara + dekor; olay dinleyici yok.
 */
interface IsoFieldProps {
  size?: number;          // küp kenarı (px)
  radius?: number;        // hover etki yarıçapı (px)
  cubes?: number;         // statik dekor küp oranı (0–1)
  lineAlpha?: number;
  className?: string;
  seed?: number;
}

type Ripple = { x: number; y: number; t0: number };

const INTERACTIVE = 'a,button,input,select,textarea,label,[role="button"],[role="tab"],[role="switch"],.mantine-SegmentedControl-root';
const MAX_DPR = 1.5;
const RIPPLE_MS = 1600;
const SNAP = 0.012;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function IsoField({ size = 26, radius = 150, cubes = 0.035, lineAlpha = 0.5, className, seed = 7 }: IsoFieldProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    const bg = wrap?.parentElement;          // .fe-zone-bg
    const host = bg?.parentElement;          // .fe-zone / .fe-footer (olay kaynağı)
    if (!wrap || !canvas || !bg || !host) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tw = size * Math.sqrt(3);
    const th = size;
    const rowH = th / 2;

    let W = 0, H = 0;                 // canvas boyutu (CSS px)
    let cols = 0, rows = 0;
    let dpr = 1;
    let zoneTop = 0, zoneLeft = 0, zoneH = 0;   // önbellek: bölgenin sayfa konumu (resize/IO'da ölçülür)
    let offset = 0;                   // kabın bölge içindeki dikey konumu
    let energy = new Float32Array(0);
    let decor = new Uint8Array(0);
    const base = document.createElement('canvas');
    const bctx = base.getContext('2d')!;
    let colors = { line: '#C4CFD4', accent: '#1E8F9B', accent2: '#7457C9' };
    const pointer = { x: -9999, y: -9999, inside: false };   // canvas koordinatları
    const ripples: Ripple[] = [];
    let raf = 0, running = false, visible = true;

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors = {
        line: cs.getPropertyValue('--fe-line-strong').trim() || colors.line,
        accent: cs.getPropertyValue('--fe-tier-z').trim() || colors.accent,
        accent2: cs.getPropertyValue('--fe-tier-e').trim() || colors.accent2,
      };
    };

    const center = (c: number, r: number) => ({ x: c * tw + (r % 2 ? tw / 2 : 0), y: r * rowH });

    const rhombus = (g: CanvasRenderingContext2D, x: number, y: number, lift = 0) => {
      g.beginPath();
      g.moveTo(x, y - th / 2 - lift);
      g.lineTo(x + tw / 2, y - lift);
      g.lineTo(x, y + th / 2 - lift);
      g.lineTo(x - tw / 2, y - lift);
      g.closePath();
    };

    const cube = (g: CanvasRenderingContext2D, x: number, y: number, h: number, a: number, color: string) => {
      g.beginPath();
      g.moveTo(x - tw / 2, y - h); g.lineTo(x, y + th / 2 - h); g.lineTo(x, y + th / 2); g.lineTo(x - tw / 2, y); g.closePath();
      g.globalAlpha = a * 0.55; g.fillStyle = color; g.fill();
      g.beginPath();
      g.moveTo(x, y + th / 2 - h); g.lineTo(x + tw / 2, y - h); g.lineTo(x + tw / 2, y); g.lineTo(x, y + th / 2); g.closePath();
      g.globalAlpha = a * 0.3; g.fill();
      rhombus(g, x, y, h);
      g.globalAlpha = a; g.fill();
      g.globalAlpha = Math.min(1, a * 1.6); g.strokeStyle = color; g.lineWidth = 1; g.stroke();
      g.globalAlpha = 1;
    };

    /** Base: ızgara çizgileri + dekor küpler. Yalnızca boyut/tema değişince. */
    const drawBase = () => {
      base.width = Math.max(1, Math.round(W * dpr)); base.height = Math.max(1, Math.round(H * dpr));
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.clearRect(0, 0, W, H);
      bctx.strokeStyle = colors.line;
      bctx.lineWidth = 0.6;
      bctx.globalAlpha = lineAlpha;
      bctx.beginPath();
      const dx = H * Math.sqrt(3);
      const kMin = -Math.ceil(dx / tw) - 1, kMax = Math.ceil((W + dx) / tw) + 1;
      for (let k = kMin; k <= kMax; k++) {
        const C = k * tw + tw / 2;
        bctx.moveTo(C, 0); bctx.lineTo(C + dx, H);
        bctx.moveTo(C, 0); bctx.lineTo(C - dx, H);
      }
      for (let x = 0; x < W + tw; x += tw / 2) { bctx.moveTo(x, 0); bctx.lineTo(x, H); }
      bctx.stroke();
      bctx.globalAlpha = 1;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const k = decor[r * cols + c];
        if (!k) continue;
        const { x, y } = center(c, r);
        cube(bctx, x, y, size * (0.25 + 0.2 * (k - 1)), 0.07, k === 3 ? colors.accent2 : colors.accent);
      }
    };

    /** Tek kare: base + aktif küpler. Döndürür: animasyon sürmeli mi. */
    const render = (now: number): boolean => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      for (let i = ripples.length - 1; i >= 0; i--) if (now - ripples[i].t0 > RIPPLE_MS) ripples.splice(i, 1);

      let changing = false;
      const wave = Math.max(W, H) * 1.1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const { x, y } = center(c, r);
          let target = 0;
          if (pointer.inside) {
            const d = Math.hypot(x - pointer.x, y - pointer.y);
            if (d < radius) target = (1 - d / radius) ** 2;
          }
          for (const rp of ripples) {
            const age = (now - rp.t0) / RIPPLE_MS;
            const rr = age * wave;
            const d = Math.hypot(x - rp.x, y - rp.y);
            const k = 1 - Math.abs(d - rr) / 70;
            if (k > 0) target = Math.max(target, k * (1 - age) * 1.1);
          }
          const prev = energy[i];
          let e = prev + (target - prev) * 0.14;
          if (Math.abs(e - target) < SNAP) e = target;
          if (e !== prev) { energy[i] = e; changing = true; }
          if (e > 0.004) cube(ctx, x, y, e * size * 0.95, 0.08 + e * 0.38, colors.accent);
        }
      }
      return changing || ripples.length > 0;
    };

    const loop = (now: number) => {
      if (!visible) { running = false; return; }
      if (render(now)) raf = requestAnimationFrame(loop);
      else running = false;
    };
    const schedule = () => {
      if (running || !visible) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => { cancelAnimationFrame(raf); running = false; };

    /** Yalnızca scrollY + önbellek: layout okuması yok. */
    const updateOffset = () => {
      const maxOff = Math.max(0, zoneH - H);
      const next = Math.min(maxOff, Math.max(0, window.scrollY - zoneTop));
      if (next === offset) return;
      offset = next;
      wrap.style.transform = `translate3d(0, ${offset}px, 0)`;
      wrap.style.setProperty('--iso-p', String(maxOff ? offset / maxOff : 0));
    };

    /** Boyut ve konum ölçümü — yalnızca resize/IO'da (rAF içinde toplu okuma). */
    const measure = () => {
      const hr = host.getBoundingClientRect();
      zoneTop = hr.top + window.scrollY;
      zoneLeft = hr.left;
      zoneH = hr.height;
      const wr = wrap.getBoundingClientRect();
      const nextW = Math.max(1, Math.round(wr.width));
      const nextH = Math.max(1, Math.round(wr.height));
      const nextDpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      updateOffset();
      if (nextW === W && nextH === H && nextDpr === dpr) return;
      W = nextW; H = nextH; dpr = nextDpr;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      cols = Math.ceil(W / tw) + 2;
      rows = Math.ceil(H / rowH) + 3;
      energy = new Float32Array(cols * rows);
      decor = new Uint8Array(cols * rows);
      const rand = rng(seed);
      for (let i = 0; i < decor.length; i++) decor[i] = rand() < cubes ? 1 + Math.floor(rand() * 3) : 0;
      drawBase();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);
    };

    let measureRaf = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(measureRaf);
      measureRaf = requestAnimationFrame(measure);
    };

    // Kaydırma: yalnızca kompozitör yazıları (transform + --iso-p). Çizim yok.
    let scrollRaf = 0;
    const onScroll = () => {
      if (!visible || scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; updateOffset(); });
    };

    // İmleç: canvas koordinatı = client − (bölge sol, bölge üst − scrollY + ofset). Layout okuması yok.
    const toCanvas = (e: PointerEvent) => ({ x: e.clientX - zoneLeft, y: e.clientY - (zoneTop - window.scrollY + offset) });
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && e.buttons === 0) return;
      const p = toCanvas(e);
      pointer.x = p.x; pointer.y = p.y; pointer.inside = true;
      schedule();
    };
    const onLeave = () => { pointer.inside = false; schedule(); };
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.(INTERACTIVE)) return;
      const p = toCanvas(e);
      ripples.push({ x: p.x, y: p.y, t0: performance.now() });
      schedule();
    };

    readColors();
    measure();
    const ro = new ResizeObserver(scheduleMeasure);
    ro.observe(wrap); ro.observe(host);
    const mo = new MutationObserver(() => { readColors(); drawBase(); schedule(); if (!running) { ctx.setTransform(1,0,0,1,0,0); ctx.drawImage(base, 0, 0); } });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mantine-color-scheme'] });
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { scheduleMeasure(); } else stop();
    }, { rootMargin: '200px 0px' });
    io.observe(host);
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!reduced) {
      host.addEventListener('pointermove', onMove, { passive: true });
      host.addEventListener('pointerleave', onLeave);
      host.addEventListener('pointerup', onLeave);
      host.addEventListener('pointerdown', onDown);
    }
    return () => {
      stop(); cancelAnimationFrame(measureRaf); cancelAnimationFrame(scrollRaf);
      ro.disconnect(); mo.disconnect(); io.disconnect();
      window.removeEventListener('scroll', onScroll);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('pointerup', onLeave);
      host.removeEventListener('pointerdown', onDown);
    };
  }, [size, radius, cubes, lineAlpha, seed]);

  return (
    <div ref={wrapRef} className={`fe-isofield ${className ?? ''}`} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
