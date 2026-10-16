import React, { useMemo, useState } from 'react';
import { useApp } from '../app.jsx';
import { store } from '../core/local-store.ts';
import { MAX_BEATS, validateReplay } from '../core/replay-authoring.ts';
import { applyControl, nextScreen } from '../core/director-controls.ts';
import { validateScene } from '../core/scene-grammar.ts';
import { validateSceneAssets } from '../core/asset-budget.ts';
import { decideExpansion } from '../core/replay-evaluation.ts';
import {
  MAX_CAST, REPLAY_KEY, WORLD_KEY, finishScene, localizeDefaultScene, normalizeReplayRecord, normalizeWorld, replayForCheck, saveVerified,
} from '../core/replay-scenes.ts';
import './replay.css';

const COPY = {
  en: {
    title: 'Replay',
    intro: 'A Replay is your own imagined version of an everyday moment. It is not a recording, it does not reconstruct a real event, and it does not predict one. You can stop at any time.',
    sceneHeading: 'Everyday scene',
    sceneNote: 'A built-in example. Choose a step to move through it. When you reach an ending, you can mark the scene finished.',
    sceneFinished: 'Finished. This is recorded on this device only.',
    markFinished: 'Mark this scene finished',
    startAgain: 'Start again',
    endingLabel: 'An ending',
    textVersion: 'Text version of this frame',
    stillVersions: 'Still versions of the drawings',
    structureOk: 'Structure checked: every frame has a text version, every frame can be reached, and every path ends in an ending.',
    budgetLine: (total, budget) => `Drawing budget: ${total} of ${budget} units. One drawing style. Every drawing has a still version.`,
    ownHeading: 'Your own Replay',
    ownNote: 'You name the people yourself and write up to six short beats. Nothing here is taken from your profile or your data.',
    optIn: 'I want to build this Replay for my own reflection. I know it is my imagined version, not a record of what happened.',
    titleLabel: 'Title',
    titlePlaceholder: 'For example: a short exchange at the door',
    castHeading: 'Cast',
    castLabel: (n) => `Cast member ${n}`,
    castPlaceholder: (n) => `Person ${n}`,
    addCast: 'Add a cast member',
    removeCast: 'Remove',
    beatsHeading: 'Beats',
    beatLabel: (n) => `Beat ${n}`,
    beatPlaceholder: 'One short moment',
    addBeat: 'Add a beat',
    beatCount: (n, max) => `${n} of ${max} beats written`,
    readyToSave: 'Ready to save.',
    saveOwn: 'Save this Replay',
    unsaved: 'You have changes that are not saved yet.',
    savedReady: 'Saved on this device. You can watch it now.',
    notSaved: 'Not saved.',
    optedOut: 'You have not opted in, so no Replay is kept on this device.',
    notStored: 'This browser would not keep the change. It applies for this visit only.',
    watch: 'Watch',
    watchLocked: 'Watch opens once a valid Replay is saved.',
    watchNote: 'An imagined version you wrote. It does not reconstruct or predict a real event.',
    watchFinish: 'Mark this Replay as watched',
    watchFinished: 'Marked as watched. Recorded on this device only.',
    director: 'Director',
    back: 'Back',
    directorNote: 'Director changes only how this Replay is shown: framing, pace and emphasis. It never changes the words, the names, or any recorded scores.',
    camera: 'Camera',
    wide: 'Wide',
    close: 'Close',
    pacing: 'Pacing',
    slow: 'Slow',
    normal: 'Normal',
    emphasis: 'Emphasis',
    noEmphasis: 'None',
    evalHeading: 'Should Replay grow?',
    evalLabel: 'Needs real sessions',
    evalNote: 'This decision is never made from app data or playtime alone. The app creates no evidence. Enter only what you have actually recorded.',
    decision: {
      pending: 'Pending. No evidence from real sessions has been entered yet.',
      'no-expansion': 'Not expanding. The evidence entered so far is incomplete.',
      expand: 'Evidence for expansion is recorded. Review it against real sessions before acting.',
    },
    playtime: 'Minutes in real sessions (entered by you)',
    benefit: 'Reports of benefit from real users (count)',
    demand: 'Records of demand (count)',
    complexity: 'Note on the complexity trade-off',
    recordEvidence: 'Record evidence',
    evidenceSaved: 'Evidence recorded on this device.',
    invalidNumber: 'Enter zero or a positive number.',
    reasons: {
      'not-opted-in': 'Tick the opt-in box first. A Replay is built only when you choose it.',
      'no-cast': 'Every cast member needs a name you have chosen.',
      'too-many-beats': 'Keep it to six beats or fewer.',
      'no-beats': 'Write at least one beat.',
      'claims-reconstruction': 'The text claims what really happened or what will happen. Rephrase it as your own imagined version.',
    },
    sceneProblems: {
      invalid: 'The scene structure has a broken link.',
      inaccessible: 'A frame has no text version. Every frame needs one.',
      unreachable: 'A frame cannot be reached from the start.',
      'no-exit': 'A frame leads nowhere and is not marked as an ending.',
    },
    budgetProblems: {
      'over-budget': 'The scene is over its drawing budget.',
      'no-static-equivalent': 'A drawing has no still version.',
      'mixed-grammar': 'The drawings use more than one style.',
      'invalid-cost': 'A drawing has an invalid cost.',
    },
  },
  ru: {
    title: 'Реплей',
    intro: 'Реплей — это ваша собственная воображаемая версия обычного момента. Это не запись, он не восстанавливает реальное событие и не предсказывает его. Вы можете остановиться в любой момент.',
    sceneHeading: 'Обычная сцена',
    sceneNote: 'Встроенный пример. Выбирайте шаги, чтобы пройти сцену. Дойдя до концовки, можно отметить сцену завершённой.',
    sceneFinished: 'Завершено. Это сохранено только на этом устройстве.',
    markFinished: 'Отметить сцену завершённой',
    startAgain: 'Начать заново',
    endingLabel: 'Концовка',
    textVersion: 'Текстовое описание этого кадра',
    stillVersions: 'Неподвижные версии рисунков',
    structureOk: 'Структура проверена: у каждого кадра есть текстовое описание, каждый кадр достижим, и каждый путь заканчивается концовкой.',
    budgetLine: (total, budget) => `Бюджет рисунков: ${total} из ${budget} единиц. Один стиль рисунков. У каждого рисунка есть неподвижная версия.`,
    ownHeading: 'Ваш собственный Реплей',
    ownNote: 'Имена людей вы задаёте сами, моментов можно записать до шести. Ничего здесь не берётся из вашего профиля или данных.',
    optIn: 'Я хочу создать этот Реплей для собственного осмысления. Я понимаю, что это моя воображаемая версия, а не запись того, что произошло.',
    titleLabel: 'Название',
    titlePlaceholder: 'Например: короткий разговор у двери',
    castHeading: 'Участники',
    castLabel: (n) => `Участник ${n}`,
    castPlaceholder: (n) => `Человек ${n}`,
    addCast: 'Добавить участника',
    removeCast: 'Убрать',
    beatsHeading: 'Моменты',
    beatLabel: (n) => `Момент ${n}`,
    beatPlaceholder: 'Один короткий момент',
    addBeat: 'Добавить момент',
    beatCount: (n, max) => `Записано моментов: ${n} из ${max}`,
    readyToSave: 'Готово к сохранению.',
    saveOwn: 'Сохранить этот Реплей',
    unsaved: 'Есть изменения, которые ещё не сохранены.',
    savedReady: 'Сохранено на этом устройстве. Можно посмотреть.',
    notSaved: 'Не сохранено.',
    optedOut: 'Согласия нет, поэтому Реплей на этом устройстве не хранится.',
    notStored: 'Браузер не сохранил изменение. Оно действует только для этого визита.',
    watch: 'Смотреть',
    watchLocked: 'Просмотр откроется, когда сохранён корректный Реплей.',
    watchNote: 'Воображаемая версия, которую написали вы. Она не восстанавливает и не предсказывает реальное событие.',
    watchFinish: 'Отметить Реплей просмотренным',
    watchFinished: 'Отмечено как просмотренное. Сохранено только на этом устройстве.',
    director: 'Режиссура',
    back: 'Назад',
    directorNote: 'Режиссура меняет только показ этого Реплея: кадр, темп и акцент. Она никогда не меняет слова, имена и сохранённые оценки.',
    camera: 'Камера',
    wide: 'Общий',
    close: 'Крупно',
    pacing: 'Темп',
    slow: 'Медленно',
    normal: 'Обычно',
    emphasis: 'Акцент',
    noEmphasis: 'Без акцента',
    evalHeading: 'Нужно ли расширять Реплей?',
    evalLabel: 'Нужны реальные сессии',
    evalNote: 'Решение никогда не принимается только по данным приложения или времени в нём. Приложение не создаёт доказательств. Вносите только то, что вы действительно записали.',
    decision: {
      pending: 'Решение отложено. Доказательств из реальных сессий пока не внесено.',
      'no-expansion': 'Расширения нет. Внесённых данных пока недостаточно.',
      expand: 'Доказательства для расширения записаны. Сверьте их с реальными сессиями, прежде чем действовать.',
    },
    playtime: 'Минуты в реальных сессиях (вносите сами)',
    benefit: 'Сообщения о пользе от реальных людей (число)',
    demand: 'Записи о спросе (число)',
    complexity: 'Заметка о компромиссе по сложности',
    recordEvidence: 'Записать данные',
    evidenceSaved: 'Данные записаны на этом устройстве.',
    invalidNumber: 'Введите ноль или положительное число.',
    reasons: {
      'not-opted-in': 'Сначала отметьте согласие. Реплей создаётся только по вашему выбору.',
      'no-cast': 'Каждому участнику нужно имя, которое вы выбрали сами.',
      'too-many-beats': 'Оставьте не больше шести моментов.',
      'no-beats': 'Напишите хотя бы один момент.',
      'claims-reconstruction': 'В тексте говорится, что было на самом деле или что будет. Переформулируйте как свою воображаемую версию.',
    },
    sceneProblems: {
      invalid: 'В структуре сцены есть сломанная связь.',
      inaccessible: 'У одного из кадров нет текстового описания. Оно нужно каждому кадру.',
      unreachable: 'Один из кадров нельзя достичь из начала.',
      'no-exit': 'Из одного кадра нет выхода, и он не отмечен как концовка.',
    },
    budgetProblems: {
      'over-budget': 'Сцена превышает бюджет рисунков.',
      'no-static-equivalent': 'У одного из рисунков нет неподвижной версии.',
      'mixed-grammar': 'Рисунки используют больше одного стиля.',
      'invalid-cost': 'У одного из рисунков некорректная стоимость.',
    },
  },
};

