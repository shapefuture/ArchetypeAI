// E06 corrections that propagate (ArchetypeAI-2on, step 05 UI). Every change goes through the pure E06 module, which
// records a receipt of what changed and what was left alone. Corrections never change a canonical score.
import React, { useState } from 'react';
import { useApp } from '../../app.jsx';
import { store } from '../../core/local-store';
import { addNode, deleteSource, effectiveStatus, emptyCorrections, parseCorrections, rejectHypothesis, undoRejection } from '../../elevation/e06-corrections.ts';

export const CORRECTIONS_KEY = 'INNERVERSE_CORRECTIONS_V1';

const COPY = {
  en: {
    kicker: 'Corrections',
    ask: 'Write a note. A note you own can be deleted. A possible reading stays open until you reject it.',
    addNote: 'My note',
    addReading: 'Possible reading',
    add: 'Add',
    reject: 'Reject this reading',
    undo: 'Undo rejection',
    remove: 'Delete',
    status: { active: 'Active', rejected: 'Rejected', deleted: 'Deleted', stale: 'Needs a check' },
    last: 'Last change',
    changed: (n) => `Changed: ${n}`,
    leftAlone: (n) => `Left alone: ${n}`,
    noScores: 'No scores were changed.',
    unreadable: 'The stored corrections could not be read. They have not been replaced.',
    refused: 'That change was refused. Nothing was changed.',
  },
  ru: {
    kicker: 'Исправления',
    ask: 'Напишите заметку. Свою заметку можно удалить. Возможное объяснение остаётся открытым, пока вы его не отклоните.',
    addNote: 'Моя заметка',
    addReading: 'Возможное объяснение',
    add: 'Добавить',
    reject: 'Отклонить объяснение',
    undo: 'Отменить отклонение',
    remove: 'Удалить',
    status: { active: 'Активно', rejected: 'Отклонено', deleted: 'Удалено', stale: 'Нужна проверка' },
    last: 'Последнее изменение',
    changed: (n) => `Изменено: ${n}`,
    leftAlone: (n) => `Не тронуто: ${n}`,
    noScores: 'Баллы не менялись.',
    unreadable: 'Сохранённые исправления не удалось прочитать. Они не заменены.',
    refused: 'Изменение отклонено. Ничего не изменилось.',
  },
};

const newId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

export function CorrectionsPanel() {
  const { lang } = useApp() ?? {};
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  const [parsed, setParsed] = useState(() => {
    const raw = store.load(CORRECTIONS_KEY, null);
    return raw === null ? emptyCorrections() : parseCorrections(raw);
  });
  const [text, setText] = useState('');
  const [kind, setKind] = useState('user-authorship');
  const [message, setMessage] = useState('');

  if (!parsed) {
    return (
      <section className="card flat mt16" aria-labelledby="e06-title">
        <div className="kicker" id="e06-title">{copy.kicker}</div>
        <p className="sub mt8" role="alert">{copy.unreadable}</p>
      </section>
    );
  }

  const ctx = () => ({ actor: 'user', expectedRevision: parsed.revision, now: Date.now(), receiptId: newId('rc') });

  const apply = (result) => {
    if (result.ok === false) { setMessage(copy.refused); return; }
    store.save(CORRECTIONS_KEY, result.state);
    setParsed(result.state);
    setMessage('');
  };

  const add = () => {
    const clean = text.trim();
    if (!clean) return;
    apply(addNode(parsed, { id: newId('n'), kind, text: clean }, ctx()));
    setText('');
  };

  const last = parsed.receipts[parsed.receipts.length - 1];

  return (
    <section className="card flat mt16" aria-labelledby="e06-title">
      <div className="kicker" id="e06-title">{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 13 }}>{copy.ask}</p>
      <label className="field mt8">
        <span>{copy.kicker}</span>
        <textarea className="drop mt6" rows={2} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="row mt6" style={{ gap: 8 }} role="group" aria-label={copy.kicker}>
        <button className={`chip ${kind === 'user-authorship' ? 'on' : ''}`} aria-pressed={kind === 'user-authorship'} onClick={() => setKind('user-authorship')}>{copy.addNote}</button>
        <button className={`chip ${kind === 'hypothesis' ? 'on' : ''}`} aria-pressed={kind === 'hypothesis'} onClick={() => setKind('hypothesis')}>{copy.addReading}</button>
        <button className="btn small primary grow" disabled={!text.trim()} onClick={add}>{copy.add}</button>
      </div>
      <ul className="mt8" style={{ fontSize: 13 }}>
        {parsed.nodes.filter((node) => node.status !== 'deleted').map((node) => {
          const status = effectiveStatus(parsed, node.id) ?? node.status;
          return (
            <li key={node.id} className="mt6">
              <span>{node.text}</span>
              <span className="faint" style={{ fontSize: 11 }}> · {copy.status[status] ?? status}</span>
              <div className="row mt4" style={{ gap: 6 }}>
                {node.kind === 'hypothesis' && node.status === 'active' && (
                  <button className="btn small ghost" onClick={() => apply(rejectHypothesis(parsed, node.id, ctx()))}>{copy.reject}</button>
                )}
                {node.status === 'rejected' && (
                  <button className="btn small ghost" onClick={() => apply(undoRejection(parsed, node.id, ctx()))}>{copy.undo}</button>
                )}
                {node.status === 'active' && node.kind === 'user-authorship' && (
                  <button className="btn small ghost" onClick={() => apply(deleteSource(parsed, node.id, ctx()))}>{copy.remove}</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {last && (
        <p className="faint mt8" style={{ fontSize: 12 }}>
          {copy.last}: {copy.changed(last.changed.length)} · {copy.leftAlone(last.unchanged.length)} · {copy.noScores}
        </p>
      )}
      {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}
    </section>
  );
}
