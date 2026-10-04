import '../styles/certifications.css';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { Box, Chip, Collapse } from '@mantine/core';
import { ArrowUpRightIcon, CaretDownIcon, WarningIcon } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'motion/react';
import type { EChartsCoreOption } from 'echarts/core';
import DecryptedText from '../components/reactbits/DecryptedText';
import { useEngine, useTier, type RendererProps, type TierKey } from '../engine/core';
import { Icon } from '../ui/Icon';
import { Eyebrow, MoreLink, TierDot } from '../ui/primitives';
import { PolarChart } from '../ui/cl/PolarChart';
import { useThemeVars } from '../ui/cl/useThemeVars';
import { expiryOf, todayIso, type Expiry } from '../ui/cl/expiry';

/* ------------------------------------------------------------------ */
/*  Veri modeli — raporun sertifika kaydı                                */
/* ------------------------------------------------------------------ */

type AssuranceType = 'certificate' | 'audit-report' | 'validation' | 'self-assessment' | 'conformance-report' | 'registration' | 'license' | 'device-approval';
type Visibility = 'public' | 'controlled';

interface Cert {
  code: string;
  edition?: string;
  description: string;
  category: string;
  kind: string;
  scope: string;
  note?: string;
  tier?: TierKey;
  legalEntity: string;
  assuranceType: AssuranceType;
  standard: string;
  productsInScope: string[];
  servicesInScope: string[];
  regionsInScope: string[];
  issuer: string;
  certificateId: string;
  issuedAt: string;
  expiresAt: string | null;
  verificationUrl: string;
  visibility: Visibility;
  owner: string;
  reviewedAt: string;
  publicLabel: string;
  example?: boolean;
}

interface DetailLabels {
  open: string; close: string;
  legalEntity: string; assuranceType: string; standard: string; products: string; services: string; regions: string;
  issuer: string; certificateId: string; issuedAt: string; expiresAt: string; verification: string; verificationLink: string;
  visibility: string; owner: string; reviewedAt: string; publicLabel: string; scope: string; note: string;
  noExpiry: string; expiring: string; expired: string; daysLeft: string; daysOver: string; example: string;
}
interface Labels {
  all: string; index: string; chart: string; ledger: string; records: string; certificate: string; nonCertificate: string; none: string;
  columns: { code: string; edition: string; kind: string; products: string };
  filters: { publicOnly: string };
  detail: DetailLabels;
  visibility: Record<Visibility, string>;
  assuranceTypes: Record<AssuranceType, string>;
}
interface Data {
  eyebrow: string;
  more?: { label: string; href: string; tier?: string };
  labels: Labels;
  expiryWarnDays?: number;
  productCodes: Record<string, string>;
  certificateKinds: string[];
  categoryIcons: Record<string, string>;
  items: Cert[];
}

type Counts = Record<string, Record<TierKey, number>>;
const TIER_KEYS: TierKey[] = ['z', 'o', 'e'];
const EASE = [0.2, 0.8, 0.2, 1] as const;
const pad2 = (n: number) => String(n).padStart(2, '0');

/* ------------------------------------------------------------------ */
/*  Ayrıntı alanı                                                       */
/* ------------------------------------------------------------------ */

const FIELD_VARIANTS = {
  hide: { opacity: 0, y: -6 },
  show: { opacity: 1, y: 0 },
};

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <motion.div className="cl-f" data-wide={wide || undefined} variants={FIELD_VARIANTS} transition={{ duration: 0.28, ease: EASE }}>
      <dt className="cl-f-k">{label}</dt>
      <dd className="cl-f-v">{children}</dd>
    </motion.div>
  );
}

function List({ items, none, accent }: { items: string[]; none: string; accent?: boolean }) {
  if (!items.length) return <span className="cl-none">{none}</span>;
  return (
    <>
      {items.map((p, i) => (
        <span key={p}>
          {i > 0 && <span className="cl-sep" aria-hidden="true"> · </span>}
          <span className={accent ? 'cl-prod' : undefined}>{p}</span>
        </span>
      ))}
    </>
  );
}

