import '../styles/roadmap.css';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import AnimatedContent from '../components/reactbits/AnimatedContent';
import {
  Anchor, Box, Group, SegmentedControl, SimpleGrid,
  Stack, Text, Title, Tooltip, VisuallyHidden, useComputedColorScheme,
} from '@mantine/core';
import { ArrowRightIcon, ArrowUpRightIcon, CheckIcon, EyeIcon, LockKeyIcon, XIcon } from '@phosphor-icons/react';
import { useEngine, useTier, type RendererProps } from '../engine/core';
import { EChart } from '../ui/EChart';
import { Icon } from '../ui/Icon';
import { TierDot } from '../ui/primitives';

type Link = { label: string; href: string; tier?: string };

export function Head({ eyebrow, title, description, right }: { eyebrow: string; title: string; description?: string; right?: ReactNode }) {
  return (
    <Group justify="space-between" align="flex-end" mb={36} gap="lg" className="fe-head">
      <Stack gap={10} maw={760}>
        <Text className="fe-eyebrow fe-eyebrow-accent">{eyebrow}</Text>
        <Title order={2} className="fe-h2">{title}</Title>
        {description && <Text c="var(--fe-ink-2)" maw="62ch">{description}</Text>}
      </Stack>
      {right}
    </Group>
  );
}

/* ================= Sorular: editoryal liste ================= */

interface QData { eyebrow: string; title: string; items: { question: string; answer: string; href: string; tier?: string }[] }

function QuestionRow({ q, i }: { q: QData['items'][number]; i: number }) {
  const { props } = useTier(q.tier);
  return (
    <a href={q.href} className="fe-qrow" {...props}>
      <span className="fe-qnum">{String(i + 1).padStart(2, '0')}</span>
      <span className="fe-qbody">
        <span className="fe-qtitle"><TierDot tier={q.tier} />{q.question}</span>
        <span className="fe-qanswer">{q.answer}</span>
      </span>
      <ArrowRightIcon size={18} className="fe-qarrow" />
    </a>
  );
}

export function TrustQuestions({ doc }: RendererProps<QData>) {
  return (
    <Box>
      <Head eyebrow={doc.data.eyebrow} title={doc.data.title} />
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48} verticalSpacing={0} className="fe-qlist">
        {doc.data.items.map((q, i) => <QuestionRow key={q.question} q={q} i={i} />)}
      </SimpleGrid>
    </Box>
  );
}

/* ================= 16 alan: tema sütunlarında dizin ================= */

interface Area { id: string; href?: string; title: string; label: string; description: string; icon: string; tier?: string; access: 'public' | 'nda'; group: string }
interface AreaData { eyebrow: string; title: string; access: Record<string, string>; groupIcons: Record<string, string>; items: Area[] }

function AreaRow({ a, accessLabel }: { a: Area; accessLabel: string }) {
  const { props } = useTier(a.tier);
  return (
    <a id={a.id} href={a.href ?? `#${a.id}`} className="fe-arow" {...props}>
      <span className="fe-arow-icon"><Icon name={a.icon} size={18} weight="duotone" /></span>
      <span className="fe-arow-body">
        <span className="fe-arow-title">
          <TierDot tier={a.tier} />{a.label}
          <Tooltip label={accessLabel} withArrow>
            <span className="fe-access" data-access={a.access}>{a.access === 'nda' ? <LockKeyIcon size={11} weight="bold" /> : <EyeIcon size={11} weight="bold" />}</span>
          </Tooltip>
        </span>
        <span className="fe-arow-en">{a.title}</span>
        <span className="fe-arow-desc">{a.description}</span>
      </span>
    </a>
  );
}

