import { useEffect, useMemo, useRef, useState } from 'react';
import { feltHex, sewAsync, type Dna, type Lod, type Sewn } from './engine';

let uid = 0;
/** Every sticker carries its own gradient/filter ids, so the same part can appear twice on screen. */
function uniqueIds(svg: string, tag: string) {
  const m = /id="([^"]+)"/.exec(svg);
  return m ? svg.split(m[1]).join(`f${tag}${++uid}`) : svg;
}

export type FeltStickerProps = {
  dna: Dna;
  lod?: Lod;
  className?: string;
  interactive?: boolean;
  /** healed (unburdened) parts get the warm glow the app already uses for them */
  isUnburdened?: boolean;
  title?: string;
};

/**
 * The 2D half of a part: the flat sticker cut from the same sewing record as the 3D plush — seam outline,
 * blanket-stitch ticks, cut felt pieces and embroidery, drawn straight from what was sewn.
 */
export function FeltSticker({ dna, lod = 'map', className = '', interactive = false, isUnburdened = false, title }: FeltStickerProps) {
  const [sewn, setSewn] = useState<Sewn | null>(null);
  const tag = useMemo(() => Math.random().toString(36).slice(2, 7), []);
  useEffect(() => sewAsync(dna, lod, setSewn), [dna, lod]);
  const hex = feltHex(dna.collection, dna.felt);

  const style: React.CSSProperties = {
    display: 'grid',
    placeItems: 'center',
    width: '100%',
    height: '100%',
    filter: isUnburdened ? `drop-shadow(0 0 8px ${hex}) drop-shadow(0 3px 4px rgba(60,40,20,.28))` : 'drop-shadow(0 3px 4px rgba(60,40,20,.22))',
    transition: interactive ? 'transform .3s ease, filter .3s ease' : undefined,
  };

  return (
    <span
      className={`${className} ${interactive ? 'hover:scale-105' : ''}`}
      style={style}
      title={title}
      data-felt="2d"
      data-sewn={sewn ? 'yes' : 'sewing'}
    >
      {sewn ? (
        <span
          style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}
          dangerouslySetInnerHTML={{ __html: uniqueIds(sewn.svg, tag) }}
        />
      ) : (
        // not sewn yet: the felt swatch itself, so the layout never jumps
        <svg viewBox="0 0 100 100" style={{ width: '78%', height: '78%' }} aria-hidden="true">
          <circle cx="50" cy="50" r="44" fill={hex} opacity="0.85" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="3" strokeDasharray="7 9" />
        </svg>
      )}
    </span>
  );
}

export default FeltSticker;
