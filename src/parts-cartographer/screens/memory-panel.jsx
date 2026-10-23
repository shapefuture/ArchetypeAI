import React, { useState } from 'react';
import { useApp } from '../app.jsx';
import { store } from '../core/local-store';
import { addMemory, contextMemories, correctMemory, deleteWithDerived } from '../core/personal-memory.ts';
import './memory-panel.css';

export const MEMORY_KEY = 'INNERVERSE_MEMORY_V1';
const SOURCES = ['user-entry', 'assessment', 'model-inference'];

const COPY = {
  en: {
    kicker: 'Memory',
    title: 'What is kept about you',
    intro: 'Every memory says where it came from. Only memories you keep are used as context, and unsaved chat is never used.',
    localOnly: 'Stored on this device only.',
    sources: { 'user-entry': 'You wrote this', assessment: 'From an assessment', 'model-inference': 'Inferred by AI' },
    keptOn: 'Used as context',
    keptOff: 'Not used as context',
    useInContext: 'Use as context',
    basedOn: (texts) => `Based on: ${texts}`,
    earlier: 'Earlier wording',
    correct: 'Correct',
    remove: 'Delete',
    saveCorrection: 'Save correction',
    cancel: 'Cancel',
    addTitle: 'Add a memory you want kept',
    addPlaceholder: 'Write it in your own words',
    addKeep: 'Use as context',
    addButton: 'Add memory',
    addEmpty: 'Write something first. Nothing was saved.',
    added: 'Memory added.',
    correctionEmpty: 'The correction is empty, so the memory was not changed.',
    unchanged: 'Nothing changed.',
    corrected: 'Correction saved. The earlier wording stays under the memory.',
    confirmTitle: 'Delete this memory?',
    confirmDerived: 'These memories were built from it, so they will be deleted too:',
    confirmNone: 'Nothing else was built from it.',
    confirmDelete: 'Delete',
    deleted: (n) => (n === 1 ? 'Deleted 1 memory.' : `Deleted ${n} memories, including ones built from the first.`),
    empty: 'No memories yet. Add one above.',
    contextCount: (used, total) => `${used} of ${total} used as context.`,
  },
  ru: {
    kicker: 'Память',
    title: 'Что сохранено о вас',
    intro: 'У каждой записи указано, откуда она взята. В контексте используются только записи, которые вы сохранили. Несохранённый чат не используется никогда.',
    localOnly: 'Хранится только на этом устройстве.',
    sources: { 'user-entry': 'Вы написали', assessment: 'Из оценки', 'model-inference': 'Вывод ИИ' },
    keptOn: 'Используется в контексте',
    keptOff: 'Не используется в контексте',
    useInContext: 'Использовать в контексте',
    basedOn: (texts) => `Основано на: ${texts}`,
    earlier: 'Прежняя формулировка',
    correct: 'Исправить',
    remove: 'Удалить',
    saveCorrection: 'Сохранить исправление',
    cancel: 'Отмена',
    addTitle: 'Добавить запись, которую нужно сохранить',
    addPlaceholder: 'Напишите своими словами',
    addKeep: 'Использовать в контексте',
    addButton: 'Добавить',
    addEmpty: 'Сначала напишите текст. Ничего не сохранено.',
    added: 'Запись добавлена.',
    correctionEmpty: 'Исправление пустое, поэтому запись не изменена.',
    unchanged: 'Ничего не изменилось.',
    corrected: 'Исправление сохранено. Прежняя формулировка осталась под записью.',
    confirmTitle: 'Удалить эту запись?',
    confirmDerived: 'На её основе созданы записи ниже. Они тоже будут удалены:',
    confirmNone: 'На её основе ничего не создавалось.',
    confirmDelete: 'Удалить',
    deleted: (n) => (n === 1 ? 'Удалена 1 запись.' : `Удалено записей: ${n}, включая созданные на основе первой.`),
    empty: 'Записей пока нет. Добавьте первую выше.',
    contextCount: (used, total) => `В контексте: ${used} из ${total}.`,
  },
};

