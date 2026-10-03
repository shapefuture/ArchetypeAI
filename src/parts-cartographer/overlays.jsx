import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from './app.jsx';
import { Character } from './pal/Character.tsx';
import { Seg, Confetti, Bars, familyColor, Crest } from './ui/ui.jsx';
import { t as tr, BOND_TYPES, SYNASTRY_DIM_LABELS } from './i18n/strings.ts';
import { FAMILY_LABELS } from './pal/traits.ts';
import { profileToCode } from './core/scoring-v2.ts';
import { hashStr } from './core/ports.ts';
import { downloadText } from './core/file-download';
import { prepareBackup } from './core/backup.ts';
import { readLocalLegacy64Responses } from './core/legacy64-responses';
import { createCloudLegacy64ShareCode, createCloudMapShareCode, loadCloudSynastry, redeemCloudMapShareCode, revokeCloudMapShareCode, saveCloudSynastry } from './core/cloud-storage.ts';
import { ResilientAiAdapter, AI, chatWithContext, generateSynastryNarrative } from './core/ai.adapter.ts';
import { store, KEYS } from './core/local-store';
import { bookableDays, createBooking, endOfSlot, ensureTherapistBusySlots, freeSlots, getTherapistProfile, saveTherapistAvailability, setAppointmentStatus, therapistAppointments, therapistBusyIntervals } from './core/booking.ts';
import { lookupByEmail, syncPublicProfile } from './core/user-directory.ts';
import { createTherapistLink } from './core/therapist-link.ts';
import { LegacySynastryDetails } from './screens/legacy-synastry-report.jsx';
import { ScoredProfileSynastryDetails } from './screens/scored-profile-synastry-report.jsx';

const ovHead = (title, onClose, extra) => (
  <div className="ov-head">
    <div className="ov-title">{title}</div>
    {extra}
    <button className="ibtn" onClick={onClose} aria-label="Close / Закрыть">✕</button>
  </div>
);

/* ═══════════ Coach (chat · streaming · modes) ═══════════ */
export function Coach() {
  const { t, lang, setOverlay, profile, state, parts, sheet } = useApp();
  const [mode, setMode] = useState('parts');
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: tr('sw1', lang) },
  ]);
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  const request = useRef(null);
  const [selectedPart, setSelectedPart] = useState(sheet?.type === 'part' ? sheet.id : '');
  useEffect(() => () => { clearInterval(timer.current); request.current?.abort(); }, []);
  useEffect(() => {
    request.current?.abort(); request.current = null;
    clearInterval(timer.current); setBusy(false); setMsgs([{ role: 'ai', text: tr('sw1', lang) }]);
  }, [lang, mode, selectedPart]);

  const degraded = ResilientAiAdapter.degradation;

  const stream = (full) => {
    clearInterval(timer.current);
    let i = 0;
    timer.current = setInterval(() => {
      i += 3;
      setMsgs((m) => [...m.slice(0, -1), { role: 'ai', text: full.slice(0, i) }]);
      if (i >= full.length) clearInterval(timer.current);
    }, 22);
  };

  const send = async (text) => {
    if (!text.trim() || busy) return;
    const hist = [...msgs, { role: 'user', text }];
    setMsgs([...hist, { role: 'ai', text: '' }]);
    setInput('');
    setBusy(true);
    const controller = new AbortController();
    request.current?.abort(); request.current = controller;
    try {
      const part = parts.find((item) => item.id === selectedPart);
      const full = await chatWithContext(hist, mode, { language: lang, part: part ? { name: part.name, family: part.family, role: part.role, need: part.need, voice: part.voice } : undefined }, { signal: controller.signal });
      if (!controller.signal.aborted && request.current === controller) stream(full);
    } catch {
      if (!controller.signal.aborted && request.current === controller) stream(tr('sw2', lang));
    }
    if (request.current === controller) setBusy(false);
  };

  return (
    <div className="overlay">
      {ovHead('✨ ' + t('coach'), () => setOverlay(null),
        <span className="degraded" style={{ fontSize: 10 }}>{degraded.degraded ? (lang === 'ru' ? '◌ локально' : '◌ local') : (lang === 'ru' ? '◌ ИИ' : '◌ AI')}</span>)}
      <div style={{ padding: '0 20px 8px' }}>
        <Seg value={mode} onChange={setMode} options={[
          { v: 'general', l: t('modeGeneral') },
          { v: 'parts', l: t('modeParts') },
        ]} />
      </div>
      <div className="ov-body">
        {mode === 'parts' && <label className="field">{lang === 'ru' ? 'Часть для диалога' : 'Part for dialogue'}<select value={selectedPart} onChange={(event) => setSelectedPart(event.target.value)}><option value="">{lang === 'ru' ? 'Исследовать вместе' : 'Explore together'}</option>{parts.map((part) => <option key={part.id} value={part.id}>{part.name}</option>)}</select></label>}
        {msgs.map((m, i) => (
          <div key={i} className={`chat-row ${m.role}`}>
            <div className="chat-bubble">
              {m.text || <span className="blink" style={{ animation: 'blink 1s infinite' }}>▌</span>}
            </div>
          </div>
        ))}
        <div className="row wrap mt16" style={{ gap: 8 }}>
          {['coachQ1', 'coachQ2', 'coachQ3'].map((k) => (
            <button key={k} className="chip" onClick={() => send(t(k))}>{t(k)}</button>
          ))}
        </div>
        <div className="chat-dock-space" />
      </div>
      <div className="ov-foot row" style={{ gap: 10 }}>
        <div className="field grow" style={{ marginBottom: 0 }}>
          <input value={input} aria-label={t('askAnything')} placeholder={t('askAnything')}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)} />
        </div>
        {busy ? <button className="btn" onClick={() => {
          request.current?.abort(); clearInterval(timer.current); setBusy(false);
          setMsgs((messages) => [...messages.slice(0, -1), { role: 'ai', text: lang === 'ru' ? 'Запрос отменён.' : 'Request cancelled.' }]);
        }}>{lang === 'ru' ? 'Отмена' : 'Cancel'}</button> : <button className="btn primary" style={{ minHeight: 48, padding: '0 20px' }}
          aria-label={lang === 'ru' ? 'Отправить' : 'Send'} onClick={() => send(input)}>↑</button>}
      </div>
    </div>
  );
}

/* ═══════════ Help (7 contextual items) ═══════════ */
export function Help() {
  const { t, setOverlay } = useApp();
  return (
    <div className="overlay">
      {ovHead('💡 ' + t('helpT'), () => setOverlay(null))}
      <div className="ov-body">
        {['helpI1', 'helpI2', 'helpI3', 'helpI4', 'helpI5', 'helpI6', 'helpI7'].map((k, i) => (
          <div key={k} className="help-item">
            <h4>{['🌌', '🎛', '✦', '🎨', '✨', '💾', '🌀'][i]} {i + 1}</h4>
            <p>{t(k)}</p>
          </div>
        ))}
        <div className="kicker mt24">{t('settings')}</div>
        <div className="row mt8" style={{ gap: 10 }}>
          <button className="btn grow" onClick={() => setOverlay('login')}>🔐 {t('loginT')}</button>
          <button className="btn grow" onClick={() => setOverlay('paywall')}>💎 {t('subscribe')}</button>
        </div>
        <button className="btn ghost block mt12" onClick={() => setOverlay(null)}>{t('close')}</button>
      </div>
    </div>
  );
}

/* ═══════════ Install prompt ═══════════ */
export function InstallPrompt({ deferred, onClose }) {
  const { t, lang, toast } = useApp();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const canNative = !!deferred?.prompt;
  const doInstall = async () => {
    try { store.save(KEYS.installSeen, Date.now()); } catch { /* */ }
    if (deferred?.prompt) { try { await deferred.prompt(); } catch { /* */ } }
    toast('📲 ' + t('installNow'));
    onClose?.();
  };
  const dismiss = () => { try { store.save(KEYS.installSeen, Date.now()); } catch { /* */ } onClose?.(); };
  const showGuide = isIOS || !canNative;
  return (
    <div className="overlay center">
      <div className="card" style={{ textAlign: 'center', borderColor: 'var(--yolk)' }}>
        <div style={{ fontSize: 46 }} className="animate-float">📲</div>
        <div className="h2 mt12">{t('installT')}</div>
        <p className="sub mt8">{showGuide ? t('instIosSub') : t('installB')}</p>
        {showGuide && (
          <div className="mt16" style={{ textAlign: 'left', display: 'grid', gap: 10 }}>
            {[['1', 'instStep1', '📤'], ['2', 'instStep2', '⚙️'], ['3', 'instStep3', '➕']].map(([n, k, ico]) => (
              <div key={n} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <span className="chip on" style={{ flex: '0 0 auto', minWidth: 30, justifyContent: 'center' }}>{ico}</span>
                <span style={{ fontWeight: 800, fontSize: 13.5, lineHeight: 1.4, paddingTop: 6 }}>
                  <b>{n}.</b> {t(k)}
                </span>
              </div>
            ))}
          </div>
        )}
        {!showGuide && (
          <button className="btn primary block mt16" onClick={doInstall}>{t('installNow')}</button>
        )}
        {showGuide && canNative && (
          <button className="btn primary block mt16" onClick={doInstall}>{t('installNow')}</button>
        )}
        <button className="btn ghost block mt12" onClick={dismiss}>{t('later')}</button>
      </div>
    </div>
  );
}

