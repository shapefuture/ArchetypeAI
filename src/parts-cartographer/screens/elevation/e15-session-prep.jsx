// E15 human-session continuity (ArchetypeAI-mgby, step 05 UI). The client prepares an agenda for their next session and
// sees exactly what would be shared. Nothing is sent from here: the share needs a confirmed, granted therapist link,
// which this panel does not create. The draft stays on this device.
import React, { useState } from 'react';
import { useApp } from '../../app.jsx';
import { store } from '../../core/local-store';
import { prepareAgenda, previewShare, NOT_INCLUDED } from '../../elevation/e15-session-continuity.ts';

export const SESSION_PREP_KEY = 'INNERVERSE_SESSION_PREP_V1';
const MAX_ITEMS = 5;

const COPY = {
  en: {
    kicker: 'Prepare for your session',
    ask: 'Write what you want to bring. Nothing is shared from here. Your therapist sees only what you confirm later.',
    item: (n) => `Agenda item ${n}`,
    add: 'Add an item',
    note: 'A note for the discussion (optional)',
    previewTitle: 'What would be shared',
    none: 'Nothing would be shared yet.',
    notIncluded: 'Never included',
    labels: { 'canonical-measurement': 'Your standard instrument results', 'coach-context': 'Coach conversations', 'general-journal': 'Your general journal' },
    stored: 'Saved on this device only.',
  },
  ru: {
    kicker: 'Подготовка к сессии',
    ask: 'Напишите, что хотите принести. Отсюда ничего не отправляется. Терапевт увидит только то, что вы подтвердите позже.',
    item: (n) => `Пункт повестки ${n}`,
    add: 'Добавить пункт',
    note: 'Заметка для обсуждения (необязательно)',
    previewTitle: 'Что было бы передано',
    none: 'Пока ничего не было бы передано.',
    notIncluded: 'Никогда не включается',
    labels: { 'canonical-measurement': 'Результаты стандартных инструментов', 'coach-context': 'Разговоры с ИИ-коучем', 'general-journal': 'Ваш общий дневник' },
    stored: 'Сохранено только на этом устройстве.',
  },
};

const itemLabel = { agenda: 'Agenda', 'discussion-note': 'Note' };

export function SessionPrepPanel() {
  const { lang } = useApp() ?? {};
  const lk = lang === 'ru' ? 'ru' : 'en';
  const copy = COPY[lk];
  const [draft, setDraft] = useState(() => {
    const raw = store.load(SESSION_PREP_KEY, null);
    return raw && Array.isArray(raw.items) ? raw : { items: [''], note: '' };
  });

  const save = (next) => {
    setDraft(next);
    store.save(SESSION_PREP_KEY, next);
  };

  const items = draft.items.map((item) => item.trim()).filter(Boolean);
  const agenda = prepareAgenda('next-session', items);
  const preview = previewShare(agenda, draft.note);

  return (
    <section className="card flat mt16" aria-labelledby="e15-title">
      <div className="kicker" id="e15-title">{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 13 }}>{copy.ask}</p>
      {draft.items.map((item, index) => (
        <label key={index} className="field mt6">
          <span>{copy.item(index + 1)}</span>
          <input value={item} onChange={(e) => save({ ...draft, items: draft.items.map((value, i) => (i === index ? e.target.value : value)) })} />
        </label>
      ))}
      {draft.items.length < MAX_ITEMS && (
        <button className="btn small ghost block mt6" onClick={() => save({ ...draft, items: [...draft.items, ''] })}>{copy.add}</button>
      )}
      <label className="field mt8">
        <span>{copy.note}</span>
        <textarea className="drop mt6" rows={2} value={draft.note} onChange={(e) => save({ ...draft, note: e.target.value })} />
      </label>
      <div className="mt8">
        <div className="kicker">{copy.previewTitle}</div>
        {preview.items.length === 0 && <p className="faint mt6" style={{ fontSize: 12 }}>{copy.none}</p>}
        {preview.items.map((item) => (
          <p key={item.id} className="mt6" style={{ fontSize: 13 }}>
            <span className="faint">{itemLabel[item.id]}: </span>{item.values.join(' · ')}
          </p>
        ))}
        <p className="faint mt6" style={{ fontSize: 12 }}>
          {copy.notIncluded}: {NOT_INCLUDED.map((key) => copy.labels[key]).join(', ')}
        </p>
        <p className="faint mt4" style={{ fontSize: 11 }}>{copy.stored}</p>
      </div>
    </section>
  );
}
