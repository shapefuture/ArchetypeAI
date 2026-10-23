import React, { useState } from 'react';
import { useApp } from '../app.jsx';
import { ITEM_BANK, LIKERT } from '../../shared/i18n/items';
import { STRINGS } from '../../shared/i18n/strings';
import { SHADOW_PARTS, SUBTYPES } from '../../shared/core/data/parts';
import { PART_COPY } from '../../shared/core/data/part-copy';
import { subtypeName } from '../../shared/core/data/constellation-copy';
import { quickScan } from '../../shared/core/data/scoring-v2';

/** Public, local-only teaser. It never replaces or persists an assessment. */
export function QuickScan() {
  const { lang, t, setOverlay, go } = useApp();
  const [answers, setAnswers] = useState([]);
  const ui = STRINGS.quickscan[lang];
  const done = answers.length === SHADOW_PARTS.length;
  const result = done ? quickScan(Object.fromEntries(SHADOW_PARTS.map((id, i) => [id, answers[i]]))) : null;
  const subtype = result?.kind === 'family' ? SUBTYPES[result.family][0] : null;
  return <div className="overlay" role="dialog" aria-modal="true" aria-label={ui.title}>
    <div className="ov-head"><div className="ov-title">⚡ {ui.title}</div><button className="ibtn" aria-label={t('close')} onClick={() => setOverlay(null)}>✕</button></div>
    <div className="ov-body">
      {!done ? <>
        <p role="status" className="kicker">{answers.length + 1} / 14</p>
        <progress aria-label={ui.title} max={14} value={answers.length} style={{ width: '100%' }} />
        <h2 className="mt16">{ITEM_BANK[lang].items[SHADOW_PARTS[answers.length]][0]}</h2>
        <div className="mt16" style={{ display: 'grid', gap: 10 }}>
          {LIKERT[lang].map((label, index) => <button key={index} className="btn block" onClick={() => setAnswers((previous) => [...previous, index + 1])}>{label}</button>)}
        </div>
      </> : <>
        <h2>{subtype ? ui.resultOf(subtypeName(result.family, subtype.slug, subtype.name, lang)) : ui.selfTitle}</h2>
        {subtype ? <div className="card mt16"><div className="kicker">{lang === 'ru' ? 'Лицо' : 'Face'}</div><p>{PART_COPY[lang][result.family].face}</p><div className="kicker mt12">{lang === 'ru' ? 'Потребность' : 'Need'}</div><p>{PART_COPY[lang][result.family].need}</p></div> : <p>{ui.selfNote}</p>}
        <p className="sub mt16">{ui.teaserNote}</p>
        <button className="btn primary block mt16" onClick={() => { setOverlay(null); go('full-assessment'); }}>{ui.cta}</button>
      </>}
    </div>
  </div>;
}
