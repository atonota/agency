import '../styles/group-strip.css';
import { Fragment, useMemo, useRef, useState } from 'react';
import { Box } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import { VelocityBand, type VelocityBandProps, type VelocityMapping } from '../ui/pf/VelocityBand';
import { useVisibilityGate } from '../ui/lp/useVisibilityGate';
import { useTier, type RendererProps } from '../engine/core';
import { Eyebrow, MoreLink, TierDot } from '../ui/primitives';

interface Item { label: string; href: string; tier?: string }
interface Data {
  eyebrow: string;
  navLabel?: string;
  more?: { label: string; href: string; tier?: string };
  /** Taban kayma hızı (px/sn); kaydırma hızı bunu çarpar. */
  velocity?: number;
  /** Kaydırma hızının en fazla kaç kat ek hız vereceği (2 → en çok 3x). */
  scrollBoost?: number;
  /** İşaretçi bandın üzerindeyken hız çarpanı (0 = durur). */
  hoverFactor?: number;
  separator?: string;
  items: Item[];
  /** İkinci satır: grup sloganı ve sektör etiketleri (ters yönde akar). */
  line2?: string[];
}

function Name({ it, tabbable }: { it: Item; tabbable: boolean }) {
  const { props } = useTier(it.tier);
  return (
    <a href={it.href} className="pf-gs-name" tabIndex={tabbable ? undefined : -1} {...props}>
      <TierDot tier={it.tier} />
      <span className="pf-gs-name-text">{it.label}</span>
    </a>
  );
}

function NamesLine({ items, sep }: { items: Item[]; sep: string }) {
  return (
    <span className="pf-gs-line">
      {items.map((it) => (
        <Fragment key={it.href}>
          <Name it={it} tabbable={false} />
          <span className="pf-gs-sep">{sep}</span>
        </Fragment>
      ))}
    </span>
  );
}

function TagsLine({ tags, sep }: { tags: string[]; sep: string }) {
  return (
    <span className="pf-gs-line pf-gs-line2">
      {tags.map((t, i) => (
        <Fragment key={i}>
          <span className="pf-gs-tag">{t}</span>
          <span className="pf-gs-sep">{sep}</span>
        </Fragment>
      ))}
    </span>
  );
}

/**
 * Görünürlük kapısı (perf-loops): bant görünüm alanı dışında veya sekme gizliyken pf/VelocityBand'e
 * `velocity=0` geçilir. Row'un frame gövdesi o zaman `baseX.set(baseX.get() + 0)` yapar; motion
 * MotionValue değişmeyen değerde dinleyicileri uyandırmaz → stil yazımı ve yeniden çizim olmaz;
 * maliyet erken dönüşle aynıdır (useAnimationFrame her iki tasarımda da aboneliği bırakmaz).
 * Bant tek kaynaktan (pf) gelir; kopya yok. Kapı durumu yalnızca bu alt bileşeni yeniden render eder,
 * Row memo'lu olduğu için motion.div yeniden mount olmaz, bant kaldığı yerden devam eder.
 */
function GatedBand({ velocity = 100, ...band }: VelocityBandProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  useVisibilityGate(ref, '160px 0px', setOpen);
  return (
    /* aria-hidden: okuyucu için eşdeğer liste alttaki nav'da; bağlantılar fare ile tıklanabilir (hover'da bant durur). */
    <Box ref={ref} className="pf-gs-motion" aria-hidden="true">
      <VelocityBand {...band} velocity={open ? velocity : 0} />
    </Box>
  );
}

/** Klavye/okuyucu için statik ad listesi; hareket azaltmada görünen sürüm de budur. */
function StaticNames({ items, label, className }: { items: Item[]; label: string; className: string }) {
  return (
    <nav className={className} aria-label={label}>
      {items.map((it) => <Name key={it.href} it={it} tabbable />)}
    </nav>
  );
}

export function GroupStrip({ doc }: RendererProps<Data>) {
  const { eyebrow, navLabel, more, velocity = 34, scrollBoost = 2, hoverFactor = 0, separator = '◆', items, line2 = [] } = doc.data;
  const reduced = useReducedMotion();

  /* Sabit referanslar: VelocityBand memo'lu; Engine (aşama/etiket) yeniden render'ları banda inmez.
     Name bileşenleri useTier ile context tüketicisi olduğu için data-dim/data-tags yine güncellenir. */
  const texts = useMemo(
    () => [<NamesLine key="names" items={items} sep={separator} />, ...(line2.length ? [<TagsLine key="tags" tags={line2} sep={separator} />] : [])],
    [items, line2, separator],
  );
  const mapping = useMemo<VelocityMapping>(() => ({ input: [0, 1000], output: [0, scrollBoost] }), [scrollBoost]);

  const a11yLabel = navLabel ?? eyebrow;

  return (
    <Box className="pf-gs" data-static={reduced || undefined}>
      <Box className="pf-gs-head"><Eyebrow>{eyebrow}</Eyebrow></Box>
      <Box className="pf-gs-track">
        {reduced ? (
          <Box className="pf-gs-static">
            <StaticNames items={items} label={a11yLabel} className="pf-gs-static-names" />
            {line2.length > 0 && (
              <p className="pf-gs-static-tags">
                {line2.map((t, i) => (
                  <Fragment key={i}>
                    {i > 0 && <span className="pf-gs-sep">{separator}</span>}
                    <span className="pf-gs-tag">{t}</span>
                  </Fragment>
                ))}
              </p>
            )}
          </Box>
        ) : (
          <>
            <GatedBand
              texts={texts}
              velocity={velocity}
              velocityMapping={mapping}
              hoverFactor={hoverFactor}
              numCopies={4}
              className="pf-gs-copy"
              bandClassName="pf-gs-band"
              parallaxClassName="pf-gs-parallax"
              scrollerClassName="pf-gs-scroller"
            />
            <StaticNames items={items} label={a11yLabel} className="pf-gs-a11y" />
          </>
        )}
      </Box>
      <Box className="pf-gs-more"><MoreLink more={more} /></Box>
    </Box>
  );
}