export function TrustAreas({ doc }: RendererProps<AreaData>) {
  const { access, items, groupIcons } = doc.data;
  const groups = Array.from(new Set(items.map((i) => i.group)));
  return (
    <Box>
      <Head eyebrow={doc.data.eyebrow} title={doc.data.title}
        right={<Group gap="lg">
          <Group gap={6}><span className="fe-access" data-access="public"><EyeIcon size={11} weight="bold" /></span><Text fz={16} c="var(--fe-muted)">{access.public}</Text></Group>
          <Group gap={6}><span className="fe-access" data-access="nda"><LockKeyIcon size={11} weight="bold" /></span><Text fz={16} c="var(--fe-muted)">{access.nda}</Text></Group>
        </Group>} />
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={36} verticalSpacing={40}>
        {groups.map((g) => (
          <Box key={g}>
            <Group gap={8} className="fe-group-head">
              <Icon name={groupIcons[g]} size={15} weight="bold" />
              <Text className="fe-eyebrow">{g}</Text>
            </Group>
            {items.filter((i) => i.group === g).map((a) => <AreaRow key={a.id} a={a} accessLabel={access[a.access]} />)}
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}

/* ================= Ürün uyum matrisi: ECharts nokta matrisi ================= */

interface MatrixData {
  eyebrow: string; title: string; description: string; products: string[];
  statuses: Record<string, { label: string; color: string }>;
  rows: { standard: string; cells: string[] }[]; note?: string;
}

function useVars(names: string[]) {
  const scheme = useComputedColorScheme('light');
  const [v, setV] = useState<Record<string, string>>({});
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const cs = getComputedStyle(document.documentElement);
      setV(Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(n).trim()])));
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheme]);
  return v;
}

export function ComplianceMatrix({ doc }: RendererProps<MatrixData>) {
  const d = doc.data;
  const [focus, setFocus] = useState('Tümü');
  const v = useVars(['--fe-tier-z', '--fe-tier-o', '--fe-muted', '--fe-line', '--fe-ink', '--fe-ink-2', '--fe-footer', '--fe-line-strong']);
  const fi = d.products.indexOf(focus);

  const option = useMemo(() => {
    const data: { value: [number, number]; status: string }[] = [];
    d.rows.forEach((r, y) => r.cells.forEach((c, x) => data.push({ value: [x, y], status: c })));
    const style = (s: string, x: number) => {
      const dim = fi >= 0 && fi !== x ? 0.15 : 1;
      if (s === 'in') return { symbolSize: 20, itemStyle: { color: v['--fe-tier-z'], opacity: dim, shadowBlur: 12, shadowColor: v['--fe-tier-z'] + '66' } };
      if (s === 'eval') return { symbolSize: 16, itemStyle: { color: 'transparent', borderColor: v['--fe-tier-o'], borderWidth: 2, opacity: dim } };
      return { symbolSize: 5, itemStyle: { color: v['--fe-line-strong'], opacity: dim } };
    };
    const axisText = { color: v['--fe-ink-2'], fontFamily: 'IBM Plex Mono', fontSize: 16 };
    return {
      animationDuration: 900,
      animationEasing: 'cubicOut' as const,
      grid: { left: 8, right: 16, top: 44, bottom: 8, containLabel: true },
      tooltip: {
        backgroundColor: v['--fe-footer'], borderColor: v['--fe-line'], textStyle: { color: v['--fe-ink'], fontFamily: 'IBM Plex Sans', fontSize: 16 },
        formatter: (p: { data: { value: [number, number]; status: string } }) =>
          `<b>${d.products[p.data.value[0]]}</b><br/>${d.rows[p.data.value[1]].standard}<br/><span style="opacity:.7">${d.statuses[p.data.status]?.label}</span>`,
      },
      xAxis: {
        type: 'category', position: 'top', data: d.products, axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { ...axisText, fontFamily: 'IBM Plex Sans', fontWeight: 600, color: v['--fe-ink'] },
        splitLine: { show: true, lineStyle: { color: v['--fe-line'], type: 'dashed' } },
      },
      yAxis: {
        type: 'category', inverse: true, data: d.rows.map((r) => r.standard), axisLine: { show: false }, axisTick: { show: false },
        axisLabel: axisText, splitLine: { show: true, lineStyle: { color: v['--fe-line'] } },
      },
      series: [{
        type: 'scatter',
        data: data.map((pt) => ({ ...pt, ...style(pt.status, pt.value[0]) })),
        emphasis: { scale: 1.35 },
        animationDelay: (i: number) => i * 12,
      }],
    };
  }, [v, fi, d]);

  return (
    <Box>
      <Head eyebrow={d.eyebrow} title={d.title} description={d.description}
        right={<SegmentedControl size="md" radius="xl" value={focus} onChange={setFocus} data={['Tümü', ...d.products]} className="fe-seg-pill" />} />
      {v['--fe-ink'] && <EChart option={option} height={d.rows.length * 40 + 60} />}
      <VisuallyHidden>
        <table>
          <thead><tr><th>Standart</th>{d.products.map((p) => <th key={p}>{p}</th>)}</tr></thead>
          <tbody>{d.rows.map((r) => <tr key={r.standard}><th>{r.standard}</th>{r.cells.map((c, i) => <td key={i}>{d.statuses[c]?.label}</td>)}</tr>)}</tbody>
        </table>
      </VisuallyHidden>
      <Group gap="xl" mt="md" className="fe-legend-line">
        <Group gap={8}><span className="fe-mdot" data-status="in" /><Text fz={16} c="var(--fe-muted)">{d.statuses.in.label}</Text></Group>
        <Group gap={8}><span className="fe-mdot" data-status="eval" /><Text fz={16} c="var(--fe-muted)">{d.statuses.eval.label}</Text></Group>
        <Group gap={8}><span className="fe-mdot" data-status="na" /><Text fz={16} c="var(--fe-muted)">{d.statuses.na.label}</Text></Group>
        {d.note && <Text fz={16} c="var(--fe-muted)" ff="monospace" ml="auto">{d.note}</Text>}
      </Group>
    </Box>
  );
}

