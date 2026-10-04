import '../styles/products.css';
import { Fragment } from 'react';
import { Box, Group } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { useTier, type RendererProps } from '../engine/core';
import { Eyebrow, MoreLink, TierDot } from '../ui/primitives';
import { FlowingRow, FlowingRows } from '../ui/pf/FlowingRows';

interface Item {
  code: string;
  name: string;
  description: string;
  href: string;
  icon?: string;
  tier?: string;
  badge?: string;
  /** Hover marquee'sinde akan ek parçalar. */
  marquee?: string[];
}
interface Data {
  eyebrow: string;
  navLabel?: string;
  more?: { label: string; href: string; tier?: string };
  /** Marquee parçaları arasındaki ayraç. */
  separator?: string;
  /** Bir marquee parçasının geçiş süresi (sn). */
  speed?: number;
  items: Item[];
}

function ProductRow({ p, index, sep, speed, reduced }: { p: Item; index: number; sep: string; speed: number; reduced: boolean }) {
  const { props } = useTier(p.tier);
  const segments = [`${p.name} — ${p.description}`, ...(p.marquee ?? [])];

  const content = (
    <>
      <span className="pf-idx fe-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <span className="pf-name"><TierDot tier={p.tier} />{p.name}</span>
      <span className="pf-mid">
        <span className="pf-meta">
          <span className="pf-code">{p.code}</span>
          {p.badge && <span className="pf-badge">{p.badge}</span>}
        </span>
        <span className="pf-desc">{p.description}</span>
      </span>
      <span className="pf-arrow" aria-hidden="true"><ArrowRightIcon size={28} weight="regular" /></span>
    </>
  );

  const marquee = (
    <span className="pf-mq-text">
      {segments.map((s, k) => (
        <Fragment key={k}>
          <span>{s}</span>
          <span className="pf-mq-sep">{sep}</span>
        </Fragment>
      ))}
    </span>
  );

  return (
    <FlowingRow
      href={p.href}
      content={content}
      marquee={marquee}
      speed={speed}
      reduced={reduced}
      ariaLabel={`${p.name} — ${p.description}`}
      rowProps={props}
    />
  );
}

export function ProductCards({ doc }: RendererProps<Data>) {
  const { eyebrow, navLabel, more, separator = '◆', speed = 16, items } = doc.data;
  const reduced = useReducedMotion();
  return (
    <Box className="pf">
      <Group justify="space-between" wrap="nowrap" className="pf-head">
        <Eyebrow line>{eyebrow}</Eyebrow>
        <MoreLink more={more} />
      </Group>
      <FlowingRows ariaLabel={navLabel ?? eyebrow}>
        {items.map((p, i) => (
          <ProductRow key={p.code} p={p} index={i} sep={separator} speed={speed} reduced={reduced} />
        ))}
      </FlowingRows>
    </Box>
  );
}
