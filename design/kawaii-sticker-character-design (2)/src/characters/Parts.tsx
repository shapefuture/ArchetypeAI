import type { ReactElement } from "react";
import type { Character } from "../data/ifsData";

/* ---------------------------------------------------------------------------
   Shared SVG helpers
   --------------------------------------------------------------------------- */
const OUTLINE = "#3a2a1f"; // warm dark brown

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <filter id={`shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#3a2a1f" floodOpacity="0.18" />
      </filter>
      <filter id={`grain-${id}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
        <feColorMatrix values="0 0 0 0 0.30 0 0 0 0 0.22 0 0 0 0 0.18 0 0 0 0.10 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
      <radialGradient id={`cheek-${id}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f48aa4" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#f48aa4" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** White die-cut sticker background with soft irregular rounded shape */
function StickerBase({ id, shape = "round" }: { id: string; shape?: "round" | "squircle" | "bumpy" }) {
  const paths: Record<string, string> = {
    // big rounded squircle
    round: "M140 20 C 200 20 250 50 258 110 C 268 178 252 230 196 252 C 140 270 80 268 38 240 C 4 214 8 158 18 100 C 28 50 80 20 140 20 Z",
    // slightly squished squircle
    squircle: "M140 16 C 210 18 262 60 262 130 C 264 200 240 256 174 262 C 110 268 50 250 24 198 C 0 146 18 70 70 36 C 96 20 118 16 140 16 Z",
    // bumpy playful outline
    bumpy: "M70 24 C 100 14 130 30 158 22 C 192 14 222 36 244 60 C 266 86 264 122 262 154 C 258 188 240 220 208 240 C 170 262 124 264 84 248 C 46 232 18 196 14 156 C 10 116 26 76 50 50 C 56 42 64 32 70 24 Z",
  };
  return (
    <g filter={`url(#shadow-${id})`}>
      <path d={paths[shape]} fill="#fdfaf3" stroke="#e9dcc7" strokeWidth="1.5" />
    </g>
  );
}

/** Common face features: a pair of cute eyes with catchlights */
function Eyes({ x = 110, y = 140, size = 11, look = "forward", lashes = false, closed = false }: {
  x?: number; y?: number; size?: number; look?: "forward" | "up" | "side" | "down"; lashes?: boolean; closed?: boolean;
}) {
  if (closed) {
    return (
      <g>
        <path d={`M${x - size} ${y} Q ${x} ${y + size * 0.55} ${x + size} ${y}`} stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d={`M${x + size + 18} ${y} Q ${x + size + 28} ${y + size * 0.55} ${x + size + 36} ${y}`} stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
        {lashes && <path d={`M${x - size - 4} ${y - 2} l -3 -4`} stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />}
        {lashes && <path d={`M${x + size + 40} ${y - 2} l 3 -4`} stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />}
      </g>
    );
  }
  const lookOffset = { forward: [0, 0], up: [0, -2], side: [2, 0], down: [0, 2] }[look];
  return (
    <g>
      {/* left eye */}
      <ellipse cx={x} cy={y} rx={size} ry={size * 1.15} fill={OUTLINE} />
      <ellipse cx={x + lookOffset[0]} cy={y + lookOffset[1]} rx={size * 0.45} ry={size * 0.55} fill="#fff" />
      <circle cx={x - size * 0.25} cy={y - size * 0.4} r={size * 0.18} fill="#fff" />
      {lashes && <path d={`M${x - size - 1} ${y - size * 0.4} l -4 -3`} stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />}
      {lashes && <path d={`M${x - size * 0.5} ${y - size} l -2 -5`} stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />}
      {/* right eye */}
      <ellipse cx={x + size * 2 + 18} cy={y} rx={size} ry={size * 1.15} fill={OUTLINE} />
      <ellipse cx={x + size * 2 + 18 + lookOffset[0]} cy={y + lookOffset[1]} rx={size * 0.45} ry={size * 0.55} fill="#fff" />
      <circle cx={x + size * 2 + 18 - size * 0.25} cy={y - size * 0.4} r={size * 0.18} fill="#fff" />
      {lashes && <path d={`M${x + size * 2 + 19} ${y - size * 0.4} l 4 -3`} stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />}
      {lashes && <path d={`M${x + size * 2 + 18 + size * 0.5} ${y - size} l 2 -5`} stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />}
    </g>
  );
}

function Cheeks({ x = 90, y = 165, color = "#f48aa4" }: { x?: number; y?: number; color?: string }) {
  return (
    <g opacity="0.7">
      <ellipse cx={x} cy={y} rx="13" ry="7" fill={color} />
      <ellipse cx={x + 100} cy={y} rx="13" ry="7" fill={color} />
    </g>
  );
}

function Sparkle({ x, y, size = 6, color = "#f4b942" }: { x: number; y: number; size?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M0 -${size} L${size * 0.3} -${size * 0.3} L${size} 0 L${size * 0.3} ${size * 0.3} L0 ${size} L-${size * 0.3} ${size * 0.3} L-${size} 0 L-${size * 0.3} -${size * 0.3} Z`} fill={color} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
    </g>
  );
}

function Heart({ x, y, size = 10, color = "#ef6f8b", stroke = OUTLINE }: { x: number; y: number; size?: number; color?: string; stroke?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 10})`}>
      <path d="M0 4 C -8 -6 -16 0 -8 8 L 0 16 L 8 8 C 16 0 8 -6 0 4 Z" fill={color} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
    </g>
  );
}

/* ===========================================================================
   CHARACTER 1 — THE INNER CRITIC
   A serious little owl-cat with reading glasses, holding a tiny scroll.
   =========================================================================== */
