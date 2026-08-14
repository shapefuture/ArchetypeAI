import { useEffect, useRef, useState } from "react";
import type { Character } from "../data/ifsData";
import { CATEGORY_META } from "../data/ifsData";
import PartArt from "../characters/Parts";
import { CategoryGlyph, DoodleArrow, DoodleStar, DoodleSpiral, DoodleLoop, INK } from "./Doodles";

type Props = {
  character: Character;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  position: { current: number; total: number };
};

/** Typewriter with caret that finishes and stays */
function Reveal({ text, speed = 14, delay = 0 }: { text: string; speed?: number; delay?: number }) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setShown("");
    setDone(false);
    let cancelled = false;
    const start = performance.now() + delay;
    let i = 0;
    const tick = (now: number) => {
      if (cancelled) return;
      if (now < start) { requestAnimationFrame(tick); return; }
      i = Math.min(text.length, i + 1);
      setShown(text.slice(0, i));
      if (i >= text.length) { setDone(true); return; }
      requestAnimationFrame((t) => setTimeout(() => tick(t), speed));
    };
    requestAnimationFrame(tick);
    return () => { cancelled = true; };
  }, [text, speed, delay]);

  return (
    <span ref={ref}>
      {shown}
      {!done && <span className="caret inline-block w-[2px] h-[1em] align-middle ml-0.5 bg-current" />}
    </span>
  );
}