const copyFor = (lang) => ({ ...COPY.en, ...COPY[lang === 'ru' ? 'ru' : 'en'] });
const ownId = () => `own-${Date.now().toString(36)}`;
const isWatchable = (scene) => Boolean(scene) && validateReplay(replayForCheck(scene)).ok;

function draftFrom(scene) {
  return {
    title: scene?.title ?? '',
    optIn: scene?.optIn ?? false,
    castNames: scene?.castNames?.length ? [...scene.castNames] : ['', ''],
    beats: scene?.beats?.length ? [...scene.beats] : [''],
  };
}

function sceneFromDraft(draft, id) {
  return {
    id,
    title: draft.title.trim().slice(0, 120),
    optIn: draft.optIn,
    castNames: draft.castNames.slice(0, MAX_CAST).map((name) => name.trim()),
    beats: draft.beats.map((beat) => beat.trim()).filter(Boolean).slice(0, MAX_BEATS),
  };
}

function parseCount(value, whole) {
  const n = Number(value);
  if (value.trim() === '' || !Number.isFinite(n) || n < 0) return null;
  return whole ? Math.floor(n) : n;
}

/* ── Everyday scene: branching walk, validation and budget ── */
function EverydayScene({ ui, lang, world, onWorld }) {
  const local = useMemo(() => localizeDefaultScene(lang), [lang]);
  const frames = useMemo(() => new Map(local.scene.nodes.map((node) => [node.id, node])), [local]);
  const [currentId, setCurrentId] = useState(local.scene.start);
  const frame = frames.get(currentId) ?? frames.get(local.scene.start);
  const structure = validateScene(local.scene);
  const budget = validateSceneAssets(local.assets, local.budgetUnits);
  const finished = world.places.includes(local.id);
  const ending = frame.exits.length === 0;

  return (
    <div className="iv-panel">
      <h3>{ui.sceneHeading}: {local.title}</h3>
      <p className="iv-panel-note">{ui.sceneNote}</p>
      <p className={structure.ok ? 'iv-panel-note' : 'iv-warn'}>{structure.ok ? ui.structureOk : ui.sceneProblems[structure.reason]}</p>
      <p className={budget.ok ? 'iv-panel-note' : 'iv-warn'}>{budget.ok ? ui.budgetLine(budget.totalUnits, local.budgetUnits) : ui.budgetProblems[budget.reason]}</p>
      <details className="replay-details">
        <summary>{ui.stillVersions}</summary>
        <ul>{local.assets.map((asset) => <li key={asset.id}>{asset.staticEquivalent}</li>)}</ul>
      </details>

      <div className="card iv-card-tight replay-frame">
        <p className="replay-frame-text">{frame.text}</p>
        <p className="replay-frame-alt"><span className="faint">{ui.textVersion}:</span> {frame.textAlternative}</p>
      </div>

      {!ending && (
        <div className="iv-choice" role="group" aria-label={ui.sceneHeading}>
          {frame.exits.map((exit) => (
            <button key={exit} type="button" className="chip" onClick={() => setCurrentId(exit)}>{local.choiceLabels[exit]}</button>
          ))}
        </div>
      )}
      {ending && (
        <div className="iv-row">
          <span className="iv-label-badge">{ui.endingLabel}</span>
          <button type="button" className="btn small" disabled={finished} onClick={() => onWorld(finishScene(world, local.id))}>{ui.markFinished}</button>
        </div>
      )}
      {finished && <p className="iv-panel-note">{ui.sceneFinished}</p>}
      {currentId !== local.scene.start && (
        <div className="iv-row"><button type="button" className="btn ghost small" onClick={() => setCurrentId(local.scene.start)}>{ui.startAgain}</button></div>
      )}
    </div>
  );
}

