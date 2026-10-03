import { FeltCharacter } from './FeltCharacter';
import type { BodyShape, EyeStyle, Facewear, Headgear, MouthStyle } from './traits';
export { FeltCharacter as Character } from './FeltCharacter';
const INK = '#16161c';

export function ShapeIcon({ shape, className }: { shape: BodyShape; className?: string }) {
  return <FeltCharacter traits={{ shape, color: '#748999', eyes: 'tiny', mouth: 'none', head: 'none', face: 'none', bow: false, cheeks: false }} className={className} />;
}

export function EyesIcon({ style, className }: { style: EyeStyle; className?: string }) {
  return <svg viewBox="0 0 32 32" className={className} fill={INK}>
    {style === 'closed' ? <path d="M4 14 Q8 20 12 14 M20 14 Q24 20 28 14" fill="none" stroke={INK} strokeWidth="2" /> : <><ellipse cx="8" cy="16" rx={style === 'tiny' ? 2 : 3} ry={style === 'ovals' ? 5 : 3} />{style === 'wink' ? <path d="M20 16 Q24 20 28 16" fill="none" stroke={INK} strokeWidth="2" /> : <ellipse cx="24" cy="16" rx={style === 'tiny' ? 2 : 3} ry={style === 'ovals' ? 5 : 3} />}</>}
  </svg>;
}
export function MouthIcon({ style, className }: { style: MouthStyle; className?: string }) {
  return <svg viewBox="0 0 32 32" className={className}>{style === 'o' ? <ellipse cx="16" cy="16" rx="3" ry="4" fill={INK} /> : style === 'none' ? <circle cx="16" cy="16" r="1" fill={INK} /> : <path d={style === 'flat' ? 'M8 16 H24' : 'M8 13 Q16 25 24 13'} fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />}</svg>;
}

export function HeadIcon({ style, className }: { style: Headgear; className?: string }) {
  return <FeltCharacter traits={{ shape: 'mochi', color: '#748999', eyes: 'tiny', mouth: 'none', head: style, face: 'none', bow: false, cheeks: false }} className={className} />;
}

export function FaceIcon({ style, className }: { style: Facewear; className?: string }) {
  const inner = (() => {
    switch (style) {
      case "none":
        return <path d="M8 8 L24 24 M24 8 L8 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />;
      case "glasses":
        return (
          <g fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="10" cy="16" r="6" />
            <circle cx="22" cy="16" r="6" />
            <path d="M16 16 H16.1" />
          </g>
        );
      case "shades":
        return (
          <g fill="currentColor">
            <circle cx="10" cy="16" r="6" />
            <circle cx="22" cy="16" r="6" />
            <rect x="15" y="14.5" width="2" height="3" />
          </g>
        );
    }
  })();
  return <svg viewBox="0 0 32 32" className={className}>{inner}</svg>;
}
