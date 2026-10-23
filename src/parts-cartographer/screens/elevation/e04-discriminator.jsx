// E04 discriminating questions (ArchetypeAI-1ei, step 05 UI). Built on the pure E04 module, which sits on top of
// situation-inquiry. The question bank is generated from the person's own two readings, so every question separates
// readings they actually wrote. Readings are shown as hypotheses. Nothing is applied without a response.
import React, { useState } from 'react';
import { useApp } from '../../app.jsx';
import { store } from '../../core/local-store';
import { addReading, respond, selectQuestion, startDiscriminator, undo, visibleFormulation, restoreDiscriminator } from '../../elevation/e04-discriminator.ts';

export const DISCRIMINATOR_KEY = 'INNERVERSE_DISCRIMINATOR_V1';
const READING_IDS = ['reading-1', 'reading-2'];

const COPY = {
  en: {
    kicker: 'Which reading fits?',
    observe: 'Describe what happened, in your own words.',
    observeButton: 'Start',
    reading: (n) => `Reading ${n}: a possible explanation you want to test`,
    addReading: 'Add reading',
    question: 'Which reading fits this better?',
    answers: { first: 'The first', second: 'The second', both: 'Both fit', depends: 'It depends', neither: 'Neither fits' },
    undo: 'Undo last answer',
    reset: 'Start over',
    lead: 'Working wording',
    readingsLabel: 'Readings (hypotheses, not facts)',
    refused: 'That could not be saved.',
    needTwo: 'Add two readings to start the questions.',
    done: 'No more questions for now. You can change your mind at any time.',
  },
  ru: {
    kicker: 'Какое объяснение подходит?',
    observe: 'Опишите, что произошло, своими словами.',
    observeButton: 'Начать',
    reading: (n) => `Объяснение ${n}: возможная причина, которую хотите проверить`,
    addReading: 'Добавить объяснение',
    question: 'Какое из объяснений подходит лучше?',
    answers: { first: 'Первое', second: 'Второе', both: 'Оба подходят', depends: 'Зависит', neither: 'Ни одно' },
    undo: 'Отменить последний ответ',
    reset: 'Начать заново',
    lead: 'Рабочая формулировка',
    readingsLabel: 'Объяснения (гипотезы, а не факты)',
    refused: 'Не удалось сохранить.',
    needTwo: 'Добавьте два объяснения, чтобы начать вопросы.',
    done: 'Вопросов пока нет. Можно передумать в любой момент.',
  },
};

function load() {
  const raw = store.load(DISCRIMINATOR_KEY, null);
  return raw === null ? null : restoreDiscriminator(raw);
}

export function DiscriminatorPanel() {
  const { lang } = useApp() ?? {};
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  const [state, setState] = useState(load);
  const [observation, setObservation] = useState('');
  const [readings, setReadings] = useState(['', '']);
  const [message, setMessage] = useState('');

  const persist = (next) => {
    setState(next);
    if (next) store.save(DISCRIMINATOR_KEY, next);
    else store.remove(DISCRIMINATOR_KEY);
  };

  const start = () => {
    const next = startDiscriminator(observation.trim());
    if (!next) return;
    setObservation('');
    setMessage('');
    persist(next);
  };

  const addBothReadings = () => {
    let next = state;
    for (let index = 0; index < 2; index += 1) {
      const text = readings[index].trim();
      if (!text) continue;
      const outcome = addReading(next, READING_IDS[index], text, null);
      if (outcome.ok === false) { setMessage(copy.refused); return; }
      next = outcome.state;
    }
    setReadings(['', '']);
    persist(next);
  };

  const readingTexts = state ? visibleFormulation(state).readings : [];
  const bank = readingTexts.length >= 2
    ? [{ id: 'q-which', text: copy.question, separates: [READING_IDS[0], READING_IDS[1]] , after: [] }]
    : [];
  const selection = state && bank.length ? selectQuestion(state, bank) : null;
  const formulation = state ? visibleFormulation(state) : null;

  const answer = (choice) => {
    if (!state || !selection || selection.status !== 'asked') return;
    const outcome = respond(state, selection.question, choice);
    if (outcome.ok === false) { setMessage(copy.refused); return; }
    setMessage('');
    persist(outcome.state);
  };

  if (!state) {
    return (
      <section className="card flat mt16" aria-labelledby="e04-title">
        <div className="kicker" id="e04-title">{copy.kicker}</div>
        <label className="field mt8">
          <span>{copy.observe}</span>
          <textarea className="drop mt6" rows={2} value={observation} onChange={(e) => setObservation(e.target.value)} />
        </label>
        <button className="btn primary block mt8" disabled={!observation.trim()} onClick={start}>{copy.observeButton}</button>
      </section>
    );
  }

  return (
    <section className="card flat mt16" aria-labelledby="e04-title">
      <div className="kicker" id="e04-title">{copy.kicker}</div>
      {formulation && <p className="mt8" style={{ fontSize: 14 }}><span className="faint">{copy.lead}: </span>{formulation.lead}</p>}
      {readingTexts.length > 0 && (
        <ul className="faint mt6" aria-label={copy.readingsLabel} style={{ fontSize: 12 }}>
          {readingTexts.map((text) => <li key={text}>{text}</li>)}
        </ul>
      )}
      {readingTexts.length < 2 && (
        <div className="mt8">
          <p className="faint" style={{ fontSize: 12 }}>{copy.needTwo}</p>
          {[0, 1].map((index) => (
            <label key={index} className="field mt6">
              <span>{copy.reading(index + 1)}</span>
              <input value={readings[index]} onChange={(e) => setReadings(readings.map((r, i) => (i === index ? e.target.value : r)))} />
            </label>
          ))}
          <button className="btn small ghost block mt8" onClick={addBothReadings}>{copy.addReading}</button>
        </div>
      )}
      {selection?.status === 'asked' && (
        <div className="mt8">
          <p style={{ fontSize: 14 }}>{selection.question.text}</p>
          <div className="row wrap mt8" style={{ gap: 6 }} role="group" aria-label={copy.question}>
            {['first', 'second', 'both', 'depends', 'neither'].map((choice) => (
              <button key={choice} className="chip" onClick={() => answer(choice)}>{copy.answers[choice]}</button>
            ))}
          </div>
        </div>
      )}
      {selection && selection.status !== 'asked' && readingTexts.length >= 2 && <p className="faint mt8" style={{ fontSize: 12 }}>{copy.done}</p>}
      <div className="row mt8" style={{ gap: 8 }}>
        <button className="btn small ghost grow" disabled={!state.history?.length} onClick={() => persist(undo(state))}>{copy.undo}</button>
        <button className="btn small ghost grow" onClick={() => persist(null)}>{copy.reset}</button>
      </div>
      {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}
    </section>
  );
}