/* ── The person's own Replay: opt-in, cast, beats ── */
function OwnReplay({ ui, record, onRecord }) {
  const [draft, setDraft] = useState(() => draftFrom(record.scene));
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const verdict = validateReplay(replayForCheck(sceneFromDraft(draft, record.scene?.id ?? 'draft')));
  const filledBeats = draft.beats.filter((beat) => beat.trim()).length;

  const edit = (change) => {
    setDraft((current) => change(current));
    setDirty(true);
    setMessage('');
  };
  const setCast = (index, value) => edit((d) => ({ ...d, castNames: d.castNames.map((name, i) => (i === index ? value : name)) }));
  const removeCast = (index) => edit((d) => ({ ...d, castNames: d.castNames.filter((_, i) => i !== index) }));
  const addCast = () => edit((d) => ({ ...d, castNames: d.castNames.length < MAX_CAST ? [...d.castNames, ''] : d.castNames }));
  const setBeat = (index, value) => edit((d) => ({ ...d, beats: d.beats.map((beat, i) => (i === index ? value : beat)) }));
  const removeBeat = (index) => edit((d) => ({ ...d, beats: d.beats.filter((_, i) => i !== index) }));
  const addBeat = () => edit((d) => ({ ...d, beats: d.beats.length < MAX_BEATS ? [...d.beats, ''] : d.beats }));

  const save = () => {
    const scene = sceneFromDraft(draft, record.scene?.id ?? ownId());
    const after = validateReplay(replayForCheck(scene));
    if (!after.ok && after.reason === 'not-opted-in') {
      // Without opt-in nothing is kept: the saved Replay is removed and the draft stays on screen.
      if (!onRecord({ ...record, scene: null })) return;
      setDirty(false);
      setMessage(ui.optedOut);
      return;
    }
    // A refused draft is never stored, and the last valid Replay stays as it was.
    if (!after.ok) {
      setMessage(`${ui.notSaved} ${ui.reasons[after.reason]}`);
      return;
    }
    if (!onRecord({ ...record, scene })) return;
    setDirty(false);
    setMessage(ui.savedReady);
  };

  return (
    <div className="iv-panel">
      <h3>{ui.ownHeading}</h3>
      <p className="iv-panel-note">{ui.ownNote}</p>
      <label className="iv-field-inline">
        <input type="checkbox" checked={draft.optIn} onChange={(event) => edit((d) => ({ ...d, optIn: event.target.checked }))} />
        {ui.optIn}
      </label>
      <label className="field">{ui.titleLabel}
        <input value={draft.title} placeholder={ui.titlePlaceholder} maxLength={120} onChange={(event) => edit((d) => ({ ...d, title: event.target.value }))} />
      </label>

      <div className="iv-field-group">
        <span className="iv-panel-note"><strong>{ui.castHeading}</strong></span>
        {draft.castNames.map((name, index) => (
          <div className="iv-row" key={`cast-${index}`}>
            <label className="field grow">{ui.castLabel(index + 1)}
              <input value={name} placeholder={ui.castPlaceholder(index + 1)} maxLength={40} onChange={(event) => setCast(index, event.target.value)} />
            </label>
            {draft.castNames.length > 1 && <button type="button" className="btn ghost small" onClick={() => removeCast(index)}>{ui.removeCast}</button>}
          </div>
        ))}
        {draft.castNames.length < MAX_CAST && <div><button type="button" className="btn ghost small" onClick={addCast}>{ui.addCast}</button></div>}
      </div>

      <div className="iv-field-group">
        <span className="iv-panel-note"><strong>{ui.beatsHeading}</strong> · {ui.beatCount(filledBeats, MAX_BEATS)}</span>
        {draft.beats.map((beat, index) => (
          <div className="iv-row" key={`beat-${index}`}>
            <label className="field grow">{ui.beatLabel(index + 1)}
              <input value={beat} placeholder={ui.beatPlaceholder} maxLength={280} onChange={(event) => setBeat(index, event.target.value)} />
            </label>
            {draft.beats.length > 1 && <button type="button" className="btn ghost small" onClick={() => removeBeat(index)}>{ui.removeCast}</button>}
          </div>
        ))}
        {draft.beats.length < MAX_BEATS && <div><button type="button" className="btn ghost small" onClick={addBeat}>{ui.addBeat}</button></div>}
      </div>

      <p className={verdict.ok ? 'iv-panel-note' : 'iv-warn'}>{verdict.ok ? ui.readyToSave : ui.reasons[verdict.reason]}</p>
      {dirty && <p className="iv-panel-note">{ui.unsaved}</p>}
      <div className="iv-row"><button type="button" className="btn primary small" onClick={save}>{ui.saveOwn}</button></div>
      {message && <p className="iv-status" role="status">{message}</p>}
    </div>
  );
}