/* ================= Yol haritası: fazlar · 12 dalga · rozet politikası · takvim ================= */

interface RoadmapWave { n: number; domain: string; standard: string; target: string; why: string; tier?: string }
interface RoadmapBadgeRow { kind: string; example: string; how: string }
interface RoadmapCalEvent { date: string; dateLabel: string; label: string; action: string }

interface RoadmapData {
  eyebrow: string; title: string; description?: string;
  phases: { title: string; tier?: string; items: { code: string; text: string }[] }[];
  /* (a) 12 dalga */
  wavesTitle?: string; wavesNote?: string;
  waveLabels?: { target: string; why: string };
  waves?: RoadmapWave[];
  /* (b) güven rozeti politikası */
  badgePolicyTitle?: string; badgePolicyIntro?: string;
  badgeColumns?: { kind: string; example: string; how: string };
  badgePolicy?: RoadmapBadgeRow[];
  badgeNotesTitle?: string; badgeNotes?: string[];
  /* (c) regülasyon ve sürüm takvimi */
  calendarTitle?: string; calendarIntro?: string;
  calendarToday?: string; calendarTodayLabel?: string;
  calendarRange?: { start: string; end: string };
  calendarLegend?: { past: string; future: string };
  calendarActionPrefix?: string;
  calendar?: RoadmapCalEvent[];
  /* (d) doğru / yanlış ifade */
  wordingTitle: string; wordingDo?: string; wordingDont?: string;
  wording: { do: string; dont: string }[];
}

/** Alt bölüm başlığı: mono eyebrow + uzayan ince çizgi + isteğe bağlı açıklama. */
function RoadmapSubHead({ title, intro }: { title: string; intro?: string }) {
  return (
    <>
      <div className="rm-sub-head"><h3 className="rm-sub-title">{title}</h3></div>
      {intro && <Text component="p" className="rm-sub-intro">{intro}</Text>}
    </>
  );
}

/* ---- (a) 12 dalga: numaralı ray, 3 sütun × 4 satır ---- */

