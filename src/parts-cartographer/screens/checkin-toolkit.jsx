import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useApp } from '../app.jsx';
import { store } from '../core/local-store';
import { advance, availablePractices, interrupt, resume, start, stepsFor } from '../core/contextual-checkin.ts';
import { reviewedPractices } from '../core/practice-catalog.ts';
import {
  MAX_HYPOTHESES,
  MAX_QUESTIONS,
  addHypothesis,
  allowedFormulation,
  answer,
  chooseNextAction,
  correct,
  formulation,
  leave,
  nextQuestion,
  rejectHypothesis,
  startInquiry,
} from '../core/situation-inquiry.ts';
import { loadToolkit, newId, persist, saveToolkit } from './practice-toolkit.jsx';
import { takeFocusRequest } from '../core/focus-request.ts';
import './practice-toolkit.css';

// Contextual check-in (INNERVERSE_CHECKIN_FLOW_V1) and the bounded situation inquiry (stored in INNERVERSE_TOOLKIT_V1).
// Neither reads the assessment or synastry profile: there is no gate in front of either.

export const CHECKIN_FLOW_KEY = 'INNERVERSE_CHECKIN_FLOW_V1';
const FLOW_VERSION = 1;
const MODES = ['full', 'quiet'];

const COPY = {
  en: {
    title: 'Check in with a practice',
    intro: 'Pick one practice and go at your own pace. You can pause at any step and come back to the same place. Nothing is scored.',
    path: 'Path',
    modes: { full: 'Full', quiet: 'Quiet' },
    modeHints: { full: 'Every step, one at a time.', quiet: 'One step, so the path stays small.' },
    pick: 'Choose a practice',
    none: 'No reviewed practices are available yet. Practices appear here once they have a review record.',
    stepCount: (n) => (n === 1 ? '1 step' : `${n} steps`),
    stepOf: (i, n) => `Step ${i} of ${n}`,
    quietStep: 'One step. Finish when it feels done.',
    next: 'Next step',
    finish: 'Finish',
    pause: 'Pause and keep my place',
    paused: 'Paused. Your place is kept.',
    resume: 'Resume',
    change: 'Choose a different practice',
    clearedNote: 'Choosing a different practice clears your place in this one.',
    done: 'Finished for now. Nothing is scored.',
    notKept: 'This browser could not keep that change. It applies to this visit only.',
    inquiry: {
      title: 'Look at one situation',
      intro: 'Describe what happened in your own words. Your observation, possible readings and corrections stay separate. This is a way to think something through, not a diagnosis or a verdict on who you are.',
      observeLabel: 'What did you notice?',
      observePh: 'A short description, in your own words',
      start: 'Start',
      needObservation: 'Write a short observation to begin.',
      observed: 'Observed',
      questionsTitle: `Questions (up to ${MAX_QUESTIONS})`,
      questions: [
        'What happened just before?',
        'What did you need in that moment?',
        'Was there a time like this that went differently? What was different then?',
      ],
      questionsDone: 'That is enough questions for now.',
      answerLabel: 'Your answer (optional)',
      answer: 'Answer',
      skip: 'Skip this question',
      skipped: 'Skipped',
      readings: `Possible readings (up to ${MAX_HYPOTHESES})`,
      readingsIntro: 'Write each one as a possibility to check, not as a fact about you.',
      readingLabel: 'A possible reading',
      linkLabel: 'Linked to an answer (optional)',
      linkNone: 'Not linked',
      addReading: 'Add reading',
      readingsLimit: `Up to ${MAX_HYPOTHESES} readings at a time. Set one aside to add another.`,
      notThis: 'Not this one',
      setAsideTitle: 'Set aside',
      setAsideNote: 'Readings you set aside are not shown again as new discoveries.',
      formulation: 'Current formulation',
      formulationLatest: 'The latest correction is shown here.',
      formulationOriginal: 'Your observation, until you correct it.',
      earlier: 'Earlier corrections (kept on record)',
      correctLabel: 'Correct the formulation',
      correctPh: 'What would be more accurate?',
      correct: 'Save correction',
      nextStep: 'One small next step',
      nextLabel: 'A small, concrete step',
      chooseNext: 'Save next step',
      stop: 'Stop for now',
      stopped: 'Stopped for now. Nothing is scored, and nothing is marked as left.',
      restart: 'Start a new observation',
      restartConfirm: 'Clear this observation?',
      confirmYes: 'Yes, clear it',
      confirmNo: 'Keep it',
      reasons: {
        limit: `Up to ${MAX_HYPOTHESES} readings at a time. Set one aside to add another.`,
        overclaim: 'Try a more tentative wording: describe a possibility, not a fixed fact about a person.',
        'rejected-again': 'You already set this reading aside.',
        empty: 'Write something to save it.',
      },
    },
  },
  ru: {
    title: 'Сверка с практикой',
    intro: 'Выберите одну практику и идите в своём темпе. Можно остановиться на любом шаге и вернуться к тому же месту. Ничего не оценивается.',
    path: 'Путь',
    modes: { full: 'Полный', quiet: 'Тихий' },
    modeHints: { full: 'Каждый шаг, по одному.', quiet: 'Один шаг, чтобы путь оставался небольшим.' },
    pick: 'Выберите практику',
    none: 'Проверенных практик пока нет. Они появятся здесь, когда для них будет запись о проверке.',
    stepCount: (n) => `${n} ${plural(n, ['шаг', 'шага', 'шагов'])}`,
    stepOf: (i, n) => `Шаг ${i} из ${n}`,
    quietStep: 'Один шаг. Завершите, когда почувствуете, что достаточно.',
    next: 'Следующий шаг',
    finish: 'Завершить',
    pause: 'Пауза, сохранить место',
    paused: 'Пауза. Ваше место сохранено.',
    resume: 'Продолжить',
    change: 'Выбрать другую практику',
    clearedNote: 'Если выбрать другую практику, место в этой будет сброшено.',
    done: 'Пока завершено. Ничего не оценивается.',
    notKept: 'Этот браузер не смог сохранить изменение. Оно действует только в этом визите.',
    inquiry: {
      title: 'Посмотреть на одну ситуацию',
      intro: 'Опишите, что произошло, своими словами. Наблюдение, возможные предположения и уточнения остаются отдельно. Это способ спокойно обдумать ситуацию, а не диагноз и не оценка того, какой вы человек.',
      observeLabel: 'Что вы заметили?',
      observePh: 'Коротко, своими словами',
      start: 'Начать',
      needObservation: 'Чтобы начать, напишите короткое наблюдение.',
      observed: 'Наблюдение',
      questionsTitle: `Вопросы (до ${MAX_QUESTIONS})`,
      questions: [
        'Что было непосредственно перед этим?',
        'Что вам было нужно в тот момент?',
        'Было ли похожее время, которое прошло иначе? Что тогда было по-другому?',
      ],
      questionsDone: 'На сейчас вопросов достаточно.',
      answerLabel: 'Ваш ответ (необязательно)',
      answer: 'Ответить',
      skip: 'Пропустить вопрос',
      skipped: 'Пропущено',
      readings: `Возможные предположения (до ${MAX_HYPOTHESES})`,
      readingsIntro: 'Пишите каждое как возможность, которую можно проверить, а не как факт о вас.',
      readingLabel: 'Возможное предположение',
      linkLabel: 'Связано с ответом (необязательно)',
      linkNone: 'Не связано',
      addReading: 'Добавить предположение',
      readingsLimit: `Сейчас можно держать не больше ${MAX_HYPOTHESES}. Отложите одно, чтобы добавить другое.`,
      notThis: 'Это не так',
      setAsideTitle: 'Отложено',
      setAsideNote: 'Отложенные предположения не показываются снова как новые открытия.',
      formulation: 'Текущая формулировка',
      formulationLatest: 'Здесь показано последнее уточнение.',
      formulationOriginal: 'Ваше наблюдение, пока вы его не уточнили.',
      earlier: 'Прежние уточнения (сохранены)',
      correctLabel: 'Уточнить формулировку',
      correctPh: 'Что было бы точнее?',
      correct: 'Сохранить уточнение',
      nextStep: 'Один небольшой следующий шаг',
      nextLabel: 'Небольшой, конкретный шаг',
      chooseNext: 'Сохранить шаг',
      stop: 'Пока остановиться',
      stopped: 'Пока можно остановиться. Ничего не оценивается и ничего не записывается как брошенное.',
      restart: 'Начать новое наблюдение',
      restartConfirm: 'Очистить это наблюдение?',
      confirmYes: 'Да, очистить',
      confirmNo: 'Оставить',
      reasons: {
        limit: `Сейчас можно держать не больше ${MAX_HYPOTHESES}. Отложите одно, чтобы добавить другое.`,
        overclaim: 'Попробуйте более осторожную формулировку: опишите возможность, а не окончательный факт о человеке.',
        'rejected-again': 'Это предположение уже отложено.',
        empty: 'Напишите что-нибудь, чтобы сохранить.',
      },
    },
  },
};

