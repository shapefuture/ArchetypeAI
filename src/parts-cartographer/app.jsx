import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from './ui/ui.jsx';
import { store, KEYS } from './core/local-store';
import { auth } from './core/auth.service.ts';
import { AI, ResilientAiAdapter } from './core/ai.adapter.ts';
import { billing } from './core/billing.service.ts';
import { telemetry } from './core/telemetry.ts';
import { SEED_PARTS } from './pal/traits.ts';
import { t as translate, STRINGS } from './i18n/strings.ts';
import { Loading, Onboarding, Intro } from './screens/landing.jsx';
import { Cabinet } from './screens/cabinet.jsx';
import { Assessment, Gate, Descent, Results } from './screens/assessment.jsx';
import { Innerverse, SpecialistView } from './screens/innerverse.jsx';
import { Coach, Help, InstallPrompt, SynastryOv, Practice, CheckIn, QuickScan, Therapist, Login, MapGate, Paywall, UniverseFail, Journal, Share, Booking } from './overlays.jsx';
import { PartSheet, PartEditor, Chemistry, CharterSheet } from './screens/cabinet.jsx';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export default function App() {
  /* ── cross-cutting state ── */
  const [lang, setLang] = useState(() => store.load('ifs.lang', 'ru'));
  const [theme, setTheme] = useState(() => store.load('ifs.theme', 'light'));
  const [state, setState] = useState('loading'); // the @switch
  const [dockTab, setDockTab] = useState('base');
  const [user, setUser] = useState(() => auth.currentUser());
  const [premium, setPremium] = useState(() => billing.isPremium());
  const [parts, setPartsRaw] = useState(() => store.load(KEYS.parts, null) ?? SEED_PARTS);
  const [profile, setProfileRaw] = useState(() => store.load(KEYS.profile, null));
  const [overlay, setOverlay] = useState(null); // string | {kind, ...payload}
  const [sheet, setSheet] = useState(null);      // {type, ...}
  const [toastMsg, setToastMsg] = useState(null);
  const [uniError, setUniError] = useState(false);
  const [deferredInstall, setDeferredInstall] = useState(null);
  const uniRef = useRef(null); // UniverseAPI once inited
  const [uniReady, setUniReady] = useState(false);
  const [uniHovered, setUniHovered] = useState(false);

  /* keep <html lang> + theme in sync (RU font fallback, no theme flash) */
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => {
    let active = true;
    billing.restore().then((verified) => { if (active) setPremium(verified); });
    return () => { active = false; };
  }, []);
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
  }, []);

  const go = useCallback((next) => {
    setState(next);
    telemetry.record('state', next);
    // leaving universe only sleeps it (instant re-entry)
    if (next !== 'universe' && uniRef.current) uniRef.current.sleep();
  }, []);

  /* ── boot: loading → onboarding | intro (auto ~4.2s) ── */
  useEffect(() => {
    const bootAt = setTimeout(async () => {
      const u = await auth.anonymousBootstrap(); // draft: anonymous bootstrap at 4s
      setUser(u);
      const seen = store.load(KEYS.onboarded, false);
      setState(seen ? 'intro' : 'onboarding');
      // PWA shortcut deep-links (?go=assessment | ?go=checkin)
      try {
        const q = new URLSearchParams(location.search).get('go');
        if (q) {
          if (q === 'assessment') setState('assessment');
          else if (q === 'checkin') setOverlay('checkin');
          else if (q === 'universe') setState('universe');
          history.replaceState(null, '', location.pathname);
        }
      } catch { /* */ }
    }, 4200);
    return () => clearTimeout(bootAt);
  }, []);

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
    t, state, go, dockTab, setDockTab,
    user, setUser, premium, setPremiumOn: (v) => { setPremium(v); },
    parts, setParts, profile, setProfile,
    overlay, setOverlay, sheet, setSheet, toast,
    billing, AI, telemetry, auth,
    uniRef, uniReady, setUniReady, uniError, setUniError,
    deferredInstall,
    openPaywall: () => setOverlay('paywall'),
    openSheet: setSheet,
    openSky,
    universeMode, setUniverseMode,
    retryUniverse: () => { setUniError(false); enterUniverse(); },
  }), [lang, theme, t, state, go, dockTab, user, premium, parts, setParts, profile, setProfile, overlay, toast, uniReady, uniError, deferredInstall, universeMode]);

  /* ── universe host: outside the switch; renderer chunk on first entry ── */
  const enterUniverse = useCallback(async () => {
    try {
      const host = document.getElementById('universe-host');
      if (!host) throw new Error('no host');
      const mod = await import('./services/universe-scene.ts');
      if (!uniRef.current) uniRef.current = mod.initUniverse(host, theme === 'dark');
      uniRef.current.setParts(parts);
      uniRef.current.onPick((id) => setSheet({ type: 'part', id }));
      uniRef.current.wake();
      uniRef.current.resize();
      setUniReady(true);
      setUniError(false);
      if (!store.load(KEYS.helpSeen, false)) { setOverlay('help'); store.save(KEYS.helpSeen, true); }
    } catch (e) {
      console.error(e);
      setUniError(true);
      setOverlay('universe-fail');
    }
  }, [parts, theme]);

  useEffect(() => {
    if (state === 'universe') enterUniverse();
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
      case 'assessment': return <Assessment />;
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
      case 'practice': return <Practice />;
      case 'checkin': return <CheckIn />;
      case 'quickscan': return <QuickScan />;
      case 'therapist': return <Therapist />;
      case 'journal': return <Journal />;
      case 'share': return <Share />;
      case 'booking': return <Booking />;
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
        <div className="stage-caption">parts cartographer · IFS map PWA — style after cutebuttons</div>
        <div className={`phone grain`} data-theme={theme}>
          <StatusBar />

          {/* three.js canvas — OUTSIDE the switch */}
          <div id="universe-host" className={`universe-host ${state === 'universe' ? 'on' : ''}`} />

          {screen}

          {showDock && <Dock onSkyHover={prefetchUni} />}

          {toastMsg && <div className="toast">{toastMsg}</div>}

          {sheetEl}
          {ov}
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
  const { t, go, setOverlay, setSheet, parts } = useApp();
  const [hover, setHover] = useState(null);
  useEffect(() => {
    const api = window.__uni;
    return () => {};
  }, []);
  return (
    <div className="universe-chrome" style={{ paddingTop: 50 }}>
      <div className="row" style={{ padding: '6px 16px', gap: 10 }}>
        <button className="ibtn" onClick={() => go('innerverse')}>✕</button>
        <div className="grow">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>{t('universe')}</div>
          <div className="faint" style={{ fontSize: 11, fontWeight: 800 }}>{parts.length} parts in orbit · tap one</div>
        </div>
        <button className="ibtn" onClick={() => setOverlay('help')}>?</button>
      </div>
      <div className="grow" />
      <div className="row" style={{ padding: '0 16px 26px', justifyContent: 'center' }}>
        <span className="degraded" style={{ opacity: .9 }}>
          {ResilientAiAdapter.degradation.degraded ? '◌ degraded narrative' : '◌ live map'}
        </span>
      </div>
    </div>
  );
}
