import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../app.jsx';
import { Steps } from '../ui/ui.jsx';
import { store } from '../core/local-store';
import { ASSESSMENT_QUESTIONS } from '../../app/core/data/assessment-questions';
import { TRANSLATIONS } from '../../i18n/strings';
import { CONSENT_TEXT } from '../i18n/strings.ts';
import { analyzeLegacyRelationalAssessment } from '../core/ai.adapter.ts';
import { buildLegacyReportData } from './legacy-report-data';
import { buildLegacyUniverseParts } from '../core/legacy-universe-adapter';
import { LegacyClinicalReport } from './legacy-report.jsx';
import { ROUTE_KEYS } from '../core/assessment-routes.ts';

const RESPONSE_KEY = ROUTE_KEYS.reflection64.responses;
const INDEX_KEY = ROUTE_KEYS.reflection64.index;
const RESULT_KEY = ROUTE_KEYS.reflection64.result;
const TOTAL = ASSESSMENT_QUESTIONS.length;

function readResponses() {
  try {
    const saved = JSON.parse(localStorage.getItem(RESPONSE_KEY) ?? 'null');
    if (!Array.isArray(saved) || saved.length !== TOTAL) return Array(TOTAL).fill(0);
    return saved.map((value) => Number.isInteger(value) && value >= 1 && value <= 5 ? value : 0);
  } catch {
    return Array(TOTAL).fill(0);
  }
}

function readQuestionIndex(answers) {
  try {
    const saved = Number.parseInt(localStorage.getItem(INDEX_KEY) ?? '', 10);
    if (Number.isInteger(saved) && saved >= 0 && saved < TOTAL) return saved;
  } catch { /* storage unavailable */ }
  const firstOpen = answers.findIndex((answer) => answer < 1);
  return firstOpen < 0 ? TOTAL - 1 : firstOpen;
}

function buildLegacyResult(responses, lang) {
  return buildLegacyReportData(responses, lang);
}

