import { useId, useMemo } from "react";
import { darkHex, getPlushTexture, warmHex } from "./plushTexture";
import type {
  BodyShape, EyeStyle, Facewear, Headgear, MouthStyle, Traits,
} from "./traits";

const INK = "#16161c";

export type FaceLayout = {
  left: [number, number];
  right: [number, number];
  eyeR: number;
  oval: [number, number];
  mouth: [number, number];
  cheeks: [[number, number], [number, number]];
  beret: { x: number; y: number; rot: number };
  glassesY: number;
  bow: [number, number];
  topY: number;
  shadow: { cy: number; rx: number; ry: number };
};

export const LAYOUT: Record<BodyShape, FaceLayout> = {
  cloud: {
    left: [184, 230],
    right: [216, 230],
    eyeR: 15,
    oval: [6.2, 11],
    mouth: [200, 266],
    cheeks: [[156, 250], [244, 250]],
    beret: { x: 146, y: 136, rot: -26 },
    glassesY: 230,
    bow: [200, 314],
    topY: 128,
    shadow: { cy: 392, rx: 112, ry: 16 },
  },
  frog: {
    left: [148, 148],
    right: [252, 148],
    eyeR: 38,
    oval: [9, 14],
    mouth: [200, 272],
    cheeks: [[150, 252], [250, 252]],
    beret: { x: 168, y: 96, rot: -16 },
    glassesY: 178,
    bow: [200, 322],
    topY: 96,
    shadow: { cy: 398, rx: 122, ry: 16 },
  },
  triangle: {
    left: [174, 242],
    right: [226, 242],
    eyeR: 16,
    oval: [7, 11],
    mouth: [200, 284],
    cheeks: [[160, 268], [240, 268]],
    beret: { x: 178, y: 102, rot: -12 },
    glassesY: 244,
    bow: [200, 336],
    topY: 100,
    shadow: { cy: 400, rx: 102, ry: 15 },
  },
  heart: {
    left: [166, 208],
    right: [234, 208],
    eyeR: 17,
    oval: [7, 11],
    mouth: [200, 256],
    cheeks: [[148, 236], [252, 236]],
    beret: { x: 166, y: 100, rot: -18 },
    glassesY: 208,
    bow: [200, 322],
    topY: 90,
    shadow: { cy: 398, rx: 114, ry: 16 },
  },
  bean: {
    left: [176, 226],
    right: [224, 226],
    eyeR: 16,
    oval: [7, 11],
    mouth: [200, 264],
    cheeks: [[156, 248], [244, 248]],
    beret: { x: 160, y: 114, rot: -20 },
    glassesY: 226,
    bow: [200, 314],
    topY: 108,
    shadow: { cy: 394, rx: 98, ry: 15 },
  },
  egg: {
    left: [176, 220],
    right: [224, 220],
    eyeR: 16,
    oval: [7, 11],
    mouth: [200, 260],
    cheeks: [[156, 246], [244, 246]],
    beret: { x: 168, y: 102, rot: -16 },
    glassesY: 220,
    bow: [200, 322],
    topY: 96,
    shadow: { cy: 396, rx: 90, ry: 14 },
  },
};

export function bodyPath(shape: BodyShape): string {
  switch (shape) {
    case "cloud":
      return "M88 252 C78 208 104 176 146 172 C148 128 186 108 224 136 C250 108 308 118 322 164 C360 172 374 218 350 258 C372 304 348 352 296 362 C260 392 144 390 108 360 C64 348 54 296 88 252 Z";
    case "frog":
      return "M78 286 C66 228 92 204 132 194 C128 142 164 114 200 128 C236 114 272 142 268 194 C308 204 336 228 322 286 C336 344 278 376 200 380 C122 376 66 344 78 286 Z";
    case "triangle":
      return "M200 96 C238 102 286 214 326 344 C318 384 82 384 74 344 C114 214 162 102 200 96 Z";
    case "heart":
      return "M200 358 C200 358 58 252 72 172 C84 104 156 96 200 162 C244 96 316 104 328 172 C342 252 200 358 200 358 Z";
    case "bean":
      return "M148 132 C92 148 78 250 118 328 C154 378 262 372 304 312 C348 248 328 148 254 122 C206 108 176 114 148 132 Z";
    case "egg":
      return "M200 108 C258 108 304 176 304 250 C304 336 258 378 200 378 C142 378 96 336 96 250 C96 176 142 108 200 108 Z";
  }
}