function InnerCriticArt({ c }: { c: Character }) {
  const p = c.palette;
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Defs id="critic" />
      <StickerBase id="critic" shape="squircle" />

      {/* Wing-feather ears (left) */}
      <path d="M86 86 C 72 60 78 38 100 40 C 116 42 122 64 116 86 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M94 76 C 88 60 96 50 108 54" stroke={p.skinShadow} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* (right) */}
      <path d="M194 86 C 208 60 202 38 180 40 C 164 42 158 64 164 86 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M186 76 C 192 60 184 50 172 54" stroke={p.skinShadow} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Head / body (chibi owl shape) */}
      <path d="M70 150 C 70 100 110 78 140 78 C 170 78 210 100 210 150 C 210 198 180 230 140 230 C 100 230 70 198 70 150 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3.5" strokeLinejoin="round" />
      {/* belly */}
      <path d="M100 178 C 100 142 116 124 140 124 C 164 124 180 142 180 178 C 180 210 164 222 140 222 C 116 222 100 210 100 178 Z" fill={p.skinShadow} opacity="0.45" />
      <path d="M104 182 C 110 168 120 164 130 168" stroke={p.skinShadow} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M158 196 C 168 190 178 194 180 200" stroke={p.skinShadow} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* Cheeks */}
      <Cheeks x={92} y={172} color={p.cheek} />

      {/* Reading glasses (the signature) */}
      <g>
        <circle cx="110" cy="148" r="20" fill="#fff" opacity="0.7" stroke={OUTLINE} strokeWidth="3" />
        <circle cx="170" cy="148" r="20" fill="#fff" opacity="0.7" stroke={OUTLINE} strokeWidth="3" />
        <line x1="130" y1="148" x2="150" y2="148" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
        <line x1="90" y1="146" x2="78" y2="140" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
        <line x1="190" y1="146" x2="202" y2="140" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
        {/* shine */}
        <path d="M100 140 Q 104 132 114 132" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M160 140 Q 164 132 174 132" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>

      {/* Eyes inside glasses — stern but tiny */}
      <g>
        <ellipse cx="110" cy="150" rx="9" ry="10" fill={OUTLINE} />
        <circle cx="112" cy="147" r="3" fill="#fff" />
        <ellipse cx="170" cy="150" rx="9" ry="10" fill={OUTLINE} />
        <circle cx="172" cy="147" r="3" fill="#fff" />
      </g>

      {/* Stern brows */}
      <path d="M88 124 L 122 132" stroke={OUTLINE} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M158 132 L 192 124" stroke={OUTLINE} strokeWidth="3.5" strokeLinecap="round" />

      {/* Beak/nose */}
      <path d="M138 170 L 142 178 L 146 170 Z" fill={p.accent2} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />

      {/* Tiny frown */}
      <path d="M132 196 Q 140 190 148 196" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Scroll in wing */}
      <g transform="translate(206 178) rotate(18)">
        <rect x="-2" y="0" width="44" height="28" rx="4" fill="#fdf3d8" stroke={OUTLINE} strokeWidth="2.5" />
        <rect x="2" y="-4" width="36" height="6" rx="3" fill="#fdf3d8" stroke={OUTLINE} strokeWidth="2.5" />
        <line x1="4" y1="10" x2="36" y2="10" stroke={p.accent2} strokeWidth="1.6" strokeLinecap="round" />
        <line x1="4" y1="16" x2="30" y2="16" stroke={p.accent2} strokeWidth="1.6" strokeLinecap="round" />
        <line x1="4" y1="22" x2="32" y2="22" stroke={p.accent2} strokeWidth="1.6" strokeLinecap="round" />
        <text x="20" y="14" textAnchor="middle" fontSize="8" fontWeight="700" fill={p.accent2} fontFamily="Caveat, cursive">!?</text>
      </g>

      {/* Tiny feet */}
      <path d="M116 228 l -6 8 m 6 -8 l 6 8" stroke={p.accent2} strokeWidth="3" strokeLinecap="round" />
      <path d="M164 228 l -6 8 m 6 -8 l 6 8" stroke={p.accent2} strokeWidth="3" strokeLinecap="round" />

      {/* Decorative */}
      <Sparkle x={56} y={94} size={5} color="#fff3a8" />
      <Sparkle x={232} y={114} size={4} color="#fff3a8" />
      <path d="M48 168 l 6 4 m -6 0 l 6 -4" stroke={p.accent2} strokeWidth="2" strokeLinecap="round" />
      <path d="M232 168 l 6 4 m -6 0 l 6 -4" stroke={p.accent2} strokeWidth="2" strokeLinecap="round" />

      {/* Paper grain */}
      <rect x="0" y="0" width="280" height="280" fill="white" opacity="0.0001" filter={`url(#grain-critic)`} />
    </svg>
  );
}

/* ===========================================================================
   CHARACTER 2 — THE PERFECTIONIST
   A worried little bunny with a clipboard and pencil, ears slightly droopy.
   =========================================================================== */
function PerfectionistArt({ c }: { c: Character }) {
  const p = c.palette;
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Defs id="perf" />
      <StickerBase id="perf" shape="round" />

      {/* Long bunny ears (droopy, worried) */}
      <path d="M104 84 C 100 50 112 22 122 22 C 132 22 134 56 130 86 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M110 82 C 108 60 116 36 122 32" stroke={p.skinShadow} strokeWidth="2" fill="none" />
      <path d="M176 84 C 180 50 168 22 158 22 C 148 22 146 56 150 86 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M170 82 C 172 60 164 36 158 32" stroke={p.skinShadow} strokeWidth="2" fill="none" />
      {/* inner ear pink */}
      <path d="M114 80 C 112 60 118 38 122 36" stroke="#f48aa4" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M166 80 C 168 60 162 38 158 36" stroke="#f48aa4" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Head */}
      <path d="M70 162 C 70 112 100 88 140 88 C 180 88 210 112 210 162 C 210 210 180 234 140 234 C 100 234 70 210 70 162 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3.5" strokeLinejoin="round" />
      {/* belly hint */}
      <path d="M104 198 C 104 168 118 152 140 152 C 162 152 176 168 176 198 C 176 222 162 230 140 230 C 118 230 104 222 104 198 Z" fill="#fff" opacity="0.55" />

      {/* Worried eyebrows (^) */}
      <path d="M96 130 Q 106 122 116 130" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M164 130 Q 174 122 184 130" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />

      <Eyes x={108} y={148} size={9} look="side" />
      {/* tiny mouth — open worried O */}
      <ellipse cx="140" cy="178" rx="4" ry="6" fill={p.accent2} stroke={OUTLINE} strokeWidth="2" />
      {/* tiny nose */}
      <path d="M136 164 Q 140 160 144 164" stroke={OUTLINE} strokeWidth="2" fill="none" strokeLinecap="round" />

      <Cheeks x={94} y={176} color={p.cheek} />

      {/* Clipboard in front (paws holding it) */}
      <g transform="translate(96 188)">
        <rect x="0" y="0" width="88" height="64" rx="6" fill="#fdf3d8" stroke={OUTLINE} strokeWidth="3" />
        <rect x="28" y="-6" width="32" height="10" rx="3" fill={p.accent} stroke={OUTLINE} strokeWidth="2.5" />
        {/* checks */}
        <g stroke={p.accent2} strokeWidth="2" fill="none" strokeLinecap="round">
          <rect x="8" y="10" width="10" height="10" rx="2" />
          <path d="M9 15 l 3 3 l 5 -5" stroke={p.accent2} strokeWidth="2.5" />
          <line x1="24" y1="16" x2="76" y2="16" />
          <rect x="8" y="26" width="10" height="10" rx="2" />
          <path d="M9 31 l 3 3 l 5 -5" stroke={p.accent2} strokeWidth="2.5" />
          <line x1="24" y1="32" x2="68" y2="32" />
          <rect x="8" y="42" width="10" height="10" rx="2" />
          <line x1="24" y1="48" x2="74" y2="48" />
        </g>
        {/* paw */}
        <ellipse cx="6" cy="20" rx="10" ry="8" fill={p.skin} stroke={OUTLINE} strokeWidth="2.5" />
        <ellipse cx="82" cy="20" rx="10" ry="8" fill={p.skin} stroke={OUTLINE} strokeWidth="2.5" />
      </g>
      {/* Pencil */}
      <g transform="translate(178 196) rotate(20)">
        <rect x="0" y="0" width="36" height="6" fill={p.accent} stroke={OUTLINE} strokeWidth="2" />
        <polygon points="36,0 44,3 36,6" fill="#fdf3d8" stroke={OUTLINE} strokeWidth="2" />
        <polygon points="44,3 46,3 45,4" fill={OUTLINE} />
      </g>

      {/* Sparkles */}
      <Sparkle x={52} y={92} size={4} color="#fff3a8" />
      <Sparkle x={228} y={108} size={5} color="#fff3a8" />
    </svg>
  );
}