const checkinCopy = (lang) => COPY[lang === 'ru' ? 'ru' : 'en'];

/** Russian plural: [one, few, many] for 1, 2–4 and 5+ (11–14 are 'many'). */
const plural = (n, [one, few, many]) => {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return one;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
};

const isObj = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const listOf = (value, keep) => (Array.isArray(value) ? value.filter(keep) : []);

// ---------- check-in flow (pure) ----------

/** Any stored value becomes a valid flow. Unknown practices and modes are dropped; the step index is clamped. */
export function normalizeFlow(raw, practices) {
  const src = isObj(raw) ? raw : {};
  const ids = practices.map((practice) => practice.id);
  const completed = [...new Set(listOf(src.completed, (id) => typeof id === 'string' && ids.includes(id)))];
  let current = null;
  const saved = src.current;
  if (isObj(saved) && ids.includes(saved.practiceId) && MODES.includes(saved.mode)) {
    const practice = practices.find((item) => item.id === saved.practiceId);
    const count = stepsFor(practice, saved.mode).length;
    const stepIndex = Number.isInteger(saved.stepIndex) ? Math.min(Math.max(saved.stepIndex, 0), count - 1) : 0;
    current = { practiceId: saved.practiceId, mode: saved.mode, stepIndex, interrupted: saved.interrupted === true };
  }
  return { current, completed };
}

