import React, { useState } from 'react';
import { useApp } from '../app.jsx';
import { store } from '../core/local-store';
import { editField, loopFinder } from '../core/joint-support.ts';
import { ownershipSummary, soloView, withdraw } from '../core/consent-withdrawal.ts';
import { MEMORY_KEY, readMemoryStore } from './memory-panel.jsx';

export const SHARED_KEY = 'INNERVERSE_SHARED_V1';
const CHECKIN_KEY = 'INNERVERSE_CHECKINS_V1';
const RESERVED_NAMES = new Set(['__proto__', 'constructor', 'prototype']);

const COPY = {
  en: {
    kicker: 'Shared support',
    title: 'Notes kept between two people',
    localOnly: (partner) => `Stored on this device only. There is no sharing connection yet, so ${partner} cannot see any of this.`,
    partnerLabel: 'Partner name',
    partnerPlaceholder: 'The name you use for them',
    partnerFallback: 'Partner',
    ownerA: 'Your side',
    you: 'You',
    turnOn: (partner) => `Turn on shared support with ${partner}`,
    needsName: 'Type a partner name first.',
    turnedOn: 'Shared support is on for this device only.',
    stop: 'Stop shared support',
    stopped: 'Shared access has ended. Your own notes stay. Notes your partner wrote stay here, read-only.',
    ownsSolo: (n) => `Your own notes: ${n}. This count is the same whether sharing is on or off.`,
    notes: 'Notes',
    empty: 'No notes yet.',
    edit: 'Edit',
    saveChange: 'Save change',
    cancel: 'Cancel',
    consent: (partner) => `${partner} agreed to this change`,
    readOnly: 'Sharing is off, so this note cannot change right now.',
    reasons: {
      empty: 'Write something first. Nothing was saved.',
      'invalid-name': 'Use a shorter, plain name for this note.',
      exists: 'A note with that name already exists. Edit it instead.',
      'not-shared': 'Turn on shared support before changing a note from your partner.',
      unchanged: 'Nothing changed.',
      'needs-consent': 'This note was written by your partner. It changes only if they agree. Tick the box first.',
    },
    saved: 'Change saved.',
    addTitle: 'Add a note',
    noteName: 'Note name',
    noteNamePlaceholder: 'For example: evening check-in',
    noteText: 'Note',
    author: 'Written by',
    authorMe: 'Me',
    authorPartner: (partner) => `${partner} (typed here by you)`,
    add: 'Add note',
    added: 'Note added.',
    nameTaken: 'A note with that name already exists. Edit it instead.',
    history: 'Edit history',
    historyEmpty: 'No changes yet.',
    historyNew: 'new note',
    consented: 'partner agreed (confirmed here)',
    patternsTitle: 'Things to consider',
    patternsNote: 'Counts from your own entries and check-in labels. Only exact repeats are counted. These are not a diagnosis or a judgement, and only you see this list.',
    patternsEmpty: 'No label has repeated yet.',
    patternLine: (label, n) => `"${label}" appears ${n} times`,
  },
  ru: {
    kicker: 'Совместная поддержка',
    title: 'Записи, которые ведут два человека',
    localOnly: () => 'Хранится только на этом устройстве. Пока нет подключения для совместного доступа, партнёр не видит ничего из этого.',
    partnerLabel: 'Имя партнёра',
    partnerPlaceholder: 'Имя, которым вы его называете',
    partnerFallback: 'Партнёр',
    you: 'Вы',
    turnOn: () => 'Включить совместную поддержку',
    needsName: 'Сначала укажите имя партнёра.',
    turnedOn: 'Совместная поддержка включена только на этом устройстве.',
    stop: 'Остановить совместную поддержку',
    stopped: 'Совместный доступ прекращён. Ваши записи остаются у вас. Записи партнёра остаются на этом устройстве и доступны только для чтения.',
    ownsSolo: (n) => `Ваши собственные записи: ${n}. Это число одинаково, включена совместная поддержка или выключена.`,
    ownA: (shared) => `Ваши собственные записи остаются у вас. Совместная поддержка: ${shared ? 'включена' : 'выключена'}.`,
    ownB: (partner, shared) => `Собственные записи: ${partner}. Совместная поддержка: ${shared ? 'включена' : 'выключена'}.`,
    notes: 'Записи',
    empty: 'Записей пока нет.',
    edit: 'Изменить',
    saveChange: 'Сохранить изменение',
    cancel: 'Отмена',
    consent: () => 'Партнёр согласен с этим изменением',
    readOnly: 'Совместная поддержка выключена, поэтому эту запись сейчас нельзя изменить.',
    reasons: {
      empty: 'Сначала напишите текст. Ничего не сохранено.',
      'invalid-name': 'Укажите короткое понятное название записи.',
      exists: 'Запись с таким названием уже есть. Измените её.',
      'not-shared': 'Включите совместную поддержку, чтобы изменить запись партнёра.',
      unchanged: 'Ничего не изменилось.',
      'needs-consent': 'Эту запись написал партнёр. Она меняется только с его согласия. Сначала отметьте поле.',
    },
    saved: 'Изменение сохранено.',
    addTitle: 'Добавить запись',
    noteName: 'Название записи',
    noteNamePlaceholder: 'Например: вечерний разговор',
    noteText: 'Текст',
    author: 'Кто написал',
    authorMe: 'Я',
    authorPartner: () => 'Партнёр (записано здесь вами)',
    add: 'Добавить запись',
    added: 'Запись добавлена.',
    nameTaken: 'Запись с таким названием уже есть. Измените её.',
    history: 'История изменений',
    historyEmpty: 'Изменений пока нет.',
    historyNew: 'новая запись',
    consented: 'партнёр согласен (отмечено здесь)',
    patternsTitle: 'Над чем стоит подумать',
    patternsNote: 'Счётчики по вашим записям и подписям к отметкам. Считаются только точные повторы. Это не диагноз и не оценка, и этот список видите только вы.',
    patternsEmpty: 'Ни одна подпись пока не повторилась.',
    patternLine: (label, n) => `«${label}»: ${n}`,
  },
};

