/**
 * VelocityBand — React Bits ScrollVelocity'nin genişletilmiş kopyası (src/components/reactbits/ScrollVelocity.tsx).
 * Orijinalden farkları:
 *  1. Satır bileşeni (`Row`) modül düzeyinde tanımlı ve memo'lu → üst bileşen (Engine aşama/etiket
 *     değişimi, localStorage hidrasyonu) yeniden render olunca motion.div yeniden mount OLMAZ;
 *     bant başa zıplamaz, kopya genişliği yeniden ölçülmez.
 *  2. İşaretçi bandın üzerindeyken hız yumuşak biçimde `hoverFactor`'a iner (0 = durur), ayrılınca
 *     geri çıkar → kayan bağlantılar fare ile tıklanabilir. `data-hover` niteliği CSS'e sinyal verir.
 *  3. Kaydırma hızı çarpanı `velocityMapping.output[1]` ile sınırlanır (orijinalde sınırsız, 5x+).
 *     Yön çevirme korunur (aşağı kaydır → ileri, yukarı → geri).
 *  4. Kopya genişliği ResizeObserver ile ölçülür; yazı tipi yüklenince de doğru sarar.
 * Stil: çağıranın CSS'i (class prop'ları); bu dosya CSS içermez.
 */
import { memo, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useVelocity } from 'motion/react';

export interface VelocityMapping {
  input: [number, number];
  output: [number, number];
}

export interface VelocityBandProps {
  /** Her öğe bir satır; çift indeksler ileri, tekler geri akar. */
  texts: ReactNode[];
  /** Taban hız (px/sn). */
  velocity?: number;
  numCopies?: number;
  damping?: number;
  stiffness?: number;
  /** Kaydırma hızı → ek çarpan; `output[1]` üst sınırdır (mutlak değer). */
  velocityMapping?: VelocityMapping;
  /** Hover'da hedef hız çarpanı: 0 tam durur, 0.2 yavaş sürünür. */
  hoverFactor?: number;
  /** Hover'a geçiş yumuşaklığı (1/sn; büyük = daha çabuk). */
  hoverEase?: number;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  className?: string;
  bandClassName?: string;
  parallaxClassName?: string;
  scrollerClassName?: string;
}

function useElementWidth<T extends HTMLElement>(ref: RefObject<T | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.offsetWidth);
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [ref]);
  return width;
}

function wrap(min: number, max: number, v: number): number {
  const range = max - min;
  const mod = (((v - min) % range) + range) % range;
  return mod + min;
}

interface RowProps {
  children: ReactNode;
  baseVelocity: number;
  numCopies: number;
  damping: number;
  stiffness: number;
  velocityMapping: VelocityMapping;
  hoverFactor: number;
  hoverEase: number;
  /** Bant düzeyinde paylaşılan hover durumu (frame döngüsü okur). */
  hoverRef: RefObject<boolean>;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  className: string;
  parallaxClassName: string;
  scrollerClassName: string;
}

const Row = memo(function Row({
  children,
  baseVelocity,
  numCopies,
  damping,
  stiffness,
  velocityMapping,
  hoverFactor,
  hoverEase,
  hoverRef,
  scrollContainerRef,
  className,
  parallaxClassName,
  scrollerClassName,
}: RowProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll(scrollContainerRef ? { container: scrollContainerRef as RefObject<HTMLElement> } : {});
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping, stiffness });
  const velocityFactor = useTransform(smoothVelocity, velocityMapping.input, velocityMapping.output, { clamp: false });

  const copyRef = useRef<HTMLSpanElement>(null);
  const copyWidth = useElementWidth(copyRef);

  const x = useTransform(baseX, (v) => (copyWidth === 0 ? '0px' : `${wrap(-copyWidth, 0, v)}px`));

  const direction = useRef(1);
  const scale = useRef(1); // 1 → tam hız, hoverFactor → duraklama
  const maxBoost = Math.abs(velocityMapping.output[1]);

  useAnimationFrame((_t, delta) => {
    const dt = Math.min(delta, 64) / 1000; // sekme arka plandan dönünce sıçrama olmasın
    const target = hoverRef.current ? hoverFactor : 1;
    scale.current += (target - scale.current) * Math.min(1, dt * hoverEase);
    if (Math.abs(scale.current) < 0.001 && target === 0) scale.current = 0;
    if (scale.current === 0) return;

    const f = Math.max(-maxBoost, Math.min(maxBoost, velocityFactor.get()));
    if (f < 0) direction.current = -1;
    else if (f > 0) direction.current = 1;

    let moveBy = direction.current * baseVelocity * dt;
    moveBy += direction.current * moveBy * f;
    baseX.set(baseX.get() + moveBy * scale.current);
  });

  const spans = [];
  for (let i = 0; i < numCopies; i++) {
    spans.push(
      <span className={className} key={i} ref={i === 0 ? copyRef : null}>
        {children}&nbsp;
      </span>,
    );
  }

  return (
    <div className={parallaxClassName}>
      <motion.div className={scrollerClassName} style={{ x }}>
        {spans}
      </motion.div>
    </div>
  );
});

const DEFAULT_MAPPING: VelocityMapping = { input: [0, 1000], output: [0, 2] };

function VelocityBandImpl({
  texts,
  velocity = 100,
  numCopies = 6,
  damping = 50,
  stiffness = 400,
  velocityMapping = DEFAULT_MAPPING,
  hoverFactor = 0,
  hoverEase = 6,
  scrollContainerRef,
  className = '',
  bandClassName = '',
  parallaxClassName = 'parallax',
  scrollerClassName = 'scroller',
}: VelocityBandProps) {
  const hoverRef = useRef(false);
  const [hover, setHover] = useState(false);
  const setHovering = (v: boolean) => {
    hoverRef.current = v;
    setHover(v);
  };

  return (
    <section
      className={bandClassName}
      data-hover={hover || undefined}
      onPointerEnter={(e) => { if (e.pointerType !== 'touch') setHovering(true); }}
      onPointerLeave={() => setHovering(false)}
      onPointerCancel={() => setHovering(false)}
    >
      {texts.map((text, index) => (
        <Row
          key={index}
          baseVelocity={index % 2 !== 0 ? -velocity : velocity}
          numCopies={numCopies}
          damping={damping}
          stiffness={stiffness}
          velocityMapping={velocityMapping}
          hoverFactor={hoverFactor}
          hoverEase={hoverEase}
          hoverRef={hoverRef}
          scrollContainerRef={scrollContainerRef}
          className={className}
          parallaxClassName={parallaxClassName}
          scrollerClassName={scrollerClassName}
        >
          {text}
        </Row>
      ))}
    </section>
  );
}

/** Memo: `texts` üstte useMemo ile sabitse Engine yeniden render'ları buraya inmez. */
export const VelocityBand = memo(VelocityBandImpl);
export default VelocityBand;
