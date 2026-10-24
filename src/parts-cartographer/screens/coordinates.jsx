import React, { useMemo, useState } from 'react';
import { localizeParts } from '../pal/seed-copy.ts';
import { useApp } from '../app.jsx';
import { store, KEYS } from '../core/local-store.ts';
import { coordinatesFromTuple, project, projectionsAgree } from '../core/analytic-coordinates.ts';
import { UNIVERSE_DIMENSIONS_COPY } from '../i18n/strings.ts';
import './replay.css';

const COPY = {
  en: {
    title: 'Analytic coordinates',
    intro: 'Four coordinates for one of your parts, with the source of each value. An unknown coordinate stays unknown. It is never filled in and never treated as zero.',
    noParts: 'No parts yet. Coordinates appear here once a part has an archetype map.',
    partLabel: 'Part',
    noCoordinates: 'This part has no archetype map, so none of its four coordinates is known.',
    axis: 'Axis',
    valueHead: 'Value',
    statusHead: 'Status',
    unknown: 'unknown',
    status: { measured: 'measured', derived: 'derived', reference: 'reference', unknown: 'unknown' },
    statusLegend: {
      measured: 'Placed from your own 64-item answers.',
      derived: 'Created in the Archetype Studio from a description. Not measured.',
      reference: 'A shared template for the 147-item map. It is not a measurement of you.',
      unknown: 'No value is recorded for this axis. It is not zero.',
    },
    legendHeading: 'What the statuses mean',
    parityYes: 'The table, the numeric list and the text version show the same values and statuses.',
    parityNo: 'The three views disagree. Do not use these numbers until this is fixed.',
    textVersion: 'Text version',
    orderNote: 'Axes are shown in their fixed order. Nothing is ranked or scored.',
  },
  ru: {
    title: 'Аналитические координаты',
    intro: 'Четыре координаты одной из ваших частей и источник каждого значения. Неизвестная координата остаётся неизвестной. Её не заполняют и не считают нулём.',
    noParts: 'Частей пока нет. Координаты появятся, когда у части будет архетипическая карта.',
    partLabel: 'Часть',
    noCoordinates: 'У этой части нет архетипической карты, поэтому ни одна из её четырёх координат не известна.',
    axis: 'Ось',
    valueHead: 'Значение',
    statusHead: 'Статус',
    unknown: 'неизвестно',
    status: { measured: 'измерено', derived: 'вычислено', reference: 'эталон', unknown: 'неизвестно' },
    statusLegend: {
      measured: 'Определено по вашим ответам на 64 вопроса.',
      derived: 'Создано в Студии архетипов по описанию. Не измерено.',
      reference: 'Общий шаблон карты на 147 вопросов. Это не измерение вас.',
      unknown: 'Для этой оси значение не записано. Это не ноль.',
    },
    legendHeading: 'Что означают статусы',
    parityYes: 'Таблица, числовой список и текстовая версия показывают одни и те же значения и статусы.',
    parityNo: 'Три представления расходятся. Не используйте эти числа, пока это не исправлено.',
    textVersion: 'Текстовая версия',
    orderNote: 'Оси показаны в фиксированном порядке. Ничего не ранжируется и не оценивается.',
  },
};

const copyFor = (lang) => ({ ...COPY.en, ...COPY[lang === 'ru' ? 'ru' : 'en'] });
const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const hasArchetype = (part) => isObject(part?.archetype);

/** Which status a part's coordinates earn. Unknown basis earns no status, so its values stay unknown. */
export function coordinateStatusFor(archetype) {
  if (!isObject(archetype)) return null;
  if (archetype.coordinateBasis === 'response-derived-64') return 'measured';
  if (archetype.coordinateBasis === 'fixed-reference-147') return 'reference';
  if (!archetype.coordinateBasis && archetype.sourceAssessment === 'studio') return 'derived';
  return null;
}

