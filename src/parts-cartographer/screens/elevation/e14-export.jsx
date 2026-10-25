// E14 tools useful outside the app (ArchetypeAI-izqt, step 05 UI). A saved note becomes a plain-text pocket card, shown
// as a preview first. Only shareable fields are included, and private fields are left out unless the person chooses
// them. Downloads are made through the pure E14 module, which refuses a preview that no longer matches its source.
import React, { useState } from 'react';
import { useApp } from '../../app.jsx';
import { store } from '../../core/local-store';
import { downloadText } from '../../core/file-download';
import { loadMemories } from '../memory-panel.jsx';
import { deriveArtifact, memorySource, previewExport } from '../../elevation/e14-export.ts';

const COPY = {
  en: {
    kicker: 'Take it with you',
    ask: 'Turn a saved note into a plain-text card. You see the card before anything is downloaded.',
    none: 'Nothing saved to export yet.',
    pick: 'Choose a note',
    preview: 'Preview',
    download: 'Download text card',
    excluded: 'Left out',
    refused: 'The card could not be made. Nothing was downloaded.',
    includeText: 'Include my note text (private)',
  },
  ru: {
    kicker: 'Возьмите с собой',
    ask: 'Превратите сохранённую заметку в простую текстовую карточку. Вы увидите её до загрузки.',
    none: 'Пока нечего экспортировать.',
    pick: 'Выберите заметку',
    preview: 'Предпросмотр',
    download: 'Скачать текстовую карточку',
    excluded: 'Не включено',
    refused: 'Карточку не удалось создать. Ничего не загружено.',
    includeText: 'Включить текст моей заметки (личное)',
  },
};

export function PocketCardPanel() {
  const { lang } = useApp() ?? {};
  const lk = lang === 'ru' ? 'ru' : 'en';
  const copy = COPY[lk];
  const saved = loadMemories().filter((memory) => memory.saved);
  const [chosen, setChosen] = useState(null);
  const [includeText, setIncludeText] = useState(false);
  const [message, setMessage] = useState('');

  const memory = saved.find((item) => item.id === chosen) ?? null;
  // The saved note text is its first version. Private text is exported only when the person ticks the box.
  const versions = memory ? [{ version: '1', locale: lk, text: memory.text, private: true }] : [];
  const source = memory ? memorySource(memory, versions) : null;
  const selection = source ? {
    sourceId: source.id,
    locale: lk,
    includeBody: includeText,
    versionId: null,
    fieldKeys: source.fields.filter((field) => field.sensitivity === 'shareable' || (includeText && field.key === 'text')).map((field) => field.key),
    includePrivate: includeText,
  } : null;
  const result = source && selection ? previewExport(source, selection) : null;
  const preview = result && result.ok ? result.preview : null;

  const download = () => {
    if (!source || !selection || !preview) return;
    const made = deriveArtifact(source, selection, preview.fingerprint, new Date().toISOString());
    if (made.ok === false) { setMessage(copy.refused); return; }
    downloadText(made.artifact.text, made.artifact.fileName, made.artifact.mime);
    setMessage('');
  };

  return (
    <section className="card flat mt16" aria-labelledby="e14-title">
      <div className="kicker" id="e14-title">{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 13 }}>{copy.ask}</p>
      {saved.length === 0 && <p className="faint mt6" style={{ fontSize: 12 }}>{copy.none}</p>}
      {saved.length > 0 && (
        <div className="row wrap mt8" style={{ gap: 6 }} role="group" aria-label={copy.pick}>
          {saved.map((item) => (
            <button key={item.id} className="chip" aria-pressed={chosen === item.id} onClick={() => setChosen(item.id)}>
              {item.text.length > 32 ? `${item.text.slice(0, 32)}…` : item.text}
            </button>
          ))}
        </div>
      )}
      {memory && (
        <label className="row mt8" style={{ gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={includeText} onChange={(e) => setIncludeText(e.target.checked)} />
          <span style={{ fontSize: 13 }}>{copy.includeText}</span>
        </label>
      )}
      {preview && (
        <div className="mt8">
          <div className="kicker">{copy.preview}</div>
          <ul className="mt6" style={{ fontSize: 13 }}>
            {preview.fields.map((field) => <li key={field.key}><span className="faint">{field.label}: </span>{field.value}</li>)}
          </ul>
          {preview.excluded.length > 0 && (
            <p className="faint mt4" style={{ fontSize: 11 }}>{copy.excluded}: {preview.excluded.map((item) => `${item.key} (${item.reason})`).join(', ')}</p>
          )}
          <button className="btn small primary block mt8" onClick={download}>{copy.download}</button>
        </div>
      )}
      {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}
    </section>
  );
}
