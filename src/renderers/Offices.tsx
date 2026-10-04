import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ActionIcon, Box, CopyButton, Text, Tooltip } from '@mantine/core';
import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import Counter from '../components/reactbits/Counter';
import { useTier, type RendererProps } from '../engine/core';
import { Eyebrow, Reveal, TierDot } from '../ui/primitives';
import { useElementWidth } from '../ui/of/useElementWidth';
import '../styles/offices.css';

/* ------------------------------------------------------------------ */
/*  Veri sözleşmesi                                                    */
/* ------------------------------------------------------------------ */

interface Hours { open: string; close: string }

interface Office {
  city: string;
  role: string;
  address: string;
  phone: string;
  timezone: string;
  hours: Hours;
  workdays?: number[];
  tier?: string;
}

interface Labels {
  yourAxis: string;
  localTime: string;
  open: string;
  closesAt: string;
  opensAt: string;
  opensOn: string;
  hoursRange: string;
  now: string;
  hoverLocal: string;
  copy: string;
  copied: string;
  copyAria: string;
  callAria: string;
  bandAria: string;
  ticks: string[];
}

interface Data { eyebrow: string; lead?: string; labels: Labels; items: Office[] }

/* ------------------------------------------------------------------ */
/*  Zaman yardımcıları                                                 */
/* ------------------------------------------------------------------ */

const DAY = 1440;
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function tpl(s: string, vars: Record<string, string>) {
  return s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');
}

function parseHM(hm: string) {
  const [h, m] = hm.split(':').map((n) => Number(n) || 0);
  return h * 60 + m;
}

function fmtMin(min: number) {
  const m = ((min % DAY) + DAY) % DAY;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Ofisin saat dilimindeki saat/dakika ve hafta günü (0 = Pazar). */
function officeClock(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const hour = Number(get('hour')) % 24;
  const minute = Number(get('minute'));
  return { hour, minute, minutes: hour * 60 + minute, weekday: WEEKDAY_INDEX[get('weekday')] ?? now.getDay() };
}

function dayName(base: Date, daysAhead: number, timeZone: string) {
  return new Intl.DateTimeFormat('tr-TR', { timeZone, weekday: 'long' }).format(new Date(base.getTime() + daysAhead * 86_400_000));
}

/** Dakika başına hizalı canlı saat. */
function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const msToNextMinute = 60_000 - (Date.now() % 60_000) + 50;
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, msToNextMinute);
    return () => { clearTimeout(timeout); if (interval) clearInterval(interval); };
  }, []);
  return now;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------ */
/*  Canlı saat — React Bits Counter (dakika değişince hane kayar)      */
/* ------------------------------------------------------------------ */

/*
 * Erişilebilirlik: ARIA 1.2'de `time` rolü yazar adı (aria-label) almaz; erişilebilir ad
 * içerikten gelir. Bu yüzden etiket + saat görsel olarak gizli bir span ile içeriğe konur,
 * Counter haneleri aria-hidden kalır.
 */
function LiveClock({ hour, minute, reduced, label }: { hour: number; minute: number; reduced: boolean; label: string }) {
  const iso = fmtMin(hour * 60 + minute);
  if (reduced) {
    return (
      <time className="of-clock fe-num" dateTime={iso}>
        <span className="of-sr">{label} </span>
        {iso}
      </time>
    );
  }
  const digit = (value: number) => (
    <Counter
      value={value}
      places={[10, 1]}
      fontSize={28}
      gap={0}
      horizontalPadding={0}
      borderRadius={0}
      gradientHeight={0}
      textColor="var(--fe-ink)"
      fontWeight={500}
      counterStyle={{ fontFamily: 'var(--fe-mono)', letterSpacing: '-0.01em' }}
    />
  );
  return (
    <time className="of-clock fe-num" dateTime={iso}>
      <span className="of-sr">{label} {iso}</span>
      <span className="of-clock-digits" aria-hidden="true">
        {digit(hour)}
        <span className="of-clock-colon">:</span>
        {digit(minute)}
      </span>
    </time>
  );
}

/* ------------------------------------------------------------------ */
/*  24 saatlik bant — izleyicinin saat ekseni, ofisin mesai bloğu      */
/* ------------------------------------------------------------------ */

interface BandProps {
  office: Office;
  labels: Labels;
  viewerMinutes: number;
  diff: number;           // izleyici dakikası − ofis dakikası
  isOpen: boolean;
  reduced: boolean;
}

