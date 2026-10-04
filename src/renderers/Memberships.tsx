import '../styles/memberships.css';
import { Box } from '@mantine/core';
import { useReducedMotion } from 'motion/react';
import Magnet from '../components/reactbits/Magnet';
import ElectricBorder from '../components/reactbits/ElectricBorder';
import { useTier, type RendererProps, type TierKey } from '../engine/core';
import { Icon } from '../ui/Icon';
import { Eyebrow, MoreLink } from '../ui/primitives';
import { useThemeVars } from '../ui/cl/useThemeVars';

interface Item { label: string; sub?: string; href: string; tier?: TierKey; icon?: string; featured?: boolean }
interface Data { eyebrow: string; more?: { label: string; href: string; tier?: string }; items: Item[] }

function ShelfItem({ it, accent, reduced }: { it: Item; accent?: string; reduced: boolean }) {
  const { props } = useTier(it.tier);
  const ring = (
    <span className="cl-ring-lg" aria-hidden="true">
      <Icon name={it.icon} size={20} weight="duotone" />
    </span>
  );
  const electric = it.featured && accent && !reduced;
  return (
    <Magnet padding={28} magnetStrength={9} disabled={reduced} wrapperClassName="cl-magnet" innerClassName="cl-magnet-inner">
      <a href={it.href} className="cl-shelf-item fe-tier-block" {...props} data-featured={it.featured || undefined}>
        {electric ? (
          <ElectricBorder color={accent} speed={0.7} chaos={0.05} borderRadius={22} className="cl-electric">{ring}</ElectricBorder>
        ) : ring}
        <span className="cl-shelf-name">{it.label}</span>
        {it.sub && <span className="cl-shelf-sub">{it.sub}</span>}
      </a>
    </Magnet>
  );
}

/** "Raf": ince bir taban çizgisi üzerinde eşit aralıklı üyelik/ödül işaretleri. Kutu, pill, nokta yok. */
export function Memberships({ doc }: RendererProps<Data>) {
  const { items, eyebrow, more } = doc.data;
  const v = useThemeVars();
  const reduced = !!useReducedMotion();
  return (
    <Box component="nav" className="cl-shelf" aria-label={eyebrow}>
      <Box className="cl-shelf-eyebrow"><Eyebrow>{eyebrow}</Eyebrow></Box>
      <Box component="ul" className="cl-shelf-items">
        {items.map((it) => (
          <li key={it.href} className="cl-shelf-cell">
            <ShelfItem it={it} accent={v['--fe-accent']} reduced={reduced} />
          </li>
        ))}
      </Box>
      <Box className="cl-shelf-more"><MoreLink more={more} /></Box>
    </Box>
  );
}
