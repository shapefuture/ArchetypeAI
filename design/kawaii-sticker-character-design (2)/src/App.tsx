import { useMemo, useState } from "react";
import {
  CHARACTERS,
  CATEGORY_META,
  OPENING_ORDER,
  type Category,
  type Character,
} from "./data/ifsData";
import PartArt from "./characters/Parts";
import PartSpread from "./components/PartSpread";
import {
  CategoryGlyph,
  DoodleArrow,
  DoodleCloud,
  DoodleLoop,
  DoodleSpiral,
  DoodleStar,
  INK,
} from "./components/Doodles";

/** Staggered index rotation for polaroids */
const POLAROID_ROTS = [-2.2, 1.6, -1.2, 2.4, -1.8, 0.8, -2.6, 1.9, -0.9, 2.1, -1.4, 0.6, -2.0];

export default function App() {
  const [activeCat, setActiveCat] = useState<Category | "All">("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [opened, setOpened] = useState<Set<string>>(new Set());

  const ordered = useMemo(() => {
    if (activeCat === "All") {
      // Always show the curated opening order when "All" is selected
      const map = new Map(CHARACTERS.map((c) => [c.id, c]));
      return OPENING_ORDER.map((id) => map.get(id)!).filter(Boolean);
    }
    return CHARACTERS.filter((c) => c.category === activeCat);
  }, [activeCat]);

  const openChar = useMemo(
    () => (openId ? CHARACTERS.find((c) => c.id === openId) || null : null),
    [openId],
  );

  const openIndex = openChar
    ? CHARACTERS.findIndex((c) => c.id === openChar.id)
    : -1;

  const goPrev = () => {
    if (!openChar) return;
    const idx = CHARACTERS.findIndex((c) => c.id === openChar.id);
    if (idx > 0) setOpenId(CHARACTERS[idx - 1].id);
  };
  const goNext = () => {
    if (!openChar) return;
    const idx = CHARACTERS.findIndex((c) => c.id === openChar.id);
    if (idx < CHARACTERS.length - 1) setOpenId(CHARACTERS[idx + 1].id);
  };

  const onPick = (c: Character) => {
    setOpenId(c.id);
    setOpened((prev) => {
      if (prev.has(c.id)) return prev;
      const n = new Set(prev);
      n.add(c.id);
      return n;
    });
  };

  return (
    <div className="paper min-h-screen text-stone-800">
      {/* =========================== COVER =========================== */}
      <CoverHero
        totalParts={CHARACTERS.length}
        discovered={opened.size}
        onSurprise={() => {
          const remaining = CHARACTERS.filter((c) => !opened.has(c.id));
          const pool = remaining.length ? remaining : CHARACTERS;
          const pick = pool[Math.floor(Math.random() * pool.length)];
          onPick(pick);
        }}
      />

      {/* =========================== RING BINDER LEDGE =========================== */}
      <RingBinder />

      {/* =========================== INTRODUCTION PAGE =========================== */}
      <IntroPage />

      {/* =========================== TABLE OF CONTENTS =========================== */}
      <TableOfContents
        onPick={onPick}
        activeCat={activeCat}
        setActiveCat={setActiveCat}
        opened={opened}
      />

      {/* =========================== THE JOURNAL PAGES =========================== */}
      <JournalPages
        ordered={ordered}
        onPick={onPick}
        activeCat={activeCat}
        opened={opened}
      />


      {/* =========================== COLOPHON =========================== */}
      <Colophon />

      {/* =========================== SPREAD =========================== */}
      {openChar && (
        <PartSpread
          character={openChar}
          onClose={() => setOpenId(null)}
          onPrev={openIndex > 0 ? goPrev : undefined}
          onNext={openIndex < CHARACTERS.length - 1 ? goNext : undefined}
          position={{ current: openIndex + 1, total: CHARACTERS.length }}
        />
      )}
    </div>
  );
}

/* ===========================================================================
   1. COVER HERO
   =========================================================================== */
function CoverHero({ totalParts, discovered, onSurprise }: { totalParts: number; discovered: number; onSurprise: () => void }) {
  return (
    <section className="relative overflow-hidden pt-10 sm:pt-16 pb-20">
      {/* light from top-left */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_22%_8%,rgba(255,247,232,0.85),transparent_60%)]" />

      <div className="relative max-w-5xl mx-auto px-5 sm:px-10">
        <div className="flex flex-col items-center text-center">
          {/* Hand-drawn ink logo */}
          <LogoMark />

          <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-stone-500">
            a hand-bound field guide &nbsp;·&nbsp; vol. i
          </p>

          <h1
            className="mt-5 text-stone-800 font-bold"
            style={{ fontFamily: "'Caveat', cursive", fontSize: "clamp(3.6rem, 9vw, 6.4rem)", lineHeight: 0.92 }}
          >
            Meet your<br />
            <span className="relative inline-block">
              <span className="relative z-10">inner family</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 18" fill="none" preserveAspectRatio="none">
                <path d="M2 10 Q 60 4 130 8 T 260 8 T 398 6" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-stone-600 text-lg leading-relaxed">
            Inside every person lives a whole cast of characters — managers, exiles, firefighters, and a quiet Self that
            has been watching over them all. This is their field guide.
          </p>

          {/* Meta line — discovered / total */}
          <div className="mt-8 flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-stone-500">
            <span className="h-px w-10 bg-stone-400" />
            <span>
              <span className="font-hand text-stone-800 text-2xl pt-0.5 align-middle" style={{ lineHeight: 0 }}>{String(discovered).padStart(2, "0")}</span>
              <span className="mx-2 text-stone-400">/</span>
              <span className="font-hand text-stone-500 text-2xl pt-0.5 align-middle" style={{ lineHeight: 0 }}>{String(totalParts).padStart(2, "0")}</span>
              <span className="ml-2">parts met</span>
            </span>
            <span className="h-px w-10 bg-stone-400" />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onSurprise}
              className="group relative inline-flex items-center gap-2.5 rounded-full bg-stone-800 text-[#fdf7e7] px-5 py-3 text-sm font-semibold tracking-wide shadow-[0_10px_25px_-10px_rgba(43,29,18,0.5)] transition hover:translate-y-[-2px] hover:shadow-[0_18px_35px_-12px_rgba(43,29,18,0.55)]"
            >
              <span className="text-base">🎲</span>
              <span>Open a random part</span>
              <svg className="opacity-60 group-hover:translate-x-1 transition" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
            <a
              href="#toc"
              className="inline-flex items-center gap-2 rounded-full bg-[#fdf7e7] text-stone-700 px-5 py-3 text-sm font-semibold ring-1 ring-stone-300/70 transition hover:ring-stone-500"
            >
              <span>Read the contents</span>
            </a>
          </div>
        </div>

        {/* corner doodles */}
        <DoodleSpiral className="absolute top-6 left-2 w-16 h-16 drift hidden md:block" style={{ ["--rot" as string]: "-14deg" } as React.CSSProperties} />
        <DoodleCloud className="absolute top-20 right-2 w-24 h-16 drift hidden md:block" style={{ ["--rot" as string]: "6deg", animationDelay: "1.2s" } as React.CSSProperties} />
        <DoodleStar className="absolute bottom-6 left-8 w-7 h-7 drift hidden md:block" style={{ ["--rot" as string]: "12deg", animationDelay: "0.6s" } as React.CSSProperties} />
        <DoodleStar className="absolute bottom-12 right-12 w-5 h-5 drift hidden md:block" style={{ ["--rot" as string]: "-20deg", animationDelay: "1.8s" } as React.CSSProperties} />
      </div>
    </section>
  );
}