export default function PartSpread({ character, onClose, onPrev, onNext, position }: Props) {
  const cat = CATEGORY_META[character.category];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && onNext) onNext();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onNext, onPrev]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={character.name}
      className="fixed inset-0 z-50 paper-deep overflow-y-auto page-in"
    >
      {/* darken overlay slightly so paper feels lit */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_30%,rgba(255,247,232,0.6),transparent_70%)]" />

      {/* Top utility bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-10 py-4 backdrop-blur-sm bg-[rgba(244,235,217,0.7)] border-b border-[rgba(43,29,18,0.08)]">
        <button
          onClick={onClose}
          className="group flex items-center gap-2 text-[13px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900 transition"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5 L 8 12 L 15 19" />
            <path d="M8 12 L 21 12" />
          </svg>
          <span className="font-hand text-[20px] leading-none pt-1">back to the journal</span>
        </button>

        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-stone-500">
          <span>Entry</span>
          <span className="font-hand text-stone-700 text-[20px] pt-0.5 leading-none">{String(position.current).padStart(2, "0")}</span>
          <span className="opacity-40">/</span>
          <span className="font-hand text-stone-700 text-[20px] pt-0.5 leading-none">{String(position.total).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Hero plate */}
      <div className="relative max-w-5xl mx-auto px-5 sm:px-10 pt-6 sm:pt-10">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-stone-500">
            <span style={{ color: cat.bandInk }}>— {cat.short} —</span>
          </div>

          <h1
            className="mt-3 text-center font-bold text-stone-800"
            style={{ fontFamily: "'Caveat', cursive", fontSize: "clamp(3.4rem, 8vw, 5.6rem)", lineHeight: 0.95 }}
          >
            {character.name}
          </h1>

          <p className="mt-3 max-w-2xl text-center text-stone-600 text-base sm:text-lg leading-relaxed italic">
            "{character.tagline}"
          </p>
        </div>
      </div>

      {/* Spread: sticker + monologue */}
      <div className="relative max-w-5xl mx-auto px-5 sm:px-10 pt-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-8 md:gap-12 items-start">
          {/* Sticker column with washi */}
          <div className="relative md:sticky md:top-24 flex md:block justify-center">
            <div className="relative w-[280px] sm:w-[320px]">
              {/* corner washi */}
              <div
                className="absolute -top-3 left-6 h-7 w-28 washi rounded-[2px] z-10"
                style={{ background: character.palette.washi, transform: "rotate(-8deg)" }}
              />
              <div
                className="absolute -top-3 right-4 h-7 w-20 washi rounded-[2px] z-10"
                style={{ background: character.palette.washi, transform: "rotate(6deg)", opacity: 0.85 }}
              />
              <div className="rounded-[24px] bg-[#fdf7e7] p-3 ring-1 ring-[rgba(43,29,18,0.08)] shadow-[0_30px_60px_-20px_rgba(43,29,18,0.25)]">
                <PartArt character={character} />
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] text-stone-500">
                <CategoryGlyph name={cat.glyph} size={16} color={cat.bandInk} />
                <span style={{ color: cat.bandInk }}>{cat.short}</span>
              </div>
            </div>
          </div>

          {/* Monologue column */}
          <div className="relative">
            {/* date line */}
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-stone-500 mb-4">
              <span className="h-px w-8 bg-stone-400" />
              <span>in their own words</span>
              <span className="h-px flex-1 bg-stone-300" />
            </div>

            {/* Monologue block, set as typeset prose with drop cap */}
            <div
              className="relative rounded-[20px] bg-[#fdf7e7] ring-1 ring-[rgba(43,29,18,0.08)] p-6 sm:p-10 shadow-[0_20px_40px_-25px_rgba(43,29,18,0.25)]"
            >
              {/* corner doodle */}
              <DoodleSpiral className="absolute -top-3 -left-3 w-12 h-12 drift" style={{ ["--rot" as string]: "-12deg" } as React.CSSProperties} />

              <p
                className="text-stone-800 leading-[1.75] text-[17px] sm:text-[19px]"
                style={{ fontFamily: "'Caveat', cursive", fontSize: "clamp(1.25rem, 1.6vw, 1.45rem)" }}
              >
                <Reveal text={character.monologue} speed={12} />
              </p>

              {/* divider with doodle */}
              <div className="mt-6 flex items-center gap-3 text-stone-400">
                <DoodleLoop className="w-16 h-6 opacity-70" />
                <span className="text-[10px] uppercase tracking-[0.3em]">a question to bring back</span>
              </div>

              <p
                className="mt-3 text-stone-700 italic"
                style={{ fontFamily: "'Caveat', cursive", fontSize: "clamp(1.3rem, 2vw, 1.7rem)", lineHeight: 1.3 }}
              >
                "{character.prompt}"
              </p>

              <div className="mt-8 flex items-center justify-end text-stone-400">
                <DoodleStar className="w-5 h-5 drift" style={{ ["--rot" as string]: "8deg" } as React.CSSProperties} />
              </div>
            </div>

            {/* Whisper / gift / burden / practice — four small ink cards */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NoteCard label="what they whisper" body={character.whisper} inkColor={character.palette.accent2} />
              <NoteCard label="the gift they carry" body={character.gift} inkColor={character.palette.accent} />
              <NoteCard label="the wound they hold" body={character.burden} inkColor="#7a3a4a" />
              <NoteCard label="a small practice" body={character.practice} inkColor="#3a5170" highlight />
            </div>
          </div>
        </div>

        {/* Prev/Next */}
        <div className="mt-14 flex items-center justify-between gap-3">
          <button
            onClick={onPrev}
            disabled={!onPrev}
            className="group flex items-center gap-3 disabled:opacity-30 disabled:pointer-events-none"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#fdf7e7] ring-1 ring-stone-300 text-stone-700 transition group-hover:-translate-x-1 group-hover:ring-stone-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 5 L 8 12 L 15 19" />
              </svg>
            </span>
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">previous part</div>
              <div className="font-hand text-stone-800 text-xl leading-none pt-0.5">go back</div>
            </div>
          </button>

          <div className="hidden sm:flex flex-col items-center text-stone-500">
            <DoodleArrow className="w-24 h-8 drift" style={{ ["--rot" as string]: "0deg" } as React.CSSProperties} />
            <span className="text-[10px] uppercase tracking-[0.25em] mt-1">use ← → keys</span>
          </div>

          <button
            onClick={onNext}
            disabled={!onNext}
            className="group flex items-center gap-3 disabled:opacity-30 disabled:pointer-events-none"
          >
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">next part</div>
              <div className="font-hand text-stone-800 text-xl leading-none pt-0.5">keep walking</div>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#fdf7e7] ring-1 ring-stone-300 text-stone-700 transition group-hover:translate-x-1 group-hover:ring-stone-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5 L 16 12 L 9 19" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteCard({ label, body, inkColor = INK, highlight = false }: { label: string; body: string; inkColor?: string; highlight?: boolean }) {
  return (
    <div
      className={`relative rounded-2xl p-4 sm:p-5 ring-1 ${highlight ? "ring-amber-300/70" : "ring-stone-300/70"} bg-[#fdf7e7]/90`}
    >
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: inkColor }}>
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: inkColor }} />
        {label}
      </div>
      <p
        className="mt-2 text-stone-700 leading-snug"
        style={{ fontFamily: "'Caveat', cursive", fontSize: highlight ? "1.2rem" : "1.15rem" }}
      >
        {body}
      </p>
    </div>
  );
}
