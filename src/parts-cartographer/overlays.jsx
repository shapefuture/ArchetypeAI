import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from './app.jsx';
import { Character } from './pal/Character.tsx';
import { Seg, Confetti, Bars, familyColor, Crest } from './ui/ui.jsx';
import { t as tr, BOND_TYPES, EXERCISE_COPY, EXERCISE_TYPE_MAP, SYNASTRY_DIM_LABELS } from './i18n/strings.ts';
import { FAMILY_LABELS } from './pal/traits.ts';
import { profileToCode } from './core/scoring-v2.ts';
import { synFromProfiles, synastry } from './core/synastry-v2.ts';
import { ResilientAiAdapter, AI } from './core/ai.adapter.ts';
import { store, KEYS } from './core/local-store';

const ovHead = (title, onClose, extra) => (
  <div className="ov-head">
    <div className="ov-title">{title}</div>
    {extra}
    <button className="ibtn" onClick={onClose}>✕</button>
  </div>
);

/* ═══════════ Coach (chat · streaming · modes) ═══════════ */
export function Coach() {
  const { t, lang, setOverlay, profile, state } = useApp();
  const [mode, setMode] = useState('parts');
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: tr('sw1', lang) },
  ]);
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);

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
    try {
      const full = await AI.chat(hist.map((m) => ({ role: m.role, text: m.text })), mode);
      stream(full);
    } catch {
      stream(tr('sw2', lang));
    }
    setBusy(false);
  };

  return (
    <div className="overlay">
      {ovHead('✨ ' + t('coach'), () => setOverlay(null),
        <span className="degraded" style={{ fontSize: 10 }}>{degraded.degraded ? '◌ degraded' : '◌ live'}</span>)}
      <div style={{ padding: '0 20px 8px' }}>
        <Seg value={mode} onChange={setMode} options={[
          { v: 'general', l: t('modeGeneral') },
          { v: 'parts', l: t('modeParts') },
        ]} />
      </div>
      <div className="ov-body">
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
          <input value={input} placeholder={t('askAnything')}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)} />
        </div>
        <button className="btn primary" style={{ minHeight: 48, padding: '0 20px' }}
          disabled={busy} onClick={() => send(input)}>↑</button>
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
  const { t, lang, setOverlay, profile, toast, premium, openPaywall, parts } = useApp();
  const [tab, setTab] = useState('gen');
  const [code, setCode] = useState('');
  const [myCode, setMyCode] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const gen = () => {
    if (!profile) { toast(t('empty')); return; }
    const c = profileToCode(profile).slice(0, 8);
    setMyCode(c);
    try { store.save(KEYS.share, [...(store.load(KEYS.share, []) ?? []), { c, at: Date.now() }]); } catch { /* */ }
    // stay on the gen tab so the freshly generated code is actually shown
  };

  const run = async () => {
    if (code.trim().length < 4) return;
    setBusy(true);
    try {
      const r = profile ? synFromProfiles(profile, code.trim()) : synastry('SELF0000', code.trim());
      setResult(r);
    } catch { setResult(null); }
    setBusy(false);
  };

  const upload = (f) => {
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const j = JSON.parse(String(rd.result));
        const c = j.code ?? profileToCode(j.profile ?? j).slice(0, 8);
        setCode(c);
        setResult(profile ? synFromProfiles(profile, c) : synastry('SELF0000', c));
      } catch { toast('⚠ JSON'); }
    };
    rd.readAsText(f);
  };

  return (
    <div className="overlay">
      {ovHead('💞 ' + t('synastry'), () => setOverlay(null))}
      <div style={{ padding: '0 20px 6px' }}>
        <Seg value={tab} onChange={setTab} options={[
          { v: 'gen', l: t('generateCode') },
          { v: 'paste', l: t('pasteCode') },
          { v: 'up', l: t('uploadJson') },
        ]} />
      </div>
      <div className="ov-body">
        {tab === 'gen' && (
          <div className="center" style={{ paddingTop: 18 }}>
            <Crest family="exile" size={70} />
            <p className="sub mt12">{tr('sw3', lang)}</p>
            {/* my-code card moved here from the old Code× tab (item 6) */}
            {(myCode || profile) && (() => {
              const c = myCode || (profile ? String(profileToCode(profile).slice(0, 8)) : '');
              if (!c) return null;
              return (
                <div className="card mt16" style={{ borderColor: 'var(--accent)', width: '100%', textAlign: 'left' }}>
                  <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('myCode')}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: '.2em', marginTop: 6 }}>{c}</div>
                  <p className="sub" style={{ fontSize: 13 }}>{t('share')} · {parts.length} {tr('sw4', lang)}</p>
                  <div className="row mt12" style={{ gap: 10 }}>
                    <button className="btn grow" onClick={() => { navigator.clipboard?.writeText(c); toast('📋 ' + t('copied')); }}>⧉ {t('copy')}</button>
                    <button className="btn primary grow" onClick={() => setOverlay('share')}>↗ {t('shareBtn')}</button>
                  </div>
                </div>
              );
            })()}
            <button className="btn primary block mt16" onClick={gen}>⚡ {t('generateCode')}</button>
          </div>
        )}
        {tab === 'paste' && (
          <div>
            <div className="kicker mt8">{t('partnerHint')}</div>
            <div className="field mt8">
              <div className="field">
                <input value={code} maxLength={64} placeholder={t('pasteCode')}
                  onChange={(e) => setCode(e.target.value.toUpperCase())} />
              </div>
            </div>
            <button className="btn primary block" disabled={busy || code.trim().length < 4} onClick={run}>
              {busy ? '✨ …' : '⚗️ ' + t('runSyn')}
            </button>
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

        {result && (
          <div className="card mt16" style={{ borderColor: 'var(--accent)', animation: 'screen-in .3s' }}>
            <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('reportTitle')}</div>
            <div className="h2" style={{ fontSize: 20, marginTop: 6 }}>
              {result.bond[lang === 'ru' ? 'ru' : 'en']}
            </div>
            <div className="mt12">
              <Bars items={result.dims.map((d) => ({ k: d[lang === 'ru' ? 'labelRu' : 'labelEn'], v: d.value / 100 }))} cls="y" />
            </div>
            <p className="sub mt8" style={{ color: 'var(--text)' }}>
              {lang === 'ru' ? result.narrativeRu : result.narrativeEn}
            </p>
            <button className="btn ghost block mt12" onClick={() => {
              const txt = `${result.bond.en} / ${result.bond.ru}\n${lang === 'ru' ? result.narrativeRu : result.narrativeEn}`;
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

/* ═══════════ Practice (20 exercises · 5 chapters · 3 gates · timer) ═══════════ */
const CHAP = [
  ['chap1', ['e1', 'e2', 'e10', 'e17']],
  ['chap2', ['e3', 'e18', 'e7', 'e20']],
  ['chap3', ['e4', 'e11', 'e12', 'e19']],
  ['chap4', ['e5', 'e6', 'e13', 'e14']],
  ['chap5', ['e8', 'e9', 'e15', 'e16']],
];
const doneCount = () => { try { return store.load('ifs.practice.done', []).length; } catch { return 0; } };

export function Practice() {
  const { t, lang, setOverlay, profile, premium, openPaywall, toast } = useApp();
  const [open, setOpen] = useState(null); // exercise id
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(false);
  const [sug, setSug] = useState(null);
  const [done, setDone] = useState(doneCount);
  const tick = useRef(null);

  useEffect(() => {
    clearInterval(tick.current);
    if (running) tick.current = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(tick.current);
  }, [running]);

  const gates = premium ? [0, 0, 0, 0, 0] : [0, 2, 4, 6, 8]; // 3 gates + premium bypass
  const unlocked = (i) => done >= gates[i];

  const complete = () => {
    try {
      const list = store.load('ifs.practice.done', []);
      if (!list.includes(open)) { list.push(open); store.save('ifs.practice.done', list); setDone(list.length); }
    } catch { /* */ }
    setRunning(false); setSec(0); setOpen(null);
    toast('✓ ' + t('done'));
  };

  const suggest = async () => {
    try {
      const id = await AI.suggestExercise(profile);
      setOpen(String(id).match(/e\d+/)?.[0] ?? 'e1');
    } catch { setOpen('e1'); }
  };

  if (open) {
    return (
      <div className="overlay">
        {ovHead('🏋️ ' + t('rehearse') + ' · ' + open, () => { setOpen(null); setRunning(false); setSec(0); })}
        <div className="ov-body">
          <div className="card" style={{ borderColor: 'var(--accent)' }}>
            <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('practice')} · {open}</div>
            <p style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.55, marginTop: 8 }}>
              {EXERCISE_COPY[open]?.[lang] ?? EXERCISE_COPY.e1[lang]}
            </p>
          </div>
          <div className="center mt24">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 46, letterSpacing: '.05em' }}>
              {String(Math.floor(sec / 60)).padStart(2, '0')}:{String(sec % 60).padStart(2, '0')}
            </div>
          </div>
        </div>
        <div className="ov-foot row" style={{ gap: 10 }}>
          <button className="btn grow" onClick={() => setRunning((r) => !r)}>
            {running ? '⏸ ' + t('pause') : '▶ ' + t('rehearse')}
          </button>
          <button className="btn primary grow" onClick={complete}>✓ {t('done')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay">
      {ovHead('🏋️ ' + t('practice'), () => setOverlay(null))}
      <div className="ov-body">
        <button className="btn primary block" onClick={suggest}>✨ {t('coach')} → {t('rehearse')}</button>
        {sug && <p className="sub mt8" />}
        <div className="kicker mt16">{t('practiceChapters')} · {done} ✓</div>
        {CHAP.map(([ck, ids], i) => (
          <div key={ck} className="card flat mt12" style={{ opacity: unlocked(i) ? 1 : 0.55 }}>
            <div className="row">
              <b style={{ fontSize: 15 }}>{i + 1}. {t(ck)}</b>
              <span className="grow" />
              <span className="chip" style={{ fontSize: 11 }}>{ids.length}×</span>
            </div>
            <div className="row wrap mt8" style={{ gap: 8 }}>
              {ids.map((id) => (
                <button key={id} className="chip" disabled={!unlocked(i)}
                  onClick={() => unlocked(i) && setOpen(id)}>
                  {unlocked(i) ? '' : '🔒 '}{EXERCISE_COPY[id]?.[lang]?.slice(0, 26) + '…'}
                </button>
              ))}
            </div>
            {!unlocked(i) && (
              <p className="faint mt8" style={{ fontSize: 11.5, fontWeight: 800 }}>
                🔒 {gates[i]} {tr('sw5', lang)} {!premium && i === 4 ? '· ' + t('subscribe') : ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ Check-in (JITAI) ═══════════ */
export function CheckIn() {
  const { t, lang, setOverlay, toast, parts } = useApp();
  const [step, setStep] = useState(0);
  const [arousal, setArousal] = useState(5);
  const [event, setEvent] = useState('');
  const [predicted, setPredicted] = useState(null);
  const [seal, setSeal] = useState(true);
  const [blame, setBlame] = useState(40);
  const [license, setLicense] = useState(60);
  const [pushOn, setPushOn] = useState(false);
  const [busy, setBusy] = useState(false);

  const predict = async () => {
    setBusy(true);
    try {
      const name = await AI.predictPart(event || 'a wave', arousal);
      setPredicted(String(name).trim());
    } catch { setPredicted(parts[0]?.name ?? 'The Planner'); }
    setBusy(false);
    setStep(2);
  };

  const finish = () => {
    if (seal) {
      try {
        const list = store.load('ifs.sealed', []);
        list.push({ until: Date.now() + 3 * 864e5, text: `${predicted && FAMILY_LABELS[predicted] ? FAMILY_LABELS[predicted][lang] : (predicted ?? '—')} · ${license}% ${t('license')}` });
        store.save('ifs.sealed', list);
      } catch { /* */ }
    }
    try {
      const ch = store.load(KEYS.charter, []);
      ch.push({ date: new Date().toISOString().slice(0, 10), text: `${t('charter')}: ${blame}% blame → ${license}% license` });
      store.save(KEYS.charter, ch);
    } catch { /* */ }
    toast('✓ ' + t('done'));
    setStep(3);
  };

  return (
    <div className="overlay">
      {ovHead('🫀 ' + t('checkin'), () => setOverlay(null))}
      <div className="ov-body">
        {step === 0 && (
          <div className="center" style={{ paddingTop: 26 }}>
            <div className="h2">{t('checkinQ')}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, marginTop: 18, color: 'var(--accent-text)' }}>{arousal}</div>
            <input type="range" min={1} max={10} value={arousal} style={{ width: '100%', accentColor: '#FFD000' }}
              onChange={(e) => setArousal(+e.target.value)} />
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 11, fontWeight: 900, color: 'var(--text-faint)' }}>
              <span>{t('feltLow')}</span><span>{t('feltMid')}</span><span>{t('feltHigh')}</span>
            </div>
            <div className="kicker mt24" style={{ textAlign: 'left' }}>{t('checkinEvent')}</div>
            <div className="field mt8">
              <div className="field">
                <input value={event} placeholder={tr('sw6', lang)}
                  onChange={(e) => setEvent(e.target.value)} />
              </div>
            </div>
            <button className="btn primary block" disabled={busy} onClick={predict}>
              {busy ? '✨ …' : '→ ' + t('continue')}
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ paddingTop: 8 }}>
            <div className="card" style={{ borderColor: 'var(--accent)' }}>
              <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('jitai')}</div>
              <p style={{ fontWeight: 800, fontSize: 15.5, marginTop: 6 }}>
                {t('checkinPredicted')}: <b style={{ color: 'var(--accent-text)' }}>{predicted && FAMILY_LABELS[predicted] ? FAMILY_LABELS[predicted][lang] : predicted}</b>
              </p>
              <p className="sub mt8">{t('followUp')}</p>
            </div>

            <div className="kicker mt24">{t('blame')} · {blame}%</div>
            <input type="range" min={0} max={100} value={blame} style={{ width: '100%', accentColor: '#FF2D8A' }}
              onChange={(e) => setBlame(+e.target.value)} />
            <div className="kicker mt12">{t('license')} · {license}%</div>
            <input type="range" min={0} max={100} value={license} style={{ width: '100%', accentColor: '#3EE0B0' }}
              onChange={(e) => setLicense(+e.target.value)} />

            <button className="toggle mt16" onClick={() => setSeal((s) => !s)}>
              <span style={{ flex: 1, fontWeight: 900, fontSize: 14 }}>⏳ {t('sealed')} · {t('charter')}</span>
              <i className={seal ? 'on' : ''} />
            </button>

            <button className="btn block mt16" onClick={async () => {
              try {
                if (typeof Notification !== 'undefined' && Notification.requestPermission) {
                  const p = await Notification.requestPermission();
                  setPushOn(p === 'granted');
                  toast(p === 'granted' ? '🔔 ' + t('pushDone') : '🔕 ' + t('pushOpt'));
                } else toast('🔕 ' + t('pushOpt'));
              } catch { toast('🔕 ' + t('pushOpt')); }
            }}>
              🔔 {pushOn ? t('pushDone') : t('pushOpt')}
            </button>

            <button className="btn primary block mt16" onClick={finish}>✓ {t('confirm')}</button>
          </div>
        )}

        {step === 3 && (
          <div className="center" style={{ paddingTop: 60, position: 'relative' }}>
            <Confetti show />
            <div className="animate-pop" style={{ fontSize: 54 }}>🫀</div>
            <div className="h2 mt12">{t('done')}</div>
            <p className="sub">{t('charter')} · {t('sealed')}</p>
            <button className="btn primary block mt24" onClick={() => setOverlay(null)}>{t('close')}</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ Quick scan (paste code → deterministic result) ═══════════ */
export function QuickScan() {
  const { t, lang, setOverlay, toast, profile } = useApp();
  const [code, setCode] = useState('');
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (code.trim().length < 4) return;
    setBusy(true);
    try {
      let rep = await AI.quickScan(code.trim().toUpperCase());
      if (lang === 'ru') {
        const dims = [['energy sync', 'Синхрон энергий'], ['burden overlap', 'Пересечение бремени'], ['polarization risk', 'Риск поляризации'], ['care flow', 'Поток заботы'], ['exile safety', 'Безопасность изгоев'], ['repair speed', 'Скорость ремонта']];
        dims.forEach(([en, ru]) => { rep = rep.split(en).join(ru); });
        rep = rep.replace('Dominant bond', 'Доминирующая связь');
        rep = rep.replace(/: (mirror|anchor|catalyst|sanctuary|challenger|echo)\./, (m, b) => `: ${(BOND_TYPES.find((x) => x.id === b)?.ru) ?? b}.`);
      } else {
        rep = rep.charAt(0).toUpperCase() + rep.slice(1);
      }
      setOut(rep);
    }
    catch { setOut(tr('sw7', lang)); }
    setBusy(false);
  };

  return (
    <div className="overlay">
      {ovHead('🔭 ' + t('quickscan'), () => setOverlay(null))}
      <div className="ov-body">
        <div className="kicker mt8">{t('scanIn')}</div>
        <div className="field mt8">
          <div className="field">
            <input value={code} maxLength={64} placeholder="AB12CD34"
              style={{ textTransform: 'uppercase', letterSpacing: '.15em', fontFamily: 'var(--font-display)' }}
              onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </div>
        </div>
        <button className="btn primary block" disabled={busy || code.trim().length < 4} onClick={run}>
          {busy ? '✨ …' : '⚡ ' + t('quickscanGo')}
        </button>
        {out && (
          <div className="card mt16" style={{ borderColor: 'var(--yolk)' }}>
            <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('reportTitle')}</div>
            <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.55, marginTop: 8, whiteSpace: 'pre-wrap' }}>{out}</p>
            <button className="btn ghost block mt12" onClick={() => { navigator.clipboard?.writeText(out); toast('📋 ' + t('copied')); }}>
              ⧉ {t('copy')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ Booking wizard (moved to Base page — item 16) ═══════════ */
export function Booking() {
  const { t, lang, setOverlay, toast, profile } = useApp();
  const [step, setStep] = useState(0);
  const [ther, setTher] = useState(null);
  const [day, setDay] = useState(null);
  const [slot, setSlot] = useState(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 864e5);
    return { iso: d.toISOString().slice(0, 10), label: d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short', day: '2-digit', month: 'short' }) };
  }), []);
  const slots = ['09:00', '11:00', '16:00', '18:00'];

  return (
    <div className="overlay">
      {ovHead('📅 ' + t('appointments'), () => setOverlay(null))}
      <div className="ov-body">
        <div className="steps mt8"><i className={step >= 0 ? 'on' : ''} /><i className={step >= 1 ? 'on' : ''} /><i className={step >= 2 ? 'on' : ''} /></div>

        {step === 0 && (
          <div className="mt16">
            <div className="kicker">{t('pickTherapist')}</div>
            {profile && (
              <div className="card flat mt10" style={{ width: '100%' }}>
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
            {['Dr. Mira Kestel', 'Dr. Ron Aviram'].map((n) => (
              <button key={n} className="card block mt12 tap" style={{ width: '100%', textAlign: 'left', borderColor: ther === n ? 'var(--accent)' : undefined }}
                onClick={() => { setTher(n); setStep(1); }}>
                <div className="row">
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: 'var(--surface2)', display: 'grid', placeItems: 'center', fontSize: 20 }}>🧑‍⚕️</div>
                  <div className="grow" style={{ marginLeft: 12 }}>
                    <b>{n}</b>
                    <div className="faint" style={{ fontSize: 12, fontWeight: 800 }}>
                      {tr('sw8', lang)}
                    </div>
                  </div>
                  <span>›</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="mt16">
            <div className="kicker">{t('pickDate')}</div>
            <div className="row wrap mt8" style={{ gap: 8 }}>
              {days.map((d) => (
                <button key={d.iso} className={`chip ${day === d.iso ? 'on' : ''}`} onClick={() => { setDay(d.iso); setStep(2); }}>
                  {d.label}
                </button>
              ))}
            </div>
            <button className="btn ghost block mt16" onClick={() => setStep(0)}>‹ {t('back')}</button>
          </div>
        )}

        {step === 2 && (
          <div className="mt16">
            <div className="kicker">{t('pickSlot')}</div>
            <div className="row wrap mt8" style={{ gap: 8 }}>
              {slots.map((s2) => (
                <button key={s2} className={`chip ${slot === s2 ? 'on' : ''}`} onClick={() => setSlot(s2)} style={{ fontSize: 14 }}>{s2}</button>
              ))}
            </div>
            <div className="card flat mt16">
              <b>{ther}</b>
              <div className="faint" style={{ fontWeight: 800, fontSize: 13 }}>{day} · {slot}</div>
            </div>
            <div className="row mt16" style={{ gap: 10 }}>
              <button className="btn grow" onClick={() => setStep(1)}>‹ {t('back')}</button>
              <button className="btn primary grow" disabled={!slot} onClick={() => { toast('📅 ' + t('bookSession')); setStep(3); }}>
                {t('confirmSlot')}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="center" style={{ paddingTop: 30 }}>
            <div className="animate-pop" style={{ fontSize: 50 }}>📅</div>
            <div className="h2 mt12">{t('bookSession')}</div>
            <p className="sub">{ther} · {day} · {slot}</p>
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
  const { t, lang, setOverlay, go, toast } = useApp();
  const [attested, setAttested] = useState(() => { try { return localStorage.getItem('ifs.attested') === '1'; } catch { return false; } });
  const [avail, setAvail] = useState(loadAvail);
  const dayL = t('availDays').split(',');
  const dayOf = (a, i) => a.days[i] ?? { on: false, from: '09:00', to: '18:00' };
  const toggleDay = (i) => setAvail((a) => ({ days: { ...a.days, [i]: { ...dayOf(a, i), on: !dayOf(a, i).on } } }));
  const setDayTime = (i, f, v) => setAvail((a) => ({ days: { ...a.days, [i]: { ...dayOf(a, i), [f]: v } } }));
  const saveAvail = () => {
    try { localStorage.setItem('ifs.avail', JSON.stringify(avail)); } catch { /* */ }
    toast('✓ ' + t('save'));
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

            {/* availability control (item 15) */}
            <div className="card mt16">
              <div className="kicker" style={{ color: 'var(--accent-text)' }}>🗓 {t('availT')}</div>
              <p className="sub mt6" style={{ fontSize: 13 }}>{t('availSub')}</p>
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
              <button className="btn primary block mt14" onClick={saveAvail}>{t('save')}</button>
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

export function Share() {
  const { t, lang, profile, setOverlay, toast } = useApp();
  const [img, setImg] = useState('');
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
        <p className="faint mt12" style={{ fontSize: 12, fontWeight: 800, textAlign: 'center' }}>
          {t('shareNote')}
        </p>
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
