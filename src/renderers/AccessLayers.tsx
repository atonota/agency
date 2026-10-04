import '../styles/access.css';
import { motion, useReducedMotion } from 'motion/react';
import { Anchor, Box, Text } from '@mantine/core';
import { ArrowRightIcon, EyeIcon, InfoIcon, LockKeyIcon } from '@phosphor-icons/react';
import DecryptedText from '../components/reactbits/DecryptedText';
import { useTier, type RendererProps } from '../engine/core';
import { TierDot } from '../ui/primitives';
import { Head } from './Trust';

/* ================= Erişim katmanları: Herkese açık ↔ Kontrollü erişim (NDA) =================
   Eşleştirilmiş satırlar: solda açık özet (göz, mint), ortada ince dikey çizgi, sağda NDA belgesi (kilit, mor).
   Sağ sütun etiketleri görünüme girerken React Bits DecryptedText ile "şifresi çözülür" — kontrollü erişimin
   görsel karşılığı. Satır hover'ında iki taraf ve ortadaki bağlantı noktası birlikte vurgulanır. */

type Side = 'public' | 'controlled';
interface Item { label: string; href?: string; tier?: string }
interface Layer { label: string; hint: string }
interface AccessData {
  eyebrow: string; title: string; description?: string;
  layers: Record<Side, Layer>;
  rows: Record<Side, Item>[];
  note?: string;
  request?: { label: string; href: string; tier?: string };
}

const SCRAMBLE = '▪▫·∙•#░▒';

function SideIcon({ side, size = 14 }: { side: Side; size?: number }) {
  return (
    <span className="al-ico" data-side={side} aria-hidden="true">
      {side === 'public' ? <EyeIcon size={size} weight="bold" /> : <LockKeyIcon size={size} weight="bold" />}
    </span>
  );
}

function Cell({ item, side, layer, reduce }: { item: Item; side: Side; layer: Layer; reduce: boolean }) {
  const { props } = useTier(item.tier);
  const label = side === 'controlled' && !reduce
    ? (
      <DecryptedText
        text={item.label}
        animateOn="view"
        sequential
        revealDirection="start"
        speed={26}
        characters={SCRAMBLE}
        parentClassName="al-dec"
        className="al-dec-ch"
        encryptedClassName="al-enc"
      />
    )
    : item.label;
  const inner = (
    <>
      <SideIcon side={side} />
      <span className="al-label"><TierDot tier={item.tier} />{label}</span>
    </>
  );
  const aria = `${layer.label}: ${item.label}`;
  return item.href
    ? <a href={item.href} className="al-item" data-side={side} aria-label={aria} {...props}>{inner}</a>
    : <span className="al-item" data-side={side} {...props}>{inner}</span>;
}

function LayerHead({ side, layer }: { side: Side; layer: Layer }) {
  return (
    <div className="al-head" data-side={side}>
      <span className="al-head-title">
        <SideIcon side={side} size={13} />
        <span className="fe-eyebrow al-head-eyebrow">{layer.label}</span>
      </span>
      <span className="al-head-hint">{layer.hint}</span>
    </div>
  );
}

export function AccessLayers({ doc }: RendererProps<AccessData>) {
  const d = doc.data;
  const reduce = useReducedMotion() ?? false;
  const req = useTier(d.request?.tier);

  return (
    <Box className="al">
      <Head eyebrow={d.eyebrow} title={d.title} description={d.description} />

      <div className="al-heads" aria-hidden="true">
        <LayerHead side="public" layer={d.layers.public} />
        <span className="al-mid-head" />
        <LayerHead side="controlled" layer={d.layers.controlled} />
      </div>

      <ul className="al-rows" aria-label={`${d.layers.public.label} ve ${d.layers.controlled.label}`}>
        {d.rows.map((r, i) => (
          <motion.li
            key={r.public.label}
            className="al-row"
            initial={reduce ? false : { opacity: 0.35, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.45, delay: reduce ? 0 : 0.06 * i, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Cell item={r.public} side="public" layer={d.layers.public} reduce={reduce} />
            <span className="al-mid" aria-hidden="true" />
            <Cell item={r.controlled} side="controlled" layer={d.layers.controlled} reduce={reduce} />
          </motion.li>
        ))}
      </ul>

      {(d.note || d.request) && (
        <div className="al-foot">
          {d.note && (
            <Text component="p" className="al-note" fz={16} c="var(--fe-muted)" m={0}>
              <InfoIcon size={16} weight="bold" className="al-note-ico" aria-hidden="true" />
              {d.note}
            </Text>
          )}
          {d.request && (
            <Anchor href={d.request.href} className="al-cta" underline="never" {...req.props}>
              <TierDot tier={d.request.tier} />
              <LockKeyIcon size={14} weight="bold" aria-hidden="true" />
              {d.request.label}
              <ArrowRightIcon size={14} weight="bold" className="al-cta-arrow" aria-hidden="true" />
            </Anchor>
          )}
        </div>
      )}
    </Box>
  );
}