/* ===========================================================================
   CHARACTER 3 — THE PLEASER
   A sweet little cat with a bow, holding out a heart-shaped gift.
   =========================================================================== */
function PleaserArt({ c }: { c: Character }) {
  const p = c.palette;
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Defs id="pleaser" />
      <StickerBase id="pleaser" shape="bumpy" />

      {/* Triangle cat ears */}
      <path d="M82 96 L 96 50 L 122 90 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M96 84 L 100 64 L 112 88" fill={p.cheek} />
      <path d="M198 96 L 184 50 L 158 90 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M184 84 L 180 64 L 168 88" fill={p.cheek} />

      {/* Head */}
      <path d="M64 158 C 64 108 100 84 140 84 C 180 84 216 108 216 158 C 216 206 184 232 140 232 C 96 232 64 206 64 158 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3.5" strokeLinejoin="round" />

      {/* Bow on top */}
      <g transform="translate(140 76)">
        <path d="M-22 0 L -10 -10 L -10 10 Z" fill={p.accent} stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M22 0 L 10 -10 L 10 10 Z" fill={p.accent} stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="0" cy="0" r="5" fill={p.accent2} stroke={OUTLINE} strokeWidth="2" />
      </g>

      {/* Closed happy eyes ^_^ */}
      <path d="M104 152 Q 112 144 122 152" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M158 152 Q 168 144 178 152" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M104 152 l 3 -4" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M178 152 l -3 -4" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" />

      {/* Tiny nose */}
      <path d="M136 168 L 140 174 L 144 168 Z" fill={p.accent2} stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Big smile */}
      <path d="M122 182 Q 140 200 158 182" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M124 184 Q 140 198 156 184" fill="#f7a4b0" opacity="0.7" />

      <Cheeks x={92} y={178} color={p.cheek} />

      {/* Whiskers */}
      <path d="M70 172 l -18 -2" stroke={OUTLINE} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M70 178 l -18 4" stroke={OUTLINE} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M210 172 l 18 -2" stroke={OUTLINE} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M210 178 l 18 4" stroke={OUTLINE} strokeWidth="1.6" strokeLinecap="round" />

      {/* Gift box in arms */}
      <g transform="translate(140 232)">
        <rect x="-26" y="-20" width="52" height="34" rx="3" fill={p.accent} stroke={OUTLINE} strokeWidth="2.5" />
        <rect x="-26" y="-8" width="52" height="6" fill={p.accent2} />
        <rect x="-4" y="-20" width="8" height="34" fill={p.accent2} />
        <path d="M0 -20 C -8 -28 -16 -22 -10 -16" fill="none" stroke={p.accent2} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M0 -20 C 8 -28 16 -22 10 -16" fill="none" stroke={p.accent2} strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Heart pop above */}
      <Heart x={62} y={108} size={12} color="#f48aa4" />
      <Heart x={214} y={128} size={9} color="#f48aa4" />
      <Sparkle x={228} y={84} size={5} color="#fff3a8" />
    </svg>
  );
}

/* ===========================================================================
   CHARACTER 4 — THE CONTROLLER
   A serious bear with a clipboard and whistle, bossy posture.
   =========================================================================== */