/** Four coordinates for one part. Missing, invalid or placeholder values become unknown, never zero. */
export function coordinatesForPart(part) {
  const archetype = hasArchetype(part) ? part.archetype : null;
  const status = coordinateStatusFor(archetype);
  const tuple = Array.isArray(archetype?.coordinates) ? archetype.coordinates : [];
  // Studio parts saved without a usable description carry an all-zero placeholder. That is not a measurement.
  const placeholder = archetype?.sourceAssessment === 'studio' && tuple.length === 4 && tuple.every((value) => value === 0);
  if (!status || placeholder) return coordinatesFromTuple([], 'derived');
  return coordinatesFromTuple(tuple, status);
}

function readCoordinateParts(contextParts) {
  const stored = store.load(KEYS.parts, null);
  const list = Array.isArray(stored) ? stored : (Array.isArray(contextParts) ? contextParts : []);
  return list.filter((part) => isObject(part) && typeof part.id === 'string' && part.id.length > 0);
}

export function CoordinatesPanel() {
  const app = useApp();
  const lang = app?.lang === 'ru' ? 'ru' : 'en';
  const ui = copyFor(app?.lang);
  const parts = useMemo(() => localizeParts(readCoordinateParts(app?.parts), app?.lang), [app?.parts, app?.lang]);
  const [chosenId, setChosenId] = useState('');
  const selected = parts.find((part) => part.id === chosenId) ?? parts.find(hasArchetype) ?? parts[0] ?? null;

  const names = UNIVERSE_DIMENSIONS_COPY[lang];
  const dimensionNames = [names.agency, names.temperature, names.focus, names.attachment];

  const header = <h2 id="analytic-coordinates-title">{ui.title}</h2>;
  if (!selected) {
    return (
      <section className="iv-panel" aria-labelledby="analytic-coordinates-title">
        {header}
        <p className="iv-panel-note">{ui.noParts}</p>
      </section>
    );
  }

  const view = project(coordinatesForPart(selected));
  const agree = projectionsAgree(view);
  const partName = (lang === 'ru' ? selected.nameRu : selected.nameEn) ?? selected.name ?? '';

  return (
    <section className="iv-panel" aria-labelledby="analytic-coordinates-title">
      {header}
      <p className="iv-panel-note">{ui.intro}</p>

      <label className="field">{ui.partLabel}
        <select value={selected.id} onChange={(event) => setChosenId(event.target.value)}>
          {parts.map((part) => (
            <option key={part.id} value={part.id}>{(lang === 'ru' ? part.nameRu : part.nameEn) ?? part.name ?? part.id}</option>
          ))}
        </select>
      </label>

      {!hasArchetype(selected) && <p className="iv-warn">{ui.noCoordinates}</p>}

      <table className="iv-table" aria-label={partName || ui.title}>
        <thead>
          <tr><th scope="col">{ui.axis}</th><th scope="col">{ui.valueHead}</th><th scope="col">{ui.statusHead}</th></tr>
        </thead>
        <tbody>
          {view.numeric.map((row) => {
            const unknown = row.value === null;
            return (
              <tr key={row.axis}>
                <td>{ui.axis} {row.axis + 1} · {dimensionNames[row.axis]}</td>
                <td className={unknown ? 'iv-unknown' : ''}>{unknown ? ui.unknown : view.table[row.axis][1]}</td>
                <td>{ui.status[row.status]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="iv-panel-note">{ui.orderNote}</p>

      <p className={agree ? 'iv-panel-note' : 'iv-warn'} role="status">{agree ? ui.parityYes : ui.parityNo}</p>

      <details>
        <summary className="iv-panel-note"><strong>{ui.textVersion}</strong></summary>
        {/* The same rows as the table, in the reader's language (the core's staticText is the English audit form). */}
        <pre className="iv-pre">{view.numeric.map((row) => `${ui.axis} ${row.axis + 1} · ${dimensionNames[row.axis]}: ${row.value === null ? ui.unknown : view.table[row.axis][1]} (${ui.status[row.status]})`).join('\n')}</pre>
      </details>

      <div className="iv-field-group">
        <h3>{ui.legendHeading}</h3>
        <ul className="iv-legend">
          {['measured', 'derived', 'reference', 'unknown'].map((status) => (
            <li key={status}><strong>{ui.status[status]}</strong> · {ui.statusLegend[status]}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
