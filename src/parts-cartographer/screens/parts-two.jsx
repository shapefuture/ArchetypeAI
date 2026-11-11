import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../app.jsx';
import { store } from '../core/local-store.ts';
import { ROUTE_KEYS } from '../core/assessment-routes.ts';
import { readLastResult, saveLastResult } from '../core/parts-two-store.ts';
import { buildParts2UniverseParts, isParts2Part } from '../core/parts2-universe-adapter.ts';
import { buildScreens, clampIndex, completedStagesFor, stageOf } from '../core/parts-two-flow.ts';
import { CATALOG_REVIEW, reviewedPractices } from '../core/practice-catalog.ts';
import { SCENE_FAMILIES, buildAssessment2Result, rankFamilies, sanitizeCentre, sanitizePlaced, scoreFamilies } from '../../shared/core/data/assessment2/scoring.ts';
import { SELF_QUALITIES } from '../../shared/core/data/parts.ts';
import {
  BLENDING_COPY, CAPACITY_COPY, CENTRE_QUALITY_COPY, CONFIRM_COPY, CONFIRM_SCALE, COSTUME_COPY, EXILE_COPY, FAMILY_COPY,
  FEAR_COPY, GAP_COPY, GROUND_COPY, MEMBER_COPY, NEED_COPY, NEED_PRACTICE, PROVIDER_COPY, PROVIDER_FORM_COPY, REACTION_COPY, SCENE_COPY, TIMING_COPY,
  UI_COPY, ACCESS_COPY,
} from '../../shared/core/data/assessment2/content.ts';
import {
  BLENDING_OPTIONS, CAPACITIES, COSTUMES, EXILE_NEED, GROUND_ITEMS, NEEDS, NEED_PROVIDER, PROVIDER_ACCESS, PROVIDER_FORMS, EXILES, TIMINGS, membersOf,
} from '../../shared/core/data/assessment2/taxonomy.ts';
import { PlacementPad, DepthSlider } from './parts-two-pad.jsx';
import { ProvisionalPad } from './parts-two-provisional.jsx';
import './parts-two.css';

const blankInput = () => ({
  completedStages: [], steadiness: null, lighter: false, scenes: [], picks: {}, timing: {}, costume: {}, confirm: {}, fears: {},
  exileLevel: {}, exileNeed: {}, blending: {}, providers: {}, capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
  centre: { awareness: null, will: null, qualities: [] },
});

const DRAFT_KEY = ROUTE_KEYS.parts2.draft;

function loadDraft() {
  try {
    const draft = store.load(DRAFT_KEY, null);
    return draft && typeof draft === 'object' && draft.input && Array.isArray(draft.input.scenes) ? draft : null;
  } catch { return null; }
}

/** Partial stage-1 answers are kept in the draft, so a resumed person does not repeat them. */
const sceneAnswer = (input, scene) => input.scenes.find((answer) => answer.scene === scene) ?? null;

/** Common frame for every screen: stage name, progress, the not-a-diagnosis note and the navigation. */
function Frame({ T, screens, index, stageNames, children, onBack, onNext, nextLabel, nextDisabled, title, kicker }) {
  const stage = stageOf(screens[index]);
  const label = stageNames[Math.min(stage, 6)];
  return (
    <section className="p2" aria-labelledby="p2-title">
      <p className="p2-kicker" role="status">{T('stageLabel')} {Math.min(stage, 6) + 1} {T('ofLabel')} 7 · {label}</p>
      <progress className="p2-progress" max={screens.length} value={index} aria-label={label} />
      {kicker ? <p className="p2-kicker">{kicker}</p> : null}
      <h2 id="p2-title" className="p2-title">{title}</h2>
      {children}
      <div className="p2-nav">
        {index > 0 ? <button type="button" className="btn ghost" onClick={onBack}>{T('back')}</button> : <span />}
        {onNext ? <button type="button" className="btn primary" onClick={onNext} disabled={nextDisabled}>{nextLabel ?? T('next')}</button> : null}
      </div>
    </section>
  );
}

function GroundScreen({ T, tx, input, setSteadiness, setLighter, onNext, onSkip, frame }) {
  const steady = input.steadiness;
  return (
    <Frame {...frame} title={T('steadyQ')} onNext={steady ? onNext : null}>
      <p className="p2-note">{T('notDiagnosis')}</p>
      <div className="p2-choices" role="radiogroup" aria-label={T('steadyQ')}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" role="radio" aria-checked={steady === value} className={`btn p2-choice${steady === value ? ' on' : ''}`}
            onClick={() => setSteadiness(value)}>
            {value}. {tx(UI_COPY.steadyLabels)[value - 1]}
          </button>
        ))}
      </div>
      {steady !== null && steady <= 2 ? <p className="p2-note">{T('lowSteadyHint')}</p> : null}
      {steady === 1 ? <div className="card p2-support"><h3>{T('supportTitle')}</h3><p>{T('supportBody')}</p></div> : null}
      <label className="p2-check">
        <input type="checkbox" checked={input.lighter} onChange={(event) => setLighter(event.target.checked)} />
        <span>{T('lighterOffer')}</span>
      </label>
      <p className="sub">{T('lighterNote')}</p>
      <button type="button" className="btn ghost block" onClick={onSkip}>{T('skip')}</button>
    </Frame>
  );
}