/* ── Watch: the saved Replay, shown with the current presentation ── */
function ReplayStage({ ui, scene, presentation }) {
  const shown = replayForCheck(scene);
  return (
    <article className={`replay-stage camera-${presentation.camera} pace-${presentation.pacing}`} aria-label={shown.title || ui.ownHeading}>
      <h3>{shown.title || ui.ownHeading}</h3>
      <ul className="replay-cast" aria-label={ui.castHeading}>
        {shown.castNames.map((name, index) => (
          <li key={`${name}-${index}`} className={`replay-name ${presentation.emphasis === name ? 'on' : ''}`}>{name}</li>
        ))}
      </ul>
      <ol className="replay-beats">
        {shown.beats.map((beat, index) => <li key={`beat-${index}`} className="replay-beat">{beat}</li>)}
      </ol>
    </article>
  );
}

function WatchView({ ui, record, world, onWorld, go }) {
  const scene = record.scene;
  const finished = world.places.includes(scene.id);
  return (
    <div className="iv-panel">
      <h3>{ui.watch}</h3>
      <ReplayStage ui={ui} scene={scene} presentation={record.presentation} />
      <p className="iv-panel-note">{ui.watchNote}</p>
      <div className="iv-row">
        <button type="button" className="btn primary small" disabled={finished} onClick={() => onWorld(finishScene(world, scene.id))}>
          {finished ? ui.watchFinished : ui.watchFinish}
        </button>
      </div>
      <div className="iv-row">
        <button type="button" className="btn small" onClick={() => go('open-director')}>{ui.director}</button>
        <button type="button" className="btn ghost small" onClick={() => go('back')}>{ui.back}</button>
      </div>
    </div>
  );
}

