import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app.jsx';
import { store } from '../core/local-store';
import { myAssignments } from '../core/therapist-link.ts';
import { EXERCISES, EXERCISE_TYPES, chapterUnlocked, ladderRung, redAllowed, suggestExercise } from '../../shared/core/data/exercises';
import { selfServeGate, storeEvent } from '../../shared/core/data/state-v2';
import { STRINGS as SOURCE_STRINGS } from '../../shared/i18n/strings';
import { PracticeToolkit } from './practice-toolkit.jsx';
import { GoalPanel } from './elevation/e01-goal.jsx';
import { UncertaintyPanel } from './elevation/e05-uncertainty-action.jsx';
import { TransferPanel } from './elevation/e08-transfer.jsx';
import { FeedbackPanel } from './elevation/e09-feedback.jsx';
import { RehearsalPanel } from './elevation/e10-rehearsal.jsx';

const PRACTICE_KEY = 'INNERVERSE_PRACTICE_V1';
const CHECKIN_KEY = 'INNERVERSE_CHECKINS_V1';
const DAY_MS = 24 * 60 * 60 * 1000;
/** The if-then plan as text. Backups can store any shape here, so anything but a string shows as empty. */
const planText = (value) => (typeof value === 'string' ? value : '');
const EMPTY_STATE = { lastSuggestedAt: null, completed: [], daysOfCheckIns: 0, synastryRun: false, therapistLinked: false, ladder: {} };

function loadPracticeState() {
  const saved = store.load(PRACTICE_KEY, null);
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return { ...EMPTY_STATE };
  return {
    ...EMPTY_STATE,
    ...saved,
    completed: Array.isArray(saved.completed) ? saved.completed.filter((id) => typeof id === 'string') : [],
    ladder: saved.ladder && typeof saved.ladder === 'object' && !Array.isArray(saved.ladder) ? saved.ladder : {},
  };
}

function loadCheckIns() {
  const rows = store.load(CHECKIN_KEY, []);
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => row && typeof row.date === 'string' && Number.isFinite(Date.parse(row.date))
    && Number.isInteger(row.arousal) && row.arousal >= -2 && row.arousal <= 2);
}

function localDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function uniqueCheckInDays(checkIns) {
  return new Set(checkIns.map((checkIn) => localDay(checkIn.date)).filter(Boolean)).size;
}

function allowedFor(exercise, score, assignmentIds, container) {
  if (!score) return false;
  const gate = EXERCISE_TYPES[exercise.type]?.gate;
  if (gate === 'green') return true;
  if (gate === 'yellow') return selfServeGate('yellow', score) === 'ok';
  return redAllowed(score, container, assignmentIds.has(exercise.id));
}

const gateClass = (gate) => gate === 'red' ? 'danger' : gate === 'yellow' ? 'warning' : 'success';