function LogoMark() {
  return (
    <div className="relative">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        {/* three nested hand-drawn circles, slightly off */}
        <circle cx="32" cy="32" r="26" stroke={INK} strokeWidth="1.6" fill="none" />
        <circle cx="32" cy="32" r="20" stroke={INK} strokeWidth="1.4" fill="none" strokeDasharray="2 4" />
        {/* the 4 family marks inside */}
        <g stroke={INK} strokeWidth="1.4" strokeLinecap="round" fill="none">
          <path d="M16 32 L 22 26 L 28 32" />
          <path d="M36 32 L 42 26 L 48 32" />
        </g>
        <circle cx="32" cy="38" r="3.2" fill={INK} />
        <path d="M28 44 Q 32 47 36 44" stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ===========================================================================
   2. RING BINDER — the visual transition between cover and contents
   =========================================================================== */
function RingBinder() {
  return (
    <div className="relative max-w-5xl mx-auto px-5 sm:px-10">
      <div className="relative h-7 rounded-md bg-[#ecdfc5] ring-1 ring-stone-300/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center gap-9 overflow-hidden">
        {Array.from({ length: 28 }).map((_, i) => (
          <span key={i} className="block h-5 w-1.5 rounded-full bg-stone-700/35 ring-1 ring-stone-800/10" />
        ))}
      </div>
    </div>
  );
}

/* ===========================================================================
   3. INTRO PAGE — an editor's note
   =========================================================================== */
function IntroPage() {
  return (
    <section className="relative max-w-3xl mx-auto px-5 sm:px-10 pt-16 sm:pt-24 pb-12">
      <div className="rounded-[26px] bg-[#fdf7e7] ring-1 ring-stone-300/50 p-7 sm:p-12 shadow-[0_30px_60px_-30px_rgba(43,29,18,0.18)] relative">
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-stone-500">
          <DoodleLoop className="w-12 h-5" />
          <span>an editor's note</span>
        </div>
        <h2
          className="mt-4 text-stone-800"
          style={{ fontFamily: "'Caveat', cursive", fontSize: "clamp(2.2rem, 4vw, 3.2rem)", lineHeight: 1 }}
        >
          Before you open the first page —
        </h2>
        <div className="mt-5 space-y-4 text-stone-700 leading-[1.85] text-[17px]">
          <p>
            You are not one thing. You are many — and every part of you, even the loudest, even the most exhausted,
            even the one you'd rather not introduce at parties, is on your team. They took on impossible jobs so you
            could grow up in one piece.
          </p>
          <p>
            This little book is an invitation to meet them. Not to fix them, not to fight them, not to send them
            away — just to <em>see</em> them. The way you might meet a tired old dog that lives behind the front
            counter of a shop you walked into by accident. They were there the whole time. They were waiting.
          </p>
          <p className="text-stone-600">
            <span className="font-hand text-2xl text-stone-800">Tap a polaroid</span> to hear them speak. Or
            let the dice choose.
          </p>
        </div>

        {/* doodles in margin */}
        <DoodleStar className="absolute -top-3 right-8 w-7 h-7 drift" style={{ ["--rot" as string]: "10deg" } as React.CSSProperties} />
      </div>
    </section>
  );
}

/* ===========================================================================
   4. TABLE OF CONTENTS — category tabs + small index
   =========================================================================== */
function TableOfContents({
  onPick,
  activeCat,
  setActiveCat,
  opened,
}: {
  onPick: (c: Character) => void;
  activeCat: Category | "All";
  setActiveCat: (c: Category | "All") => void;
  opened: Set<string>;
}) {
  const counts = useMemo(() => {
    const map: Record<string, number> = { All: CHARACTERS.length };
    for (const c of CHARACTERS) map[c.category] = (map[c.category] || 0) + 1;
    return map;
  }, []);

  return (
    <section id="toc" className="relative max-w-5xl mx-auto px-5 sm:px-10 pt-8 pb-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-stone-500">
            <span className="h-px w-6 bg-stone-400" />
            <span>contents</span>
          </div>
          <h2
            className="mt-2 text-stone-800"
            style={{ fontFamily: "'Caveat', cursive", fontSize: "clamp(2rem, 3.5vw, 2.8rem)", lineHeight: 1 }}
          >
            Who's in here
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-stone-500">
          <span>index by family</span>
        </div>
      </div>

      {/* Tabs — like journal ribbons */}
      <div className="flex flex-wrap items-stretch gap-0 mb-8 border-b border-stone-300/60">
        <TabButton active={activeCat === "All"} onClick={() => setActiveCat("All")} color="#8a7250" count={counts["All"]}>
          <span className="font-hand text-2xl">all of them</span>
        </TabButton>
        {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          return (
            <TabButton
              key={cat}
              active={activeCat === cat}
              onClick={() => setActiveCat(cat)}
              color={meta.bandInk}
              count={counts[cat]}
              band={meta.band}
            >
              <span className="flex items-center gap-2 font-hand text-2xl">
                <CategoryGlyph name={meta.glyph} size={16} color={activeCat === cat ? "#fdf7e7" : meta.bandInk} />
                {meta.short}
              </span>
            </TabButton>
          );
        })}
      </div>

      {/* Category blurb (when filtered) */}
      {activeCat !== "All" && (
        <div className="mb-6 max-w-2xl text-stone-600 leading-relaxed italic border-l-2 pl-4" style={{ borderColor: CATEGORY_META[activeCat].bandInk }}>
          {CATEGORY_META[activeCat].blurb}
        </div>
      )}

      {/* Quick index — tiny clickable list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-1 text-[15px]">
        {CHARACTERS.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onPick(c)}
            className="group flex items-baseline gap-3 py-1.5 text-left text-stone-700 hover:text-stone-900 transition"
          >
            <span className="font-hand text-stone-400 text-xl w-8 text-right tabular-nums leading-none pt-0.5">{i + 1}.</span>
            <span className="font-hand text-2xl leading-none pt-0.5 underline-offset-4 decoration-stone-400 group-hover:underline">
              {c.name}
            </span>
            <span className="flex-1 border-b border-dotted border-stone-400/60 self-end mb-1" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 shrink-0 flex items-center gap-1.5">
              {opened.has(c.id) && <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              {CATEGORY_META[c.category].short}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  color,
  count,
  band,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  count: number;
  band?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 sm:flex-none px-5 sm:px-6 py-3 text-left transition`}
      style={{
        background: active ? color : "transparent",
        color: active ? "#fdf7e7" : color,
        borderTop: active ? `2px solid ${color}` : "2px solid transparent",
      }}
    >
      <span className="flex items-center gap-2 whitespace-nowrap">{children}</span>
      <span
        className="ml-2 inline-block rounded-full px-1.5 text-[10px] font-bold"
        style={{
          background: active ? "rgba(253,247,231,0.22)" : "rgba(43,29,18,0.08)",
          color: active ? "#fdf7e7" : color,
        }}
      >
        {count}
      </span>
      {/* washi tab indicator */}
      {active && band && (
        <span
          aria-hidden
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-3 w-10 washi"
          style={{ background: band }}
        />
      )}
    </button>
  );
}

