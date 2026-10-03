import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app.jsx';
import { Character } from '../pal/Character.tsx';
import { CustomizerLike } from './editor-kit.jsx';
import { SEED_PARTS, FAMILY_LABELS, randomTraits, pid, SHAPES } from '../pal/traits.ts';
import { Crest, familyColor, Sheet, Confetti } from '../ui/ui.jsx';
import { t as tr, PART_COPY } from '../i18n/strings.ts';
import { myAppointments, setAppointmentStatus } from '../core/booking.ts';
import { loadCloudMapHistory, saveCloudMap } from '../core/cloud-storage.ts';
import { checkAdminAccess } from '../core/admin.ts';
import { prepareBackup, applyBackup } from '../core/backup';

/* ═══════════ Cabinet ═══════════ */
export function Cabinet() {
  const { t, lang, go, parts, setParts, setSheet, toast, openPaywall, user, setOverlay, profile, setProfile } = useApp();
  const currentAccount = useRef(user?.uid);
  currentAccount.current = user?.uid;
  useEffect(() => () => { currentAccount.current = null; }, []);
  const [filter, setFilter] = useState('all');
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudHistory, setCloudHistory] = useState([]);
  const [cloudMessage, setCloudMessage] = useState('');
  const [adminAccess, setAdminAccess] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [cancelling, setCancelling] = useState('');
  const filters = [
    { v: 'all', l: t('filterAll'), c: null },
    { v: 'manager', l: FAMILY_LABELS.manager[lang], c: familyColor('manager') },
    { v: 'firefighter', l: FAMILY_LABELS.firefighter[lang], c: familyColor('firefighter') },
    { v: 'exile', l: FAMILY_LABELS.exile[lang], c: familyColor('exile') },
    { v: 'resource', l: FAMILY_LABELS.resource[lang], c: familyColor('resource') },
  ];
  const list = parts.filter((p) => filter === 'all' || p.family === filter);
  useEffect(() => { setCloudHistory([]); setCloudMessage(''); setCloudBusy(false); }, [user?.uid]);

  useEffect(() => {
    if (!user?.linked || !user.uid || !user.emailVerified) {
      setAdminAccess(false);
      return undefined;
    }
    let active = true;
    checkAdminAccess(user).then((allowed) => { if (active) setAdminAccess(allowed); }).catch((error) => {
      console.warn('Admin role lookup failed', error);
      if (active) setAdminAccess(false);
    });
    return () => { active = false; };
  }, [user?.uid, user?.linked, user?.email, user?.emailVerified]);

  useEffect(() => {
    if (!user?.linked || !user.uid) {
      setAppointments([]);
      setAppointmentsError('');
      return undefined;
    }
    let active = true;
    setAppointmentsLoading(true);
    myAppointments(user.uid)
      .then((items) => { if (active) { setAppointments(items); setAppointmentsError(''); } })
      .catch((err) => {
        console.error('Client appointments load failed', err);
        if (active) setAppointmentsError(t('appointmentsLoadFailed'));
      })
      .finally(() => { if (active) setAppointmentsLoading(false); });
    return () => { active = false; };
  }, [user?.uid, user?.linked, t]);

  const cancelAppointment = async (appointmentId) => {
    if (!user?.linked || !user.uid || cancelling) return;
    setCancelling(appointmentId);
    setAppointmentsError('');
    try {
      await setAppointmentStatus(appointmentId, 'cancelled');
      const refreshed = await myAppointments(user.uid);
      if (currentAccount.current !== user.uid) return;
      setAppointments(refreshed);
      toast('✓ ' + t('appointmentCancelled'));
    } catch (err) {
      console.error('Appointment cancellation failed', err);
      if (currentAccount.current === user.uid) setAppointmentsError(t('bookingCancelFailed'));
    } finally {
      if (currentAccount.current === user.uid) setCancelling('');
    }
  };

  const appointmentDate = (value) => {
    const date = new Date(`${value}:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', {
      weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const saveToCloud = async () => {
    if (!user?.linked || !user.uid || !profile || cloudBusy) return;
    setCloudBusy(true);
    setCloudMessage('');
    try {
      const saved = await saveCloudMap(user.uid, profile, parts);
      if (currentAccount.current !== user.uid) return;
      setCloudHistory((history) => [saved, ...history.filter((entry) => entry.id !== saved.id)].slice(0, 20));
      setCloudMessage(t('cloudSaveOk'));
    } catch (err) {
      console.error('Cloud map save failed', err);
      if (currentAccount.current === user.uid) setCloudMessage(t('cloudSaveFailed'));
    } finally {
      if (currentAccount.current === user.uid) setCloudBusy(false);
    }
  };

  const loadCloudHistory = async () => {
    if (!user?.linked || !user.uid || cloudBusy) return;
    setCloudBusy(true);
    setCloudMessage('');
    try {
      const history = await loadCloudMapHistory(user.uid);
      if (currentAccount.current !== user.uid) return;
      setCloudHistory(history);
      setCloudMessage(history.length ? t('cloudHistoryLoaded') : t('cloudHistoryEmpty'));
    } catch (err) {
      console.error('Cloud map history load failed', err);
      if (currentAccount.current === user.uid) setCloudMessage(t('cloudLoadFailed'));
    } finally {
      if (currentAccount.current === user.uid) setCloudBusy(false);
    }
  };

  const restoreCloudSnapshot = async (entry) => {
    if (entry.source?.schema === 'angular-assessment64') {
      try {
        applyBackup(await prepareBackup(JSON.stringify(entry.source), lang, parts));
        go('legacy-assessment');
      } catch { toast('⚠ ' + t('restoreBad')); }
      return;
    }
    setProfile(entry.profile);
    setParts(entry.parts);
    toast('✓ ' + t('cloudRestoreOk'));
    go('assessment-results');
  };

  const toggleStar = (id) => {
    setParts(parts.map((p) => (p.id === id ? { ...p, star: !p.star } : p)));
  };

  const addPart = () => {
    const fams = ['manager', 'firefighter', 'exile', 'resource'];
    const fam = fams[Math.floor(Math.random() * 4)];
    const p = {
      id: pid(), name: t('newPart'), family: fam, traits: randomTraits(fam),
      role: t('roleDesc'), blurb: t('blurbNew'),
      energy: 40, burden: '—', need: '—', voice: '—', star: false, since: t('today'),
    };
    setParts([...parts, p]);
    setSheet({ type: 'editor', part: p });
    sfxPop();
  };

  return (
    <div className="screen">
      <div className="scroll">
        <div className="row" style={{ paddingTop: 4 }}>
          <button className="ibtn" onClick={() => go('intro')}>‹</button>
          <div className="grow">
            <div className="kicker">{t('cabinet')}</div>
            <div className="h2">{t('cabinetTitle')}</div>
          </div>
          <button className="ibtn" style={{ background: 'var(--yolk)', color: '#16161c', borderColor: '#e6bc00' }} onClick={addPart}>＋</button>
        </div>
        <p className="faint" style={{ fontSize: 12.5, fontWeight: 800, margin: '4px 2px 10px' }}>{t('cabinetSub')}</p>

        {/* part-type dropdown (item 14) */}
        <div className="row mt8" style={{ gap: 8 }}>
          <select className="drop grow" value={filter} onChange={(e) => setFilter(e.target.value)}
            aria-label={t('filterAll')}>
            {filters.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
          </select>
        </div>
        {/* chemistry on its own second line, styled like the practice button */}
        <button className="opt" style={{ width: '100%', marginTop: 8, padding: 13 }}
          onClick={() => setSheet({ type: 'chemistry' })}>
          <span className="opt-k" style={{ background: 'var(--surface2)', fontSize: 18 }}>⚗️</span>
          <span className="grow" style={{ fontSize: 14.5 }}>{t('chemistry')}</span>
        </button>

        <div className="part-grid mt16">
          {list.map((p) => (
            <div key={p.id} className="part-card" onClick={() => setSheet({ type: 'part', id: p.id })}>
              <button className="star-btn pc-star" onClick={(e) => { e.stopPropagation(); toggleStar(p.id); }}
                style={{ color: p.star ? 'var(--yolk)' : 'var(--text-faint)' }}>★</button>
              <span className="pc-fam" style={{ background: familyColor(p.family) }}>
                {FAMILY_LABELS[p.family].icon}
              </span>
              <div className="pc-art"><Character traits={p.traits} lite showShadow={false} /></div>
              <div className="pc-name">{p.name}</div>
              <div className="pc-role">{p.role}</div>
              <div className="energy-strip"><i style={{ width: `${p.energy}%`, background: familyColor(p.family) }} /></div>
            </div>
          ))}
          {list.length === 0 && (
            <div className="card center" style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 34 }}>🔭</div>
              <p className="sub mt8">{tr('sw17', lang)}</p>
            </div>
          )}
        </div>

        <div className="card mt24">
          <div className="row">
            <div className="grow">
              <div className="kicker" style={{ color: 'var(--accent-text)' }}>📅 {t('appointments')}</div>
              <p className="sub mt6" style={{ fontSize: 12 }}>{t('myAppointmentsSub')}</p>
            </div>
            <button className="btn small" onClick={() => setOverlay(user?.linked ? 'booking' : 'login')}>＋ {t('bookSession')}</button>
          </div>
          {appointmentsError && <p className="faint mt8" role="alert" style={{ color: 'var(--danger, #b54a4a)', fontSize: 12 }}>{appointmentsError}</p>}
          {appointmentsLoading ? <p className="faint mt12" role="status">{t('loading')}</p> : appointments.length === 0 ? (
            <p className="sub mt12">{t(user?.linked ? 'noAppointments' : 'bookingLoginRequired')}</p>
          ) : appointments.map((appointment) => (
            <div key={appointment.id} className="card flat mt10">
              <div className="row">
                <b className="grow">{appointment.therapistEmail || appointment.therapistUid.slice(0, 12)}</b>
                <span className="chip">{t(`status${appointment.status[0].toUpperCase()}${appointment.status.slice(1)}`)}</span>
              </div>
              <div className="faint mt8" style={{ fontSize: 12 }}>{appointmentDate(appointment.start)}</div>
              {(appointment.status === 'pending' || appointment.status === 'approved') && (
                <button className="btn ghost block mt10" disabled={cancelling === appointment.id} onClick={() => cancelAppointment(appointment.id)}>
                  {cancelling === appointment.id ? '⏳ …' : t('cancelAppointment')}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="card mt16">
          <div className="kicker" style={{ color: 'var(--accent-text)' }}>☁ {t('cloudMapTitle')}</div>
          <p className="sub mt8" style={{ fontSize: 12.5 }}>{t('cloudMapConsent')}</p>
          {!user?.linked ? (
            <button className="btn block mt12" onClick={() => setOverlay('login')}>🔐 {t('loginT')}</button>
          ) : (
            <div className="row mt12" style={{ gap: 8 }}>
              <button className="btn primary grow" disabled={!profile || cloudBusy} onClick={saveToCloud}>
                {cloudBusy ? '⏳ …' : t('cloudSaveButton')}
              </button>
              <button className="btn grow" disabled={cloudBusy} onClick={loadCloudHistory}>
                {t('cloudLoadButton')}
              </button>
            </div>
          )}
          {cloudMessage && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{cloudMessage}</p>}
          {cloudHistory.map((entry) => (
            <div key={entry.id || entry.createdAt} className="card flat mt10">
              <div className="row">
                <div className="grow">
                  <b style={{ fontSize: 13 }}>{entry.profile?.headlineConstellation || t('resultsTitle')}</b>
                  <div className="faint mt4" style={{ fontSize: 11 }}>{new Date(entry.createdAt).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}</div>
                </div>
                <button className="btn small" onClick={() => restoreCloudSnapshot(entry)}>{t('cloudRestoreButton')}</button>
              </div>
            </div>
          ))}
        </div>
        {adminAccess && (
          <button className="card mt16 row" style={{ width: '100%', textAlign: 'left', borderColor: 'var(--accent)' }} onClick={() => setOverlay('admin')}>
            <span className="opt-k" style={{ background: 'var(--surface2)', fontSize: 18 }}>🛡️</span>
            <span className="grow">
              <span className="kicker" style={{ color: 'var(--accent-text)' }}>{t('adminTools')}</span>
              <span className="sub" style={{ display: 'block', fontSize: 12 }}>{t('adminToolsSub')}</span>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        )}
      </div>
    </div>
  );
}

function sfxPop() { try { import('../pal/sfx.ts').then((m) => m.sfx.pop()); } catch { /* noop */ } }

/* ═══════════ Part sheet ═══════════ */
export function PartSheet({ id }) {
  const { t, lang, parts, setParts, setSheet, setOverlay, premium, toast } = useApp();
  const p = parts.find((x) => x.id === id);
  const [v, setV] = useState(p?.role ?? '');
  if (!p) return null;
  const save = () => {
    setParts(parts.map((x) => (x.id === p.id ? { ...p, role: v } : x)));
    toast('✓ ' + t('save'));
  };
  return (
    <Sheet open onClose={() => setSheet(null)}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ width: 110, flex: '0 0 110px' }} className="animate-idle">
          <Character traits={p.traits} />
        </div>
        <div className="grow" style={{ paddingTop: 8 }}>
          <div className="kicker" style={{ color: familyColor(p.family) }}>
            {FAMILY_LABELS[p.family][lang]} · {p.since}
          </div>
          <div className="h2" style={{ fontSize: 24, marginTop: 3 }}>{p.name}</div>
          <div className="row mt8" style={{ gap: 8 }}>
            <Crest family={p.family} size={26} />
            <div className="chip" style={{ fontSize: 12 }}>⚡ {p.energy}%</div>
            <button className="star-btn" style={{ color: p.star ? 'var(--yolk)' : 'var(--text-faint)' }}
              onClick={() => setParts(parts.map((x) => (x.id === p.id ? { ...p, star: !p.star } : x)))}>★</button>
          </div>
        </div>
      </div>

      <div className="card flat mt16" style={{ background: 'var(--surface)' }}>
        <div className="kicker">{t('role')}</div>
        <div className="field" style={{ marginTop: 6 }}>
          <input value={v} onChange={(e) => setV(e.target.value)} onBlur={save} placeholder={t('rolePh')} />
        </div>
      </div>

      <div className="mt16">
        {[
          ['burden', p.burden, '🪨'],
          ['need', p.need, '🌱'],
          ['voice', p.voice, '🎧'],
        ].map(([k, val, ico]) => (
          <div key={k} className="row" style={{ padding: '12px 4px', borderBottom: '1.5px solid var(--line)' }}>
            <span style={{ fontSize: 19 }}>{ico}</span>
            <div className="grow">
              <div className="faint" style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>{t(k)}</div>
              <div style={{ fontWeight: 700, fontSize: 14.5, marginTop: 2 }}>{val}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="kicker mt16">{t('burden')} · {PART_COPY[p.family][lang]}</div>

      <div className="row mt16" style={{ gap: 10 }}>
        <button className="btn grow" onClick={() => setSheet({ type: 'editor', part: p })}>✎ {t('editPart')}</button>
        <button className="btn grow" onClick={() => setSheet({ type: 'chemistry', from: p.id })}>⚗️ {t('chemistry')}</button>
      </div>
      <button className="btn ghost block mt12" onClick={() => setOverlay('coach')}>✨ {t('coach')}</button>
    </Sheet>
  );
}

/* ═══════════ Part editor (shape/eyes/mouth/color/family) ═══════════ */
export function PartEditor({ part }) {
  const { t, lang, parts, setParts, setSheet, toast } = useApp();
  const [draft, setDraft] = useState({ ...part });
  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const commit = () => {
    setParts(parts.map((x) => (x.id === draft.id ? draft : x)));
    toast('✓ ' + t('save'));
    setSheet({ type: 'part', id: draft.id });
  };
  return (
    <Sheet open title={t('editPart')} onClose={() => setSheet(null)}>
      <div className="row">
        <div style={{ width: 120, flex: '0 0 120px' }} className="animate-idle">
          <Character traits={draft.traits} />
        </div>
        <div className="grow">
          <div className="field"><label>{t('nameLabel')}</label>
            <input value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
          </div>
          <div className="field"><label>{t('familyLabel')}</label>
            <select className="drop" value={draft.family}
              onChange={(e) => patch({ family: e.target.value, traits: { ...draft.traits, color: familyColor(e.target.value) } })}>
              {['manager', 'firefighter', 'exile', 'resource'].map((f) => (
                <option key={f} value={f}>{FAMILY_LABELS[f].icon} {FAMILY_LABELS[f][lang]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt16">
        <CustomizerLike traits={draft.traits} onChange={(tr2) => patch({ traits: { ...draft.traits, ...tr2 } })} />
      </div>

      <div className="row mt16" style={{ gap: 10 }}>
        <button className="btn ghost grow" onClick={() => setSheet(null)}>{t('cancel')}</button>
        <button className="btn primary grow" onClick={commit}>{t('save')}</button>
      </div>
    </Sheet>
  );
}

/* ═══════════ Chemistry (pick 2 parts → run → output) ═══════════ */
export function Chemistry({ from }) {
  const { t, lang, parts, setSheet, premium, openPaywall } = useApp();
  const [sel, setSel] = useState(() => (from && parts.some((x) => x.id === from) ? [from] : []));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const toggle = (id) => {
    setResult(null);
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-2)));
  };

  const run = () => {
    if (sel.length !== 2) return;
    setBusy(true);
    setTimeout(() => {
      const [a, b] = sel.map((id) => parts.find((p) => p.id === id));
      const tension = Math.round(((a.energy + b.energy) / 2) * (a.family === b.family ? 0.7 : 1.15)) % 100;
      const sameFam = a.family === b.family;
      setResult({
        tension: Math.min(97, tension + 8),
        label: sameFam
          ? (lang === 'ru' ? `Однородный альянс: ${FAMILY_LABELS[a.family][lang]}` : `Same-family alliance: ${FAMILY_LABELS[a.family][lang]}`)
          : (tr('sw18', lang)),
        body: lang === 'ru'
          ? (sameFam
              ? `${a.name} и ${b.name} держат одну смену — усиливают друг друга: ${a.family === 'manager' ? 'планирование' : a.family === 'firefighter' ? 'спасение' : a.family === 'exile' ? 'тоску' : 'покой'}. Одного сигнала хватает, чтобы включить обоих.`
              : `${a.name} (${FAMILY_LABELS[a.family][lang]}) отвечает на ${b.name} (${FAMILY_LABELS[b.family][lang]}). Пара — петля регуляции: когда один растёт, задача второго — приглушить громкость. Поблагодарите обоих.`)
          : (sameFam
              ? `${a.name} and ${b.name} run the same shift — they amplify each other's ${a.family === 'manager' ? 'planning' : a.family === 'firefighter' ? 'rescue' : a.family === 'exile' ? 'longing' : 'calm'}. One signal is enough to trigger both.`
              : `${a.name} (${FAMILY_LABELS[a.family][lang]}) counters ${b.name} (${FAMILY_LABELS[b.family][lang]}). The pair is a regulation loop: when one rises, the other's job is to lower the volume. Thank both.`),
        advice: tension > 60
          ? (tr('sw19', lang))
          : (tr('sw20', lang)),
      });
      setBusy(false);
      try { import('../pal/sfx.ts').then((m) => m.sfx.boing()); } catch { /* */ }
    }, 700);
  };

  return (
    <Sheet open title={`⚗️ ${t('chemistry')}`} onClose={() => setSheet(null)}>
      <p className="faint" style={{ fontSize: 12.5, fontWeight: 800, margin: '0 2px 10px' }}>{t('pickTwo')} ({sel.length}/2)</p>
      <div className="part-grid">
        {parts.map((p) => {
          const on = sel.includes(p.id);
          return (
            <button key={p.id} className="part-card" style={on ? { borderColor: 'var(--accent)', boxShadow: '0 6px 0 #8a6d0088' } : undefined}
              onClick={() => toggle(p.id)}>
              <div className="pc-art" style={{ height: 74 }}>
                <Character traits={p.traits} lite showShadow={false} />
              </div>
              <div className="pc-name" style={{ fontSize: 13.5 }}>{on ? '✓ ' : ''}{p.name}</div>
            </button>
          );
        })}
      </div>

      <button className="btn primary block mt16" disabled={sel.length !== 2 || busy} onClick={run}>
        {busy ? '✨ …' : t('runChem')}
      </button>

      {result && (
        <div className="card mt16" style={{ borderColor: 'var(--accent)', animation: 'screen-in .35s' }}>
          <div className="row">
            <div className="grow">
              <div className="kicker" style={{ color: 'var(--accent-text)' }}>{t('chemistryOut')}</div>
              <div className="h2" style={{ fontSize: 18, marginTop: 4 }}>{result.label}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30 }}>{result.tension}%</div>
          </div>
          <div className="bar y mt8"><i style={{ width: `${result.tension}%` }} /></div>
          <p className="sub mt12">{result.body}</p>
          <p style={{ fontWeight: 900, color: 'var(--accent-text)', marginTop: 8, fontSize: 14 }}>→ {result.advice}</p>
        </div>
      )}
    </Sheet>
  );
}

/* ═══════════ Charter sheet (check-in deliverable) ═══════════ */
export function CharterSheet() {
  const { t, lang, setSheet } = useApp();
  const lines = React.useMemo(() => store_getCharter(), []);
  return (
    <Sheet open title={t('charter')} onClose={() => setSheet(null)}>
      {lines.length === 0 && <p className="sub center" style={{ padding: 20 }}>{tr('sw21', lang)}</p>}
      {lines.map((l, i) => (
        <div key={i} className="card flat mb12">
          <div className="kicker">{l.date}</div>
          <p style={{ fontWeight: 700, marginTop: 6 }}>{l.text}</p>
        </div>
      ))}
    </Sheet>
  );
}

function store_getCharter() {
  try { return JSON.parse(localStorage.getItem('ifs.charter') || '[]'); } catch { return []; }
}
