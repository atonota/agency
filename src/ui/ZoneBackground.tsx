import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useComputedColorScheme } from '@mantine/core';
import LightRays from '../components/reactbits/LightRays';
import Threads from '../components/reactbits/Threads';
import { IsoField } from './IsoField';

export interface ZoneBg {
  iso?: { size?: number; cubes?: number; radius?: number };
  effect?: 'light-rays' | 'threads';
}

/**
 * İki eşikli kapı (histerezis): WebGL efekti bölge görüntü alanına NEAR_ROOT_MARGIN
 * kadar yaklaşınca mount edilir; yalnızca FAR_ROOT_MARGIN'in de dışına çıkıp
 * UNMOUNT_DELAY_MS boyunca öyle kalınca unmount edilir (bağlam serbest kalır).
 * Böylece sınır civarında ileri-geri kaydırma her geçişte shader derletmez.
 */
const NEAR_ROOT_MARGIN = '600px';
const FAR_ROOT_MARGIN = '1400px';
const UNMOUNT_DELAY_MS = 400;
/** Mount sonrası ilk karelerin (bağlam kurulumu + ilk render) "pop-in" yapmaması için yumuşak giriş. */
const FADE_MS = 240;

function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Gözlenen eleman görüntü alanına yakın mı? (histerezisli)
 * - Yakın eşik (NEAR) kesişince anında "yakın".
 * - Uzak eşik (FAR) kesişmeyi bırakınca gecikmeli "uzak"; bu sürede yeniden yaklaşılırsa iptal.
 * IntersectionObserver yoksa (eski ortam) her zaman "yakın" sayılır.
 */
function useNearViewport<T extends Element>(enabled: boolean): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const hasIO = typeof IntersectionObserver !== 'undefined';
  const [near, setNear] = useState(!hasIO);
  useEffect(() => {
    if (!enabled || !hasIO) return;
    const el = ref.current;
    if (!el) return;

    let farTimer: ReturnType<typeof setTimeout> | undefined;
    const cancelFar = () => {
      if (farTimer !== undefined) {
        clearTimeout(farTimer);
        farTimer = undefined;
      }
    };

    const nearIO = new IntersectionObserver(
      (entries) => {
        if (entries[entries.length - 1].isIntersecting) {
          cancelFar();
          setNear(true);
        }
      },
      { rootMargin: NEAR_ROOT_MARGIN, threshold: 0 }
    );
    const farIO = new IntersectionObserver(
      (entries) => {
        cancelFar();
        if (entries[entries.length - 1].isIntersecting) return;
        farTimer = setTimeout(() => {
          farTimer = undefined;
          setNear(false);
        }, UNMOUNT_DELAY_MS);
      },
      { rootMargin: FAR_ROOT_MARGIN, threshold: 0 }
    );
    nearIO.observe(el);
    farIO.observe(el);
    return () => {
      cancelFar();
      nearIO.disconnect();
      farIO.disconnect();
    };
  }, [enabled, hasIO]);
  return [ref, near];
}

/**
 * Mount sonrası opaklığı 0 → 1 geçirir (inline stil; CSS dosyasına dokunmaz).
 * WebGL çocuğunun ilk karesi birkaç kare sonra geldiği için efekt "pat diye" değil, solarak belirir.
 */
function FadeIn({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className="zb-fade"
      style={{ width: '100%', height: '100%', opacity: shown ? 1 : 0, transition: `opacity ${FADE_MS}ms ease-out` }}
    >
      {children}
    </div>
  );
}

/** Bölge arka planı: etkileşimli isometric alan + isteğe bağlı React Bits WebGL efekti. */
export function ZoneBackground({ bg }: { bg?: ZoneBg }) {
  const scheme = useComputedColorScheme('light');
  const [accent, setAccent] = useState('#1E8F9B');
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAccent(getComputedStyle(document.documentElement).getPropertyValue('--fe-tier-z').trim() || '#1E8F9B'));
    return () => cancelAnimationFrame(id);
  }, [scheme]);

  const wantsRays = !!bg && !reduced && bg.effect === 'light-rays';
  const wantsThreads = !!bg && !reduced && bg.effect === 'threads';
  // Kapı: efekt sarmalayıcısı (fe-fx, sabit yükseklik) izlenir; WebGL çocuğu yalnızca yakınken var olur.
  const [raysGate, raysNear] = useNearViewport<HTMLDivElement>(wantsRays);
  const [threadsGate, threadsNear] = useNearViewport<HTMLDivElement>(wantsThreads);

  if (!bg) return null;
  return (
    <div className="fe-zone-bg" aria-hidden="true">
      {wantsRays && (
        <div ref={raysGate} className="fe-fx fe-fx-rays zb-gate" data-zb-near={raysNear || undefined}>
          {raysNear && (
            <FadeIn>
              <LightRays raysOrigin="top-right" raysColor={accent} raysSpeed={0.6} lightSpread={0.9}
                rayLength={1.6} followMouse mouseInfluence={0.08} noiseAmount={0.05} distortion={0.04} saturation={scheme === 'dark' ? 1 : 0.8} />
            </FadeIn>
          )}
        </div>
      )}
      {wantsThreads && (
        <div ref={threadsGate} className="fe-fx fe-fx-threads zb-gate" data-zb-near={threadsNear || undefined}>
          {threadsNear && (
            <FadeIn>
              <Threads color={hexToRgb01(accent)} amplitude={0.9} distance={0.1} enableMouseInteraction />
            </FadeIn>
          )}
        </div>
      )}
      {bg.iso && <IsoField size={bg.iso.size} cubes={bg.iso.cubes} radius={bg.iso.radius} />}
    </div>
  );
}
