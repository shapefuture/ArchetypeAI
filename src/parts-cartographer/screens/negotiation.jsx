import React, { useMemo, useState } from 'react';
import { useApp } from '../app.jsx';
import { store, KEYS } from '../core/local-store.ts';
import { branch, decline, editMove, negotiate } from '../core/inner-negotiation.ts';
import { saveVerified } from '../core/replay-scenes.ts';
import { FAMILY_LABELS } from '../pal/traits.ts';
import './replay.css';

export const NEGOTIATION_KEY = 'INNERVERSE_NEGOTIATION_V1';
const MOVE_LIMIT = 280;
const BRANCH_LIMIT = 280;
const MAX_BRANCHES = 8;

const COPY = {
  en: {
    title: 'Inner negotiation',
    intro: 'Parts can agree, decline, or stay open. Nothing here asks for consensus. A partial or open outcome is a valid place to stop.',
    noParts: 'No parts to talk with yet. Parts you add in the Innerverse will appear here.',
    partsHeading: 'Parts',
    agree: 'Agree',
    decline: 'Decline',
    open: 'Leave open',
    unnamed: 'Unnamed part',
    status: { agreed: 'Agreed', declined: 'Declined', open: 'Open' },
    outcome: {
      'all-agreed': 'All parts have agreed to this move for now.',
      partial: 'Some parts agreed. Others declined or are still open. This is a valid place to stop.',
      open: 'Still open. Each part can answer when it is ready.',
    },
    counts: (agreed, declined, open) => `Agreed: ${agreed} · Declined: ${declined} · Open: ${open}`,
    moveHeading: 'Small move',
    moveNote: 'One small, concrete step the parts could try. Keep it short.',
    moveEmpty: 'No move written yet.',
    moveLabel: 'Move',
    editMove: 'Edit',
    saveMove: 'Save move',
    cancel: 'Cancel',
    moveKept: 'A move needs some words, so the previous move was kept.',
    branchHeading: 'Hypothetical branches',
    branchNote: 'A what-if is only a thought to look at. It is labelled hypothetical and changes no part.',
    branchLabel: 'What if…',
    addBranch: 'Add hypothetical branch',
    branchEmpty: 'Write a sentence first.',
    branchLimit: (n) => `Keep to ${n} branches. Remove one to add another.`,
    hypothetical: 'Hypothetical',
    removeBranch: 'Remove',
    notStored: 'This browser would not keep the change. It applies for this visit only.',
  },
  ru: {
    title: 'Внутренние переговоры',
    intro: 'Части могут согласиться, отказаться или оставить вопрос открытым. Здесь никто не требует согласия. Частичный или открытый итог — допустимое место, чтобы остановиться.',
    noParts: 'Пока нет частей для разговора. Части, которые вы добавите во Вселенной, появятся здесь.',
    partsHeading: 'Части',
    agree: 'Согласиться',
    decline: 'Отказаться',
    open: 'Оставить открытым',
    unnamed: 'Часть без имени',
    status: { agreed: 'Согласна', declined: 'Отказ', open: 'Открыто' },
    outcome: {
      'all-agreed': 'Все части пока согласны с этим шагом.',
      partial: 'Некоторые части согласились. Другие отказались или ещё не ответили. Это допустимое место, чтобы остановиться.',
      open: 'Пока открыто. Каждая часть может ответить, когда будет готова.',
    },
    counts: (agreed, declined, open) => `Согласились: ${agreed} · Отказались: ${declined} · Открыто: ${open}`,
    moveHeading: 'Небольшой шаг',
    moveNote: 'Один небольшой и конкретный шаг, который части могли бы попробовать. Пишите коротко.',
    moveEmpty: 'Шаг пока не записан.',
    moveLabel: 'Шаг',
    editMove: 'Изменить',
    saveMove: 'Сохранить шаг',
    cancel: 'Отмена',
    moveKept: 'В шаге должны быть слова, поэтому прежний шаг сохранён.',
    branchHeading: 'Гипотетические ветки',
    branchNote: 'Вопрос «а что если» — это мысль, на которую можно посмотреть. Она помечена как гипотетическая и ничего не меняет в частях.',
    branchLabel: 'А что если…',
    addBranch: 'Добавить гипотетическую ветку',
    branchEmpty: 'Сначала напишите предложение.',
    branchLimit: (n) => `Не больше ${n} веток. Чтобы добавить новую, уберите одну.`,
    hypothetical: 'Гипотетически',
    removeBranch: 'Убрать',
    notStored: 'Браузер не сохранил изменение. Оно действует только для этого визита.',
  },
};