/** IBM Plex Mono ilerleme genişliği 0.6em; 16px'te bir karakter ≈ 9.6px. Etiket sığma tahmini için. */
const MONO_CH = 9.6;
const LABEL_GAP = 10;

function TimeBand({ office, labels, viewerMinutes, diff, isOpen, reduced }: BandProps) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const width = useElementWidth(svgRef);

  const openMin = parseHM(office.hours.open);
  const closeMin = parseHM(office.hours.close);
  const startV = (((openMin + diff) % DAY) + DAY) % DAY;
  const endV = (((closeMin + diff) % DAY) + DAY) % DAY;
  const wraps = endV <= startV;
  const pct = (m: number) => `${(m / DAY) * 100}%`;
  const nowPct = pct(viewerMinutes);

  const segments = wraps
    ? [{ x: startV, w: DAY - startV, label: true }, { x: 0, w: endV, label: false }]
    : [{ x: startV, w: endV - startV, label: true }];

  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width <= 0) return;
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setHover(Math.round(frac * DAY));
  };

  const hoverText = hover === null
    ? null
    : tpl(labels.hoverLocal, { viewer: fmtMin(hover), office: fmtMin(hover - diff), city: office.city });
  const topText = hoverText ?? `${labels.now} · ${fmtMin(viewerMinutes)}`;
  const anchorMin = hover ?? viewerMinutes;
  const bandAria = tpl(labels.bandAria, { city: office.city, open: fmtMin(startV), close: fmtMin(endV) });

  /*
   * Üst etiket geometrisi (yatay taşma yok): bant genişliği ölçülünce etiket piksel olarak
   * konumlanır — önce çizginin sağına, sığmazsa soluna, o da sığmazsa bant içine kenetlenir.
   * İlk ölçüm öncesi (width = 0) yüzde eşikleriyle start/middle/end seçilir.
   */
  let topX: number | string;
  let topAnchor: 'start' | 'middle' | 'end';
  if (width > 0) {
    const est = topText.length * MONO_CH;
    const cx = (anchorMin / DAY) * width;
    topAnchor = 'start';
    if (cx + LABEL_GAP + est <= width) topX = cx + LABEL_GAP;
    else if (cx - LABEL_GAP - est >= 0) topX = cx - LABEL_GAP - est;
    else topX = Math.max(0, Math.min(width - est, cx - est / 2));
  } else {
    const frac = anchorMin / DAY;
    topAnchor = frac < 0.3 ? 'start' : frac > 0.7 ? 'end' : 'middle';
    topX = pct(anchorMin);
  }

  const hoursText = tpl(labels.hoursRange, { open: office.hours.open, close: office.hours.close });
  const shiftLabelFits = (wMin: number) =>
    width > 0 ? (wMin / DAY) * width >= hoursText.length * MONO_CH + LABEL_GAP * 2 : wMin / DAY > 0.14;

  return (
    <svg
      ref={svgRef}
      className="of-band"
      width="100%"
      height="76"
      role="img"
      aria-label={bandAria}
      data-open={isOpen || undefined}
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
    >
      {/* eksen */}
      <line className="of-axis" x1="0" x2="100%" y1="48" y2="48" />
      {labels.ticks.map((t, i, arr) => {
        const x = `${(i / (arr.length - 1)) * 100}%`;
        const anchor = i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle';
        return (
          <g key={t}>
            <line className="of-tick" x1={x} x2={x} y1="45" y2="52" />
            <text className="of-tick-label" x={x} y="72" textAnchor={anchor}>{t}</text>
          </g>
        );
      })}

      {/* mesai bloğu */}
      {segments.map((s) => (
        <g key={`${s.x}-${s.w}`} className="of-shift">
          <rect x={pct(s.x)} y="26" width={pct(s.w)} height="20" className="of-shift-fill" />
          <line x1={pct(s.x)} x2={pct(s.x + s.w)} y1="27" y2="27" className="of-shift-edge" />
          {s.label && shiftLabelFits(s.w) && (
            <text className="of-shift-label" x={pct(s.x)} dx={LABEL_GAP} y="41">
              {hoursText}
            </text>
          )}
        </g>
      ))}

      {/* gezinti çizgisi */}
      {hover !== null && <line className="of-hover-line" x1={pct(hover)} x2={pct(hover)} y1="20" y2="52" />}

      {/* şimdi işareti */}
      <g className="of-now">
        <line x1={nowPct} x2={nowPct} y1="22" y2="52" className="of-now-line" />
        {!reduced && <circle cx={nowPct} cy="22" r="4" className="of-now-ring" />}
        <circle cx={nowPct} cy="22" r="4" className="of-now-dot" />
      </g>

      {/* üst etiket: şimdi / gezinti */}
      <text
        className="of-top-label"
        data-hover={hover !== null || undefined}
        x={topX}
        y="16"
        textAnchor={topAnchor}
      >
        {topText}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Satır                                                              */
/* ------------------------------------------------------------------ */

function OfficeRow({ office, labels, now, reduced }: { office: Office; labels: Labels; now: Date; reduced: boolean }) {
  const { props } = useTier(office.tier);
  const clock = useMemo(() => officeClock(now, office.timezone), [now, office.timezone]);
  const viewerMinutes = now.getHours() * 60 + now.getMinutes();

  let diff = viewerMinutes - clock.minutes;
  if (diff > DAY / 2) diff -= DAY;
  if (diff < -DAY / 2) diff += DAY;

  const openMin = parseHM(office.hours.open);
  const closeMin = parseHM(office.hours.close);
  const workdays = office.workdays ?? [1, 2, 3, 4, 5];
  const isWorkday = workdays.includes(clock.weekday);
  const isOpen = isWorkday && clock.minutes >= openMin && clock.minutes < closeMin;

  let status: string;
  if (isOpen) {
    status = tpl(labels.closesAt, { close: office.hours.close });
  } else if (isWorkday && clock.minutes < openMin) {
    status = tpl(labels.opensAt, { open: office.hours.open });
  } else {
    let ahead = 1;
    while (ahead < 8 && !workdays.includes((clock.weekday + ahead) % 7)) ahead += 1;
    status = tpl(labels.opensOn, { day: dayName(now, ahead, office.timezone), open: office.hours.open });
  }

  const telHref = `tel:${office.phone.replace(/[^\d+]/g, '')}`;

  return (
    <Box component="article" className="of-row fe-tier-block" {...props}>
      <div className="of-col-id">
        <div className="of-role-line">
          <TierDot tier={office.tier} />
          <span className="of-role">{office.role}</span>
        </div>
        <h3 className="of-city">{office.city}</h3>
        <div className="of-clock-line">
          <LiveClock hour={clock.hour} minute={clock.minute} reduced={reduced} label={labels.localTime} />
          <span className="of-status" data-open={isOpen || undefined}>
            <span className="of-status-dot" aria-hidden="true" />
            {status}
          </span>
        </div>
      </div>

      <div className="of-col-band">
        <TimeBand office={office} labels={labels} viewerMinutes={viewerMinutes} diff={diff} isOpen={isOpen} reduced={reduced} />
      </div>

      <div className="of-col-contact">
        <Text component="address" className="of-address">{office.address}</Text>
        <div className="of-phone-line">
          <a className="of-phone fe-num" href={telHref} aria-label={tpl(labels.callAria, { city: office.city })}>{office.phone}</a>
          <CopyButton value={office.phone} timeout={1600}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? labels.copied : labels.copy} withArrow>
                <ActionIcon
                  size="lg"
                  variant="subtle"
                  className="of-copy"
                  data-copied={copied || undefined}
                  onClick={copy}
                  aria-label={tpl(labels.copyAria, { city: office.city })}
                >
                  {copied ? <CheckIcon size={18} weight="bold" /> : <CopyIcon size={18} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </div>
      </div>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Bölüm                                                              */
/* ------------------------------------------------------------------ */

export function Offices({ doc }: RendererProps<Data>) {
  const now = useMinuteClock();
  const reduced = useReducedMotion();
  const { eyebrow, lead, labels, items } = doc.data;
  const viewerZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone ?? '', []);

  return (
    <Box component="section" className="of-section" aria-label={eyebrow}>
      <div className="of-head">
        <Eyebrow line>{eyebrow}</Eyebrow>
        <div className="of-head-meta">
          {lead && <p className="of-lead">{lead}</p>}
          <span className="of-axis-note">{labels.yourAxis}{viewerZone ? ` · ${viewerZone}` : ''}</span>
        </div>
      </div>
      <div className="of-list">
        {items.map((o, i) => (
          <Reveal key={o.city} delay={i * 0.06}>
            <OfficeRow office={o} labels={labels} now={now} reduced={reduced} />
          </Reveal>
        ))}
      </div>
    </Box>
  );
}
