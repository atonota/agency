import '../styles/sitemap.css';
import { useState } from 'react';
import { Accordion, Anchor, Box, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { motion, useReducedMotion } from 'motion/react';
import CountUp from '../components/reactbits/CountUp';
import { useTier, type RendererProps } from '../engine/core';
import { Icon } from '../ui/Icon';
import { Hint } from '../ui/Hint';
import { TierDot } from '../ui/primitives';

interface LinkItem { label: string; href: string; tier?: string; badge?: string; badgeKind?: 'new' | 'count'; hint?: string }
interface Column { title: string; icon?: string; links: LinkItem[] }
interface Data {
  eyebrow?: string; title?: string; description?: string;
  counts?: { sections: string; pages: string };
  columns: Column[];
}

/* Ayna simetrili asimetri: 3|5|4 · 4|4|4 · 5|3|4 (ilk hücre başlık, son hücre isometric dizin) */
const SPANS = [3, 5, 4, 4, 4, 4, 5, 3, 4];
const ROW_OF = [1, 1, 1, 2, 2, 2, 3, 3, 3];

function SiteLink({ l }: { l: LinkItem }) {
  const { props } = useTier(l.tier);
  return (
    <Hint hint={l.hint}>
      <Anchor href={l.href} className="sm-link" underline="never" data-hint={l.hint ? 'true' : undefined} {...props}>
        <span className="sm-link-text">{l.label}</span>
        {l.badge && <span className="sm-badge" data-kind={l.badgeKind ?? 'count'}>{l.badge}</span>}
        <TierDot tier={l.tier} trail />
      </Anchor>
    </Hint>
  );
}

function Links({ links, cols = 1 }: { links: LinkItem[]; cols?: 1 | 2 }) {
  return (
    <ul className="sm-links" data-cols={cols}>
      {links.map((l) => <li key={l.label}><SiteLink l={l} /></li>)}
    </ul>
  );
}

function ColumnHead({ c, index }: { c: Column; index: number }) {
  return (
    <div className="sm-col-head">
      <span className="sm-col-num fe-num">{String(index + 1).padStart(2, '0')}</span>
      <Icon name={c.icon} size={18} weight="bold" className="sm-col-icon" />
      <span className="sm-col-title">{c.title}</span>
    </div>
  );
}

/** Yedi bölümü temsil eden isometric plaka yığını; sütunlarla karşılıklı vurgu. */
function IsoIndex({ columns, active, setActive }: { columns: Column[]; active: number | null; setActive: (i: number | null) => void }) {
  const reduce = useReducedMotion();
  const a = 84, hh = a / Math.sqrt(3), t = 9, gap = 22, cx = 100;
  const baseY = 24 + hh + (columns.length - 1) * gap;
  const H = baseY + hh + t + 12, W = 200;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sm-iso" role="img" aria-label="Bölümlerin isometric dizini">
      {columns.map((c, i) => {
        const cy = baseY - i * gap;
        const lift = active === i ? -8 : 0;
        const top = `${cx},${cy - hh} ${cx + a},${cy} ${cx},${cy + hh} ${cx - a},${cy}`;
        const left = `${cx - a},${cy} ${cx},${cy + hh} ${cx},${cy + hh + t} ${cx - a},${cy + t}`;
        const right = `${cx},${cy + hh} ${cx + a},${cy} ${cx + a},${cy + t} ${cx},${cy + hh + t}`;
        return (
          <motion.g key={c.title} className="sm-iso-layer" data-active={active === i || undefined}
            initial={reduce ? false : { opacity: 0.35, y: -16 }} animate={{ opacity: 1, y: lift }}
            transition={{ type: 'spring', stiffness: 240, damping: 24, delay: reduce ? 0 : 0.06 * i }}
            onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)}>
            <title>{c.title}</title>
            <polygon points={left} className="sm-iso-left" />
            <polygon points={right} className="sm-iso-right" />
            <polygon points={top} className="sm-iso-top" />
          </motion.g>
        );
      })}
    </svg>
  );
}

export function LinkColumns({ doc }: RendererProps<Data>) {
  const mobile = useMediaQuery('(max-width: 48em)', false);
  const { columns, eyebrow, title, description, counts } = doc.data;
  const [active, setActive] = useState<number | null>(null);
  const pages = columns.reduce((n, c) => n + c.links.length, 0);
  const fmt = (tpl: string | undefined, n: number) => (tpl ?? '{n}').replace('{n}', String(n));

  if (mobile) {
    return (
      <Box className="sm">
        <div className="sm-title-block">
          <Text className="fe-eyebrow fe-eyebrow-accent">{eyebrow}</Text>
          <h2 className="sm-title">{title}</h2>
          {counts && <Text className="sm-counts"><span className="fe-num">{fmt(counts.pages, pages)}</span><span className="sm-sep">·</span><span className="fe-num">{fmt(counts.sections, columns.length)}</span></Text>}
        </div>
        <Accordion multiple variant="default" chevronPosition="right" className="sm-acc">
          {columns.map((c, i) => (
            <Accordion.Item key={c.title} value={c.title}>
              <Accordion.Control icon={<span className="sm-col-num fe-num">{String(i + 1).padStart(2, '0')}</span>}>
                <span className="sm-col-title">{c.title}</span>
              </Accordion.Control>
              <Accordion.Panel><Links links={c.links} /></Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Box>
    );
  }

  const cells: Array<{ kind: 'title' } | { kind: 'col'; i: number } | { kind: 'iso' }> = [
    { kind: 'title' }, ...columns.map((_, i) => ({ kind: 'col' as const, i })), { kind: 'iso' },
  ];

  return (
    <Box className="sm">
      <div className="sm-grid">
        {cells.map((cell, k) => {
          const style = { ['--span' as string]: SPANS[k] ?? 4 };
          const row = ROW_OF[k] ?? 3;
          if (cell.kind === 'title') return (
            <div key="title" className="sm-cell sm-title-block" style={style} data-row={row}>
              <Text className="fe-eyebrow fe-eyebrow-accent">{eyebrow}</Text>
              <h2 className="sm-title">{title}</h2>
              {counts && (
                <div className="sm-counts-big">
                  <span className="sm-count-num fe-num"><CountUp to={pages} duration={1.2} /></span>
                  <span className="sm-count-label">{fmt(counts.pages, pages).replace(String(pages), '').trim()}</span>
                  <span className="sm-count-sub fe-num">{fmt(counts.sections, columns.length)}</span>
                </div>
              )}
              {description && <Text className="sm-desc">{description}</Text>}
            </div>
          );
          if (cell.kind === 'iso') return (
            <div key="iso" className="sm-cell sm-iso-cell" style={style} data-row={row} aria-hidden="false">
              <IsoIndex columns={columns} active={active} setActive={setActive} />
              <Text className="sm-iso-caption">{active !== null ? `${String(active + 1).padStart(2, '0')} · ${columns[active].title}` : ' '}</Text>
            </div>
          );
          const c = columns[cell.i];
          const wide = (SPANS[k] ?? 4) >= 5;
          return (
            <nav key={c.title} aria-label={c.title} className="sm-cell sm-col" style={style} data-row={row}
              data-active={active === cell.i || undefined}
              onPointerEnter={() => setActive(cell.i)} onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(cell.i)} onBlur={() => setActive(null)}>
              <ColumnHead c={c} index={cell.i} />
              <Links links={c.links} cols={wide ? 2 : 1} />
            </nav>
          );
        })}
      </div>
    </Box>
  );
}
