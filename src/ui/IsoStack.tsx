import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useElementSize, useMediaQuery } from '@mantine/hooks';

/**
 * Ürün katmanlarını üst üste binen isometric plakalar olarak çizer. Katmana (veya etiketine) gelince yükselir.
 * Plakalar SVG'dir; etiketler ise 1rem kuralı için HTML olarak SVG'nin üzerine, aynı yüzdelik konuma yerleşir
 * (viewBox ölçeklense de yazı 16px kalır).
 *
 * Geniş mod yalnızca kap en az `WIDE_MIN`px olduğunda kullanılır: bu eşikte viewBox ölçeği ≥ 1 olduğu için etiket
 * sütunu (~%50) 24 karakterlik mono alt satırı kırmadan alır ve katman aralığı (64) etiket bloğundan (~40px) büyüktür.
 * Daha dar kaplarda (ör. 1024px'te iki sütunlu düzen) etiketler plakaların altına liste olarak iner — ölçeğe bağlı çakışma olmaz.
 */
export interface StackLayer { label: string; sub?: string; accent?: boolean }

interface Props { layers: StackLayer[]; ariaLabel?: string; compact?: boolean }

const WIDE_MIN = 520; // = geniş viewBox genişliği → ölçek ≥ 1: etiket alanı ≈ 264px (24 karakter mono ≈ 230px)

export function IsoStack({ layers, ariaLabel, compact: compactProp }: Props) {
  const reduce = useReducedMotion();
  const narrow = useMediaQuery('(max-width: 48em)', false);
  const { ref, width: boxW } = useElementSize<HTMLDivElement>();
  // Ölçüm gelmeden (0) medya sorgusuna düş; sonra gerçek kap genişliğine göre karar ver.
  const measuredCompact = boxW > 0 ? boxW < WIDE_MIN : narrow;
  const compact = compactProp ?? measuredCompact;
  const [hover, setHover] = useState<number | null>(null);

  const a = 96;                          // yarı genişlik
  const hh = a / Math.sqrt(3);           // yarı yükseklik (isometric oran)
  const t = 12;                          // plaka kalınlığı
  const gap = 64;                        // katman aralığı (etiket bloğu ≈ 40px'ten büyük)
  const cx = a + 24;                     // plaka merkezi
  const leader = 34;                     // kılavuz çizgi uzunluğu
  const labelX = cx + a + leader + 8;    // etiket sütunu başlangıcı
  const width = compact ? cx + a + 24 : 520;   // geniş: etiketler ≈ %50
  const baseY = 70 + hh + (layers.length - 1) * gap;
  const height = baseY + hh + t + 24;
  const cyOf = (i: number) => baseY - i * gap;

  return (
    <div ref={ref} className="th-iso" data-compact={compact || undefined}>
      <svg viewBox={`0 0 ${width} ${height}`} className="th-iso-svg" aria-hidden="true">
        {layers.map((l, i) => {
          const cy = cyOf(i);
          const lift = hover === i ? -10 : 0;
          const top = `${cx},${cy - hh} ${cx + a},${cy} ${cx},${cy + hh} ${cx - a},${cy}`;
          const left = `${cx - a},${cy} ${cx},${cy + hh} ${cx},${cy + hh + t} ${cx - a},${cy + t}`;
          const right = `${cx},${cy + hh} ${cx + a},${cy} ${cx + a},${cy + t} ${cx},${cy + hh + t}`;
          return (
            <motion.g key={l.label}
              initial={reduce ? false : { opacity: 0.35, y: -24 }}
              animate={{ opacity: 1, y: lift }}
              transition={{ type: 'spring', stiffness: 220, damping: 22, delay: reduce ? 0 : 0.12 * i }}
              onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}
              className="th-iso-layer" data-accent={l.accent || undefined} data-active={hover === i || undefined}>
              <polygon points={left} className="th-iso-left" />
              <polygon points={right} className="th-iso-right" />
              <polygon points={top} className="th-iso-top" />
              {/* üst yüzde ince isometric ızgara */}
              <g className="th-iso-grid">
                {[0.25, 0.5, 0.75].map((s) => (
                  <g key={s}>
                    <line x1={cx - a + s * a} y1={cy - s * hh} x2={cx + s * a} y2={cy + hh - s * hh} />
                    <line x1={cx + s * a} y1={cy - hh + s * hh} x2={cx - a + s * a} y2={cy + s * hh} />
                  </g>
                ))}
              </g>
              {!compact && (
                <>
                  <line x1={cx + a} y1={cy} x2={cx + a + leader} y2={cy} className="th-iso-leader" />
                  <circle cx={cx + a} cy={cy} r={2.5} className="th-iso-node" />
                </>
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* Etiketler: HTML, 16px. Geniş ekranda leader çizgilerinin ucuna yüzdelik konumla hizalanır. */}
      <ul className="th-iso-labels" aria-label={ariaLabel}>
        {(compact ? [...layers].reverse() : layers).map((l) => {
          const i = layers.indexOf(l);
          const style = compact
            ? undefined
            : { left: `${(labelX / width) * 100}%`, top: `${(cyOf(i) / height) * 100}%` };
          return (
            <li key={l.label} className="th-iso-label" style={style}
              data-accent={l.accent || undefined} data-active={hover === i || undefined}
              onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              <span className="th-iso-label-main">{l.label}</span>
              {l.sub && <span className="th-iso-label-sub">{l.sub}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
