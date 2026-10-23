// E03 capacity chooser (ArchetypeAI-0wc, step 05 UI). The preference changes how much is offered at once and never
// shortens a canonical instrument. Educated guess: a plain preference stored on its own, before any inquiry starts.
import React, { useState } from 'react';
import { useApp } from '../../app.jsx';
import { store } from '../../core/local-store';
import { CAPACITY_LEVELS, CHUNK_SIZE, DEFAULT_CAPACITY, QUESTION_LIMIT, normalizeCapacity } from '../../elevation/e03-capacity.ts';

export const CAPACITY_KEY = 'INNERVERSE_CAPACITY_PREF_V1';

const COPY = {
  en: {
    kicker: 'How much at once',
    ask: 'Choose how much to take on right now. You can change this at any time.',
    levels: { low: 'A little', medium: 'Some', high: 'More' },
    questions: (n) => `Up to ${n} question${n === 1 ? '' : 's'} at a time`,
    chunk: (n) => `About ${n} items per screen`,
    canonical: 'Standard instruments always show their full length. This setting does not shorten them.',
  },
  ru: {
    kicker: 'Сколько сразу',
    ask: 'Выберите, сколько взять на себя сейчас. Это можно изменить в любой момент.',
    levels: { low: 'Немного', medium: 'Обычно', high: 'Больше' },
    questions: (n) => (n === 1 ? 'Один вопрос за раз' : `До ${n} вопросов за раз`),
    chunk: (n) => `Около ${n} пунктов на экран`,
    canonical: 'Стандартные инструменты всегда показываются полностью. Эта настройка их не сокращает.',
  },
};

export function CapacityPanel() {
  const { lang } = useApp() ?? {};
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  const [capacity, setCapacity] = useState(() => normalizeCapacity(store.load(CAPACITY_KEY, DEFAULT_CAPACITY)));

  const choose = (level) => {
    const next = normalizeCapacity(level);
    setCapacity(next);
    store.save(CAPACITY_KEY, next);
  };

  return (
    <section className="card flat mt16" aria-labelledby="e03-capacity-title">
      <div className="kicker" id="e03-capacity-title">{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 13 }}>{copy.ask}</p>
      <div className="row wrap mt8" style={{ gap: 8 }} role="group" aria-label={copy.kicker}>
        {CAPACITY_LEVELS.map((level) => (
          <button key={level} className="chip" aria-pressed={capacity === level} onClick={() => choose(level)}>
            {copy.levels[level]}
          </button>
        ))}
      </div>
      <p className="faint mt8" style={{ fontSize: 12 }}>
        {copy.questions(QUESTION_LIMIT[capacity])} · {copy.chunk(CHUNK_SIZE[capacity])}
      </p>
      <p className="faint mt6" style={{ fontSize: 12 }}>{copy.canonical}</p>
    </section>
  );
}
