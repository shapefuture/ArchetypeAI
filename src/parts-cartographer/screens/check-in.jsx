import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../app.jsx';
import { Confetti } from '../ui/ui.jsx';
import { clinicalPartName } from '../core/clinical-display.ts';
import { KEYS, store } from '../core/local-store';
import {
  adjustTriggerWeights,
  charterTrend,
  predictFlare,
  readyToResurface,
  sealVerdict,
  selectJitaiCard,
  storeEvent,
  stricterCharter,
  unburdeningInWindows,
  verdictLockActive,
  weatherLayer,
  ALL_PART_IDS,
} from '../../shared/core/data/state-v2';
import { COMPLEXES, SHADOW_PARTS } from '../../shared/core/data/parts';
import { COMPLEX_COPY_RU, STRINGS as SOURCE_STRINGS } from '../../shared/i18n/strings';
import { currentPushState, enablePushReminder, disablePushReminder } from '../core/push';
import { ContextualCheckIn, SituationInquiry } from './checkin-toolkit.jsx';
import { DiscriminatorPanel } from './elevation/e04-discriminator.jsx';

const CHECKIN_KEY = 'INNERVERSE_CHECKINS_V1';
const VERDICT_KEY = 'INNERVERSE_SEALED_VERDICTS_V1';
const JITAI_KEY = 'INNERVERSE_JITAI_V1';
const CHARTER_KEY = 'INNERVERSE_CHARTER_V1';
/** Parts whose softening card was already shown. The card appears once per part (§1.10). */
const UNBURDENED_KEY = 'INNERVERSE_UNBURDENED_V1';
const AROUSAL_VALUES = [-2, -1, 0, 1, 2];
const EVENT_VALUES = ['relational', 'achievement', 'loss', 'boundary', 'change', 'calm'];
const RATING_VALUES = ['still true', 'partly', 'state artifact'];

function safeArray(key) {
  const value = store.load(key, []);
  return Array.isArray(value) ? value : [];
}

function isCheckIn(value) {
  return value && typeof value.date === 'string' && Number.isFinite(Date.parse(value.date))
    && Number.isInteger(value.arousal) && value.arousal >= -2 && value.arousal <= 2
    && (value.eventType === undefined || EVENT_VALUES.includes(value.eventType))
    && (value.confirmedPart == null || ALL_PART_IDS.includes(value.confirmedPart))
    && (value.predictedPart == null || ALL_PART_IDS.includes(value.predictedPart));
}

function isSealedVerdict(value) {
  return value && typeof value.text === 'string' && typeof value.createdAt === 'string'
    && typeof value.resurfacesAt === 'string';
}

function lapseToday(history, now) {
  return history.some((checkIn) => {
    const firefighter = ['numb', 'rebel', 'charmer'].includes(checkIn.confirmedPart);
    return firefighter && Math.abs(checkIn.arousal) >= 1
      && (now.getTime() - new Date(checkIn.date).getTime()) / 86400000 <= 1;
  });
}

