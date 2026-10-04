import { useEffect, useState } from 'react';
import type { Traits } from './traits';

export function FeltCharacter({ traits, dead = false, className, showShadow = true, look }: {
  traits: Traits; dead?: boolean; className?: string; lite?: boolean; textured?: boolean;
  showShadow?: boolean; look?: { x: number; y: number };
}) {
  const [image, setImage] = useState<{ key: string; src: string } | null>(null);
  const key = JSON.stringify(traits);
  useEffect(() => {
    let active = true;
    import('../services/felt-engine').then(({ feltThumbnail }) => feltThumbnail(traits)).then((src) => {
      if (active) setImage({ key, src });
    }).catch(() => { /* A simple loading silhouette does not invent different character artwork. */ });
    return () => { active = false; };
  }, [key]);
  const x = Math.max(-1, Math.min(1, look?.x ?? 0));
  const y = Math.max(-1, Math.min(1, look?.y ?? 0));
  return <span className={className} data-character-engine="felt-atelier" style={{ display: 'block', width: '100%', aspectRatio: '400 / 460', filter: [dead ? 'grayscale(1)' : '', showShadow ? 'drop-shadow(0 6px 5px #0003)' : ''].join(' '), transform: look ? `perspective(600px) rotateY(${x * 5}deg) rotateX(${-y * 4}deg)` : undefined }}>
    {image?.key === key ? <img src={image.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      : <span aria-hidden="true" style={{ display: 'block', width: '65%', height: '65%', margin: '15% auto', borderRadius: '45%', background: traits.color, opacity: .18 }} />}
  </span>;
}
