// E05 useful action under uncertainty (ArchetypeAI-6s7, step 05 UI). The person writes their own readings. An action is
// offered only when the pure E05 module finds it eligible, and no action has a reviewed record yet, so the panel
// says that plainly instead of offering one.
import React, { useState } from 'react';
import { useApp } from '../../app.jsx';
import { store } from '../../core/local-store';
import { addUserReading, emptyState, offerActions, parseState } from '../../elevation/e05-uncertainty-action.ts';

export const UNCERTAINTY_KEY = 'INNERVERSE_UNCERTAINTY_V1';

const COPY = {
  en: {
    kicker: 'Action under uncertainty',
    ask: 'Write a possible explanation you want to test. It is your wording, not a fact.',
    add: 'Add explanation',
    none: 'No explanation yet.',
    noActions: 'No action is offered yet. Each action needs a reviewed record first, so nothing is suggested here.',
    withheld: 'Withheld for now',
    unreadable: 'The stored notes could not be read. They have not been replaced.',
    refused: 'That could not be saved.',
  },
  ru: {
    kicker: 'Действие в неопределённости',
    ask: 'Напишите возможное объяснение, которое хотите проверить. Это ваши слова, а не факт.',
    add: 'Добавить объяснение',
    none: 'Объяснений пока нет.',
    noActions: 'Действие пока не предлагается. Каждому действию нужна проверенная запись, поэтому здесь ничего не предлагается.',
    withheld: 'Пока не предлагаются',
    unreadable: 'Сохранённые заметки не удалось прочитать. Они не заменены.',
    refused: 'Не удалось сохранить.',
  },
};

export function UncertaintyPanel() {
  const { lang } = useApp() ?? {};
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  const [parsed, setParsed] = useState(() => {
    const raw = store.load(UNCERTAINTY_KEY, null);
    return raw === null ? emptyState() : parseState(raw);
  });
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  if (!parsed) {
    return (
      <section className="card flat mt16" aria-labelledby="e05-title">
        <div className="kicker" id="e05-title">{copy.kicker}</div>
        <p className="sub mt8" role="alert">{copy.unreadable}</p>
      </section>
    );
  }

  const add = () => {
    const result = addUserReading(parsed, { id: `reading-${Date.now()}`, text }, 'user', parsed.revision);
    if (result.ok === false) { setMessage(copy.refused); return; }
    store.save(UNCERTAINTY_KEY, result.state);
    setParsed(result.state);
    setText('');
    setMessage('');
  };

  const offer = offerActions(parsed, { quiet: false });

  return (
    <section className="card flat mt16" aria-labelledby="e05-title">
      <div className="kicker" id="e05-title">{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 13 }}>{copy.ask}</p>
      {parsed.readings.length === 0 && <p className="faint mt6" style={{ fontSize: 12 }}>{copy.none}</p>}
      {parsed.readings.length > 0 && (
        <ul className="mt6" style={{ fontSize: 13 }}>
          {parsed.readings.map((reading) => <li key={reading.id}>{reading.text}</li>)}
        </ul>
      )}
      <label className="field mt8">
        <textarea className="drop" rows={2} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <button className="btn small ghost block mt8" disabled={!text.trim()} onClick={add}>{copy.add}</button>
      <p className="mt8" style={{ fontSize: 13 }}>{offer.offered.length ? '' : copy.noActions}</p>
      {offer.withheld.length > 0 && (
        <p className="faint mt6" style={{ fontSize: 12 }}>{copy.withheld}: {offer.withheld.map((item) => item.reason).join(' · ')}</p>
      )}
      {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}
    </section>
  );
}