const copyFor = (lang) => ({ ...COPY.en, ...COPY[lang === 'ru' ? 'ru' : 'en'] });
const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** Corrupt values fall back to an empty record: no move, no answers, no branches. */
export function normalizeNegotiation(value) {
  const v = isObject(value) ? value : {};
  const answers = Object.create(null);
  if (isObject(v.answers)) {
    for (const [id, agreed] of Object.entries(v.answers)) {
      if (id && typeof agreed === 'boolean') answers[id] = agreed;
    }
  }
  const branches = Array.isArray(v.branches)
    ? v.branches
      .filter((item) => isObject(item) && item.label === 'hypothetical' && typeof item.text === 'string' && item.text.trim())
      .slice(0, MAX_BRANCHES)
      .map((item) => ({ label: 'hypothetical', text: item.text.trim().slice(0, BRANCH_LIMIT) }))
    : [];
  return { move: typeof v.move === 'string' ? v.move.slice(0, MOVE_LIMIT) : '', answers, branches };
}

/** Parts come from the saved parts list. Without one, the parts the app is showing are used. */
export function readNegotiationParts(contextParts) {
  const stored = store.load(KEYS.parts, null);
  const list = Array.isArray(stored) ? stored : (Array.isArray(contextParts) ? contextParts : []);
  return list.filter((part) => isObject(part) && typeof part.id === 'string' && part.id.length > 0);
}

function PartRow({ ui, lang, part, agreed, onChange }) {
  const name = (lang === 'ru' ? part.nameRu : part.nameEn) ?? part.name ?? ui.unnamed;
  const state = agreed === true ? 'agreed' : agreed === false ? 'declined' : 'open';
  const family = FAMILY_LABELS[part.family];
  return (
    <div className="iv-part">
      <div className="iv-part-head">
        <span aria-hidden="true">{family?.icon}</span>
        <span className="grow">{name}</span>
        <span className="iv-label-badge">{ui.status[state]}</span>
      </div>
      <div className="iv-choice" role="group" aria-label={name}>
        <button type="button" className={`chip ${agreed === true ? 'on' : ''}`} aria-pressed={agreed === true} onClick={() => onChange(true)}>{ui.agree}</button>
        <button type="button" className={`chip ${agreed === false ? 'on' : ''}`} aria-pressed={agreed === false} onClick={() => onChange(false)}>{ui.decline}</button>
        <button type="button" className={`chip ${agreed === null ? 'on' : ''}`} aria-pressed={agreed === null} onClick={() => onChange(null)}>{ui.open}</button>
      </div>
    </div>
  );
}

