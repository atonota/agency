import { useId, useLayoutEffect, useState, type ReactNode } from 'react';
import { Anchor, Box, Button, Text, Title, useComputedColorScheme } from '@mantine/core';
import { ArrowRightIcon, ArrowUpRightIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import { useReducedMotion } from 'motion/react';
import TextType from '../components/reactbits/TextType';
import CircularText from '../components/reactbits/CircularText';
import ElectricBorder from '../components/reactbits/ElectricBorder';
import CountUp from '../components/reactbits/CountUp';
import { useTier, type RendererProps } from '../engine/core';
import { Hint } from '../ui/Hint';
import { IsoStack, type StackLayer } from '../ui/IsoStack';
import '../styles/trust-hero.css';

type Link = { label: string; href: string; tier?: string };

/* ================= Güven Merkezi girişi ================= */

interface HeroData {
  eyebrow: string;
  typed: string[];            // daktilo ile yazılıp silinen hedef kitle kelimeleri
  titleAfter: string;         // sabit ikinci satır
  title: string;              // ekran okuyucu için tam cümle
  description: string;
  audiencesLabel?: string;
  audiences: { label: string; hint?: string }[];
  primary: Link; secondary: Link;
  signals: { label: string; value: number | string }[];
  note?: string;
  seal: string;
  stackLabel?: string;
  stack: StackLayer[];
}

/** --fe-accent token'ını okur; tema değişince yeniden okur (canvas bileşenleri CSS değişkeni çözemez). */
function useAccentColor() {
  const scheme = useComputedColorScheme('dark');
  const [accent, setAccent] = useState('');
  useLayoutEffect(() => {
    const read = () => setAccent(getComputedStyle(document.documentElement).getPropertyValue('--fe-accent').trim());
    read();
    const raf = requestAnimationFrame(read);
    return () => cancelAnimationFrame(raf);
  }, [scheme]);
  return accent;
}

/** Birincil eylem: mint pill, hareket açıkken React Bits ElectricBorder içinde. */
function ElectricPill({ color, reduce, children }: { color: string; reduce: boolean; children: ReactNode }) {
  if (reduce || !color) return <span className="th-pill">{children}</span>;
  return (
    <ElectricBorder color={color} speed={0.8} chaos={0.05} borderRadius={999} className="th-pill th-pill-electric">
      {children}
    </ElectricBorder>
  );
}

export function TrustHero({ doc }: RendererProps<HeroData>) {
  const d = doc.data;
  const reduce = useReducedMotion() ?? false;
  const accent = useAccentColor();
  const p = useTier(d.primary.tier), s = useTier(d.secondary.tier);
  const audId = useId();

  return (
    <Box className="th-hero">
      {/* ---------- Sol: metin ---------- */}
      <div className="th-copy">
        <p className="th-eyebrow">
          <span className="th-shield" aria-hidden="true"><ShieldCheckIcon size={16} weight="fill" /></span>
          <span className="fe-eyebrow fe-eyebrow-accent">{d.eyebrow}</span>
        </p>

        <Title order={2} className="th-title">
          <span className="th-sr">{d.title}</span>
          <span className="th-title-visual" aria-hidden="true">
            <span className="th-type-line">
              {reduce
                ? <span className="th-type-static">{d.typed[0]}</span>
                : <TextType as="span" text={d.typed} className="th-type" typingSpeed={70} deletingSpeed={38}
                    pauseDuration={1700} loop showCursor cursorCharacter="|" cursorBlinkDuration={0.55} startOnVisible />}
            </span>
            <span className="th-title-after">{d.titleAfter}</span>
          </span>
        </Title>

        <Text className="th-desc">{d.description}</Text>

        {/* Kitle satırı: hint'li kısaltmalar klavyeyle odaklanabilir; açılım Tooltip'e ek olarak aria-describedby ile
            ekran okuyucuya da verilir (paylaşılan Hint yalnızca hover'da açılır). */}
        <ul className="th-aud" aria-label={d.audiencesLabel}>
          {d.audiences.map((a, i) => {
            const hintId = a.hint ? `${audId}-${i}` : undefined;
            return (
              <li key={a.label} className="th-aud-item">
                <Hint hint={a.hint}>
                  <span className="th-aud-label" data-hint={a.hint ? 'true' : undefined}
                    tabIndex={a.hint ? 0 : undefined} aria-describedby={hintId}>{a.label}</span>
                </Hint>
                {a.hint && <span id={hintId} className="th-sr">{a.hint}</span>}
              </li>
            );
          })}
        </ul>

        <div className="th-actions">
          <ElectricPill color={accent} reduce={reduce}>
            <Button component="a" href={d.primary.href} size="md" radius="xl" className="th-btn fe-tier-block"
              vars={() => ({ root: {
                '--button-bg': 'var(--fe-accent)', '--button-color': 'var(--fe-accent-ink)',
                '--button-hover': 'color-mix(in srgb, var(--fe-accent) 86%, var(--fe-ink))', '--button-hover-color': 'var(--fe-accent-ink)',
                '--button-fz': '16px', '--button-height': '46px', '--button-padding-x': '22px',
              } })}
              rightSection={<ArrowRightIcon size={18} weight="bold" />} {...p.props}>
              {d.primary.label}
            </Button>
          </ElectricPill>
          <Anchor href={d.secondary.href} className="fe-textlink fe-tier-block" underline="never" {...s.props}>
            {d.secondary.label} <ArrowUpRightIcon size={16} weight="bold" />
          </Anchor>
        </div>

        <dl className="th-signals">
          {d.signals.map((sg, i) => {
            const numeric = typeof sg.value === 'number';
            return (
              <div key={sg.label} className="th-signal">
                <dt className="th-signal-label">{sg.label}</dt>
                <dd className="th-signal-value fe-num">
                  {numeric && !reduce
                    ? <CountUp to={sg.value as number} duration={1.4} delay={0.15 * i} separator="." />
                    : sg.value}
                </dd>
              </div>
            );
          })}
        </dl>

        {d.note && <p className="th-note">{d.note}</p>}
      </div>

      {/* ---------- Sağ: katman yığını + mühür ---------- */}
      <div className="th-art">
        <div className="th-seal" role="img" aria-label={d.seal}>
          <CircularText text={d.seal} spinDuration={reduce ? 100000 : 28} onHover="slowDown" className="th-seal-ring" />
          <span className="th-seal-core" aria-hidden="true"><ShieldCheckIcon size={32} weight="duotone" /></span>
        </div>
        <IsoStack layers={d.stack} ariaLabel={d.stackLabel} />
      </div>
    </Box>
  );
}