function SceneScreen({ T, tx, frame, screen, input, commitScene, onSkip }) {
  const saved = sceneAnswer(input, screen.scene);
  const [most, setMost] = useState(saved?.most ?? null);
  const [least, setLeast] = useState(saved?.least ?? null);
  const pick = (family) => {
    if (most === null) return setMost(family);
    if (family === most) { setMost(null); return setLeast(null); }
    setLeast(family);
    return commitScene({ scene: screen.scene, most, least: family });
  };
  const scene = SCENE_COPY[screen.scene];
  return (
    <Frame {...frame} title={tx(scene.title)} kicker={tx(scene.text)} onNext={null}>
      <p className="p2-note">{T('sceneHelp')}</p>
      <p className="p2-status" aria-live="polite">{most === null ? T('most') : least === null ? T('least') : ''}</p>
      <ul className="p2-list">
        {SCENE_FAMILIES[screen.scene].map((family) => {
          const selected = family === most ? 'most' : family === least ? 'least' : null;
          return (
            <li key={family}>
              <button type="button" className={`card p2-card${selected ? ` p2-${selected}` : ''}`} aria-pressed={selected !== null} onClick={() => pick(family)}>
                <span className="p2-tag">{selected ? T(selected) : ''}</span>
                {tx(REACTION_COPY[`${screen.scene}:${family}`])}
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="btn ghost block" onClick={onSkip}>{T('skip')}</button>
    </Frame>
  );
}

function PickScreen({ T, tx, frame, screen, input, setPick, showPad }) {
  const options = membersOf(screen.family);
  const chosen = input.picks[screen.family];
  return (
    <Frame {...frame} title={tx(FAMILY_COPY[screen.family])} kicker={T('narrowHelp')} onNext={null}>
      <p className="p2-note">{T('memberPickNote')}</p>
      <p className="p2-note">{T('provisionalNote')}: {rankFamilies(scoreFamilies(input.scenes)).map((entry) => tx(FAMILY_COPY[entry.family])).join(', ')}</p>
      {showPad ? <ProvisionalPad T={T} tx={tx} scores={scoreFamilies(input.scenes)} /> : null}
      <ul className="p2-list">
        {options.map((member) => (
          <li key={member}>
            <button type="button" className={`card p2-card${chosen === member ? ' p2-most' : ''}`} aria-pressed={chosen === member} onClick={() => setPick(member)}>
              <strong>{tx(MEMBER_COPY[member].name)}</strong>
              <span>{tx(MEMBER_COPY[member].card)}</span>
            </button>
          </li>
        ))}
        <li>
          <button type="button" className={`card p2-card${chosen === 'none' ? ' p2-most' : ''}`} aria-pressed={chosen === 'none'} onClick={() => setPick('none')}>
            {T('noneFits')}
          </button>
        </li>
      </ul>
    </Frame>
  );
}

function TimingScreen({ T, tx, frame, screen, input, setTiming, setCostume, onNext, onSkip }) {
  const member = screen.member;
  const timing = input.timing[member];
  const costume = input.costume?.[member] ?? null;
  return (
    <Frame {...frame} title={tx(MEMBER_COPY[member].name)} kicker={T('timingQ')} onNext={onNext} nextDisabled={!timing}>
      <div className="p2-choices" role="radiogroup" aria-label={T('timingQ')}>
        {TIMINGS.map((value) => (
          <button key={value} type="button" role="radio" aria-checked={timing === value} className={`btn p2-choice${timing === value ? ' on' : ''}`}
            onClick={() => setTiming(value)}>{tx(TIMING_COPY[value])}</button>
        ))}
      </div>
      <p className="p2-note">{T('costumeQ')}</p>
      <div className="p2-chips">
        {COSTUMES.map((value) => (
          <button key={value} type="button" aria-pressed={costume === value} className={`btn small p2-chip${costume === value ? ' on' : ''}`}
            onClick={() => setCostume(costume === value ? null : value)}>{tx(COSTUME_COPY[value])}</button>
        ))}
      </div>
      <button type="button" className="btn ghost block" onClick={onSkip}>{T('skip')}</button>
    </Frame>
  );
}

export function ConfirmScreen({ T, tx, frame, screen, input, setConfirm, onSkip }) {
  const member = screen.member;
  const stored = input.confirm?.[member];
  const [answers, setAnswers] = useState(() => (Array.isArray(stored) && stored.length === 3 ? [...stored] : [null, null, null]));
  const ready = answers.every((value) => value !== null);
  return (
    <Frame {...frame} title={tx(MEMBER_COPY[member].name)} kicker={T('confirmHelp')} onNext={() => setConfirm(answers)} nextDisabled={!ready}>
      {CONFIRM_COPY[member].map((item, row) => (
        <fieldset key={row} className="p2-fieldset">
          <legend>{tx(item)}</legend>
          <div className="p2-scale">
            {CONFIRM_SCALE.map((label, value) => (
              <button key={value} type="button" aria-pressed={answers[row] === value + 1} className={`btn small${answers[row] === value + 1 ? ' on' : ''}`}
                onClick={() => setAnswers((prev) => prev.map((v, i) => (i === row ? value + 1 : v)))}>{tx(label)}</button>
            ))}
          </div>
        </fieldset>
      ))}
      <button type="button" className="btn ghost block" onClick={onSkip}>{T('skip')}</button>
    </Frame>
  );
}

function FearScreen({ T, tx, frame, screen, input, setFear }) {
  const member = screen.member;
  const chosen = input.fears[member];
  return (
    <Frame {...frame} title={tx(MEMBER_COPY[member].name)} kicker={T('fearQ')} onNext={null}>
      <ul className="p2-list">
        {EXILES.map((exile) => (
          <li key={exile}>
            <button type="button" className={`card p2-card${chosen === exile ? ' p2-most' : ''}`} aria-pressed={chosen === exile} onClick={() => setFear(exile)}>
              {tx(FEAR_COPY[exile])}
            </button>
          </li>
        ))}
        <li>
          <button type="button" className={`card p2-card${chosen === 'none' ? ' p2-most' : ''}`} aria-pressed={chosen === 'none'} onClick={() => setFear('none')}>
            {T('noneFits')}
          </button>
        </li>
      </ul>
    </Frame>
  );
}

function ExileScreen({ T, tx, frame, screen, input, commit, onNext }) {
  const exile = screen.exile;
  const level = input.exileLevel[exile] ?? null;
  return (
    <Frame {...frame} title={tx(EXILE_COPY[exile].name)} kicker={`${tx(EXILE_COPY[exile].feeling)} · ${tx(EXILE_COPY[exile].belief)}`} onNext={() => onNext({ level })} nextDisabled={level === null}>
      <p className="p2-kicker">{T('levelQ')}</p>
      <div className="p2-choices" role="radiogroup" aria-label={T('levelQ')}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" role="radio" aria-checked={level === value} className={`btn p2-choice${level === value ? ' on' : ''}`}
            onClick={() => commit('exileLevel', exile, value)}>{value}. {tx(UI_COPY.levelLabels)[value - 1]}</button>
        ))}
      </div>
      <button type="button" className="btn ghost block" onClick={() => onNext({ level: null })}>{T('skip')}</button>
    </Frame>
  );
}

/** Stage 5: what the exile wants. The table need is preselected. Only Next stores a need, so Skip writes nothing. */
export function WantsScreen({ T, tx, frame, screen, input, setNeed, onSkip }) {
  const exile = screen.exile;
  const [need, setLocalNeed] = useState(input.exileNeed[exile] ?? EXILE_NEED[exile]);
  return (
    <Frame {...frame} title={tx(EXILE_COPY[exile].name)} kicker={T('wantsQ')} onNext={() => setNeed(need)} nextDisabled={!need}>
      <div className="p2-chips" role="group" aria-label={T('wantsQ')}>
        {NEEDS.map((value) => (
          <button key={value} type="button" aria-pressed={need === value} className={`btn small p2-chip${need === value ? ' on' : ''}`}
            onClick={() => setLocalNeed(value)}>{tx(NEED_COPY[value])}</button>
        ))}
      </div>
      <button type="button" className="btn ghost block" onClick={onSkip}>{T('skip')}</button>
    </Frame>
  );
}

function BlendScreen({ T, tx, frame, screen, input, setBlending }) {
  const key = screen.key;
  const [kind, id] = key.split(':');
  const name = kind === 'member' ? tx(MEMBER_COPY[id].name) : tx(EXILE_COPY[id].name);
  const chosen = input.blending[key];
  return (
    <Frame {...frame} title={name} kicker={T('feelQ')} onNext={null}>
      <div className="p2-choices" role="radiogroup" aria-label={T('feelQ')}>
        {BLENDING_OPTIONS.map((value) => (
          <button key={value} type="button" role="radio" aria-checked={chosen === value} className={`btn p2-choice${chosen === value ? ' on' : ''}`}
            onClick={() => setBlending(key, value)}>{tx(BLENDING_COPY[value])}</button>
        ))}
      </div>
      <p className="p2-note">{T('placeBlendingNote')}</p>
      <button type="button" className="btn ghost block" onClick={() => setBlending(key, null)}>{T('skip')}</button>
    </Frame>
  );
}

function ProviderScreen({ T, tx, frame, screen, input, onNext, onSkip }) {
  const exile = screen.exile;
  const need = input.exileNeed[exile] ?? EXILE_NEED[exile];
  const saved = input.providers[exile];
  const [access, setAccess] = useState(saved?.access ?? null);
  const [form, setForm] = useState(saved?.form ?? null);
  return (
    <Frame {...frame} title={tx(EXILE_COPY[exile].name)} kicker={tx(PROVIDER_COPY[NEED_PROVIDER[need]])} onNext={access ? () => onNext({ access, form: access === 'none' ? undefined : form ?? undefined }) : null}>
      <p className="p2-note">{T('providerTest')}</p>
      <p className="p2-kicker">{T('providerQ')}</p>
      <div className="p2-choices" role="radiogroup" aria-label={T('providerQ')}>
        {PROVIDER_ACCESS.map((value) => (
          <button key={value} type="button" role="radio" aria-checked={access === value} className={`btn p2-choice${access === value ? ' on' : ''}`}
            onClick={() => setAccess(value)}>{tx(ACCESS_COPY[value])}</button>
        ))}
      </div>
      {access && access !== 'none' ? (
        <>
          <p className="p2-kicker">{T('providerFormQ')}</p>
          <div className="p2-chips">
            {PROVIDER_FORMS.map((value) => (
              <button key={value} type="button" aria-pressed={form === value} className={`btn small p2-chip${form === value ? ' on' : ''}`}
                onClick={() => setForm(form === value ? null : value)}>{tx(PROVIDER_FORM_COPY[value])}</button>
            ))}
          </div>
        </>
      ) : null}
      <button type="button" className="btn ghost block" onClick={onSkip}>{T('skip')}</button>
    </Frame>
  );
}

function CapacityScreen({ T, tx, frame, input, setCapacity, onNext }) {
  const pick = (field, label) => (
    <fieldset className="p2-fieldset">
      <legend>{label}</legend>
      <div className="p2-chips">
        {CAPACITIES.map((value) => (
          <button key={value} type="button" aria-pressed={input[field] === value} className={`btn small p2-chip${input[field] === value ? ' on' : ''}`}
            onClick={() => setCapacity(field, input[field] === value ? null : value)}>{tx(CAPACITY_COPY[value].name)}</button>
        ))}
      </div>
    </fieldset>
  );
  return (
    <Frame {...frame} title={T('capacityEasyQ')} kicker={T('capacityHardQ')} onNext={onNext}>
      {pick('capacityEasiest', T('capacityEasyQ'))}
      {pick('capacityHardest', T('capacityHardQ'))}
      <div className="p2-note">
        {CAPACITIES.map((value) => <p key={value}>{tx(CAPACITY_COPY[value].name)}: {tx(CAPACITY_COPY[value].line)}</p>)}
      </div>
    </Frame>
  );
}

/** Stage 5, the Centre (plan §3.3). Every question can be skipped, so Next is never disabled. A scale holds 1 to 5, 'skip', or null. */
export function CentreScreen({ T, tx, frame, input, setCentre, onSkip }) {
  const saved = sanitizeCentre(input.centre);
  const [awareness, setAwareness] = useState(saved.awareness);
  const [will, setWill] = useState(saved.will);
  const [qualities, setQualities] = useState(saved.qualities);
  const renderScale = (value, setValue, question) => (
    <fieldset className="p2-fieldset">
      <legend>{question}</legend>
      <div className="p2-scale">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button key={rating} type="button" aria-pressed={value === rating} className={`btn small${value === rating ? ' on' : ''}`}
            onClick={() => setValue(rating)}>{rating}. {tx(UI_COPY.centreScaleLabels)[rating - 1]}</button>
        ))}
        <button type="button" aria-pressed={value === 'skip'} className={`btn small${value === 'skip' ? ' on' : ''}`}
          onClick={() => setValue('skip')}>{T('centreSkipOne')}</button>
      </div>
    </fieldset>
  );
  // Kept in SELF_QUALITIES order, so the order of the taps does not change what is stored. A fourth quality is refused.
  const toggleQuality = (quality) => setQualities((prev) => {
    if (prev.includes(quality)) return prev.filter((q) => q !== quality);
    if (prev.length >= 3) return prev;
    return SELF_QUALITIES.filter((q) => q === quality || prev.includes(q));
  });
  const storeAndContinue = () => setCentre({
    awareness: typeof awareness === 'number' ? awareness : null,
    will: typeof will === 'number' ? will : null,
    qualities,
  });
  return (
    <Frame {...frame} title={T('centreTitle')} onNext={storeAndContinue}>
      <p className="p2-note">{T('centreNote')}</p>
      {renderScale(awareness, setAwareness, T('centreAwarenessQ'))}
      {renderScale(will, setWill, T('centreWillQ'))}
      <fieldset className="p2-fieldset">
        <legend>{T('centreQualitiesQ')}</legend>
        <div className="p2-chips">
          {SELF_QUALITIES.map((quality) => {
            const chosen = qualities.includes(quality);
            return (
              <button key={quality} type="button" aria-pressed={chosen} disabled={!chosen && qualities.length >= 3}
                className={`btn small p2-chip${chosen ? ' on' : ''}`} onClick={() => toggleQuality(quality)}>{tx(CENTRE_QUALITY_COPY[quality])}</button>
            );
          })}
        </div>
      </fieldset>
      <button type="button" className="btn ghost block" onClick={onSkip}>{T('skip')}</button>
    </Frame>
  );
}

