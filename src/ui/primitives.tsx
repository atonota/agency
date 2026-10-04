import type { ReactNode } from 'react';
import { Anchor, Box, Group, Text } from '@mantine/core';
import { ArrowRightIcon } from '@phosphor-icons/react';
import AnimatedContent from '../components/reactbits/AnimatedContent';
import { useTier } from '../engine/core';

/** Aşama etiketi noktası — "Etiketleri göster" açıkken görünür. */
export function TierDot({ tier, trail = false }: { tier?: string; trail?: boolean }) {
  const { props } = useTier(tier);
  if (!tier) return null;
  return <span className={trail ? 'fe-dot fe-dot-trail' : 'fe-dot'} {...props} aria-hidden="true" />;
}

/** Mono, harf aralıklı küçük başlık + uzayan ince çizgi. */
export function Eyebrow({ children, line = false }: { children: ReactNode; line?: boolean }) {
  return (
    <Group gap="sm" wrap="nowrap" className="fe-eyebrow-row" data-line={line || undefined}>
      <Text component="span" className="fe-eyebrow">{children}</Text>
    </Group>
  );
}

export function MoreLink({ more }: { more?: { label: string; href: string; tier?: string } }) {
  const { props } = useTier(more?.tier);
  if (!more) return null;
  return (
    <Anchor href={more.href} className="fe-more" underline="never" {...props}>
      <TierDot tier={more.tier} />
      {more.label}
      <ArrowRightIcon size={14} weight="bold" className="fe-more-arrow" />
    </Anchor>
  );
}

/** React Bits AnimatedContent ile yumuşak giriş; hareket azaltma tercihine uyar. */
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return <Box>{children}</Box>;
  return (
    <AnimatedContent distance={16} duration={0.6} ease="power3.out" initialOpacity={0.45} threshold={0.05} delay={delay}>
      {children}
    </AnimatedContent>
  );
}