function FuzzFringe({ shape, color }: { shape: BodyShape; color: string }) {
  const ellipses: Record<BodyShape, { cx: number; cy: number; rx: number; ry: number }[]> = {
    cloud: [
      { cx: 200, cy: 255, rx: 122, ry: 102 },
      { cx: 148, cy: 210, rx: 72, ry: 68 },
      { cx: 262, cy: 212, rx: 74, ry: 66 },
    ],
    frog: [
      { cx: 200, cy: 278, rx: 132, ry: 96 },
      { cx: 136, cy: 178, rx: 52, ry: 50 },
      { cx: 264, cy: 178, rx: 52, ry: 50 },
    ],
    triangle: [{ cx: 200, cy: 250, rx: 118, ry: 148 }],
    heart: [
      { cx: 200, cy: 250, rx: 128, ry: 118 },
      { cx: 150, cy: 178, rx: 70, ry: 62 },
      { cx: 250, cy: 178, rx: 70, ry: 62 },
    ],
    bean: [{ cx: 205, cy: 248, rx: 112, ry: 128 }],
    egg: [{ cx: 200, cy: 248, rx: 104, ry: 138 }],
  };
  const fibers: { x1: number; y1: number; x2: number; y2: number; w: number; o: number }[] = [];
  ellipses[shape].forEach((el, ei) => {
    const n = ei === 0 ? 70 : 36;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ei * 0.17;
      const x = el.cx + Math.cos(a) * el.rx;
      const y = el.cy + Math.sin(a) * el.ry;
      const len = 4 + ((i * 13 + ei * 7) % 7);
      fibers.push({
        x1: x,
        y1: y,
        x2: x + Math.cos(a) * len,
        y2: y + Math.sin(a) * len,
        w: 1.1 + (i % 3) * 0.4,
        o: 0.28 + (i % 5) * 0.08,
      });
    }
  });
  return (
    <g stroke={color} strokeLinecap="round" fill="none">
      {fibers.map((f, i) => (
        <line key={i} x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} strokeWidth={f.w} opacity={f.o} />
      ))}
    </g>
  );
}

function BodyFill({
  shape, color, uid, lite = false,
}: { shape: BodyShape; color: string; uid: string; lite?: boolean }) {
  const d = bodyPath(shape);
  const warm = warmHex(color, 22);
  const dark = darkHex(color, 48);
  return (
    <g>
      {!lite && <FuzzFringe shape={shape} color={color} />}
      <path
        d={d}
        fill={dark}
        opacity={0.5}
        filter={`url(#${uid}-fuzzedge)`}
        transform="translate(0 4) scale(1.04)"
        style={{ transformOrigin: "200px 250px" }}
      />
      <path d={d} fill={`url(#${uid}-plush)`} filter={`url(#${uid}-fuzz)`} />
      <g clipPath={`url(#${uid}-clip)`}>
        <rect width="400" height="460" fill={`url(#${uid}-volume)`} style={{ mixBlendMode: "soft-light" }} />
        <ellipse cx="158" cy="176" rx="96" ry="74" fill={warm} opacity={0.32} filter={`url(#${uid}-blur)`} />
        <ellipse cx="200" cy="348" rx="128" ry="74" fill="#000" opacity={0.2} filter={`url(#${uid}-blur)`} />
        <ellipse cx="144" cy="160" rx="42" ry="24" fill="#fff" opacity={0.26} filter={`url(#${uid}-blur)`} />
        <rect width="400" height="460" fill={`url(#${uid}-sheen)`} opacity={0.4} style={{ mixBlendMode: "overlay" }} />
      </g>
      <path
        d={d}
        fill="none"
        stroke={dark}
        strokeWidth={11}
        opacity={0.16}
        filter={`url(#${uid}-blur)`}
      />
    </g>
  );
}