export function Practice() {
  const { t, lang, setOverlay, profile, toast, user } = useApp();
  const copy = SOURCE_STRINGS.practice[lang] ?? SOURCE_STRINGS.practice.en;
  const [practiceState, setPracticeState] = useState(loadPracticeState);
  const [checkIns] = useState(loadCheckIns);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsError, setAssignmentsError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [ifThenDraft, setIfThenDraft] = useState('');
  const [rehearsalLeft, setRehearsalLeft] = useState(null);
  const rehearsalTimer = useRef(null);

  const clinical = profile?.testModel === 'angular-v2' && profile?.clinical ? profile.clinical : null;
  const dayCount = uniqueCheckInDays(checkIns);
  const localSynastry = store.load('INNERVERSE_SYNASTRY_RUNS_V1', []);
  const angularSynastryReports = store.load('ARCHETYPE_SYNASTRY_REPORTS', []);
  const synastryRun = practiceState.synastryRun
    || (Array.isArray(localSynastry) && localSynastry.length > 0)
    || (Array.isArray(angularSynastryReports) && angularSynastryReports.length > 0);

  useEffect(() => {
    if (!user?.linked || !user.uid) {
      setAssignments([]);
      setAssignmentsError('');
      return undefined;
    }
    let active = true;
    myAssignments(user.uid)
      .then((items) => { if (active) { setAssignments(items); setAssignmentsError(''); } })
      .catch((error) => {
        console.error('Assigned practices load failed', error);
        if (active) setAssignmentsError(t('assignedPracticesLoadFailed'));
      });
    return () => { active = false; };
  }, [user?.uid, user?.linked, t]);

  useEffect(() => () => {
    if (rehearsalTimer.current) clearInterval(rehearsalTimer.current);
  }, []);

  useEffect(() => {
    setIfThenDraft(selectedId ? planText(practiceState.ladder[selectedId]?.ifThen) : '');
  }, [selectedId, practiceState.ladder]);

  // A persisted flag is advisory only; therapist-only access is derived from the signed-in server assignment.
  const therapistLinked = assignments.length > 0;
  const chapterState = {
    descentComplete: !!clinical,
    daysOfCheckIns: dayCount,
    partDialogueCompleted: practiceState.completed.includes('six-f-steps'),
    synastryRun,
    therapistLinked,
  };
  const assignedIds = useMemo(() => new Set(assignments.map((assignment) => assignment.exerciseId)), [assignments]);
  const container = {
    safePlaceBuilt: practiceState.completed.includes('build-safe-place') || practiceState.completed.includes('safe-place-portal'),
    resourcesMobilized: false,
  };

  const suggestion = useMemo(() => {
    if (!clinical) return null;
    return suggestExercise({
      profile: clinical,
      checkIns,
      now: new Date(),
      lastSuggestedAt: practiceState.lastSuggestedAt ? new Date(practiceState.lastSuggestedAt) : null,
    });
  }, [clinical, checkIns, practiceState.lastSuggestedAt]);

  // Changes apply to the stored state, read fresh, so another tab's progress is kept.
  const saveState = (change) => {
    const next = change(loadPracticeState());
    setPracticeState(next);
    store.save(PRACTICE_KEY, next);
  };

  const markDone = (exercise) => {
    saveState((latest) => (latest.completed.includes(exercise.id) ? latest : { ...latest, completed: [...latest.completed, exercise.id] }));
    setRehearsalLeft(null);
    if (rehearsalTimer.current) clearInterval(rehearsalTimer.current);
    toast('✓ ' + t('done'));
  };

  const openSuggested = (exercise) => {
    setSelectedId(exercise.id);
    const lastSuggestedAt = Date.parse(practiceState.lastSuggestedAt ?? '');
    if (!Number.isFinite(lastSuggestedAt) || Date.now() - lastSuggestedAt >= DAY_MS) {
      saveState((latest) => ({ ...latest, lastSuggestedAt: new Date().toISOString() }));
    }
  };

  const patchLadder = (id, patch) => {
    saveState((latest) => ({
      ...latest,
      ladder: { ...latest.ladder, [id]: { ...latest.ladder[id], ...patch } },
    }));
  };

  const startRehearsal = (id) => {
    if (rehearsalTimer.current) clearInterval(rehearsalTimer.current);
    setRehearsalLeft(90);
    rehearsalTimer.current = setInterval(() => {
      setRehearsalLeft((current) => {
        if (current === null || current <= 1) {
          if (rehearsalTimer.current) clearInterval(rehearsalTimer.current);
          rehearsalTimer.current = null;
          const latest = loadPracticeState();
          const ladder = latest.ladder[id] ?? {};
          const next = { ...latest, ladder: { ...latest.ladder, [id]: { ...ladder, rehearsed: true } } };
          setPracticeState(next);
          store.save(PRACTICE_KEY, next);
          return null;
        }
        return current - 1;
      });
    }, 1000);
  };

  const partName = (id) => {
    const local = profile?.parts?.find((part) => part.id === id);
    if (local) return lang === 'ru' ? local.nameRu ?? local.name : local.nameEn ?? local.name;
    const english = {
      taskmaster: 'Taskmaster', inner_critic: 'Inner Critic', pleaser: 'Pleaser', controller: 'Controller',
      analyst: 'Analyst', hermit: 'Hermit', bypasser: 'Bypasser', numb: 'Numb', rebel: 'Rebel', charmer: 'Charmer',
      abandoned: 'Abandoned', ashamed: 'Ashamed', frightened: 'Frightened', unseen: 'Unseen',
    };
    const russian = {
      taskmaster: 'Деятель', inner_critic: 'Внутренний критик', pleaser: 'Угодник', controller: 'Контролёр',
      analyst: 'Аналитик', hermit: 'Отшельник', bypasser: 'Обходчик', numb: 'Онемение', rebel: 'Бунтарь', charmer: 'Обаяшка',
      abandoned: 'Брошенный', ashamed: 'Стыдящийся', frightened: 'Напуганный', unseen: 'Незамеченный',
    };
    return (lang === 'ru' ? russian[id] : english[id]) ?? id;
  };

  const chapterHint = (chapter) => {
    if (chapter === 1) return lang === 'ru' ? 'Сначала завершите полное погружение из 147 пунктов.' : 'Complete the 147-item descent first.';
    if (chapter === 2) return copy.ch2Hint;
    if (chapter === 3) return copy.ch3Hint;
    if (chapter === 4) return copy.ch4Hint;
    return copy.ch5Hint;
  };

  const exerciseAllowed = (exercise, chapterIsOpen = true) => chapterIsOpen && allowedFor(exercise, clinical, assignedIds, container);
  const selectedExercise = EXERCISES.find((exercise) => exercise.id === selectedId) ?? null;
  const selectedAssignment = assignments.find((assignment) => assignment.exerciseId === selectedId) ?? null;

  const chapterSection = (chapterNumber) => {
    const isUnlocked = chapterUnlocked(chapterNumber, chapterState);
    const exercises = EXERCISES.filter((exercise) => EXERCISE_TYPES[exercise.type].chapter === chapterNumber);
    return (
      <section className="card flat mt12" key={chapterNumber} style={{ opacity: isUnlocked ? 1 : 0.66 }}>
        <div className="row">
          <b className="grow" style={{ fontSize: 15 }}>{chapterNumber} · {copy.chapterNames[chapterNumber - 1]}</b>
          <span className="chip" style={{ fontSize: 11 }}>{isUnlocked ? copy.unlocked : copy.locked}</span>
        </div>
        {!isUnlocked && <p className="faint mt8" style={{ fontSize: 12 }}>{chapterHint(chapterNumber)}</p>}
        {isUnlocked && exercises.map((exercise) => {
          const gate = EXERCISE_TYPES[exercise.type].gate;
          const canOpen = exerciseAllowed(exercise, isUnlocked);
          const completed = practiceState.completed.includes(exercise.id);
          return (
            <React.Fragment key={exercise.id}>
              <button className="row mt10" disabled={!canOpen} onClick={() => setSelectedId(selectedId === exercise.id ? null : exercise.id)}
                style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 14, background: selectedId === exercise.id ? 'var(--surface2)' : 'var(--surface)', color: 'var(--text)', textAlign: 'left', gap: 8, cursor: canOpen ? 'pointer' : 'not-allowed', opacity: canOpen ? 1 : 0.58 }}>
                <span className="grow" style={{ fontWeight: 850, fontSize: 13 }}>{lang === 'ru' ? exercise.title.ru : exercise.title.en}{completed ? ' ✓' : ''}</span>
                <span className={`chip ${gateClass(gate)}`} style={{ fontSize: 10 }}>{copy.gate[gate]}</span>
              </button>
              {!canOpen && <p className="faint mt4" style={{ fontSize: 11 }}>{t('exerciseSafetyGate')}</p>}
            </React.Fragment>
          );
        })}
      </section>
    );
  };

  function renderExerciseDetails(exercise, assignment = null) {
    const ladder = practiceState.ladder[exercise.id] ?? {};
    const rung = ladderRung(ladder);
    const steps = lang === 'ru' ? exercise.steps.ru : exercise.steps.en;
    const title = lang === 'ru' ? exercise.title.ru : exercise.title.en;
    const reason = lang === 'ru' ? exercise.why.ru : exercise.why.en;
    const stopRule = exercise.stopRule ? (lang === 'ru' ? exercise.stopRule.ru : exercise.stopRule.en) : null;
    return (
      <div className="card mt8" style={{ borderColor: 'var(--accent)' }}>
        <div className="row"><b className="grow">{title}</b><button className="ibtn" aria-label={t('close')} onClick={() => setSelectedId(null)}>×</button></div>
        <p className="sub mt8">{reason}</p>
        <ol className="sub mt8" style={{ paddingLeft: 22, lineHeight: 1.6 }}>{steps.map((step, index) => <li key={index} className="mt4">{step}</li>)}</ol>
        {stopRule && <p className="card flat mt10" style={{ fontSize: 12, borderColor: 'var(--danger, #d57b7b)' }}><b>{copy.stopRule}:</b> {stopRule}</p>}
        {assignment?.frequency && <p className="faint mt8" style={{ fontSize: 12 }}>🗓 {SOURCE_STRINGS.clinical.freqWords[lang][assignment.frequency] ?? assignment.frequency}</p>}
        {assignment?.note && <p className="faint mt8" style={{ fontSize: 12 }}><b>{t('therapist')}:</b> {assignment.note}</p>}
        <button className="btn primary block mt12" onClick={() => markDone(exercise)}>{copy.done}</button>

        <div className="card flat mt12">
          <div className="kicker">{copy.ladder}</div>
          {copy.rungNames.map((name, index) => {
            const locked = index >= 3 && !therapistLinked;
            return <div className="row mt8" key={name} style={{ opacity: locked ? 0.55 : 1, fontSize: 12 }}><span>{index + 1 <= rung ? '●' : '○'}</span><span className="grow">{name}{locked ? ` — ${copy.rungLocked}` : ''}</span></div>;
          })}
          {rung === 0 && <button className="btn small mt10" onClick={() => patchLadder(exercise.id, { principleNamed: true })}>{copy.rungNamed}</button>}
          {rung === 1 && (
            <div className="mt10">
              <input className="field" value={ifThenDraft} placeholder={copy.rungIfThenPh} onChange={(event) => setIfThenDraft(event.target.value)} />
              <button className="btn small mt8" disabled={ifThenDraft.trim().length <= 5} onClick={() => {
                const plan = ifThenDraft.trim();
                if (plan.length <= 5) return;
                patchLadder(exercise.id, { ifThen: plan });
                setIfThenDraft('');
                storeEvent('ifthen_written');
              }}>{copy.rungSave}</button>
            </div>
          )}
          {rung === 2 && (rehearsalLeft === null
            ? <button className="btn small mt10" onClick={() => startRehearsal(exercise.id)}>{copy.rungStart}</button>
            : <div className="chip mt10">{rehearsalLeft}s</div>)}
          {rung >= 3 && <p className="faint mt8" style={{ fontSize: 11 }}>{planText(ladder.ifThen)}</p>}
          {rung >= 4 && <p className="chip mt8">{copy.integrated}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="overlay">
      <div className="ov-head">
        <div className="ov-title">🏋️ {copy.title}</div>
        <button className="ibtn" aria-label={t('close')} onClick={() => setOverlay(null)}>✕</button>
      </div>
      <div className="ov-body">
        {suggestion ? (
          <div className="card" style={{ borderColor: 'var(--accent)' }}>
            <div className="row"><div className="kicker grow" style={{ color: 'var(--accent-text)' }}>{copy.today}</div><span className={`chip ${gateClass(suggestion.type.gate)}`}>{copy.gate[suggestion.type.gate]}</span></div>
            <h2 className="h2 mt8" style={{ fontSize: 18 }}>{lang === 'ru' ? suggestion.exercise.title.ru : suggestion.exercise.title.en}</h2>
            <p className="sub mt8">{lang === 'ru' ? suggestion.exercise.why.ru : suggestion.exercise.why.en}</p>
            <button className="btn primary block mt12" onClick={() => openSuggested(suggestion.exercise)}>{t('continue')} →</button>
          </div>
        ) : (
          <div className="card flat">
            <div className="kicker">{copy.today}</div>
            <p className="sub mt8">{copy.noneToday}</p>
          </div>
        )}
        {selectedExercise && renderExerciseDetails(selectedExercise, selectedAssignment)}

        {assignmentsError && <p className="faint mt12" role="alert" style={{ fontSize: 12 }}>{assignmentsError}</p>}
        {assignments.length > 0 && (
          <section className="card flat mt16">
            <div className="kicker" style={{ color: 'var(--accent-text)' }}>🧑‍⚕️ {t('therapistAssignedPractices')}</div>
            {assignments.map((assignment) => {
              const exercise = EXERCISES.find((item) => item.id === assignment.exerciseId);
              if (!exercise) return <p key={assignment.id} className="faint mt8">{assignment.exerciseId} · {t('assignedPracticeNotAvailable')}</p>;
              const gate = EXERCISE_TYPES[exercise.type].gate;
              const chapterOpen = chapterUnlocked(EXERCISE_TYPES[exercise.type].chapter, chapterState);
              const canOpen = exerciseAllowed(exercise, chapterOpen);
              return (
                <div key={assignment.id} className="mt8">
                  <button className="chip" disabled={!canOpen} onClick={() => setSelectedId(selectedId === exercise.id ? null : exercise.id)} style={{ width: '100%', justifyContent: 'space-between', opacity: canOpen ? 1 : 0.55 }}>
                    <span>{lang === 'ru' ? exercise.title.ru : exercise.title.en}</span><span>{copy.gate[gate]}</span>
                  </button>
                  {!canOpen && <p className="faint mt4" style={{ fontSize: 11 }}>{t('exerciseSafetyGate')}</p>}
                </div>
              );
            })}
          </section>
        )}

        <div className="kicker mt24">{copy.chapters} · {practiceState.completed.length} ✓</div>
        {[1, 2, 3, 4, 5].map(chapterSection)}
        <GoalPanel />
        <UncertaintyPanel />
        <TransferPanel />
        <FeedbackPanel />
        <RehearsalPanel />
        <div className="mt24"><PracticeToolkit /></div>
      </div>
    </div>
  );
}