function ExpiryValue({ c, x, d }: { c: Cert; x: Expiry; d: DetailLabels }) {
  if (x.state === 'none' || !c.expiresAt) return <span className="cl-mono">{d.noExpiry}</span>;
  return (
    <span className="cl-exp" data-state={x.state}>
      <span className="cl-mono">{c.expiresAt}</span>
      {x.state !== 'ok' && (
        <span className="cl-exp-note">
          <WarningIcon size={18} weight="fill" aria-hidden="true" />
          {x.state === 'soon' ? `${x.days} ${d.daysLeft} · ${d.expiring}` : `${-x.days} ${d.daysOver} · ${d.expired}`}
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Defter satırı + açılır ayrıntı                                      */
/* ------------------------------------------------------------------ */

interface RowProps {
  c: Cert; i: number; isCert: boolean; labels: Labels; reduced: boolean;
  open: boolean; onToggle: () => void; today: string; warnDays: number; productCodes: Record<string, string>;
}

function LedgerRow({ c, i, isCert, labels, reduced, open, onToggle, today, warnDays, productCodes }: RowProps) {
  const { props } = useTier(c.tier);
  const detailId = useId();
  const hintId = useId();
  const d = labels.detail;
  const x = expiryOf(c.expiresAt, today, warnDays);
  const codes = c.productsInScope.map((p) => productCodes[p] ?? p);
  const expiryText = x.state === 'soon' ? d.expiring : x.state === 'over' ? d.expired : undefined;

  return (
    <motion.div
      className="cl-item"
      data-open={open || undefined}
      initial={reduced ? false : { opacity: 0.35, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: Math.min(i, 18) * 0.035, ease: EASE }}
    >
      {/* Aç/kapat ipucu: düğmenin adını ezmesin diye ayrı gizli span + aria-describedby. Durum aria-expanded'da. */}
      <span id={hintId} className="cl-sr">{open ? d.close : d.open}</span>
      <button
        type="button"
        className="cl-row fe-tier-block"
        {...props}
        data-cert={isCert || undefined}
        aria-expanded={open}
        aria-controls={detailId}
        aria-describedby={hintId}
        onClick={onToggle}
      >
        {/* Button çocukları presentational olduğundan role=img okunmaz; bilgi düz gizli metinle verilir, ikon aria-hidden. */}
        <span className="cl-ring" data-filled={isCert || undefined} aria-hidden="true" />
        <span className="cl-sr">{isCert ? labels.certificate : labels.nonCertificate}</span>
        <span className="cl-code">
          <span className="cl-code-line">
            {reduced ? c.code : (
              <>
                {/* React Bits kopyası visibility:hidden ile erişilebilirlik ağacından düşer; gerçek sr kopya burada. */}
                <span className="cl-sr">{c.code}</span>
                <span aria-hidden="true">
                  <DecryptedText text={c.code} animateOn="view" sequential speed={26} revealDirection="start" characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-" parentClassName="cl-code-anim" className="cl-code-ch" encryptedClassName="cl-code-enc" />
                </span>
              </>
            )}
            {expiryText && (
              <>
                <span className="cl-flag" data-state={x.state} title={expiryText} aria-hidden="true">
                  <WarningIcon size={18} weight="fill" />
                </span>
                <span className="cl-sr">{expiryText}</span>
              </>
            )}
          </span>
          <span className="cl-desc">{c.description}</span>
        </span>
        <span className="cl-tier"><TierDot tier={c.tier} /></span>
        <span className="cl-edition">{c.edition && <span className="cl-edition-tag">{c.edition}</span>}</span>
        <span className="cl-kind" data-other={!isCert || undefined}>{c.kind}</span>
        <span className="cl-products">
          {codes.length ? codes.map((k, n) => (
            <span key={k}>{n > 0 && <span className="cl-sep" aria-hidden="true"> · </span>}<span className="cl-pcode">{k}</span></span>
          )) : <span className="cl-none">{labels.none}</span>}
        </span>
        <span className="cl-caret" aria-hidden="true"><CaretDownIcon size={18} weight="bold" /></span>
      </button>

      <Collapse expanded={open} id={detailId} transitionDuration={reduced ? 0 : 260} transitionTimingFunction="cubic-bezier(.2,.8,.2,1)">
        <div className="cl-detail">
          <motion.dl
            className="cl-detail-grid"
            initial={false}
            animate={open ? 'show' : 'hide'}
            transition={reduced ? { duration: 0 } : { staggerChildren: 0.03, delayChildren: 0.06 }}
          >
            <Field label={d.legalEntity}>{c.legalEntity}</Field>
            <Field label={d.assuranceType}>{labels.assuranceTypes[c.assuranceType] ?? c.kind} <span className="cl-mono cl-dim">· {c.assuranceType}</span></Field>
            <Field label={d.standard} wide>{c.standard}</Field>
            <Field label={d.products}><List items={c.productsInScope} none={labels.none} accent /></Field>
            <Field label={d.services}><List items={c.servicesInScope} none={labels.none} /></Field>
            <Field label={d.regions}><List items={c.regionsInScope} none={labels.none} /></Field>
            <Field label={d.scope} wide>{c.scope}</Field>
            <Field label={d.issuer}>{c.issuer}</Field>
            <Field label={d.certificateId}><span className="cl-mono">{c.certificateId}</span></Field>
            <Field label={d.issuedAt}><span className="cl-mono">{c.issuedAt}</span></Field>
            <Field label={d.expiresAt}><ExpiryValue c={c} x={x} d={d} /></Field>
            <Field label={d.verification}>
              <a href={c.verificationUrl} className="fe-textlink cl-verify" tabIndex={open ? undefined : -1}>
                {d.verificationLink}
                <ArrowUpRightIcon size={16} weight="bold" aria-hidden="true" />
              </a>
            </Field>
            <Field label={d.visibility}><span className="cl-vis" data-vis={c.visibility}>{labels.visibility[c.visibility]}</span></Field>
            <Field label={d.owner}>{c.owner}</Field>
            <Field label={d.reviewedAt}><span className="cl-mono">{c.reviewedAt}</span></Field>
            <Field label={d.publicLabel} wide><q className="cl-quote" lang="en">{c.publicLabel}</q></Field>
            {c.note && <Field label={d.note} wide>{c.note}</Field>}
          </motion.dl>
          {c.example && <p className="cl-example">{d.example}</p>}
        </div>
      </Collapse>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Güvence defteri                                                     */
/* ------------------------------------------------------------------ */

export function Certifications({ doc }: RendererProps<Data>) {
  const { manifest } = useEngine();
  const v = useThemeVars();
  const reduced = !!useReducedMotion();
  const { items, categoryIcons, labels, certificateKinds, eyebrow, more, productCodes, expiryWarnDays = 90 } = doc.data;
  const [cat, setCat] = useState<string | null>(null); // null → Tümü
  const [hover, setHover] = useState<string | null>(null);
  const [publicOnly, setPublicOnly] = useState(false);
  const [openSet, setOpenSet] = useState<Set<string>>(() => new Set());
  const today = useMemo(todayIso, []);

  const tiers = manifest.tiers;
  const rankOf = (k?: TierKey) => tiers.find((t) => t.key === k)?.rank ?? 99;
  const certSet = useMemo(() => new Set(certificateKinds), [certificateKinds]);

  /* Görünürlük filtresi dizin, grafik ve defterin ortak tabanıdır. */
  const base = useMemo(() => (publicOnly ? items.filter((i) => i.visibility === 'public') : items), [items, publicOnly]);

  /* Kategori sırası: JSON'daki categoryIcons sırası, sonra kalanlar görünme sırasıyla. */
  const cats = useMemo(() => {
    const present = new Set(items.map((i) => i.category));
    const ordered = Object.keys(categoryIcons).filter((c) => present.has(c));
    for (const it of items) if (!ordered.includes(it.category)) ordered.push(it.category);
    return ordered;
  }, [items, categoryIcons]);

  const counts = useMemo<Counts>(() => {
    const acc: Counts = {};
    for (const c of cats) acc[c] = { z: 0, o: 0, e: 0 };
    for (const it of base) if (it.tier && acc[it.category]) acc[it.category][it.tier] += 1;
    return acc;
  }, [base, cats]);
  const totalOf = (c: string) => TIER_KEYS.reduce((s, k) => s + (counts[c]?.[k] ?? 0), 0);

  const shown = useMemo(
    () => base.filter((i) => !cat || i.category === cat).sort((a, b) => rankOf(a.tier) - rankOf(b.tier) || a.code.localeCompare(b.code, 'tr')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, cat, tiers],
  );

  const ready = !!v['--fe-ink'];
  const font = 'IBM Plex Sans';
  const mono = 'IBM Plex Mono';

  const option = useMemo<EChartsCoreOption>(() => {
    const tierColor = (k: TierKey) => v[`--fe-tier-${k}`] ?? '';
    const tierLabel = (k: TierKey) => tiers.find((t) => t.key === k)?.label ?? k;
    const active = (c: string) => !cat || c === cat;
    return {
      animationDuration: 700,
      animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'item',
        confine: true,
        backgroundColor: v['--fe-footer'],
        borderColor: v['--fe-line-strong'],
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: v['--fe-ink'], fontFamily: font, fontSize: 16 },
        extraCssText: 'border-radius: 6px; box-shadow: none;',
        formatter: (p: { name?: string }) => {
          const name = p.name ?? '';
          const rows = TIER_KEYS.filter((k) => (counts[name]?.[k] ?? 0) > 0)
            .map((k) => `<div style="display:flex;justify-content:space-between;gap:20px;font-size:16px"><span style="display:inline-flex;align-items:center;gap:8px"><i style="width:8px;height:8px;border-radius:50%;background:${tierColor(k)};display:inline-block"></i>${tierLabel(k)}</span><b style="font-family:${mono}">${counts[name][k]}</b></div>`)
            .join('');
          return `<div style="font-family:${mono};font-size:16px;letter-spacing:.04em;color:${v['--fe-muted']};margin-bottom:6px">${name} · ${totalOf(name)} ${labels.records}</div>${rows}`;
        },
      },
      polar: { center: ['50%', '50%'], radius: ['36%', '82%'] },
      angleAxis: {
        type: 'category',
        data: cats,
        startAngle: 90,
        /* Dilim numaraları (01–10) dizindeki numaralarla aynı: grafik tek başına okunur. */
        axisLabel: {
          show: true,
          margin: 12,
          fontSize: 16,
          fontFamily: mono,
          color: v['--fe-muted'],
          formatter: (_val: string, idx: number) => pad2(idx + 1),
        },
        axisTick: { show: false },
        axisLine: { show: true, lineStyle: { color: v['--fe-line-strong'] } },
        splitLine: { show: true, lineStyle: { color: v['--fe-line'] } },
      },
      radiusAxis: {
        type: 'value',
        min: 0,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: true, lineStyle: { color: v['--fe-line'], type: 'dashed' } },
      },
      series: TIER_KEYS.map((k) => ({
        type: 'bar',
        name: tierLabel(k),
        coordinateSystem: 'polar',
        stack: 'total',
        barCategoryGap: '36%',
        data: cats.map((c) => ({
          value: counts[c][k],
          itemStyle: { color: tierColor(k), opacity: active(c) ? 1 : 0.18, borderColor: v['--fe-footer'], borderWidth: 1 },
        })),
        emphasis: { focus: 'none', itemStyle: { opacity: 1, borderColor: v['--fe-ink'], borderWidth: 1.5 } },
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, cats, counts, cat, tiers, labels.records]);

  const focus = hover ?? cat;
  const centerName = focus ?? labels.all;
  const centerCount = focus ? totalOf(focus) : base.length;
  const toggle = (c: string) => setCat((cur) => (c === '' || cur === c ? null : c));
  const toggleOpen = (code: string) =>
    setOpenSet((cur) => {
      const next = new Set(cur);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });

  const rowProps = (c: string | null) => ({
    onMouseEnter: () => setHover(c),
    onMouseLeave: () => setHover(null),
    onFocus: () => setHover(c),
    onBlur: () => setHover(null),
  });

  return (
    <Box id="sertifika" className="cl">
      <div className="cl-head">
        <Eyebrow line>{eyebrow}</Eyebrow>
        <MoreLink more={more} />
      </div>

      <div className="cl-top">
        {/* 1 · Kategori dizini */}
        <nav className="cl-idx" aria-label={labels.index}>
          <button type="button" className="cl-idx-row" data-on={cat === null || undefined} onClick={() => setCat(null)} {...rowProps(null)}>
            <span className="cl-idx-icon" aria-hidden="true" />
            <span className="cl-idx-num" aria-hidden="true" />
            <span className="cl-idx-name">{labels.all}</span>
            <span className="cl-idx-count fe-num">{base.length}</span>
          </button>
          {cats.map((c, n) => (
            <button
              key={c}
              type="button"
              className="cl-idx-row"
              data-on={cat === c || undefined}
              data-hot={hover === c || undefined}
              aria-pressed={cat === c}
              onClick={() => toggle(c)}
              {...rowProps(c)}
            >
              <span className="cl-idx-icon" aria-hidden="true"><Icon name={categoryIcons[c]} size={18} weight="duotone" /></span>
              <span className="cl-idx-num">{pad2(n + 1)}</span>
              <span className="cl-idx-name">{c}</span>
              <span className="cl-idx-count fe-num">{totalOf(c)}</span>
            </button>
          ))}
        </nav>

        {/* 2 · Polar yığılmış bar */}
        <div className="cl-chart">
          {ready ? (
            <PolarChart option={option} height={400} categories={cats} seriesCount={TIER_KEYS.length} highlight={hover} onHover={setHover} onSelect={toggle} ariaLabel={labels.chart} />
          ) : (
            <div style={{ height: 400 }} />
          )}
          <div className="cl-chart-center" aria-hidden="true">
            <div className="cl-chart-center-n">{centerCount}</div>
            <div className="cl-chart-center-name">{centerName}</div>
          </div>
          <div className="cl-legend" aria-label={labels.chart}>
            {tiers.map((t) => (
              <span key={t.key} className="cl-legend-item"><span className="fe-legend-dot" data-tier={t.key} />{t.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 3 · Defter */}
      <section className="cl-ledger" aria-label={labels.ledger}>
        <div className="cl-ledger-head">
          <span className="fe-eyebrow">{labels.ledger}</span>
          <span className="cl-ledger-sel">{cat ?? labels.all}</span>
          <Chip className="cl-chip" size="md" variant="outline" checked={publicOnly} onChange={setPublicOnly}>
            {labels.filters.publicOnly}
          </Chip>
          <span className="cl-ledger-n fe-num">{shown.length} {labels.records}</span>
        </div>
        <div className="cl-cols" aria-hidden="true">
          <span />
          <span className="cl-col">{labels.columns.code}</span>
          <span />
          <span className="cl-col">{labels.columns.edition}</span>
          <span className="cl-col">{labels.columns.kind}</span>
          <span className="cl-col">{labels.columns.products}</span>
          <span />
        </div>
        <div className="cl-rows" key={`${cat ?? '*'}|${publicOnly ? 'p' : 'a'}`}>
          {shown.map((c, i) => (
            <LedgerRow
              key={c.code}
              c={c}
              i={i}
              isCert={certSet.has(c.kind)}
              labels={labels}
              reduced={reduced}
              open={openSet.has(c.code)}
              onToggle={() => toggleOpen(c.code)}
              today={today}
              warnDays={expiryWarnDays}
              productCodes={productCodes}
            />
          ))}
        </div>
      </section>
    </Box>
  );
}
