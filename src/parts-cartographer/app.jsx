import React, { createContext, lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from './ui/ui.jsx';
import { ModalLayer } from './ui/modal-layer.jsx';
import { store, KEYS } from './core/local-store';
import { auth } from './core/auth.service.ts';
import { AI, ResilientAiAdapter } from './core/ai.adapter.ts';
import { billing } from './core/billing.service.ts';
import { telemetry } from './core/telemetry.ts';
import { loadSensoryPreferences, saveSensoryPreferences, selectSensoryPreset, updateSensoryPreference } from './core/sensory-preferences.ts';
import { ambience, bindAmbienceSignals } from './services/ambience-gate.ts';
import { SEED_PARTS } from './pal/traits.ts';
import { t as translate, STRINGS } from './i18n/strings.ts';
import { Loading, Onboarding, Intro, downloadBackup } from './screens/landing.jsx';
import { Cabinet } from './screens/cabinet.jsx';
const AdminDashboard = lazy(() => import('./screens/admin.jsx').then((module) => ({ default: module.AdminDashboard })));
import { Assessment, Gate, Descent, Results } from './screens/assessment.jsx';
const FullAssessment = lazy(() => import('./screens/full-assessment.jsx').then((module) => ({ default: module.FullAssessment })));
const Legacy64Assessment = lazy(() => import('./screens/legacy-assessment.jsx').then((module) => ({ default: module.Legacy64Assessment })));
const Practice = lazy(() => import('./screens/practice.jsx').then((module) => ({ default: module.Practice })));
const CheckIn = lazy(() => import('./screens/check-in.jsx').then((module) => ({ default: module.CheckIn })));
const QuickScan = lazy(() => import('./screens/quick-scan.jsx').then((module) => ({ default: module.QuickScan })));
const BackupRestore = lazy(() => import('./screens/backup-restore.jsx').then((module) => ({ default: module.BackupRestore })));
import { Innerverse, SpecialistView } from './screens/innerverse.jsx';
import { Coach, Help, InstallPrompt, SynastryOv, Therapist, Login, MapGate, Paywall, UniverseFail, Journal, Share, Booking } from './overlays.jsx';
import { PartSheet, PartEditor, Chemistry, CharterSheet } from './screens/cabinet.jsx';
import { RouteBoundary, RouteFrame } from './ui/route-boundary.jsx';
import { resolveBootRoute, withoutDeepLink } from './core/boot.ts';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

/* Clears only the deep-link parameter; called once the requested screen has rendered. */
function settleDeepLink() {
  try {
    const current = `${location.pathname}${location.search}${location.hash}`;
    const next = withoutDeepLink(current);
    if (next !== current) history.replaceState(history.state, '', next);
  } catch { /* URL cleanup is best-effort */ }
}

async function restoreCanonicalProfile(lang) {
  if (store.load(KEYS.profile, null)) return null;
  const input = store.load('INNERVERSE_PROFILE_V1', null);
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  try {
    const [scoring, taxonomy, adapter] = await Promise.all([
      import('../app/core/data/scoring-v2'),
      import('../app/core/data/parts'),
      import('./core/clinical-profile-adapter.ts'),
    ]);
    const { RESOURCES, SHADOW_PARTS } = taxonomy;
    const validAnswers = (values, count) => Array.isArray(values) && values.length === count
      && values.every((value) => Number.isInteger(value) && value >= 1 && value <= 5);
    if (!input.shadow || !input.resources || !validAnswers(input.self, 8)
      || !validAnswers(input.shadow?.[SHADOW_PARTS[0]], 8)
      || !validAnswers(input.resources?.[RESOURCES[0]], 6)
      || !Number.isInteger(input.validity?.attention) || input.validity.attention < 1 || input.validity.attention > 5
      || !validAnswers(input.validity?.infrequency, 2)) return null;
    if (!SHADOW_PARTS.every((id) => validAnswers(input.shadow[id], 8))
      || !RESOURCES.every((id) => validAnswers(input.resources[id], 6))) return null;
    return adapter.adaptClinicalProfile(scoring.scoreProfile(input), lang);
  } catch {
    return null;
  }
}

export default function App() {
  /* ── cross-cutting state ── */
  const [lang, setLang] = useState(() => store.load('ifs.lang', 'ru'));
  const [theme, setTheme] = useState(() => store.load('ifs.theme', 'light'));
  const [sensory, setSensory] = useState(() => loadSensoryPreferences());
  const [sensoryStored, setSensoryStored] = useState(true); // false when the browser refused to save the last choice
  const [state, setState] = useState('loading'); // the @switch
  const [dockTab, setDockTab] = useState('base');
  const [user, setUser] = useState(() => auth.currentUser());
  const [premium, setPremium] = useState(() => billing.isPremium());
  const [parts, setPartsRaw] = useState(() => {
    const saved = store.load(KEYS.parts, null);
    return Array.isArray(saved) ? saved : SEED_PARTS;
  });
  const [profile, setProfileRaw] = useState(() => store.load(KEYS.profile, null));
  const [overlay, setOverlay] = useState(null); // string | {kind, ...payload}
  const [sheet, setSheet] = useState(null);      // {type, ...}
  const [toastMsg, setToastMsg] = useState(null);
  const [uniError, setUniError] = useState(false);
  const [deferredInstall, setDeferredInstall] = useState(null);
  const uniRef = useRef(null); // UniverseAPI once inited
  const [uniReady, setUniReady] = useState(false);
  const [uniHovered, setUniHovered] = useState(false);

  useEffect(() => () => {
    uniRef.current?.dispose();
    uniRef.current = null;
  }, []);
  useEffect(() => {
    const message = (event) => toast([event.detail?.title, event.detail?.body].filter(Boolean).join(' · '));
    window.addEventListener('ifs:push-message', message);
    return () => window.removeEventListener('ifs:push-message', message);
  }, []);
  /* keep <html lang> + theme in sync (RU font fallback, no theme flash) */
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  // Restore is an explicit local action. Refresh mounted state immediately;
  // it must not require a reload or trigger a cloud upload.
  useEffect(() => {
    const refresh = () => {
      setPartsRaw(store.load(KEYS.parts, SEED_PARTS));
      setProfileRaw(store.load(KEYS.profile, null));
      setLang(store.load('ifs.lang', 'ru'));
      setTheme(store.load('ifs.theme', 'light'));
      setState('intro');
      setSheet(null);
      setOverlay(null);
    };
    window.addEventListener('ifs:local-restored', refresh);
    return () => window.removeEventListener('ifs:local-restored', refresh);
  }, []);
  useEffect(() => {
    if (profile?.testModel !== 'angular-v2' || !profile.clinical) return;
    let active = true;
    import('./core/clinical-profile-adapter.ts').then(({ adaptClinicalProfile }) => {
      if (!active) return;
      const rebuilt = adaptClinicalProfile(profile.clinical, lang);
      const translated = { ...rebuilt.profile, createdAt: profile.createdAt };
      setProfileRaw(translated);
      store.save(KEYS.profile, translated);
      setPartsRaw((current) => {
        const byId = new Map(rebuilt.parts.map((part) => [part.id, part]));
        const next = current.map((part) => {
          const canonical = byId.get(part.id);
          if (!canonical) return part;
          const autoName = !part.name || [part.nameEn, part.nameRu, canonical.nameEn, canonical.nameRu].includes(part.name);
          return { ...part, name: autoName ? canonical.name : part.name, nameEn: canonical.nameEn, nameRu: canonical.nameRu,
            archetype: { ...canonical.archetype, ...part.archetype } };
        });
        store.save(KEYS.parts, next);
        return next;
      });
    });
    return () => { active = false; };
  }, [lang, profile?.createdAt, profile?.testModel]);
  useEffect(() => {
    if (profile) return undefined;
    let active = true;
    restoreCanonicalProfile(lang).then((restoredClinical) => {
      if (!active || !restoredClinical) return;
      setPartsRaw((current) => {
        const scoredIds = new Set(restoredClinical.parts.map((part) => part.id));
        const preserved = current.filter((part) => !scoredIds.has(part.id) && !String(part.id).startsWith('seed-'));
        const next = [...restoredClinical.parts, ...preserved];
        store.save(KEYS.parts, next);
        return next;
      });
      setProfileRaw(restoredClinical.profile);
      store.save(KEYS.profile, restoredClinical.profile);
    });
    return () => { active = false; };
  }, [lang, profile]);
  useEffect(() => {
    let active = true;
    setPremium(billing.isPremium());
    billing.restore().then((verified) => { if (active) setPremium(verified); });
    return () => { active = false; };
  }, [user?.uid]);
  /* debug/introspection hook for smoke probes */
  useEffect(() => { window.__APP_STATE = state; }, [state]);

  const t = useCallback((k) => (STRINGS[k] ? translate(k, lang) : k), [lang]);
  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toast._t);
    toast._t = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const setParts = useCallback((next) => { setPartsRaw(next); store.save(KEYS.parts, next); }, []);
  const setProfile = useCallback((next) => {
    setProfileRaw(next);
    if (next) { store.save(KEYS.profile, next); store.archive(KEYS.history, next); }
    else store.remove(KEYS.profile);
  }, []);
  // Presentation choices only: they never touch parts, profile, scores, or assessment drafts.
  // A refused save keeps the choice active for this session and is reported by the settings screen.
  const commitSensory = useCallback((next) => {
    setSensory(next);
    setSensoryStored(saveSensoryPreferences(next));
  }, []);
  const applySensoryPreset = useCallback((preset) => commitSensory(selectSensoryPreset(preset)), [commitSensory]);
  const updateSensory = useCallback((key, value) => commitSensory(updateSensoryPreference(sensory, key, value)), [commitSensory, sensory]);
  useEffect(() => { import('./pal/sfx.ts').then((module) => module.setSfxEnabled(sensory.sound)); }, [sensory.sound]);
  useEffect(() => { uniRef.current?.setMotionMode(sensory.motion); }, [sensory.motion]);

  /* ── ambience: rests while hidden, while text is typed, or while an error is shown ── */
  useEffect(() => bindAmbienceSignals(document), []);
  useEffect(() => {
    const root = document.documentElement;
    const sync = (active) => { root.dataset.ambience = active ? 'on' : 'paused'; };
    sync(ambience.active);
    return ambience.subscribe(sync);
  }, []);
  useEffect(() => { ambience.set('error', uniError || overlay === 'universe-fail'); }, [uniError, overlay]);

  const go = useCallback((next) => {
    setState(next);
    telemetry.record('state', next);
    // leaving universe only sleeps it (instant re-entry)
    if (next !== 'universe' && uniRef.current) uniRef.current.sleep();
  }, []);

  /* ── boot: local-first. The route comes from the URL and local onboarding state in the
     same tick the shell mounts; there is no timed wait. Cloud/auth connects in the background
     and never gates navigation, including offline. The deep link stays in the URL until its
     screen has rendered, so a failed route chunk can still be retried. ── */
  const [bootRoute] = useState(() => resolveBootRoute(location.search, Boolean(store.load(KEYS.onboarded, false))));
  const authStarted = useRef(false);
  useEffect(() => {
    setState(bootRoute.screen);
    if (bootRoute.overlay) setOverlay(bootRoute.overlay);
    if (authStarted.current) return;
    authStarted.current = true;
    auth.anonymousBootstrap().then((u) => setUser(u));
  }, [bootRoute]);

  /* ── PWA install prompt (auto-opens once/week after 9s on intro) ── */
  useEffect(() => {
    const onBip = (e) => { e.preventDefault(); setDeferredInstall(e); };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);
  /* PWA install nudge: once, 30s after reaching the app; never for returning/installed users */
  useEffect(() => {
    if (state !== 'intro') return undefined;
    const iv = setTimeout(() => {
      try {
        const done = localStorage.getItem('ifs.install.nudge') === '1';
        const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
        if (done || standalone) return;
        localStorage.setItem('ifs.install.nudge', '1');
        setOverlay((o) => o ?? 'install');
      } catch { /* */ }
    }, 30000);
    return () => clearTimeout(iv);
  }, [state]);

  const [universeMode, setUniverseMode] = useState('parts');

  /* ── map gate on first Sky entry without a test ── */
  const openSky = useCallback(() => {
    if (!profile && !store.load('ifs.mapgate.done', false)) { setOverlay('mapgate'); return; }
    go('universe');
  }, [profile, go]);

  /* ── context value ── */
  const ctx = useMemo(() => ({
    lang, setLang: (l) => { setLang(l); store.save('ifs.lang', l); },
    theme, setTheme: (v) => { setTheme(v); store.save('ifs.theme', v); },
    sensory, sensoryStored, applySensoryPreset, updateSensory,
    t, state, go, dockTab, setDockTab,
    user, setUser, premium, setPremiumOn: (v) => { setPremium(v); },
    parts, setParts, profile, setProfile,
    overlay, setOverlay, sheet, setSheet, toast,
    downloadBackup,
    billing, AI, telemetry, auth,
    uniRef, uniReady, setUniReady, uniError, setUniError,
    deferredInstall,
    openPaywall: () => setOverlay('paywall'),
    openSheet: setSheet,
    openSky,
    universeMode, setUniverseMode,
    retryUniverse: () => { setUniError(false); enterUniverse(); },
  }), [lang, theme, t, state, go, dockTab, user, premium, parts, setParts, profile, setProfile, overlay, sheet, toast, uniReady, uniError, deferredInstall, universeMode, sensory, sensoryStored, applySensoryPreset, updateSensory]);

  /* ── universe host: outside the switch; renderer chunk on first entry ── */
  const enterUniverse = useCallback(async (isActive = () => true) => {
    try {
      const host = document.getElementById('universe-host');
      if (!host) throw new Error('no host');
      const mod = await import('./services/universe-scene.ts');
      if (!isActive() || !host.isConnected) return;
      if (!uniRef.current) uniRef.current = mod.initUniverse(host, theme === 'dark', sensory.motion);
      uniRef.current.setMotionMode(sensory.motion);
      uniRef.current.setParts(parts);
      uniRef.current.onPick((id) => setSheet({ type: 'part', id }));
      uniRef.current.wake();
      uniRef.current.resize();
      setUniReady(true);
      setUniError(false);
      if (!store.load(KEYS.helpSeen, false)) { setOverlay('help'); store.save(KEYS.helpSeen, true); }
    } catch (e) {
      if (!isActive()) return;
      console.error(e);
      setUniError(true);
      setOverlay('universe-fail');
    }
  }, [parts, sensory.motion, theme]);

  useEffect(() => {
    let active = true;
    if (state === 'universe') enterUniverse(() => active);
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // prefetch renderer chunk on hover of Sky tab
  const prefetchUni = useCallback(() => {
    if (uniHovered) return;
    setUniHovered(true);
    import('./services/universe-scene.ts').catch(() => {});
  }, [uniHovered]);

  /* ── sealed verdict resurfacing (JITAI) ── */
  useEffect(() => {
    const sealed = store.load('ifs.sealed', []);
    const due = sealed.filter((s) => s.until <= Date.now());
    if (due.length) {
      const next = sealed.filter((s) => s.until > Date.now());
      store.save('ifs.sealed', next);
      setTimeout(() => toast(`⏳ ${due[0].text}`), 1500);
    }
  }, [toast]);

  /* ── THE @switch ── */
  const screen = (() => {
    switch (state) {
      case 'loading': return <Loading />;
      case 'onboarding': return <Onboarding />;
      case 'intro': return <Intro />;
      case 'cabinet': return <Cabinet />;
      case 'assessment': return <Assessment />; // retained eight-part quick map
      case 'full-assessment': return <FullAssessment />; // lazy: suspended by RouteFrame
      case 'legacy-assessment': return <Legacy64Assessment />; // lazy: suspended by RouteFrame
      case 'assessment-gate': return <Gate />;
      case 'descent': return <Descent />;
      case 'assessment-results': return <Results />;
      case 'innerverse': return <Innerverse />; // alias of universe
      case 'universe': return <Innerverse />;
      case 'specialist-client-view': return <SpecialistView />;
      default: return <Loading />;
    }
  })();

  /* ── overlays (everything layered on top) ── */
  const ov = (() => {
    const kind = typeof overlay === 'string' ? overlay : overlay?.kind;
    const payload = typeof overlay === 'string' ? null : overlay;
    switch (kind) {
      case 'coach': return <Coach />;
      case 'help': return <Help />;
      case 'install': return <InstallPrompt deferred={deferredInstall} onClose={() => setOverlay(null)} />;
      case 'synastry': return <SynastryOv />;
      case 'practice': return <Suspense fallback={<Loading />}><Practice /></Suspense>;
      case 'checkin': return <Suspense fallback={<Loading />}><CheckIn /></Suspense>;
      case 'restore': return <Suspense fallback={<Loading />}><BackupRestore /></Suspense>;
      case 'quickscan': return <Suspense fallback={<Loading />}><QuickScan /></Suspense>;
      case 'therapist': return <Therapist />;
      case 'journal': return <Journal />;
      case 'share': return <Share />;
      case 'booking': return <Booking />;
      case 'admin': return <Suspense fallback={<Loading />}><AdminDashboard /></Suspense>;
      case 'login': return <Login onClose={() => setOverlay(null)} />;
      case 'mapgate': return <MapGate />;
      case 'paywall': return <Paywall reason={payload?.reason} />;
      case 'universe-fail': return <UniverseFail />;
      default: return null;
    }
  })();

  const sheetEl = (() => {
    if (!sheet) return null;
    switch (sheet.type) {
      case 'part': return <PartSheet id={sheet.id} />;
      case 'editor': return <PartEditor part={sheet.part} />;
      case 'chemistry': return <Chemistry from={sheet.from} />;
      case 'charter': return <CharterSheet />;
      default: return null;
    }
  })();

  const showDock = state === 'intro';

  return (
    <AppCtx.Provider value={ctx}>
      <div className="stage">
        <div className="stage-caption">Innerverse · your inner system</div>
        <div className="phone grain" data-theme={theme} data-motion={sensory.motion}
          data-texture={sensory.texture ? 'rich' : 'quiet'} data-density={sensory.density}>
          <StatusBar />

          {/* three.js canvas — OUTSIDE the switch */}
          <div id="universe-host" className={`universe-host ${state === 'universe' ? 'on' : ''}`} />

          <div className="app-content" inert={overlay || sheet ? '' : undefined}>
            <RouteFrame resetKey={state} fallback={<Loading />} onCommit={state === 'loading' ? undefined : settleDeepLink}>
              {screen}
            </RouteFrame>
            {showDock && <Dock onSkyHover={prefetchUni} />}
          </div>

          {toastMsg && <div className="toast" role="status">{toastMsg}</div>}

          {sheetEl && <ModalLayer label={t('parts')} onClose={() => setSheet(null)}>{sheetEl}</ModalLayer>}
          {ov && <ModalLayer key={`${user?.uid ?? 'guest'}:${typeof overlay === 'string' ? overlay : overlay?.kind}`} label={t(typeof overlay === 'string' ? overlay : overlay?.kind)} onClose={() => setOverlay(null)}><RouteBoundary resetKey={typeof overlay === 'string' ? overlay : overlay?.kind}>{ov}</RouteBoundary></ModalLayer>}
        </div>
      </div>
    </AppCtx.Provider>
  );
}

/* ── dock: Base / Sky / Code× / You + center FAB (start test) ── */
function Dock({ onSkyHover }) {
  const { t, dockTab, setDockTab, go, setOverlay, profile, premium, openSheet } = useApp();
  const tabs = [
    { id: 'base', ico: 'base', label: t('base') },
    { id: 'sky', ico: 'sky', label: t('sky') },
    null, // FAB slot → Journal
    { id: 'coach', ico: 'coach', label: t('coach') },
    { id: 'you', ico: 'you', label: t('you') },
  ];
  const onTab = (id) => {
    if (id === 'sky') { onSkyHover(); }
    if (id === 'coach') { setOverlay(premium ? 'coach' : 'paywall'); return; } // paywalled tab
    setDockTab(id);
  };
  return (
    <nav className="dock">
      {tabs.map((tab, i) => {
        if (!tab) {
          return (
            <button key="fab" className="dock-fab"
              onClick={() => setOverlay('journal')}
              aria-label={t('journalT')}>
              <svg className="fab-bolt" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd"
                  d="M5.25 4.5A2.25 2.25 0 0 1 7.5 2.25H19a.9.9 0 0 1 .9.9v15.7a.9.9 0 0 1-.9.9H7.5a2.25 2.25 0 0 0-2.25 2.25V4.5Zm4 4.6h7.4v1.7H9.25V9.1Zm0 3.3h7.4v1.7H9.25v-1.7Zm0 3.3h4.9v1.7H9.25v-1.7Z" />
              </svg>
              <span className="fab-label">{t('journalT')}</span>
            </button>
          );
        }
        const Icon = ({ name, size }) => {
          const map = { base: 'M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z', sky: 'M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z', coach: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Zm7 10.5.95 2.55L22.5 17l-2.55.95L19 20.5l-.95-2.55L15.5 17l2.55-.95L19 13.5Z', you: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0' };
          return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={map[name]} /></svg>;
        };
        return (
          <button key={tab.id} className={`dock-tab ${dockTab === tab.id ? 'on' : ''}`} onClick={() => onTab(tab.id)}>
            <span className="d-ico"><Icon name={tab.ico} /></span>
            <span>{tab.label}</span>
            {tab.id === 'coach' && !premium && <span className="d-lock">🔒</span>}
            <span className="d-dot" />
          </button>
        );
      })}
    </nav>
  );
}

/* ── universe chrome (close · navigate · help) ── */
function UniverseChrome() {
  const { t, lang, go, setOverlay, setSheet, parts } = useApp();
  const [hover, setHover] = useState(null);
  useEffect(() => {
    const api = window.__uni;
    return () => {};
  }, []);
  return (
    <div className="universe-chrome" style={{ paddingTop: 50 }}>
      <div className="row" style={{ padding: '6px 16px', gap: 10 }}>
        <button className="ibtn" aria-label={t('close')} onClick={() => go('intro')}>✕</button>
        <div className="grow">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>{t('universe')}</div>
          <div className="faint" style={{ fontSize: 11, fontWeight: 800 }}>{parts.length} {lang === 'ru' ? 'частей на карте · выберите одну' : 'parts on the map · select one'}</div>
        </div>
        <button className="ibtn" aria-label={lang === 'ru' ? 'Помощь' : 'Help'} onClick={() => setOverlay('help')}>?</button>
      </div>
      <div className="grow" />
      <div className="row" style={{ padding: '0 16px 26px', justifyContent: 'center' }}>
        <span className="degraded" style={{ opacity: .9 }}>
          {lang === 'ru' ? '◌ Ваша карта' : '◌ Your map'}
        </span>
      </div>
    </div>
  );
}