function WaveItem({ w, labels, active }: { w: RoadmapWave; labels: { target: string; why: string }; active: boolean }) {
  const { props } = useTier(w.tier);
  return (
    <article className="rm-wave fe-tier-block" data-active={active || undefined} {...props}>
      {/* hover vurgu çizgisi ayrı çocukta: ::after global köşe tier noktasına (fe-tier-block[data-tags]) bırakılır */}
      <i className="rm-wave-hl" aria-hidden="true" />
      <span className="rm-wave-n" aria-hidden="true">{String(w.n).padStart(2, '0')}</span>
      <span className="rm-wave-domain"><TierDot tier={w.tier} />{w.domain}</span>
      <span className="rm-wave-std">{w.standard}</span>
      <p className="rm-wave-p" data-kind="target"><span className="rm-wave-k">{labels.target}</span>{w.target}</p>
      <p className="rm-wave-p" data-kind="why"><span className="rm-wave-k">{labels.why}</span>{w.why}</p>
    </article>
  );
}

function WaveRail({ d, rank, stage, reduced }: { d: RoadmapData; rank: (k?: string) => number; stage: number; reduced: boolean }) {
  const waves = d.waves ?? [];
  if (!waves.length) return null;
  const labels = d.waveLabels ?? { target: '', why: '' };
  return (
    <Box className="rm-sub">
      <RoadmapSubHead title={d.wavesTitle ?? ''} intro={d.wavesNote} />
      <div className="rm-waves" role="list" aria-label={d.wavesTitle}>
        {waves.map((w, i) => {
          const item = <WaveItem w={w} labels={labels} active={rank(w.tier) <= stage} />;
          return reduced
            ? <div key={w.n} role="listitem" className="rm-wave-wrap">{item}</div>
            : (
              <AnimatedContent key={w.n} role="listitem" className="rm-wave-wrap" distance={14} duration={0.55} ease="power3.out"
                initialOpacity={0.4} threshold={0.05} delay={(i % 3) * 0.08}>
                {item}
              </AnimatedContent>
            );
        })}
      </div>
    </Box>
  );
}

/* ---- (b) Güven rozeti politikası: üç sütunlu çizgi listesi ---- */

function BadgePolicy({ d }: { d: RoadmapData }) {
  const rows = d.badgePolicy ?? [];
  if (!rows.length) return null;
  const c = d.badgeColumns ?? { kind: '', example: '', how: '' };
  return (
    <Box className="rm-sub">
      <RoadmapSubHead title={d.badgePolicyTitle ?? ''} intro={d.badgePolicyIntro} />
      <div className="rm-policy" role="table" aria-label={d.badgePolicyTitle}>
        <div role="row" style={{ display: 'contents' }}>
          <span role="columnheader" className="rm-policy-h">{c.kind}</span>
          <span role="columnheader" className="rm-policy-h">{c.example}</span>
          <span role="columnheader" className="rm-policy-h">{c.how}</span>
        </div>
        {rows.map((r) => (
          <div key={r.kind} role="row" className="rm-policy-row">
            <span role="cell" className="rm-policy-kind">{r.kind}</span>
            <span role="cell" className="rm-policy-ex">{r.example}</span>
            <span role="cell" className="rm-policy-how">{r.how}</span>
          </div>
        ))}
      </div>
      {!!d.badgeNotes?.length && (
        <>
          {d.badgeNotesTitle && <Text component="p" className="rm-notes-title">{d.badgeNotesTitle}</Text>}
          <ul className="rm-notes">{d.badgeNotes.map((n) => <li key={n}>{n}</li>)}</ul>
        </>
      )}
    </Box>
  );
}

/* ---- (c) Regülasyon ve sürüm takvimi: yatay zaman çizgisi ---- */

/* Ray bandı geometrisi (px = viewBox birimi; roadmap.css'teki --rm-h / --rm-r ile aynı):
   ray y = CAL_R, üstteki olaylar 0'a, alttakiler CAL_H'ye bağlanır; "bugün" etiketi CAL_R + 40'ta. */
