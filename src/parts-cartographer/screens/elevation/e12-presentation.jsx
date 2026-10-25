// E12 quiet and accessible presentation (ArchetypeAI-ybq0, step 05 UI). An accessible list of the person's parts, the
// equivalent of the 3D view. The presentation choice is made by the pure E12 module from the environment, and it never
// changes what a part means or what is saved. The list is shown when the person asks for it, or when the module picks it.
import React, { useState } from 'react';
import { localizeParts } from '../../pal/seed-copy.ts';
import { useApp } from '../../app.jsx';
import { store, KEYS } from '../../core/local-store';
import { SENSORY_PREFERENCES_KEY } from '../../core/sensory-preferences.ts';
import { presentItems, readSensoryChoice, selectPresentation } from '../../elevation/e12-quiet-presentation.ts';

export const PRESENTATION_KEY = 'INNERVERSE_PRESENTATION_V1';

const COPY = {
  en: {
    kicker: 'Parts as a list',
    ask: 'The same parts as a plain list, for quiet reading or assistive tools.',
    toggle: 'Show as a list',
    empty: 'No parts saved yet.',
    selected: 'Selected',
    source: 'From your saved parts',
  },
  ru: {
    kicker: 'Части списком',
    ask: 'Те же части обычным списком: для спокойного чтения и вспомогательных средств.',
    toggle: 'Показать списком',
    empty: 'Частей пока нет.',
    selected: 'Выбрано',
    source: 'Из ваших сохранённых частей',
  },
};

const safeLoad = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const partLabel = (part, lang) => (lang === 'ru' ? part.nameRu ?? part.name : part.nameEn ?? part.name) ?? part.id;

export function PresentationPanel() {
  const { lang } = useApp() ?? {};
  const lk = lang === 'ru' ? 'ru' : 'en';
  const copy = COPY[lk];
  const [listChosen, setListChosen] = useState(() => store.load(PRESENTATION_KEY, { list: false }).list === true);
  const [selectedId, setSelectedId] = useState(null);

  const parts = localizeParts((Array.isArray(store.load(KEYS.parts, [])) ? store.load(KEYS.parts, []) : []).filter((part) => part && typeof part === 'object' && typeof part.id === 'string'), lang);
  const items = parts.map((part) => ({ id: part.id, label: partLabel(part, lk), source: copy.source, action: copy.selected }));

  const win = typeof window === 'undefined' ? null : window;
  const input = {
    webgl: !!win && 'WebGLRenderingContext' in win,
    audio: !!win && ('AudioContext' in win || 'webkitAudioContext' in win),
    systemReducedMotion: !!win?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
    viewportWidth: win ? win.innerWidth : 390,
    zoom: 1,
    textScale: 1,
    sensory: readSensoryChoice(safeLoad(SENSORY_PREFERENCES_KEY, null)),
    ambience: { hidden: typeof document !== 'undefined' && document.hidden, typing: false, error: false },
  };

  const presentation = selectPresentation(input);
  const presented = presentItems(items, selectedId, input);
  const showList = listChosen || presentation.surface === 'accessible-list';

  const toggle = () => {
    const next = !listChosen;
    setListChosen(next);
    store.save(PRESENTATION_KEY, { list: next });
  };

  return (
    <section className="card flat mt16" aria-labelledby="e12-title">
      <div className="kicker" id="e12-title">{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 13 }}>{copy.ask}</p>
      <button className="chip mt8" aria-pressed={listChosen} onClick={toggle}>{copy.toggle}</button>
      {showList && parts.length === 0 && <p className="faint mt8" style={{ fontSize: 12 }}>{copy.empty}</p>}
      {showList && presented.rows.length > 0 && (
        <ul className="mt8" aria-label={copy.kicker} style={{ fontSize: 14, lineHeight: 1.6 }}>
          {presented.rows.map((row) => (
            <li key={row.id}>
              <button className="chip" aria-pressed={row.selected} onClick={() => setSelectedId(row.id)}>{row.label}</button>
              {row.selected && <span className="faint" style={{ fontSize: 11 }}> · {copy.selected}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