function ControllerArt({ c }: { c: Character }) {
  const p = c.palette;
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Defs id="ctrl" />
      <StickerBase id="ctrl" shape="round" />

      {/* Round bear ears */}
      <circle cx="92" cy="78" r="20" fill={p.skin} stroke={OUTLINE} strokeWidth="3" />
      <circle cx="92" cy="78" r="10" fill={p.skinShadow} />
      <circle cx="188" cy="78" r="20" fill={p.skin} stroke={OUTLINE} strokeWidth="3" />
      <circle cx="188" cy="78" r="10" fill={p.skinShadow} />

      {/* Head */}
      <path d="M60 160 C 60 110 96 84 140 84 C 184 84 220 110 220 160 C 220 208 186 232 140 232 C 94 232 60 208 60 160 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3.5" />
      {/* snout */}
      <ellipse cx="140" cy="184" rx="34" ry="24" fill={p.skinShadow} opacity="0.55" />

      {/* Stern single-line brows */}
      <path d="M96 134 L 130 140" stroke={OUTLINE} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M150 140 L 184 134" stroke={OUTLINE} strokeWidth="3.5" strokeLinecap="round" />

      <Eyes x={108} y={150} size={8} look="forward" />
      {/* Bear nose */}
      <ellipse cx="140" cy="170" rx="6" ry="5" fill={OUTLINE} />
      <path d="M140 175 L 140 184" stroke={OUTLINE} strokeWidth="2" />
      {/* Frown */}
      <path d="M124 198 Q 140 188 156 198" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      <Cheeks x={86} y={186} color={p.cheek} />

      {/* Whistle around neck */}
      <g>
        <path d="M104 218 Q 140 232 176 218" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="132" y="216" width="16" height="10" rx="2" fill="#fdf3d8" stroke={OUTLINE} strokeWidth="2" />
        <rect x="148" y="218" width="10" height="6" rx="1" fill="#fdf3d8" stroke={OUTLINE} strokeWidth="2" />
      </g>

      {/* Clipboard held up */}
      <g transform="translate(202 168) rotate(15)">
        <rect x="0" y="0" width="44" height="56" rx="4" fill="#fdf3d8" stroke={OUTLINE} strokeWidth="2.5" />
        <rect x="14" y="-4" width="16" height="6" rx="2" fill={p.accent} stroke={OUTLINE} strokeWidth="2" />
        <line x1="6" y1="12" x2="38" y2="12" stroke={p.accent2} strokeWidth="1.5" />
        <line x1="6" y1="20" x2="32" y2="20" stroke={p.accent2} strokeWidth="1.5" />
        <line x1="6" y1="28" x2="36" y2="28" stroke={p.accent2} strokeWidth="1.5" />
        <line x1="6" y1="36" x2="28" y2="36" stroke={p.accent2} strokeWidth="1.5" />
        <text x="22" y="50" textAnchor="middle" fontSize="10" fontWeight="700" fill={p.accent2} fontFamily="Caveat, cursive">!!</text>
      </g>

      {/* Motion lines / energy marks */}
      <path d="M40 96 l 6 -6" stroke={p.accent2} strokeWidth="2" strokeLinecap="round" />
      <path d="M34 110 l 8 -2" stroke={p.accent2} strokeWidth="2" strokeLinecap="round" />
      <path d="M240 96 l -6 -6" stroke={p.accent2} strokeWidth="2" strokeLinecap="round" />
      <path d="M246 110 l -8 -2" stroke={p.accent2} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ===========================================================================
   CHARACTER 5 — THE TASKMASTER
   A peppy mouse/hamster with a stopwatch and energy sparks.
   =========================================================================== */
function TaskmasterArt({ c }: { c: Character }) {
  const p = c.palette;
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Defs id="task" />
      <StickerBase id="task" shape="bumpy" />

      {/* Round mouse ears */}
      <circle cx="92" cy="76" r="22" fill={p.skin} stroke={OUTLINE} strokeWidth="3" />
      <circle cx="92" cy="76" r="12" fill={p.cheek} />
      <circle cx="188" cy="76" r="22" fill={p.skin} stroke={OUTLINE} strokeWidth="3" />
      <circle cx="188" cy="76" r="12" fill={p.cheek} />

      {/* Head */}
      <path d="M62 162 C 62 112 96 86 140 86 C 184 86 218 112 218 162 C 218 208 184 232 140 232 C 96 232 62 208 62 162 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3.5" />
      <path d="M104 196 C 104 172 118 158 140 158 C 162 158 176 172 176 196 C 176 216 162 224 140 224 C 118 224 104 216 104 196 Z" fill={p.skinShadow} opacity="0.5" />

      {/* determined eyes ^ ^ */}
      <g>
        <ellipse cx="108" cy="148" rx="9" ry="10" fill={OUTLINE} />
        <circle cx="110" cy="145" r="3" fill="#fff" />
        <ellipse cx="170" cy="148" rx="9" ry="10" fill={OUTLINE} />
        <circle cx="172" cy="145" r="3" fill="#fff" />
      </g>
      <path d="M96 130 L 122 138" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <path d="M158 138 L 184 130" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />

      {/* Tiny nose */}
      <ellipse cx="140" cy="170" rx="4" ry="3" fill={p.accent2} />
      {/* determined mouth — small smirk */}
      <path d="M130 184 Q 140 192 152 184" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      <Cheeks x={92} y={180} color={p.cheek} />

      {/* Headband */}
      <path d="M70 110 C 100 96 180 96 210 110 L 210 124 C 180 110 100 110 70 124 Z" fill={p.accent} stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
      <text x="140" y="122" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="Quicksand, sans-serif">GO!</text>

      {/* Stopwatch */}
      <g transform="translate(74 198)">
        <circle cx="0" cy="0" r="22" fill="#fdf3d8" stroke={OUTLINE} strokeWidth="3" />
        <circle cx="0" cy="0" r="18" fill="#fff" stroke={OUTLINE} strokeWidth="1.5" />
        <rect x="-4" y="-26" width="8" height="6" rx="1" fill={p.accent2} stroke={OUTLINE} strokeWidth="1.5" />
        <line x1="0" y1="-22" x2="0" y2="-26" stroke={OUTLINE} strokeWidth="1.5" />
        <line x1="0" y1="0" x2="0" y2="-12" stroke={p.accent2} strokeWidth="2" strokeLinecap="round" />
        <line x1="0" y1="0" x2="10" y2="4" stroke={p.accent2} strokeWidth="2" strokeLinecap="round" />
        <circle cx="0" cy="0" r="2" fill={OUTLINE} />
        <text x="0" y="10" textAnchor="middle" fontSize="7" fontWeight="700" fill={p.accent2} fontFamily="Quicksand, sans-serif">GO</text>
      </g>

      {/* Motion lines */}
      <path d="M40 60 l 16 -6" stroke={p.accent2} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M44 80 l 14 0" stroke={p.accent2} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M236 60 l -16 -6" stroke={p.accent2} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M236 80 l -14 0" stroke={p.accent2} strokeWidth="2.5" strokeLinecap="round" />
      <Sparkle x={228} y={120} size={5} color="#fff3a8" />
    </svg>
  );
}

/* ===========================================================================
   CHARACTER 6 — THE INNER CHILD
   A tiny bunny with teddy bear, big sparkly eyes, dreamy and soft.
   =========================================================================== */