function GroundScreen2({ T, tx, frame, input, toggleGround, onNext }) {
  return (
    <Frame {...frame} title={T('groundQ')} onNext={onNext}>
      <div className="p2-chips">
        {GROUND_ITEMS.map((value) => (
          <button key={value} type="button" aria-pressed={input.ground.includes(value)} className={`btn small p2-chip${input.ground.includes(value) ? ' on' : ''}`}
            onClick={() => toggleGround(value)}>{tx(GROUND_COPY[value])}</button>
        ))}
      </div>
    </Frame>
  );
}

export function PlaceScreen({ T, tx, frame, input, setPlaced, onNext }) {
  // A provider point follows from its exile, so the person does not place it (plan §5.1, B7).
  const parts = useMemo(() => buildAssessment2Result(input).parts.filter((part) => part.kind !== 'provider'), [input]);
  const [keyChosen, setKeyChosen] = useState(parts[0]?.key ?? null);
  const part = parts.find((entry) => entry.key === keyChosen) ?? parts[0] ?? null;
  if (!part) {
    return <Frame {...frame} title={T('placeHelp')} onNext={onNext}><p className="sub">—</p></Frame>;
  }
  const name = part.kind === 'protector' ? tx(MEMBER_COPY[part.member].name) : part.kind === 'exile' ? tx(EXILE_COPY[part.exile].name) : tx(CAPACITY_COPY[part.capacity].name);
  // Until the person sets an axis, its value is the reference position, and the coordinates panel shows it as unknown.
  const [energy, direction, depth] = part.coordinates;
  const unknown = new Set(part.unmeasuredAxes);
  // Writes only the axes passed in: the pad sets energy and direction, the slider sets depth, "not sure" sets depth to null.
  const write = (values) => setPlaced(part.key, values);
  const depthText = part.depthState === 'set' ? depth.toFixed(2) : part.depthState === 'unsure' ? T('depthNotSure') : T('depthNotAnswered');
  return (
    <Frame {...frame} title={T('pad1')} kicker={T('placeHelp')} onNext={onNext}>
      <div className="p2-chips" role="group" aria-label={T('placeHelp')}>
        {parts.map((entry) => (
          <button key={entry.key} type="button" aria-pressed={entry.key === part.key} className={`btn small p2-chip${entry.key === part.key ? ' on' : ''}`}
            onClick={() => setKeyChosen(entry.key)}>{entry.kind === 'protector' ? tx(MEMBER_COPY[entry.member].name) : entry.kind === 'exile' ? tx(EXILE_COPY[entry.exile].name) : tx(CAPACITY_COPY[entry.capacity].name)}</button>
        ))}
      </div>
      <p className="p2-kicker">{name} · {part.placement === 'placed' ? T('placePlaced') : T('placeReference')}</p>
      <p className="p2-note">{T('depthChoiceHelp')}</p>
      <PlacementPad
        label={`${name}: ${T('pad1')}`}
        x={energy}
        y={direction}
        xLabels={[T('lowLabel'), T('highLabel')]}
        yLabels={[T('awayLabel'), T('towardLabel')]}
        onChange={(values) => write({ ...(values.x !== undefined ? { energy: values.x } : {}), ...(values.y !== undefined ? { direction: values.y } : {}) })}
      />
      <p className="p2-note">{T('axisEnergy')}: {unknown.has('ENERGY') ? T('notSetByYou') : T('setByYou')} · {T('axisDirection')}: {unknown.has('DIRECTION') ? T('notSetByYou') : T('setByYou')}</p>
      <DepthSlider label={`${name}: ${T('axisDepth')}`} value={depth} lowLabel={T('deepLabel')} highLabel={T('surfaceLabel')} onChange={(value) => write({ depth: value })} />
      <p className="p2-note">{T('axisDepth')}: {depthText}</p>
      <button type="button" className="btn ghost block" aria-pressed={part.depthState === 'unsure'} onClick={() => write({ depth: null })}>{T('depthNotSure')}</button>
    </Frame>
  );
}

