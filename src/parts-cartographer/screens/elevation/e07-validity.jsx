// E07 contextual validity (ArchetypeAI-mfv, step 05 UI). The person marks whether a remembered item still fits, only
// fits in some situations, or no longer fits. Changes go through the pure E07 module. The module never downgrades a
// person's own certainty, and the model cannot mark anything.
import React, { useState } from 'react';
import { useApp } from '../../app.jsx';
import { store } from '../../core/local-store';
import { loadMemories } from '../memory-panel.jsx';
import { applyChange, markFor } from '../../elevation/e07-validity.ts';

export const VALIDITY_KEY = 'INNERVERSE_VALIDITY_V1';

const COPY = {
  en: {
    kicker: 'Does this still fit?',
    ask: 'Mark each saved note. Nothing is deleted or reworded by these marks.',
    still: 'Still fits',
    context: 'Only in some situations',
    no: 'No longer fits',
    where: 'Where or when? (required)',
    none: 'Nothing saved yet.',
    refused: 'That mark could not be saved.',
    labels: { unmarked: 'Not marked yet', 'still-fits': 'Still fits', 'context-specific': 'Only in some situations', 'no-longer-fits': 'No longer fits' },
  },
  ru: {
    kicker: 'Всё ещё подходит?',
    ask: 'Отметьте каждую сохранённую заметку. Эти отметки ничего не удаляют и не переписывают.',
    still: 'Всё ещё подходит',
    context: 'Только в некоторых ситуациях',
    no: 'Больше не подходит',
    where: 'Где или когда? (обязательно)',
    none: 'Пока ничего не сохранено.',
    refused: 'Отметку не удалось сохранить.',
    labels: { unmarked: 'Ещё не отмечено', 'still-fits': 'Всё ещё подходит', 'context-specific': 'Только в некоторых ситуациях', 'no-longer-fits': 'Больше не подходит' },
  },
};

export function ValidityPanel() {
  const { lang } = useApp() ?? {};
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  const [memories] = useState(loadMemories);
  const [ledger, setLedger] = useState(() => store.load(VALIDITY_KEY, []));
  const [where, setWhere] = useState({});
  const [message, setMessage] = useState('');

  const mark = (memory, event) => {
    const result = applyChange(memories, ledger, memory.id, event, 'person');
    if (result.ok === false) { setMessage(copy.refused); return; }
    store.save(VALIDITY_KEY, result.ledger);
    setLedger(result.ledger);
    setMessage('');
  };

  const saved = memories.filter((memory) => memory.saved);

  return (
    <section className="card flat mt16" aria-labelledby="e07-title">
      <div className="kicker" id="e07-title">{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 13 }}>{copy.ask}</p>
      {saved.length === 0 && <p className="faint mt6" style={{ fontSize: 12 }}>{copy.none}</p>}
      <ul className="mt8" style={{ fontSize: 13 }}>
        {saved.map((memory) => {
          const current = markFor(ledger, memory);
          return (
            <li key={memory.id} className="mt8">
              <span>{memory.text}</span>
              <span className="faint" style={{ fontSize: 11 }}> · {copy.labels[current.state]}</span>
              <div className="row wrap mt4" style={{ gap: 6 }}>
                <button className="chip" onClick={() => mark(memory, { type: 'validity', state: 'still-fits' })}>{copy.still}</button>
                <button className="chip" onClick={() => mark(memory, { type: 'validity', state: 'no-longer-fits' })}>{copy.no}</button>
              </div>
              <div className="row mt4" style={{ gap: 6 }}>
                <input className="drop" aria-label={copy.where} placeholder={copy.where} style={{ flex: 1, minHeight: 34 }}
                  value={where[memory.id] ?? ''} onChange={(e) => setWhere({ ...where, [memory.id]: e.target.value })} />
                <button className="chip" disabled={!(where[memory.id] ?? '').trim()}
                  onClick={() => mark(memory, { type: 'validity', state: 'context-specific', contextLabel: where[memory.id].trim() })}>
                  {copy.context}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}
    </section>
  );
}
