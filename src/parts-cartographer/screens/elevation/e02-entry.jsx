// E02 need-based entry (ArchetypeAI-3pj, step 05 UI). One question, one small first result, a stopping point.
// Routes come from the pure E02 module. Assessments are offered as optional destinations, never started by default.
import React, { useState } from 'react';
import { useApp } from '../../app.jsx';
import { ASSESSMENT_ROUTES } from '../../core/assessment-routes';
import { reviewedPractices } from '../../core/practice-catalog.ts';
import { store, KEYS } from '../../core/local-store';
import { NEEDS, routeForNeed } from '../../elevation/e02-entry.ts';

const COPY = {
  en: {
    kicker: 'Start here',
    ask: 'What do you need right now?',
    calm: 'I need to calm down now',
    situation: 'I am facing a situation',
    pattern: 'I notice a pattern',
    open: 'Open',
    stop: 'That is enough for now',
    stopped: 'A good stopping point. You can come back any time.',
    optional: 'Optional. You can skip this and still use the app.',
    notice: {
      'route-unavailable': 'That route is not available right now.',
      'no-reviewed-practice': 'No reviewed practice is available yet, so there is nothing to start here.',
    },
  },
  ru: {
    kicker: 'Начать здесь',
    ask: 'Что вам нужно прямо сейчас?',
    calm: 'Мне нужно сейчас успокоиться',
    situation: 'Я оказался в ситуации',
    pattern: 'Я замечаю повторяющийся паттерн',
    open: 'Открыть',
    stop: 'На сегодня достаточно',
    stopped: 'Хорошее место остановиться. Вернуться можно в любой момент.',
    optional: 'Необязательно. Можно пропустить и всё равно пользоваться приложением.',
    notice: {
      'route-unavailable': 'Этот маршрут сейчас недоступен.',
      'no-reviewed-practice': 'Проверенной практики пока нет, поэтому здесь нечего начать.',
    },
  },
};

const NEED_LABEL = { 'calm-now': 'calm', situation: 'situation', pattern: 'pattern' };

export function EntryPanel() {
  const { lang, go, setOverlay } = useApp() ?? {};
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  const [outcome, setOutcome] = useState(null);
  const [stopped, setStopped] = useState(false);

  const choose = (need) => {
    const ctx = {
      practices: reviewedPractices(lang),
      routes: ASSESSMENT_ROUTES,
      profile: store.load(KEYS.profile, null),
      quiet: false,
      online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
      savedTool: null,
    };
    setStopped(false);
    setOutcome(routeForNeed(need, ctx));
  };

  const open = (choice) => {
    const { destination } = choice;
    if (destination.kind === 'assessment') {
      const route = ASSESSMENT_ROUTES.find((item) => item.id === destination.routeId);
      if (!route) return;
      if (route.destination.kind === 'state') go?.(route.destination.state);
      else setOverlay?.(route.destination.overlay);
      return;
    }
    setOverlay?.('practice');
  };

  return (
    <section className="card flat mt16" aria-labelledby="e02-entry-title">
      <div className="kicker" id="e02-entry-title">{copy.kicker}</div>
      <p className="mt8" style={{ fontSize: 14 }}>{copy.ask}</p>
      <div className="row wrap mt8" style={{ gap: 8 }} role="group" aria-label={copy.ask}>
        {NEEDS.map((need) => (
          <button key={need} className="chip" aria-pressed={outcome?.ok && outcome.choice.need === need} onClick={() => choose(need)}>
            {copy[NEED_LABEL[need]]}
          </button>
        ))}
      </div>
      {outcome && !outcome.ok && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{copy.notice[outcome.notice]}</p>}
      {outcome?.ok && !stopped && (
        <div className="mt8">
          <p className="sub" style={{ fontSize: 13 }}>
            {outcome.choice.destination.kind === 'practice' ? outcome.choice.destination.title : outcome.choice.destination.routeId}
          </p>
          {outcome.choice.destination.kind === 'assessment' && <p className="faint" style={{ fontSize: 12 }}>{copy.optional}</p>}
          <div className="row mt8" style={{ gap: 8 }}>
            <button className="btn small primary grow" onClick={() => open(outcome.choice)}>{copy.open}</button>
            <button className="btn small ghost grow" onClick={() => setStopped(true)}>{copy.stop}</button>
          </div>
        </div>
      )}
      {stopped && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{copy.stopped}</p>}
    </section>
  );
}
