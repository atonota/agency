import '../styles/actions.css';
import { Box, Text } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { ArrowRightIcon, ArrowUpRightIcon, CheckIcon, CopyIcon } from '@phosphor-icons/react';
import BlurText from '../components/reactbits/BlurText';
import { useTier, type RendererProps } from '../engine/core';
import { Icon } from '../ui/Icon';
import { Eyebrow, TierDot } from '../ui/primitives';

/* ================= Aksiyon bandı: 3 birincil satır + "Hızlı erişim" ================= */

interface Action {
  icon: string;
  title: string;
  description?: string;
  href?: string;
  /** Bağlantı yerine gösterilen değer (ör. telefon) — mono, kopyalanabilir */
  value?: string;
  mono?: boolean;
  copy?: boolean;
  tier?: string;
}
interface Data {
  headline: string;
  subline?: string;
  primary: Action[];
  secondaryEyebrow: string;
  secondary: Action[];
  copy: { label: string; done: string; aria: string };
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Birincil aksiyon: numara · ikon · başlık/açıklama · ok ---------- */
function PrimaryRow({ item, index }: { item: Action; index: number }) {
  const { props } = useTier(item.tier);
  return (
    <a href={item.href} className="ab-primary fe-tier-block" {...props}>
      <span className="ab-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <span className="ab-icon"><Icon name={item.icon} size={24} weight="duotone" /></span>
      <span className="ab-body">
        <span className="ab-primary-title"><TierDot tier={item.tier} />{item.title}</span>
        {item.description && <span className="ab-desc">{item.description}</span>}
      </span>
      <ArrowUpRightIcon size={22} className="ab-arrow" aria-hidden="true" />
    </a>
  );
}

/* ---------- Kopyala düğmesi: değer panoya alınır, etiket JSON'dan ---------- */
function CopyButton({ value, labels }: { value: string; labels: Data['copy'] }) {
  const clipboard = useClipboard({ timeout: 1600 });
  return (
    <button
      type="button"
      className="ab-copy"
      data-copied={clipboard.copied || undefined}
      aria-label={`${labels.aria}: ${value}`}
      onClick={() => clipboard.copy(value)}
    >
      {clipboard.copied ? <CheckIcon size={16} weight="bold" aria-hidden="true" /> : <CopyIcon size={16} aria-hidden="true" />}
      <span className="ab-copy-text" aria-live="polite">{clipboard.copied ? labels.done : labels.label}</span>
    </button>
  );
}

/* ---------- İkincil "Hızlı erişim" satırı: bağlantı ya da değer ---------- */
function QuickRow({ item, copy }: { item: Action; copy: Data['copy'] }) {
  const { props } = useTier(item.tier);
  const inner = (
    <>
      <span className="ab-quick-icon"><Icon name={item.icon} size={20} weight="duotone" /></span>
      <span className="ab-quick-title"><TierDot tier={item.tier} />{item.title}</span>
    </>
  );
  if (item.href) {
    return (
      <a href={item.href} className="ab-quick fe-tier-block" data-link="true" {...props}>
        {inner}
        <ArrowRightIcon size={16} weight="bold" className="ab-quick-arrow" aria-hidden="true" />
      </a>
    );
  }
  return (
    <div className="ab-quick fe-tier-block" data-kind="value" {...props}>
      {inner}
      {item.value && <span className={item.mono ? 'ab-value' : 'ab-value ab-value-sans'}>{item.value}</span>}
      {item.value && item.copy && <CopyButton value={item.value} labels={copy} />}
    </div>
  );
}

export function ActionCards({ doc }: RendererProps<Data>) {
  const { headline, subline, primary, secondaryEyebrow, secondary, copy } = doc.data;
  const staticTitle = reducedMotion();
  return (
    <Box className="ab">
      <Box className="ab-lead">
        {staticTitle ? (
          <h2 className="ab-title">{headline}</h2>
        ) : (
          <div role="heading" aria-level={2}>
            <BlurText
              text={headline}
              animateBy="words"
              direction="bottom"
              delay={90}
              animationFrom={{ filter: 'blur(3px)', opacity: 0.6, y: 6 }}
              animationTo={[{ filter: 'blur(3px)', opacity: 0.75, y: -2 }, { filter: 'blur(0px)', opacity: 1, y: 0 }]}
              className="ab-title"
            />
          </div>
        )}
        {subline && <Text component="p" className="ab-sub">{subline}</Text>}
      </Box>

      <Box className="ab-actions">
        <nav className="ab-primary-list" aria-label={headline}>
          {primary.map((it, i) => <PrimaryRow key={it.title} item={it} index={i} />)}
        </nav>

        <Box className="ab-quick-head">
          <Eyebrow line>{secondaryEyebrow}</Eyebrow>
        </Box>
        <nav className="ab-quick-list" aria-label={secondaryEyebrow}>
          {secondary.map((it) => <QuickRow key={it.title} item={it} copy={copy} />)}
        </nav>
      </Box>
    </Box>
  );
}