/* ═══════════ Synastry (compatibility) ═══════════ */
export function SynastryOv() {
  const { t, lang, setOverlay, profile, toast, premium, openPaywall, parts, user } = useApp();
  const [tab, setTab] = useState('gen');
  const [code, setCode] = useState('');
  const [issuedCodes, setIssuedCodes] = useState(() => {
    const existing = store.load(KEYS.share, []);
    return [...(Array.isArray(existing) ? existing : [])].filter((entry) => entry?.source === 'cloud-map' && entry.uid === user?.uid && typeof entry.c === 'string').reverse();
  });
  const legacyResponses = readLocalLegacy64Responses();
  const [shareKind, setShareKind] = useState(profile ? 'map' : 'legacy64');
  const canShare = shareKind === 'legacy64' ? !!legacyResponses : !!profile;
  const [shareConfirmed, setShareConfirmed] = useState(false);
  const [shareError, setShareError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [savedBusy, setSavedBusy] = useState(false);
  const [savedError, setSavedError] = useState('');
  const [synNarrative, setSynNarrative] = useState('');
  const [synNarrativeBusy, setSynNarrativeBusy] = useState(false);
  const [synNarrativeError, setSynNarrativeError] = useState(false);
  const synNarrativeAbort = useRef(null);
  const synNarrativeLanguage = useRef(lang);

  useEffect(() => () => {
    const active = synNarrativeAbort.current;
    synNarrativeAbort.current = null;
    active?.abort();
  }, []);

  const rememberSynastryRun = (partnerCode) => {
    try {
      const existing = store.load('INNERVERSE_SYNASTRY_RUNS_V1', []);
      const history = Array.isArray(existing) ? existing : [];
      store.save('INNERVERSE_SYNASTRY_RUNS_V1', [{ at: new Date().toISOString(), partnerCode: String(partnerCode ?? '').slice(0, 80) }, ...history].slice(0, 50));
    } catch { /* chapter unlock remains conservative if local storage is unavailable */ }
  };

  const resetSynastryNarrative = () => {
    const active = synNarrativeAbort.current;
    synNarrativeAbort.current = null;
    active?.abort();
    setSynNarrativeBusy(false);
    setSynNarrativeError(false);
    setSynNarrative('');
  };

  useEffect(() => {
    if (synNarrativeLanguage.current === lang) return;
    synNarrativeLanguage.current = lang;
    resetSynastryNarrative();
  }, [lang]);

  const cancelSynastryNarrative = () => {
    const active = synNarrativeAbort.current;
    synNarrativeAbort.current = null;
    active?.abort();
    setSynNarrativeBusy(false);
  };

  const summarizeSynastryForAi = (report) => {
    const legacy = report?.legacy64;
    const scoredProfile = report?.scoredProfileV2;
    if (scoredProfile) return {
      engineVersion: 'angular-scored-profile-v2',
      language: lang === 'ru' ? 'ru' : 'en',
      metrics: report.dims?.map(({ key, labelEn, labelRu, value }) => ({ key, labelEn, labelRu, value })),
      dance: scoredProfile.dance,
      loop: scoredProfile.loop,
      interlocks: scoredProfile.interlocks,
      noLockedStoryline: scoredProfile.noLockedStoryline,
      nourishHighlights: scoredProfile.nourishHighlights,
      computedSummary: lang === 'ru' ? report.narrativeRu : report.narrativeEn,
    };
    if (!legacy) return {
      engineVersion: report?.engineVersion,
      language: lang === 'ru' ? 'ru' : 'en',
      metrics: report?.dims?.map(({ key, labelEn, labelRu, value }) => ({ key, labelEn, labelRu, value })),
      computedSummary: lang === 'ru' ? report?.narrativeRu : report?.narrativeEn,
    };
    return {
      engineVersion: 'angular-results-panel-64',
      language: lang === 'ru' ? 'ru' : 'en',
      scores: {
        resonance: legacy.resonanceDepth,
        growth: legacy.growthPotential,
        challenge: legacy.challengeLevel,
        safety: legacy.safetyIndex,
      },
      relationalArchetype: legacy.relationalArchetype,
      attachmentDance: legacy.attachmentDance,
      dimensionalResonance: legacy.dimensionalResonance,
      topArchetypes: [
        legacy.person1Summary.topArchetypes.slice(0, 3).map(({ name, cluster, prominence, partType }) => ({ name, cluster, prominence, partType })),
        legacy.person2Summary.topArchetypes.slice(0, 3).map(({ name, cluster, prominence, partType }) => ({ name, cluster, prominence, partType })),
      ],
      complexes: { shared: legacy.sharedComplexes, complementary: legacy.complementaryComplexes },
      crossPersonTriggers: legacy.crossPersonTriggers,
      boundaryInteraction: legacy.boundaryInteraction,
      jointPathway: legacy.jointPathway,
    };
  };

  const generateAiSynastryNarrative = async () => {
    if (!result || !(result.engineVersion === 'scored-profile-v2' || result.engineVersion === 'legacy64-v1' || result.legacy64 || result.scoredProfileV2)) return;
    const controller = new AbortController();
    synNarrativeAbort.current?.abort();
    synNarrativeAbort.current = controller;
    setSynNarrativeBusy(true);
    setSynNarrativeError(false);
    setSynNarrative('');
    try {
      const text = await generateSynastryNarrative(
        summarizeSynastryForAi(result), lang === 'ru' ? 'ru' : 'en', { signal: controller.signal },
      );
      if (!controller.signal.aborted && synNarrativeAbort.current === controller) {
        setSynNarrative(text);
        const updated = { ...result, aiReflections: { ...result.aiReflections, [lang]: text } };
        setResult(updated);
        store.save(KEYS.syn, updated);
        const saved = savedReports.find((entry) => entry.shareCodeUsed === code.trim().toLowerCase());
        if (saved && user?.uid) {
          await saveCloudSynastry(user.uid, saved.partnerUid, saved.shareCodeUsed, updated);
          setSavedReports((entries) => entries.map((entry) => entry.id === saved.id ? { ...entry, result: updated } : entry));
        }
      }
    } catch (error) {
      if (!controller.signal.aborted && error?.name !== 'AbortError') setSynNarrativeError(true);
    } finally {
      if (synNarrativeAbort.current === controller) {
        synNarrativeAbort.current = null;
        setSynNarrativeBusy(false);
      }
    }
  };

  const gen = async () => {
    if (!canShare) { toast(t('empty')); return; }
    if (!user?.linked || !user.uid) { setOverlay('login'); return; }
    if (!shareConfirmed || busy) return;
    setBusy(true);
    setShareError('');
    try {
      const c = shareKind === 'legacy64' ? await createCloudLegacy64ShareCode(user.uid, legacyResponses) : await createCloudMapShareCode(user.uid, profile, parts);
      const entry = { c, uid: user.uid, at: Date.now(), source: 'cloud-map', assessment: shareKind, partCount: parts.length };
      setIssuedCodes((codes) => [entry, ...codes.filter((item) => item.c !== c)].slice(0, 20));
      store.save(KEYS.share, [
        ...(store.load(KEYS.share, []) ?? []),
        entry,
      ].slice(-20));
      setShareConfirmed(false);
      toast('✓ ' + t('shareCodeCreated'));
    } catch (error) {
      console.error('Map share-code creation failed', error);
      setShareError(t('shareCodeFailed'));
    } finally {
      setBusy(false);
    }
  };

  const revokeShareCode = async (shareCode) => {
    if (!shareCode || busy) return;
    setBusy(true);
    setShareError('');
    try {
      await revokeCloudMapShareCode(shareCode);
      store.save(KEYS.share, (store.load(KEYS.share, []) ?? []).filter((entry) => entry?.c !== shareCode));
      setIssuedCodes((codes) => codes.filter((entry) => entry.c !== shareCode));
      toast('✓ ' + t('shareCodeRevoked'));
    } catch (error) {
      console.error('Map share-code revocation failed', error);
      setShareError(t('shareCodeFailed'));
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    const enteredCode = code.trim();
    if (enteredCode.length < 4 || busy) return;
    setBusy(true);
    resetSynastryNarrative();
    setSavedError('');
    try {
      if (!user?.linked) throw new Error('Sign in to redeem a private map code');
      const shared = await redeemCloudMapShareCode(enteredCode);
      if (!shared) throw new Error('Code is unavailable or revoked');
      const partnerCode = shared?.snapshot
        ? profileToCode(shared.snapshot.profile)
        : shared?.assessment
          ? hashStr(JSON.stringify(shared.assessment.responses)).toString(36).toUpperCase().slice(0, 8)
          : enteredCode;
      const ownCode = profile ? profileToCode(profile) : 'SELF0000';
      const language = lang === 'ru' ? 'ru' : 'en';
      let legacyReport = null;
      let scoredReport = null;
      if (shared?.assessment) {
        const legacyBridge = await import('./core/synastry-legacy64-bridge.ts');
        legacyReport = legacyBridge.synastryFromLegacy64Responses(
          legacyBridge.readLocalLegacy64Responses(), shared.assessment.responses, ownCode, partnerCode, language,
        );
      }
      if (shared?.snapshot && profile && !legacyReport) {
        const profileBridge = await import('./core/synastry-bridge.ts');
        scoredReport = profileBridge.synastryFromSnapshotProfiles(
          profile, shared.snapshot.profile, ownCode, partnerCode, language,
        );
      }
      const r = legacyReport ?? scoredReport;
      if (!r) throw new Error('Two complete compatible assessments are required');
      setResult(r);
      rememberSynastryRun(enteredCode);
      if (shared && user?.uid && shared.uid !== user.uid) {
        try {
          await saveCloudSynastry(user.uid, shared.uid, enteredCode.toLowerCase(), r);
          setSavedReports((items) => [
            { id: shared.uid, partnerUid: shared.uid, shareCodeUsed: enteredCode.toLowerCase(), result: r, updatedAt: new Date().toISOString() },
            ...items.filter((item) => item.partnerUid !== shared.uid),
          ].slice(0, 50));
          toast('✓ ' + t('synSaveOk'));
        } catch (error) {
          console.error('Synastry report save failed', error);
          setSavedError(t('synLoadFailed'));
        }
      }
    } catch (error) {
      console.error('Synastry code resolution failed', error);
      setSavedError(t('synLoadFailed'));
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (tab !== 'saved' || !user?.linked || !user.uid) return;
    let active = true;
    setSavedBusy(true);
    setSavedError('');
    loadCloudSynastry(user.uid).then((entries) => {
      if (active) setSavedReports(entries);
    }).catch((error) => {
      console.error('Saved synastry load failed', error);
      if (active) setSavedError(t('synLoadFailed'));
    }).finally(() => {
      if (active) setSavedBusy(false);
    });
    return () => { active = false; };
  }, [tab, user?.uid, user?.linked, t]);

  const openSavedReport = (entry) => {
    resetSynastryNarrative();
    setResult(entry.result);
    setSynNarrative(entry.result.aiReflections?.[lang] ?? '');
    setCode(entry.shareCodeUsed);
    rememberSynastryRun(entry.shareCodeUsed);
    setTab('paste');
  };

  const upload = async (file) => {
    if (!file || busy) return;
    setBusy(true);
    setSavedError('');
    resetSynastryNarrative();
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('File too large');
      const text = await file.text();
      const parsed = JSON.parse(text);
      let importedProfile = parsed.profile ?? parsed;
      let legacyResponses = parsed.assessment?.responses ?? parsed.assessmentResponses ?? parsed.responses;
      if (parsed.schema === 'parts-cartographer.backup.v2' || parsed.shadow || parsed.ARCHETYPE_ASSESSMENT_RESPONSES) {
        const prepared = await prepareBackup(text, lang);
        importedProfile = prepared.entries[KEYS.profile];
        legacyResponses = prepared.entries.ARCHETYPE_ASSESSMENT_RESPONSES;
      }
      const partnerCode = hashStr(text).toString(36).toUpperCase().slice(0, 8);
      const ownCode = profile ? profileToCode(profile) : 'SELF0000';
      const language = lang === 'ru' ? 'ru' : 'en';
      const legacyBridge = legacyResponses ? await import('./core/synastry-legacy64-bridge.ts') : null;
      const legacyReport = legacyBridge?.synastryFromLegacy64Responses(
        legacyBridge.readLocalLegacy64Responses(), legacyResponses, ownCode, partnerCode, language,
      );
      const profileBridge = profile && !legacyReport ? await import('./core/synastry-bridge.ts') : null;
      const computed = legacyReport ?? profileBridge?.synastryFromSnapshotProfiles(profile, importedProfile, ownCode, partnerCode, language);
      if (!computed) throw new Error('Two complete compatible assessments are required');
      setCode(partnerCode);
      setResult(computed);
      rememberSynastryRun(partnerCode);
    } catch {
      setResult(null);
      setSavedError(lang === 'ru' ? 'Нужны два полных совместимых опросника. Проверьте файл и свой результат.' : 'Two complete compatible assessments are required. Check the file and your own result.');
    } finally { setBusy(false); }
  };

  return (
    <div className="overlay">
      {ovHead('💞 ' + t('synastry'), () => setOverlay(null))}
      <div style={{ padding: '0 20px 6px' }}>
        <Seg value={tab} onChange={setTab} options={[
          { v: 'gen', l: t('generateCode') },
          { v: 'paste', l: t('pasteCode') },
          { v: 'saved', l: t('synSavedTitle') },
          { v: 'up', l: t('uploadJson') },
        ]} />
      </div>
      <div className="ov-body">
        {tab === 'gen' && (
          <div className="center" style={{ paddingTop: 18 }}>
            <Crest family="exile" size={70} />
            <p className="sub mt12">{tr('sw3', lang)}</p>
            {legacyResponses && <label className="field mt12">{lang === 'ru' ? 'Что передать для сравнения' : 'Assessment to compare'}<select value={shareKind} onChange={(event) => { setShareKind(event.target.value); setShareConfirmed(false); }}>{profile && <option value="map">{lang === 'ru' ? 'Карта — только итоговые показатели' : 'Map — aggregate scores only'}</option>}<option value="legacy64">{lang === 'ru' ? 'Опросник отношений — 64 ответа' : 'Relational assessment — 64 answers'}</option></select></label>}
            <p className="sub mt12" style={{ fontSize: 12.5, textAlign: 'left' }}>{shareKind === 'legacy64' ? (lang === 'ru' ? 'Этот код передаёт все 64 ответа в облако для сравнения. Любой вошедший пользователь с кодом сможет их прочитать до отзыва кода. Создавайте его только с этим согласием.' : 'This code uploads all 64 answers for comparison. Any signed-in person holding it can read them until you revoke it. Create it only if you agree to share those answers.') : t('shareCodeConsent')}</p>
            {!user?.linked ? (
              <button className="btn block mt12" onClick={() => setOverlay('login')}>🔐 {t('loginT')}</button>
            ) : (
              <label className="row mt12" style={{ alignItems: 'flex-start', gap: 9, fontSize: 12, fontWeight: 800, textAlign: 'left' }}>
                <input type="checkbox" checked={shareConfirmed} onChange={(e) => setShareConfirmed(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1 }} />
                <span>{t('shareCodeAgree')}</span>
              </label>
            )}
            {issuedCodes.map((entry) => (
              <div key={entry.c} className="card mt16" style={{ borderColor: 'var(--accent)', width: '100%', textAlign: 'left' }}>
                <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('myCode')}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '.14em', marginTop: 6, overflowWrap: 'anywhere' }}>{entry.c}</div>
                <div className="faint mt4" style={{ fontSize: 11 }}>{new Date(entry.at).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}</div>
                <p className="sub" style={{ fontSize: 13 }}>{t('share')} · {entry.partCount ?? parts.length} {tr('sw4', lang)}</p>
                <div className="row mt12" style={{ gap: 10 }}>
                  <button className="btn grow" onClick={() => { navigator.clipboard?.writeText(entry.c); toast('📋 ' + t('copied')); }}>⧉ {t('copy')}</button>
                  <button className="btn primary grow" onClick={() => setOverlay('share')}>↗ {t('shareBtn')}</button>
                </div>
                <button className="btn ghost block mt10" disabled={busy} onClick={() => revokeShareCode(entry.c)}>{t('revokeShareCode')}</button>
              </div>
            ))}
            {shareError && <p className="faint mt8" role="alert" style={{ color: 'var(--danger, #b54a4a)', fontSize: 12 }}>{shareError}</p>}
            <button className="btn primary block mt16" disabled={!canShare || !user?.linked || !shareConfirmed || busy} onClick={gen}>
              {busy ? '⏳ …' : '⚡ ' + t('generateCode')}
            </button>
          </div>
        )}
        {tab === 'paste' && (
          <div>
            <div className="kicker mt8">{t('partnerHint')}</div>
            <div className="field mt8">
              <div className="field">
                <input value={code} maxLength={64} placeholder={t('pasteCode')}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setSavedError(''); }} />
              </div>
            </div>
            <button className="btn primary block" disabled={busy || code.trim().length < 4} onClick={run}>
              {busy ? '✨ …' : '⚗️ ' + t('runSyn')}
            </button>
            {savedError && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{savedError}</p>}
          </div>
        )}
        {tab === 'saved' && (
          <div className="mt8">
            {!user?.linked ? (
              <div className="card center">
                <p className="sub">{t('cloudShareNeedLogin')}</p>
                <button className="btn block mt12" onClick={() => setOverlay('login')}>🔐 {t('loginT')}</button>
              </div>
            ) : savedBusy ? (
              <p className="faint center" role="status">⏳ …</p>
            ) : savedReports.length === 0 ? (
              <p className="sub center">{t('synSavedEmpty')}</p>
            ) : savedReports.map((entry) => (
              <div key={entry.id} className="card flat mt10">
                <div className="row">
                  <div className="grow">
                    <b>{entry.result?.bond?.[lang === 'ru' ? 'ru' : 'en'] || t('reportTitle')}</b>
                    <div className="faint mt4" style={{ fontSize: 11 }}>{new Date(entry.updatedAt).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}</div>
                  </div>
                  <button className="btn small" onClick={() => openSavedReport(entry)}>{t('restoreSyn')}</button>
                </div>
                <p className="sub mt8" style={{ fontSize: 12 }}>{lang === 'ru' ? entry.result?.narrativeRu : entry.result?.narrativeEn}</p>
              </div>
            ))}
            {savedError && <p className="faint mt8" role="alert" style={{ color: 'var(--danger, #b54a4a)', fontSize: 12 }}>{savedError}</p>}
          </div>
        )}
        {tab === 'up' && (
          <div className="center" style={{ paddingTop: 20 }}>
            <div style={{ fontSize: 40 }}>📤</div>
            <p className="sub mt8">{t('partnerHint')}</p>
            <label className="btn primary block mt16" style={{ display: 'block' }}>
              {t('uploadJson')}
              <input type="file" accept="application/json" style={{ display: 'none' }}
                onChange={(e) => upload(e.target.files?.[0])} />
            </label>
          </div>
        )}

        {savedError && tab === 'up' && <p className="sub mt12" role="alert">{savedError}</p>}
        {result && (
          <div className="card mt16" style={{ borderColor: 'var(--accent)', animation: 'screen-in .3s' }}>
            <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('reportTitle')}</div>
            <div className="h2" style={{ fontSize: 20, marginTop: 6 }}>
              {result.bond[lang === 'ru' ? 'ru' : 'en']}
            </div>
            <p className="faint mt4" role="note" style={{ fontSize: 11 }}>
              {result.engineVersion === 'scored-profile-v2' ? t('synScoredProfile')
                : result.engineVersion === 'legacy64-v1' ? t('synLegacy64Profile')
                  : result.engineVersion === 'code-seed-v1' ? t('synCodeOnly')
                    : t('synUnknownVersion')}
            </p>
            <div className="mt12">
              <Bars items={result.dims.map((d) => ({ k: d[lang === 'ru' ? 'labelRu' : 'labelEn'], v: d.value / 100 }))} cls="y" />
            </div>
            <p className="sub mt8" style={{ color: 'var(--text)' }}>
              {lang === 'ru' ? result.narrativeRu : result.narrativeEn}
            </p>
            <button className="btn block mt12" onClick={() => {
              const detailed = document.querySelector('[data-synastry-details]')?.innerText ?? '';
              const report = [`# ${result.bond[lang]}`, '', ...result.dims.map((dimension) => `- ${dimension[lang === 'ru' ? 'labelRu' : 'labelEn']}: ${dimension.value}/100`), '', result[lang === 'ru' ? 'narrativeRu' : 'narrativeEn'], '', detailed, '', synNarrative].join('\n');
              downloadText(report, 'synastry-report.md');
            }}>{lang === 'ru' ? 'Скачать полный отчёт' : 'Download full report'}</button>
            {result.legacy64 && <LegacySynastryDetails report={result.legacy64} lang={lang}
              onDownload={() => {
                const payload = {
                  type: 'ArchetypeAI_SynastryClinicalReport', version: '2.0',
                  timestamp: new Date().toISOString(), language: lang,
                  report: result.legacy64,
                  aiNarrative: synNarrative || null,
                };
                const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `archetype_synastry_report_${new Date().toISOString().slice(0, 10)}.json`;
                anchor.click();
                window.setTimeout(() => URL.revokeObjectURL(url), 0);
              }} />}
            {result.scoredProfileV2 && <ScoredProfileSynastryDetails report={result.scoredProfileV2} lang={lang}
              onDownload={() => {
                const payload = {
                  type: 'ArchetypeAI_ScoredProfileSynastryReport', version: '2.0',
                  timestamp: new Date().toISOString(), language: lang,
                  report: result.scoredProfileV2,
                  aiNarrative: synNarrative || null,
                };
                const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `archetype_synastry_report_${new Date().toISOString().slice(0, 10)}.json`;
                anchor.click();
                window.setTimeout(() => URL.revokeObjectURL(url), 0);
              }} />}
            {(result.engineVersion === 'scored-profile-v2' || result.engineVersion === 'legacy64-v1' || result.legacy64 || result.scoredProfileV2) && (
              <section className="card flat mt12" aria-label={t('synAiReflection')}>
                <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
                  <div className="grow">
                    <b>{t('synAiReflection')}</b>
                    <p className="faint mt4" style={{ fontSize: 11 }}>{t('synAiDisclosure')}</p>
                  </div>
                  <button className="btn small" disabled={busy}
                    onClick={synNarrativeBusy ? cancelSynastryNarrative : generateAiSynastryNarrative}>
                    {synNarrativeBusy ? t('synAiCancel') : synNarrative ? t('synAiRetry') : t('synAiGenerate')}
                  </button>
                </div>
                {synNarrativeBusy && <p className="faint mt8" role="status">{t('synAiRunning')}</p>}
                {synNarrativeError && <p className="sub mt8" role="alert">{t('synAiUnavailable')}</p>}
                {synNarrative && <p className="sub mt8" style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{synNarrative}</p>}
              </section>
            )}
            <button className="btn ghost block mt12" onClick={() => {
              const txt = `${result.bond.en} / ${result.bond.ru}\n${lang === 'ru' ? result.narrativeRu : result.narrativeEn}${synNarrative ? `\n\n${synNarrative}` : ''}`;
              navigator.clipboard?.writeText(txt); toast('📋 ' + t('copied'));
            }}>⧉ {t('copy')}</button>
          </div>
        )}
        <button className="btn block mt16" onClick={() => (premium ? setOverlay('quickscan') : openPaywall())}>
          ⚡ {t('quickscan')}
        </button>
      </div>
    </div>
  );
}