/** The gap for an exile whose provider is 'none'. A practice title shows only once the catalog is reviewed. */
function GapLines({ T, tx, locale, need }) {
  const practice = CATALOG_REVIEW.status === 'reviewed'
    ? reviewedPractices(locale).find((entry) => entry.id === NEED_PRACTICE[need])
    : undefined;
  return (
    <>
      <p>{tx(GAP_COPY).replace('{need}', tx(NEED_COPY[need]))}</p>
      <p>{practice ? `${T('practiceSuggested')}: ${practice.title}` : T('practiceAfterReview')}</p>
    </>
  );
}

/** The stored date, in the language the person reads. */
const formatSavedDate = (savedAt, locale) => new Date(savedAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

/** The body of a result. The live result and the stored last result both use it, so the two cannot drift apart. */
function ResultBody({ T, tx, locale, result }) {
  const confidence = { high: T('confHigh'), medium: T('confMedium'), low: T('confLow') };
  // A result saved before the Centre existed has none, which reads as all unanswered.
  const centre = sanitizeCentre(result.centre);
  return (
    <>
      <p className="p2-note">{T('resultNote')}</p>
      {result.supportPrompt ? <div className="card p2-support"><h3>{T('supportTitle')}</h3><p>{T('supportBody')}</p></div> : null}
      <ProvisionalPad T={T} tx={tx} scores={result.familyScores} />
      <h3>{T('resultTop')}</h3>
      <ul className="p2-list">
        {result.topFamilies.map((entry) => (
          <li key={entry.family} className="card">
            <strong>{entry.rank}. {tx(FAMILY_COPY[entry.family])}</strong>
            <div className="p2-bar" aria-label={`${tx(FAMILY_COPY[entry.family])}: ${Math.round(((entry.score + 1) / 2) * 100)}%`}>
              <span style={{ width: `${Math.round(((entry.score + 1) / 2) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {/* A provider point is not listed on its own: its access and form show on the exile line. */}
      <ul className="p2-list">
        {result.parts.filter((part) => part.kind !== 'provider').map((part) => {
          const name = part.kind === 'protector' ? tx(MEMBER_COPY[part.member].name) : part.kind === 'exile' ? tx(EXILE_COPY[part.exile].name) : tx(CAPACITY_COPY[part.capacity].name);
          return (
            <li key={part.key} className="card">
              <strong>{name}</strong>
              <p className="sub">
                {part.kind === 'protector' ? `${part.timing ? tx(TIMING_COPY[part.timing]) : tx(UI_COPY.timingUnknown)} · ${tx(FAMILY_COPY[part.family])}` : part.kind === 'exile' ? tx(EXILE_COPY[part.exile].feeling) : ''}
              </p>
              {part.rank !== null ? <p>{T('resultRank')}: {part.rank} · {T('resultConfidence')}: {part.confidence ? confidence[part.confidence] : '—'}</p> : null}
              <p>{T('resultLevel')}: {part.level === null ? T('levelUnknown') : `${part.level} / 5`}</p>
              <p>{T('axisDepth')}: {part.depthState === 'set' ? part.coordinates[2].toFixed(2) : part.depthState === 'unsure' ? T('depthNotSure') : T('depthNotAnswered')}</p>
              {part.guards?.length ? <p>{T('guards')}: {part.guards.map((e) => tx(EXILE_COPY[e].name)).join(', ')}</p> : null}
              {part.need ? <p>{T('needLabel')}: {tx(NEED_COPY[part.need])}</p> : null}
              {part.provider ? <p>{T('providerLabel')}: {tx(ACCESS_COPY[part.provider.access])}{part.provider.form ? ` · ${tx(PROVIDER_FORM_COPY[part.provider.form])}` : ''}</p> : null}
              {part.kind === 'exile' && part.need && part.provider?.access === 'none' ? <GapLines T={T} tx={tx} locale={locale} need={part.need} /> : null}
              {part.costume ? <p>{tx(COSTUME_COPY[part.costume])}</p> : null}
              {part.blending ? <p>{tx(BLENDING_COPY[part.blending])}</p> : null}
            </li>
          );
        })}
      </ul>
      {result.conflicts.length ? (
        <>
          <h3>{T('conflictsTitle')}</h3>
          <ul className="p2-list">
            {result.conflicts.map((conflict, index) => <li key={index} className="card">{tx(UI_COPY.conflictNames[conflict.type])}</li>)}
          </ul>
        </>
      ) : null}
      <h3>{T('centreTitle')}</h3>
      <ul className="p2-list">
        <li className="card">
          <p>{T('centreAwarenessLabel')}: {centre.awareness === null ? T('centreNotAnswered') : `${centre.awareness} / 5`}</p>
          <p>{T('centreWillLabel')}: {centre.will === null ? T('centreNotAnswered') : `${centre.will} / 5`}</p>
          <p>{T('centreQualitiesLabel')}: {centre.qualities.length ? centre.qualities.map((quality) => tx(CENTRE_QUALITY_COPY[quality])).join(', ') : T('centreNotAnswered')}</p>
        </li>
      </ul>
      <p className="sub">{T('notDiagnosis')}</p>
    </>
  );
}

function ResultView({ T, tx, locale, input, onSave, onRestart, saveFailed }) {
  const result = useMemo(() => buildAssessment2Result({ ...input, completedStages: completedStagesFor(input) }), [input]);
  return (
    <section className="p2" aria-labelledby="p2-result-title">
      <h2 id="p2-result-title" className="p2-title">{T('resultTitle')}</h2>
      <ResultBody T={T} tx={tx} locale={locale} result={result} />
      {saveFailed ? <p className="sub mt12" role="alert">{T('saveFailed')}</p> : null}
      <div className="p2-nav">
        <button type="button" className="btn ghost" onClick={onRestart}>{T('restart')}</button>
        <button type="button" className="btn primary" onClick={onSave}>{T('save')}</button>
      </div>
    </section>
  );
}

/** A stored result, read only. It has no save: Start again begins the flow, and the stored result is kept. */
function LastResultView({ T, tx, locale, last, onStartAgain }) {
  return (
    <section className="p2" aria-labelledby="p2-last-title">
      <h2 id="p2-last-title" className="p2-title">
        {last.savedAt ? T('lastResultSaved').replace('{date}', formatSavedDate(last.savedAt, locale)) : T('lastResultTitle')}
      </h2>
      {last.predatesTimingFix ? <p className="p2-note">{T('beforeTimingFix')}</p> : null}
      <ResultBody T={T} tx={tx} locale={locale} result={last.result} />
      <div className="p2-nav">
        <button type="button" className="btn primary" onClick={onStartAgain}>{T('restart')}</button>
      </div>
    </section>
  );
}

export function PartsTwo() {
  const { lang, go, parts, setParts, setUniverseMode } = useApp();
  const locale = lang === 'ru' ? 'ru' : 'en';
  const T = (key) => UI_COPY[key][locale];
  const tx = (bi) => bi[locale];
  const frameBase = { T, tx, stageNames: UI_COPY.stageNames[locale] };

  // A stored draft takes the resume prompt first. With no draft, a stored result opens the read-only last-result view (B9).
  const [lastResult] = useState(() => readLastResult());
  const [phase, setPhase] = useState(() => (loadDraft() ? 'resume' : lastResult ? 'last' : 'running'));
  const [saveFailed, setSaveFailed] = useState(false);
  const [input, setInput] = useState(() => blankInput());
  const [index, setIndex] = useState(0);
  const screens = useMemo(() => buildScreens(input), [input]);
  const at = clampIndex(screens, index);
  const screen = screens[at];

  useEffect(() => {
    if (phase !== 'running') return;
    try { store.save(DRAFT_KEY, { version: 2, input, index: at }); } catch { /* storage may be unavailable; the flow still works */ }
  }, [input, at, phase]);

  const patch = (field, key, value) => setInput((prev) => ({ ...prev, [field]: { ...prev[field], [key]: value } }));
  const forward = () => setIndex((i) => i + 1);
  const back = () => setIndex((i) => Math.max(0, i - 1));

  const resume = () => {
    const draft = loadDraft();
    if (draft) {
      // Placements from a draft written before the depth rule were defaults, not answers, so they are not resumed.
      setInput({ ...blankInput(), ...draft.input, placed: draft.version === 2 ? sanitizePlaced(draft.input.placed) : {} });
      setIndex(draft.index ?? 0);
    }
    setPhase('running');
  };
  // Start again clears the draft only. A stored result is kept.
  const restart = () => {
    try { store.save(DRAFT_KEY, null); } catch { /* ignore */ }
    setInput(blankInput());
    setIndex(0);
    setSaveFailed(false);
    setPhase('running');
  };

  const save = () => {
    const result = buildAssessment2Result({ ...input, completedStages: completedStagesFor(input) });
    // The draft is cleared and the universe opened only once the saved copy reads back (B9). A refused save changes nothing else.
    if (!saveLastResult(result)) { setSaveFailed(true); return; }
    try { store.save(DRAFT_KEY, null); } catch { /* ignore */ }
    const generated = buildParts2UniverseParts(result, locale);
    setParts([...(parts ?? []).filter((part) => !isParts2Part(part)), ...generated]);
    setUniverseMode('parts');
    go('universe');
  };

  if (phase === 'resume') {
    return (
      <section className="p2" aria-labelledby="p2-title">
        <h2 id="p2-title" className="p2-title">{T('title')}</h2>
        <p className="sub">{T('kicker')}</p>
        <div className="p2-nav">
          <button type="button" className="btn ghost" onClick={restart}>{T('restart')}</button>
          <button type="button" className="btn primary" onClick={resume}>{T('resume')}</button>
        </div>
      </section>
    );
  }

  if (phase === 'last' && lastResult) {
    return <LastResultView T={T} tx={tx} locale={locale} last={lastResult} onStartAgain={restart} />;
  }

  if (screen.kind === 'result') {
    return <ResultView T={T} tx={tx} locale={locale} input={input} onSave={save} onRestart={restart} saveFailed={saveFailed} />;
  }

  const frame = { ...frameBase, screens, index: at, onBack: back, onNext: null, nextLabel: null, nextDisabled: false };
  switch (screen.kind) {
    case 'ground':
      return (
        <GroundScreen T={T} tx={tx} input={input} frame={frame}
          setSteadiness={(value) => setInput((prev) => ({ ...prev, steadiness: value }))}
          setLighter={(value) => setInput((prev) => ({ ...prev, lighter: value }))}
          onNext={forward}
          onSkip={forward} />
      );
    case 'scene':
      return (
        <SceneScreen key={screen.scene} T={T} tx={tx} input={input} frame={frame} screen={screen}
          commitScene={(answer) => { setInput((prev) => ({ ...prev, scenes: [...prev.scenes.filter((s) => s.scene !== answer.scene), answer] })); forward(); }}
          onSkip={() => { setInput((prev) => ({ ...prev, scenes: [...prev.scenes.filter((s) => s.scene !== screen.scene), { scene: screen.scene, most: null, least: null }] })); forward(); }} />
      );
    case 'pick':
      return (
        <PickScreen T={T} tx={tx} input={input} frame={frame} screen={screen}
          showPad={at === screens.findIndex((s) => s.kind === 'pick')}
          setPick={(value) => { patch('picks', screen.family, value); forward(); }} />
      );
    case 'timing':
      return (
        <TimingScreen T={T} tx={tx} input={input} frame={frame} screen={screen}
          setTiming={(value) => patch('timing', screen.member, value)}
          setCostume={(value) => patch('costume', screen.member, value)}
          onNext={forward}
          onSkip={() => { patch('timing', screen.member, null); forward(); }} />
      );
    case 'confirm':
      return (
        <ConfirmScreen key={screen.member} T={T} tx={tx} frame={frame} screen={screen} input={input}
          setConfirm={(answers) => { patch('confirm', screen.member, answers); forward(); }}
          onSkip={() => { patch('confirm', screen.member, [null, null, null]); forward(); }} />
      );
    case 'fear':
      return (
        <FearScreen T={T} tx={tx} input={input} frame={frame} screen={screen}
          setFear={(value) => { patch('fears', screen.member, value); forward(); }} />
      );
    case 'exile':
      return (
        <ExileScreen T={T} tx={tx} input={input} frame={frame} screen={screen} commit={patch}
          onNext={({ level }) => { patch('exileLevel', screen.exile, level); forward(); }} />
      );
    case 'blend':
      return (
        <BlendScreen T={T} tx={tx} input={input} frame={frame} screen={screen}
          setBlending={(key, value) => { patch('blending', key, value); forward(); }} />
      );
    case 'wants':
      return (
        <WantsScreen key={screen.exile} T={T} tx={tx} input={input} frame={frame} screen={screen}
          setNeed={(value) => { patch('exileNeed', screen.exile, value); forward(); }}
          onSkip={() => forward()} />
      );
    case 'provider':
      return (
        <ProviderScreen key={screen.exile} T={T} tx={tx} input={input} frame={frame} screen={screen}
          onNext={({ access, form }) => { patch('providers', screen.exile, { access, form }); forward(); }}
          onSkip={() => { patch('providers', screen.exile, undefined); forward(); }} />
      );
    case 'capacity':
      return (
        <CapacityScreen T={T} tx={tx} input={input} frame={frame}
          setCapacity={(field, value) => setInput((prev) => ({ ...prev, [field]: value }))}
          onNext={forward} />
      );
    case 'centre':
      return (
        <CentreScreen T={T} tx={tx} input={input} frame={frame}
          setCentre={(value) => { setInput((prev) => ({ ...prev, centre: value })); forward(); }}
          onSkip={() => { setInput((prev) => ({ ...prev, centre: { awareness: null, will: null, qualities: [] } })); forward(); }} />
      );
    case 'ground2':
      return (
        <GroundScreen2 T={T} tx={tx} input={input} frame={frame}
          toggleGround={(value) => setInput((prev) => ({ ...prev, ground: prev.ground.includes(value) ? prev.ground.filter((g) => g !== value) : [...prev.ground, value] }))}
          onNext={forward} />
      );
    case 'place':
      return (
        <PlaceScreen T={T} tx={tx} input={input} frame={frame}
          setPlaced={(key, values) => setInput((prev) => ({ ...prev, placed: { ...prev.placed, [key]: { ...(prev.placed[key] ?? {}), ...values } } }))}
          onNext={forward} />
      );
    default:
      return null;
  }
}
