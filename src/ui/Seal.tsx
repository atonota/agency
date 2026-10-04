import { useId } from 'react';
import DecryptedText from '../components/reactbits/DecryptedText';

/** Dairesel sertifika mührü: dış halkada kategori ve belge türü, merkezde kod (hover'da çözülerek yazılır). */
export function Seal({ code, edition, ring, size = 124 }: { code: string; edition?: string; ring: string; size?: number }) {
  const id = useId().replace(/:/g, '');
  const r = size / 2 - 12;
  const c = size / 2;
  const lines = code.length > 12 ? splitCode(code) : [code];
  return (
    <div className="fe-seal" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <defs>
          <path id={`p${id}`} d={`M ${c},${c} m -${r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0`} />
        </defs>
        <circle cx={c} cy={c} r={c - 2} className="fe-seal-outer" />
        <circle cx={c} cy={c} r={r - 8} className="fe-seal-inner" />
        <g className="fe-seal-ring">
          <text className="fe-seal-ringtext">
            <textPath href={`#p${id}`} startOffset="0" textLength={2 * Math.PI * r - 6} lengthAdjust="spacing">{ring}</textPath>
          </text>
        </g>
        {Array.from({ length: 24 }, (_, i) => {
          const ang = (i / 24) * Math.PI * 2;
          return <circle key={i} cx={c + Math.cos(ang) * (c - 6)} cy={c + Math.sin(ang) * (c - 6)} r={0.9} className="fe-seal-tick" />;
        })}
      </svg>
      <div className="fe-seal-center">
        {lines.map((ln) => (
          <DecryptedText key={ln} text={ln} animateOn="hover" speed={40} maxIterations={8} sequential revealDirection="center"
            characters="ABCDEFGHIJKLMNOPRSTUVYZ0123456789/" className="fe-seal-code" encryptedClassName="fe-seal-code fe-seal-enc" parentClassName="fe-seal-line" />
        ))}
        {edition && <span className="fe-seal-ed">{edition}</span>}
      </div>
    </div>
  );
}

function splitCode(code: string) {
  const words = code.split(' ');
  if (words.length === 1) return [code];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}