/* ═══════════ Booking wizard (moved to Base page — item 16) ═══════════ */
export function Booking() {
  const { t, lang, setOverlay, toast, profile, user } = useApp();
  const [step, setStep] = useState(0);
  const [therapistEmail, setTherapistEmail] = useState('');
  const [therapist, setTherapist] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [days, setDays] = useState([]);
  const [day, setDay] = useState(null);
  const [slot, setSlot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shareConsent, setShareConsent] = useState(false);

  const slots = useMemo(
    () => day ? freeSlots(availability, appointments, day) : [],
    [availability, appointments, day],
  );
  const dateLabel = (iso) => {
    if (!iso) return '';
    const date = new Date(`${iso}T00:00:00`);
    return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short', day: '2-digit', month: 'short' });
  };
  const displayName = therapist?.displayName || therapist?.email || t('therapist');

  const findTherapist = async () => {
    const email = therapistEmail.trim();
    if (!email || busy) return;
    setError('');
    setShareConsent(false);
    if (!user?.linked) {
      setError(t('bookingLoginRequired'));
      return;
    }
    setBusy(true);
    try {
      const match = await lookupByEmail(email);
      if (!match) {
        setError(t('bookingNotFound'));
        return;
      }
      if (match.uid === user.uid) {
        setError(t('bookingSelf'));
        return;
      }
      const therapistProfile = await getTherapistProfile(match.uid);
      if (!therapistProfile) {
        setError(t('bookingNotTherapist'));
        return;
      }
      // Read a privacy-safe schedule projection; do not silently fall back to
      // an empty schedule if the occupied-slot lookup is denied or unavailable.
      const booked = await therapistBusyIntervals(match.uid);
      const bookDays = bookableDays(therapistProfile.availability, new Date(), 14);
      setTherapist({ uid: match.uid, email: therapistProfile.email || match.email || email, displayName: match.displayName });
      setAvailability(therapistProfile.availability);
      setAppointments(booked);
      setDays(bookDays);
      setDay(null);
      setSlot(null);
      setStep(1);
      if (!bookDays.length) setError(t('bookingNoAvailability'));
    } catch (err) {
      console.error('Therapist lookup failed', err);
      setError(t('bookingLookupFailed'));
    } finally {
      setBusy(false);
    }
  };

  const confirmBooking = async () => {
    if (!user?.linked || !user.email || !therapist || !slot || busy) return;
    setBusy(true);
    setError('');
    try {
      await createBooking({
        clientUid: user.uid,
        clientEmail: user.email,
        therapistUid: therapist.uid,
        therapistEmail: therapist.email,
        start: slot,
        end: endOfSlot(slot, availability),
      });
      setStep(3);
      toast('✓ ' + t('bookingRequestSent'));
    } catch (err) {
      console.error('Booking request failed', err);
      setError(t('bookingFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay">
      {ovHead('📅 ' + t('bookSession'), () => setOverlay(null))}
      <div className="ov-body">
        <div className="steps mt8"><i className={step >= 0 ? 'on' : ''} /><i className={step >= 1 ? 'on' : ''} /><i className={step >= 2 ? 'on' : ''} /></div>

        {profile && step === 0 && (
          <div className="card flat mt16" style={{ width: '100%' }}>
            <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('codeForTher')}</div>
            <div className="row mt8" style={{ gap: 10 }}>
              <div className="grow" style={{ fontFamily: 'var(--font-display)', fontSize: 15.5, letterSpacing: '.1em', fontWeight: 800 }}>
                {String(profileToCode(profile).slice(0, 8))}
              </div>
              <button className="btn small" onClick={() => { navigator.clipboard?.writeText(profileToCode(profile).slice(0, 8)); toast('📋 ' + t('copied')); }}>
                ⧉ {t('copy')}
              </button>
            </div>
          </div>
        )}

        {error && <p className="card flat mt12" role="alert" style={{ color: 'var(--danger, #b54a4a)', fontSize: 13 }}>{error}</p>}

        {!user?.linked && step < 3 && (
          <div className="card flat mt12">
            <p className="sub">{t('bookingLoginRequired')}</p>
            <button className="btn primary block mt12" onClick={() => setOverlay('login')}>🔐 {t('loginT')}</button>
          </div>
        )}

        {step === 0 && user?.linked && (
          <div className="mt16">
            <div className="kicker">{t('pickTherapist')}</div>
            <label className="field mt8">
              <span className="faint" style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>{t('bookingTherapistEmail')}</span>
              <input type="email" autoComplete="email" value={therapistEmail}
                placeholder="therapist@example.com"
                onChange={(e) => setTherapistEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && findTherapist()} />
            </label>
            <button className="btn primary block mt12" disabled={busy || !therapistEmail.trim()} onClick={findTherapist}>
              {busy ? '⏳ …' : t('bookingFind')}
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="mt16">
            <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="kicker">{t('pickDate')}</div>
              <span className="faint" style={{ fontSize: 12 }}>{displayName}</span>
            </div>
            <p className="faint mt8">{lang === 'ru' ? 'Время по часам этого устройства' : 'Times use this device’s clock'} · {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
            {days.length ? (
              <div className="row wrap mt8" style={{ gap: 8 }}>
                {days.map((iso) => (
                  <button key={iso} className={`chip ${day === iso ? 'on' : ''}`} onClick={() => { setDay(iso); setSlot(null); setStep(2); }}>
                    {dateLabel(iso)}
                  </button>
                ))}
              </div>
            ) : <p className="sub mt12">{t('bookingNoAvailability')}</p>}
            <button className="btn ghost block mt16" onClick={() => { setStep(0); setError(''); }}>‹ {t('back')}</button>
          </div>
        )}

        {step === 2 && (
          <div className="mt16">
            <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="kicker">{t('pickSlot')}</div>
              <span className="faint" style={{ fontSize: 12 }}>{dateLabel(day)}</span>
            </div>
            {slots.length ? (
              <div className="row wrap mt8" style={{ gap: 8 }}>
                {slots.map((value) => (
                  <button key={value} className={`chip ${slot === value ? 'on' : ''}`} onClick={() => setSlot(value)} style={{ fontSize: 14 }}>
                    {value.slice(11, 16)}
                  </button>
                ))}
              </div>
            ) : <p className="sub mt12">{t('bookingNoSlots')}</p>}
            <div className="card flat mt16">
              <b>{displayName}</b>
              <div className="faint" style={{ fontWeight: 800, fontSize: 13 }}>{dateLabel(day)}{slot ? ` · ${slot.slice(11, 16)}` : ''}</div>
            </div>
            <label className="row card flat mt12" style={{ alignItems: 'flex-start', gap: 9, fontSize: 12, fontWeight: 800 }}>
              <input type="checkbox" checked={shareConsent} onChange={(event) => setShareConsent(event.target.checked)} style={{ width: 18, height: 18, marginTop: 1, flex: '0 0 18px' }} />
              <span>{t('bookingShareConsent')}</span>
            </label>
            <div className="row mt16" style={{ gap: 10 }}>
              <button className="btn grow" onClick={() => { setStep(1); setError(''); }}>‹ {t('back')}</button>
              <button className="btn primary grow" disabled={!slot || !shareConsent || busy} onClick={confirmBooking}>
                {busy ? '⏳ …' : t('confirmSlot')}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="center" style={{ paddingTop: 30 }}>
            <div className="animate-pop" style={{ fontSize: 50 }}>📅</div>
            <div className="h2 mt12">{t('bookingRequestSent')}</div>
            <p className="sub">{displayName} · {dateLabel(day)} · {slot?.slice(11, 16)}</p>
            <button className="btn primary block mt16" onClick={() => setOverlay(null)}>{t('done')}</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ Therapist (attestation + availability — item 15) ═══════════ */
/* availability: per-day on/off + own from/to (advanced controls) */
const AVAIL_DEFAULT = { days: { 0: { on: true, from: '09:00', to: '18:00' }, 1: { on: true, from: '09:00', to: '18:00' }, 2: { on: true, from: '09:00', to: '18:00' }, 3: { on: true, from: '09:00', to: '18:00' }, 4: { on: true, from: '09:00', to: '18:00' }, 5: { on: false, from: '10:00', to: '16:00' }, 6: { on: false, from: '10:00', to: '16:00' } } };
function loadAvail() {
  try {
    const raw = JSON.parse(localStorage.getItem('ifs.avail') ?? 'null');
    if (!raw) return AVAIL_DEFAULT;
    if (Array.isArray(raw.days)) { // migrate old {days:[..], from, to} shape
      const days = {};
      for (let i = 0; i < 7; i++) days[i] = { on: raw.days.includes(i), from: raw.from ?? '09:00', to: raw.to ?? '18:00' };
      return { days };
    }
    if (raw.days && typeof raw.days === 'object') return raw;
    return AVAIL_DEFAULT;
  } catch { return AVAIL_DEFAULT; }
}
export function Therapist() {
  const { t, lang, setOverlay, go, toast, user } = useApp();
  const [attested, setAttested] = useState(() => { try { return localStorage.getItem('ifs.attested') === '1'; } catch { return false; } });
  const [avail, setAvail] = useState(loadAvail);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [appointmentBusy, setAppointmentBusy] = useState('');
  const [appointmentError, setAppointmentError] = useState('');
  const dayL = t('availDays').split(',');
  const dayOf = (a, i) => a.days[i] ?? { on: false, from: '09:00', to: '18:00' };
  const toggleDay = (i) => setAvail((a) => ({ days: { ...a.days, [i]: { ...dayOf(a, i), on: !dayOf(a, i).on } } }));
  const setDayTime = (i, f, v) => setAvail((a) => ({ days: { ...a.days, [i]: { ...dayOf(a, i), [f]: v } } }));

  useEffect(() => {
    if (!user?.linked || !user.uid) return undefined;
    let active = true;
    setAvailabilityLoading(true);
    getTherapistProfile(user.uid)
      .then((remote) => {
        if (!active || !remote) return;
        const days = {};
        for (let i = 0; i < 7; i += 1) {
          const window = remote.availability.find((item) => item.days.includes(i + 1));
          days[i] = window
            ? { on: true, from: window.start, to: window.end }
            : { on: false, from: '09:00', to: '18:00' };
        }
        setAvail({ days });
      })
      .catch((err) => {
        console.error('Therapist availability load failed', err);
        if (active) setAvailabilityError(t('therapistLoadFailed'));
      })
      .finally(() => { if (active) setAvailabilityLoading(false); });
    return () => { active = false; };
  }, [user?.uid, user?.linked, t]);

  const refreshAppointments = async () => {
    if (!user?.linked || !user.uid) return;
    try {
      const items = await therapistAppointments(user.uid);
      await ensureTherapistBusySlots(user.uid, items);
      setAppointments(items);
      setAppointmentError('');
    } catch (err) {
      console.error('Therapist appointments load failed', err);
      setAppointmentError(t('therapistLoadFailed'));
    }
  };

  useEffect(() => {
    if (!attested || !user?.linked) return undefined;
    let active = true;
    therapistAppointments(user.uid)
      .then(async (items) => {
        await ensureTherapistBusySlots(user.uid, items);
        if (active) { setAppointments(items); setAppointmentError(''); }
      })
      .catch((err) => {
        console.error('Therapist appointments load failed', err);
        if (active) setAppointmentError(t('therapistLoadFailed'));
      });
    return () => { active = false; };
  }, [attested, user?.uid, user?.linked, t]);

  const decideAppointment = async (appointmentId, status) => {
    setAppointmentBusy(appointmentId);
    setAppointmentError('');
    try {
      await setAppointmentStatus(appointmentId, status);
      await refreshAppointments();
      toast('✓ ' + t(status === 'approved' ? 'appointmentApproved' : 'appointmentDeclined'));
    } catch (err) {
      console.error('Appointment status update failed', err);
      setAppointmentError(t('therapistSaveFailed'));
    } finally {
      setAppointmentBusy('');
    }
  };

  const saveAvail = async () => {
    if (!user?.linked || !user.uid || !user.email) {
      setAvailabilityError(t('therapistLoginRequired'));
      return;
    }
    const enabled = Object.entries(avail.days).filter(([, value]) => value.on);
    if (enabled.some(([, value]) => !value.from || !value.to || value.to <= value.from)) {
      setAvailabilityError(t('therapistInvalidHours'));
      return;
    }
    setAvailabilitySaving(true);
    setAvailabilityError('');
    try {
      await syncPublicProfile(user);
      const windows = enabled.map(([index, value]) => ({
        days: [Number(index) + 1], start: value.from, end: value.to, minutes: 60,
      }));
      await saveTherapistAvailability(user.uid, windows, user.email);
      try { localStorage.setItem('ifs.avail', JSON.stringify(avail)); } catch { /* */ }
      toast('✓ ' + t('save'));
    } catch (err) {
      console.error('Therapist availability save failed', err);
      setAvailabilityError(t('therapistSaveFailed'));
    } finally {
      setAvailabilitySaving(false);
    }
  };

  return (
    <div className="overlay">
      {ovHead('🧑‍⚕️ ' + t('therapist'), () => setOverlay(null))}
      <div className="ov-body">
        {!attested ? (
          <div className="card mt8" style={{ borderColor: 'var(--accent)' }}>
            <div className="kicker" style={{ color: 'var(--accent-text)' }}>🪪 {t('attest')}</div>
            <p className="sub mt8">
              {tr('attestB1', lang)}
            </p>
            <button className="btn primary block mt16" onClick={() => {
              try { localStorage.setItem('ifs.attested', '1'); } catch { /* */ }
              setAttested(true); toast('✓ ' + t('attest'));
            }}>{t('attest')}</button>
            <button className="btn ghost block mt12" onClick={() => go('specialist-client-view')}>→ {t('myClients')}</button>
            <button className="btn block mt12" onClick={() => setOverlay('booking')}>📅 {t('bookSession')}</button>
          </div>
        ) : (
          <div>
            <div className="row" style={{ gap: 8 }}>
              <span className="chip on">✓ {t('attest')}</span>
              <button className="chip" onClick={() => go('specialist-client-view')}>⊞ {t('myClients')}</button>
            </div>

            {!user?.linked && (
              <div className="card flat mt12">
                <p className="sub">{t('therapistLoginRequired')}</p>
                <button className="btn primary block mt12" onClick={() => setOverlay('login')}>🔐 {t('loginT')}</button>
              </div>
            )}

            {/* availability control, persisted in Firestore for client booking */}
            <div className="card mt16">
              <div className="kicker" style={{ color: 'var(--accent-text)' }}>🗓 {t('availT')}</div>
              <p className="sub mt6" style={{ fontSize: 13 }}>{t('availSub')}</p>
              {availabilityLoading && <p className="faint mt8" role="status">{t('loading')}</p>}
              {availabilityError && <p className="faint mt8" role="alert" style={{ color: 'var(--danger, #b54a4a)', fontSize: 12 }}>{availabilityError}</p>}
              {/* column headers */}
              <div className="row" style={{ gap: 8, marginTop: 12, paddingLeft: 66 }}>
                <span className="kicker" style={{ width: 96, textAlign: 'center', fontSize: 9.5 }}>{t('availFrom')}</span>
                <span style={{ width: 10 }} />
                <span className="kicker" style={{ width: 96, textAlign: 'center', fontSize: 9.5 }}>{t('availTo')}</span>
              </div>
              {dayL.map((d, i) => {
                const day = dayOf(avail, i);
                return (
                  <div key={d} className="row" style={{ gap: 8, marginTop: 8 }}>
                    <button className={`chip ${day.on ? 'on' : ''}`} style={{ flex: '0 0 58px', justifyContent: 'center', fontSize: 12.5 }}
                      onClick={() => toggleDay(i)}>{d}</button>
                    {day.on ? (
                      <>
                        <input className="drop" type="time" value={day.from} style={{ flex: '0 0 96px', minHeight: 38, padding: '0 8px', fontSize: 13 }}
                          onChange={(e) => setDayTime(i, 'from', e.target.value)} aria-label={`${t('availFrom')} ${d}`} />
                        <span style={{ fontWeight: 900, color: 'var(--text-dim)' }}>–</span>
                        <input className="drop" type="time" value={day.to} style={{ flex: '0 0 96px', minHeight: 38, padding: '0 8px', fontSize: 13 }}
                          onChange={(e) => setDayTime(i, 'to', e.target.value)} aria-label={`${t('availTo')} ${d}`} />
                      </>
                    ) : (
                      <span className="faint" style={{ fontSize: 12, fontWeight: 800, alignSelf: 'center' }}>—</span>
                    )}
                  </div>
                );
              })}
              <button className="btn primary block mt14" disabled={availabilitySaving || availabilityLoading || !user?.linked} onClick={saveAvail}>
                {availabilitySaving ? '⏳ …' : t('save')}
              </button>
            </div>

            <div className="card mt16">
              <div className="kicker" style={{ color: 'var(--accent-text)' }}>📅 {t('appointments')}</div>
              {appointmentError && <p className="faint mt8" role="alert" style={{ color: 'var(--danger, #b54a4a)', fontSize: 12 }}>{appointmentError}</p>}
              {!user?.linked ? (
                <p className="sub mt8">{t('therapistLoginRequired')}</p>
              ) : appointments.filter((item) => item.status === 'pending').length === 0 ? (
                <p className="sub mt8">{t('therapistNoAppointments')}</p>
              ) : appointments.filter((item) => item.status === 'pending').map((item) => {
                const when = new Date(`${item.start}:00`);
                const label = Number.isNaN(when.getTime()) ? item.start : when.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={item.id} className="card flat mt10">
                    <b>{item.clientEmail || item.clientUid.slice(0, 10)}</b>
                    <div className="faint mt6" style={{ fontSize: 12 }}>{label}</div>
                    <div className="row mt10" style={{ gap: 8 }}>
                      <button className="btn primary grow" disabled={appointmentBusy === item.id} onClick={() => decideAppointment(item.id, 'approved')}>
                        {appointmentBusy === item.id ? '⏳ …' : t('appointmentApprove')}
                      </button>
                      <button className="btn ghost grow" disabled={appointmentBusy === item.id} onClick={() => decideAppointment(item.id, 'declined')}>
                        {t('appointmentDecline')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="btn block mt16" onClick={() => setOverlay('booking')}>📅 {t('bookSession')}</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ Login sheet ═══════════ */
export function Login({ onClose }) {
  const { t, lang, setUser, toast, user, auth } = useApp();
  const [mode, setMode] = useState('in');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);

  const done = (u) => { setUser(u); toast('✓ ' + t('done')); onClose?.(); };

  return (
    <div className="overlay">
      {ovHead('🔐 ' + t('loginT'), onClose)}
      <div className="ov-body">
        <p className="sub">{user?.linked ? t('linked') : t('anon')}: <b>{(user?.uid ?? '—').slice(0, 12)}</b></p>

        <button className="btn primary block mt16" disabled={busy} onClick={async () => {
          setBusy(true);
          try { done(await auth.signInGoogle()); } catch { toast('⚠ ' + t('loginGoogle')); }
          setBusy(false);
        }}>
          G · {t('loginGoogle')}
        </button>

        <div className="kicker mt24">{t('loginEmail')}</div>
        <div style={{ marginTop: 8 }}>
          <Seg value={mode} onChange={setMode} options={[
            { v: 'in', l: t('signin') },
            { v: 'up', l: tr('sw9', lang) },
          ]} />
        </div>
        <div className="field mt12">
          <div className="field">
            <input value={email} type="email" placeholder="you@ifs.map"
              onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <input value={pass} type="password" placeholder="••••••••"
              onChange={(e) => setPass(e.target.value)} />
          </div>
        </div>
        <button className="btn block" disabled={busy || !email.includes('@') || pass.length < 6} onClick={async () => {
          setBusy(true);
          try { done(await auth.signInEmail(email, mode, pass)); } catch (e) { toast('⚠ ' + (e?.message || 'email')); }
          setBusy(false);
        }}>
          → {t('continue')}
        </button>

        <button className="btn ghost block mt16" onClick={onClose}>{t('loginSkip')}</button>
        <p className="faint mt12" style={{ fontSize: 11.5, fontWeight: 700 }}>
          {t('dataPrivacy')} · {t('version')}
        </p>
      </div>
    </div>
  );
}

/* ═══════════ Map gate ═══════════ */
export function MapGate() {
  const { t, lang, setOverlay, go, setUniReady } = useApp();
  return (
    <div className="overlay center">
      <div className="card" style={{ textAlign: 'center', borderColor: 'var(--accent)' }}>
        <div style={{ fontSize: 44 }} className="animate-float">🗺</div>
        <div className="h2 mt12">{t('mapGateT')}</div>
        <p className="sub mt8">{t('mapGateB')}</p>
        <button className="btn primary block mt16" onClick={() => {
          try { store.save('ifs.mapgate.done', true); } catch { /* */ }
          setOverlay(null);
          go('universe');
        }}>
          🌌 {t('exploreRaw')}
        </button>
        <button className="btn ghost block mt12" onClick={() => { setOverlay(null); }}>
          {tr('sw10', lang)}
        </button>
      </div>
    </div>
  );
}

/* ═══════════ Paywall (Stripe-hosted checkout) ═══════════ */
export function Paywall() {
  const { t, billing, setPremiumOn, premium, toast, setOverlay, user } = useApp();
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(premium);

  useEffect(() => setOk(premium), [premium]);

  const pay = async () => {
    setBusy(true);
    try {
      await billing.checkout('subscription', user?.email ?? undefined);
      // Checkout navigates to Stripe. Do not mark the account premium here;
      // the return route verifies the session with the Worker first.
    } catch (error) {
      toast('⚠ ' + (error?.message || t('checkout')));
      setBusy(false);
    }
  };

  return (
    <div className="overlay">
      {ovHead('💎 ' + t('pwT'), () => setOverlay(null),
        premium ? <span className="chip on" style={{ marginRight: 8, fontSize: 11 }}>✓ {t('premiumOn')}</span> : null)}
      <div className="ov-body">
        <p className="sub">{t('pwSub')}</p>

        {!ok && (
          <div className="card flat mt16">
            <div className="kicker">{t('subscribe')}</div>
            <p className="sub mt8">{t('stripeTerms')}</p>
            <button className="btn primary block mt16" disabled={busy} onClick={pay}>
              {busy ? <span>⏳ …</span> : <>↗ {t('secureCheckout')}</>}
            </button>
          </div>
        )}

        {ok && (
          <div className="card mt16 center" style={{ borderColor: '#3EE0B0', position: 'relative' }}>
            <Confetti show />
            <div className="animate-pop" style={{ fontSize: 44 }}>💎</div>
            <div className="h2 mt8">{t('verified')}</div>
            <p className="sub">{t('premiumOn')} · {t('manage')}</p>
          </div>
        )}

        <button className="btn block mt16" onClick={async () => {
          const r = await billing.restore();
          setPremiumOn(r); setOk(r);
          toast(r ? '✓ ' + t('verified') : '— ' + t('restorePurchase'));
        }}>
          ↺ {t('restorePurchase')}
        </button>
        <p className="faint mt12" style={{ fontSize: 11, fontWeight: 700 }}>
          {t('dataPrivacy')} · Stripe checkout · {t('version')}
        </p>
      </div>
    </div>
  );
}

/* ═══════════ Universe renderer failure ═══════════ */
export function UniverseFail() {
  const { t, lang, setOverlay, go, retryUniverse } = useApp();
  return (
    <div className="overlay center">
      <div className="card" style={{ textAlign: 'center', borderColor: '#FF3B4E' }}>
        <div style={{ fontSize: 44 }}>🛰</div>
        <div className="h2 mt12">{t('uniFailT')}</div>
        <p className="sub mt8">{t('uniFailB')}</p>
        <button className="btn primary block mt16" onClick={() => { setOverlay(null); retryUniverse?.(); }}>
          ⟳ {t('tryAgain')}
        </button>
        <button className="btn ghost block mt12" onClick={() => { setOverlay(null); go('intro'); }}>{t('back')}</button>
      </div>
    </div>
  );
}


/* ═══════════ Journal — trailheads (item 2) ═══════════ */
export function Journal() {
  const { t, lang, setOverlay, toast } = useApp();
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ifs.journal') ?? '[]'); } catch { return []; }
  });
  const KINDS = ['jTrigger', 'jSensation', 'jThought', 'jPattern'];
  const KIND_ICON = { jTrigger: '⚡', jSensation: '🫀', jThought: '💭', jPattern: '🔁' };
  const [kind, setKind] = useState('jTrigger');
  const [what, setWhat] = useState('');
  const [where, setWhere] = useState('');
  const [part, setPart] = useState('');
  const [note, setNote] = useState('');

  const persist = (next) => {
    setEntries(next);
    try { localStorage.setItem('ifs.journal', JSON.stringify(next)); } catch { /* */ }
  };
  const save = () => {
    if (!what.trim()) { toast('⚠ ' + t('jWhat')); return; }
    const e = { id: Date.now(), at: Date.now(), kind, what: what.trim(), where: where.trim(), part: part.trim(), note: note.trim() };
    persist([e, ...entries]);
    setWhat(''); setWhere(''); setPart(''); setNote('');
    try { import('./pal/sfx.ts').then((m) => m.sfx.pop()).catch(() => {}); } catch { /* */ }
    toast('✓ ' + t('save'));
  };
  const del = (id) => persist(entries.filter((x) => x.id !== id));

  return (
    <div className="overlay">
      {ovHead('📔 ' + t('journalT'), () => setOverlay(null))}
      <div className="ov-body">
        <p className="sub">{t('journalSub')}</p>

        {/* IFS how-to */}
        <div className="card flat mt12">
          <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('journalHow')}</div>
          <ol style={{ margin: '10px 0 0', paddingLeft: 20, display: 'grid', gap: 7 }}>
            {['jStep1', 'jStep2', 'jStep3', 'jStep4'].map((k, i) => (
              <li key={k} style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-dim)' }}>
                <b style={{ color: 'var(--text)' }}>{i + 1}.</b> {t(k)}
              </li>
            ))}
          </ol>
          <div className="faint mt10" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.05em' }}>{t('jSources')}</div>
        </div>

        {/* new trailhead */}
        <div className="kicker mt16">{t('jTypes')}</div>
        <div className="row mt8" style={{ gap: 6, flexWrap: 'wrap' }}>
          {KINDS.map((k) => (
            <button key={k} className={`chip ${kind === k ? 'on' : ''}`} style={{ fontSize: 12 }}
              onClick={() => setKind(k)}>{KIND_ICON[k]} {t(k)}</button>
          ))}
        </div>

        <div className="field mt12"><label>{t('jWhat')}</label>
          <textarea rows={2} value={what} onChange={(e) => setWhat(e.target.value)}
            placeholder={tr('sw14', lang)} />
        </div>
        <div className="field mt8"><label>{t('jWhere')}</label>
          <input value={where} onChange={(e) => setWhere(e.target.value)}
            placeholder={tr('sw15', lang)} />
        </div>
        <div className="field mt8"><label>{t('jPart')}</label>
          <input value={part} onChange={(e) => setPart(e.target.value)}
            placeholder={tr('sw16', lang)} />
        </div>
        <div className="field mt8"><label>{t('jNote')}</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button className="btn primary block mt12" onClick={save}>✎ {t('jSave')}</button>

        {/* saved trailheads */}
        <div className="kicker mt24">{t('journalT')} · {entries.length}</div>
        {entries.length === 0 && <p className="sub mt8">{t('jEmpty')}</p>}
        {entries.map((e) => (
          <div key={e.id} className="card flat mt10" style={{ padding: 13 }}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div className="grow">
                <div className="kicker" style={{ color: 'var(--accent-text)', fontSize: 10 }}>
                  {KIND_ICON[e.kind] ?? '✎'} {t(e.kind)} · {new Date(e.at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: '2-digit', month: 'short' })}
                </div>
                <div style={{ fontWeight: 800, fontSize: 14, marginTop: 5, lineHeight: 1.4 }}>{e.what}</div>
                {e.where && <div className="faint" style={{ fontSize: 12.5, fontWeight: 700, marginTop: 3 }}>🫀 {e.where}</div>}
                {e.part && <div className="faint" style={{ fontSize: 12.5, fontWeight: 700, marginTop: 2 }}>✨ {e.part}</div>}
                {e.note && <div className="faint" style={{ fontSize: 12.5, fontWeight: 700, marginTop: 2 }}>✎ {e.note}</div>}
              </div>
              <button className="ibtn" style={{ width: 32, height: 32, fontSize: 14 }} aria-label={t('delete')}
                onClick={() => del(e.id)}>🗑</button>
            </div>
          </div>
        ))}
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

/* ═══════════ Share — beautiful parts map to socials (item: social ≠ code) ═══════════ */
function drawPartsMap(profile, lang) {
  const W = 1080, H = 1080;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  // deep starry backdrop
  const g = c.createRadialGradient(W * 0.3, H * 0.2, 60, W * 0.5, H * 0.55, W * 0.85);
  g.addColorStop(0, '#1b1832'); g.addColorStop(0.55, '#0e0d18'); g.addColorStop(1, '#08080d');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 140; i++) {
    c.fillStyle = `rgba(255,255,255,${0.06 + Math.random() * 0.35})`;
    const r = Math.random() * 1.7;
    c.beginPath(); c.arc(Math.random() * W, Math.random() * H, r, 0, 7); c.fill();
  }
  const parts = (profile.parts ?? []).slice(0, 10);
  const headline = lang === 'ru' && profile.headlineRu ? profile.headlineRu : profile.headlineConstellation;

  const wrap = (text, maxW, font) => {
    c.font = font;
    const words = String(text ?? '').split(' ');
    const lines = []; let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  };

  // title
  c.textAlign = 'center';
  c.fillStyle = '#FFD000';
  c.font = '800 34px system-ui, -apple-system, sans-serif';
  c.fillText(tr('mapKicker', lang), W / 2, 96);
  const tl = wrap(headline, 860, '900 58px system-ui, -apple-system, sans-serif');
  c.fillStyle = '#f4efe6';
  tl.slice(0, 3).forEach((ln, i) => c.fillText(ln, W / 2, 168 + i * 68));

  // constellation
  const cx = W / 2, cy = 600, R = parts.length <= 5 ? 240 : 300;
  const pos = parts.map((p, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(parts.length, 1);
    return { p, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  });
  // links: chain + chords
  c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 3;
  for (let i = 0; i < pos.length; i++) {
    const a = pos[i], b = pos[(i + 1) % pos.length];
    if (pos.length > 2) { c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
    if (i % 3 === 0 && pos.length > 3) { c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(cx, cy); c.stroke(); }
  }
  // center Self
  c.beginPath(); c.arc(cx, cy, 34, 0, 7);
  c.fillStyle = '#F3EEE4'; c.shadowColor = '#F3EEE4'; c.shadowBlur = 26; c.fill(); c.shadowBlur = 0;
  c.fillStyle = '#16161c'; c.font = '800 22px system-ui, sans-serif';
  c.fillText(tr('mapSelf', lang), cx, cy + 8);
  // nodes
  pos.forEach(({ p, x, y }) => {
    const col = familyColor(p.family);
    c.beginPath(); c.arc(x, y, 46, 0, 7);
    c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 30; c.fill(); c.shadowBlur = 0;
    c.lineWidth = 5; c.strokeStyle = 'rgba(255,255,255,.85)'; c.stroke();
    // name below
    c.fillStyle = '#f4efe6';
    c.font = '800 26px system-ui, -apple-system, sans-serif';
    const nm = wrap(p.name, 210, c.font)[0] ?? '';
    c.fillText(nm, x, y + 78);
    c.fillStyle = col;
    c.font = '700 19px system-ui, sans-serif';
    c.fillText((FAMILY_LABELS[p.family]?.[lang] ?? p.family).toUpperCase(), x, y + 108);
  });
  // footer
  c.fillStyle = 'rgba(244,239,230,.55)';
  c.font = '700 24px system-ui, sans-serif';
  c.fillText('parts cartographer · ifs map', W / 2, H - 56);
  return cv;
}

function therapistShareSummary(profile) {
  const toScore = (value) => Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100);
  const parts = Object.fromEntries((profile.parts ?? []).map((part) => {
    const score = toScore(part.energy);
    return [part.id, { T: score, tier: score >= 70 ? 'dominant' : score >= 45 ? 'active' : 'quiet' }];
  }));
  const coping = Array.isArray(profile.copingStack) ? profile.copingStack.slice(0, 4) : [];
  const radar = Object.values(profile.selfEnergyRadar ?? {});
  const selfEnergy = radar.length ? toScore(radar.reduce((sum, value) => sum + (Number(value) || 0), 0) / radar.length) : 0;
  return {
    headline: String(profile.headlineConstellation ?? '').slice(0, 160),
    burden: toScore(profile.burden),
    selfEnergy,
    parts,
    activeComplexes: (profile.complexes ?? []).slice(0, 50).map((id) => ({ id: String(id), activation: 1, tier: 'active' })),
    copingStack: {
      l1: String(coping[0] ?? 'none'),
      ...(coping[1] ? { l2: String(coping[1]) } : {}),
      ...(coping[2] ? { l3: String(coping[2]) } : {}),
      floor: String(coping[3] ?? 'self'),
    },
    adherence: { done: 0, skipped: 0 },
  };
}

export function Share() {
  const { t, lang, profile, user, setOverlay, toast } = useApp();
  const [img, setImg] = useState('');
  const [shareConfirmed, setShareConfirmed] = useState(false);
  const [therapistCode, setTherapistCode] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState('');
  const headline = profile
    ? (lang === 'ru' && profile.headlineRu ? profile.headlineRu : profile.headlineConstellation)
    : '';
  const text = profile ? `${headline} — ${tr('appName', lang)}` : tr('appName', lang);

  useEffect(() => {
    if (!profile) return undefined;
    let url = '';
    try {
      const cv = drawPartsMap(profile, lang);
      url = cv.toDataURL('image/png');
      setImg(url);
    } catch { /* canvas unsupported */ }
    return () => { if (url) try { /* dataURL, nothing to revoke */ } catch { /* */ } };
  }, [profile, lang]);

  const shareNow = async () => {
    if (!profile) { toast(t('shareHint')); return; }
    try {
      const cv = drawPartsMap(profile, lang);
      const blob = await new Promise((res) => cv.toBlob(res, 'image/png'));
      const file = new File([blob], 'parts-map.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text, title: tr('appName', lang) });
        return;
      }
      if (navigator.share) { await navigator.share({ text, title: tr('appName', lang) }); return; }
    } catch (e) { if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) return; }
    // desktop fallback: save image + copy text
    try {
      const a = document.createElement('a');
      a.href = img; a.download = 'parts-map.png'; a.click();
      await navigator.clipboard?.writeText(text);
      toast('⬇📋 ' + t('copied'));
    } catch { toast('⚠'); }
  };

  const createShareCode = async () => {
    if (!profile || !user?.linked || !user.uid || !shareConfirmed || linkBusy) return;
    setLinkBusy(true);
    setLinkError('');
    try {
      const code = await createTherapistLink(user.uid, therapistShareSummary(profile));
      setTherapistCode(code);
    } catch (err) {
      console.error('Therapist sharing code creation failed', err);
      setLinkError(t('therapistShareFailed'));
    } finally {
      setLinkBusy(false);
    }
  };

  return (
    <div className="overlay">
      {ovHead('📤 ' + t('shareT'), () => setOverlay(null))}
      <div className="ov-body">
        <p className="sub">{t('shareSub')}</p>
        {img ? (
          <div className="card mt12" style={{ padding: 8, background: 'transparent', border: '1.5px solid var(--line-strong)' }}>
            <img src={img} alt="parts map" style={{ width: '100%', display: 'block', borderRadius: 14 }} />
          </div>
        ) : (
          <div className="card mt12 center">
            <p className="sub">{t('shareHint')}</p>
          </div>
        )}
        <button className="btn primary block mt16" onClick={shareNow}>↗ {t('shareSocial')}</button>
        <div className="card flat mt16">
          <div className="kicker" style={{ color: 'var(--accent-text)' }}>🧑‍⚕️ {t('therapistShareTitle')}</div>
          <p className="sub mt8" style={{ fontSize: 12.5 }}>{t('therapistShareConsent')}</p>
          {!user?.linked ? (
            <button className="btn block mt12" onClick={() => setOverlay('login')}>🔐 {t('loginT')}</button>
          ) : (
            <>
              <label className="row mt12" style={{ alignItems: 'flex-start', gap: 9, fontSize: 12, fontWeight: 800 }}>
                <input type="checkbox" checked={shareConfirmed} onChange={(e) => setShareConfirmed(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1 }} />
                <span>{t('therapistShareAgree')}</span>
              </label>
              <button className="btn block mt12" disabled={!profile || !shareConfirmed || linkBusy} onClick={createShareCode}>
                {linkBusy ? '⏳ …' : t('therapistShareCreate')}
              </button>
              {linkError && <p className="faint mt8" role="alert" style={{ color: 'var(--danger, #b54a4a)', fontSize: 12 }}>{linkError}</p>}
              {therapistCode && (
                <div className="card mt12" style={{ borderColor: 'var(--accent)' }}>
                  <div className="kicker">{t('therapistShareCode')}</div>
                  <div className="row mt8" style={{ gap: 8 }}>
                    <code className="grow" style={{ fontSize: 18, fontWeight: 900, letterSpacing: '.16em', overflowWrap: 'anywhere' }}>{therapistCode}</code>
                    <button className="btn small" onClick={() => { navigator.clipboard?.writeText(therapistCode); toast('📋 ' + t('copied')); }}>{t('copy')}</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <p className="faint mt12" style={{ fontSize: 12, fontWeight: 800, textAlign: 'center' }}>
          {t('shareNote')}
        </p>
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