export function loadFlow(practices) {
  return normalizeFlow(store.load(CHECKIN_FLOW_KEY, null), practices);
}

export function saveFlow(flow) {
  return persist(CHECKIN_FLOW_KEY, { version: FLOW_VERSION, ...flow });
}

export const flowBegin = (flow, practice, mode) => ({ ...flow, current: start(practice, mode) });
export const flowPause = (flow) => (flow.current ? { ...flow, current: interrupt(flow.current) } : flow);
export const flowResume = (flow) => (flow.current ? { ...flow, current: resume(flow.current) } : flow);
export const flowClear = (flow) => ({ ...flow, current: null });

export function flowNext(flow, practice) {
  if (!flow.current) return flow;
  return { ...flow, current: advance(flow.current, stepsFor(practice, flow.current.mode).length) };
}

/** Finishing records the practice id only. No count, streak or score is kept. */
export function flowFinish(flow) {
  if (!flow.current) return flow;
  const id = flow.current.practiceId;
  return { current: null, completed: flow.completed.includes(id) ? flow.completed : [...flow.completed, id] };
}

// ---------- situation inquiry wrappers (pure) ----------

// The module's allowedFormulation checks English wording. These extra Russian patterns cover the same claims.
const RU_OVERCLAIM = /(?:^|[^\p{L}])(диагноз\p{L}*|всегда|никогда|потому что|из-за того|ты такой|вы такой|ваша личность|ваш характер)(?!\p{L})/iu;

export function isAllowedText(text) {
  return allowedFormulation(text) && !RU_OVERCLAIM.test(text);
}

export function submitHypothesis(inquiry, id, text, linkedAnswerId) {
  if (!isAllowedText(text)) return { ok: false, reason: 'overclaim' };
  return addHypothesis(inquiry, id, text, linkedAnswerId);
}

export function submitCorrection(inquiry, text) {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };
  if (!isAllowedText(trimmed)) return { ok: false, reason: 'overclaim' };
  return { ok: true, inquiry: correct(inquiry, trimmed) };
}

export function submitNextAction(inquiry, text) {
  if (!isAllowedText(text)) return { ok: false, reason: 'overclaim' };
  return chooseNextAction(inquiry, text);
}

// ---------- components ----------