export function CheckIn() {
  const { t, lang, setOverlay, toast, profile } = useApp();
  const ui = SOURCE_STRINGS.checkin.ui[lang] ?? SOURCE_STRINGS.checkin.ui.en;
  const jitaiCopy = SOURCE_STRINGS.checkin.jitaiCards[lang] ?? SOURCE_STRINGS.checkin.jitaiCards.en;
  const clinical = profile?.testModel === 'angular-v2' && profile?.clinical?.parts ? profile.clinical : null;
  const [history, setHistory] = useState(() => safeArray(CHECKIN_KEY).filter(isCheckIn));
  const [verdicts, setVerdicts] = useState(() => safeArray(VERDICT_KEY).filter(isSealedVerdict));
  const [charterDeliveries, setCharterDeliveries] = useState(() => safeArray(CHARTER_KEY));
  const [stage, setStage] = useState('arousal');
  const [arousal, setArousal] = useState(null);
  const [eventType, setEventType] = useState(null);
  const [predicted, setPredicted] = useState(null);
  const [correcting, setCorrecting] = useState(false);
  const [jitaiCard, setJitaiCard] = useState(null);
  const [blame, setBlame] = useState(5);
  const [license, setLicense] = useState(5);
  const [repairLogged, setRepairLogged] = useState(false);
  const [toldHuman, setToldHuman] = useState(false);
  const [verdictDraft, setVerdictDraft] = useState('');
  const [pushState, setPushState] = useState(() =>
    typeof Notification === 'undefined' || !('serviceWorker' in navigator) ? 'unsupported' : 'unknown',
  );
  const [jitaiAcknowledged, setJitaiAcknowledged] = useState(false);

  useEffect(() => {
    if (pushState === 'unsupported') return undefined;
    let active = true;
    currentPushState().then((state) => { if (active) setPushState(state); });
    return () => { active = false; };
  }, []);

  const now = new Date();
  const dueVerdict = verdicts.find((verdict) => !verdict.reRating && readyToResurface(verdict, now)) ?? null;
  const locked = verdictLockActive(history, now);
  const weather = weatherLayer(history, now);
  const weatherRows = Object.entries(weather).sort((a, b) => b[1].count - a[1].count).slice(0, 4);
  // Read once per visit, so a card shown now stays on screen until the person leaves.
  const [unburdenedBefore] = useState(() => new Set(safeArray(UNBURDENED_KEY).filter((id) => typeof id === 'string')));
  const unburdened = useMemo(() => unburdeningInWindows(history, new Date()).filter((part) => !unburdenedBefore.has(part)), [history, unburdenedBefore]);
  // Written only once the card is on screen (the done stage). A visit that never gets there keeps the card for later.
  useEffect(() => {
    if (stage !== 'done' || dueVerdict || !unburdened.length) return;
    store.save(UNBURDENED_KEY, [...new Set([...safeArray(UNBURDENED_KEY), ...unburdened])]);
  }, [stage, dueVerdict, unburdened]);
  const partName = (id) => {
    const index = SHADOW_PARTS.indexOf(id);
    const adaptedSubtype = lang === 'ru' ? profile?.subtypesRu?.[index] : profile?.subtypesEn?.[index];
    if (adaptedSubtype) return adaptedSubtype;
    const subtype = clinical?.subtypes?.[id];
    if (subtype?.name) return subtype.name;
    return clinicalPartName(id, lang);
  };
  const partsByT = useMemo(() => {
    if (!clinical) return [...SHADOW_PARTS];
    return [...SHADOW_PARTS].sort((a, b) => (clinical.parts[b]?.T ?? 0) - (clinical.parts[a]?.T ?? 0));
  }, [clinical]);

  const saveHistory = (next) => {
    setHistory(next);
    store.save(CHECKIN_KEY, next);
  };

  const rateResurfaced = (verdict, rating) => {
    // Fresh from storage, so a verdict sealed in another tab is kept.
    const next = safeArray(VERDICT_KEY).filter(isSealedVerdict).map((item) => item.createdAt === verdict.createdAt ? { ...item, reRating: rating } : item);
    setVerdicts(next);
    store.save(VERDICT_KEY, next);
  };

  const chooseEvent = (selectedEvent) => {
    setEventType(selectedEvent);
    if (clinical) {
      setPredicted(selectedEvent ? predictFlare(clinical, selectedEvent, adjustTriggerWeights(history)) : clinical.copingStack.l1 ?? null);
    } else {
      setPredicted(null);
    }
    setCorrecting(false);
    setStage('confirm');
  };

  const recordCheckIn = (confirmedPart) => {
    if (arousal === null) return;
    const nowAtRecord = new Date();
    const checkIn = {
      date: nowAtRecord.toISOString(),
      arousal: AROUSAL_VALUES[arousal],
      ...(eventType ? { eventType } : {}),
      ...(predicted ? { predictedPart: predicted } : {}),
      confirmedPart: confirmedPart ?? null,
    };
    // Re-read the stored history so a check-in saved in another tab is kept.
    const nextHistory = [...safeArray(CHECKIN_KEY).filter(isCheckIn), checkIn];
    saveHistory(nextHistory);

    if (clinical) {
      const lapse = lapseToday(nextHistory, nowAtRecord);
      // One lapse event per episode: this check-in starts a lapse only if none was logged in the last day.
      const startsLapse = ['numb', 'rebel', 'charmer'].includes(checkIn.confirmedPart) && Math.abs(checkIn.arousal) >= 1;
      if (startsLapse && !lapseToday(nextHistory.slice(0, -1), nowAtRecord)) storeEvent('lapse');
      const lastJitaiAt = store.load(JITAI_KEY, null);
      const stackL1Flared = nextHistory.some((item) => item.confirmedPart === clinical.copingStack.l1
        && (nowAtRecord.getTime() - new Date(item.date).getTime()) / 86400000 <= 1);
      const card = selectJitaiCard({
        history: nextHistory,
        now: nowAtRecord,
        lastCardAt: lastJitaiAt ? new Date(lastJitaiAt) : null,
        stackL1Flared,
        lapseToday: lapse,
      });
      if (card) store.save(JITAI_KEY, nowAtRecord.toISOString());
      setJitaiCard(card);
    } else {
      setJitaiCard(null);
    }
    setJitaiAcknowledged(false);
    setStage('done');
  };

  const sealCurrentVerdict = () => {
    const text = verdictDraft.trim();
    if (!text || !locked) return;
    const next = [...safeArray(VERDICT_KEY).filter(isSealedVerdict), sealVerdict(text, new Date())];
    setVerdicts(next);
    store.save(VERDICT_KEY, next);
    setVerdictDraft('');
    toast('✓ ' + t('sealed'));
  };

  const recordCharter = (repairLogged, told) => {
    const next = [...safeArray(CHARTER_KEY), { blame, license, at: new Date().toISOString() }];
    setCharterDeliveries(next);
    store.save(CHARTER_KEY, next);
    const legacyCharters = safeArray(KEYS.charter);
    store.save(KEYS.charter, [...legacyCharters, {
      date: new Date().toISOString().slice(0, 10),
      text: `${t('charter')}: ${blame * 10}% blame → ${license * 10}% license`,
    }]);
    if (repairLogged) storeEvent('repair');
    if (told) storeEvent('told');
    setJitaiAcknowledged(true);
    toast('✓ ' + t('done'));
  };

  const fireIfThen = () => {
    storeEvent('ifthen_fired');
    setJitaiAcknowledged(true);
    toast('✓ ' + t('done'));
  };

  const requestReminder = async () => {
    if (pushState === 'enabled') {
      try { await disablePushReminder(); setPushState('ready'); }
      catch { toast(lang === 'ru' ? 'Не удалось отключить уведомления. Повторите.' : 'Could not disable reminders. Try again.'); }
      return;
    }
    const state = await enablePushReminder();
    setPushState(state);
    if (state === 'enabled') toast('🔔 ' + t('pushDone'));
    else toast('🔕 ' + t('pushOpt'));
  };

  const selectedJitaiCopy = () => {
    if (!jitaiCard) return null;
    const copy = jitaiCopy[jitaiCard.id];
    if (jitaiCard.id !== 'dual_bound_charter' || charterTrend(charterDeliveries) !== 'watch') return copy;
    const top = clinical?.activeComplexes?.[0]?.id;
    const experiment = (top
      ? (lang === 'ru' ? COMPLEX_COPY_RU[top]?.experiment : COMPLEXES[top]?.experiment)
      : null) ?? (lang === 'ru' ? 'одно небольшое действие по исправлению' : 'one small repair action');
    if (lang === 'ru') return { ...copy, body: `Без выводов о том, кто вы — это обязательное условие. Одно действие по исправлению на этой неделе: ${experiment}` };
    return { ...copy, body: stricterCharter(experiment) };
  };

  const promptClose = () => setOverlay(null);

  return (
    <div className="overlay">
      <div className="ov-head">
        <div className="ov-title">🫀 {ui.title}</div>
        <button className="ibtn" aria-label={ui.close} onClick={promptClose}>✕</button>
      </div>
      <div className="ov-body">
        {dueVerdict ? (
          <div className="card" style={{ borderColor: 'var(--accent)' }}>
            <div className="kicker">{ui.resurfaceTitle}</div>
            <blockquote className="h2 mt12" style={{ fontSize: 18, lineHeight: 1.5 }}>“{dueVerdict.text}”</blockquote>
            <p className="sub mt12">{ui.resurfaceTitle}</p>
            <div className="row wrap mt16" style={{ gap: 8 }}>
              {ui.ratings.map((label, index) => (
                <button key={label} className="chip" onClick={() => rateResurfaced(dueVerdict, RATING_VALUES[index])}>{label}</button>
              ))}
            </div>
          </div>
        ) : stage === 'arousal' ? (
          <div className="center" style={{ paddingTop: 26 }}>
            <div className="h2">{ui.where}</div>
            <div className="col mt16" style={{ gap: 8 }}>
              {ui.arousal.map((label, index) => (
                <button key={label} className={`btn block ${index === 2 ? 'primary' : ''}`} onClick={() => {
                  setArousal(index);
                  setStage('event');
                }}>{label}</button>
              ))}
            </div>
            <p className="faint mt12" style={{ fontSize: 11 }}>{history.length} · {t('checkin')}</p>
          </div>
        ) : stage === 'event' ? (
          <div className="center" style={{ paddingTop: 20 }}>
            <div className="h2">{ui.eventQ}</div>
            <div className="row wrap mt16" style={{ justifyContent: 'center', gap: 8 }}>
              {ui.events.map((label, index) => (
                <button key={label} className="chip" onClick={() => chooseEvent(EVENT_VALUES[index])}>{label}</button>
              ))}
            </div>
            <button className="btn mt16" onClick={() => chooseEvent(null)}>{ui.skip}</button>
          </div>
        ) : stage === 'confirm' ? (
          <div className="center" style={{ paddingTop: 20 }}>
            {predicted ? (
              <>
                <div className="h2">{ui.didIt(partName(predicted))}</div>
                <div className="col mt16" style={{ gap: 8 }}>
                  <button className="btn primary block" onClick={() => recordCheckIn(predicted)}>{ui.yes}</button>
                  <button className="btn block" onClick={() => recordCheckIn(null)}>{ui.no}</button>
                  {!correcting && <button className="btn block" onClick={() => setCorrecting(true)}>{ui.correct}</button>}
                </div>
                {correcting && (
                  <div className="row wrap mt12" style={{ justifyContent: 'center', gap: 8 }}>
                    {partsByT.map((part) => <button key={part} className="chip" onClick={() => recordCheckIn(part)}>{partName(part)}</button>)}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="h2">{lang === 'ru' ? 'Есть ли часть, которую вы хотите отметить?' : 'Is there a part you want to name?'}</div>
                <p className="sub mt8">{lang === 'ru' ? 'Полная карта нужна для персонального прогноза. Сверку можно записать и без него.' : 'A completed map is needed for a personalized prediction. You can still log this check-in without one.'}</p>
                {/* Without a map there is no prediction, but the person can still name a part, or log without one. */}
                <div className="row wrap mt12" style={{ justifyContent: 'center', gap: 8 }}>
                  {partsByT.map((part) => <button key={part} className="chip" onClick={() => recordCheckIn(part)}>{partName(part)}</button>)}
                </div>
                <button className="btn block mt16" onClick={() => recordCheckIn(null)}>{lang === 'ru' ? 'Записать без части' : 'Log without a part'}</button>
              </>
            )}
          </div>
        ) : (
          <div className="center" style={{ paddingTop: 30, position: 'relative' }}>
            <Confetti show={!dueVerdict} />
            <div className="animate-pop" style={{ fontSize: 52 }}>🫀</div>
            <div className="h2 mt12">{ui.done}</div>
            {weatherRows.length > 0 && (
              <div className="card flat mt16" style={{ textAlign: 'left', width: '100%' }}>
                <div className="kicker">{lang === 'ru' ? 'Погода частей · 30 дней' : 'Parts weather · 30 days'}</div>
                {weatherRows.map(([id, item]) => <p className="sub mt8" key={id}>{partName(id)} · {item.count}</p>)}
              </div>
            )}
            {jitaiCard && !jitaiAcknowledged && (() => {
              const copy = selectedJitaiCopy();
              return (
                <div className="card mt16" style={{ borderColor: 'var(--accent)', textAlign: 'left', width: '100%' }}>
                  <div className="kicker" style={{ color: 'var(--accent-text)' }}>{copy.title}</div>
                  <p className="sub mt8">{copy.body}</p>
                  {jitaiCard.id === 'dual_bound_charter' && (
                    <>
                      <label className="block mt12" style={{ fontSize: 12, fontWeight: 800 }}>{lang === 'ru' ? 'Вина' : 'Blame'} · {blame}/10
                        <input type="range" min="0" max="10" value={blame} onChange={(event) => setBlame(Number(event.target.value))} style={{ display: 'block', width: '100%', accentColor: '#FF2D8A' }} />
                      </label>
                      <label className="block mt12" style={{ fontSize: 12, fontWeight: 800 }}>{lang === 'ru' ? 'Ощущение «это неважно»' : 'License'} · {license}/10
                        <input type="range" min="0" max="10" value={license} onChange={(event) => setLicense(Number(event.target.value))} style={{ display: 'block', width: '100%', accentColor: '#3EE0B0' }} />
                      </label>
                      <label className="row mt12" style={{ fontSize: 12, gap: 8 }}><input type="checkbox" checked={repairLogged} onChange={(event) => setRepairLogged(event.target.checked)} />{lang === 'ru' ? 'Я сделал(а) действие по исправлению' : 'I took a repair action'}</label>
                      <label className="row mt8" style={{ fontSize: 12, gap: 8 }}><input type="checkbox" checked={toldHuman} onChange={(event) => setToldHuman(event.target.checked)} />{lang === 'ru' ? 'Я рассказал(а) об этом человеку' : 'I told a person about it'}</label>
                      <button className="btn primary block mt12" onClick={() => recordCharter(repairLogged, toldHuman)}>{t('confirm')}</button>
                    </>
                  )}
                  {jitaiCard.id === 'if_then_plan' && <button className="btn primary block mt12" onClick={fireIfThen}>{lang === 'ru' ? 'План выполнен под нагрузкой' : 'I used the plan under load'}</button>}
                  {!['dual_bound_charter', 'if_then_plan'].includes(jitaiCard.id) && <button className="btn block mt12" onClick={() => setJitaiAcknowledged(true)}>{t('continue')}</button>}
                </div>
              );
            })()}
            {unburdened.map((part) => <p className="sub mt12" key={part}>{ui.unburdening(partName(part))}</p>)}
            {locked && (
              <div className="card flat mt16" style={{ textAlign: 'left', width: '100%' }}>
                <p className="sub">{ui.verdictLock}</p>
                <p className="faint mt8" style={{ fontSize: 12 }}>{ui.verdictPrompt}</p>
                <textarea className="field mt8" rows="3" value={verdictDraft} onChange={(event) => setVerdictDraft(event.target.value)} />
                <button className="btn primary block mt8" disabled={!verdictDraft.trim()} onClick={sealCurrentVerdict}>{ui.seal}</button>
              </div>
            )}
            {pushState !== 'unsupported' && (
              <button className="btn block mt16" disabled={pushState === 'denied'} onClick={requestReminder}>
                🔔 {pushState === 'enabled' ? (lang === 'ru' ? 'Отключить уведомления' : 'Disable reminders') : t('pushOpt')}
              </button>
            )}
            {(pushState === 'unsupported' || pushState === 'denied') && (
              <p className="faint mt16" style={{ fontSize: 11 }}>
                {lang === 'ru'
                  ? (pushState === 'unsupported' ? 'Уведомления не поддерживаются в этом браузере.' : 'Разрешите уведомления и доступ к сервис-воркерам в настройках браузера.')
                  : (pushState === 'unsupported' ? 'Push notifications are not supported in this browser.' : 'Allow notifications and service workers in your browser settings to enable reminders.')}
              </p>
            )}
            <button className="btn primary block mt10" onClick={promptClose}>{ui.close}</button>
          </div>
        )}
        {!dueVerdict && stage === 'arousal' && (
          <div className="mt24"><ContextualCheckIn /><SituationInquiry /><DiscriminatorPanel /></div>
        )}
      </div>
    </div>
  );
}