/* ===========================================================================
   5. JOURNAL PAGES — the actual polaroid grid
   =========================================================================== */
function JournalPages({
  ordered,
  onPick,
  opened,
}: {
  ordered: Character[];
  onPick: (c: Character) => void;
  // activeCat is reserved for future pagination state — currently lives in App.
  activeCat?: Category | "All";
  opened: Set<string>;
}) {
  // Group into "spreads" of 6 (3 rows x 2 cols) so we can add handwritten page numbers
  const spreads: Character[][] = [];
  for (let i = 0; i < ordered.length; i += 6) spreads.push(ordered.slice(i, i + 6));

  return (
    <section className="relative max-w-5xl mx-auto px-5 sm:px-10 pt-6 pb-12">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-6">
        <span className="h-px w-6 bg-stone-400" />
        <span>the polaroids</span>
        <DoodleArrow className="w-16 h-6 drift" style={{ ["--rot" as string]: "0deg", animationDelay: "0.4s" } as React.CSSProperties} />
        <span className="font-hand text-2xl text-stone-700 pt-0.5 leading-none">tap to meet them</span>
      </div>

      <div className="space-y-14">
        {spreads.map((spread, sIdx) => (
          <Spread
            key={sIdx}
            pageNo={sIdx + 1}
            characters={spread}
            onPick={onPick}
            opened={opened}
          />
        ))}
      </div>
    </section>
  );
}

