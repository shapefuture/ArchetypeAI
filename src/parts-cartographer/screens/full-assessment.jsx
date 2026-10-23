import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app.jsx';
import { Steps } from '../ui/ui.jsx';
import { SaveStatus } from '../ui/save-status.jsx';
import { telemetry } from '../core/telemetry.ts';
import { toAssessmentInput } from '../../shared/core/data/assessment-adapter';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { buildItemSequence, itemText } from '../../shared/i18n/items';
import { CONSENT_TEXT, DESCENT_UI, FULL_ASSESSMENT_LIKERT_TEXTS } from '../i18n/strings.ts';
import { adaptClinicalProfile } from '../core/clinical-profile-adapter.ts';
import { ROUTE_KEYS } from '../core/assessment-routes.ts';
import {
  DESCENT_DRAFT_SCHEMA, DESCENT_ITEM_COUNT, DESCENT_ITEM_IDS, DESCENT_LAST_INDEX,
  discardLegacyDescentDraft, draftFromLegacy, fromPositional, readDescentDraft,
  removeDescentDraft, resumePoint, writeDescentDraft,
} from '../core/assessment-draft.ts';

const FUTURE_SELF_KEY = ROUTE_KEYS.battery147.futureSelf;
const LEGACY_64_KEY = ROUTE_KEYS.reflection64.responses;
const LIKERT_EMOTES = ['🙅', '🤏', '🌗', '👋', '🎯'];
const SEQUENCE = buildItemSequence();

/** Reads the stored draft once, before the first render, and maps it onto screen state. */
function loadInitialState() {
  const read = readDescentDraft();
  const blank = { stage: 'ethics', answers: Array(DESCENT_ITEM_COUNT).fill(0), itemIndex: 0, legacy: null, notice: null };
  if (read.status === 'draft') {
    const point = resumePoint(read.draft);
    return { ...blank, stage: point.stage, answers: point.positional, itemIndex: point.index };
  }
  if (read.status === 'legacy') return { ...blank, legacy: read.answers };
  if (read.status === 'rejected') return { ...blank, notice: read.reason };
  return blank;
}

function hasLegacyAssessment() {
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_64_KEY) ?? 'null');
    return Array.isArray(legacy) && legacy.length > 0;
  } catch {
    return false;
  }
}

function validFutureSelf(answers) {
  const filled = answers.filter((answer) => answer.trim().length > 0);
  const sentences = filled.join(' ').split(/[.!?…]+/).filter((sentence) => sentence.trim().length > 3);
  return filled.length >= 2 && sentences.length >= 2;
}

