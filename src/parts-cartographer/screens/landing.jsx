import React, { useEffect, useState } from 'react';
import { membersPhrase } from '../i18n/strings.ts';
import { useApp } from '../app.jsx';
import { Character } from '../pal/Character.tsx';
import { randomTraits, SEED_PARTS, FAMILY_LABELS } from '../pal/traits.ts';
import { Ico, Crest, familyColor, Steps, Price } from '../ui/ui.jsx';
import { uid8 } from '../core/ports.ts';
import { homeScreen, SLOW_BOOT_AFTER_MS } from '../core/boot.ts';
import { store, KEYS } from '../core/local-store';
import { exportBackup } from '../core/backup';
import { auth } from '../core/auth.service.ts';
import { downloadText } from '../core/file-download';
import { isExamplePart, isSampleProfile, primaryRoutes, secondaryRoutes } from '../core/assessment-routes.ts';
import { requestFocus } from '../core/focus-request.ts';

/* ═══════════ loading (shown only while local content is not yet ready; no timed wait) ═══════════ */
export function Loading() {
  const { t, go, setOverlay } = useApp();
  const [step, setStep] = useState(0);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    // Copy rotates for ambience only. The work has no measured total, so there is no percentage.
    const sv = setInterval(() => setStep((s) => (s + 1) % 3), 1350);
    const slowAt = setTimeout(() => setSlow(true), SLOW_BOOT_AFTER_MS);
    return () => { clearInterval(sv); clearTimeout(slowAt); };
  }, []);
  const label = ['boot1', 'boot2', 'boot3'][step];
  const continueLocal = () => {
    setOverlay(null);
    go(homeScreen(store.load(KEYS.onboarded, false)));
  };
  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
      <div style={{ width: 250, textAlign: 'center' }}>
        <div style={{ width: 130, margin: '0 auto' }} className="animate-float">
          <Character traits={(SEED_PARTS.find((x) => x.id === 'seed-self') ?? SEED_PARTS[0]).traits} lite showShadow={false} />
        </div>
        <div className="brand-mark mt12">PARTS<span className="dot-y">.</span></div>
        <div className="faint" style={{ fontFamily: 'var(--font-round)', fontSize: 12.5, letterSpacing: '.2em', textTransform: 'uppercase', marginTop: 4 }}>
          {t('appName')}
        </div>
        <div className="bar indeterminate mt24" style={{ margin: '24px auto 0' }} role="progressbar" aria-label={t(label)} aria-busy="true"><i /></div>
        <div className="boot-dots mt16"><i /><i /><i /></div>
        <div className="muted" style={{ marginTop: 14, fontWeight: 800, fontSize: 13.5 }}>{t(label)}</div>
        {slow && (
          <div role="status" style={{ marginTop: 18 }}>
            <div className="muted" style={{ fontSize: 14 }}>{t('bootSlowB')}</div>
            <button className="btn primary block mt12" onClick={() => window.location.reload()}>⟳ {t('tryAgain')}</button>
            <button className="btn ghost block mt8" onClick={continueLocal}>{t('bootHome')}</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ onboarding (new users) ═══════════ */
export function Onboarding() {
  const { t, go, setDockTab } = useApp();
  const [i, setI] = useState(0);
  const slides = [
    { t: t('ob1t'), b: t('ob1b'), traits: SEED_PARTS[0].traits, bg: '#3B9BFF' },
    { t: t('ob2t'), b: t('ob2b'), traits: SEED_PARTS[8].traits, bg: '#FF2D8A' },
    { t: t('ob3t'), b: t('ob3b'), traits: SEED_PARTS[12].traits, bg: '#3EE0B0' },
  ];
  const s = slides[i];
  // Every exit, including Skip, lands on the Base tab where all three routes are offered side by side.
  const finish = () => {
    store.save(KEYS.onboarded, true);
    setDockTab('base');
    go('intro');
  };
  return (
    <div className="screen">
      <div className="scroll no-dock" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="row" style={{ paddingTop: 4 }}>
          <div className="grow"><Steps total={3} at={i} /></div>
          <button className="ghost" style={{ fontWeight: 900, color: 'var(--text-faint)', fontSize: 14 }} onClick={finish}>{t('skip')}</button>
        </div>

        <div style={{
          margin: '26px 0 8px', borderRadius: 34, height: 300, position: 'relative', overflow: 'hidden',
          background: `radial-gradient(120% 130% at 50% 0%, ${s.bg}55, var(--surface) 70%)`,
          border: '1.5px solid var(--line)',
          display: 'grid', placeItems: 'center',
        }}>
          <div className="blob" style={{ width: 220, height: 220, background: s.bg, top: -60, right: -50 }} />
          <div style={{ width: 165, position: 'relative' }} className="animate-idle" key={i}>
            <Character traits={s.traits} lite />
          </div>
          <div style={{ position: 'absolute', bottom: 14, left: 18, fontFamily: 'var(--font-display)', fontSize: 13, color: '#16161c', background: '#FFD000', padding: '6px 12px', borderRadius: 999, boxShadow: '0 4px 0 #8a6d00' }}>
            {t(['obK1', 'obK2', 'obK3'][i])}
          </div>
        </div>

        <h1 className="h1" style={{ fontSize: 30 }}>{s.t}</h1>
        <p className="sub mt12" style={{ fontSize: 16 }}>{s.b}</p>

        <div className="grow" style={{ minHeight: 20 }} />
        <button className="btn primary block" style={{ minHeight: 56, fontSize: 17 }} onClick={() => (i < 2 ? setI(i + 1) : finish())}>
          {i < 2 ? t('next') : t('chooseTitle')} →
        </button>
        {i < 2 && <button className="btn ghost block mt12" onClick={finish}>{t('skip')}</button>}
      </div>
    </div>
  );
}

/* ═══════════ intro — Landing with 4-tab dock ═══════════ */
export function Intro() {
  const { dockTab } = useApp();
  return (
    <div className="screen">
      {dockTab === 'base' && <BaseTab />}
      {dockTab === 'sky' && <SkyTab />}
      {dockTab === 'you' && <YouTab />}
    </div>
  );
}

function PageHead({ kicker, title, right }) {
  return (
    <div className="row" style={{ paddingTop: 8, marginBottom: 6 }}>
      <div className="grow">
        <div className="kicker">{kicker}</div>
        <h1 className="h1" style={{ fontSize: 27 }}>{title}</h1>
      </div>
      {right}
    </div>
  );
}

/* ── Base ── */
function BaseTab() {
  const { t, go, setOverlay, setSheet, profile, parts, premium, theme, setTheme, lang, setLang, user, setUser, toast } = useApp();
  const recent = parts.slice(0, 6);
  const sample = isSampleProfile(profile);
  // Assessment entries live in RouteChooser and support in SupportSection; this grid is everyday tools.
  const actions = [
    { k: 'report', ico: '📖', label: t('report'), on: () => go(profile ? 'assessment-results' : 'assessment-gate') },
    { k: 'checkin', ico: '🫀', label: t('checkin'), on: () => setOverlay('checkin') },
    { k: 'practice', ico: '🎯', label: t('practice'), on: () => setOverlay('practice') },
    { k: 'synastry', ico: '💞', label: t('synastry'), on: () => setOverlay('synastry') },
    { k: 'universe', ico: '🌌', label: t('universe'), on: () => go('universe') },
    { k: 'cabinet', ico: '🗄️', label: t('cabinet'), on: () => go('cabinet') },
  ];
  // Signing out returns this device to a fresh guest account, as a first start does. Local data stays on the device.
  const signOutNow = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Sign-out failed', error);
      toast(t('signOutFailed'));
      return;
    }
    setUser(null);
    toast('✓ ' + t('signedOut'));
    setUser(await auth.anonymousBootstrap());
  };
  const menu = [
    { ico: '💎', label: premium ? t('premiumOn') : t('subscribe'), sub: premium ? t('manage') : t('pwSub'), on: () => setOverlay('paywall') },
    { ico: '📲', label: t('install'), sub: t('installB'), on: () => setOverlay('install') },
    { ico: '📤', label: t('restore'), sub: t('exportAll'), on: () => setOverlay('restore') },
    { ico: '🧑‍⚕️', label: t('therapist'), sub: t('appointments'), on: () => setOverlay('therapist') },
    { ico: '🌗', label: t('theme'), sub: theme === 'dark' ? t('dark') : t('light'), on: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
    { ico: '🌐', label: t('language'), sub: lang === 'en' ? 'English' : 'Русский', on: () => setLang(lang === 'en' ? 'ru' : 'en') },
    { ico: '🔐', label: user?.linked ? t('signOut') : t('signin'), sub: user?.email ?? t('anon') + ' · ' + (user?.uid ?? '').slice(0, 10), on: () => (user?.linked ? signOutNow() : setOverlay('login')) },
  ];

  return (
    <div className="scroll">
      <PageHead
        kicker={new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        title={<>{t('homeA')} <em>{t('homeB')}</em></>}
        right={<div className="chip">{premium ? '💎 Plus' : t('free')}</div>}
      />

      {/* hero: a saved result only. A sample is labelled as a sample, never as the user's constellation. */}
      {profile && (
        <div className="card grad-dark" style={{ overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #1d1a2e, #322d4d)', padding: 20 }}>
          <div className="blob" style={{ width: 180, height: 180, background: '#8B6CFF', top: -70, left: -40 }} />
          <div className="row" style={{ position: 'relative' }}>
            <div className="grow">
              <div className="kicker" style={{ color: 'var(--accent-text)' }}>{sample ? t('sampleBadge') : t('resultsTitle')}</div>
              <div className="h2" style={{ marginTop: 6, fontSize: 20 }}>
                {sample ? t('sampleHeroLine') : (lang === 'ru' && profile.headlineRu ? profile.headlineRu : profile.headlineConstellation)}
              </div>
              <button className="btn primary mt12" style={{ minHeight: 46 }} onClick={() => go('assessment-results')}>
                {t('report')} →
              </button>
            </div>
            <div style={{ width: 92, flex: '0 0 92px' }} className="animate-idle">
              <Character traits={SEED_PARTS[12].traits} lite showShadow={false} />
            </div>
          </div>
        </div>
      )}

      <RouteChooser />
      <SupportSection />

      {/* quick actions */}
      <div className="section-title">{t('base')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {actions.map((a) => (
          <button key={a.k} className="opt" style={{ padding: 13 }} onClick={a.on}>
            <span className="opt-k" style={{ background: 'var(--surface2)', fontSize: 18 }}>{a.ico}</span>
            <span className="grow" style={{ fontSize: 14.5 }}>{a.label}{a.lock && <span className="lock" style={{ marginLeft: 6 }}>🔒</span>}</span>
          </button>
        ))}
      </div>

      {/* parts peek */}
      <div className="section-title">
        <span>{t('cabinet')}</span>
        <button style={{ color: 'var(--accent-text)', fontSize: 13, fontWeight: 900 }} onClick={() => go('cabinet')}>→</button>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
        {recent.map((p) => {
          // Example cast entries carry invented energy and wording; they show no energy bar and are labelled.
          const example = isExamplePart(p);
          return (
            <button key={p.id} className="card flat press" style={{ flex: '0 0 108px', padding: 10, textAlign: 'center' }}
              onClick={() => setSheet({ type: 'part', id: p.id })}>
              <div style={{ height: 64, display: 'grid', placeItems: 'center' }}>
                <div style={{ width: 58 }}><Character traits={p.traits} lite showShadow={false} /></div>
              </div>
              <div style={{ fontFamily: 'var(--font-round)', fontWeight: 600, fontSize: 13, marginTop: 4 }}>{p.name}</div>
              {example
                ? <span className="chip" style={{ fontSize: 10.5, marginTop: 6 }}>{t('examplePart')}</span>
                : <div style={{ height: 5, borderRadius: 3, background: 'var(--surface2)', marginTop: 7, overflow: 'hidden' }}>
                  <i style={{ display: 'block', height: '100%', width: `${p.energy}%`, background: familyColor(p.family) }} />
                </div>}
            </button>
          );
        })}
      </div>

      {/* system menu */}
      <div className="section-title">{t('settings')}</div>
      <div className="card flat" style={{ padding: '4px 16px' }}>
        {menu.map((m, i) => (
          <button key={i} className="menu-item" style={i === menu.length - 1 ? { borderBottom: 'none' } : undefined} onClick={m.on}>
            <span className="mi-ico">{m.ico}</span>
            <span className="grow">{m.label}<span className="mi-sub">{m.sub}</span></span>
            <span className="mi-go">›</span>
          </button>
        ))}
      </div>
      <div className="center faint" style={{ fontSize: 12, fontWeight: 800, marginTop: 16 }}>{STR_VER(t)}</div>
    </div>
  );
}

const STR_VER = (t) => t('footVer');

/* ── Assessment entries: three honest routes, then limited tools ── */
const ROUTE_ICON = { 'situation-inquiry': '✎', 'reflection-64': '🧭', 'battery-147': '🗺️', 'quick-map-sample': '✦', 'quick-scan-teaser': '⚡' };

function openRoute(route, { go, setOverlay }) {
  if (!route.available || !route.destination) return;
  if (route.destination.focus) requestFocus(route.destination.focus);
  if (route.destination.kind === 'state') go(route.destination.state);
  else setOverlay(route.destination.overlay);
}

function RouteChooser() {
  const { t, go, setOverlay } = useApp();
  const renderRoute = (route) => {
    const copy = route.copy;
    // aria-disabled keeps an unavailable route focusable so its reason is announced, but it cannot open.
    return (
      <button key={route.id} className="opt" aria-disabled={route.available ? undefined : 'true'}
        style={{ marginTop: 10, opacity: route.available ? 1 : 0.72 }}
        onClick={() => openRoute(route, { go, setOverlay })}>
        <span className="opt-k" aria-hidden="true">{ROUTE_ICON[route.id]}</span>
        <span className="grow" style={{ display: 'grid', gap: 3 }}>
          <span style={{ fontWeight: 900, fontSize: 15 }}>{t(copy.title)}</span>
          <span className="mi-sub">{t(copy.purpose)}</span>
          <span className="faint" style={{ fontSize: 12, fontWeight: 800 }}>{t(copy.effort)} · {t(copy.tag)}</span>
          {!route.available && route.unavailableNote && <span className="faint" style={{ fontSize: 12, fontWeight: 800 }}>{t(route.unavailableNote)}</span>}
        </span>
      </button>
    );
  };
  return (
    <section aria-labelledby="route-chooser-title" className="mt16">
      <div className="section-title" id="route-chooser-title">{t('chooseTitle')}</div>
      <p className="sub mt8">{t('chooseSub')}</p>
      {primaryRoutes().map(renderRoute)}
      <div className="section-title mt24" id="other-tools-title">{t('otherToolsTitle')}</div>
      <p className="faint mt8" style={{ fontSize: 12.5, fontWeight: 800 }}>{t('otherToolsSub')}</p>
      {secondaryRoutes().map(renderRoute)}
    </section>
  );
}

/* Support never depends on an assessment: booking and coaching are reachable from a fresh install. */
function SupportSection() {
  const { t, premium, setOverlay } = useApp();
  return (
    <section aria-labelledby="support-title" className="mt24">
      <div className="section-title" id="support-title">{t('supportTitle')}</div>
      <p className="sub mt8">{t('supportSub')}</p>
      <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
        <button className="opt" onClick={() => setOverlay('booking')}>
          <span className="opt-k" aria-hidden="true">📅</span>
          <span className="grow">
            <span style={{ fontWeight: 900, fontSize: 15, display: 'block' }}>{t('bookSession')}</span>
            <span className="mi-sub" style={{ display: 'block' }}>{t('bookSub')}</span>
          </span>
        </button>
        <button className="opt" onClick={() => setOverlay(premium ? 'coach' : 'paywall')}>
          <span className="opt-k" aria-hidden="true">✨</span>
          <span className="grow" style={{ fontWeight: 900, fontSize: 15 }}>
            {t('coach')}{!premium && <span className="lock" style={{ marginLeft: 6 }}>🔒</span>}
          </span>
        </button>
      </div>
      <p className="faint mt12" style={{ fontSize: 12.5, fontWeight: 800 }}>{t('supportEmergency')}</p>
    </section>
  );
}

/* ── Sky ── */
function SkyTab() {
  const { t, openSky, profile, go, setOverlay, lang, parts } = useApp();
  return (
    <div className="scroll">
      <PageHead kicker={t('skyKick')} title={<>{t('nightA')} <em>{t('nightB')}</em></>} />
      <div className="card" style={{ position: 'relative', overflow: 'hidden', textAlign: 'center', padding: 26 }}>
        <div className="blob" style={{ width: 240, height: 240, background: '#3B9BFF', top: -90, right: -70 }} />
        <div className="blob" style={{ width: 200, height: 200, background: '#FF2D8A', bottom: -80, left: -60 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 54 }} className="animate-drift">🌌</div>
          <div className="h2 mt8">{t('innerTitle')}</div>
          <p className="sub mt8">{t('search')} · {t('filters')} · {t('archetype')} · {t('compare')}</p>
          <button className="btn primary block mt16" style={{ minHeight: 54 }} onMouseEnter={() => {}} onClick={openSky}>
            {t('mapGateT')} →
          </button>
          <button className="btn ghost block mt12" onClick={() => go('universe')}>
            {t('seeUniverse')} (3D)
          </button>
          {!profile && <p className="faint mt12" style={{ fontSize: 12.5, fontWeight: 800 }}>{t('mapGateB')}</p>}
        </div>
      </div>
      <div className="section-title">{FAMILY_LABELS.manager[lang]} · {FAMILY_LABELS.exile[lang]} · …</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {['manager', 'firefighter', 'exile', 'resource'].map((f) => (
          <div key={f} className="card flat row" style={{ padding: 14 }}>
            <Crest family={f} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 14 }}>{FAMILY_LABELS[f][lang]}</div>
              <div className="faint" style={{ fontSize: 11.5, fontWeight: 800 }}>
                {membersPhrase(parts.filter((p) => p.family === f).length, lang)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* CodeTab removed — my-code + partner paste + JSON upload now live in the Synastry overlay */

/* ── You ── */
function YouTab() {
  const { t, lang, setLang, theme, setTheme, sensory, sensoryStored, applySensoryPreset, updateSensory, premium, setOverlay, user, go, toast, telemetry } = useApp();
  const [showData, setShowData] = useState(false);
  return (
    <div className="scroll">
      <PageHead kicker={t('you')} title={<>{t('setA')} <em>{t('setB')}</em></>} />

      <div className="card row">
        <div style={{ width: 64, flex: '0 0 64px' }} className="animate-idle">
          <Character traits={SEED_PARTS[12].traits} lite showShadow={false} />
        </div>
        <div className="grow">
          <div style={{ fontWeight: 900, fontSize: 17 }}>{user?.email ?? t('anon')}</div>
          <div className="faint" style={{ fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-round)' }}>uid: {user?.uid}</div>
        </div>
        <button className="btn small" onClick={() => setOverlay('login')}>{user?.linked ? t('manage') : t('signin')}</button>
      </div>

      <div className="section-title">{t('subscribe')}</div>
      <button className="plan press" style={{ width: '100%' }} onClick={() => setOverlay('paywall')}>
        {premium && <span className="p-tag" style={{ background: '#3EE0B0', color: '#08321f', boxShadow: '0 3px 0 #1d9d78' }}>{t('activeTag')}</span>}
        <span style={{ fontSize: 26 }}>{premium ? '💎' : '🔒'}</span>
        <span className="grow">
          <b style={{ fontFamily: 'var(--font-round)', fontSize: 16 }}>{premium ? t('premiumOn') : t('pwT')}</b>
          <span className="mi-sub" style={{ display: 'block', fontSize: 12.5, color: 'var(--text-faint)', fontWeight: 700, marginTop: 2 }}>{t('pwSub')}</span>
        </span>
        <span className="mi-go" style={{ fontSize: 22 }}>›</span>
      </button>

      <div className="section-title">{t('settings')}</div>
      <div className="card">
        <div className="row mb12">
          <span className="grow" style={{ fontWeight: 900 }}>{t('language')}</span>
          <div style={{ width: 190 }}>
            <div className="seg">
              <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
              <button className={lang === 'ru' ? 'on' : ''} onClick={() => setLang('ru')}>RU</button>
            </div>
          </div>
        </div>
        <div className="row">
          <span className="grow" style={{ fontWeight: 900 }}>{t('theme')}</span>
          <div style={{ width: 190 }}>
            <div className="seg">
              <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>🌙 {t('dark')}</button>
              <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>☀️ {t('light')}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="section-title">{t('sensorySettings')}</div>
      <p className="sub sensory-intro">{t('sensoryIntro')}</p>
      {!sensoryStored && (
        <p className="sub sensory-intro" role="status">
          {lang === 'ru'
            ? 'Этот браузер не может сохранить настройки. Они действуют только в этой сессии.'
            : 'This browser cannot save these settings. They apply for this session only.'}
        </p>
      )}
      <div className="card sensory-card">
        <div className="sensory-label mb8">{t('sensoryPresets')}</div>
        <div role="group" aria-label={t('sensoryPresets')} className="seg sensory-segment">
          {['still', 'gentle', 'lively'].map((preset) => (
            <button key={preset} type="button" className={sensory.preset === preset ? 'on' : ''}
              aria-pressed={sensory.preset === preset} onClick={() => applySensoryPreset(preset)}>
              {t(`sensory${preset[0].toUpperCase()}${preset.slice(1)}`)}
            </button>
          ))}
        </div>

        <div className="sensory-label mt16 mb8">{t('sensoryControls')}</div>
        <div className="sensory-setting">
          <span className="sensory-label">{t('sensoryMotion')}</span>
          <div role="group" aria-label={t('sensoryMotion')} className="seg sensory-segment">
            {['still', 'gentle', 'lively'].map((mode) => (
              <button key={mode} type="button" className={sensory.motion === mode ? 'on' : ''}
                aria-pressed={sensory.motion === mode} onClick={() => updateSensory('motion', mode)}>
                {t(`sensory${mode[0].toUpperCase()}${mode.slice(1)}`)}
              </button>
            ))}
          </div>
        </div>
        <label className="sensory-toggle">
          <span>{t('sensorySound')}</span>
          <input type="checkbox" checked={sensory.sound} onChange={(event) => updateSensory('sound', event.target.checked)} />
        </label>
        <label className="sensory-toggle">
          <span>{t('sensoryTexture')}</span>
          <input type="checkbox" checked={sensory.texture} onChange={(event) => updateSensory('texture', event.target.checked)} />
        </label>
        <div className="sensory-setting">
          <span className="sensory-label">{t('sensoryDensity')}</span>
          <div role="group" aria-label={t('sensoryDensity')} className="seg sensory-segment">
            {['open', 'compact'].map((density) => (
              <button key={density} type="button" className={sensory.density === density ? 'on' : ''}
                aria-pressed={sensory.density === density} onClick={() => updateSensory('density', density)}>
                {t(`sensory${density[0].toUpperCase()}${density.slice(1)}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section-title">{t('dataPrivacy')}</div>
      <div className="card flat" style={{ padding: '4px 16px' }}>
        <button className="menu-item" onClick={() => setOverlay('install')}>
          <span className="mi-ico">📲</span><span className="grow">{t('install')}</span><span className="mi-go">›</span>
        </button>
        <button className="menu-item" onClick={() => { downloadBackup(); toast('⬇ ' + t('backupK')); }}>
          <span className="mi-ico">💾</span><span className="grow">{t('exportAll')}</span><span className="mi-go">›</span>
        </button>
        <button className="menu-item" onClick={() => setShowData(!showData)}>
          <span className="mi-ico">📊</span><span className="grow">{t('telemetry')}<span className="mi-sub">{t('telemSubK').replace('{n}', telemetry.count())}</span></span><span className="mi-go">{showData ? '−' : '+'}</span>
        </button>
        {showData && (
          <pre style={{ fontSize: 10.5, color: 'var(--text-dim)', overflow: 'auto', maxHeight: 140, padding: '8px 0 12px' }}>
            {JSON.stringify(telemetry.dump(), null, 1)}
          </pre>
        )}
        <button className="menu-item" style={{ borderBottom: 'none' }} onClick={() => { setOverlay('therapist'); }}>
          <span className="mi-ico">🧑‍⚕️</span><span className="grow">{t('therapist')}</span><span className="mi-go">›</span>
        </button>
      </div>

      <div className="section-title">{t('specialistSec')}</div>
      <button className="btn ghost block" onClick={() => go('specialist-client-view')}>
        {t('specialistCode')} →
      </button>

      <div className="center faint" style={{ fontSize: 12, fontWeight: 800, marginTop: 18 }}>{STR_VER(t)}</div>
    </div>
  );
}

export function downloadBackup() {
  downloadText(JSON.stringify(exportBackup(), null, 2), `parts-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
}