function InnerChildArt({ c }: { c: Character }) {
  const p = c.palette;
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Defs id="child" />
      <StickerBase id="child" shape="bumpy" />

      {/* Bunny ears — extra big */}
      <path d="M104 80 C 96 30 116 18 124 20 C 132 22 138 50 134 84 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M112 70 C 110 44 118 30 124 28" stroke={p.cheek} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M176 80 C 184 30 164 18 156 20 C 148 22 142 50 146 84 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M168 70 C 170 44 162 30 156 28" stroke={p.cheek} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.85" />

      {/* Big head */}
      <path d="M64 168 C 64 114 100 90 140 90 C 180 90 216 114 216 168 C 216 214 184 236 140 236 C 96 236 64 214 64 168 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3.5" />

      {/* Hair tuft */}
      <path d="M104 100 C 110 84 120 88 124 96 C 128 86 138 86 142 96 C 146 88 156 86 162 100" stroke={p.accent2} strokeWidth="3.5" fill="none" strokeLinecap="round" />

      {/* HUGE sparkly eyes */}
      <g>
        <ellipse cx="110" cy="160" rx="13" ry="16" fill={OUTLINE} />
        <ellipse cx="112" cy="156" rx="5" ry="6" fill="#fff" />
        <circle cx="106" cy="166" r="2.2" fill="#fff" />
        <ellipse cx="170" cy="160" rx="13" ry="16" fill={OUTLINE} />
        <ellipse cx="172" cy="156" rx="5" ry="6" fill="#fff" />
        <circle cx="166" cy="166" r="2.2" fill="#fff" />
      </g>

      {/* Curly lashes */}
      <path d="M97 152 q -3 -3 -1 -7" stroke={OUTLINE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M96 158 q -4 -1 -5 2" stroke={OUTLINE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M183 152 q 3 -3 1 -7" stroke={OUTLINE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M184 158 q 4 -1 5 2" stroke={OUTLINE} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Tiny mouth — small "o" */}
      <ellipse cx="140" cy="200" rx="4" ry="5" fill={p.cheek} stroke={OUTLINE} strokeWidth="1.8" />

      <Cheeks x={86} y={188} color={p.cheek} />

      {/* Teddy bear held up */}
      <g transform="translate(186 196)">
        <circle cx="0" cy="0" r="18" fill={p.accent} stroke={OUTLINE} strokeWidth="2.5" />
        <circle cx="-12" cy="-12" r="6" fill={p.accent} stroke={OUTLINE} strokeWidth="2" />
        <circle cx="12" cy="-12" r="6" fill={p.accent} stroke={OUTLINE} strokeWidth="2" />
        <circle cx="0" cy="-4" r="9" fill={p.skinShadow} opacity="0.6" />
        <ellipse cx="-4" cy="-5" rx="1.6" ry="2" fill={OUTLINE} />
        <ellipse cx="4" cy="-5" rx="1.6" ry="2" fill={OUTLINE} />
        <ellipse cx="0" cy="2" rx="2" ry="1.5" fill={OUTLINE} />
        <path d="M-3 4 Q 0 7 3 4" stroke={OUTLINE} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M-14 6 l -6 6" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
        <path d="M14 6 l 6 6" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
        <circle cx="0" cy="14" r="3" fill={p.cheek} />
      </g>

      {/* Hearts & sparkles */}
      <Heart x={56} y={100} size={10} color="#f48aa4" />
      <Heart x={220} y={142} size={8} color="#f48aa4" />
      <Sparkle x={48} y={148} size={5} color="#fff3a8" />
      <Sparkle x={232} y={88} size={5} color="#fff3a8" />
    </svg>
  );
}

/* ===========================================================================
   CHARACTER 7 — THE WOUNDED ONE
   Tiny figure swaddled in a blanket, peeking out with one tear.
   =========================================================================== */
function WoundedOneArt({ c }: { c: Character }) {
  const p = c.palette;
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Defs id="wound" />
      <StickerBase id="wound" shape="round" />

      {/* Swaddle body (a big teardrop cocoon) */}
      <path d="M60 196 C 60 134 100 110 140 110 C 180 110 220 134 220 196 C 220 230 184 244 140 244 C 96 244 60 230 60 196 Z" fill={p.accent2} stroke={OUTLINE} strokeWidth="3.5" strokeLinejoin="round" />
      {/* blanket folds */}
      <path d="M80 196 Q 96 188 110 196" stroke={p.accent} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M120 206 Q 140 198 160 206" stroke={p.accent} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M86 218 Q 100 214 116 218" stroke={p.accent} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M168 222 Q 184 218 198 222" stroke={p.accent} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Head peeking out */}
      <path d="M96 138 C 96 110 116 92 140 92 C 164 92 184 110 184 138 C 184 160 164 174 140 174 C 116 174 96 160 96 138 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3" />

      {/* Hair tuft */}
      <path d="M118 100 Q 124 88 130 100 Q 140 86 150 100 Q 156 88 162 100" stroke={p.accent} strokeWidth="3" fill={p.accent} strokeLinecap="round" />

      {/* Sad eyes — droopy with tears */}
      <g>
        <ellipse cx="122" cy="140" rx="7" ry="9" fill={OUTLINE} />
        <ellipse cx="124" cy="138" rx="2.6" ry="3.4" fill="#fff" />
        <ellipse cx="158" cy="140" rx="7" ry="9" fill={OUTLINE} />
        <ellipse cx="160" cy="138" rx="2.6" ry="3.4" fill="#fff" />
        {/* tear drop */}
        <path d="M116 150 Q 114 156 116 160 Q 118 156 116 150 Z" fill="#9bd1f0" stroke={OUTLINE} strokeWidth="1" />
        <path d="M164 150 Q 162 156 164 160 Q 166 156 164 150 Z" fill="#9bd1f0" stroke={OUTLINE} strokeWidth="1" />
      </g>
      {/* Eyebrows — sad */}
      <path d="M112 124 Q 122 130 130 124" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M150 124 Q 158 130 168 124" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* tiny trembling mouth */}
      <path d="M134 162 Q 140 158 146 162" stroke={OUTLINE} strokeWidth="2" fill="none" strokeLinecap="round" />

      <Cheeks x={104} y={156} color={p.cheek} />

      {/* Hands clutching blanket */}
      <ellipse cx="86" cy="190" rx="10" ry="8" fill={p.skin} stroke={OUTLINE} strokeWidth="2.5" />
      <ellipse cx="194" cy="190" rx="10" ry="8" fill={p.skin} stroke={OUTLINE} strokeWidth="2.5" />

      {/* Floating heart of hope */}
      <Heart x={56} y={98} size={11} color="#f7a4b0" />
      <Sparkle x={230} y={120} size={5} color="#fff3a8" />
      <path d="M40 140 l 6 -4 m -6 0 l 6 4" stroke={p.accent2} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ===========================================================================
   CHARACTER 8 — THE FIREFIGHTER
   A wild little fox holding a fire extinguisher (or soda), ready to react.
   =========================================================================== */
function FirefighterArt({ c }: { c: Character }) {
  const p = c.palette;
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Defs id="fire" />
      <StickerBase id="fire" shape="bumpy" />

      {/* Fox pointy ears */}
      <path d="M82 88 L 90 36 L 122 80 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M96 78 L 100 52 L 110 76" fill={p.skinShadow} />
      <path d="M198 88 L 190 36 L 158 80 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M184 78 L 180 52 L 170 76" fill={p.skinShadow} />

      {/* Head */}
      <path d="M60 158 C 60 110 96 84 140 84 C 184 84 220 110 220 158 C 220 206 184 232 140 232 C 96 232 60 206 60 158 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3.5" />
      {/* white face mask */}
      <path d="M104 178 C 104 156 118 142 140 142 C 162 142 176 156 176 178 C 176 198 162 208 140 208 C 118 208 104 198 104 178 Z" fill="#fdf3d8" stroke={OUTLINE} strokeWidth="2.5" />

      {/* Smirky eyes */}
      <g>
        <ellipse cx="112" cy="146" rx="8" ry="9" fill={OUTLINE} />
        <circle cx="114" cy="144" r="2.6" fill="#fff" />
        <ellipse cx="168" cy="146" rx="8" ry="9" fill={OUTLINE} />
        <circle cx="170" cy="144" r="2.6" fill="#fff" />
      </g>
      <path d="M96 130 L 120 134" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <path d="M160 132 L 184 130" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />

      {/* Fox nose */}
      <ellipse cx="140" cy="170" rx="6" ry="5" fill={OUTLINE} />
      {/* Smirk */}
      <path d="M128 188 Q 140 200 154 184" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      <Cheeks x={90} y={180} color={p.cheek} />

      {/* Fire extinguisher */}
      <g transform="translate(64 198) rotate(-8)">
        <rect x="0" y="0" width="22" height="40" rx="5" fill={p.accent2} stroke={OUTLINE} strokeWidth="2.5" />
        <rect x="2" y="0" width="18" height="6" fill={p.accent} stroke={OUTLINE} strokeWidth="2" />
        <rect x="6" y="-8" width="10" height="8" rx="2" fill={OUTLINE} />
        <rect x="20" y="-4" width="10" height="4" rx="1" fill={OUTLINE} />
        <text x="11" y="26" textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff" fontFamily="Quicksand, sans-serif">SOS</text>
        {/* puff of foam */}
        <circle cx="34" cy="-2" r="4" fill="#fff" stroke={OUTLINE} strokeWidth="1.5" />
        <circle cx="40" cy="-6" r="3" fill="#fff" stroke={OUTLINE} strokeWidth="1.5" />
        <circle cx="38" cy="2" r="3" fill="#fff" stroke={OUTLINE} strokeWidth="1.5" />
      </g>

      {/* Flame behind */}
      <g transform="translate(218 64)">
        <path d="M0 30 C -10 14 -8 0 0 -8 C 4 4 12 0 8 14 C 18 8 18 24 8 36 Z" fill="#f4a25c" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
        <path d="M2 22 C -2 14 4 8 6 14 C 8 18 12 18 10 24 Z" fill="#f7d18a" />
      </g>

      {/* Sparks */}
      <Sparkle x={232} y={140} size={5} color="#fff3a8" />
      <Sparkle x={48} y={104} size={4} color="#fff3a8" />
      <path d="M236 192 l 8 4 m -8 0 l 8 -4" stroke={p.accent2} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ===========================================================================
   CHARACTER 9 — THE REBEL
   A punky skunk with a peace-sign patch and mohawk, chill smirk.
   =========================================================================== */
function RebelArt({ c }: { c: Character }) {
  const p = c.palette;
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Defs id="rebel" />
      <StickerBase id="rebel" shape="squircle" />

      {/* Skunk ears */}
      <path d="M84 80 C 80 50 100 30 116 38 C 124 44 122 70 110 86 Z" fill={p.accent2} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M196 80 C 200 50 180 30 164 38 C 156 44 158 70 170 86 Z" fill={p.accent2} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />

      {/* Head */}
      <path d="M64 160 C 64 110 100 84 140 84 C 180 84 216 110 216 160 C 216 208 184 232 140 232 C 96 232 64 208 64 160 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3.5" />

      {/* White skunk stripe down forehead */}
      <path d="M132 86 C 130 100 134 120 140 130 C 146 120 150 100 148 86" fill="#fdfaf3" stroke={OUTLINE} strokeWidth="2" />

      {/* Mohawk */}
      <path d="M124 60 L 130 30 L 140 56 L 150 30 L 156 60 C 152 76 144 84 140 84 C 136 84 128 76 124 60 Z" fill={p.accent} stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M134 46 L 138 38" stroke={OUTLINE} strokeWidth="2" />
      <path d="M144 46 L 148 38" stroke={OUTLINE} strokeWidth="2" />

      {/* Cool half-lidded eyes */}
      <path d="M100 142 Q 112 138 124 144" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="112" cy="148" rx="8" ry="6" fill={OUTLINE} />
      <circle cx="114" cy="146" r="2.2" fill="#fff" />
      <path d="M156 144 Q 168 138 180 142" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="168" cy="148" rx="8" ry="6" fill={OUTLINE} />
      <circle cx="170" cy="146" r="2.2" fill="#fff" />

      {/* Tiny nose */}
      <ellipse cx="140" cy="172" rx="5" ry="4" fill={OUTLINE} />
      {/* Smirk */}
      <path d="M126 192 Q 138 200 152 188" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      <Cheeks x={92} y={180} color={p.cheek} />

      {/* Peace-sign patch on cheek */}
      <g transform="translate(180 188) rotate(12)">
        <circle cx="0" cy="0" r="14" fill="#fdf3d8" stroke={OUTLINE} strokeWidth="2" />
        <line x1="0" y1="-8" x2="0" y2="8" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
        <line x1="0" y1="-2" x2="-6" y2="-8" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
        <line x1="0" y1="-2" x2="6" y2="-8" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Bandana / scarf */}
      <path d="M70 218 Q 140 244 210 218 L 210 230 Q 140 250 70 230 Z" fill={p.accent} stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="100" cy="232" r="2" fill="#fff" />
      <circle cx="140" cy="238" r="2" fill="#fff" />
      <circle cx="180" cy="232" r="2" fill="#fff" />

      {/* Sparkle accents */}
      <Sparkle x={52} y={108} size={5} color="#fff3a8" />
      <Sparkle x={228} y={110} size={4} color="#fff3a8" />
    </svg>
  );
}

/* ===========================================================================
   CHARACTER 10 — THE BULLY
   A tough hedgehog with crossed arms and a scowl.
   =========================================================================== */
function BullyArt({ c }: { c: Character }) {
  const p = c.palette;
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Defs id="bully" />
      <StickerBase id="bully" shape="round" />

      {/* Spiky hedgehog quills around head */}
      <g stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" fill={p.accent2}>
        <path d="M64 130 L 50 100 L 80 120 Z" />
        <path d="M58 100 L 50 70 L 84 96 Z" />
        <path d="M70 76 L 70 44 L 96 76 Z" />
        <path d="M96 56 L 100 28 L 116 60 Z" />
        <path d="M120 50 L 130 22 L 138 56 Z" />
        <path d="M148 50 L 158 22 L 162 56 Z" />
        <path d="M172 56 L 184 28 L 184 60 Z" />
        <path d="M196 76 L 210 44 L 210 80 Z" />
        <path d="M210 100 L 230 70 L 222 110 Z" />
        <path d="M216 130 L 232 110 L 222 142 Z" />
        <path d="M62 154 L 40 142 L 70 162 Z" />
        <path d="M218 156 L 240 142 L 224 170 Z" />
      </g>

      {/* Face (lighter than quills) */}
      <path d="M76 162 C 76 124 108 106 140 106 C 172 106 204 124 204 162 C 204 200 178 220 140 220 C 102 220 76 200 76 162 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3.5" />

      {/* Scowl brows */}
      <path d="M88 142 L 124 150" stroke={OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <path d="M156 150 L 192 142" stroke={OUTLINE} strokeWidth="4" strokeLinecap="round" />

      {/* Angry eyes */}
      <g>
        <ellipse cx="112" cy="162" rx="9" ry="10" fill={OUTLINE} />
        <circle cx="114" cy="160" r="3" fill="#fff" />
        <ellipse cx="168" cy="162" rx="9" ry="10" fill={OUTLINE} />
        <circle cx="170" cy="160" r="3" fill="#fff" />
      </g>

      {/* Tiny nose */}
      <ellipse cx="140" cy="184" rx="5" ry="4" fill={OUTLINE} />
      {/* Frown */}
      <path d="M124 204 Q 140 196 156 204" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      <Cheeks x={88} y={190} color={p.cheek} />

      {/* Crossed arms (a little leather jacket collar) */}
      <path d="M104 222 L 130 240 L 124 252" stroke={OUTLINE} strokeWidth="3" fill={p.accent} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M176 222 L 150 240 L 156 252" stroke={OUTLINE} strokeWidth="3" fill={p.accent} strokeLinecap="round" strokeLinejoin="round" />
      {/* jacket collar */}
      <path d="M86 218 L 116 224 L 116 240 L 86 240 Z" fill={p.accent} stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M194 218 L 164 224 L 164 240 L 194 240 Z" fill={p.accent} stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />

      {/* Lightning bolts to show edge */}
      <path d="M44 70 l 6 -2 l -4 8 l 8 -2" stroke={p.accent2} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M236 70 l -6 -2 l 4 8 l -8 -2" stroke={p.accent2} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ===========================================================================
   CHARACTER 11 — THE JUDGE
   A wise little owl with a tiny gavel and powdered wig curls.
   =========================================================================== */
function JudgeArt({ c }: { c: Character }) {
  const p = c.palette;
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Defs id="judge" />
      <StickerBase id="judge" shape="squircle" />

      {/* Big round owl body */}
      <ellipse cx="140" cy="170" rx="86" ry="86" fill={p.skin} stroke={OUTLINE} strokeWidth="3.5" />

      {/* Powdered wig curls around top */}
      <g fill="#fdfaf3" stroke={OUTLINE} strokeWidth="2.5">
        <circle cx="80" cy="100" r="16" />
        <circle cx="100" cy="80" r="16" />
        <circle cx="124" cy="70" r="16" />
        <circle cx="156" cy="70" r="16" />
        <circle cx="180" cy="80" r="16" />
        <circle cx="200" cy="100" r="16" />
      </g>
      {/* wig shadow */}
      <g fill={p.skinShadow} opacity="0.5">
        <circle cx="86" cy="106" r="6" />
        <circle cx="194" cy="106" r="6" />
        <circle cx="116" cy="84" r="6" />
        <circle cx="164" cy="84" r="6" />
        <circle cx="140" cy="78" r="6" />
      </g>

      {/* Owl face disk (brow ridge) */}
      <path d="M88 142 C 88 124 112 110 140 110 C 168 110 192 124 192 142 C 192 158 168 168 140 168 C 112 168 88 158 88 142 Z" fill={p.skinShadow} opacity="0.6" />

      {/* Big round spectacles eyes */}
      <circle cx="116" cy="142" r="18" fill="#fdfaf3" stroke={OUTLINE} strokeWidth="3" />
      <circle cx="164" cy="142" r="18" fill="#fdfaf3" stroke={OUTLINE} strokeWidth="3" />
      <line x1="134" y1="142" x2="146" y2="142" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      {/* tiny serious eyes inside */}
      <circle cx="116" cy="144" r="5" fill={OUTLINE} />
      <circle cx="164" cy="144" r="5" fill={OUTLINE} />
      <circle cx="118" cy="142" r="1.5" fill="#fff" />
      <circle cx="166" cy="142" r="1.5" fill="#fff" />

      {/* Stern brows above specs */}
      <path d="M100 118 L 130 122" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <path d="M150 122 L 180 118" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />

      {/* Beak */}
      <path d="M132 174 L 140 188 L 148 174 Z" fill={p.accent2} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M140 188 L 140 196" stroke={OUTLINE} strokeWidth="2" />

      {/* tiny straight mouth */}
      <line x1="132" y1="206" x2="148" y2="206" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" />

      {/* Tiny gavel */}
      <g transform="translate(216 200) rotate(35)">
        <rect x="0" y="0" width="26" height="10" rx="2" fill={p.accent} stroke={OUTLINE} strokeWidth="2" />
        <rect x="-4" y="-3" width="6" height="16" rx="1" fill={p.accent2} stroke={OUTLINE} strokeWidth="2" />
        <rect x="0" y="10" width="4" height="22" fill={p.accent2} stroke={OUTLINE} strokeWidth="2" />
      </g>

      {/* Wig curls sides */}
      <g fill="#fdfaf3" stroke={OUTLINE} strokeWidth="2.5">
        <circle cx="62" cy="158" r="14" />
        <circle cx="218" cy="158" r="14" />
        <circle cx="58" cy="184" r="12" />
        <circle cx="222" cy="184" r="12" />
      </g>

      {/* tiny spark */}
      <Sparkle x={48} y={120} size={4} color="#fff3a8" />
    </svg>
  );
}

/* ===========================================================================
   CHARACTER 12 — THE PROTECTOR
   A brave little lion cub with a shield and cape.
   =========================================================================== */
function ProtectorArt({ c }: { c: Character }) {
  const p = c.palette;
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Defs id="prot" />
      <StickerBase id="prot" shape="round" />

      {/* Cape */}
      <path d="M64 200 C 60 232 80 252 100 250 L 100 196 Z" fill={p.accent2} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M216 200 C 220 232 200 252 180 250 L 180 196 Z" fill={p.accent2} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />

      {/* Round lion ears */}
      <circle cx="92" cy="78" r="18" fill={p.accent2} stroke={OUTLINE} strokeWidth="3" />
      <circle cx="92" cy="78" r="9" fill={p.cheek} />
      <circle cx="188" cy="78" r="18" fill={p.accent2} stroke={OUTLINE} strokeWidth="3" />
      <circle cx="188" cy="78" r="9" fill={p.cheek} />

      {/* Mane tufts */}
      <g fill={p.accent} stroke={OUTLINE} strokeWidth="2.5">
        <circle cx="68" cy="100" r="14" />
        <circle cx="60" cy="130" r="12" />
        <circle cx="62" cy="160" r="14" />
        <circle cx="76" cy="190" r="12" />
        <circle cx="212" cy="100" r="14" />
        <circle cx="220" cy="130" r="12" />
        <circle cx="218" cy="160" r="14" />
        <circle cx="204" cy="190" r="12" />
        <circle cx="86" cy="62" r="12" />
        <circle cx="194" cy="62" r="12" />
        <circle cx="140" cy="50" r="14" />
      </g>

      {/* Head */}
      <path d="M70 160 C 70 110 100 86 140 86 C 180 86 210 110 210 160 C 210 206 180 228 140 228 C 100 228 70 206 70 160 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3.5" />

      {/* Lion snout */}
      <ellipse cx="140" cy="184" rx="28" ry="20" fill={p.skinShadow} opacity="0.5" />

      {/* Determined eyes */}
      <g>
        <ellipse cx="114" cy="148" rx="8" ry="9" fill={OUTLINE} />
        <circle cx="116" cy="146" r="2.6" fill="#fff" />
        <ellipse cx="166" cy="148" rx="8" ry="9" fill={OUTLINE} />
        <circle cx="168" cy="146" r="2.6" fill="#fff" />
      </g>
      <path d="M100 130 L 126 138" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <path d="M154 138 L 180 130" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />

      {/* Nose */}
      <path d="M134 170 L 140 176 L 146 170 Z" fill={OUTLINE} />
      <path d="M140 176 L 140 184" stroke={OUTLINE} strokeWidth="2" />
      {/* Brave smile */}
      <path d="M124 194 Q 140 204 156 194" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      <Cheeks x={94} y={180} color={p.cheek} />

      {/* Shield */}
      <g transform="translate(140 244)">
        <path d="M-28 -16 L 28 -16 L 28 4 C 28 18 14 26 0 28 C -14 26 -28 18 -28 4 Z" fill={p.accent} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
        <path d="M-28 -16 L 28 -16 L 28 -2 C 28 8 14 16 0 18 C -14 16 -28 8 -28 -2 Z" fill={p.accent2} />
        <path d="M-8 -8 L 0 4 L 8 -8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="0" cy="-2" r="2.5" fill="#fff" />
      </g>

      {/* Sparkles */}
      <Sparkle x={52} y={84} size={5} color="#fff3a8" />
      <Sparkle x={228} y={84} size={5} color="#fff3a8" />
    </svg>
  );
}

/* ===========================================================================
   CHARACTER 13 — THE SELF
   A glowing, peaceful figure radiating warmth and light.
   =========================================================================== */
function SelfArt({ c }: { c: Character }) {
  const p = c.palette;
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Defs id="self" />
      <StickerBase id="self" shape="round" />

      {/* Soft glow halo */}
      <g opacity="0.55">
        <circle cx="140" cy="150" r="110" fill="url(#selfGlow)" />
        <defs>
          <radialGradient id="selfGlow">
            <stop offset="0%" stopColor="#fde6b8" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#fde6b8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fde6b8" stopOpacity="0" />
          </radialGradient>
        </defs>
      </g>

      {/* Sun-rays around head */}
      <g stroke={p.accent2} strokeWidth="3" strokeLinecap="round" fill="none">
        <line x1="140" y1="20" x2="140" y2="40" />
        <line x1="60" y1="60" x2="74" y2="74" />
        <line x1="220" y1="60" x2="206" y2="74" />
        <line x1="34" y1="120" x2="54" y2="124" />
        <line x1="246" y1="120" x2="226" y2="124" />
        <line x1="48" y1="180" x2="64" y2="174" />
        <line x1="232" y1="180" x2="216" y2="174" />
        <line x1="100" y1="32" x2="106" y2="50" />
        <line x1="180" y1="32" x2="174" y2="50" />
      </g>

      {/* Head */}
      <path d="M76 156 C 76 112 104 90 140 90 C 176 90 204 112 204 156 C 204 200 178 224 140 224 C 102 224 76 200 76 156 Z" fill={p.skin} stroke={OUTLINE} strokeWidth="3.5" />

      {/* Hair — soft flowing */}
      <path d="M84 110 C 96 78 116 70 130 80 C 138 70 152 70 160 82 C 170 70 192 80 200 110 C 196 102 184 96 174 100 C 174 90 162 86 154 96 C 148 84 132 84 126 96 C 120 86 108 90 108 100 C 100 96 88 102 84 110 Z" fill={p.accent} stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />

      {/* Closed peaceful eyes (curved lines) */}
      <path d="M104 148 Q 114 142 124 148" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M156 148 Q 166 142 176 148" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M106 152 l 4 2" stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M170 152 l 4 2" stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" />

      {/* Serene smile */}
      <path d="M126 178 Q 140 188 154 178" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      <Cheeks x={94} y={172} color={p.cheek} />

      {/* Heart on chest */}
      <g transform="translate(140 218)">
        <ellipse cx="0" cy="0" rx="34" ry="22" fill="#fff" opacity="0.5" />
        <path d="M0 6 C -10 -6 -22 0 -12 10 L 0 22 L 12 10 C 22 0 10 -6 0 6 Z" fill="#f48aa4" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
        <path d="M-4 4 Q 0 0 4 4" stroke="#fff" strokeWidth="1.5" fill="none" />
      </g>

      {/* Floating sparkles */}
      <Sparkle x={48} y={64} size={6} color="#fff3a8" />
      <Sparkle x={232} y={64} size={6} color="#fff3a8" />
      <Sparkle x={40} y={210} size={5} color="#fff3a8" />
      <Sparkle x={240} y={210} size={5} color="#fff3a8" />
      <Sparkle x={220} y={142} size={4} color="#fff3a8" />
      <Sparkle x={60} y={142} size={4} color="#fff3a8" />
    </svg>
  );
}

/* ===========================================================================
   Switch
   =========================================================================== */
type Renderer = (props: { c: Character }) => ReactElement;
const RENDERERS: Record<string, Renderer> = {
  "inner-critic": InnerCriticArt,
  perfectionist: PerfectionistArt,
  pleaser: PleaserArt,
  controller: ControllerArt,
  taskmaster: TaskmasterArt,
  "inner-child": InnerChildArt,
  "wounded-one": WoundedOneArt,
  firefighter: FirefighterArt,
  rebel: RebelArt,
  bully: BullyArt,
  judge: JudgeArt,
  protector: ProtectorArt,
  self: SelfArt,
};

export default function PartArt({ character }: { character: Character }) {
  const Renderer = RENDERERS[character.id];
  return <div className="aspect-square w-full">{Renderer ? <Renderer c={character} /> : null}</div>;
}
