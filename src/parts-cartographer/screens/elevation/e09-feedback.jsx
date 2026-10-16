// E09 satisfying adaptation feedback (ArchetypeAI-zl7, step 05 UI). Feedback appears only after the person confirms an
// action with a button. It is optional, never a score, and can be dismissed or turned off. Copy comes from the pure E09
// catalogue, which is currently English only, so it is shown as written there.
import React, { useState } from 'react';
import { useApp } from '../../app.jsx';
import { store } from '../../core/local-store';
import { CATALOG, dismiss, markShown, normalizeLedger, recordSelection, selectFeedback } from '../../elevation/e09-feedback.ts';

export const FEEDBACK_KEY = 'INNERVERSE_FEEDBACK_V1';
export const FEEDBACK_PREF_KEY = 'INNERVERSE_FEEDBACK_PREF_V1';

const COPY = {
  en: {
    kicker: 'After you act',
    ask: 'Tell the app what you just did. Nothing happens unless you do.',
    modes: { full: 'Show feedback', quiet: 'Quiet', off: 'Off' },
    actions: {
      'plan-revised': 'I revised the plan',
      'exception-noticed': 'I noticed an exception',
      'help-requested': 'I asked for help',
      'rest-chosen': 'I chose to rest',
      'recording-declined': 'I declined to record',
    },
    dismiss: 'Dismiss',
    refused: 'No feedback is shown for that right now.',
    englishNote: 'This feedback text is in English for now.',
  },
  ru: {
    kicker: 'После действия',
    ask: 'Сообщите приложению, что вы только что сделали. Ничего не происходит, пока вы не нажмёте.',
    modes: { full: 'Показывать отклик', quiet: 'Тихо', off: 'Выключить' },
    actions: {
      'plan-revised': 'Я изменил план',
      'exception-noticed': 'Я заметил исключение',
      'help-requested': 'Я попросил помощи',
      'rest-chosen': 'Я выбрал отдых',
      'recording-declined': 'Я отказался от записи',
    },
    dismiss: 'Скрыть',
    refused: 'Сейчас отклик не показывается.',
    englishNote: 'Текст отклика пока на английском.',
  },
};

const ACTION_KEYS = ['plan-revised', 'exception-noticed', 'help-requested', 'rest-chosen', 'recording-declined'];
const newId = () => `ev-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

export function FeedbackPanel() {
  const { lang } = useApp() ?? {};
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  const [ledger, setLedger] = useState(() => normalizeLedger(store.load(FEEDBACK_KEY, [])));
  const [pref, setPref] = useState(() => {
    const raw = store.load(FEEDBACK_PREF_KEY, { mode: 'full' });
    return { mode: ['full', 'quiet', 'off'].includes(raw?.mode) ? raw.mode : 'full' };
  });
  const [shown, setShown] = useState(null);
  const [message, setMessage] = useState('');

  const choosePref = (mode) => {
    const next = { mode };
    setPref(next);
    store.save(FEEDBACK_PREF_KEY, next);
    setShown(null);
  };

  const act = (kind) => {
    const eventId = newId();
    const selection = selectFeedback({ eventId, kind, subjectId: 'self', confirmed: true, origin: 'person' }, ledger, pref);
    if (selection.status !== 'show') {
      setShown(null);
      setMessage(copy.refused);
      return;
    }
    const next = markShown(recordSelection(ledger, selection.item), eventId);
    setLedger(next);
    store.save(FEEDBACK_KEY, next);
    setShown({ eventId, kind, line: CATALOG[kind] ?? null });
    setMessage('');
  };

  const hide = () => {
    if (!shown) return;
    const next = dismiss(ledger, shown.eventId);
    setLedger(next);
    store.save(FEEDBACK_KEY, next);
    setShown(null);
  };

  return (
    <section className="card flat mt16" aria-labelledby="e09-title">
      <div className="kicker" id="e09-title">{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 13 }}>{copy.ask}</p>
      <div className="row wrap mt8" style={{ gap: 6 }} role="group" aria-label={copy.kicker}>
        {['full', 'quiet', 'off'].map((mode) => (
          <button key={mode} className="chip" aria-pressed={pref.mode === mode} onClick={() => choosePref(mode)}>{copy.modes[mode]}</button>
        ))}
      </div>
      {pref.mode !== 'off' && (
        <div className="row wrap mt8" style={{ gap: 6 }} role="group" aria-label={copy.ask}>
          {ACTION_KEYS.map((kind) => (
            <button key={kind} className="chip" onClick={() => act(kind)}>{copy.actions[kind]}</button>
          ))}
        </div>
      )}
      {shown && (
        <div className="mt8" role="status">
          <p style={{ fontSize: 13 }}>{shown.line?.observation}</p>
          {shown.line?.hypothesis && <p className="faint mt4" style={{ fontSize: 12 }}>{shown.line.hypothesis}</p>}
          <p className="faint mt4" style={{ fontSize: 11 }}>{copy.englishNote}</p>
          <button className="btn small ghost block mt6" onClick={hide}>{copy.dismiss}</button>
        </div>
      )}
      {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}
    </section>
  );
}
