import { useReducedMotion } from '@mantine/hooks';
import { ArrowRightIcon } from '@phosphor-icons/react';
import TrueFocus from '../components/reactbits/TrueFocus';
import { useTier, type RendererProps } from '../engine/core';
import '../styles/trust-line.css';

interface Cert { label: string; aria?: string; href: string; tier?: string }
interface Link { label: string; aria?: string; href: string; tier?: string }
interface Data { aria?: string; certs: Cert[]; status?: Link; trust?: Link }

const NBSP = ' ';
/** TrueFocus kelimeleri boşlukla böler; her ifadeyi tek "kelime" yapmak için iç boşluklar NBSP olur. */
const glue = (s: string) => s.trim().replace(/\s+/g, NBSP);

/** Görünmez ama odaklanabilir bağlantı katmanı — TrueFocus görselinin üstünde, aynı metrikle. */
function CertLink({ c, visible }: { c: Cert; visible: boolean }) {
  const { props } = useTier(c.tier);
  return (
    <li {...props}>
      <a href={c.href} className="lb-trust-link" aria-label={c.aria ?? c.label} data-visible={visible || undefined}>
        {glue(c.label)}
      </a>
    </li>
  );
}

function StatusLink({ l }: { l: Link }) {
  const { props } = useTier(l.tier);
  return (
    <a href={l.href} className="lb-trust-status" aria-label={l.aria ?? l.label} {...props}>
      <span className="fe-pulse" aria-hidden="true" />
      <span>{l.label}</span>
    </a>
  );
}

function TrustLink({ l }: { l: Link }) {
  const { props } = useTier(l.tier);
  return (
    <a href={l.href} className="fe-textlink lb-trust-more" {...props}>
      {l.label}
      <ArrowRightIcon size={16} weight="bold" className="lb-trust-arrow" aria-hidden="true" />
    </a>
  );
}

export function TrustLine({ doc }: RendererProps<Data>) {
  const { aria, certs, status, trust } = doc.data;
  const reduced = useReducedMotion();
  const sentence = certs.map((c) => glue(c.label)).join(' ');

  return (
    <nav className="lb-trust" aria-label={aria}>
      <div className="lb-trust-focus" data-static={reduced || undefined}>
        {!reduced && (
          <div className="lb-trust-visual" aria-hidden="true">
            {/* blurAmount 0: sertifika metni her an okunur kalır; vurguyu gezen odak çerçevesi + aktif kelime rengi taşır. */}
            <TrueFocus
              sentence={sentence}
              separator=" "
              blurAmount={0}
              borderColor="var(--fe-accent)"
              glowColor="var(--fe-glow)"
              animationDuration={0.55}
              pauseBetweenAnimations={1.7}
            />
          </div>
        )}
        <ul className="lb-trust-layer">
          {certs.map((c) => <CertLink key={c.label} c={c} visible={!!reduced} />)}
        </ul>
      </div>

      {(status || trust) && <span className="lb-trust-rule" aria-hidden="true" />}
      {status && <StatusLink l={status} />}
      {trust && <TrustLink l={trust} />}
    </nav>
  );
}