/* ── Director: presentation controls only. Scene content and scores are never passed to a writer. ── */
function DirectorView({ ui, record, onRecord, go }) {
  const scene = record.scene;
  if (!scene) return null;
  const canonical = Object.freeze({ title: scene.title, castNames: [...scene.castNames], beats: [...scene.beats] });
  const director = { presentation: record.presentation, scores: canonical };
  const p = record.presentation;

  const control = (change) => {
    const next = applyControl(director, change);
    onRecord({ ...record, presentation: next.presentation });
  };
  const option = (active, label, onClick) => (
    <button type="button" aria-pressed={active} className={active ? 'on' : ''} onClick={onClick}>{label}</button>
  );

  return (
    <div className="iv-panel">
      <h3>{ui.director}</h3>
      <p className="iv-panel-note">{ui.directorNote}</p>
      <ReplayStage ui={ui} scene={scene} presentation={p} />

      <div className="iv-field-group">
        <span className="iv-panel-note"><strong>{ui.camera}</strong></span>
        <div className="seg" role="group" aria-label={ui.camera}>
          {option(p.camera === 'wide', ui.wide, () => control({ kind: 'camera', value: 'wide' }))}
          {option(p.camera === 'close', ui.close, () => control({ kind: 'camera', value: 'close' }))}
        </div>
      </div>
      <div className="iv-field-group">
        <span className="iv-panel-note"><strong>{ui.pacing}</strong></span>
        <div className="seg" role="group" aria-label={ui.pacing}>
          {option(p.pacing === 'slow', ui.slow, () => control({ kind: 'pacing', value: 'slow' }))}
          {option(p.pacing === 'normal', ui.normal, () => control({ kind: 'pacing', value: 'normal' }))}
        </div>
      </div>
      <div className="iv-field-group">
        <span className="iv-panel-note"><strong>{ui.emphasis}</strong></span>
        <div className="seg" role="group" aria-label={ui.emphasis}>
          {option(p.emphasis === null, ui.noEmphasis, () => control({ kind: 'emphasis', value: null }))}
          {scene.castNames.map((name, index) => (
            <React.Fragment key={`emph-${index}`}>{option(p.emphasis === name, name, () => control({ kind: 'emphasis', value: name }))}</React.Fragment>
          ))}
        </div>
      </div>

      <div className="iv-row">
        <button type="button" className="btn small" onClick={() => go('open-watch')}>{ui.watch}</button>
        <button type="button" className="btn ghost small" onClick={() => go('back')}>{ui.back}</button>
      </div>
    </div>
  );
}