function refused(doc, reason) {
  return { doc, applied: false, reason };
}

function hasField(fields, name) {
  return Object.prototype.hasOwnProperty.call(fields, name);
}

export function normalizeLabel(text) {
  return String(text ?? '').trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 80);
}

/** Validates the stored value. Anything malformed is dropped, so a corrupt value never grants shared access. */
export function readSharedStore(raw) {
  const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const sourceDoc = value.doc && typeof value.doc === 'object' ? value.doc : {};
  const fields = {};
  const fieldSource = sourceDoc.fields && typeof sourceDoc.fields === 'object' && !Array.isArray(sourceDoc.fields) ? sourceDoc.fields : {};
  for (const [name, field] of Object.entries(fieldSource)) {
    if (RESERVED_NAMES.has(name) || !name) continue;
    if (field && typeof field === 'object' && typeof field.value === 'string' && (field.author === 'a' || field.author === 'b')) {
      fields[name] = { value: field.value, author: field.author };
    }
  }
  const history = (Array.isArray(sourceDoc.history) ? sourceDoc.history : [])
    .filter((h) => h && typeof h.field === 'string' && (h.by === 'a' || h.by === 'b') && typeof h.from === 'string' && typeof h.to === 'string')
    .map((h) => ({ field: h.field, by: h.by, from: h.from, to: h.to, consented: h.consented === true }));
  return {
    shared: value.shared === true,
    partnerName: typeof value.partnerName === 'string' ? value.partnerName.slice(0, 40) : '',
    doc: { fields, history },
  };
}

/**
 * Applies one edit. A field changes only by its author, or with the author's agreement. Partner notes change only while
 * sharing is on. Every applied change is recorded, and a change made with the partner's agreement is marked as such.
 */
export function applyFieldEdit(doc, { by, field, value, consent, shared }) {
  const text = String(value ?? '').trim();
  if (!text) return refused(doc, 'empty');
  if (!field || RESERVED_NAMES.has(field)) return refused(doc, 'invalid-name');
  const current = hasField(doc.fields, field) ? doc.fields[field] : undefined;
  const partnerInvolved = current ? current.author === 'b' || by === 'b' : by === 'b';
  if (partnerInvolved && !shared) return refused(doc, 'not-shared');
  if (current && current.value === text) return refused(doc, 'unchanged');
  const result = editField(doc, by, field, text, consent === true);
  if (!result.applied) return refused(doc, 'needs-consent');
  const usedConsent = current !== undefined && current.author !== by;
  const history = usedConsent
    ? [...result.doc.history.slice(0, -1), { ...result.doc.history[result.doc.history.length - 1], consented: true }]
    : result.doc.history;
  return { doc: { fields: result.doc.fields, history }, applied: true, reason: 'ok' };
}