function Eyes({
  style, layout, dead, look, hide,
}: {
  style: EyeStyle;
  layout: FaceLayout;
  dead?: boolean;
  look: { x: number; y: number };
  hide?: boolean;
}) {
  if (hide) return null;
  const [lx, ly] = layout.left;
  const [rx, ry] = layout.right;

  if (dead) {
    return (
      <g stroke={INK} strokeWidth={5.5} strokeLinecap="round">
        <line x1={lx - 10} y1={ly - 10} x2={lx + 10} y2={ly + 10} />
        <line x1={lx + 10} y1={ly - 10} x2={lx - 10} y2={ly + 10} />
        <line x1={rx - 10} y1={ry - 10} x2={rx + 10} y2={ry + 10} />
        <line x1={rx + 10} y1={ry - 10} x2={rx - 10} y2={ry + 10} />
      </g>
    );
  }

  if (style === "closed") {
    return (
      <g stroke={INK} strokeWidth={6.5} strokeLinecap="round" fill="none">
        <path d={`M${lx - 14} ${ly + 4} Q${lx} ${ly - 12} ${lx + 14} ${ly + 4}`} />
        <path d={`M${rx - 14} ${ry + 4} Q${rx} ${ry - 12} ${rx + 14} ${ry + 4}`} />
      </g>
    );
  }

  if (style === "wink") {
    return (
      <g>
        <OvalEye x={lx} y={ly} rx={layout.oval[0]} ry={layout.oval[1]} />
        <path
          d={`M${rx - 14} ${ry + 3} Q${rx} ${ry - 11} ${rx + 14} ${ry + 3}`}
          stroke={INK}
          strokeWidth={6.5}
          strokeLinecap="round"
          fill="none"
        />
      </g>
    );
  }

  if (style === "tiny") {
    return (
      <g fill={INK}>
        <ellipse cx={lx} cy={ly} rx={4.2} ry={6.5} />
        <ellipse cx={rx} cy={ry} rx={4.2} ry={6.5} />
      </g>
    );
  }

  if (style === "googly") {
    const r = layout.eyeR;
    return (
      <g>
        <Googly x={lx} y={ly} r={r} look={look} />
        <Googly x={rx} y={ry} r={r} look={look} />
      </g>
    );
  }

  // ovals
  return (
    <g>
      <OvalEye x={lx} y={ly} rx={layout.oval[0]} ry={layout.oval[1]} />
      <OvalEye x={rx} y={ry} rx={layout.oval[0]} ry={layout.oval[1]} />
    </g>
  );
}

function OvalEye({ x, y, rx, ry }: { x: number; y: number; rx: number; ry: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y + 1.4} rx={rx} ry={ry} fill="rgba(0,0,0,0.18)" />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={INK} />
      <ellipse cx={x - rx * 0.28} cy={y - ry * 0.28} rx={rx * 0.28} ry={ry * 0.22} fill="#fff" opacity={0.55} />
    </g>
  );
}

function Googly({
  x, y, r, look,
}: { x: number; y: number; r: number; look: { x: number; y: number } }) {
  const px = look.x * r * 0.28;
  const py = look.y * r * 0.28;
  const pr = r * 0.42;
  return (
    <g>
      <ellipse cx={x} cy={y + r * 0.14} rx={r * 1.02} ry={r * 0.96} fill="rgba(0,0,0,0.2)" />
      <circle cx={x} cy={y} r={r + 3.5} fill="#efece6" />
      <circle cx={x} cy={y} r={r} fill="#fbfbf8" />
      <circle cx={x} cy={y} r={r} fill="url(#googly-vol)" />
      <circle cx={x} cy={y} r={r + 3.5} fill="none" stroke="rgba(20,20,24,0.12)" strokeWidth={1.1} />
      <circle cx={x + px} cy={y + py} r={pr} fill={INK} />
      <circle cx={x + px - pr * 0.32} cy={y + py - pr * 0.32} r={pr * 0.28} fill="#fff" opacity={0.7} />
      <ellipse cx={x - r * 0.32} cy={y - r * 0.38} rx={r * 0.34} ry={r * 0.2} fill="#fff" opacity={0.55} />
    </g>
  );
}