/* ── Expansion gate: shown as pending until the person records real evidence ── */
function EvaluationPanel({ ui, record, onRecord }) {
  const ev = record.evidence;
  const [form, setForm] = useState(() => ({
    playtime: String(ev.playtimeMinutes),
    benefit: String(ev.userBenefitReports),
    demand: String(ev.demandRecords),
    complexity: ev.complexityNotes[0] ?? '',
  }));
  const [message, setMessage] = useState('');
  const decision = decideExpansion(record.evidence);

  const save = () => {
    const playtime = parseCount(form.playtime, false);
    const benefit = parseCount(form.benefit, true);
    const demand = parseCount(form.demand, true);
    if (playtime === null || benefit === null || demand === null) { setMessage(ui.invalidNumber); return; }
    const note = form.complexity.trim().slice(0, 500);
    const evidence = { playtimeMinutes: playtime, userBenefitReports: benefit, demandRecords: demand, complexityNotes: note ? [note] : [] };
    setMessage(onRecord({ ...record, evidence }) ? ui.evidenceSaved : '');
  };

  return (
    <div className="iv-panel">
      <h3>{ui.evalHeading}</h3>
      <span className="iv-label-badge">{ui.evalLabel}</span>
      <p className="iv-panel-note">{ui.evalNote}</p>
      <p className="iv-warn" data-decision={decision}>{ui.decision[decision]}</p>

      <label className="field">{ui.playtime}
        <input type="number" min="0" step="1" inputMode="numeric" value={form.playtime} onChange={(event) => setForm({ ...form, playtime: event.target.value })} />
      </label>
      <label className="field">{ui.benefit}
        <input type="number" min="0" step="1" inputMode="numeric" value={form.benefit} onChange={(event) => setForm({ ...form, benefit: event.target.value })} />
      </label>
      <label className="field">{ui.demand}
        <input type="number" min="0" step="1" inputMode="numeric" value={form.demand} onChange={(event) => setForm({ ...form, demand: event.target.value })} />
      </label>
      <label className="field">{ui.complexity}
        <textarea rows={2} maxLength={500} value={form.complexity} onChange={(event) => setForm({ ...form, complexity: event.target.value })} />
      </label>
      <div className="iv-row"><button type="button" className="btn small" onClick={save}>{ui.recordEvidence}</button></div>
      {message && <p className="iv-status" role="status">{message}</p>}
    </div>
  );
}

