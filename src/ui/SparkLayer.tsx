/**
 * SparkLayer — tıklama kıvılcımları (React Bits ClickSpark'ın hafif karşılığı).
 *
 * Fark: ClickSpark canvas'ı sarmaladığı öğe (tüm sayfa) boyundaydı ve rAF döngüsü
 * hiç durmuyordu. Bu katman görüntü alanı boyunda sabit (fixed) tek bir canvas kullanır,
 * DPR'yi 1.5 ile sınırlar ve yalnızca aktif kıvılcım varken çizer; bitince durur ve temizler.
 * Görsel sonuç aynı: 8 çizgi, sparkSize 11, sparkRadius 22, 420ms, ease-out.
 */
import { useEffect, useRef } from 'react';
import { useComputedColorScheme } from '@mantine/core';

const SPARK_COUNT = 8;
const SPARK_SIZE = 11;
const SPARK_RADIUS = 22;
const DURATION = 420;
const LINE_WIDTH = 2;
const MAX_DPR = 1.5;
const ACCENT_VAR = '--fe-accent';

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

const easeOut = (t: number) => t * (2 - t);

function readAccent(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(ACCENT_VAR).trim();
  return v || 'currentColor';
}

export function SparkLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const rafRef = useRef(0);
  const colorRef = useRef<string>('');
  const scheme = useComputedColorScheme('light');

  // Tema değişince vurgu rengini yeniden oku (canvas CSS değişkeni okuyamaz).
  useEffect(() => {
    const id = requestAnimationFrame(() => { colorRef.current = readAccent(); });
    return () => cancelAnimationFrame(id);
  }, [scheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let dpr = 1;
    let cssW = 0;
    let cssH = 0;
    let glowTimer: ReturnType<typeof setTimeout> | undefined;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      const w = Math.round(cssW * dpr);
      const h = Math.round(cssH * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const clear = () => ctx.clearRect(0, 0, cssW, cssH);

    /** Verilen zamandaki kıvılcımları çizer; hâlâ canlı olan var mı diye döner. */
    const paint = (now: number) => {
      clear();
      const color = colorRef.current || (colorRef.current = readAccent());
      ctx.strokeStyle = color;
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      const alive: Spark[] = [];
      for (const s of sparksRef.current) {
        const elapsed = now - s.startTime;
        if (elapsed >= DURATION) continue;
        const eased = easeOut(elapsed / DURATION);
        const distance = eased * SPARK_RADIUS;
        const len = SPARK_SIZE * (1 - eased);
        const cos = Math.cos(s.angle);
        const sin = Math.sin(s.angle);
        ctx.beginPath();
        ctx.moveTo(s.x + distance * cos, s.y + distance * sin);
        ctx.lineTo(s.x + (distance + len) * cos, s.y + (distance + len) * sin);
        ctx.stroke();
        alive.push(s);
      }
      sparksRef.current = alive;
      return alive.length > 0;
    };

    const tick = (now: number) => {
      if (paint(now)) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
        clear();
      }
    };

    const start = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const now = performance.now();
      const { clientX: x, clientY: y } = e;

      if (reduced.matches) {
        // Hareket azaltma: tek kare kısa parıltı, rAF döngüsü yok.
        sparksRef.current = Array.from({ length: SPARK_COUNT }, (_, i) => ({
          x, y, angle: (2 * Math.PI * i) / SPARK_COUNT, startTime: now - DURATION * 0.35,
        }));
        paint(now);
        sparksRef.current = [];
        clearTimeout(glowTimer);
        glowTimer = setTimeout(clear, 120);
        return;
      }

      for (let i = 0; i < SPARK_COUNT; i++) {
        sparksRef.current.push({ x, y, angle: (2 * Math.PI * i) / SPARK_COUNT, startTime: now });
      }
      start();
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('pointerdown', onPointerDown, true);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('pointerdown', onPointerDown, true);
      clearTimeout(glowTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      sparksRef.current = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="sp-layer"
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }}
    />
  );
}

export default SparkLayer;