function Mouth({ style, x, y }: { style: MouthStyle; x: number; y: number }) {
  if (style === "none") return null;
  if (style === "smile") {
    return <path d={`M${x - 16} ${y} Q${x} ${y + 16} ${x + 16} ${y}`} stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />;
  }
  if (style === "o") {
    return <ellipse cx={x} cy={y} rx={8} ry={10} fill="#5a2422" />;
  }
  if (style === "flat") {
    return <line x1={x - 12} y1={y} x2={x + 12} y2={y} stroke={INK} strokeWidth={5} strokeLinecap="round" />;
  }
  return (
    <g>
      <path d={`M${x - 18} ${y - 2} Q${x} ${y + 18} ${x + 18} ${y - 2} Z`} fill="#5a2422" />
      <ellipse cx={x} cy={y + 8} rx={8} ry={4} fill="#ef6b86" />
    </g>
  );
}

function HeadPiece({ style, layout, color }: { style: Headgear; layout: FaceLayout; color: string }) {
  if (style === "none") return null;
  const { x, y, rot } = layout.beret;

  if (style === "beret") {
    return (
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        <ellipse cx="10" cy="22" rx="70" ry="18" fill="rgba(0,0,0,0.25)" />
        <ellipse cx="2" cy="12" rx="74" ry="22" fill="#1c1c22" />
        <ellipse cx="-6" cy="-2" rx="60" ry="26" fill="#111116" />
        <ellipse cx="-6" cy="-2" rx="60" ry="26" fill="url(#felt-sheen)" />
        <ellipse cx="-20" cy="-8" rx="24" ry="9" fill="rgba(255,255,255,0.12)" />
        <rect x="-2" y="-32" width="7" height="18" rx="3.5" fill="#1a1a1f" transform="rotate(-28)" />
        <circle cx="-10" cy="-30" r="4" fill="#1a1a1f" />
      </g>
    );
  }

  if (style === "halo") {
    return (
      <g transform={`translate(200 ${layout.topY - 18})`}>
        <ellipse cx="0" cy="0" rx="44" ry="12" fill="none" stroke="#FFD000" strokeWidth="9" />
        <ellipse cx="0" cy="0" rx="44" ry="12" fill="none" stroke="#fff3a0" strokeWidth="3" opacity={0.7} />
      </g>
    );
  }

  if (style === "horns") {
    return (
      <g fill={color} stroke={darkHex(color, 30)} strokeWidth={2}>
        <path d={`M${layout.left[0] - 8} ${layout.topY + 18} Q${layout.left[0] - 28} ${layout.topY - 28} ${layout.left[0] - 6} ${layout.topY - 36} Q${layout.left[0] + 4} ${layout.topY - 8} ${layout.left[0] + 6} ${layout.topY + 16} Z`} />
        <path d={`M${layout.right[0] + 8} ${layout.topY + 18} Q${layout.right[0] + 28} ${layout.topY - 28} ${layout.right[0] + 6} ${layout.topY - 36} Q${layout.right[0] - 4} ${layout.topY - 8} ${layout.right[0] - 6} ${layout.topY + 16} Z`} />
      </g>
    );
  }

  // party hat
  return (
    <g transform={`translate(200 ${layout.topY + 8}) rotate(-12)`}>
      <polygon points="0,-78 46,18 -46,18" fill="#FF3B4E" />
      <polygon points="0,-78 46,18 -46,18" fill="url(#party-stripe)" />
      <ellipse cx="0" cy="18" rx="48" ry="10" fill="#FF3B4E" />
      <circle cx="0" cy="-80" r="8" fill="#FFD000" />
    </g>
  );
}

