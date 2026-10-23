// E19 extensions that earn complexity (ArchetypeAI-umo5, step 05 UI). Each optional extension lists what it is for,
// what it needs, and the simpler path it is compared against. Prerequisites start unknown and are never assumed met.
// Nothing here is required for ordinary use. Details come from the pure E19 catalogue, which is English only for now.
import React from 'react';
import { useApp } from '../../app.jsx';
import { EXTENSIONS } from '../../elevation/e19-comparison.ts';

const COPY = {
  en: {
    kicker: 'Optional extensions',
    ask: 'Each one is optional. Ordinary use never requires any of them.',
    purpose: 'Purpose',
    needs: 'Needs',
    simpler: 'Simpler path it is compared against',
    unknown: 'Not checked yet',
    englishNote: 'Details below are in English for now.',
  },
  ru: {
    kicker: 'Необязательные расширения',
    ask: 'Каждое из них необязательно. Обычное использование не требует ни одного.',
    purpose: 'Назначение',
    needs: 'Нужно',
    simpler: 'Более простой путь, с которым сравнивается',
    unknown: 'Пока не проверено',
    englishNote: 'Подробности ниже пока на английском.',
  },
};

export function ExtensionsPanel() {
  const { lang } = useApp() ?? {};
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  return (
    <section className="card flat mt16" aria-labelledby="e19-title">
      <div className="kicker" id="e19-title">{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 13 }}>{copy.ask}</p>
      <p className="faint mt4" style={{ fontSize: 11 }}>{copy.englishNote}</p>
      {EXTENSIONS.map((extension) => (
        <div key={extension.key} className="mt10">
          <div style={{ fontSize: 13, fontWeight: 700 }}>{extension.provisionalId}</div>
          <p className="mt4" style={{ fontSize: 12 }}><span className="faint">{copy.purpose}: </span>{extension.purpose}</p>
          <ul className="mt4" style={{ fontSize: 12 }}>
            {extension.prerequisites.map((item) => (
              <li key={item.id}><span className="faint">{copy.needs}: </span>{item.need} <span className="faint">({copy.unknown})</span></li>
            ))}
          </ul>
          <p className="faint mt4" style={{ fontSize: 12 }}>{copy.simpler}: {extension.comparator.path}</p>
        </div>
      ))}
    </section>
  );
}