export function ContextualCheckIn() {
  const { lang } = useApp() ?? {};
  const copy = checkinCopy(lang);
  const practices = useMemo(() => reviewedPractices(lang), [lang]);
  const [flow, setFlow] = useState(() => loadFlow(practices));
  const [mode, setMode] = useState('full');
  const [kept, setKept] = useState(true);
  const [notice, setNotice] = useState('');
  const titleId = useId();

  const current = flow.current;
  const practice = current ? practices.find((item) => item.id === current.practiceId) : null;
  const steps = practice && current ? stepsFor(practice, current.mode) : [];
  const isLast = current ? current.stepIndex >= steps.length - 1 : false;
  const available = availablePractices(practices, flow.completed);

  const update = (next) => {
    setFlow(next);
    setKept(saveFlow(next));
  };

  return (
    <section className="tk" aria-labelledby={titleId}>
      <div className="kicker" id={titleId}>{copy.title}</div>
      <p className="sub">{copy.intro}</p>
      {!kept && <p className="tk-notice" role="status">{copy.notKept}</p>}
      {notice && <p className="tk-notice" role="status">{notice}</p>}

      {!current && (
        <>
          <div className="kicker">{copy.path}</div>
          <div className="tk-tabs" role="group" aria-label={copy.path}>
            {MODES.map((id) => (
              <button key={id} type="button" className={`chip ${mode === id ? 'on' : ''}`} aria-pressed={mode === id} onClick={() => setMode(id)}>
                {copy.modes[id]}
              </button>
            ))}
          </div>
          <p className="faint tk-small">{copy.modeHints[mode]}</p>
          <div className="kicker mt8">{copy.pick}</div>
          {available.length === 0 && <p className="sub">{copy.none}</p>}
          <div className="tk-stack">
            {available.map((item) => (
              <button key={item.id} type="button" className="tk-pick" onClick={() => { update(flowBegin(flow, item, mode)); setNotice(''); }}>
                <span className="grow tk-wrap">{item.title}</span>
                <span className="faint tk-small">{copy.stepCount(stepsFor(item, mode).length)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {current && practice && current.interrupted && (
        <div className="tk-item">
          <div className="kicker">{practice.title}</div>
          <p className="sub mt8">{copy.paused}</p>
          <p className="faint tk-small mt4">
            {current.mode === 'quiet' ? copy.quietStep : copy.stepOf(current.stepIndex + 1, steps.length)}
          </p>
          <div className="tk-row-wrap mt12">
            <button type="button" className="btn primary small" onClick={() => update(flowResume(flow))}>{copy.resume}</button>
            <button type="button" className="btn ghost small" onClick={() => { update(flowClear(flow)); setNotice(''); }}>{copy.change}</button>
          </div>
          <p className="faint tk-small mt8">{copy.clearedNote}</p>
        </div>
      )}

      {current && practice && !current.interrupted && (
        <div className="tk-item">
          <div className="kicker">{practice.title}</div>
          <p className="faint tk-small mt4">
            {current.mode === 'quiet' ? copy.quietStep : copy.stepOf(current.stepIndex + 1, steps.length)}
          </p>
          <p className="tk-step mt12">{steps[current.stepIndex]}</p>
          <div className="tk-row-wrap mt12">
            {isLast ? (
              <button
                type="button"
                className="btn primary small"
                onClick={() => { update(flowFinish(flow)); setNotice(copy.done); }}
              >
                {copy.finish}
              </button>
            ) : (
              <button type="button" className="btn primary small" onClick={() => update(flowNext(flow, practice))}>{copy.next}</button>
            )}
            <button type="button" className="btn small" onClick={() => update(flowPause(flow))}>{copy.pause}</button>
          </div>
        </div>
      )}
    </section>
  );
}

export function SituationInquiry() {
  const { lang } = useApp() ?? {};
  const copy = checkinCopy(lang);
  const text = copy.inquiry;
  const questions = text.questions;
  const uid = useId();
  const titleId = useId();
  const [toolkit, setToolkit] = useState(loadToolkit);
  const [kept, setKept] = useState(true);
  const [observation, setObservation] = useState('');
  const [answerDraft, setAnswerDraft] = useState('');
  const [readingDraft, setReadingDraft] = useState('');
  const [linkedId, setLinkedId] = useState('');
  const [correctionDraft, setCorrectionDraft] = useState('');
  const [nextDraft, setNextDraft] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmRestart, setConfirmRestart] = useState(false);
  const sectionRef = useRef(null);
  const inquiry = toolkit.inquiry;

  // Arriving from the situation-inquiry entry lands here, not at the top of the check-in layer.
  useEffect(() => {
    if (!takeFocusRequest('situation-inquiry') || !sectionRef.current) return;
    sectionRef.current.scrollIntoView({ block: 'start' });
    sectionRef.current.focus({ preventScroll: true });
  }, []);
  const askNext = inquiry ? nextQuestion(inquiry, questions) : null;

  const commitInquiry = (nextInquiry) => {
    const next = { ...toolkit, inquiry: nextInquiry };
    setToolkit(next);
    setKept(saveToolkit(next));
  };
  const fail = (reason) => setError(text.reasons[reason] ?? text.reasons.empty);

  const begin = () => {
    const started = startInquiry(observation);
    if (!started) {
      setError(text.needObservation);
      return;
    }
    commitInquiry(started);
    setObservation('');
    setError('');
    setNotice('');
  };
  const recordAnswer = (answerText) => {
    if (!askNext) return;
    commitInquiry(answer(inquiry, newId('q'), answerText));
    setAnswerDraft('');
    setError('');
  };
  const addReading = () => {
    const result = submitHypothesis(inquiry, newId('h'), readingDraft, linkedId || null);
    if (!result.ok) {
      fail(result.reason);
      return;
    }
    commitInquiry(result.inquiry);
    setReadingDraft('');
    setLinkedId('');
    setError('');
  };
  const saveCorrection = () => {
    const result = submitCorrection(inquiry, correctionDraft);
    if (!result.ok) {
      fail(result.reason);
      return;
    }
    commitInquiry(result.inquiry);
    setCorrectionDraft('');
    setError('');
  };
  const saveNextStep = () => {
    const result = submitNextAction(inquiry, nextDraft);
    if (!result.ok) {
      fail(result.reason);
      return;
    }
    commitInquiry(result.inquiry);
    setNextDraft('');
    setError('');
  };
  const stop = () => {
    // Leaving has no penalty. Nothing is written, so the inquiry stays available for later.
    const exit = leave(inquiry);
    setNotice(exit.penalty === 0 ? text.stopped : '');
  };
  const restart = () => {
    commitInquiry(null);
    setConfirmRestart(false);
    setNotice('');
    setError('');
  };

  return (
    <section className="tk" aria-labelledby={titleId} id="situation-inquiry" ref={sectionRef} tabIndex={-1}>
      <div className="kicker" id={titleId}>{text.title}</div>
      <p className="sub">{text.intro}</p>
      {!kept && <p className="tk-notice" role="status">{copy.notKept}</p>}
      {notice && <p className="tk-notice" role="status">{notice}</p>}
      {error && <p className="tk-error" role="alert">{error}</p>}

      {!inquiry && (
        <div className="tk-item">
          <div className="field">
            <label htmlFor={`${uid}-observe`}>{text.observeLabel}</label>
            <textarea
              id={`${uid}-observe`}
              rows={3}
              value={observation}
              placeholder={text.observePh}
              onChange={(event) => setObservation(event.target.value)}
            />
          </div>
          <button type="button" className="btn primary small" onClick={begin}>{text.start}</button>
        </div>
      )}

      {inquiry && (
        <>
          <div className="tk-item">
            <div className="kicker">{text.observed}</div>
            <p className="tk-step mt8">{inquiry.observation}</p>
          </div>

          <div className="tk-item">
            <div className="kicker">{text.questionsTitle}</div>
            {inquiry.answers.map((item, index) => (
              <div key={item.id} className="mt8">
                <p className="tk-line faint">{questions[index]}</p>
                <p className="tk-line">{item.text || text.skipped}</p>
              </div>
            ))}
            {askNext ? (
              <div className="mt12">
                <p className="tk-line"><b>{askNext}</b></p>
                <div className="field mt8">
                  <label htmlFor={`${uid}-answer`}>{text.answerLabel}</label>
                  <textarea id={`${uid}-answer`} rows={2} value={answerDraft} onChange={(event) => setAnswerDraft(event.target.value)} />
                </div>
                <div className="tk-row-wrap">
                  <button type="button" className="btn primary small" onClick={() => recordAnswer(answerDraft)}>{text.answer}</button>
                  <button type="button" className="btn ghost small" onClick={() => recordAnswer('')}>{text.skip}</button>
                </div>
              </div>
            ) : (
              <p className="faint tk-small mt8">{text.questionsDone}</p>
            )}
          </div>

          <div className="tk-item">
            <div className="kicker">{text.readings}</div>
            <p className="faint tk-small mt4">{text.readingsIntro}</p>
            {inquiry.hypotheses.map((item) => (
              <div key={item.id} className="tk-row-wrap mt8">
                <span className="grow tk-wrap">{item.text}</span>
                <button type="button" className="btn ghost small" onClick={() => commitInquiry(rejectHypothesis(inquiry, item.id))}>
                  {text.notThis}
                </button>
              </div>
            ))}
            {inquiry.hypotheses.length < MAX_HYPOTHESES ? (
              <>
                <div className="field mt8">
                  <label htmlFor={`${uid}-reading`}>{text.readingLabel}</label>
                  <input id={`${uid}-reading`} value={readingDraft} onChange={(event) => setReadingDraft(event.target.value)} />
                </div>
                {inquiry.answers.some((item) => item.text) && (
                  <div className="field">
                    <label htmlFor={`${uid}-link`}>{text.linkLabel}</label>
                    <select id={`${uid}-link`} value={linkedId} onChange={(event) => setLinkedId(event.target.value)}>
                      <option value="">{text.linkNone}</option>
                      {inquiry.answers.map((item, index) => (item.text ? <option key={item.id} value={item.id}>{questions[index]}</option> : null))}
                    </select>
                  </div>
                )}
                <button type="button" className="btn small" onClick={addReading}>{text.addReading}</button>
              </>
            ) : (
              <p className="faint tk-small mt8">{text.readingsLimit}</p>
            )}
          </div>

          {inquiry.rejected.length > 0 && (
            <div className="tk-item">
              <div className="kicker">{text.setAsideTitle}</div>
              <p className="faint tk-small mt4">{text.setAsideNote}</p>
              <ul className="tk-list mt8">
                {inquiry.rejected.map((item, index) => <li key={`${index}-${item}`} className="tk-line faint">{item}</li>)}
              </ul>
            </div>
          )}

          <div className="tk-item">
            <div className="kicker">{text.formulation}</div>
            <p className="faint tk-small mt4">{inquiry.corrections.length > 0 ? text.formulationLatest : text.formulationOriginal}</p>
            <p className="tk-step mt8">{formulation(inquiry)}</p>
            {inquiry.corrections.length > 1 && (
              <>
                <div className="kicker mt12">{text.earlier}</div>
                <ul className="tk-list mt4">
                  {inquiry.corrections.slice(0, -1).map((item, index) => <li key={`${index}-${item}`} className="tk-line faint">{item}</li>)}
                </ul>
              </>
            )}
            <div className="field mt12">
              <label htmlFor={`${uid}-correct`}>{text.correctLabel}</label>
              <textarea id={`${uid}-correct`} rows={2} placeholder={text.correctPh} value={correctionDraft} onChange={(event) => setCorrectionDraft(event.target.value)} />
            </div>
            <button type="button" className="btn small" onClick={saveCorrection}>{text.correct}</button>
          </div>

          <div className="tk-item">
            <div className="kicker">{text.nextStep}</div>
            {inquiry.nextAction && <p className="tk-line mt8">{inquiry.nextAction}</p>}
            <div className="field mt8">
              <label htmlFor={`${uid}-next`}>{text.nextLabel}</label>
              <input id={`${uid}-next`} value={nextDraft} onChange={(event) => setNextDraft(event.target.value)} />
            </div>
            <button type="button" className="btn small" onClick={saveNextStep}>{text.chooseNext}</button>
          </div>

          <div className="tk-row-wrap">
            <button type="button" className="btn ghost small" onClick={stop}>{text.stop}</button>
            {confirmRestart ? (
              <>
                <span className="tk-small faint">{text.restartConfirm}</span>
                <button type="button" className="btn danger small" onClick={restart}>{text.confirmYes}</button>
                <button type="button" className="btn ghost small" onClick={() => setConfirmRestart(false)}>{text.confirmNo}</button>
              </>
            ) : (
              <button type="button" className="btn ghost small" onClick={() => setConfirmRestart(true)}>{text.restart}</button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