export function defaultSaved(source) {
  // Inferred memories are not kept until the person keeps them. Entries the person wrote, or came from an assessment, are.
  return source !== 'model-inference';
}

function readMemory(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  if (typeof item.id !== 'string' || !item.id || typeof item.text !== 'string' || !item.text.trim()) return null;
  if (!SOURCES.includes(item.source)) return null;
  const derivedFrom = Array.isArray(item.derivedFrom) ? item.derivedFrom.filter((id) => typeof id === 'string') : [];
  const saved = typeof item.saved === 'boolean' ? item.saved : defaultSaved(item.source);
  return { id: item.id, text: item.text, source: item.source, derivedFrom, saved };
}

function readCorrection(item) {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.memoryId !== 'string' || typeof item.previous !== 'string' || typeof item.next !== 'string') return null;
  return { memoryId: item.memoryId, previous: item.previous, next: item.next, at: typeof item.at === 'string' ? item.at : '' };
}

/** Validates the stored envelope. Malformed entries are dropped, and a correction whose memory is gone is dropped with it. */
export function readMemoryStore(raw) {
  const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const memories = [];
  for (const item of Array.isArray(value.memories) ? value.memories : []) {
    const memory = readMemory(item);
    if (memory && !memories.some((existing) => existing.id === memory.id)) memories.push(memory);
  }
  const corrections = (Array.isArray(value.corrections) ? value.corrections : [])
    .map(readCorrection)
    .filter((correction) => correction && memories.some((memory) => memory.id === correction.memoryId));
  return { memories, corrections };
}

export function loadMemoryStore() {
  return readMemoryStore(store.load(MEMORY_KEY, null));
}

function saveMemoryStore(state) {
  store.save(MEMORY_KEY, state);
}

export function newUserMemory(text, id) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return null;
  return { id, text: trimmed, source: 'user-entry', derivedFrom: [], saved: defaultSaved('user-entry') };
}

export function setMemorySaved(memories, id, saved) {
  return memories.map((memory) => (memory.id === id ? { ...memory, saved } : memory));
}

/** Keeps the earlier wording. A correction that changes nothing is not recorded. */
export function recordCorrection(corrections, correction, at) {
  if (!correction || correction.previous === correction.next) return corrections;
  return [...corrections, { ...correction, at }];
}