function FacePiece({ style, layout }: { style: Facewear; layout: FaceLayout }) {
  if (style === "none") return null;
  const y = layout.glassesY;
  const [lx] = layout.left;
  const [rx] = layout.right;
  const mid = (lx + rx) / 2;
  const r = Math.max(22, (rx - lx) * 0.48);

  if (style === "glasses") {
    return (
      <g fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round">
        <circle cx={lx} cy={y} r={r} />
        <circle cx={rx} cy={y} r={r} />
        <path d={`M${lx + r} ${y} Q${mid} ${y - 6} ${rx - r} ${y}`} strokeWidth={6} />
        <circle cx={lx} cy={y} r={r} fill="rgba(180,210,230,0.12)" stroke="none" />
        <circle cx={rx} cy={y} r={r} fill="rgba(180,210,230,0.12)" stroke="none" />
      </g>
    );
  }

  // shades
  return (
    <g>
      <ellipse cx={lx} cy={y + 3} rx={r * 0.98} ry={r * 0.9} fill="rgba(0,0,0,0.2)" />
      <ellipse cx={rx} cy={y + 3} rx={r * 0.98} ry={r * 0.9} fill="rgba(0,0,0,0.2)" />
      <circle cx={lx} cy={y} r={r} fill="#141416" />
      <circle cx={rx} cy={y} r={r} fill="#141416" />
      <path d={`M${lx + r} ${y} Q${mid} ${y - 4} ${rx - r} ${y}`} stroke="#141416" strokeWidth={7} fill="none" />
      <ellipse cx={lx - r * 0.28} cy={y - r * 0.28} rx={r * 0.32} ry={r * 0.16} fill="rgba(255,255,255,0.16)" />
      <ellipse cx={rx - r * 0.28} cy={y - r * 0.28} rx={r * 0.32} ry={r * 0.16} fill="rgba(255,255,255,0.16)" />
    </g>
  );
}

function BowTie({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-8 0 L-36 -16 L-36 16 Z" fill={INK} />
      <path d="M8 0 L36 -16 L36 16 Z" fill={INK} />
      <rect x="-9" y="-9" width="18" height="18" rx="5" fill="#0d0d10" />
      <rect x="-7" y="-6" width="14" height="5" rx="2" fill="rgba(255,255,255,0.12)" />
    </g>
  );
}

