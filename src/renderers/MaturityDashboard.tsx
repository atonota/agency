import '../styles/dashboard.css';
import { useEffect, useMemo, useState } from 'react';
import {
  Box, Collapse, Group, ScrollArea, SegmentedControl, Stack, Table, Text, Title, Tooltip, UnstyledButton, useComputedColorScheme,
} from '@mantine/core';
import { useMediaQuery, useReducedMotion } from '@mantine/hooks';
import { CaretDownIcon, CheckCircleIcon, InfoIcon, WarningIcon } from '@phosphor-icons/react';
import Counter from '../components/reactbits/Counter';
import CountUp from '../components/reactbits/CountUp';
import { useEngine, type DetectedDoc, type RendererProps, type TierKey } from '../engine/core';
import { EChart } from '../ui/EChart';
import { Icon } from '../ui/Icon';

/* ------------------------------------------------------------------ */
/*  JSON sözleşmesi — tüm etiket ve açıklamalar 02-maturity.json'dan   */
/* ------------------------------------------------------------------ */

type KpiKey = 'readiness' | 'total' | 'files' | TierKey;
interface Kpi { key: KpiKey; label: string; unit?: string; hint?: string }
interface PanelDef { kind: 'densest' | 'tier-share' | 'zone' | 'doc'; ref?: string; eyebrow: string; icon?: string; label: string; unit?: string }
interface ChartHead { eyebrow: string; title: string; hint?: string }
interface Data {
  title: string;
  description: string;
  zoneSelector: { ariaLabel: string };
  hero: { eyebrow: string; titleHint?: string; kpis: Kpi[]; radar: { ariaLabel: string; current: string; all: string; hint?: string; truncated?: string } };
  panels: PanelDef[];
  rowLabels: { zone: string; file: string; files: string; required: string; total: string; missing: string; itemUnit: string; percentUnit: string };
  charts: { bars: ChartHead; sunburst: ChartHead };
  detector: {
    toggle: string;
    columns: { file: string; zone: string; type: string; order: string; items: string; tiers: string; status: string; owner: string; reviewed: string; lifecycle: string };
    status: { config: string; registered: string; fallback: string };
    summary: { registered: string; config: string; fallback: string; errors: string }; lifecycle?: Record<string, string>; visibility?: Record<string, string>; note?: string;
  };
  showDetector?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Tema: CSS değişkenleri → canvas renkleri                            */
/* ------------------------------------------------------------------ */

const VARS = [
  '--fe-tier-z', '--fe-tier-o', '--fe-tier-e', '--fe-ink', '--fe-ink-2', '--fe-muted', '--fe-line', '--fe-line-strong',
  '--fe-surface', '--fe-surface-2', '--fe-footer', '--fe-ground', '--fe-accent', '--fe-accent-ink',
] as const;
const SANS = '"IBM Plex Sans", system-ui, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';

/** Tema değiştikçe CSS değişkenlerini okur — grafikler iki temada da doğru renkte çizilir. */
function useThemeVars() {
  const scheme = useComputedColorScheme('light');
  const [vars, setVars] = useState<Record<string, string>>({});
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const cs = getComputedStyle(document.documentElement);
      setVars(Object.fromEntries(VARS.map((v) => [v, cs.getPropertyValue(v).trim()])));
    });
    return () => cancelAnimationFrame(id);
  }, [scheme]);
  return vars;
}

/** #rrggbb → rgba(); canvas color-mix anlamadığı için burada karıştırılır. */
function withAlpha(hex: string, alpha: number) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/* ------------------------------------------------------------------ */
/*  Haneleri kayan büyük sayı (React Bits Counter)                      */
/* ------------------------------------------------------------------ */