export function FullAssessment() {
  const { t, lang, go, parts: currentParts, setProfile, setParts, toast } = useApp();
  const ui = DESCENT_UI[lang] ?? DESCENT_UI.en;
  const initial = useMemo(loadInitialState, []);
  const [stage, setStage] = useState(initial.stage);
  const [answers, setAnswers] = useState(initial.answers);
  const [itemIndex, setItemIndex] = useState(initial.itemIndex);
  const [legacy, setLegacy] = useState(initial.legacy);
  const [notice, setNotice] = useState(initial.notice);
  const [legacyRetained, setLegacyRetained] = useState(false);
  /** 'idle' until the first write; 'saved' only after the store read back the same draft. */
  const [save, setSave] = useState({ status: 'idle' });
  const latestSnapshot = useRef(null);
  const [futureSelf, setFutureSelf] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FUTURE_SELF_KEY) ?? 'null');
      return Array.isArray(saved) && saved.length === 3 ? saved.map((value) => String(value ?? '')) : ['', '', ''];
    } catch {
      return ['', '', ''];
    }
  });
  const [legacyFound] = useState(hasLegacyAssessment);
  const [busy, setBusy] = useState(false);
  const currentRef = SEQUENCE[itemIndex];
  const sittingIndex = Math.min(2, Math.floor(itemIndex / 49));
  const itemInSitting = itemIndex - sittingIndex * 49;
  const sittingAnswers = answers.slice(sittingIndex * 49, sittingIndex * 49 + 49);
  const answeredCount = answers.filter((answer) => answer > 0).length;

  /** Writes the whole draft and reports only a verified result. The snapshot is kept for retry. */
  const commit = (nextAnswers, nextIndex, nextStage) => {
    latestSnapshot.current = { answers: nextAnswers, index: nextIndex, stage: nextStage };
    const draft = {
      schema: DESCENT_DRAFT_SCHEMA,
      answers: fromPositional(nextAnswers),
      cursor: { itemId: DESCENT_ITEM_IDS[nextIndex], stage: nextStage },
      savedAt: new Date().toISOString(),
    };
    const result = writeDescentDraft(draft);
    setSave(result.ok ? { status: 'saved' } : { status: 'failed', reason: result.reason });
    return result.ok;
  };

  const retrySave = () => {
    if (legacy) {
      continueLegacy();
      return;
    }
    const snapshot = latestSnapshot.current;
    if (snapshot) commit(snapshot.answers, snapshot.index, snapshot.stage);
  };

  const exit = () => {
    if (save.status === 'failed' && !window.confirm(ui.leaveUnsaved)) return;
    go('intro');
  };

  const start = () => {
    if (legacy) return;
    setStage('item');
  };

  /** Explicit migration of the historical positional draft. The old copy is removed only after the new one is verified. */
  const continueLegacy = () => {
    if (!legacy || busy) return;
    const draft = draftFromLegacy(legacy, new Date().toISOString());
    const point = resumePoint(draft);
    latestSnapshot.current = { answers: point.positional, index: point.index, stage: point.stage };
    const result = writeDescentDraft(draft);
    if (!result.ok) {
      setSave({ status: 'failed', reason: result.reason });
      return;
    }
    setLegacyRetained(!discardLegacyDescentDraft());
    setLegacy(null);
    setNotice(null);
    setAnswers(point.positional);
    setItemIndex(point.index);
    setStage(point.stage);
    setSave({ status: 'saved' });
  };

  const discardLegacy = () => {
    if (!window.confirm(ui.legacyDiscardConfirm)) return;
    if (!discardLegacyDescentDraft()) {
      setNotice('discardFailed');
      return;
    }
    setLegacy(null);
    setNotice(null);
  };

  const answer = (rating) => {
    if (busy || stage !== 'item' || rating < 1 || rating > 5) return;
    const nextAnswers = [...answers];
    nextAnswers[itemIndex] = rating;
    setAnswers(nextAnswers);

    if (itemIndex === 48 || itemIndex === 97) {
      commit(nextAnswers, itemIndex, 'break');
      setStage('break');
      return;
    }
    if (itemIndex === DESCENT_LAST_INDEX) {
      commit(nextAnswers, itemIndex, 'future-self');
      setStage('future-self');
      return;
    }
    const nextIndex = itemIndex + 1;
    setItemIndex(nextIndex);
    commit(nextAnswers, nextIndex, 'item');
  };

  const goPrevious = () => {
    if (stage !== 'item' || itemIndex <= 0) return;
    const previousIndex = itemIndex - 1;
    setItemIndex(previousIndex);
    commit(answers, previousIndex, 'item');
  };

  const goNext = () => {
    if (stage !== 'item' || itemIndex >= DESCENT_LAST_INDEX || answers[itemIndex] < 1) return;
    const nextIndex = itemIndex + 1;
    setItemIndex(nextIndex);
    commit(answers, nextIndex, 'item');
  };

  const continueFromBreak = () => {
    const nextIndex = Math.min(DESCENT_LAST_INDEX, itemIndex + 1);
    setItemIndex(nextIndex);
    setStage('item');
    commit(answers, nextIndex, 'item');
  };

  const finish = async (saveNorthStar) => {
    // Scoring has no missing-item semantics: every one of the 147 positions needs a rating.
    if (busy || answers.some((answer) => answer < 1 || answer > 5)) return;
    setBusy(true);
    try {
      try {
        if (saveNorthStar && validFutureSelf(futureSelf)) {
          localStorage.setItem(FUTURE_SELF_KEY, JSON.stringify(futureSelf));
        } else if (!saveNorthStar) {
          localStorage.removeItem(FUTURE_SELF_KEY);
        }
      } catch { /* the scored map can still be saved if storage is unavailable */ }
      const assessmentInput = toAssessmentInput(answers);
      const scored = scoreProfile(assessmentInput);
      const adapted = adaptClinicalProfile(scored, lang);
      const scoredIds = new Set(adapted.parts.map((part) => part.id));
      const preservedParts = currentParts.filter((part) => !scoredIds.has(part.id) && !String(part.id).startsWith('seed-'));
      setParts([...adapted.parts, ...preservedParts]);
      setProfile(adapted.profile);
      try {
        localStorage.setItem('INNERVERSE_PROFILE_V1', JSON.stringify(assessmentInput));
        // The draft is removed only after the raw backup is written; otherwise it stays recoverable.
        removeDescentDraft();
      } catch { /* the scored profile remains available even if raw backup storage fails */ }
      telemetry.record('result', {
        model: 'angular-v2',
        crisis: scored.crisis,
        validity: scored.validity.ok,
      });
      go('assessment-results');
    } catch (error) {
      console.error('147-item assessment scoring failed', error);
      toast(t('assessmentSaveFailed'));
      setBusy(false);
    }
  };

  useEffect(() => {
    if (stage !== 'item') return undefined;
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName)) return;
      if (/^[1-5]$/.test(event.key)) {
        event.preventDefault();
        answer(Number(event.key));
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stage, itemIndex, answers, busy]);

  useEffect(() => {
    if (save.status !== 'failed') return undefined;
    const warnBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [save.status]);

  const noticeText = {
    unavailable: ui.saveFailed.unavailable,
    corrupt: ui.draftUnreadable,
    unsupported: ui.draftUnreadable,
    discardFailed: ui.legacyDiscardFailed,
  }[notice];

  const legacyCount = legacy ? legacy.filter((rating) => rating > 0).length : 0;

  if (stage === 'ethics') {
    return (
      <div className="screen">
        <div className="scroll no-dock">
          <div className="row" style={{ paddingTop: 4 }}>
            <button className="ibtn" aria-label={t('back')} onClick={exit}>‹</button>
            <div className="grow kicker">{ui.ethicsTitle}</div>
            <Steps total={3} at={0} />
          </div>
          <div className="card mt16" style={{ borderColor: 'var(--yolk)' }}>
            <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('consent')}</div>
            <p className="sub mt8" style={{ color: 'var(--text)', fontSize: 14.5, lineHeight: 1.55 }}>{CONSENT_TEXT[lang]}</p>
            <p className="sub mt12">{ui.ethics1}</p>
            <p className="sub mt8">{ui.ethics2}</p>
          </div>
          {legacyFound && (
            <div className="card flat mt12" role="status" style={{ borderColor: 'var(--accent)' }}>
              <p className="sub">{ui.recalibrated}</p>
            </div>
          )}
          {legacy && (
            <div className="card mt12" role="region" aria-label={ui.legacyTitle} style={{ borderColor: 'var(--accent)' }}>
              <div className="kicker" style={{ color: 'var(--accent-text)' }}>{ui.legacyTitle}</div>
              <p className="sub mt8">{ui.legacyBody(legacyCount, DESCENT_ITEM_COUNT)}</p>
              {noticeText && <p className="sub mt8" role="status">{noticeText}</p>}
              <SaveStatus ui={ui} save={save} onRetry={retrySave} />
              <button className="btn primary block mt12" disabled={busy} onClick={continueLegacy}>{ui.legacyContinue}</button>
              <button className="btn ghost block mt8" disabled={busy} onClick={discardLegacy}>{ui.legacyDiscard}</button>
            </div>
          )}
          {!legacy && noticeText && (
            <div className="card flat mt12" role="status" style={{ borderColor: 'var(--accent)' }}>
              <p className="sub">{noticeText}</p>
            </div>
          )}
          <div className="kicker mt24">{ui.planTitle}</div>
          {ui.plan.map((sitting, index) => (
            <div className="card flat mt8" key={sitting.name}>
              <div className="row">
                <span className="chip">{index + 1}</span>
                <b className="grow" style={{ marginLeft: 10 }}>{sitting.name}</b>
                <span className="faint" style={{ fontSize: 12 }}>{sitting.meta}</span>
              </div>
            </div>
          ))}
          <p className="sub mt16">{ui.ethicsWhy}</p>
          <p className="faint mt12" style={{ fontSize: 12 }}>{ui.ethicsSub}</p>
          {legacyRetained && <p className="faint mt12" role="status" style={{ fontSize: 12 }}>{ui.legacyRetained}</p>}
          <button className="btn primary block mt24" disabled={legacy !== null} onClick={start}>{ui.ethicsGo}</button>
          <button className="btn ghost block mt12" onClick={exit}>{t('later')}</button>
        </div>
      </div>
    );
  }

  if (stage === 'break') {
    return (
      <div className="screen">
        <div className="scroll no-dock center" style={{ paddingTop: 35 }}>
          <div className="row" style={{ width: '100%', paddingTop: 4 }}>
            <button className="ibtn" aria-label={ui.exit} onClick={exit}>×</button>
            <div className="grow kicker">{ui.descent(sittingIndex)}</div>
            <Steps total={3} at={sittingIndex} />
          </div>
          <div className="animate-pop" style={{ fontSize: 54, marginTop: 34 }}>✦</div>
          <h1 className="h2 mt12">{ui.breakTitle(sittingIndex)}</h1>
          <p className="sub mt8">{ui.breakSub}</p>
          <div className="card flat mt16" style={{ width: '100%', textAlign: 'left' }}>
            <div className="kicker">{ui.itemOf(sittingAnswers.filter((answer) => answer > 0).length, 49)}</div>
            <div className="bar y mt8"><i style={{ width: `${(sittingAnswers.filter((answer) => answer > 0).length / 49) * 100}%` }} /></div>
            <p className="sub mt8">{ui.retakeNote}</p>
          </div>
          <SaveStatus ui={ui} save={save} onRetry={retrySave} />
          <button className="btn primary block mt24" onClick={continueFromBreak}>{ui.breakResume(sittingIndex)}</button>
          <button className="btn ghost block mt12" onClick={exit}>{ui.breakLater}</button>
        </div>
      </div>
    );
  }

  if (stage === 'future-self') {
    const canSave = validFutureSelf(futureSelf);
    return (
      <div className="screen">
        <div className="scroll no-dock">
          <div className="row" style={{ paddingTop: 4 }}>
            <button className="ibtn" aria-label={ui.exit} onClick={exit}>‹</button>
            <div className="grow kicker">{ui.fsTitle}</div>
            <Steps total={3} at={2} />
          </div>
          <div className="card mt16" style={{ borderColor: 'var(--accent)' }}>
            <div className="kicker" style={{ color: 'var(--accent-text)' }}>{ui.fsTitle}</div>
            <p className="sub mt8">{ui.fsSub}</p>
          </div>
          {ui.fsQ.map((question, index) => (
            <label className="field mt12" key={question} style={{ display: 'block' }}>
              <span className="kicker" style={{ display: 'block', marginBottom: 8 }}>{question}</span>
              <textarea
                rows={3}
                maxLength={1200}
                value={futureSelf[index]}
                onChange={(event) => setFutureSelf((current) => current.map((value, i) => i === index ? event.target.value : value))}
                placeholder={lang === 'ru' ? 'Можно написать здесь…' : 'Write a few words…'}
                style={{ width: '100%', resize: 'vertical', font: 'inherit' }}
              />
            </label>
          ))}
          <button className="btn primary block mt24" disabled={!canSave || busy} onClick={() => finish(true)}>
            {busy ? '⏳ …' : ui.fsSave}
          </button>
          <button className="btn ghost block mt12" disabled={busy} onClick={() => finish(false)}>{ui.fsSkip}</button>
          {!canSave && futureSelf.some((answer) => answer.trim()) && (
            <p className="faint center mt8" role="status" style={{ fontSize: 12 }}>
              {lang === 'ru' ? 'Ответьте минимум на два вопроса.' : 'Answer at least two prompts to save your North Star.'}
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentAnswer = answers[itemIndex] ?? 0;
  const likertLabels = FULL_ASSESSMENT_LIKERT_TEXTS[lang] ?? FULL_ASSESSMENT_LIKERT_TEXTS.en;
  const reverseKeyed = currentRef?.kind === 'shadow' && currentRef.index >= 6;

  return (
    <div className="screen">
      <div className="scroll no-dock">
        <div className="row" style={{ paddingTop: 4 }}>
          <button className="ibtn" aria-label={ui.exit} onClick={exit}>×</button>
          <div className="grow">
            <div className="kicker">{ui.descent(sittingIndex)}</div>
            <div className="faint" style={{ fontSize: 11, fontWeight: 800 }}>{ui.itemOf(itemInSitting + 1, 49)} · {answeredCount}/147</div>
          </div>
          <Steps total={3} at={sittingIndex} />
        </div>
        <div className="bar mt12"><i style={{ width: `${(sittingAnswers.filter((answer) => answer > 0).length / 49) * 100}%` }} /></div>

        <div className="card mt24" style={{ minHeight: 205, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="kicker" style={{ color: 'var(--accent-text)' }}>{ui.sitHint}</div>
          <h1 className="h2 mt12" style={{ fontSize: 22, lineHeight: 1.35 }}>{itemText(currentRef, lang)}</h1>
          {reverseKeyed && <p className="faint mt8" style={{ fontSize: 11 }}>{lang === 'ru' ? 'В этом утверждении несогласие может отражать более высокую активацию.' : 'For this item, disagreement can indicate higher activation.'}</p>}
        </div>

        <div role="radiogroup" aria-label={lang === 'ru' ? 'Шкала ответа от 1 до 5' : 'Response scale from 1 to 5'} className="card flat mt16">
          <div className="row" style={{ justifyContent: 'space-between', gap: 6 }}>
            {LIKERT_EMOTES.map((emoji, index) => {
              const rating = index + 1;
              return (
                <button
                  key={rating}
                  type="button"
                  role="radio"
                  aria-checked={currentAnswer === rating}
                  aria-label={`${rating}. ${likertLabels[index]}`}
                  className={`opt${currentAnswer === rating ? ' on' : ''}`}
                  onClick={() => answer(rating)}
                  style={{ flex: 1, minHeight: 86, padding: '10px 4px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                >
                  <span style={{ fontSize: 23 }}>{emoji}</span>
                  <b style={{ fontSize: 13, marginTop: 5 }}>{rating}</b>
                </button>
              );
            })}
          </div>
          <div className="row mt8" style={{ justifyContent: 'space-between', fontSize: 10.5, fontWeight: 800, color: 'var(--text-faint)' }}>
            <span>{likertLabels[0]}</span><span style={{ textAlign: 'right' }}>{likertLabels[4]}</span>
          </div>
        </div>
        <p className="sub center mt12" style={{ fontSize: 12 }}>{ui.sitHint}</p>
        <div className="row mt16" style={{ gap: 10 }}>
          <button className="btn grow" disabled={itemIndex <= 0} onClick={goPrevious}>‹ {ui.back}</button>
          <button className="btn grow" disabled={currentAnswer < 1 || itemIndex >= 146} onClick={goNext}>{ui.next} ›</button>
        </div>
        <div className="row mt12" style={{ gap: 10 }}>
          <button className="btn ghost grow" onClick={exit}>{ui.exit}</button>
          <span className="chip">{answeredCount} / 147</span>
        </div>
        <SaveStatus ui={ui} save={save} onRetry={retrySave} />
        {legacyRetained && <p className="faint center mt8" role="status" style={{ fontSize: 12 }}>{ui.legacyRetained}</p>}
      </div>
    </div>
  );
}