export function ReplayStudio() {
  const app = useApp();
  const lang = app?.lang === 'ru' ? 'ru' : 'en';
  const ui = copyFor(app?.lang);
  const [record, setRecord] = useState(() => normalizeReplayRecord(store.load(REPLAY_KEY, null)));
  const [world, setWorld] = useState(() => normalizeWorld(store.load(WORLD_KEY, null)));
  const [screen, setScreen] = useState('intro');
  const [notice, setNotice] = useState('');

  const persistRecord = (next) => {
    if (!saveVerified(REPLAY_KEY, next)) { setNotice(ui.notStored); return false; }
    setNotice('');
    setRecord(next);
    return true;
  };
  const persistWorld = (next) => {
    if (!saveVerified(WORLD_KEY, next)) { setNotice(ui.notStored); return false; }
    setNotice('');
    setWorld(next);
    return true;
  };
  const go = (choice) => {
    setNotice('');
    setScreen((current) => nextScreen(current, choice));
  };
  const watchable = isWatchable(record.scene);

  return (
    <section className="iv-panel replay-studio" aria-labelledby="replay-studio-title">
      <h2 id="replay-studio-title">{ui.title}</h2>
      <p className="iv-panel-note">{ui.intro}</p>

      {screen === 'intro' && (
        <>
          <EverydayScene ui={ui} lang={lang} world={world} onWorld={persistWorld} />
          <OwnReplay ui={ui} record={record} onRecord={persistRecord} />
          <div className="iv-panel">
            <div className="iv-row">
              <button type="button" className="btn primary small" disabled={!watchable} onClick={() => go('open-watch')}>{ui.watch}</button>
            </div>
            {!watchable && <p className="iv-panel-note">{ui.watchLocked}</p>}
          </div>
          <EvaluationPanel ui={ui} record={record} onRecord={persistRecord} />
        </>
      )}
      {screen === 'watch' && watchable && <WatchView ui={ui} record={record} world={world} onWorld={persistWorld} go={go} />}
      {screen === 'director' && watchable && <DirectorView ui={ui} record={record} onRecord={persistRecord} go={go} />}
      {(screen === 'watch' || screen === 'director') && !watchable && (
        <div className="iv-panel"><p className="iv-panel-note">{ui.watchLocked}</p><div className="iv-row"><button type="button" className="btn ghost small" onClick={() => go('back')}>{ui.back}</button></div></div>
      )}
      <p className="iv-status" role="status">{notice}</p>
    </section>
  );
}
