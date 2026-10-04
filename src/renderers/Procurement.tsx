import '../styles/procurement.css';
import { useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import {
  Box, Button, Checkbox, Group, MultiSelect, SegmentedControl, Select, Stack, Text, TextInput, Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  ArrowCounterClockwiseIcon, ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, CheckIcon, LockKeyIcon, MinusIcon, PaperPlaneTiltIcon,
} from '@phosphor-icons/react';
import Stepper, { Step } from '../components/reactbits/Stepper';
import { useTier, type RendererProps } from '../engine/core';
import { TierDot } from '../ui/primitives';
import { Head } from './Trust';

/* ================= Satın alma: 4 adımlı talep sihirbazı ================= */

type Access = 'public' | 'nda';
interface DocItem { id: string; label: string; access: Access; reviewedAt?: string; tier?: string }
/** `note` dolu ve `docs` kapalıysa 3. adım (Paylaşım) atlanır; not, adımda ve özette gösterilir. */
interface ReqType { value: string; label: string; nda: boolean; docs: boolean; note?: string }

interface ProcData {
  eyebrow: string; title: string; description?: string;
  steps: { title: string; text: string }[];
  access: Record<Access, string>;
  ledger: { title: string; publicWord: string; ndaWord: string; reviewedWord: string; hint: string; locked: string; inRequest: string };
  documents: DocItem[];
  form: {
    typeLabel: string; types: ReqType[];
    emailLabel: string; emailPlaceholder: string;
    productsLabel: string; productsPlaceholder: string; products: string[];
    /** KVKK — bağlama özel aydınlatma satırı (veri toplama noktasında) */
    kvkk: { text: string; controllerLabel: string; controller: string; linkLabel: string; href: string };
    /** Hizmeti işleten tüzel kişi — özette gösterilir */
    operator: string;
    nda: { title: string; required: string; optional: string; summary: string[]; accept: string; accepted: string; notAccepted: string };
    documentsLabel: string; documentsHint: string; skippedLabel: string;
    slotLabel: string; slotPlaceholder: string; slots: string[];
    summaryTitle: string; summary: { type: string; operator: string; email: string; products: string; nda: string; documents: string; slot: string };
    empty: string; back: string; next: string; submit: string; reset: string;
    messages: { email: string; products: string; ndaRequired: string; documents: string; slot: string };
    success: { title: string; text: string };
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const LINE = { input: 'pr-input', label: 'pr-label', wrapper: 'pr-wrap' } as const;
const PICKER = { ...LINE, dropdown: 'pr-dropdown', option: 'pr-option' } as const;
const SEG = { indicator: 'pr-seg-ind', label: 'pr-seg-label' } as const;
const CHECK = { input: 'pr-check-input', label: 'pr-check-label' } as const;

/** ISO gün → gg.aa.yyyy (tr-TR). Saat dilimi kayması olmasın diye öğlen saati kullanılır. */
function formatDay(iso?: string): string {
  if (!iso) return '';
  const d = new Date(ISO_DAY.test(iso) ? `${iso}T12:00:00` : iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* ---------- Erişim etiketi: Açık = metin, NDA = kilit + metin ---------- */
function AccessTag({ access, labels }: { access: Access; labels: Record<Access, string> }) {
  return (
    <span className="pr-tag" data-access={access}>
      {access === 'nda' && <LockKeyIcon size={14} weight="bold" aria-hidden="true" />}
      {labels[access]}
    </span>
  );
}

/* ---------- Sol sütun: Belgeler defteri satırı (tıklayınca talebe ekler) ----------
   locked  = NDA kabulü olmadan alınamaz (ipucu gösterilir)
   disabled = talep gönderildi; defter salt okunur (ipucu yok, seçim durumu korunur) */
function LedgerRow({ x, labels, ledger, selected, locked, disabled, onToggle }: {
  x: DocItem; labels: Record<Access, string>; ledger: ProcData['ledger']; selected: boolean; locked: boolean; disabled: boolean; onToggle: () => void;
}) {
  const { props } = useTier(x.tier);
  const inert = locked || disabled;
  const reviewed = formatDay(x.reviewedAt);
  const row = (
    <button
      type="button"
      className="pr-row"
      aria-pressed={selected}
      aria-disabled={inert || undefined}
      data-locked={(locked && !disabled) || undefined}
      data-disabled={disabled || undefined}
      onClick={inert ? undefined : onToggle}
      {...props}
    >
      <span className="pr-mark" aria-hidden="true">{selected && <CheckIcon size={12} weight="bold" />}</span>
      <span className="pr-row-name"><TierDot tier={x.tier} />{x.label}</span>
      {/* Tarih ayrı ızgara öğesi: geniş ekranda satır içi, ≤84em'de adın altına (2. satır) iner */}
      {reviewed && (
        <span className="pr-row-date">
          <span className="pr-row-date-word">{ledger.reviewedWord}</span> <time dateTime={x.reviewedAt}>{reviewed}</time>
        </span>
      )}
      <span className="pr-row-meta">
        {selected && <span className="pr-row-state">{ledger.inRequest}</span>}
        <AccessTag access={x.access} labels={labels} />
      </span>
    </button>
  );
  return locked && !disabled ? <Tooltip label={ledger.locked} withArrow openDelay={120}>{row}</Tooltip> : row;
}

/* ---------- 3. adım: belge seçim satırı ---------- */
function PickRow({ x, labels, checked, disabled, onChange }: {
  x: DocItem; labels: Record<Access, string>; checked: boolean; disabled: boolean; onChange: (v: boolean) => void;
}) {
  const { props } = useTier(x.tier);
  return (
    <label className="pr-pick-row" data-disabled={disabled || undefined} data-checked={checked || undefined} {...props}>
      <Checkbox size="md" classNames={CHECK} checked={checked} disabled={disabled} onChange={(e) => onChange(e.currentTarget.checked)} aria-label={x.label} className="pr-check" />
      <span className="pr-row-name"><TierDot tier={x.tier} />{x.label}</span>
      <AccessTag access={x.access} labels={labels} />
    </label>
  );
}

export function Procurement({ doc }: RendererProps<ProcData>) {
  const d = doc.data;
  const f = d.form;
  const total = d.steps.length;
  const narrow = useMediaQuery('(max-width: 48em)', false);

  /* Akış durumu */
  const [runKey, setRunKey] = useState(0);
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navRef = useRef<((s: number) => void) | null>(null);

  /* Form durumu — adımlar arasında korunur */
  const [type, setType] = useState(f.types[0]?.value ?? '');
  const [email, setEmail] = useState('');
  const [products, setProducts] = useState<string[]>([]);
  const [nda, setNda] = useState(false);
  const [docs, setDocs] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);

  const reqType = f.types.find((t) => t.value === type) ?? f.types[0];
  /* Demo gibi belge gerektirmeyen türlerde 3. adım atlanır */
  const skipDocs = !reqType.docs && !!reqType.note;
  const byId = useMemo(() => Object.fromEntries(d.documents.map((x) => [x.id, x])), [d.documents]);
  const publicCount = d.documents.filter((x) => x.access === 'public').length;
  const ndaCount = d.documents.length - publicCount;

  const isLocked = (x: DocItem) => x.access === 'nda' && !nda;
  const toggleDoc = (id: string) => setDocs((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));
  const setDoc = (id: string, on: boolean) => setDocs((prev) => (on ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((k) => k !== id)));
  const toggleNda = (on: boolean) => {
    setNda(on);
    if (!on) setDocs((prev) => prev.filter((id) => byId[id]?.access !== 'nda'));
    if (on && error === f.messages.ndaRequired) setError(null);
  };

  /* Doğrulama — mesajlar JSON'dan */
  const validate = (s: number): string | null => {
    if (s === 1) {
      if (!EMAIL.test(email)) return f.messages.email;
      if (products.length === 0) return f.messages.products;
    }
    if (s === 2 && reqType.nda && !nda) return f.messages.ndaRequired;
    if (s === 3 && reqType.docs && docs.length === 0) return f.messages.documents;
    if (s === 4 && !slot) return f.messages.slot;
    return null;
  };

  /* İleri giderken aradaki her adım doğrulanır; hata varsa o adımda durur */
  const go = (target: number) => {
    if (target > step) {
      for (let s = step; s < target; s++) {
        const err = validate(s);
        if (err) {
          setError(err);
          if (s !== step) navRef.current?.(s);
          return;
        }
      }
    }
    setError(null);
    navRef.current?.(target);
  };
  const nextOf = (s: number) => (skipDocs && s === 2 ? 4 : s + 1);
  const prevOf = (s: number) => (skipDocs && s === 4 ? 2 : s - 1);

  const reset = () => {
    setRunKey((k) => k + 1);
    setStep(1); setSent(false); setError(null);
    setType(f.types[0]?.value ?? ''); setEmail(''); setProducts([]); setNda(false); setDocs([]); setSlot(null);
  };

  const selectedLabels = docs.map((id) => byId[id]?.label).filter(Boolean);
  const documentsValue = selectedLabels.length ? selectedLabels.join(' · ') : skipDocs ? reqType.note ?? f.empty : f.empty;
  const summaryRows: [string, string][] = [
    [f.summary.type, reqType.label],
    [f.summary.operator, f.operator],
    [f.summary.email, email || f.empty],
    [f.summary.products, products.length ? products.join(', ') : f.empty],
    [f.summary.nda, nda ? f.nda.accepted : f.nda.notAccepted],
    [f.summary.documents, documentsValue],
    [f.summary.slot, slot ?? f.empty],
  ];

  return (
    <Box className="pr">
      <Head eyebrow={d.eyebrow} title={d.title} description={d.description} />

      <Box className="pr-layout">
        {/* ---------- Sol: Belgeler defteri ---------- */}
        <Box className="pr-ledger" component="section" aria-label={d.ledger.title}>
          <Group justify="space-between" align="baseline" wrap="nowrap" className="pr-ledger-head">
            <Text className="fe-eyebrow">{d.ledger.title}</Text>
            <Text fz={16} c="var(--fe-muted)" className="fe-num pr-ledger-count">
              {publicCount} {d.ledger.publicWord} · {ndaCount} {d.ledger.ndaWord}
            </Text>
          </Group>
          <Box className="pr-rows">
            {d.documents.map((x) => (
              <LedgerRow
                key={x.id} x={x} labels={d.access} ledger={d.ledger}
                selected={docs.includes(x.id)} locked={isLocked(x)} disabled={sent} onToggle={() => toggleDoc(x.id)}
              />
            ))}
          </Box>
          <Text fz={16} c="var(--fe-muted)" mt={14} className="pr-ledger-hint">{d.ledger.hint}</Text>
        </Box>

        {/* ---------- Sağ: React Bits Stepper ile talep sihirbazı ---------- */}
        <Box className="pr-wizard" data-sent={sent || undefined} component="section" aria-label={d.title}>
          <MotionConfig reducedMotion="user">
            <Stepper
              key={runKey}
              initialStep={1}
              onStepChange={(s) => setStep(s)}
              onFinalStepCompleted={() => setSent(true)}
              renderStepIndicator={({ step: n, currentStep, onStepClick }) => {
                navRef.current = onStepClick;
                const skipped = skipDocs && n === 3 && currentStep !== 3;
                const state = skipped ? 'skipped' : currentStep > n ? 'complete' : currentStep === n ? 'active' : 'inactive';
                const s = d.steps[n - 1];
                return (
                  <button
                    type="button"
                    className="pr-step"
                    data-state={state}
                    aria-current={state === 'active' ? 'step' : undefined}
                    aria-label={skipped ? `${n}. ${s.title} — ${f.skippedLabel}` : `${n}. ${s.title}`}
                    disabled={sent}
                    onClick={() => go(n)}
                  >
                    <span className="pr-step-circle" aria-hidden="true">
                      {state === 'complete' ? <CheckIcon size={15} weight="bold" />
                        : state === 'skipped' ? <MinusIcon size={15} weight="bold" />
                        : <span className="pr-step-num">{n}</span>}
                    </span>
                    <span className="pr-step-label">
                      <span className="pr-step-title">{s.title}</span>
                      <span className="pr-step-hint">{skipped ? f.skippedLabel : s.text}</span>
                    </span>
                  </button>
                );
              }}
            >
              {/* 1 · Talep */}
              <Step>
                <Stack gap={24} className="pr-fields">
                  <Box role="group" aria-label={f.typeLabel}>
                    <Text component="span" className="pr-label pr-label-block">{f.typeLabel}</Text>
                    <SegmentedControl
                      fullWidth size="md" radius="xl" className="pr-seg" classNames={SEG}
                      orientation={narrow ? 'vertical' : 'horizontal'}
                      value={type} onChange={setType}
                      data={f.types.map((t) => ({ value: t.value, label: t.label }))}
                    />
                  </Box>
                  <TextInput
                    variant="unstyled" classNames={LINE} className="pr-line-input"
                    label={f.emailLabel} placeholder={f.emailPlaceholder}
                    type="email" autoComplete="email" inputMode="email"
                    value={email} onChange={(e) => setEmail(e.currentTarget.value)}
                    error={error === f.messages.email ? true : undefined}
                  />
                  <MultiSelect
                    variant="unstyled" classNames={{ ...PICKER, pill: 'pr-pill' }} className="pr-line-input"
                    label={f.productsLabel} placeholder={products.length ? undefined : f.productsPlaceholder}
                    data={f.products} value={products} onChange={setProducts}
                    hidePickedOptions comboboxProps={{ offset: 6 }}
                    error={error === f.messages.products ? true : undefined}
                  />
                  {/* KVKK — veri toplama noktasında bağlama özel aydınlatma */}
                  <Text component="p" className="pr-kvkk">
                    {f.kvkk.text} {f.kvkk.controllerLabel} <span className="pr-kvkk-controller">{f.kvkk.controller}</span>
                    <span className="pr-kvkk-sep" aria-hidden="true"> · </span>
                    <a href={f.kvkk.href} className="pr-kvkk-link">
                      {f.kvkk.linkLabel}
                      <ArrowRightIcon size={14} weight="bold" className="pr-kvkk-arrow" aria-hidden="true" />
                    </a>
                  </Text>
                </Stack>
              </Step>

              {/* 2 · NDA */}
              <Step>
                <Box className="pr-nda">
                  <Text component="span" className="pr-label pr-label-block">{f.nda.title}</Text>
                  <Text fz={16} className="pr-nda-req" data-required={reqType.nda || undefined}>
                    {reqType.nda ? f.nda.required : f.nda.optional}
                  </Text>
                  <ol className="pr-nda-list">
                    {f.nda.summary.map((s, i) => (
                      <li key={s}><span className="pr-nda-n">{String(i + 1).padStart(2, '0')}</span><span>{s}</span></li>
                    ))}
                  </ol>
                  <Checkbox
                    size="md" className="pr-check pr-nda-accept" classNames={CHECK}
                    checked={nda} onChange={(e) => toggleNda(e.currentTarget.checked)}
                    label={f.nda.accept}
                    error={error === f.messages.ndaRequired ? true : undefined}
                  />
                </Box>
              </Step>

              {/* 3 · Paylaşım (demo: atlanır, not gösterilir) */}
              <Step>
                {skipDocs ? (
                  <Box className="pr-note" role="note">
                    <Group justify="space-between" align="baseline" wrap="nowrap">
                      <Text component="span" className="pr-label">{f.documentsLabel}</Text>
                      <Text fz={16} className="pr-note-tag">{f.skippedLabel}</Text>
                    </Group>
                    <Text fz={17} lh={1.55} c="var(--fe-ink-2)" className="pr-note-text">{reqType.note}</Text>
                    {selectedLabels.length > 0 && (
                      <Text fz={16} c="var(--fe-muted)" mt={10} className="pr-note-docs">{selectedLabels.join(' · ')}</Text>
                    )}
                  </Box>
                ) : (
                  <Box role="group" aria-label={f.documentsLabel}>
                    <Group justify="space-between" align="baseline" wrap="nowrap">
                      <Text component="span" className="pr-label">{f.documentsLabel}</Text>
                      <Text fz={16} c="var(--fe-muted)" className="fe-num">{docs.length} / {d.documents.length}</Text>
                    </Group>
                    {!nda && <Text fz={16} c="var(--fe-muted)" mt={2}>{f.documentsHint}</Text>}
                    <Box className="pr-pick" mt={8}>
                      {d.documents.map((x) => (
                        <PickRow key={x.id} x={x} labels={d.access} checked={docs.includes(x.id)} disabled={isLocked(x)} onChange={(v) => setDoc(x.id, v)} />
                      ))}
                    </Box>
                  </Box>
                )}
              </Step>

              {/* 4 · Soru-cevap */}
              <Step>
                <Stack gap={26}>
                  <Select
                    variant="unstyled" classNames={PICKER} className="pr-line-input"
                    label={f.slotLabel} placeholder={f.slotPlaceholder}
                    data={f.slots} value={slot} onChange={setSlot}
                    allowDeselect={false} comboboxProps={{ offset: 6 }}
                    error={error === f.messages.slot ? true : undefined}
                  />
                  <Box>
                    <Text component="span" className="pr-label pr-label-block">{f.summaryTitle}</Text>
                    <dl className="pr-summary">
                      {summaryRows.map(([k, v]) => (
                        <div key={k} className="pr-sum-row" data-empty={v === f.empty || undefined}>
                          <dt>{k}</dt><dd>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </Box>
                </Stack>
              </Step>
            </Stepper>
          </MotionConfig>

          {/* Gezinme — Stepper'ın kendi düğmeleri gizli; Mantine Button */}
          {!sent ? (
            <Box className="pr-nav">
              <Box className="pr-nav-left">
                {step > 1 && (
                  <Button variant="subtle" radius="xl" size="md" leftSection={<ArrowLeftIcon size={16} weight="bold" />} onClick={() => go(prevOf(step))}>
                    {f.back}
                  </Button>
                )}
              </Box>
              <Text fz={16} className="pr-error" role="alert" aria-live="assertive">{error ?? ''}</Text>
              <Button
                radius="xl" size="md" className="fe-btn-glow"
                rightSection={step === total ? <PaperPlaneTiltIcon size={16} weight="bold" /> : <ArrowRightIcon size={16} weight="bold" />}
                onClick={() => go(nextOf(step))}
              >
                {step === total ? f.submit : f.next}
              </Button>
            </Box>
          ) : (
            <Box className="pr-success" role="status" aria-live="polite">
              <CheckCircleIcon size={44} weight="duotone" className="pr-success-icon" />
              <Box className="pr-success-body">
                <Text fz={22} fw={600} lts="-0.01em" c="var(--fe-ink)">{f.success.title}</Text>
                <Text fz={16} c="var(--fe-ink-2)" mt={4} lh={1.55}>{f.success.text}</Text>
                <Text fz={16} c="var(--fe-muted)" mt={12} ff="monospace" className="pr-success-meta">
                  {reqType.label} · {products.join(', ')} · {selectedLabels.length} {d.ledger.title.toLocaleLowerCase('tr')} · {slot}
                </Text>
              </Box>
              <Button variant="subtle" radius="xl" size="md" leftSection={<ArrowCounterClockwiseIcon size={16} weight="bold" />} onClick={reset}>
                {f.reset}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
