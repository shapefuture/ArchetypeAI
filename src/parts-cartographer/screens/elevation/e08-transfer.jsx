// E08 transfer-centred practice (ArchetypeAI-onr, step 05 UI). A recall attempt is recorded only when the person presses
// a button. Cue and reveal stay available, and nothing locks. A variation is a practice the person adapts to their own
// setting, written in their words. The model cannot record a result or author a variation.
import React, { useState } from 'react';
import { useApp } from '../../app.jsx';
import { store } from '../../core/local-store';
import { allowedEvents, createVariation, recordRecall, resultOf, startRecall } from '../../elevation/e08-transfer.ts';

export const TRANSFER_KEY = 'INNERVERSE_TRANSFER_V1';

const LABELS = {
  en: {
    'invite-declined': 'Not now',
    'attempt-recalled': 'I remembered it',
    'attempt-cannot': 'I could not remember',
    'cue-requested': 'Give me a cue',
    'reveal-requested': 'Show it',
  },
  ru: {
    'invite-declined': 'Не сейчас',
    'attempt-recalled': 'Вспомнилось',
    'attempt-cannot': 'Не вспомнилось',
    'cue-requested': 'Подсказка',
    'reveal-requested': 'Показать',
  },
};

const COPY = {
  en: {
    kicker: 'Try it somewhere else',
    ask: 'Name one step you want to remember. Try to recall it first, without help.',
    step: 'The step',
    start: 'Start a recall',
    results: { open: 'Open', declined: 'Not now', recalled: 'Recalled', 'cue-helped': 'Recalled with a cue', 'could-not-recall': 'Could not recall', revealed: 'Shown' },
    variation: 'Adapt it to your setting',
    constraint: 'The real situation, in your words',
    action: 'What you will do there',
    add: 'Save this adaptation',
    refused: 'That could not be saved.',
    none: 'No adaptation yet.',
    unreadable: 'The stored practice could not be read. It has not been replaced.',
  },
  ru: {
    kicker: 'Попробуйте в другом месте',
    ask: 'Назовите один шаг, который хотите запомнить. Сначала попробуйте вспомнить его без подсказки.',
    step: 'Шаг',
    start: 'Начать вспоминание',
    results: { open: 'Открыто', declined: 'Не сейчас', recalled: 'Вспомнилось', 'cue-helped': 'Вспомнилось с подсказкой', 'could-not-recall': 'Не вспомнилось', revealed: 'Показано' },
    variation: 'Адаптируйте к своей ситуации',
    constraint: 'Реальная ситуация, своими словами',
    action: 'Что вы сделаете там',
    add: 'Сохранить адаптацию',
    refused: 'Не удалось сохранить.',
    none: 'Адаптаций пока нет.',
    unreadable: 'Сохранённую практику не удалось прочитать. Она не заменена.',
  },
};

function load() {
  const raw = store.load(TRANSFER_KEY, null);
  if (raw === null) return { session: null, variations: [] };
  if (typeof raw !== 'object' || !Array.isArray(raw.variations)) return null;
  return { session: raw.session ?? null, variations: raw.variations };
}

export function TransferPanel() {
  const { lang } = useApp() ?? {};
  const lk = lang === 'ru' ? 'ru' : 'en';
  const copy = COPY[lk];
  const [data, setData] = useState(load);
  const [step, setStep] = useState('');
  const [constraint, setConstraint] = useState('');
  const [action, setAction] = useState('');
  const [message, setMessage] = useState('');

  if (!data) {
    return (
      <section className="card flat mt16" aria-labelledby="e08-title">
        <div className="kicker" id="e08-title">{copy.kicker}</div>
        <p className="sub mt8" role="alert">{copy.unreadable}</p>
      </section>
    );
  }

  const persist = (next) => {
    store.save(TRANSFER_KEY, next);
    setData(next);
  };

  const start = () => {
    const moveId = step.trim();
    if (!moveId) return;
    persist({ ...data, session: startRecall(moveId) });
    setStep('');
    setMessage('');
  };

  const record = (event) => {
    if (!data.session) return;
    const outcome = recordRecall(data.session, event, 'person');
    if (outcome.ok === false) { setMessage(copy.refused); return; }
    persist({ ...data, session: outcome.session });
    setMessage('');
  };

  const addVariation = () => {
    const made = createVariation({
      id: `v-${Date.now()}`,
      moveId: data.session?.moveId ?? '',
      constraint: constraint.trim(),
      action: action.trim(),
    }, 'person');
    if (made.ok === false) { setMessage(copy.refused); return; }
    persist({ ...data, variations: [...data.variations, made.variation] });
    setConstraint('');
    setAction('');
    setMessage('');
  };

  const session = data.session;
  const events = allowedEvents(session ?? { moveId: '', checkIn: null, events: [] });

  return (
    <section className="card flat mt16" aria-labelledby="e08-title">
      <div className="kicker" id="e08-title">{copy.kicker}</div>
      {!session && (
        <div className="mt8">
          <p className="sub" style={{ fontSize: 13 }}>{copy.ask}</p>
          <label className="field mt6">
            <span>{copy.step}</span>
            <input value={step} onChange={(e) => setStep(e.target.value)} />
          </label>
          <button className="btn small primary block mt8" disabled={!step.trim()} onClick={start}>{copy.start}</button>
        </div>
      )}
      {session && (
        <div className="mt8">
          <p style={{ fontSize: 14 }}>{session.moveId}</p>
          <p className="faint" style={{ fontSize: 12 }}>{copy.results[resultOf(session.events)] ?? ''}</p>
          <div className="row wrap mt6" style={{ gap: 6 }}>
            {events.map((event) => (
              <button key={event} className="chip" onClick={() => record(event)}>{LABELS[lk][event]}</button>
            ))}
          </div>
        </div>
      )}
      <div className="mt12">
        <div className="kicker">{copy.variation}</div>
        <label className="field mt6">
          <span>{copy.constraint}</span>
          <input value={constraint} onChange={(e) => setConstraint(e.target.value)} />
        </label>
        <label className="field mt6">
          <span>{copy.action}</span>
          <input value={action} onChange={(e) => setAction(e.target.value)} />
        </label>
        <button className="btn small ghost block mt8" disabled={!constraint.trim() || !action.trim() || !session} onClick={addVariation}>{copy.add}</button>
        {data.variations.length === 0 && <p className="faint mt6" style={{ fontSize: 12 }}>{copy.none}</p>}
        <ul className="mt6" style={{ fontSize: 13 }}>
          {data.variations.map((variation) => <li key={variation.id}>{variation.card.situation}: {variation.card.action}</li>)}
        </ul>
      </div>
      {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}
    </section>
  );
}