/** Adds a new note under a name nobody has used yet. */
export function createNote(doc, { key, text, author, shared }) {
  const name = String(key ?? '').trim().slice(0, 40);
  if (!name || RESERVED_NAMES.has(name)) return refused(doc, 'invalid-name');
  if (hasField(doc.fields, name)) return refused(doc, 'exists');
  return applyFieldEdit(doc, { by: author === 'b' ? 'b' : 'a', field: name, value: text, consent: false, shared });
}

/** Repeated labels from the person's own check-ins and user-entry memories. Counts only, with no verdict. */
export function repeatedLabels(checkIns, memoryState) {
  const labels = [];
  for (const entry of Array.isArray(checkIns) ? checkIns : []) {
    if (entry && typeof entry.eventType === 'string') labels.push(entry.eventType);
  }
  for (const memory of memoryState?.memories ?? []) {
    if (memory.source === 'user-entry') labels.push(memory.text);
  }
  const normalized = labels.map(normalizeLabel).filter(Boolean);
  return loopFinder(normalized)
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 8);
}

function readCheckIns() {
  const value = store.load(CHECKIN_KEY, []);
  return Array.isArray(value) ? value : [];
}

export function SharedSupportPanel() {
  const { lang } = useApp();
  const localeKey = COPY[lang] ? lang : 'en';
  const copy = COPY[localeKey];
  const [stored, setStored] = useState(() => readSharedStore(store.load(SHARED_KEY, null)));
  const [noteKey, setNoteKey] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('a');
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');

  const { shared, partnerName, doc } = stored;
  const partner = partnerName.trim() || copy.partnerFallback;
  const support = { shared, ownerA: COPY.en.ownerA, ownerB: partner };
  const ownership = localeKey === 'en'
    ? ownershipSummary(support)
    : { a: copy.ownA(shared), b: copy.ownB(partner, shared) };
  const who = (by) => (by === 'a' ? copy.you : partner);

  const commit = (next) => {
    setStored(next);
    store.save(SHARED_KEY, next);
  };
  const explain = (reason) => copy.reasons?.[reason] ?? copy.reasons.unchanged;

  const turnOn = () => {
    if (!partnerName.trim()) { setMessage(copy.needsName); return; }
    commit({ ...stored, shared: true });
    setMessage(copy.turnedOn);
  };

  const stopSharing = () => {
    commit({ ...stored, shared: withdraw(support).shared });
    setMessage(copy.stopped);
  };

  const saveEdit = () => {
    if (!editing) return;
    const result = applyFieldEdit(doc, { by: 'a', field: editing.field, value: editing.value, consent: editing.consent, shared });
    if (!result.applied) { setMessage(explain(result.reason)); return; }
    commit({ ...stored, doc: result.doc });
    setEditing(null);
    setMessage(copy.saved);
  };

  const saveNewNote = () => {
    if (hasField(doc.fields, noteKey.trim())) { setMessage(copy.nameTaken); return; }
    const result = createNote(doc, { key: noteKey, text: noteText, author: noteAuthor, shared });
    if (!result.applied) { setMessage(explain(result.reason)); return; }
    commit({ ...stored, doc: result.doc });
    setNoteKey('');
    setNoteText('');
    setMessage(copy.added);
  };

  const entries = Object.entries(doc.fields);
  const ownKeys = entries.filter(([, field]) => field.author === 'a').map(([name]) => name);
  const solo = soloView({ items: ownKeys, progress: ownKeys.length });
  const patterns = repeatedLabels(readCheckIns(), readMemoryStore(store.load(MEMORY_KEY, null)));
  const history = [...doc.history].reverse().slice(0, 30);

  return (
    <section className="card mt16" aria-labelledby="shared-support-title">
      <div className="kicker" style={{ color: 'var(--accent-text)' }}>{copy.kicker}</div>
      <div className="h2 mt6" id="shared-support-title">{copy.title}</div>
      <p className="sub mt8" style={{ fontSize: 12.5 }}>{copy.localOnly(partner)}</p>

      <div className="field mt12">
        <label htmlFor="shared-partner-name">{copy.partnerLabel}</label>
        <input id="shared-partner-name" value={partnerName} maxLength={40} placeholder={copy.partnerPlaceholder}
          onChange={(event) => commit({ ...stored, partnerName: event.target.value.slice(0, 40) })} />
      </div>

      <ul className="faint mt8" style={{ fontSize: 12, paddingLeft: 18, lineHeight: 1.5 }}>
        <li>{ownership.a}</li>
        <li>{ownership.b}</li>
      </ul>

      <div className="row mt12" style={{ flexWrap: 'wrap' }}>
        {shared ? (
          <button className="btn small ghost" onClick={stopSharing}>{copy.stop}</button>
        ) : (
          <button className="btn small primary" disabled={!partnerName.trim()} onClick={turnOn}>{copy.turnOn(partner)}</button>
        )}
      </div>
      {!shared && !partnerName.trim() && <p className="faint mt8" style={{ fontSize: 12 }}>{copy.needsName}</p>}
      {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}

      <p className="sub mt12" style={{ fontSize: 12.5 }}>{copy.ownsSolo(solo.progress)}</p>

      <div className="kicker mt16">{copy.notes}</div>
      {entries.length === 0 ? <p className="sub mt8">{copy.empty}</p> : entries.map(([name, field]) => {
        const isEditing = editing?.field === name;
        const canEdit = field.author === 'a' || shared;
        return (
          <div key={name} className="card flat mt10">
            <div className="row">
              <b className="grow" style={{ fontSize: 14, overflowWrap: 'anywhere' }}>{name}</b>
              <span className="chip">{who(field.author)}</span>
            </div>
            {isEditing ? (
              <div className="mt8">
                <div className="field">
                  <textarea aria-label={name} rows={3} value={editing.value}
                    onChange={(event) => setEditing({ ...editing, value: event.target.value })} />
                </div>
                {field.author === 'b' && (
                  <label className="row mt8" style={{ gap: 10, fontSize: 13, fontWeight: 700, minHeight: 40, cursor: 'pointer' }}>
                    <input type="checkbox" checked={editing.consent} style={{ width: 22, height: 22, flex: '0 0 22px', accentColor: 'var(--accent)' }}
                      onChange={(event) => setEditing({ ...editing, consent: event.target.checked })} />
                    <span>{copy.consent(partner)}</span>
                  </label>
                )}
                <div className="row mt8" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn small primary" onClick={saveEdit}>{copy.saveChange}</button>
                  <button className="btn small ghost" onClick={() => setEditing(null)}>{copy.cancel}</button>
                </div>
              </div>
            ) : (
              <>
                <p className="mt8" style={{ fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{field.value}</p>
                {!canEdit && <p className="faint mt8" style={{ fontSize: 12 }}>{copy.readOnly}</p>}
                {canEdit && (
                  <button className="btn small ghost mt8"
                    onClick={() => setEditing({ field: name, value: field.value, consent: false })}>{copy.edit}</button>
                )}
              </>
            )}
          </div>
        );
      })}

      <div className="card flat mt16">
        <div className="kicker">{copy.addTitle}</div>
        <div className="field mt8">
          <label htmlFor="shared-note-name">{copy.noteName}</label>
          <input id="shared-note-name" maxLength={40} placeholder={copy.noteNamePlaceholder} value={noteKey}
            onChange={(event) => setNoteKey(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="shared-note-text">{copy.noteText}</label>
          <textarea id="shared-note-text" rows={3} maxLength={500} value={noteText}
            onChange={(event) => setNoteText(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="shared-note-author">{copy.author}</label>
          <select id="shared-note-author" className="drop" value={noteAuthor} onChange={(event) => setNoteAuthor(event.target.value)}>
            <option value="a">{copy.authorMe}</option>
            <option value="b" disabled={!shared}>{copy.authorPartner(partner)}</option>
          </select>
        </div>
        <button className="btn small primary" onClick={saveNewNote}>{copy.add}</button>
      </div>

      <div className="card flat mt16">
        <div className="kicker">{copy.patternsTitle}</div>
        <p className="faint mt8" style={{ fontSize: 12, lineHeight: 1.5 }}>{copy.patternsNote}</p>
        {patterns.length === 0 ? (
          <p className="sub mt8">{copy.patternsEmpty}</p>
        ) : (
          <ul className="mt8" style={{ paddingLeft: 18, fontSize: 13.5, lineHeight: 1.5, overflowWrap: 'anywhere' }}>
            {patterns.map((pattern) => (
              <li key={pattern.description}>{copy.patternLine(pattern.description, pattern.occurrences)}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="kicker mt16">{copy.history}</div>
      {history.length === 0 ? (
        <p className="sub mt8">{copy.historyEmpty}</p>
      ) : (
        <ul className="mt8" style={{ paddingLeft: 18, fontSize: 12.5, lineHeight: 1.5, overflowWrap: 'anywhere' }}>
          {history.map((entry, index) => (
            <li key={`${entry.field}-${index}`}>
              {who(entry.by)} · {entry.field}: {entry.from || copy.historyNew} → {entry.to}
              {entry.consented ? ` (${copy.consented})` : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
