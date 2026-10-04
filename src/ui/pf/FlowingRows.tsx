/**
 * FlowingRows — React Bits FlowingMenu'nun genişletilmiş kopyası.
 * Orijinal: `text`/`image` prop'ları ile tek satırlık başlık. Burada satır içeriği ve
 * marquee parçası ReactNode; gsap giriş/çıkış zaman çizgisi ve sonsuz kayma korunur.
 * Ek: klavye odağı (focus-visible) marquee'yi açar; `reduced` modunda marquee statik satır olur.
 * Stil: src/styles/products.css (.pf-row*, .pf-mq*).
 */
import { useEffect, useRef, useState, type FocusEvent, type MouseEvent, type ReactNode } from 'react';
import { gsap } from 'gsap';

type Edge = 'top' | 'bottom';

export interface FlowingRowProps {
  href: string;
  /** Satırın görünen içeriği (grid çocukları). */
  content: ReactNode;
  /** Marquee'de tekrar eden parça. */
  marquee: ReactNode;
  /** Bir parça genişliği kadar kayma süresi (sn). */
  speed?: number;
  /** Hareket azaltma: marquee statik satır olarak görünür. */
  reduced?: boolean;
  ariaLabel?: string;
  /** Satır kabına yayılacak data-* nitelikleri (useTier props). */
  rowProps?: Record<string, string | undefined>;
  className?: string;
}

export function FlowingRows({ children, ariaLabel, className }: { children: ReactNode; ariaLabel?: string; className?: string }) {
  return (
    <nav className={['pf-rows', className].filter(Boolean).join(' ')} aria-label={ariaLabel}>
      {children}
    </nav>
  );
}

const DEFAULTS: gsap.TweenVars = { duration: 0.6, ease: 'expo' };

export function FlowingRow({ href, content, marquee, speed = 16, reduced = false, ariaLabel, rowProps, className }: FlowingRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [reps, setReps] = useState(4);

  /* Görünür alanı dolduracak tekrar sayısı */
  useEffect(() => {
    if (reduced) return;
    const calc = () => {
      const part = innerRef.current?.querySelector<HTMLElement>('.pf-mq-part');
      if (!part || !part.offsetWidth) return;
      setReps(Math.max(3, Math.ceil(window.innerWidth / part.offsetWidth) + 2));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [reduced]);

  /* Sonsuz kayma — açılınca oynar, kapanınca durur */
  useEffect(() => {
    if (reduced) return;
    const inner = innerRef.current;
    if (!inner) return;
    const timer = setTimeout(() => {
      const part = inner.querySelector<HTMLElement>('.pf-mq-part');
      if (!part || !part.offsetWidth) return;
      tweenRef.current?.kill();
      tweenRef.current = gsap.to(inner, { x: -part.offsetWidth, duration: speed, ease: 'none', repeat: -1, paused: true });
    }, 50);
    return () => {
      clearTimeout(timer);
      tweenRef.current?.kill();
      tweenRef.current = null;
    };
  }, [reps, speed, reduced]);

  const edgeFor = (ev: MouseEvent<HTMLAnchorElement>): Edge => {
    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect) return 'top';
    return ev.clientY - rect.top < rect.height / 2 ? 'top' : 'bottom';
  };

  const open = (edge: Edge) => {
    if (!marqueeRef.current || !innerRef.current) return;
    tweenRef.current?.play();
    gsap
      .timeline({ defaults: DEFAULTS })
      .set(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .set(innerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0)
      .to([marqueeRef.current, innerRef.current], { y: '0%' }, 0);
  };

  const close = (edge: Edge) => {
    if (!marqueeRef.current || !innerRef.current) return;
    gsap
      .timeline({ defaults: DEFAULTS, onComplete: () => tweenRef.current?.pause() })
      .to(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .to(innerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0);
  };

  const onFocus = (ev: FocusEvent<HTMLAnchorElement>) => {
    if (ev.currentTarget.matches(':focus-visible')) open('top');
  };

  const cls = ['pf-row', className].filter(Boolean).join(' ');

  if (reduced) {
    return (
      <div className={cls} data-static="true" {...rowProps}>
        <a className="pf-row-link" href={href} aria-label={ariaLabel}>{content}</a>
        <div className="pf-mq-static">{marquee}</div>
      </div>
    );
  }

  return (
    <div className={cls} ref={rowRef} {...rowProps}>
      <a
        className="pf-row-link"
        href={href}
        aria-label={ariaLabel}
        onMouseEnter={(ev) => open(edgeFor(ev))}
        onMouseLeave={(ev) => close(edgeFor(ev))}
        onFocus={onFocus}
        onBlur={() => close('top')}
      >
        {content}
      </a>
      <div className="pf-mq" ref={marqueeRef} aria-hidden="true">
        <div className="pf-mq-wrap">
          <div className="pf-mq-inner" ref={innerRef}>
            {Array.from({ length: reps }, (_, i) => (
              <div className="pf-mq-part" key={i}>{marquee}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
