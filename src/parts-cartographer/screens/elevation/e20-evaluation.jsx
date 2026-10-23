// E20 independent multidimensional evaluation (ArchetypeAI-iuyo, step 05 UI). Admin only. It shows the rubric and the
// evidence each dimension requires. It never produces a score or a pass: the evaluator is an unfrozen draft and the
// independent review has not happened. A generated score must never be read as a result.
import React from 'react';
import { useApp } from '../../app.jsx';
import { EVALUATOR_VERSION, RUBRIC } from '../../elevation/e20-evaluation.ts';

const COPY = {
  en: {
    kicker: 'Evaluation rubric (admin)',
    draft: `Evaluator: ${EVALUATOR_VERSION}. No result is produced here.`,
    pending: 'Independent review has not happened, so no dimension is passed.',
    hard: 'Blocking',
    soft: 'Advisory',
    requires: 'Evidence required',
  },
  ru: {
    kicker: 'Рубрика оценки (администратор)',
    draft: `Оценщик: ${EVALUATOR_VERSION}. Результат здесь не выдаётся.`,
    pending: 'Независимой проверки не было, поэтому ни одно измерение не засчитано.',
    hard: 'Блокирует',
    soft: 'Рекомендательно',
    requires: 'Нужные доказательства',
  },
};

export function EvaluationRubricPanel() {
  const { lang } = useApp() ?? {};
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  return (
    <section className="card flat mt16" aria-labelledby="e20-title">
      <div className="kicker" id="e20-title">{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 13 }}>{copy.draft}</p>
      <p className="faint mt4" style={{ fontSize: 12 }}>{copy.pending}</p>
      <ul className="mt8" style={{ fontSize: 12 }}>
        {RUBRIC.map((rule) => (
          <li key={rule.id} className="mt4">
            <span style={{ fontWeight: 700 }}>{rule.id}</span>
            <span className="faint"> · {rule.hard ? copy.hard : copy.soft} · {copy.requires}: {rule.requires.join(', ')}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
