import type { CSSProperties, ReactNode } from "react";

/* ---------------------------------------------------------------------------
   Hand-drawn ink SVG doodles — category glyphs
   --------------------------------------------------------------------------- */
export const INK = "#2b1d12";

export function GlyphCompass({ size = 18, color = INK }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3 L 12 5" />
      <path d="M16 12 L 12 12 L 14 7 Z" fill={color} stroke="none" />
      <circle cx="12" cy="12" r="1" fill={color} />
    </svg>
  );
}
export function GlyphHeart({ size = 18, color = INK }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20 C 4 14 4 6 8 6 C 10 6 12 8 12 10 C 12 8 14 6 16 6 C 20 6 20 14 12 20 Z" />
    </svg>
  );
}
export function GlyphFlame({ size = 18, color = INK }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 C 14 7 17 8 17 12 C 17 16 14 19 12 21 C 10 19 7 16 7 12 C 7 9 9 9 9 7 C 9 5 11 5 12 3 Z" />
    </svg>
  );
}
export function GlyphSun({ size = 18, color = INK }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3 L 12 5" />
      <path d="M12 19 L 12 21" />
      <path d="M3 12 L 5 12" />
      <path d="M19 12 L 21 12" />
      <path d="M5.6 5.6 L 7 7" />
      <path d="M17 17 L 18.4 18.4" />
      <path d="M18.4 5.6 L 17 7" />
      <path d="M7 17 L 5.6 18.4" />
    </svg>
  );
}

export function CategoryGlyph({ name, size = 18, color = INK }: { name: string; size?: number; color?: string }) {
  switch (name) {
    case "compass": return <GlyphCompass size={size} color={color} />;
    case "heart":   return <GlyphHeart size={size} color={color} />;
    case "flame":   return <GlyphFlame size={size} color={color} />;
    case "sun":     return <GlyphSun size={size} color={color} />;
    default: return null;
  }
}

/* ---------------------------------------------------------------------------
   Decorative ink doodles
   --------------------------------------------------------------------------- */
type DoodleProps = { className?: string; style?: CSSProperties };
export function DoodleArrow({ className = "", style }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 40" className={className} style={style} fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20 Q 40 6 80 18 T 110 12" />
      <path d="M104 6 L 110 12 L 102 16" />
    </svg>
  );
}

export function DoodleStar({ className = "", style }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 L 13.6 9 L 20 10 L 15 14 L 16.5 20 L 12 16.5 L 7.5 20 L 9 14 L 4 10 L 10.4 9 Z" />
    </svg>
  );
}

export function DoodleSpiral({ className = "", style }: DoodleProps) {
  return (
    <svg viewBox="0 0 60 60" className={className} style={style} fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round">
      <path d="M30 30 m -22 0 a 22 22 0 1 1 22 22 a 14 14 0 1 1 -14 -14 a 8 8 0 1 1 8 8 a 3 3 0 1 1 -3 -3" />
    </svg>
  );
}

export function DoodleLoop({ className = "", style }: DoodleProps) {
  return (
    <svg viewBox="0 0 80 40" className={className} style={style} fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round">
      <path d="M4 20 Q 14 4 24 20 T 44 20 T 64 20 T 78 20" />
    </svg>
  );
}

export function DoodleCloud({ className = "", style }: DoodleProps) {
  return (
    <svg viewBox="0 0 80 50" className={className} style={style} fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 32 Q 8 32 8 24 Q 8 16 18 16 Q 18 8 28 8 Q 38 8 40 16 Q 50 14 54 22 Q 64 22 64 30 Q 64 36 56 36 L 18 36 Q 16 36 16 32 Z" />
    </svg>
  );
}

export function InkFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100" fill="none" stroke={INK} strokeWidth="0.4">
        <path d="M2 6 Q 50 3 98 5 L 98 94 Q 50 97 2 95 Z" />
      </svg>
      {children}
    </div>
  );
}
