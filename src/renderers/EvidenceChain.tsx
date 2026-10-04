import '../styles/evidence.css';
import { motion, useReducedMotion } from 'motion/react';
import { useMediaQuery } from '@mantine/hooks';
import { Box, Text } from '@mantine/core';
import { ArrowRightIcon } from '@phosphor-icons/react';
import TrueFocus from '../components/reactbits/TrueFocus';
import { useTier, type RendererProps } from '../engine/core';
import { Head } from './Trust';

/* ================= Kanıt zinciri: 8 halka, tek zincir =================
   Her düğüm bir isometric plaka (IsoStack dili) üstünde mint halka + numara.
   Aralarındaki bağlantı çizgileri motion ile soldan (dikeyde yukarıdan) çizilir.
   Düğümün tamamı bir bağlantıdır: tıklanınca kanıtın bulunduğu bölüme gider. */

interface ChainNode { label: string; text: string; href: string; tier?: string }
interface ChainData {
  eyebrow: string; title: string; description?: string;
  claim?: { phrases: string[]; separator?: string };
  nodes: ChainNode[];
  footnote?: string;
}

/* Plaka geometrisi (px, 1:1 çizilir — ölçeklenmez, böylece yazı 16px kalır) */
const A = 52;                       // rhombus yarı genişliği
const HH = A / Math.sqrt(3);        // yarı yükseklik (isometric oran)
const T = 10;                       // plaka kalınlığı
const CX = A;                       // merkez x
const CY = 38;                      // rhombus merkez y (yan köşelerin y'si)
const W = A * 2;                    // 104
const H = 84;
const RING = { cx: CX, cy: CY - 6, r: 19 };

function Plate() {
  const top = `${CX},${CY - HH} ${CX + A},${CY} ${CX},${CY + HH} ${CX - A},${CY}`;
  const left = `${CX - A},${CY} ${CX},${CY + HH} ${CX},${CY + HH + T} ${CX - A},${CY + T}`;
  const right = `${CX},${CY + HH} ${CX + A},${CY} ${CX + A},${CY + T} ${CX},${CY + HH + T}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="ec-svg" aria-hidden="true">
      <polygon points={left} className="ec-face-left" />
      <polygon points={right} className="ec-face-right" />
      <polygon points={top} className="ec-face-top" />
      <g className="ec-grid">
        {[0.33, 0.66].map((s) => (
          <g key={s}>
            <line x1={CX - A + s * A} y1={CY - s * HH} x2={CX + s * A} y2={CY + HH - s * HH} />
            <line x1={CX + s * A} y1={CY - HH + s * HH} x2={CX - A + s * A} y2={CY + s * HH} />
          </g>
        ))}
      </g>
      <g className="ec-ring">
        <circle cx={RING.cx} cy={RING.cy} r={RING.r} className="ec-ring-halo" />
        <circle cx={RING.cx} cy={RING.cy} r={RING.r} className="ec-ring-core" />
      </g>
    </svg>
  );
}

/** Düğümler arası bağlantı: gri iz + soldan çizilen mint çizgi (pathLength). */
function Connector({ i, vertical, reduce }: { i: number; vertical: boolean; reduce: boolean }) {
  const pos = vertical
    ? { x1: '50%', y1: '0%', x2: '50%', y2: '100%' }
    : { x1: '0%', y1: '50%', x2: '100%', y2: '50%' };
  return (
    <svg className="ec-conn" aria-hidden="true">
      <line {...pos} className="ec-conn-track" />
      <motion.line
        {...pos}
        className="ec-conn-draw"
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.55, delay: reduce ? 0 : 0.12 * i, ease: 'easeOut' }}
      />
    </svg>
  );
}

function Node({ n, i, last, vertical, reduce }: { n: ChainNode; i: number; last: boolean; vertical: boolean; reduce: boolean }) {
  const { props } = useTier(n.tier);
  const num = String(i + 1).padStart(2, '0');
  /* Aşama nokta/dim/tags öznitelikleri bağlantının kendisinde: `fe-tier-block` etiketler açıkken
     köşe noktasını çizer, böylece etiket satırında satır içi yer kaplayan hiçbir şey kalmaz. */
  return (
    <motion.li
      className="ec-node"
      initial={reduce ? false : { opacity: 0.35, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay: reduce ? 0 : 0.1 * i, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <a href={n.href} className="ec-link fe-tier-block" {...props} aria-label={`${num} ${n.label}: ${n.text}`}>
        <span className="ec-plate">
          <Plate />
          <span className="ec-num fe-num" aria-hidden="true" style={{ top: `${RING.cy}px` }}>{num}</span>
        </span>
        <span className="ec-body">
          <span className="ec-label">
            <span className="ec-label-text">{n.label}</span>
            <ArrowRightIcon size={14} weight="bold" className="ec-arrow" aria-hidden="true" />
          </span>
          <span className="ec-text">{n.text}</span>
        </span>
      </a>
      {!last && <Connector i={i} vertical={vertical} reduce={reduce} />}
    </motion.li>
  );
}

export function EvidenceChain({ doc }: RendererProps<ChainData>) {
  const d = doc.data;
  const reduce = useReducedMotion() ?? false;
  const vertical = useMediaQuery('(max-width: 62em)', false, { getInitialValueInEffect: false }) ?? false;
  const sep = d.claim?.separator ?? '|';

  return (
    <Box className="ec">
      <Head eyebrow={d.eyebrow} title={d.title} description={d.description} />

      {d.claim && d.claim.phrases.length > 0 && (
        <Box className="ec-claim" aria-label={d.claim.phrases.join(', ')}>
          {reduce ? (
            <div className="ec-claim-static">
              {d.claim.phrases.map((p) => <span key={p} className="ec-claim-word">{p}</span>)}
            </div>
          ) : (
            <TrueFocus
              sentence={d.claim.phrases.join(sep)}
              separator={sep}
              blurAmount={2.5}
              borderColor="var(--fe-accent)"
              glowColor="var(--fe-glow)"
              animationDuration={0.45}
              pauseBetweenAnimations={1.3}
            />
          )}
        </Box>
      )}

      <ol className="ec-chain" lang="tr" data-vertical={vertical || undefined} style={{ ['--ec-n' as string]: d.nodes.length }}>
        {d.nodes.map((n, i) => (
          <Node key={n.label} n={n} i={i} last={i === d.nodes.length - 1} vertical={vertical} reduce={reduce} />
        ))}
      </ol>

      {d.footnote && (
        <Text className="ec-footnote" fz={16} c="var(--fe-muted)" maw="72ch">{d.footnote}</Text>
      )}
    </Box>
  );
}