const CAL_W = 1000, CAL_H = 150, CAL_R = 60;
const toMs = (iso: string) => new Date(`${iso}T00:00:00Z`).getTime();

function RegCalendar({ d, reduced }: { d: RoadmapData; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const [hover, setHover] = useState<number | null>(null);

  const events = useMemo(() => [...(d.calendar ?? [])].sort((a, b) => a.date.localeCompare(b.date)), [d.calendar]);
  if (!events.length) return null;

  const today = d.calendarToday ?? new Date().toISOString().slice(0, 10);
  const start = toMs(d.calendarRange?.start ?? events[0].date);
  const end = toMs(d.calendarRange?.end ?? events[events.length - 1].date);
  const span = Math.max(1, end - start);
  const pct = (iso: string) => Math.min(100, Math.max(0, ((toMs(iso) - start) / span) * 100));
  const n = events.length;
  /* Olaylar rayın üstüne/altına sırayla dağılır: çift indeks üst, tek indeks alt; her yanda ⌈n/2⌉ sütun. */
  const cols = Math.ceil(n / 2);
  const side = (i: number): 'above' | 'below' => (i % 2 === 0 ? 'above' : 'below');
  const col = (i: number) => Math.floor(i / 2);
  const xs = events.map((e) => pct(e.date) * (CAL_W / 100));
  const cx = events.map((_, i) => ((col(i) + 0.5) / cols) * CAL_W);
  const linkPath = (i: number) =>
    side(i) === 'above'
      ? `M ${xs[i]} ${CAL_R} V ${CAL_R - 10} L ${cx[i]} ${CAL_R - 34} V 0`
      : `M ${xs[i]} ${CAL_R} V ${CAL_R + 10} L ${cx[i]} ${CAL_R + 34} V ${CAL_H}`;
  const todayX = pct(today) * (CAL_W / 100);
  const isFuture = (iso: string) => iso > today;
  const firstFuture = events.findIndex((e) => isFuture(e.date));
  const on = inView || reduced;
  const todayText = `${d.calendarTodayLabel ?? ''} · ${today}`.trim();

  /* Hareket: ray soldan çizilir (geçmiş → bugün → gelecek), sonra bağlantılar ve noktalar açılır. */
  const draw = (delay: number, dur: number) =>
    reduced
      ? {}
      : { initial: { pathLength: 0, opacity: 0 }, animate: on ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }, transition: { delay, duration: dur, ease: 'easeInOut' as const } };
  const fade = (delay: number) =>
    reduced ? {} : { initial: { opacity: 0.35 }, animate: on ? { opacity: 1 } : { opacity: 0.35 }, transition: { delay, duration: 0.4 } };
  const pop = (delay: number) =>
    reduced
      ? {}
      : { initial: { scale: 0, opacity: 0 }, animate: on ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }, transition: { delay, duration: 0.35, type: 'spring' as const, stiffness: 320, damping: 22 } };

  return (
    <Box className="rm-sub rm-cal" ref={ref}>
      <RoadmapSubHead title={d.calendarTitle ?? ''} intro={d.calendarIntro} />
      {/* Tek <ol>, tarih sırasıyla (AT okuma sırası). Görsel yerleşim: üst satır / ray / alt satır, sütun --rm-c. */}
      <ol className="rm-cal-grid" style={{ '--rm-n': cols } as CSSProperties} aria-label={d.calendarTitle}>
        {events.map((e, i) => (
          <li key={e.date + e.label} className="rm-cal-ev" data-side={side(i)} data-future={isFuture(e.date) || undefined}
            data-last={col(i) === cols - 1 || undefined}
            data-today-marker={i === firstFuture ? todayText : undefined}
            style={{ '--rm-c': col(i) + 1 } as CSSProperties}
            onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            <span className="rm-cal-ev-dot" aria-hidden="true" />
            <time className="rm-cal-date" dateTime={e.date}>{e.dateLabel}</time>
            <span className="rm-cal-label">{e.label}</span>
            <span className="rm-cal-action">
              {d.calendarActionPrefix && <span className="rm-cal-arrow" aria-hidden="true">{d.calendarActionPrefix}</span>}
              {e.action}
            </span>
          </li>
        ))}
        <li className="rm-cal-rail" role="presentation" aria-hidden="true">
          <svg className="rm-cal-svg" viewBox={`0 0 ${CAL_W} ${CAL_H}`} preserveAspectRatio="none" focusable="false">
            <motion.path className="rm-cal-line" d={`M 0 ${CAL_R} H ${todayX}`} {...draw(0, 0.9)} />
            <motion.path className="rm-cal-line" data-future d={`M ${todayX} ${CAL_R} H ${CAL_W}`} {...draw(0.9, 0.7)} />
            <motion.line className="rm-cal-today-line" x1={todayX} x2={todayX} y1={CAL_R - 12} y2={CAL_R + 38} {...fade(0.85)} />
            {events.map((e, i) => (
              <motion.path key={e.date + e.label} className="rm-cal-link" data-future={isFuture(e.date) || undefined} data-on={hover === i || undefined}
                d={linkPath(i)} {...draw(1.1 + i * 0.07, 0.45)} />
            ))}
          </svg>
          {events.map((e, i) => (
            <span key={e.date + e.label} className="rm-cal-dot-pos" data-on={hover === i || undefined} style={{ left: `${pct(e.date)}%` }}>
              <motion.span className="rm-cal-dot" data-future={isFuture(e.date) || undefined} {...pop(0.2 + (xs[i] / CAL_W) * 0.9)} />
            </span>
          ))}
          <span className="rm-cal-today-pos" style={{ left: `${pct(today)}%` }}>
            <motion.span className="rm-cal-today" {...pop(0.9)}>{todayText}</motion.span>
          </span>
        </li>
      </ol>
      {d.calendarLegend && (
        <div className="rm-cal-legend" aria-hidden="true">
          <span><i /> {d.calendarLegend.past}</span>
          <span><i data-future /> {d.calendarLegend.future}</span>
        </div>
      )}
    </Box>
  );
}

