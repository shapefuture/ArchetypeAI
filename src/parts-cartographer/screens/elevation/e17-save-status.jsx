// E17 understandable reliability (ArchetypeAI-xdlo, step 05 UI). A note is saved on this device and read back to confirm
// it. The status line comes from the pure E17 persistence machine, so "saved" means the value came back, not that a write
// was attempted. Nothing is sent to a server from here.
import React, { useId, useState } from 'react';
import { useApp } from '../../app.jsx';
import { store } from '../../core/local-store';
import { reducePersist, verifyWrite } from '../../elevation/e17-operation-status.ts';

export const NOTE_DRAFT_KEY = 'INNERVERSE_NOTE_DRAFT_V1';

const COPY = {
  en: {
    kicker: 'Saving on this device',
    ask: 'Write a short note. It is saved here and read back, so you know it was kept.',
    save: 'Save note',
    labels: {
      clean: 'Nothing to save',
      dirty: 'Not saved yet',
      saving: 'Saving…',
      saved: 'Saved on this device',
      failed: 'Not saved. It could not be confirmed. Your text is still here.',
    },
  },
  ru: {
    kicker: 'Сохранение на этом устройстве',
    ask: 'Напишите короткую заметку. Она сохраняется здесь и читается обратно, чтобы вы знали, что она сохранилась.',
    save: 'Сохранить заметку',
    labels: {
      clean: 'Нечего сохранять',
      dirty: 'Ещё не сохранено',
      saving: 'Сохраняется…',
      saved: 'Сохранено на этом устройстве',
      failed: 'Не сохранено: не удалось подтвердить. Ваш текст остался здесь.',
    },
  },
};

function initial() {
  const saved = store.load(NOTE_DRAFT_KEY, null);
  if (saved && typeof saved.text === 'string' && saved.text.length > 0) {
    return { state: { status: 'saved', draft: saved.text, savedAt: saved.savedAt ?? 0 }, text: saved.text };
  }
  return { state: { status: 'clean' }, text: '' };
}

export function SaveStatusPanel() {
  const { lang } = useApp() ?? {};
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  // The question above the field is its label, so screen readers announce what to write.
  const askId = useId();
  const [start] = useState(initial);
  const [persist, setPersist] = useState(start.state);
  const [text, setText] = useState(start.text);

  const edit = (value) => {
    setText(value);
    setPersist(reducePersist(persist, { type: 'edit', draft: value }).state);
  };

  const save = () => {
    const draft = text;
    setPersist(reducePersist(persist, { type: 'saveStart' }).state);
    store.save(NOTE_DRAFT_KEY, { text: draft, savedAt: Date.now() });
    const readBack = store.load(NOTE_DRAFT_KEY, null)?.text ?? null;
    const outcome = verifyWrite({ expected: draft, readBack });
    setPersist(reducePersist({ status: 'saving', draft, attempt: 1 }, { type: 'saveResult', outcome, now: Date.now() }).state);
  };

  return (
    <section className="card flat mt16" aria-labelledby="e17-title">
      <div className="kicker" id="e17-title">{copy.kicker}</div>
      <p className="sub mt8" id={askId} style={{ fontSize: 13 }}>{copy.ask}</p>
      <label className="field mt8">
        <textarea className="drop" rows={2} aria-labelledby={askId} value={text} onChange={(e) => edit(e.target.value)} />
      </label>
      <button className="btn small primary block mt8" disabled={!text.trim() || persist.status === 'saving'} onClick={save}>{copy.save}</button>
      <p className="faint mt6" role="status" style={{ fontSize: 12 }}>{copy.labels[persist.status]}</p>
    </section>
  );
}