function Rolling({ value, size, color, className }: { value: number; size: number; color: string; className?: string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);
  const safe = Math.max(0, Math.round(value));
  if (reduced) return <span className={`md-big fe-num ${className ?? ''}`} style={{ fontSize: size, color }}>{safe}</span>;
  const len = Math.max(1, String(safe).length);
  const places = Array.from({ length: len }, (_, i) => 10 ** (len - 1 - i));
  return (
    <span className={`md-big ${className ?? ''}`} aria-label={String(safe)} role="img">
      <Counter value={Math.max(0, Math.round(shown))} fontSize={size} padding={6} places={places} gap={0} horizontalPadding={0} borderRadius={0}
        textColor={color} fontWeight={600} gradientHeight={0} containerStyle={{ verticalAlign: 'bottom' }} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Renderer                                                            */
/* ------------------------------------------------------------------ */

export function MaturityDashboard({ doc }: RendererProps<Data>) {
  const d = doc.data;
  const { manifest, stage } = useEngine();
  const v = useThemeVars();
  const reduced = !!useReducedMotion();
  const narrow = !!useMediaQuery('(max-width: 640px)');
  const { tiers, totals, docs } = manifest;
  const zoneOptions = manifest.zones.filter((z) => z.docs.some((x) => x.itemCount > 0));
  const [zone, setZone] = useState(zoneOptions.find((z) => z.key === 'footer')?.key ?? zoneOptions[0]?.key ?? '');
  const [open, setOpen] = useState(false);
  const sections = docs.filter((x) => x.zone === zone && x.itemCount > 0);

  const tierColor = (k: TierKey) => v[`--fe-tier-${k}`] || '#888';
  const rankOf = (k: TierKey) => tiers.find((t) => t.key === k)?.rank ?? 99;
  const requiredOf = (counts: Record<TierKey, number>) => tiers.filter((t) => t.rank <= stage).reduce((s, t) => s + (counts[t.key] ?? 0), 0);
  const required = requiredOf(totals);
  const pct = totals.all ? Math.round((required / totals.all) * 100) : 0;
  const currentTier = tiers.find((t) => t.rank === stage);
  const ready = !!v['--fe-ink'];
  const ink = v['--fe-accent-ink'] || '#000';
  const accent = v['--fe-accent'] || '#00ffbb';

  const tooltip = {
    backgroundColor: v['--fe-footer'], borderColor: v['--fe-line'], borderWidth: 1, padding: [10, 14],
    textStyle: { color: v['--fe-ink'], fontFamily: SANS, fontSize: 16 },
  };
  const axis = { color: v['--fe-muted'], fontFamily: SANS, fontSize: 16 };

  /* ---------- Radar: bölüm × (seçili aşama / tüm aşamalar) ---------- */
  // Okunabilirlik: 16px iki satırlı etiketler dar ekranda 8'den fazla eksene sığmaz →
  // ≤640px'de en yoğun 8 bölüm; kalan bölümler bar grafiğinde (not JSON'dan gelir).
  const RADAR_CAP = 8;
  const radarSections = narrow && sections.length > RADAR_CAP
    ? [...sections].sort((a, b) => b.itemCount - a.itemCount).slice(0, RADAR_CAP)
    : sections;
  const radarTruncated = radarSections.length < sections.length;
  const dense = radarSections.length > RADAR_CAP;
  const radarHeight = narrow ? 420 : dense ? 500 : 380;
  const radarRadius = narrow ? '45%' : dense ? '50%' : '58%';
  const radarNote = radarTruncated && d.hero.radar.truncated
    ? d.hero.radar.truncated.replace('{shown}', String(radarSections.length)).replace('{total}', String(sections.length))
    : '';

  const radarOption = useMemo(() => {
    // Her eksen kendi toplamına normalize: "Tüm aşamalar" dış çokgen, "Seçili aşama" kapsama oranı
    const cur = radarSections.map((s) => requiredOf(s.tierCounts));
    const wrapName = (name: string) => {
      if (name.length <= 14) return name;
      const i = name.lastIndexOf(' ', 14);
      return i > 0 ? `${name.slice(0, i)}\n${name.slice(i + 1)}` : name;
    };
    const byName = Object.fromEntries(radarSections.map((s, i) => [s.label, `${cur[i]}/${s.itemCount}`]));
    const nameWidth = narrow ? 96 : 120;
    return {
      animation: !reduced,
      animationDuration: 600,
      tooltip: { ...tooltip, trigger: 'item' },
      legend: {
        right: 0, top: 0, icon: 'rect', itemWidth: 22, itemHeight: 3, itemGap: 22,
        data: [d.hero.radar.current, d.hero.radar.all],
        textStyle: { color: ink, fontFamily: SANS, fontSize: 16 },
      },
      radar: {
        shape: 'polygon', radius: radarRadius, center: ['50%', '56%'], splitNumber: 4, nameGap: 12,
        indicator: radarSections.map((s) => ({ name: s.label, max: Math.max(1, s.itemCount) })),
        axisName: {
          formatter: (name: string) => `{n|${wrapName(name)}}\n{v|${byName[name] ?? ''}}`,
          width: nameWidth, overflow: 'break',
          // align verilmez: ECharts eksenin yönüne göre sol/sağ/orta hizalar, komşu etiketler çakışmaz.
          rich: {
            n: { color: ink, fontFamily: SANS, fontSize: 16, fontWeight: 600, lineHeight: 22, width: nameWidth, overflow: 'break' },
            v: { color: withAlpha(ink, 0.72), fontFamily: MONO, fontSize: 16, lineHeight: 20 },
          },
        },
        axisLine: { lineStyle: { color: withAlpha(ink, 0.3) } },
        splitLine: { lineStyle: { color: withAlpha(ink, 0.3) } },
        splitArea: { show: false },
      },
      series: [{
        type: 'radar', symbol: 'circle', symbolSize: 8,
        data: [
          {
            name: d.hero.radar.current, value: cur,
            lineStyle: { width: 2.5, color: ink }, itemStyle: { color: ink, borderColor: accent, borderWidth: 2 },
            areaStyle: { color: withAlpha(ink, 0.22) },
          },
          {
            name: d.hero.radar.all, value: radarSections.map((s) => s.itemCount),
            lineStyle: { type: 'dashed', width: 1.5, color: withAlpha(ink, 0.65) }, itemStyle: { color: withAlpha(ink, 0.65) },
            areaStyle: { color: withAlpha(ink, 0.05) }, symbolSize: 5,
          },
        ],
      }],
    };
  }, [v, stage, zone, d.hero.radar, reduced, narrow, radarRadius]);

  /* ---------- Yığılmış yatay bar: bölüm × aşama ---------- */
  const barOption = useMemo(() => ({
    animation: !reduced,
    animationDuration: 700,
    tooltip: { ...tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, icon: 'circle', itemWidth: 10, itemHeight: 10, textStyle: axis },
    grid: { left: 4, right: 20, top: 8, bottom: 40, containLabel: true },
    xAxis: { type: 'value', axisLabel: axis, splitLine: { lineStyle: { color: v['--fe-line'] } } },
    yAxis: {
      type: 'category', inverse: true, data: sections.map((s) => s.label),
      axisLabel: { ...axis, color: v['--fe-ink-2'] }, axisLine: { show: false }, axisTick: { show: false },
    },
    series: tiers.map((t) => ({
      name: t.label, type: 'bar', stack: 'all', barWidth: 16,
      data: sections.map((s) => ({ value: s.tierCounts[t.key], itemStyle: { opacity: t.rank > stage ? 0.22 : 1 } })),
      itemStyle: { color: tierColor(t.key), borderRadius: 2 },
      emphasis: { focus: 'series' },
    })),
  }), [v, stage, zone, reduced]);

  /* ---------- Sunburst: bölüm → aşama ---------- */
  const sunburstOption = useMemo(() => ({
    animation: !reduced,
    animationDuration: 800,
    tooltip: { ...tooltip, formatter: (p: { name: string; value: number }) => `${p.name}: <b>${p.value}</b>` },
    series: [{
      type: 'sunburst', radius: ['16%', '96%'], sort: undefined,
      itemStyle: { borderColor: v['--fe-ground'] || '#fff', borderWidth: 2, borderRadius: 3 },
      label: { show: false },
      levels: [
        {},
        { r0: '16%', r: '58%', label: { show: true, rotate: 'tangential', fontSize: 16, color: v['--fe-ink'], fontFamily: SANS, minAngle: 14 } },
        { r0: '60%', r: '96%' },
      ],
      emphasis: { focus: 'ancestor' },
      data: sections.map((s, si) => ({
        name: s.label,
        itemStyle: { color: si % 2 ? v['--fe-surface-2'] : v['--fe-line'] },
        children: tiers.filter((t) => s.tierCounts[t.key] > 0).map((t) => ({
          name: `${s.label} · ${t.label}`, value: s.tierCounts[t.key],
          itemStyle: { color: tierColor(t.key), opacity: t.rank > stage ? 0.22 : 1 },
        })),
      })),
    }],
  }), [v, stage, zone, reduced]);

  /* ---------- KPI değerleri ---------- */
  const kpiValue = (k: KpiKey): number => {
    if (k === 'readiness') return pct;
    if (k === 'total') return totals.all;
    if (k === 'files') return docs.length;
    return totals[k] ?? 0;
  };

  /* ---------- Koyu paneller ---------- */
  type Row = { label: string; value: number | string; unit?: string; tier?: TierKey };
  const tierRows = (counts: Record<TierKey, number>): Row[] => tiers.map((t) => ({ label: t.label, value: counts[t.key] ?? 0, tier: t.key }));
  const withItems = docs.filter((x) => x.itemCount > 0);
  const zoneLabel = (key: string) => manifest.zones.find((z) => z.key === key)?.label ?? key;

  const panels = d.panels.map((p) => {
    let name = '', value = 0, rows: Row[] = [], missing = false;
    if (p.kind === 'densest') {
      const top = [...withItems].sort((a, b) => b.itemCount - a.itemCount)[0];
      if (top) {
        name = top.label; value = top.itemCount;
        rows = [{ label: d.rowLabels.zone, value: zoneLabel(top.zone) }, ...tierRows(top.tierCounts), { label: d.rowLabels.required, value: requiredOf(top.tierCounts), unit: p.unit }];
      } else missing = true;
    } else if (p.kind === 'tier-share') {
      const t = tiers.find((x) => x.key === p.ref);
      if (t) {
        name = t.label; value = totals.all ? Math.round((totals[t.key] / totals.all) * 100) : 0;
        rows = [
          ...zoneOptions.map((z) => {
            const zt = z.docs.reduce((s, x) => s + (x.tierCounts[t.key] ?? 0), 0);
            const za = z.docs.reduce((s, x) => s + x.itemCount, 0);
            return { label: z.label, value: za ? Math.round((zt / za) * 100) : 0, unit: d.rowLabels.percentUnit };
          }),
          { label: d.rowLabels.total, value: totals[t.key], unit: d.rowLabels.itemUnit },
          // Diğer panellerle tutarlı son satır: bu aşama seçili aşamada gerekiyorsa tamamı, değilse 0.
          { label: d.rowLabels.required, value: t.rank <= stage ? totals[t.key] : 0, unit: d.rowLabels.itemUnit },
        ];
      } else missing = true;
    } else if (p.kind === 'zone') {
      const z = manifest.zones.find((x) => x.key === p.ref);
      if (z) {
        const counts = z.docs.reduce<Record<TierKey, number>>((acc, x) => { (['z', 'o', 'e'] as TierKey[]).forEach((k) => { acc[k] += x.tierCounts[k] ?? 0; }); return acc; }, { z: 0, o: 0, e: 0 });
        name = z.label; value = z.docs.reduce((s, x) => s + x.itemCount, 0);
        rows = [{ label: d.rowLabels.files, value: z.docs.length }, ...tierRows(counts), { label: d.rowLabels.required, value: requiredOf(counts), unit: p.unit }];
      } else missing = true;
    } else {
      const x: DetectedDoc | undefined = docs.find((y) => y.id === p.ref);
      if (x) {
        name = x.label; value = x.itemCount;
        rows = [{ label: d.rowLabels.zone, value: zoneLabel(x.zone) }, ...tierRows(x.tierCounts), { label: d.rowLabels.required, value: requiredOf(x.tierCounts), unit: p.unit }];
      } else missing = true;
    }
    return { ...p, name, value, rows, missing };
  });

  const counts = {
    registered: docs.filter((x) => x.status === 'registered').length,
    config: docs.filter((x) => x.status === 'config').length,
    fallback: docs.filter((x) => x.status === 'fallback').length,
  };

  return (
    <Stack gap={28} className="md-dash">
      {/* Başlık + bölge seçici */}
      <Group justify="space-between" align="flex-end" wrap="wrap" gap={20} className="md-head">
        <Stack gap={6}>
          <Title order={2} className="fe-h2">{d.title}</Title>
          <Text fz={16} c="var(--fe-muted)" maw="72ch">{d.description}</Text>
        </Stack>
        <SegmentedControl size="md" radius="md" value={zone} onChange={setZone} className="md-seg"
          data={zoneOptions.map((z) => ({ value: z.key, label: z.label }))} aria-label={d.zoneSelector.ariaLabel} />
      </Group>

      {/* Referans panel bloğu: mint üst + koyu alt */}
      <Box className="md-block">
        <Box className="md-hero">
          <Box className="md-hero-left">
            <Text component="span" className="md-hero-eyebrow">{d.hero.eyebrow}</Text>
            <Tooltip label={d.hero.titleHint} disabled={!d.hero.titleHint} fz={16} withArrow>
              <Group gap={14} wrap="nowrap" className="md-hero-title" data-tier={currentTier?.key}>
                <span className="md-hero-icon" aria-hidden="true"><Icon name={currentTier?.icon} size={30} weight="bold" /></span>
                <span>{currentTier?.label}</span>
              </Group>
            </Tooltip>
            <span className="md-hero-rule" aria-hidden="true" />
            <Box className="md-kpis">
              {d.hero.kpis.map((k) => {
                const val = kpiValue(k.key);
                const tierKey = (['z', 'o', 'e'] as string[]).includes(k.key) ? (k.key as TierKey) : undefined;
                const off = tierKey ? rankOf(tierKey) > stage : false;
                return (
                  <Box key={k.key} className="md-kpi" data-off={off || undefined}>
                    <Group gap={6} wrap="nowrap" className="md-kpi-label">
                      <span>{k.label}</span>
                      {k.hint && (
                        <Tooltip label={k.hint} multiline w={280} withArrow fz={16} position="top">
                          <span className="md-kpi-info" tabIndex={0} role="img" aria-label={k.hint}><InfoIcon size={16} weight="bold" /></span>
                        </Tooltip>
                      )}
                    </Group>
                    <Group gap={6} align="baseline" wrap="nowrap" className="md-kpi-value">
                      {k.key === 'readiness'
                        ? <Rolling value={val} size={38} color="var(--fe-accent-ink)" />
                        : reduced
                          ? <span className="md-big fe-num" style={{ fontSize: 38 }}>{val}</span>
                          : <span className="md-big fe-num" style={{ fontSize: 38 }}><CountUp from={Math.floor(val * 0.6)} to={val} duration={1.2} /></span>}
                      {k.unit && <span className="md-kpi-unit">{k.unit}</span>}
                      {k.key === 'readiness' && <span className="md-kpi-sub fe-num">{required}/{totals.all}</span>}
                    </Group>
                  </Box>
                );
              })}
            </Box>
          </Box>
          <Box className="md-hero-radar">
            <Box role="img" aria-label={d.hero.radar.ariaLabel} title={d.hero.radar.hint}>
              {ready && radarSections.length > 0 && <EChart option={radarOption} height={radarHeight} />}
            </Box>
            {radarNote && <Text component="p" className="md-radar-note">{radarNote}</Text>}
          </Box>
        </Box>

        <Box className="md-panels">
          {panels.map((p) => (
            <Box key={p.eyebrow} className="md-panel">
              <Text component="span" className="md-panel-eyebrow">{p.eyebrow}</Text>
              <Group gap={10} wrap="nowrap" className="md-panel-name">
                <span className="md-panel-icon" aria-hidden="true"><Icon name={p.icon} size={22} weight="bold" /></span>
                <span>{p.missing ? d.rowLabels.missing : p.name}</span>
              </Group>
              <Text component="span" className="md-panel-metric">{p.label}</Text>
              <Group gap={8} align="baseline" wrap="nowrap">
                <Rolling value={p.value} size={46} color="var(--fe-accent)" />
                {p.unit && <span className="md-panel-unit">{p.unit}</span>}
              </Group>
              <span className="md-panel-rule" aria-hidden="true" />
              <Box className="md-rows">
                {p.rows.map((r) => (
                  <Box key={r.label} className="md-row" data-tier={r.tier} data-off={r.tier && rankOf(r.tier) > stage ? 'true' : undefined}>
                    <span className="md-row-label">{r.tier && <span className="fe-legend-dot" data-tier={r.tier} />}{r.label}</span>
                    <span className="md-row-value fe-num">{r.value}{r.unit && <span className="md-row-unit">{r.unit}</span>}</span>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* İkinci grafik satırı — kutusuz */}
      {ready && sections.length > 0 && (
        <Box className="md-charts">
          <Box className="md-chart">
            <Box className="md-chart-head">
              <Text component="span" className="fe-eyebrow fe-eyebrow-accent">{d.charts.bars.eyebrow}</Text>
              <Text component="span" className="md-chart-title">{d.charts.bars.title}</Text>
              {d.charts.bars.hint && <Text component="span" className="md-chart-hint">{d.charts.bars.hint}</Text>}
            </Box>
            <EChart option={barOption} height={Math.max(260, sections.length * 30 + 70)} />
          </Box>
          <Box className="md-chart">
            <Box className="md-chart-head">
              <Text component="span" className="fe-eyebrow fe-eyebrow-accent">{d.charts.sunburst.eyebrow}</Text>
              <Text component="span" className="md-chart-title">{d.charts.sunburst.title}</Text>
              {d.charts.sunburst.hint && <Text component="span" className="md-chart-hint">{d.charts.sunburst.hint}</Text>}
            </Box>
            <EChart option={sunburstOption} height={Math.max(300, sections.length * 30 + 70)} />
          </Box>
        </Box>
      )}

      {/* Dedektör — varsayılan kapalı */}
      {d.showDetector && (
        <Box className="md-detector">
          <UnstyledButton className="md-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="md-detector-table">
            <CaretDownIcon size={18} weight="bold" className="md-caret" data-open={open || undefined} />
            <span className="md-toggle-label">{d.detector.toggle} <span className="fe-num">({docs.length})</span></span>
            <span className="md-toggle-meta fe-num">
              {counts.registered} {d.detector.summary.registered} · {counts.config} {d.detector.summary.config}
              {counts.fallback > 0 && <> · {counts.fallback} {d.detector.summary.fallback}</>}
              {manifest.errors.length > 0 && <> · <span className="md-err">{manifest.errors.length} {d.detector.summary.errors}</span></>}
            </span>
          </UnstyledButton>
          <Collapse expanded={open} transitionDuration={240}>
            <ScrollArea type="auto" id="md-detector-table">
              <Table verticalSpacing={10} horizontalSpacing="md" className="md-table" miw={1100}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{d.detector.columns.file}</Table.Th><Table.Th>{d.detector.columns.zone}</Table.Th><Table.Th>{d.detector.columns.type}</Table.Th>
                    <Table.Th>{d.detector.columns.order}</Table.Th><Table.Th>{d.detector.columns.items}</Table.Th><Table.Th>{d.detector.columns.tiers}</Table.Th><Table.Th>{d.detector.columns.status}</Table.Th>
                    <Table.Th>{d.detector.columns.owner}</Table.Th><Table.Th>{d.detector.columns.reviewed}</Table.Th><Table.Th>{d.detector.columns.lifecycle}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {docs.map((x) => (
                    <Table.Tr key={x.path}>
                      <Table.Td><span className="md-mono">{x.file}</span></Table.Td>
                      <Table.Td><span className="md-muted">{zoneLabel(x.zone)}</span></Table.Td>
                      <Table.Td><span className="md-mono">{x.type}</span></Table.Td>
                      <Table.Td><span className="fe-num">{x.order}</span></Table.Td>
                      <Table.Td><span className="fe-num">{x.itemCount || '—'}</span></Table.Td>
                      <Table.Td>
                        {x.itemCount > 0 ? (
                          <Box className="md-minibar" aria-label={tiers.map((t) => `${t.label}: ${x.tierCounts[t.key]}`).join(', ')}>
                            {tiers.map((t) => x.tierCounts[t.key] > 0 && (
                              <Tooltip key={t.key} label={`${t.label}: ${x.tierCounts[t.key]}`} fz={16}>
                                <span data-tier={t.key} data-off={t.rank > stage ? 'true' : undefined} style={{ flex: x.tierCounts[t.key] }} />
                              </Tooltip>
                            ))}
                          </Box>
                        ) : <span className="md-muted">—</span>}
                      </Table.Td>
                      <Table.Td>
                        {x.status === 'fallback' ? (
                          <Group gap={6} wrap="nowrap"><WarningIcon size={16} color="var(--fe-tier-o)" weight="fill" /><span>{d.detector.status.fallback}</span></Group>
                        ) : (
                          <Group gap={6} wrap="nowrap"><CheckCircleIcon size={16} color="var(--fe-ok)" weight="fill" /><span>{d.detector.status[x.status]}</span></Group>
                        )}
                      </Table.Td>
                      <Table.Td><span className="md-muted">{x.owner ?? '—'}</span></Table.Td>
                      <Table.Td><span className="md-mono fe-num">{x.reviewedAt ?? '—'}</span></Table.Td>
                      <Table.Td>
                        <span className="md-mono">{x.lifecycle ? (d.detector.lifecycle?.[x.lifecycle] ?? x.lifecycle) : '—'}</span>
                        {x.visibility === 'controlled' && <span className="md-muted"> · {d.detector.visibility?.controlled ?? 'NDA'}</span>}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Collapse>
        </Box>
      )}
    </Stack>
  );
}
