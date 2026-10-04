import { useState } from 'react';
import { ActionIcon, Box, Collapse, CopyButton, Tooltip, UnstyledButton } from '@mantine/core';
import { CaretDownIcon, CheckIcon, CopyIcon, IdentificationCardIcon } from '@phosphor-icons/react';
import DecryptedText from '../components/reactbits/DecryptedText';
import { useTier, type RendererProps } from '../engine/core';
import { TierDot } from '../ui/primitives';
import '../styles/registry.css';

interface Field { label: string; value: string; pinned?: boolean; decrypt?: boolean; copy?: boolean }

interface Labels { showAll: string; showLess: string; pinnedNote?: string; copy: string; copied: string; copyAria: string }

interface Data { title: string; tier?: string; labels: Labels; fields: Field[] }

function tpl(s: string, vars: Record<string, string>) {
  return s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function FieldValue({ field, reduced }: { field: Field; reduced: boolean }) {
  if (field.decrypt && !reduced) {
    // DecryptedText'in kendi sr-only span'ı visibility:hidden taşıdığı için erişilebilirlik
    // ağacına düşmez; değeri görsel olarak gizli bir kardeşle veriyor, animasyonu gizliyoruz.
    return (
      <>
        <span className="of-reg-sr">{field.value}</span>
        <DecryptedText
          text={field.value}
          animateOn="view"
          sequential
          speed={45}
          revealDirection="start"
          characters="0123456789"
          className="of-reg-val-char"
          encryptedClassName="of-reg-val-enc"
          parentClassName="of-reg-val-decrypt"
          aria-hidden="true"
        />
      </>
    );
  }
  return <>{field.value}</>;
}

function FieldItem({ field, labels, reduced }: { field: Field; labels: Labels; reduced: boolean }) {
  return (
    <div className="of-reg-field" data-pinned={field.pinned || undefined}>
      <dt className="of-reg-label">{field.label}</dt>
      <dd className="of-reg-value fe-num" data-copy={field.copy || undefined}>
        <span className="of-reg-val"><FieldValue field={field} reduced={reduced} /></span>
        {field.copy && (
          <CopyButton value={field.value} timeout={1600}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? labels.copied : labels.copy} withArrow>
                <ActionIcon
                  size="lg"
                  variant="subtle"
                  className="of-reg-copy"
                  data-copied={copied || undefined}
                  onClick={copy}
                  aria-label={tpl(labels.copyAria, { label: field.label })}
                >
                  {copied ? <CheckIcon size={18} weight="bold" /> : <CopyIcon size={18} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        )}
      </dd>
    </div>
  );
}

export function Registry({ doc }: RendererProps<Data>) {
  const { props } = useTier(doc.data.tier);
  const [open, setOpen] = useState(false);
  const reduced = prefersReducedMotion();
  const { title, labels, fields } = doc.data;

  const pinned = fields.filter((f) => f.pinned);
  const rest = fields.filter((f) => !f.pinned);
  const bodyId = `${doc.id}-more`;

  return (
    <Box component="section" className="of-reg fe-tier-block" aria-labelledby={`${doc.id}-title`} {...props}>
      <div className="of-reg-head">
        <div className="of-reg-title-line">
          <TierDot tier={doc.data.tier} />
          <IdentificationCardIcon size={22} weight="duotone" className="of-reg-icon" aria-hidden="true" />
          <h2 id={`${doc.id}-title`} className="of-reg-title">{title}</h2>
        </div>
        {rest.length > 0 && (
          <UnstyledButton
            className="of-reg-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={bodyId}
          >
            <span>{open ? labels.showLess : labels.showAll}</span>
            <CaretDownIcon size={16} weight="bold" className="of-reg-caret" data-open={open || undefined} aria-hidden="true" />
          </UnstyledButton>
        )}
      </div>

      <dl className="of-reg-grid">
        {pinned.map((f) => <FieldItem key={f.label} field={f} labels={labels} reduced={reduced} />)}
      </dl>

      {rest.length > 0 && (
        <Collapse expanded={open} id={bodyId} transitionDuration={reduced ? 0 : 240}>
          <dl className="of-reg-grid of-reg-grid-more">
            {rest.map((f) => <FieldItem key={f.label} field={f} labels={labels} reduced={reduced} />)}
          </dl>
        </Collapse>
      )}

      {labels.pinnedNote && <p className="of-reg-note">{labels.pinnedNote}</p>}
    </Box>
  );
}
