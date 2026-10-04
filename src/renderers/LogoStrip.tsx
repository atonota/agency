import { Box, Group } from '@mantine/core';
import LogoLoop from '../components/reactbits/LogoLoop';
import { useTier, type RendererProps } from '../engine/core';
import { Icon } from '../ui/Icon';
import { Eyebrow, MoreLink } from '../ui/primitives';

interface Item { label: string; href: string; tier?: string; icon?: string }
interface Data { eyebrow: string; more?: { label: string; href: string; tier?: string }; items: Item[]; speed?: number; direction?: 'left' | 'right' }

function Mark({ it }: { it: Item }) {
  const { props } = useTier(it.tier);
  return (
    <a href={it.href} className="fe-mark" {...props}>
      {it.icon && <Icon name={it.icon} size={16} weight="duotone" />}
      <span>{it.label}</span>
    </a>
  );
}

export function LogoStrip({ doc }: RendererProps<Data>) {
  const { items, speed = 40, direction = 'left' } = doc.data;
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <Group wrap="nowrap" gap="xl" className="fe-strip">
      <Box className="fe-strip-label"><Eyebrow>{doc.data.eyebrow}</Eyebrow></Box>
      <Box className="fe-strip-loop">
        {reduced ? (
          <Group gap={10}>{items.map((it) => <Mark key={it.href} it={it} />)}</Group>
        ) : (
          <LogoLoop
            logos={items.map((it) => ({ node: <Mark it={it} />, title: it.label }))}
            speed={speed}
            direction={direction}
            logoHeight={40}
            gap={12}
            pauseOnHover
            fadeOut
            fadeOutColor="var(--fe-footer)"
            ariaLabel={doc.data.eyebrow}
          />
        )}
      </Box>
      <Box className="fe-strip-more"><MoreLink more={doc.data.more} /></Box>
    </Group>
  );
}
