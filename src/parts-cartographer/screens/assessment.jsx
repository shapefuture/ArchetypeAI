import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useApp } from '../app.jsx';
import { Character } from '../pal/Character.tsx';
import { Crest, familyColor, Radar, Bars, Confetti, Seg, Steps } from '../ui/ui.jsx';
import { FAMILY_LABELS, SEED_PARTS, pid, randomTraits } from '../pal/traits.ts';
import { t as tr, CONSENT_TEXT, LIKERT_TEXTS, PART_COPY, ITEM_TEXTS, SCORING_NAME_POOLS, PART_NAMES } from '../i18n/strings.ts';
import { scoreSystem, profileToCode } from '../core/scoring-v2.ts';
import { clinicalNeedName, clinicalPartName, clinicalPolarizationName } from '../core/clinical-display.ts';
import { COMPLEXES } from '../../app/core/data/parts';
import { store, KEYS } from '../core/local-store';
import { telemetry } from '../core/telemetry.ts';

const FELT = ['low', 'mid', 'high'];
const ClinicalReport = lazy(() => import('./clinical-report.jsx').then((m) => ({ default: m.ClinicalReport })));
export function Results() {
  const { profile, t } = useApp();
  return profile?.testModel === 'angular-v2' && profile.clinical
    ? <Suspense fallback={<p role="status">{t('loading')}</p>}><ClinicalReport /></Suspense>
    : <QuickResults />;
}
const FELT_K = { low: 'feltLow', mid: 'feltMid', high: 'feltHigh' };
const COMPLEX_K = { 'The Proving Ground': 'cxProving', 'First-Wound Complex': 'cxFirstWound', 'Control Complex': 'cxControl', 'Enoughness Complex': 'cxEnough', 'Mild belonging complex': 'cxBelong' };
const COMPLEX_NAME_K = { abandonment: 'complexAbandonment', inferiority: 'complexInferiority', power: 'complexPower', performance: 'complexPerformance', engulfment: 'complexEngulfment', invisibility: 'complexInvisibility', vigilance: 'complexVigilance', unlovability: 'complexUnlovability', betrayal: 'complexBetrayal' };
const COPING_K = { 'over-preparation': 'copPrepare', control: 'copControl', numbing: 'copNumb', urgency: 'copUrgency', withdrawal: 'copWithdraw', 'people-pleasing': 'copPeople', grounding: 'copGround', witnessing: 'copWitness', perseverance: 'copPersev' };
const LEAK_K = { Attention: ['leakAttN', 'leakAttL'], Time: ['leakTimeN', 'leakTimeL'], Sleep: ['leakSleepN', 'leakSleepL'] };
const RESOURCE_BAND_K = { hypo: 'resourceBandHypo', healthy: 'resourceBandHealthy', hyper: 'resourceBandHyper' };
const resourceBandLab = (band, lang) => RESOURCE_BAND_K[band] ? tr(RESOURCE_BAND_K[band], lang) : band;
const polLab = (x, lang) => {
  const id = String(x || '');
  const family = id.toLowerCase();
  if (FAMILY_LABELS[family]) return FAMILY_LABELS[family][lang];
  if (id === 'Protest' || id === 'Shutdown') return tr(id === 'Protest' ? 'polProtest' : 'polShutdown', lang);
  return clinicalPartName(id, lang);
};
const cxLab = (c, lang) => {
  if (COMPLEX_K[c]) return tr(COMPLEX_K[c], lang);
  const definition = COMPLEXES[c];
  return definition ? (lang === 'ru' && COMPLEX_NAME_K[c] ? tr(COMPLEX_NAME_K[c], lang) : definition.name) : c;
};
const copLab = (c, lang) => (COPING_K[c] ? tr(COPING_K[c], lang) : c);
const leakName = (n, lang) => (LEAK_K[n] ? tr(LEAK_K[n][0], lang) : n);
const leakText = (n, raw, lang) => (LEAK_K[n] ? tr(LEAK_K[n][1], lang) : raw);
const subLab = (s, lang) => { const i = SCORING_NAME_POOLS.subtype.en.indexOf(s); return lang === 'ru' && i >= 0 ? SCORING_NAME_POOLS.subtype.ru[i] : s; };
const attLab = (a, lang) => { const i = SCORING_NAME_POOLS.attachment.en.indexOf(a); return lang === 'ru' && i >= 0 ? SCORING_NAME_POOLS.attachment.ru[i] : a; };
function partsWord(n, lang) {
  if (lang !== 'ru') return n === 1 ? 'part' : 'parts';
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'часть';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'части';
  return 'частей';
}

const OC_K = { manager: 'ocManager', firefighter: 'ocFirefighter', exile: 'ocExile', resource: 'ocResource' };
function itemCopy(part, lang) {
  return `${tr(OC_K[part.family] ?? 'ocManager', lang)} — ${part.name}?`;
}

