import { ActionIcon, Box, Group, Stack, Switch, Text, Tooltip, UnstyledButton, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { MoonIcon, SunIcon } from '@phosphor-icons/react';
import BlurText from '../components/reactbits/BlurText';
import CountUp from '../components/reactbits/CountUp';
import { useEngine, type RendererProps } from '../engine/core';
import { Icon } from '../ui/Icon';

interface Data { eyebrow: string; title: string; description: string }

export function PlanHero({ doc }: RendererProps<Data>) {
  const { manifest, stage, setStage, showTags, setShowTags } = useEngine();
  const { setColorScheme } = useMantineColorScheme();
  const scheme = useComputedColorScheme('light');
  const { totals, tiers } = manifest;
  const cumulative = (rank: number) => tiers.filter((t) => t.rank <= rank).reduce((s, t) => s + totals[t.key], 0);

  return (
    <Stack gap={40} className="fe-hero">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={16} maw={860}>
          <Text className="fe-eyebrow fe-eyebrow-accent">{doc.data.eyebrow}</Text>
          <BlurText text={doc.data.title} animateBy="words" direction="top" delay={70} animationFrom={{ filter: 'blur(3px)', opacity: 0.6, y: -6 }} animationTo={[{ filter: 'blur(3px)', opacity: 0.75, y: 2 }, { filter: 'blur(0px)', opacity: 1, y: 0 }]} className="fe-display fe-display-blur" />
          <Text c="var(--fe-ink-2)" fz={16} lh={1.6} maw="62ch">{doc.data.description}</Text>
        </Stack>
        <Group gap={14} wrap="nowrap" className="fe-hero-tools">
          <Switch size="md" checked={showTags} onChange={(e) => setShowTags(e.currentTarget.checked)} label="Etiketler" />
          <Tooltip label={scheme === 'dark' ? 'Açık tema' : 'Koyu tema'}>
            <ActionIcon variant="subtle" color="gray" size="lg" radius="xl" aria-label="Temayı değiştir"
              onClick={() => setColorScheme(scheme === 'dark' ? 'light' : 'dark')}>
              {scheme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Aşama rayı: seçili aşamaya kadar olan çizgi dolar */}
      <Box className="fe-rail" role="tablist" aria-label="Olgunluk aşaması" style={{ ['--fill' as string]: `${((stage - 1) / Math.max(1, tiers.length - 1)) * 100}%` }}>
        <span className="fe-rail-track" aria-hidden="true"><span className="fe-rail-fill" /></span>
        {tiers.map((t) => (
          <UnstyledButton key={t.key} role="tab" aria-selected={stage === t.rank} className="fe-rail-step"
            data-tier={t.key} data-on={t.rank <= stage || undefined} data-current={stage === t.rank || undefined} onClick={() => setStage(t.rank)}>
            <span className="fe-rail-node"><Icon name={t.icon} size={14} weight="bold" /></span>
            <span className="fe-rail-num fe-num"><CountUp from={Math.floor(cumulative(t.rank) * 0.6)} to={cumulative(t.rank)} duration={1.1} /></span>
            <span className="fe-rail-label">{t.label}</span>
            <span className="fe-rail-hint">{t.hint}</span>
          </UnstyledButton>
        ))}
      </Box>
    </Stack>
  );
}