function PhaseCol({ ph, idx, active }: { ph: RoadmapData['phases'][number]; idx: number; active: boolean }) {
  const { props } = useTier(ph.tier);
  return (
    <Box className="fe-phase" data-active={active || undefined} {...props}>
      <span className="fe-phase-node" data-tier={ph.tier}>{idx + 1}</span>
      <Text fw={600} fz={16} mt={18} c="var(--fe-ink)">{ph.title}</Text>
      <Stack gap={16} mt={14}>
        {ph.items.map((it) => (
          <Box key={it.code}>
            <Text ff="monospace" fz={16} fw={500} c="var(--fe-ink)">{it.code}</Text>
            <Text fz={16} c="var(--fe-ink-2)" lh={1.55} mt={2}>{it.text}</Text>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export function CertRoadmap({ doc }: RendererProps<RoadmapData>) {
  const d = doc.data;
  const { manifest, stage } = useEngine();
  const reduced = !!useReducedMotion();
  const rank = (k?: string) => manifest.tiers.find((t) => t.key === k)?.rank ?? 9;
  return (
    <Box>
      <Head eyebrow={d.eyebrow} title={d.title} description={d.description} />
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={32} verticalSpacing={40} className="fe-phases">
        {d.phases.map((ph, i) => <PhaseCol key={ph.title} ph={ph} idx={i} active={rank(ph.tier) <= stage} />)}
      </SimpleGrid>

      <WaveRail d={d} rank={rank} stage={stage} reduced={reduced} />
      <BadgePolicy d={d} />
      <RegCalendar d={d} reduced={reduced} />

      <Box className="rm-sub">
        <Text className="fe-eyebrow" mb={18}>{d.wordingTitle}</Text>
        <Box className="fe-wording-grid">
          <Group gap={8} className="fe-wording-h"><CheckIcon size={14} weight="bold" color="var(--fe-ok)" /><Text fz={16} fw={600}>{d.wordingDo ?? 'Böyle yazın'}</Text></Group>
          <Group gap={8} className="fe-wording-h"><XIcon size={14} weight="bold" color="var(--mantine-color-red-6)" /><Text fz={16} fw={600}>{d.wordingDont ?? 'Böyle yazmayın'}</Text></Group>
          {d.wording.map((w) => (
            <Box key={w.do} className="fe-wording-row">
              <Text fz={16} c="var(--fe-ink)" lh={1.5}>{w.do}</Text>
              <Text fz={16} c="var(--fe-muted)" td="line-through" lh={1.5}>{w.dont}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ================= Durum ================= */

interface StatusData {
  eyebrow: string; title: string; note?: string;
  services: { name: string; uptime: number; incidents: { day: number; level: 'minor' | 'major' }[]; tier?: string }[];
  history: { date: string; title: string; level: string; duration: string; status: string }[];
  subscribe?: Link;
}

function ServiceRow({ s }: { s: StatusData['services'][number] }) {
  const { props } = useTier(s.tier);
  const days = useMemo(() => Array.from({ length: 90 }, (_, i) => s.incidents.find((x) => x.day === i)?.level ?? 'ok'), [s.incidents]);
  return (
    <Box className="fe-svc" {...props}>
      <Group gap={10} wrap="nowrap" className="fe-svc-name"><span className="fe-pulse" aria-hidden="true" /><Text fz={16} fw={500}>{s.name}</Text></Group>
      <Box className="fe-uptime" role="img" aria-label={`${s.name} son 90 gün: %${s.uptime}`}>
        {days.map((lv, i) => (
          <Tooltip key={i} label={`${90 - i} gün önce · ${lv === 'ok' ? 'Sorun yok' : lv === 'minor' ? 'Kısmi kesinti' : 'Büyük kesinti'}`} withArrow openDelay={40}>
            <span data-level={lv} style={{ ['--i' as string]: i }} />
          </Tooltip>
        ))}
      </Box>
      <Text ff="monospace" fz={16} c="var(--fe-ink-2)" className="fe-num fe-svc-up">%{s.uptime.toFixed(2)}</Text>
    </Box>
  );
}

export function StatusBoard({ doc }: RendererProps<StatusData>) {
  const d = doc.data;
  const sub = useTier(d.subscribe?.tier);
  return (
    <Box>
      <Head eyebrow={d.eyebrow} title={d.title}
        right={<Group gap="md">
          {d.note && <Text ff="monospace" fz={16} c="var(--fe-muted)">{d.note}</Text>}
          {d.subscribe && <Anchor href={d.subscribe.href} className="fe-textlink" underline="never" {...sub.props}>{d.subscribe.label} <ArrowUpRightIcon size={14} weight="bold" /></Anchor>}
        </Group>} />
      <Box className="fe-status-layout">
        <Box>
          <Group gap={12} mb={24} className="fe-allok">
            <span className="fe-pulse fe-pulse-lg" aria-hidden="true" />
            <Text fz={22} fw={600} lts="-0.01em">Tüm sistemler çalışıyor</Text>
          </Group>
          <Stack gap={0}>{d.services.map((s) => <ServiceRow key={s.name} s={s} />)}</Stack>
          <Group justify="space-between" mt={8} className="fe-uptime-axis"><Text fz={16} c="var(--fe-muted)">90 gün önce</Text><Text fz={16} c="var(--fe-muted)">Bugün</Text></Group>
        </Box>
        <Box className="fe-history">
          <Text className="fe-eyebrow" mb={16}>Olay geçmişi</Text>
          {d.history.map((h) => (
            <Box key={h.title} className="fe-hist-row">
              <span className="fe-inc" data-level={h.level} />
              <Box>
                <Text fz={16} fw={500}>{h.title}</Text>
                <Text fz={16} c="var(--fe-muted)">{h.date} · {h.duration} · {h.status}</Text>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

