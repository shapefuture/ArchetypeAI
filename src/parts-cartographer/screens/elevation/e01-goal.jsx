// E01 goal panel (ArchetypeAI-64p, step 05 UI). Calls the pure E01 reducer and persists only accepted changes.
// A corrupt stored goal is never overwritten. Educated guess: the panel lives in the Practice overlay.
import React, { useState } from 'react';
import { useApp } from '../../app.jsx';
import { store } from '../../core/local-store';
import { exportGoal, goalStatement, readGoalRecord, reduceGoal } from '../../elevation/e01-goal.ts';

export const GOAL_KEY = 'INNERVERSE_GOAL_V1';

const COPY = {
  en: {
    kicker: 'Goal',
    ask: 'What do you want to work toward? Write it in your own words.',
    save: 'Save goal',
    change: 'Change wording',
    pause: 'Pause',
    resume: 'Resume',
    graduate: 'Graduate',
    confirmGraduate: 'Yes, graduate',
    summary: 'Show goal summary',
    none: 'No goal yet. You can add one whenever you want.',
    unreadable: 'The stored goal could not be read. It has not been replaced.',
    refused: 'That could not be saved. Your goal is unchanged.',
    paused: 'Paused. Nothing is lost.',
    graduated: 'Graduated. Your goal and what you recorded stay here.',
    exportNote: 'This summary labels what you wrote, what the app suggested, and what was measured.',
  },
  ru: {
    kicker: 'Цель',
    ask: 'К чему вы хотите прийти? Напишите своими словами.',
    save: 'Сохранить цель',
    change: 'Изменить формулировку',
    pause: 'Пауза',
    resume: 'Продолжить',
    graduate: 'Завершить',
    confirmGraduate: 'Да, завершить',
    summary: 'Показать сводку цели',
    none: 'Цели пока нет. Добавить её можно в любой момент.',
    unreadable: 'Сохранённую цель не удалось прочитать. Она не заменена.',
    refused: 'Не удалось сохранить. Цель не изменилась.',
    paused: 'Пауза. Ничего не потеряно.',
    graduated: 'Завершено. Цель и записи остаются здесь.',
    exportNote: 'В сводке отдельно указано, что написали вы, что предложило приложение и что было измерено.',
  },
};

export function GoalPanel() {
  const { lang } = useApp() ?? {};
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  const [record, setRecord] = useState(() => readGoalRecord(store.load(GOAL_KEY, null)));
  const [text, setText] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [summary, setSummary] = useState('');
  const state = record.status === 'goal' ? record.state : null;
  const unreadable = record.status === 'rejected';

  const apply = (action, fallbackId) => {
    const now = new Date().toISOString();
    const result = reduceGoal(state, { ...action, actor: 'user', expectedRevision: state?.revision }, now);
    if (!result.ok) {
      setMessage(copy.refused);
      return false;
    }
    if (result.state) store.save(GOAL_KEY, result.state);
    setRecord(result.state ? { status: 'goal', state: result.state } : { status: 'none' });
    setMessage(fallbackId ?? '');
    return true;
  };

  const save = () => {
    const statement = text.trim();
    if (!statement) return;
    const ok = state
      ? apply({ type: 'revise', statement })
      : apply({ type: 'choose', id: `goal-${Date.now()}`, statement });
    if (ok) setText('');
  };

  const graduate = () => {
    setConfirming(false);
    apply({ type: 'graduate', chosen: true }, copy.graduated);
  };

  const showSummary = () => {
    const result = exportGoal(state, true, new Date().toISOString());
    setSummary(result.ok ? JSON.stringify(result.artifact, null, 2) : '');
  };

  return (
    <section className="card flat mt16" aria-labelledby="e01-goal-title">
      <div className="kicker" id="e01-goal-title">{copy.kicker}</div>
      {unreadable && <p className="sub mt8" role="alert">{copy.unreadable}</p>}
      {!unreadable && state && <p className="mt8" style={{ fontSize: 14 }}>{goalStatement(state)}</p>}
      {!unreadable && !state && <p className="sub mt8">{copy.none}</p>}
      {!unreadable && (
        <div className="mt8">
          <label className="field">
            <span>{state ? copy.change : copy.ask}</span>
            <textarea className="drop mt6" rows={2} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <button className="btn primary block mt8" disabled={!text.trim()} onClick={save}>{copy.save}</button>
        </div>
      )}
      {state && !unreadable && state.status === 'active' && (
        <div className="row mt8" style={{ gap: 8 }}>
          <button className="btn small ghost grow" onClick={() => apply({ type: 'pause' }, copy.paused)}>{copy.pause}</button>
          {confirming ? (
            <button className="btn small primary grow" onClick={graduate}>{copy.confirmGraduate}</button>
          ) : (
            <button className="btn small ghost grow" onClick={() => setConfirming(true)}>{copy.graduate}</button>
          )}
        </div>
      )}
      {state && !unreadable && state.status === 'paused' && (
        <button className="btn small ghost block mt8" onClick={() => apply({ type: 'resume' })}>{copy.resume}</button>
      )}
      {state && !unreadable && (
        <button className="btn small ghost block mt8" onClick={showSummary}>{copy.summary}</button>
      )}
      {summary && (
        <div className="mt8">
          <p className="faint" style={{ fontSize: 12 }}>{copy.exportNote}</p>
          <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>{summary}</pre>
        </div>
      )}
      {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}
    </section>
  );
}