export function Character({
  traits,
  dead = false,
  showShadow = true,
  look = { x: 0, y: 0 },
  lite = false,
  textured = true,
  className,
}: {
  traits: Traits;
  dead?: boolean;
  showShadow?: boolean;
  look?: { x: number; y: number };
  lite?: boolean;
  /** Skip the procedural 16k-fiber canvas for reduced-cost map textures. */
  textured?: boolean;
  className?: string;
}) {
  const rawId = useId();
  const uid = useMemo(() => rawId.replace(/[^a-zA-Z0-9]/g, ""), [rawId]);
  const { shape, color } = traits;
  const layout = LAYOUT[shape];
  const tex = textured && typeof document !== "undefined" ? getPlushTexture(color) : "";
  const hideEyes = traits.face === "shades" && !dead;

  return (
    <svg viewBox="0 0 400 460" className={className} aria-label="plush character" overflow="visible">
      <defs>
        <pattern id={`${uid}-plush`} patternUnits="userSpaceOnUse" width="256" height="256">
          {tex ? (
            <image href={tex} width="256" height="256" preserveAspectRatio="none" />
          ) : (
            <rect width="256" height="256" fill={color} />
          )}
        </pattern>
        <radialGradient id={`${uid}-volume`} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
        </radialGradient>
        <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>
        <filter id={`${uid}-fuzz`} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`${uid}-fuzzedge`} x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="3" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
        <filter id={`${uid}-blur`}>
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${uid}-shadow`}>
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <clipPath id={`${uid}-clip`}>
          <path d={bodyPath(shape)} />
        </clipPath>
        <radialGradient id="googly-vol" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#e8e8e4" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#c9c9c4" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id="felt-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
        <pattern id="party-stripe" patternUnits="userSpaceOnUse" width="18" height="18" patternTransform="rotate(28)">
          <rect width="18" height="18" fill="#FF3B4E" />
          <rect width="9" height="18" fill="#FFD000" />
        </pattern>
      </defs>

      {showShadow && (
        <ellipse
          cx={200}
          cy={layout.shadow.cy}
          rx={layout.shadow.rx}
          ry={layout.shadow.ry}
          fill="#000"
          opacity={0.28}
          filter={`url(#${uid}-shadow)`}
        />
      )}

      {traits.head === "horns" && <HeadPiece style={traits.head} layout={layout} color={color} />}

      <BodyFill shape={shape} color={color} uid={uid} lite={lite} />

      {traits.cheeks && (
        <g fill="#FF8FAB" opacity={0.55} filter={`url(#${uid}-blur)`}>
          <ellipse cx={layout.cheeks[0][0]} cy={layout.cheeks[0][1]} rx={16} ry={9} />
          <ellipse cx={layout.cheeks[1][0]} cy={layout.cheeks[1][1]} rx={16} ry={9} />
        </g>
      )}

      <Eyes style={traits.eyes} layout={layout} dead={dead} look={look} hide={hideEyes} />
      <Mouth style={dead ? "o" : traits.mouth} x={layout.mouth[0]} y={layout.mouth[1]} />
      <FacePiece style={traits.face} layout={layout} />
      {traits.bow && <BowTie x={layout.bow[0]} y={layout.bow[1]} />}
      {traits.head !== "horns" && <HeadPiece style={traits.head} layout={layout} color={color} />}
    </svg>
  );
}

/* ── mini icons for the customizer ── */

export function ShapeIcon({ shape, className }: { shape: BodyShape; className?: string }) {
  return (
    <svg viewBox="70 90 260 300" className={className} fill="currentColor">
      <path d={bodyPath(shape)} />
    </svg>
  );
}

export function EyesIcon({ style, className }: { style: EyeStyle; className?: string }) {
  const dummy: FaceLayout = {
    ...LAYOUT.cloud,
    left: [12, 14],
    right: [36, 14],
    eyeR: 8,
    oval: [3.5, 5.5],
  };
  return (
    <svg viewBox="0 0 48 28" className={className}>
      <Eyes style={style} layout={dummy} look={{ x: 0.2, y: 0.1 }} />
    </svg>
  );
}

export function MouthIcon({ style, className }: { style: MouthStyle; className?: string }) {
  return (
    <svg viewBox="0 0 40 28" className={className}>
      <Mouth style={style} x={20} y={14} />
      {style === "none" && (
        <path d="M10 10 L30 18 M30 10 L10 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function HeadIcon({ style, className }: { style: Headgear; className?: string }) {
  const inner = (() => {
    switch (style) {
      case "none":
        return <path d="M8 8 L24 24 M24 8 L8 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />;
      case "beret":
        return (
          <g fill="currentColor">
            <ellipse cx="16" cy="20" rx="12" ry="4" />
            <ellipse cx="15" cy="16" rx="10" ry="6" />
            <rect x="13" y="8" width="2.2" height="6" rx="1" transform="rotate(-20 14 11)" />
          </g>
        );
      case "halo":
        return <ellipse cx="16" cy="14" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="2.6" />;
      case "horns":
        return (
          <path
            d="M10 22 Q6 8 12 6 M22 22 Q26 8 20 6"
            stroke="currentColor"
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
          />
        );
      case "party":
        return <polygon points="16,4 26,24 6,24" fill="currentColor" />;
    }
  })();
  return <svg viewBox="0 0 32 32" className={className}>{inner}</svg>;
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