export function Legacy64Assessment() {
  const { t, lang, go, toast, parts, setParts, setUniverseMode } = useApp();
  const translations = TRANSLATIONS[lang] ?? TRANSLATIONS.en;
  const copy = translations.assessment;
  const resultCopy = copy.results;
  const [answers, setAnswers] = useState(readResponses);
  const [index, setIndex] = useState(() => readQuestionIndex(readResponses()));
  const [stage, setStage] = useState(() => {
    const saved = readResponses();
    const completed = saved.every((answer) => answer >= 1 && answer <= 5);
    return completed ? 'results' : saved.some((answer) => answer > 0) ? 'questions' : 'ethics';
  });
  const [result, setResult] = useState(() => {
    const existing = store.load(RESULT_KEY, null);
    const saved = readResponses();
    if (saved.every((answer) => answer >= 1 && answer <= 5)) {
      return existing?.version === 'angular-assessment-64.v2' && existing?.language === lang
        ? existing
        : buildLegacyResult(saved, lang);
    }
    return existing;
  });
  const [scoringMethod, setScoringMethod] = useState(() => {
    try {
      const cached = store.load(RESULT_KEY, null);
      return localStorage.getItem('archetype_scoring_method') === 'fallback'
        && cached?.aiAnalysis && cached?.language === lang ? 'fallback' : 'deterministic';
    } catch { return 'deterministic'; }
  });
  const [aiAnalysisBusy, setAiAnalysisBusy] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState('');
  const aiAnalysisAbort = useRef(null);
  useEffect(() => {
    if (stage !== 'results' || result?.version !== 'angular-assessment-64.v2' || result.language !== lang) return;
    store.save(RESULT_KEY, result);
  }, [stage, result, lang]);
  const question = ASSESSMENT_QUESTIONS[index];
  const questionSection = question?.section.split('.').at(-1) ?? 'agency';
  const sectionCopy = copy.questions[questionSection] ?? copy.questions.agency;
  const questionText = sectionCopy[question?.text] ?? '';
  const answered = answers.filter((answer) => answer > 0).length;

  const saveAnswers = (nextAnswers, nextIndex) => {
    try {
      localStorage.setItem(RESPONSE_KEY, JSON.stringify(nextAnswers));
      localStorage.setItem(INDEX_KEY, String(nextIndex));
    } catch { /* preserve the in-memory assessment when storage is unavailable */ }
  };

  const showResults = (nextAnswers) => {
    try {
      const nextResult = buildLegacyResult(nextAnswers, lang);
      setResult(nextResult);
      store.save(RESULT_KEY, nextResult);
      setAiAnalysisError('');
      persistScoringMethod('deterministic');
      setStage('results');
      try { localStorage.setItem(INDEX_KEY, String(TOTAL - 1)); } catch { /* */ }
    } catch (error) {
      console.error('Legacy 64-item scoring failed', error);
      toast(t('assessmentSaveFailed'));
    }
  };

  const answerQuestion = (rating) => {
    if (stage !== 'questions' || rating < 1 || rating > 5) return;
    const nextAnswers = [...answers];
    nextAnswers[index] = rating;
    setAnswers(nextAnswers);
    if (index >= TOTAL - 1) {
      saveAnswers(nextAnswers, TOTAL - 1);
      if (nextAnswers.every((value) => value >= 1 && value <= 5)) showResults(nextAnswers);
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    saveAnswers(nextAnswers, nextIndex);
  };

  const start = () => {
    setStage('questions');
    if (answers.some((answer) => answer > 0)) {
      const nextIndex = readQuestionIndex(answers);
      setIndex(nextIndex);
      saveAnswers(answers, nextIndex);
    } else {
      saveAnswers(answers, 0);
    }
  };

  const previous = () => {
    if (index <= 0 || stage !== 'questions') return;
    const nextIndex = index - 1;
    setIndex(nextIndex);
    saveAnswers(answers, nextIndex);
  };

  const next = () => {
    if (index >= TOTAL - 1 || stage !== 'questions' || answers[index] < 1) return;
    const nextIndex = index + 1;
    setIndex(nextIndex);
    saveAnswers(answers, nextIndex);
  };

  const retake = () => {
    aiAnalysisAbort.current?.abort();
    aiAnalysisAbort.current = null;
    setAiAnalysisBusy(false);
    setAiAnalysisError('');
    persistScoringMethod('deterministic');
    const fresh = Array(TOTAL).fill(0);
    setAnswers(fresh);
    setIndex(0);
    setResult(null);
    store.remove(RESULT_KEY);
    try {
      localStorage.removeItem(RESPONSE_KEY);
      localStorage.removeItem(INDEX_KEY);
    } catch { /* storage unavailable */ }
    setStage('ethics');
  };

  useEffect(() => {
    if (stage !== 'results' || (result?.version === 'angular-assessment-64.v2' && result?.language === lang)
      || !answers.every((answer) => answer >= 1 && answer <= 5)) return;
    aiAnalysisAbort.current?.abort();
    aiAnalysisAbort.current = null;
    setAiAnalysisBusy(false);
    const localized = buildLegacyResult(answers, lang);
    setResult(localized);
    store.save(RESULT_KEY, localized);
    setAiAnalysisError('');
    persistScoringMethod('deterministic');
  }, [stage, result, lang, answers]);

  const persistAiNarrative = useCallback((text) => {
    setResult((current) => {
      if (!current || current.aiNarrative === text) return current;
      const updated = { ...current, aiNarrative: text };
      store.save(RESULT_KEY, updated);
      return updated;
    });
  }, []);

  const persistScoringMethod = (method) => {
    setScoringMethod(method);
    try { localStorage.setItem('archetype_scoring_method', method); } catch { /* preference is local-only */ }
  };

  const selectScoringMethod = useCallback(async (method) => {
    setAiAnalysisError('');
    if (method === 'deterministic') {
      aiAnalysisAbort.current?.abort();
      aiAnalysisAbort.current = null;
      setAiAnalysisBusy(false);
      persistScoringMethod('deterministic');
      return;
    }
    const current = result ?? buildLegacyResult(answers, lang);
    if (current.aiAnalysis) {
      persistScoringMethod('fallback');
      return;
    }
    if (aiAnalysisBusy) return;

    const controller = new AbortController();
    aiAnalysisAbort.current = controller;
    setAiAnalysisBusy(true);
    const questionTranslations = translations.assessment.questions;
    const questions = ASSESSMENT_QUESTIONS.map((item, itemIndex) => {
      const key = item.section.split('.').at(-1) ?? 'agency';
      const section = questionTranslations[key] ?? questionTranslations.agency;
      return {
        sectionTitle: section.title ?? key,
        question: section[item.text] ?? item.text,
        answer: answers[itemIndex],
      };
    });
    try {
      const generated = await analyzeLegacyRelationalAssessment({
        language: lang === 'ru' ? 'ru' : 'en',
        questions,
        reportSections: translations.aiReport ?? {},
        existingArchetypes: current.archetypes.slice(0, 8).map((archetype) => archetype.name),
      }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      const updated = { ...current, aiAnalysis: generated };
      setResult(updated);
      store.save(RESULT_KEY, updated);
      persistScoringMethod('fallback');
    } catch (error) {
      if (!controller.signal.aborted) {
        setAiAnalysisError(lang === 'ru'
          ? 'Не удалось получить ИИ-анализ. Локальный детерминированный результат сохранён.'
          : 'AI analysis could not be completed. Your local deterministic result is unchanged.');
      }
    } finally {
      if (aiAnalysisAbort.current === controller) { aiAnalysisAbort.current = null; setAiAnalysisBusy(false); }
    }
  }, [result, answers, lang, translations, aiAnalysisBusy]);

  const cancelAiAnalysis = () => {
    aiAnalysisAbort.current?.abort();
    aiAnalysisAbort.current = null;
    setAiAnalysisBusy(false);
    setAiAnalysisError(lang === 'ru'
      ? 'Запрос ИИ отменён. Локальный результат не изменён.'
      : 'AI request cancelled. Your local result is unchanged.');
  };

  const openUniverse = useCallback(() => {
    if (!result) return;
    if (aiAnalysisBusy) {
      aiAnalysisAbort.current?.abort();
      aiAnalysisAbort.current = null;
      setAiAnalysisBusy(false);
    }
    const generated = buildLegacyUniverseParts(result, scoringMethod === 'fallback');
    const retained = parts.filter((part) => part.archetype?.sourceAssessment !== 'legacy64');
    setParts([...retained, ...generated]);
    setUniverseMode('parts');
    go('universe');
  }, [result, aiAnalysisBusy, scoringMethod, parts, setParts, setUniverseMode, go]);

  useEffect(() => () => aiAnalysisAbort.current?.abort(), []);

  useEffect(() => {
    if (stage !== 'questions') return undefined;
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName)) return;
      if (/^[1-5]$/.test(event.key)) {
        event.preventDefault();
        answerQuestion(Number(event.key));
      } else if (event.key === 'ArrowLeft' || event.key === 'Backspace') {
        event.preventDefault();
        previous();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stage, index, answers]);

  if (stage === 'ethics') {
    return (
      <div className="screen">
        <div className="scroll no-dock">
          <div className="row" style={{ paddingTop: 4 }}>
            <button className="ibtn" aria-label={t('back')} onClick={() => go('intro')}>‹</button>
            <div className="grow kicker">{lang === 'ru' ? 'Старая оценка отношений · 64 пункта' : 'Legacy relational assessment · 64 items'}</div>
            <Steps total={5} at={0} />
          </div>
          <div className="card mt16" style={{ borderColor: 'var(--yolk)' }}>
            <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('consent')}</div>
            <p className="sub mt8" style={{ color: 'var(--text)' }}>{CONSENT_TEXT[lang]}</p>
            <p className="sub mt8">{lang === 'ru'
              ? 'Это отдельная пятишкальная модель отношений. Она не заменяет основную карту из 147 утверждений.'
              : 'This is a separate five-dimension relational model. It does not replace the primary 147-item map.'}</p>
          </div>
          <button className="btn primary block mt24" onClick={start}>{copy.reflectAndChoose}</button>
          <button className="btn ghost block mt12" onClick={() => go('intro')}>{t('later')}</button>
        </div>
      </div>
    );
  }

  if (stage === 'results' && result) {
    return (
      <LegacyClinicalReport
        result={result}
        responses={answers}
        resultCopy={resultCopy}
        lang={lang}
        onBack={() => go('intro')}
        onRetake={retake}
        onNarrativeChange={persistAiNarrative}
        scoringMethod={scoringMethod}
        aiAnalysisBusy={aiAnalysisBusy}
        aiAnalysisError={aiAnalysisError}
        onScoringMethodChange={selectScoringMethod}
        onCancelAiAnalysis={cancelAiAnalysis}
        onViewUniverse={openUniverse}
      />
    );
  }

  const response = answers[index] ?? 0;
  const responseLabels = lang === 'ru'
    ? ['Совсем не согласен', 'Скорее не согласен', 'Ни да, ни нет', 'Скорее согласен', 'Полностью согласен']
    : ['Strongly disagree', 'Disagree', 'Neither agree nor disagree', 'Agree', 'Strongly agree'];

  return (
    <div className="screen">
      <div className="scroll no-dock">
        <div className="row" style={{ paddingTop: 4 }}>
          <button className="ibtn" aria-label={copy.cancel} onClick={() => go('intro')}>×</button>
          <div className="grow">
            <div className="kicker">{sectionCopy.title}</div>
            <div className="faint" style={{ fontSize: 11, fontWeight: 800 }}>{index + 1} / {TOTAL} · {answered}/{TOTAL}</div>
          </div>
          <Steps total={5} at={Math.min(4, ['agency', 'temperature', 'focus', 'attachment', 'healthy'].indexOf(questionSection))} />
        </div>
        <div className="bar mt12"><i style={{ width: `${((index + 1) / TOTAL) * 100}%` }} /></div>
        <div className="card mt24" style={{ minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="kicker" style={{ color: 'var(--accent-text)' }}>{copy.reflectAndChoose}</div>
          <h1 className="h2 mt12" style={{ fontSize: 22, lineHeight: 1.35 }}>{questionText}</h1>
        </div>
        <div role="radiogroup" aria-label={copy.reflectAndChoose} className="card flat mt16">
          <div className="row" style={{ justifyContent: 'space-between', gap: 6 }}>
            {responseLabels.map((label, optionIndex) => {
              const rating = optionIndex + 1;
              return (
                <button key={rating} type="button" role="radio" aria-checked={response === rating}
                  aria-label={`${rating}. ${label}`} className={`opt${response === rating ? ' on' : ''}`}
                  onClick={() => answerQuestion(rating)}
                  style={{ flex: 1, minHeight: 64, padding: '10px 3px', display: 'grid', placeItems: 'center' }}>
                  <b style={{ fontSize: 17 }}>{rating}</b>
                </button>
              );
            })}
          </div>
          <div className="row mt8" style={{ justifyContent: 'space-between', fontSize: 10.5, fontWeight: 800, color: 'var(--text-faint)' }}>
            <span>{copy.stronglyDisagree}</span><span>{copy.stronglyAgree}</span>
          </div>
        </div>
        <div className="row mt16" style={{ gap: 10 }}>
          <button className="btn grow" disabled={index <= 0} onClick={previous}>‹ {copy.previous}</button>
          <button className="btn grow" disabled={response < 1 || index >= TOTAL - 1} onClick={next}>{t('next')} ›</button>
        </div>
        <button className="btn ghost block mt12" onClick={() => go('intro')}>{copy.cancel}</button>
      </div>
    </div>
  );
}