function Spread({
  pageNo,
  characters,
  onPick,
  opened,
}: {
  pageNo: number;
  characters: Character[];
  onPick: (c: Character) => void;
  opened: Set<string>;
}) {
  return (
    <div className="relative">
      <div className="absolute -top-3 right-0 z-10 font-hand text-2xl text-stone-500 select-none">
        — p. {String(pageNo).padStart(2, "0")} —
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
        {characters.map((c, i) => (
          <Polaroid
            key={c.id}
            character={c}
            onPick={onPick}
            rotation={POLAROID_ROTS[(pageNo * 3 + i) % POLAROID_ROTS.length]}
            delay={(pageNo * 3 + i) * 60}
            isOpened={opened.has(c.id)}
          />
        ))}
      </div>
    </div>
  );
}


function Polaroid({
  character,
  onPick,
  rotation,
  delay,
  isOpened,
}: {
  character: Character;
  onPick: (c: Character) => void;
  rotation: number;
  delay: number;
  isOpened: boolean;
}) {
  const cat = CATEGORY_META[character.category];
  return (
    <button
      onClick={() => onPick(character)}
      className="group fade-up relative text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-[18px]"
      style={{
        ["--rot" as string]: `${rotation}deg`,
        animationDelay: `${delay}ms`,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <div className="sticker polaroid relative rounded-[14px] bg-[#fdf7e7] p-3 pb-12 ring-1 ring-stone-300/60 shadow-[0_20px_30px_-20px_rgba(43,29,18,0.35)] group-hover:shadow-[0_30px_45px_-22px_rgba(43,29,18,0.5)]">
        {/* Washi tape top */}
        <div
          aria-hidden
          className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-24 washi z-10"
          style={{ background: character.palette.washi, transform: "translate(-50%, 0) rotate(-3deg)" }}
        />

        {/* Discovered dot */}
        {isOpened && (
          <span aria-hidden className="absolute top-2 right-2 grid place-items-center h-6 w-6 rounded-full bg-emerald-500 text-white text-[10px] font-bold ring-2 ring-[#fdf7e7]">
            ✓
          </span>
        )}

        <div className="rounded-[8px] overflow-hidden bg-[#f4ebd9]">
          <PartArt character={character} />
        </div>

        {/* Hand-written caption */}
        <div className="absolute left-0 right-0 bottom-0 px-3 pb-2 text-center">
          <div
            className="text-stone-800 leading-none"
            style={{ fontFamily: "'Caveat', cursive", fontSize: "1.6rem" }}
          >
            <span className="ink-underline">{character.name}</span>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-stone-500 flex items-center justify-center gap-1.5">
            <CategoryGlyph name={cat.glyph} size={12} color={cat.bandInk} />
            <span style={{ color: cat.bandInk }}>{cat.short}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ===========================================================================
   6. COLOPHON
   =========================================================================== */
function Colophon() {
  return (
    <footer className="relative max-w-3xl mx-auto px-5 sm:px-10 pt-6 pb-20 text-stone-600 text-sm">
      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
        <DoodleLoop className="w-12 h-5" />
        <span>colophon</span>
      </div>
      <p className="leading-[1.85]">
        Set in <span className="font-semibold text-stone-800">Quicksand</span> &amp; <span
          className="font-hand text-2xl text-stone-800 pt-0.5"
          style={{ lineHeight: 0 }}
        >Caveat</span>. Drawn by hand in vectors, lit from a single warm source at top-left, printed on a paper that doesn't
        exist. The thirteen parts depicted are inspired by the <em>Internal Family Systems</em> model of Richard C. Schwartz, PhD. They are
        archetypes, not diagnoses. The Self at the center is not a part — it is what you already are, before any of this.
      </p>
      <p className="mt-4 font-hand text-2xl text-stone-800">Come back whenever. The pages will still be here.</p>
    </footer>
  );
}