function newId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function MemoryPanel() {
  const { lang } = useApp();
  const copy = COPY[lang] ?? COPY.en;
  const [state, setState] = useState(loadMemoryStore);
  const [draft, setDraft] = useState('');
  const [draftKeep, setDraftKeep] = useState(true);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [message, setMessage] = useState('');
  const { memories, corrections } = state;

  const commit = (next) => {
    setState(next);
    saveMemoryStore(next);
  };

  const addEntry = () => {
    const memory = newUserMemory(draft, newId('m'));
    const next = memory ? addMemory(memories, { ...memory, saved: draftKeep }) : null;
    if (!next) { setMessage(copy.addEmpty); return; }
    commit({ memories: next, corrections });
    setDraft('');
    setDraftKeep(true);
    setMessage(copy.added);
  };

  const saveCorrection = () => {
    if (!editing) return;
    const { memories: updated, correction } = correctMemory(memories, editing.id, editing.text);
    if (!correction) { setMessage(copy.correctionEmpty); return; }
    if (correction.previous === correction.next) { setMessage(copy.unchanged); setEditing(null); return; }
    commit({ memories: updated, corrections: recordCorrection(corrections, correction, new Date().toISOString()) });
    setEditing(null);
    setMessage(copy.corrected);
  };

  const preview = pendingDelete ? deleteWithDerived(memories, pendingDelete) : null;
  const derivedToRemove = preview ? memories.filter((m) => preview.removed.includes(m.id) && m.id !== pendingDelete) : [];

  const confirmDelete = () => {
    if (!preview) return;
    const removed = preview.removed;
    commit({
      memories: preview.memories,
      corrections: corrections.filter((correction) => !removed.includes(correction.memoryId)),
    });
    if (editing && removed.includes(editing.id)) setEditing(null);
    setPendingDelete(null);
    setMessage(copy.deleted(removed.length));
  };

  const textOf = (id) => memories.find((m) => m.id === id)?.text ?? '';
  const used = contextMemories(memories).length;
  const ordered = [...memories].reverse();

  return (
    <section className="card mt16 mp-panel" aria-labelledby="memory-panel-title">
      <div className="kicker" style={{ color: 'var(--accent-text)' }}>{copy.kicker}</div>
      <div className="h2 mt6" id="memory-panel-title">{copy.title}</div>
      <p className="sub mp-intro">{copy.intro}</p>
      <p className="faint mp-intro">{copy.localOnly}</p>
      {memories.length > 0 && <p className="faint mp-intro" data-testid="memory-context-count">{copy.contextCount(used, memories.length)}</p>}

      {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}

      {pendingDelete && preview && (
        <div className="mp-confirm" role="alertdialog" aria-label={copy.confirmTitle}>
          <b style={{ fontSize: 14 }}>{copy.confirmTitle}</b>
          {derivedToRemove.length === 0 ? (
            <p className="sub mt6">{copy.confirmNone}</p>
          ) : (
            <>
              <p className="sub mt6">{copy.confirmDerived}</p>
              <ul className="mp-derived-list">
                {derivedToRemove.map((m) => <li key={m.id}>{m.text}</li>)}
              </ul>
            </>
          )}
          <div className="mp-actions">
            <button className="btn small danger" onClick={confirmDelete}>{copy.confirmDelete}</button>
            <button className="btn small ghost" onClick={() => setPendingDelete(null)}>{copy.cancel}</button>
          </div>
        </div>
      )}

      {memories.length === 0 ? (
        <p className="sub mt12">{copy.empty}</p>
      ) : (
        <ul className="mp-list mt12">
          {ordered.map((m) => {
            const isEditing = editing?.id === m.id;
            const earlier = corrections.filter((c) => c.memoryId === m.id);
            const basis = m.derivedFrom.map(textOf).filter(Boolean);
            return (
              <li key={m.id} className="mp-item">
                <div className="mp-meta">
                  <span className="chip">{copy.sources[m.source]}</span>
                  <span className="mp-state">{m.saved ? copy.keptOn : copy.keptOff}</span>
                </div>

                {isEditing ? (
                  <div className="field mt8">
                    <textarea
                      aria-label={copy.correct}
                      rows={3}
                      value={editing.text}
                      onChange={(event) => setEditing({ id: m.id, text: event.target.value })}
                    />
                    <div className="mp-actions">
                      <button className="btn small primary" onClick={saveCorrection}>{copy.saveCorrection}</button>
                      <button className="btn small ghost" onClick={() => setEditing(null)}>{copy.cancel}</button>
                    </div>
                  </div>
                ) : (
                  <p className="mp-text">{m.text}</p>
                )}

                {basis.length > 0 && <p className="mp-note">{copy.basedOn(basis.join(' · '))}</p>}
                {earlier.map((c, index) => (
                  <p key={`${c.memoryId}-${index}`} className="mp-note">{copy.earlier}: {c.previous}</p>
                ))}

                <label className="mp-toggle">
                  <input type="checkbox" checked={m.saved}
                    onChange={(event) => commit({ memories: setMemorySaved(memories, m.id, event.target.checked), corrections })} />
                  <span>{copy.useInContext}</span>
                </label>

                {!isEditing && (
                  <div className="mp-actions">
                    <button className="btn small ghost" onClick={() => setEditing({ id: m.id, text: m.text })}>{copy.correct}</button>
                    <button className="btn small ghost" onClick={() => setPendingDelete(m.id)}>{copy.remove}</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mp-add mt16">
        <div className="kicker">{copy.addTitle}</div>
        <div className="field mt8">
          <textarea
            aria-label={copy.addTitle}
            rows={3}
            placeholder={copy.addPlaceholder}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        <label className="mp-toggle">
          <input type="checkbox" checked={draftKeep} onChange={(event) => setDraftKeep(event.target.checked)} />
          <span>{copy.addKeep}</span>
        </label>
        <button className="btn small primary mt8" onClick={addEntry}>{copy.addButton}</button>
      </div>
    </section>
  );
}