/* random new part per forward-click (spec: no fixed parts during the test) */
const FAM4 = ['manager', 'firefighter', 'exile', 'resource'];
const pickR = (arr) => arr[Math.floor(Math.random() * arr.length)];
function makeRandomPart(lang, name) {
  const family = pickR(FAM4);
  return {
    id: pid(), name, family, traits: randomTraits(family),
    role: tr('roleDesc', lang), blurb: tr('blurbNew', lang),
    energy: 25 + Math.floor(Math.random() * 70),
    burden: '—', need: '—', voice: '—', star: false, since: tr('today', lang),
  };
}

/* ═══════════ Assessment (step machine inside overlay screen) ═══════════ */
export function Assessment() {
  const { t, lang, parts, setParts, setProfile, setOverlay, go, toast, profile } = useApp();
  const draft = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('ifs.assessment.draft') ?? 'null'); } catch { return null; }
  }, []);
  const [step, setStep] = useState(draft?.step ?? 0); // 0 ethics · 1 somatic · 2 statements · 3 scoring
  const [agree, setAgree] = useState(!!draft);
  const [idx, setIdx] = useState(draft?.idx ?? 0);
  const [answers, setAnswers] = useState(draft?.answers ?? {}); // partId → {intensity, felt}
  const [stmts, setStmts] = useState(draft?.stmts ?? [4, 4, 4]);
  const [paused, setPaused] = useState(false);
  const [party, setParty] = useState(false);

  useEffect(() => {
    if (!party) return undefined;
    const iv = setTimeout(() => setParty(false), 3600);
    return () => clearTimeout(iv);
  }, [party]);

  const pool = useMemo(() => {
    if (draft?.pool?.length) return draft.pool; // resume with the exact generated parts
    const names = [...(PART_NAMES[lang] ?? PART_NAMES.en)].sort(() => Math.random() - 0.5);
    return Array.from({ length: 8 }, () => makeRandomPart(lang, names.pop()));
  }, []);

  const current = pool[idx];

  const saveDraft = () => {
    try {
      localStorage.setItem('ifs.assessment.draft', JSON.stringify({
        step, idx, answers, stmts, pool, at: Date.now(),
      }));
    } catch { /* */ }
  };

  const setAns = (partId, patch) =>
    setAnswers((a) => ({ ...a, [partId]: { intensity: 3, felt: 'mid', ...a[partId], ...patch } }));

  const nextPart = () => {
    try { telemetry.record('assessment_item', { partId: current?.id, ...answers[current?.id] }); } catch { /* */ }
    if (idx < pool.length - 1) setIdx(idx + 1);
    else { setStep(2); setParty(true); }
  };

  const finish = () => {
    try { localStorage.removeItem('ifs.assessment.draft'); } catch { /* */ }
    const somatic = {};
    pool.forEach((p) => {
      const a = answers[p.id] ?? { intensity: 3, felt: 'mid' };
      somatic[p.id] = { intensity: a.intensity, felt: a.felt };
    });
    const result = scoreSystem({ somatic, statements: stmts, parts: pool });
    setProfile(result);            // app persists latest + archives history
    setParts(pool);
    try { telemetry.record('result', { c: result.headlineConstellation, v: result.validity }); } catch { /* */ }
    go('assessment-results');
  };

  if (paused) {
    return (
      <div className="screen">
        <div className="overlay">
          <div className="ov-head"><span className="grow kicker">⏸ {t('pauseT')}</span></div>
          <div className="ov-body">
            <div className="center" style={{ paddingTop: 26 }}>
              <div style={{ fontSize: 46 }}>⏸</div>
              <div className="h2 mt12">{t('pauseT')}</div>
              <p className="sub mt8">{t('pauseSub')}</p>
            </div>
            <button className="btn primary block mt24" onClick={() => setPaused(false)}>▶ {t('resume')}</button>
            <button className="btn block mt12" onClick={() => { saveDraft(); toast('✓ ' + t('save')); go('intro'); }}>
              💾 {t('pauseExit')}
            </button>
            <button className="btn ghost block mt12" onClick={() => { setPaused(false); saveDraft(); setStep(0); setIdx(0); setAgree(false); setAnswers({}); setStmts([4, 4, 4]); }}>
              ↻ {t('reset')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── 0 · ethics ── */
  if (step === 0) {
    return (
      <div className="screen">
        <div className="scroll no-dock">
          <div className="row" style={{ paddingTop: 4 }}>
            <button className="ibtn" onClick={() => setPaused(true)}>⏸</button>
            <div className="grow kicker">{t('ethicsTitle')}</div>
            <Steps total={3} at={0} />
          </div>
          <div className="card mt16" style={{ borderColor: 'var(--yolk)' }}>
            <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('consent')}</div>
            <p className="sub mt8" style={{ color: 'var(--text)', fontSize: 14.5, lineHeight: 1.55 }}>
              {CONSENT_TEXT[lang]}
            </p>
            <p className="sub mt12">{t('ethicsBody')}</p>
          </div>
          <button className="toggle mt16" onClick={() => setAgree((a) => !a)}>
            <span style={{ flex: 1, fontWeight: 900, fontSize: 14 }}>{t('consentAck')}</span>
            <i className={agree ? 'on' : ''} />
          </button>
          <button className="btn primary block mt16" disabled={!agree} onClick={() => setStep(1)}>
            {t('assessStart')}
          </button>
        </div>
      </div>
    );
  }

  /* ── 1 · somatic per-part input ── */
  if (step === 1) {
    if (!current) { setStep(2); return null; }
    const a = answers[current.id] ?? { intensity: 3, felt: 'mid' };
    return (
      <div className="screen">
        <div className="scroll no-dock">
          <div className="row" style={{ paddingTop: 4 }}>
            <button className="ibtn" onClick={() => setPaused(true)}>⏸</button>
            <div className="grow kicker">{t('somaticTitle')} · {idx + 1}/{pool.length}</div>
            <Steps total={3} at={1} />
          </div>

          <div className="center mt16" style={{ padding: 6 }}>
            <div style={{ width: 92, margin: '0 auto' }} className="animate-idle">
              <Character traits={current.traits} />
            </div>
            <div className="h2" style={{ fontSize: 21, marginTop: 8 }}>{current.name}</div>
            <span className="chip mt8" style={{ background: familyColor(current.family), color: '#16161c', borderColor: 'transparent' }}>
              {FAMILY_LABELS[current.family].icon} {FAMILY_LABELS[current.family][lang]}
            </span>
          </div>

          <div className="card mt16">
            <p style={{ fontWeight: 800, fontSize: 15.5, lineHeight: 1.45 }}>{itemCopy(current, lang)}</p>
            <div className="kicker mt16">{t('intensity')}</div>
            <div className="row mt8" style={{ gap: 7 }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const on = a.intensity === n;
                return (
                  <button key={n} className="likenum" style={on ? { background: 'var(--yolk)', color: '#16161c', borderColor: '#e6bc00' } : undefined}
                    onClick={() => { setAns(current.id, { intensity: n, felt: n <= 2 ? 'low' : n <= 3 ? 'mid' : 'high' }); try { sfxTick(); } catch { /* */ } }}>
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="row mt6" style={{ justifyContent: 'space-between', fontSize: 10.5, fontWeight: 900, color: 'var(--text-faint)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              <span style={{ flex: '0 1 auto', textAlign: 'left' }}>{LIKERT_TEXTS.l1[lang]}</span>
              <span style={{ marginLeft: 'auto', textAlign: 'right', whiteSpace: 'nowrap' }}>{LIKERT_TEXTS.l7[lang]}</span>
            </div>
          </div>

          {/* Back left of Continue (item 10) */}
          <div className="row mt16" style={{ gap: 10 }}>
            <button className="btn grow" onClick={() => (idx > 0 ? setIdx(idx - 1) : setStep(0))}>‹ {t('back')}</button>
            <button className="btn primary grow" onClick={nextPart}>
              {idx < pool.length - 1 ? '→ ' + t('continue') : '✨ ' + t('futureTitle')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── 2 · three future-self statements ── */
  if (step === 2) {
    return (
      <div className="screen" style={{ position: 'relative' }}>
        {party && <Confetti show />}
        <div className="scroll no-dock">
          <div className="row" style={{ paddingTop: 4 }}>
            <button className="ibtn" onClick={() => setPaused(true)}>⏸</button>
            <div className="grow kicker">{t('futureTitle')}</div>
            <Steps total={3} at={2} />
          </div>
          <p className="sub mt8">{t('futureSub')} — {t('futureHint')}</p>

          {['stmt1', 'stmt2', 'stmt3'].map((k, i) => (
            <div key={k} className="card mt12">
              <p style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.45 }}>{t(k)}</p>
              <div className="row mt12" style={{ gap: 7 }}>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => {
                  const on = stmts[i] === n;
                  return (
                    <button key={n} className="likenum" style={on ? { background: 'var(--accent)', color: '#16161c', borderColor: '#e6bc00' } : undefined}
                      onClick={() => { const nx = [...stmts]; nx[i] = n; setStmts(nx); }}>
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="row mt24" style={{ gap: 10 }}>
            <button className="btn grow" onClick={() => setStep(1)}>‹ {t('back')}</button>
            <button className="btn primary grow" onClick={() => { setStep(3); setParty(true); }}>✨ {t('scoring')}</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── 3 · scoring moment ── */
  return (
    <div className="screen" style={{ position: 'relative' }}>
      {party && <Confetti show />}
      <div className="scroll no-dock center" style={{ paddingTop: 90 }}>
        <div className="animate-spin" style={{ fontSize: 44, display: 'inline-block' }}>✦</div>
        <div className="h2 mt16">{t('scoring')}</div>
        <p className="sub">{t('loading')}</p>
        <button className="btn primary block mt24" onClick={finish}>→ {t('resultsTitle')}</button>
      </div>
    </div>
  );
}

function sfxTick() { import('../pal/sfx.ts').then((m) => m.sfx.tick()).catch(() => {}); }

/* ═══════════ Gate (weekly limit) ═══════════ */
export function Gate() {
  const { t, lang, setOverlay, go, profile } = useApp();
  const hist = useMemo(() => {
    try { return store.history(KEYS.history) ?? []; } catch { return []; }
  }, []);
  const week = hist.filter((p) => Date.now() - (p?.createdAt ?? 0) < 7 * 864e5);
  const left = Math.max(0, 5 - week.length);
  return (
    <div className="screen">
      <div className="scroll no-dock">
        <div className="row" style={{ paddingTop: 4 }}>
          <button className="ibtn" onClick={() => go('intro')}>✕</button>
          <div className="grow kicker">{t('gateTitle')}</div>
        </div>
        <div className="center mt24">
          <div style={{ width: 84, margin: '0 auto' }}><Crest family="manager" size={84} /></div>
          <div className="h2 mt12">{t('gateTitle')}</div>
          <div className="bar y" style={{ maxWidth: 280, margin: '14px auto 0' }}>
            <i style={{ width: `${(left / 5) * 100}%` }} />
          </div>
          <p className="sub mt12">{t('gateSub')}</p>
          <p style={{ fontWeight: 900, fontSize: 14, marginTop: 8 }}>
            {tr('gateLeft', lang).replace('{n}', left)}
          </p>
        </div>
        <button className="btn primary block mt24" disabled={left <= 0}
          onClick={() => { setOverlay(null); go('full-assessment'); }}>
          {left > 0 ? t('assessStart') : t('gateEmpty')}
        </button>
        <button className="btn block mt12" onClick={() => setOverlay('paywall')}>{t('seePlans')}</button>
        <button className="btn ghost block mt12" onClick={() => go('intro')}>{t('close')}</button>
      </div>
    </div>
  );
}
export { Gate as AssessmentGate };

/* ═══════════ Descent (understand → value) ═══════════ */
export function Descent() {
  const { t, lang, go, setOverlay, setSheet, parts, toast, premium, openPaywall, profile } = useApp();
  const [layer, setLayer] = useState(0);
  const [saved, setSaved] = useState(false);
  const prof = profile ?? window.__lastProfile ?? null;
  const ranked = prof?.parts ?? parts;
  const current = ranked[0];
  const curTraits = parts.find((p) => p.id === current?.id)?.traits ?? parts[0]?.traits;

  const cycle = () => {
    setLayer((l) => (l + 1) % 4);
    import('../pal/sfx.ts').then((m) => m.sfx.tick()).catch(() => {});
  };

  const save = () => {
    setSaved(true);
    try {
      localStorage.setItem('ifs.sealed.verdict', JSON.stringify({ sealed: true, at: Date.now(), text: prof?.headlineConstellation ?? '' }));
    } catch { /* */ }
    toast('✓ ' + t('savedLocally'));
  };

  if (saved) {
    return (
      <div className="screen">
        <div className="scroll no-dock center" style={{ paddingTop: 70, position: 'relative' }}>
          <Confetti show />
          <div className="animate-pop" style={{ fontSize: 56, display: 'inline-block' }}>✓</div>
          <div className="h2 mt12">{t('saveToCabinet')}</div>
          <p className="sub">{t('savedLocally')}</p>
          <button className="btn primary block mt24" onClick={() => go('assessment-results')}>{t('back')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="scroll no-dock">
        <div className="row" style={{ paddingTop: 4 }}>
          <button className="ibtn" onClick={() => go('assessment-results')}>‹</button>
          <div className="grow kicker">{t('descentTitle')}</div>
          <button className="ibtn" onClick={() => (premium ? setOverlay('coach') : openPaywall())}>✨</button>
        </div>

        <div className="card mt16 center" style={{ padding: 16 }}>
          <div style={{ width: 86, margin: '0 auto' }} className="animate-idle">
            {curTraits && <Character traits={curTraits} />}
          </div>
          <div className="h2" style={{ fontSize: 20, marginTop: 8 }}>{current?.name}</div>
          <div className="kicker" style={{ color: familyColor(current?.family ?? 'manager') }}>
            {FAMILY_LABELS[current?.family ?? 'manager'][lang]}
          </div>
        </div>

        <button className="card block mt16 tap" onClick={cycle} style={{ textAlign: 'left', borderColor: 'var(--accent)', animation: 'screen-in .3s' }}>
          <div className="row">
            <div className="kicker grow">{['🚪 ' + t('layer1'), '🛑 ' + t('layer2'), '💛 ' + t('layer3'), '🌀 ' + t('layer4')][layer]}</div>
            <span className="faint" style={{ fontSize: 11, fontWeight: 900 }}>{layer + 1}/4 ⇄</span>
          </div>
          <p className="sub mt8" style={{ color: 'var(--text)' }}>
            {[t('layer1B'), t('layer2B'), t('layer3B'), t('layer4B')][layer]}
          </p>
        </button>

        <div className="row mt16" style={{ gap: 10 }}>
          <button className="btn grow" onClick={() => setSheet({ type: 'chemistry' })}>⚗️ {t('chemistry')}</button>
          <button className="btn grow" onClick={() => (premium ? setOverlay('practice') : openPaywall())}>🏋️ {t('practice')}</button>
        </div>

        {prof?.polarizations?.length > 0 && (
          <div className="card flat mt16">
            <div className="kicker">{t('polarizations')}</div>
            {prof.polarizations.map((p, i) => (
              <div key={i} className="mt8">
                <div className="row">
                  <b style={{ fontSize: 14 }}>{polLab(p.a, lang)}</b>
                  <span className="grow" />
                  <b style={{ fontSize: 14 }}>{polLab(p.b, lang)}</b>
                  <span className="faint" style={{ fontSize: 11, fontWeight: 900, marginLeft: 8 }}>{Math.round(p.tension * 100)}%</span>
                </div>
                <div className="bar p mt6"><i style={{ width: `${Math.round(p.tension * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        )}

        <div className="mt16">
          {['listened', 'managed', 'transformed'].map((k, i) => (
            <div key={k} className="row" style={{ padding: '13px 4px', borderBottom: '1.5px solid var(--line)', opacity: layer >= i + 1 ? 1 : 0.55 }}>
              <span style={{ fontSize: 18, marginRight: 12 }}>{['🎧', '🧭', '🌱'][i]}</span>
              <div className="grow">
                <div style={{ fontWeight: 900, fontSize: 14.5 }}>{t(k)}</div>
                <div className="faint" style={{ fontSize: 11.5, fontWeight: 700, marginTop: 2 }}>
                  {[t('listenSub'), t('manageSub'), t('transformSub')][i]}
                </div>
              </div>
              <span style={{ color: layer >= i + 1 ? 'var(--grass, #3EE0B0)' : 'var(--text-faint)', fontWeight: 900 }}>
                {layer >= i + 1 ? '✓' : '·'}
              </span>
            </div>
          ))}
        </div>

        <div className="row mt24" style={{ gap: 10 }}>
          <button className="btn grow" onClick={() => go('full-assessment')}>⟲ {t('retake')}</button>
          <button className="btn grow" onClick={() => go('intro')}>⌂ {t('menu')}</button>
          <button className="btn primary grow" onClick={save}>{t('save')}</button>
        </div>
        <button className="btn ghost block mt12" onClick={() => {
          if (confirm(t('confirmDelete'))) { try { localStorage.removeItem('ifs.sealed.verdict'); toast('🗑 ' + t('delete')); } catch { /* */ } }
        }}>
          🗑 {t('delete')}
        </button>
      </div>
    </div>
  );
}

/* ═══════════ Results ═══════════ */
export function QuickResults() {
  const { t, lang, go, setOverlay, setSheet, premium, openPaywall, toast, parts, profile } = useApp();
  const [tab, setTab] = useState('constellation');
  const prof = profile ?? window.__lastProfile ?? null;

  if (!prof) {
    return (
      <div className="screen">
        <div className="scroll no-dock center" style={{ paddingTop: 80 }}>
          <p className="sub">{t('empty')}</p>
          <button className="btn primary block mt16" onClick={() => go('full-assessment')}>{t('assessStart')}</button>
        </div>
      </div>
    );
  }

  let hist = [];
  try { hist = (store.history(KEYS.history) ?? []).filter(Boolean); } catch { hist = []; }
  const traitsOf = (id) => parts.find((p) => p.id === id)?.traits;
  const domFam = ['manager', 'firefighter', 'exile'].map((f) => {
    const rows = prof.parts.filter((p) => p.family === f);
    return [f, rows.length ? rows.reduce((s, p) => s + p.energy, 0) / rows.length : 0];
  }).sort((a, b) => b[1] - a[1])[0][0];
  const essay = (lang === 'ru' ? prof.constellationEssayRu : prof.constellationEssayEn)
    || prof.constellationEssay
    || `${tr('essayDom', lang)}: ${lang === 'ru' ? FAMILY_LABELS[domFam][lang] : domFam}. ${tr('essayTail', lang)}`;
  const radarLabels = Object.fromEntries(Object.keys(prof.selfEnergyRadar).map((k) => [k, ITEM_TEXTS[k] ? ITEM_TEXTS[k][lang] : k]));
  const resultSubtypes = (lang === 'ru' ? prof.subtypesRu : prof.subtypesEn) ?? prof.subtypes ?? [];
  const resultCopingStack = prof.testModel === 'angular-v2' && prof.clinical
    ? [
      ...[prof.clinical.copingStack.l1, prof.clinical.copingStack.l2, prof.clinical.copingStack.l3]
        .flatMap((id) => id ? [clinicalPartName(id, lang)] : []),
      `${t('copingFloor')} · ${clinicalPartName(prof.clinical.copingStack.floor, lang)}`,
    ]
    : prof.copingStack;
  const resultResourceLeaks = prof.testModel === 'angular-v2' && prof.clinical
    ? prof.clinical.resourceLeaks.map(({ resource, spillPart }) => ({ name: clinicalPartName(resource, lang), leak: clinicalPartName(spillPart, lang) }))
    : prof.resourceLeaks;
  const resultPolarizations = prof.testModel === 'angular-v2' && prof.clinical
    ? prof.clinical.polarizations.map(({ pair, name }) => ({
      a: pair[0], b: pair[1], name: clinicalPolarizationName(name, lang),
      tension: Math.max(0, Math.min(1, ((prof.clinical.parts[pair[0]].T + prof.clinical.parts[pair[1]].T) / 2 - 20) / 60)),
    }))
    : prof.polarizations;
  const famAvg = ['manager', 'firefighter', 'exile', 'resource'].map((f) => {
    const rows = prof.parts.filter((p) => p.family === f);
    const v = rows.length ? rows.reduce((s, p) => s + p.energy, 0) / rows.length : 0;
    return { k: FAMILY_LABELS[f][lang], v };
  }).filter((r) => r.v > 0);

  return (
    <div className="screen">
      <div className="scroll no-dock">
        <div className="row" style={{ paddingTop: 4 }}>
          <button className="ibtn" onClick={() => go('intro')}>‹</button>
          <div className="grow kicker">{t('resultsTitle')}</div>
          <button className="btn small" style={{ minHeight: 34, padding: '0 14px', fontSize: 13 }}
            onClick={() => setOverlay('share')}>↗ {t('shareBtn')}</button>
        </div>

        {prof.strongestResource && (
          <div className="card flat mt16" style={{ borderColor: 'var(--grass, #3EE0B0)' }}>
            <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('strongestResource')}</div>
            <div className="h2" style={{ fontSize: 19, marginTop: 6 }}>
              {lang === 'ru' ? prof.strongestResource.nameRu : prof.strongestResource.name}
            </div>
            <div className="faint mt4" style={{ fontSize: 12 }}>T {Math.round(prof.strongestResource.scoreT)} · {Math.round(prof.strongestResource.energy * 100)}%</div>
          </div>
        )}
        <div className="card mt16" style={{ borderColor: 'var(--yolk)' }}>
          <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('constellation')}</div>
          <div className="h2" style={{ fontSize: 22, marginTop: 6 }}>{lang === 'ru' && prof.headlineRu ? prof.headlineRu : prof.headlineConstellation}</div>
          <p className="sub mt8" style={{ color: 'var(--text)' }}>{essay}</p>
          <div className="row mt12" style={{ gap: 8, flexWrap: 'wrap' }}>
            <span className="chip" style={{ fontSize: 11.5 }}>{t('validity')} · {Math.round(prof.validity * 100)}%</span>
            <span className="chip" style={{ fontSize: 11.5 }}>{prof.parts.length} {partsWord(prof.parts.length, lang)}</span>
            <span className="chip" style={{ fontSize: 11.5 }}>{t('burdenLoad')} · {Math.round(prof.burden * 100)}%</span>
          </div>
        </div>
        {!!prof.validityFlags?.length && (
          <div className="card flat mt12" style={{ borderColor: 'var(--accent)' }} role="status">
            <div className="kicker">{t('validityFlags')}</div>
            {prof.validityFlags.map((flag) => (
              <p className="sub mt6" key={flag}>• {t(flag === 'attention' ? 'validityAttentionFlag' : 'validityInfrequencyFlag')}</p>
            ))}
          </div>
        )}

        {prof.crisisFlag && (
          <div className="card mt12" style={{ borderColor: '#FF3B4E', background: 'rgba(255,59,78,.1)' }}>
            <b style={{ color: '#FF6B7A' }}>⚠ {t('crisis')}</b>
            <p className="sub mt6">{t('crisisSupport')}</p>
          </div>
        )}

        <div className="tabs mt16">
          {[
            ['constellation', t('constellation')],
            ['radar', t('radarTab')],
            ['polar', t('polarizations')],
            ['bond', t('attachment')],
            ...(prof.testModel === 'angular-v2' ? [['metrics', t('assessmentMetrics')]] : []),
          ].map(([v, l]) => (
            <button key={v} className={tab === v ? 'on' : ''} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>

        {tab === 'constellation' && (
          <div className="part-grid mt16">
            {prof.parts.map((p) => (
              <div key={p.id} className="part-card" onClick={() => setSheet({ type: 'part', id: p.id })}>
                <span className="pc-fam" style={{ background: familyColor(p.family) }}>{FAMILY_LABELS[p.family].icon}</span>
                <div className="pc-art">
                  {traitsOf(p.id)
                    ? <Character traits={traitsOf(p.id)} lite showShadow={false} />
                    : <span style={{ fontSize: 30, lineHeight: '70px' }}>{FAMILY_LABELS[p.family].icon}</span>}
                </div>
                <div className="pc-name">{lang === 'ru' ? p.nameRu ?? p.name : p.nameEn ?? p.name}</div>
                <div className="pc-role">{t('intensity')} · {Math.min(p.somatic, 5)}/5</div>
                <div className="energy-strip"><i style={{ width: `${Math.round(p.energy * 100)}%`, background: familyColor(p.family) }} /></div>
              </div>
            ))}
          </div>
        )}

        {tab === 'radar' && (
          <div className="mt16">
            <div className="card">
              <div className="kicker">{t('selfRadar')}</div>
              <div style={{ display: 'grid', placeItems: 'center' }}>
                <Radar data={prof.selfEnergyRadar} labels={radarLabels} />
              </div>
            </div>
            <div className="card flat mt16">
              <div className="kicker">{t('coping')}</div>
              <div className="row wrap mt8" style={{ gap: 8 }}>
                {resultCopingStack.map((c) => <span key={c} className="chip">{copLab(c, lang)}</span>)}
              </div>
            </div>
            <div className="card flat mt16">
              <div className="kicker">{t('burdenLoad')}</div>
              <div className="bar y mt8"><i style={{ width: `${Math.round(prof.burden * 100)}%` }} /></div>
            </div>
            {famAvg.length > 0 && (
              <div className="card flat mt16">
                <div className="kicker">{t('energy')} · {t('familyCrest')}</div>
                <Bars items={famAvg} cls="y" />
              </div>
            )}
          </div>
        )}

        {tab === 'polar' && (
          <div className="mt16">
            <div className="card flat">
              <div className="kicker">{t('polarizations')}</div>
              {resultPolarizations.map((p, i) => (
                <div key={i} className="mt12">
                  {p.name && <div className="faint" style={{ fontSize: 11, fontWeight: 800, marginBottom: 4 }}>{p.name}</div>}
                  <div className="row">
                    <b style={{ fontSize: 14 }}>{polLab(p.a, lang)}</b><span className="grow" />
                    <b style={{ fontSize: 14 }}>{polLab(p.b, lang)}</b>
                    <span className="faint" style={{ fontWeight: 900, fontSize: 11, marginLeft: 8 }}>{Math.round(p.tension * 100)}%</span>
                  </div>
                  <div className="bar p mt6"><i style={{ width: `${Math.round(p.tension * 100)}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="card flat mt16">
              <div className="kicker">{t('complexes')}</div>
              <div className="row wrap mt8" style={{ gap: 8 }}>
                {prof.complexes.map((c) => <span key={c} className="chip">{cxLab(c, lang)}</span>)}
              </div>
            </div>
            <div className="card flat mt16">
              <div className="kicker">{t('subtypes')}</div>
              <div className="row wrap mt8" style={{ gap: 8 }}>
                {resultSubtypes.map((c) => <span key={c} className="chip on-dim">{subLab(c, lang)}</span>)}
              </div>
            </div>
          </div>
        )}

        {tab === 'bond' && (
          <div className="mt16">
            <div className="card flat">
              <div className="kicker">{t('attachment')}</div>
              <div className="h2" style={{ fontSize: 22, marginTop: 6 }}>{attLab(prof.attachment, lang)}</div>
            </div>
            <div className="card flat mt16">
              <div className="kicker">{t('needHunger')}</div>
              <Bars items={Object.entries(prof.needHunger).map(([k, v]) => ({
                k: ITEM_TEXTS[k] ? ITEM_TEXTS[k][lang] : prof.testModel === 'angular-v2' ? clinicalNeedName(k, lang) : k,
                v,
              }))} cls="p" />
            </div>
            <div className="card flat mt16">
              <div className="kicker">{t('resourceLeaks')}</div>
              {resultResourceLeaks.length === 0 && <p className="sub mt8">{t('empty')}</p>}
              {resultResourceLeaks.map((l, i) => (
                <p key={i} style={{ fontWeight: 800, fontSize: 13.5, marginTop: 6 }}>• {leakName(l.name, lang)} — {leakText(l.name, l.leak, lang)}</p>
              ))}
            </div>
            <button className="btn primary block mt16" onClick={() => setOverlay('synastry')}>💞 {t('synastry')}</button>
          </div>
        )}

        {tab === 'metrics' && prof.testModel === 'angular-v2' && prof.clinical && (
          <div className="mt16">
            <div className="card flat">
              <div className="kicker">{t('selfEnergy')} · {prof.selfEnergy}/100</div>
              <p className="sub mt8">{t('burdenLoad')} · {Math.round(prof.burden * 100)}%</p>
              <div className="bar y mt8"><i style={{ width: `${Math.round(prof.burden * 100)}%` }} /></div>
              <p className="faint mt8" style={{ fontSize: 11 }}>Deterministic scoring · same 147 answers produce the same scores.</p>
            </div>
            <div className="card flat mt12">
              <div className="kicker">{t('resources')}</div>
              <Bars items={prof.resources.map((resource) => ({ k: lang === 'ru' ? resource.nameRu : resource.nameEn ?? resource.name, v: resource.energy }))} cls="y" />
              <div className="row wrap" style={{ gap: 8 }}>
                {prof.resources.map((resource) => <span className="chip" key={resource.id}>{lang === 'ru' ? resource.nameRu : resource.nameEn ?? resource.name} · {resourceBandLab(resource.band, lang)}</span>)}
              </div>
            </div>
            <div className="card flat mt12">
              <div className="kicker">{t('complexes')}</div>
              {prof.activeComplexes.length === 0 && <p className="sub mt8">{t('empty')}</p>}
              {prof.activeComplexes.map((complex) => (
                <div className="mt12" key={complex.id}>
                  <div className="row"><b className="grow">{lang === 'ru' ? complex.nameRu : complex.name}</b><span className="chip">{Math.round(complex.activation)} · {complex.tier}</span></div>
                  <p className="sub mt6">{lang === 'ru' ? complex.beliefRu ?? complex.belief : complex.beliefEn ?? complex.belief}</p>
                  <p className="faint mt6" style={{ fontSize: 12 }}>{lang === 'ru' ? complex.experimentRu ?? complex.experiment : complex.experimentEn ?? complex.experiment}</p>
                </div>
              ))}
            </div>
            <div className="card flat mt12">
              <div className="kicker">{t('attachment')} · {t('assessmentMetrics')}</div>
              <p className="sub mt8">{lang === 'ru' ? 'Тревожность' : 'Anxious'} · {Math.round(prof.attachmentScores.anxious)}</p>
              <p className="sub mt6">{lang === 'ru' ? 'Избегание' : 'Avoidant'} · {Math.round(prof.attachmentScores.avoidant)}</p>
              <p className="sub mt6">{lang === 'ru' ? 'Безопасность' : 'Secure'} · {Math.round(prof.attachmentScores.secure)}</p>
            </div>
            <div className="card flat mt12">
              <div className="kicker">{t('validityFlags')}</div>
              {prof.validityFlags.length === 0
                ? <p className="sub mt8">{t('noValidityFlags')}</p>
                : prof.validityFlags.map((flag) => <p className="sub mt6" key={flag}>• {t(flag === 'attention' ? 'validityAttentionFlag' : 'validityInfrequencyFlag')}</p>)}
              <p className="faint mt8" style={{ fontSize: 11 }}>{CONSENT_TEXT[lang]}</p>
            </div>
          </div>
        )}

        <div className="kicker mt24">{t('readNext')}</div>
        <div className="row mt8" style={{ gap: 10 }}>
          <button className="btn primary grow" onClick={() => go('descent')}>{t('intoDescend')}</button>
          <button className="btn grow" onClick={() => (premium ? go('universe') : openPaywall())}>🌌 {t('seeUniverse')}</button>
        </div>
        <div className="row mt12" style={{ gap: 10 }}>
          <button className="btn ghost grow" onClick={() => (premium ? go('full-assessment') : go('assessment-gate'))}>⟲ {t('retake')}</button>
          <button className="btn ghost grow" onClick={() => setOverlay('quickscan')}>⚡ {t('quickscan')}</button>
        </div>

        <div className="card flat mt24">
          <div className="kicker">{t('history')}</div>
          {hist.length === 0 && <p className="sub mt8">{t('empty')}</p>}
          {hist.slice(0, 6).map((h, i) => (
            <div key={i} className="row" style={{ padding: '10px 0', borderBottom: '1.5px solid var(--line)' }}>
              <div className="grow">
                <div style={{ fontWeight: 900, fontSize: 14 }}>{h.headlineConstellation ?? '—'}</div>
                <div className="faint" style={{ fontSize: 11, fontWeight: 800 }}>
                  {new Date(h.createdAt ?? Date.now()).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <span className="chip" style={{ fontSize: 11 }}>#{hist.length - i}</span>
            </div>
          ))}
        </div>

        <div className="card flat mt16" style={{ borderColor: 'var(--accent)' }}>
          <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('myClients')}</div>
          <div className="row mt12" style={{ gap: 10 }}>
            <button className="btn grow" onClick={() => setOverlay('therapist')}>⊞ {t('viewMatrix')}</button>
            <button className="btn grow" onClick={() => setOverlay('therapist')}>🤖 {t('viewReport')}</button>
          </div>
          <button className="btn ghost block mt12" onClick={() => go('specialist-client-view')}>🏥 {t('therapist')}</button>
        </div>
        <div style={{ height: 30 }} />
      </div>
    </div>
  );
}