export function InnerNegotiation() {
  const app = useApp();
  const lang = app?.lang === 'ru' ? 'ru' : 'en';
  const ui = copyFor(app?.lang);
  const parts = useMemo(() => readNegotiationParts(app?.parts), [app?.parts]);
  const [record, setRecord] = useState(() => normalizeNegotiation(store.load(NEGOTIATION_KEY, null)));
  const [notice, setNotice] = useState('');
  const [moveDraft, setMoveDraft] = useState(null);
  const [branchDraft, setBranchDraft] = useState('');

  const negotiating = parts.map((part) => ({
    id: part.id,
    agreed: Object.prototype.hasOwnProperty.call(record.answers, part.id) ? record.answers[part.id] : null,
  }));
  const outcome = negotiate(negotiating);
  const agreedCount = negotiating.filter((p) => p.agreed === true).length;
  const declinedCount = negotiating.filter((p) => p.agreed === false).length;
  const openCount = negotiating.filter((p) => p.agreed === null).length;

  const persist = (next) => {
    if (!saveVerified(NEGOTIATION_KEY, next)) { setNotice(ui.notStored); return false; }
    setRecord(next);
    return true;
  };

  const setAgreement = (id, value) => {
    // A decline is recorded as given; nothing here changes it on the person's behalf.
    const next = value === false
      ? decline(negotiating, id)
      : negotiating.map((p) => (p.id === id ? { ...p, agreed: value } : p));
    const answers = Object.create(null);
    for (const p of next) {
      if (typeof p.agreed === 'boolean') answers[p.id] = p.agreed;
    }
    setNotice('');
    persist({ ...record, answers });
  };

  const saveMove = () => {
    const draft = moveDraft ?? '';
    const move = editMove(record.move, draft);
    if (!persist({ ...record, move })) return;
    if (draft.trim()) {
      setMoveDraft(null);
      setNotice('');
    } else {
      setNotice(ui.moveKept);
    }
  };

  const addBranch = () => {
    const hypothesis = branch(branchDraft);
    if (!hypothesis) { setNotice(ui.branchEmpty); return; }
    if (record.branches.length >= MAX_BRANCHES) { setNotice(ui.branchLimit(MAX_BRANCHES)); return; }
    if (persist({ ...record, branches: [...record.branches, { label: hypothesis.label, text: hypothesis.text.slice(0, BRANCH_LIMIT) }] })) {
      setBranchDraft('');
      setNotice('');
    }
  };

  const removeBranch = (index) => {
    persist({ ...record, branches: record.branches.filter((_, i) => i !== index) });
  };

  return (
    <section className="iv-panel" aria-labelledby="inner-negotiation-title">
      <h2 id="inner-negotiation-title">{ui.title}</h2>
      <p className="iv-panel-note">{ui.intro}</p>

      {parts.length === 0 ? (
        <p className="iv-panel-note">{ui.noParts}</p>
      ) : (
        <>
          <div className="iv-field-group">
            <h3>{ui.partsHeading}</h3>
            {parts.map((part, index) => (
              <PartRow
                key={part.id || index}
                ui={ui}
                lang={lang}
                part={part}
                agreed={negotiating[index].agreed}
                onChange={(value) => setAgreement(part.id, value)}
              />
            ))}
          </div>
          <div className="card iv-card-tight">
            <p className="iv-status">{ui.outcome[outcome]}</p>
            <p className="iv-panel-note">{ui.counts(agreedCount, declinedCount, openCount)}</p>
          </div>
        </>
      )}

      <div className="iv-panel">
        <h3>{ui.moveHeading}</h3>
        <p className="iv-panel-note">{ui.moveNote}</p>
        {moveDraft === null ? (
          <>
            <p className="iv-status">{record.move || ui.moveEmpty}</p>
            <div className="iv-row"><button type="button" className="btn ghost small" onClick={() => setMoveDraft(record.move)}>{ui.editMove}</button></div>
          </>
        ) : (
          <>
            <label className="field">{ui.moveLabel}
              <textarea rows={2} maxLength={MOVE_LIMIT} value={moveDraft} onChange={(event) => setMoveDraft(event.target.value)} />
            </label>
            <div className="iv-row">
              <button type="button" className="btn primary small" onClick={saveMove}>{ui.saveMove}</button>
              <button type="button" className="btn ghost small" onClick={() => { setMoveDraft(null); setNotice(''); }}>{ui.cancel}</button>
            </div>
          </>
        )}
      </div>

      <div className="iv-panel">
        <h3>{ui.branchHeading}</h3>
        <p className="iv-panel-note">{ui.branchNote}</p>
        {record.branches.map((item, index) => (
          <div className="iv-hypo" key={`branch-${index}`}>
            <span className="iv-label-badge">{ui.hypothetical}</span>
            <p>{item.text}</p>
            <div className="iv-row"><button type="button" className="btn ghost small" onClick={() => removeBranch(index)}>{ui.removeBranch}</button></div>
          </div>
        ))}
        <label className="field">{ui.branchLabel}
          <textarea rows={2} maxLength={BRANCH_LIMIT} value={branchDraft} onChange={(event) => setBranchDraft(event.target.value)} />
        </label>
        <div className="iv-row"><button type="button" className="btn small" onClick={addBranch}>{ui.addBranch}</button></div>
      </div>

      <p className="iv-status" role="status">{notice}</p>
    </section>
  );
}
