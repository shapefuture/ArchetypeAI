import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../app.jsx';
import { Character } from '../pal/Character.tsx';
import { FAMILY_LABELS, randomTraits, pid, SHAPES, EYES, MOUTHS, HEADS, FACES } from '../pal/traits.ts';
import { familyColor, Crest, Seg, Bars } from '../ui/ui.jsx';
import { t as tr, EXERCISE_COPY, UNIVERSE_DIMENSIONS_COPY } from '../i18n/strings.ts';
import { AI } from '../core/ai.adapter.ts';
import { filterUniverseParts, normalizedEnergy, searchUniverseParts } from '../core/universe-controls.ts';
import { claimTherapistLink, linkedClients, setClientArchived, assignExercise } from '../core/therapist-link.ts';
import { ensureTherapistBusySlots, getTherapistProfile, therapistAppointments, setAppointmentStatus } from '../core/booking.ts';

const DIMENSION_AXES = [
  { key: 'AGENCY', label: 'agency', low: 'agencyHypo', high: 'agencyHyper', icon: '⚡', color: '#6ED6FF' },
  { key: 'TEMPERATURE', label: 'temperature', low: 'temperatureHypo', high: 'temperatureHyper', icon: '🔥', color: '#FF8A1F' },
  { key: 'FOCUS', label: 'focus', low: 'focusHypo', high: 'focusHyper', icon: '🎯', color: '#8BE03A' },
  { key: 'ATTACHMENT', label: 'attachment', low: 'attachmentHypo', high: 'attachmentHyper', icon: '🧲', color: '#FFD000' },
];
const DIMENSION_KEY = 'ifs.universe.dimensions.v1';
const ZERO_DIMENSIONS = { AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 };

function readUniverseDimensions() {
  try {
    const saved = JSON.parse(localStorage.getItem(DIMENSION_KEY) ?? 'null');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return ZERO_DIMENSIONS;
    return Object.fromEntries(Object.keys(ZERO_DIMENSIONS).map((key) => {
      const value = Number(saved[key]);
      return [key, Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0];
    }));
  } catch { return ZERO_DIMENSIONS; }
}

/* ═══════════ Innerverse (universe chrome lives in app.jsx) ═══════════ */
export function Innerverse() {
  const {
    t, lang, parts, profile, setParts, setOverlay, setSheet, toast,
    universeMode, setUniverseMode, go, premium, openPaywall, uniRef, uniReady, downloadBackup,
  } = useApp();
  const [q, setQ] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [studio, setStudio] = useState(false);
  const [studioIdea, setStudioIdea] = useState('');
  const [compare, setCompare] = useState([]);
  const [dims, setDims] = useState({ energy: 100 });
  const [dimensions, setDimensions] = useState(readUniverseDimensions);
  const [famOn, setFamOn] = useState({ manager: true, firefighter: true, exile: true, resource: true });
  const dimensionCopy = UNIVERSE_DIMENSIONS_COPY[lang];

  const visible = useMemo(() => filterUniverseParts(parts, famOn, dims.energy), [parts, famOn, dims.energy]);
  const searchMatches = useMemo(() => searchUniverseParts(parts, q, lang).slice(0, 8), [parts, q, lang]);
  const storyParts = useMemo(() => [...visible]
    .sort((a, b) => normalizedEnergy(b) - normalizedEnergy(a)).slice(0, 3), [visible]);
  const storyEssay = lang === 'ru'
    ? profile?.constellationEssayRu || profile?.constellationEssay || ''
    : profile?.constellationEssayEn || profile?.constellationEssay || '';
  const storyHeadline = lang === 'ru'
    ? profile?.headlineRu || profile?.headlineConstellation
    : profile?.headlineConstellation;

  useEffect(() => {
    try { localStorage.setItem(DIMENSION_KEY, JSON.stringify(dimensions)); } catch { /* lens is a local preference */ }
  }, [dimensions]);

  useEffect(() => {
    if (!uniReady || !uniRef?.current) return;
    uniRef.current.setParts(visible);
    uniRef.current.setDimensions(dimensions);
  }, [uniReady, uniRef, visible, dimensions]);

  const openStudio = (idea = '') => {
    setStudioIdea(idea);
    setStudio(true);
    setQ('');
  };

  const openPart = (part) => {
    setSheet({ type: 'part', id: part.id });
    setQ('');
  };

  const summon = () => {
    if (!q.trim()) return;
    if (searchMatches[0]) {
      openPart(searchMatches[0]);
      return;
    }
    // Search never fabricates a scored part. A new character must be created
    // deliberately in the AI Archetype Studio and confirmed before saving.
    openStudio(q.trim());
  };

  const toggleFamily = (family) => setFamOn((current) => ({ ...current, [family]: !current[family] }));

  const toggleCompare = (id) => {
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-2)));
  };

  return (
    <div className="screen" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', paddingTop: 42 }}>
      {/* top bar */}
      <div className="row" style={{ padding: '14px 16px 0', pointerEvents: 'auto', position: 'relative', zIndex: 40 }}>
        <div className="uni-search row grow" style={{ gap: 8 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && summon()}
            placeholder={t('summon')} />
          {q && <button className="ibtn" style={{ width: 34, height: 34, fontSize: 15 }} onClick={summon}>✦</button>}
        </div>
        <button className="ibtn" onClick={() => setDrawer(true)}>⚙</button>
        <button className="ibtn" onClick={() => setOverlay('help')}>?</button>
        <button className="ibtn" onClick={() => setOverlay('coach')}>✨</button>
        <button className="ibtn" onClick={() => go('intro')}>‹</button>
      </div>
      {q.trim() && (
        <div className="card" role="listbox" aria-label={lang === 'ru' ? 'Результаты поиска частей' : 'Part search results'}
          style={{ position: 'absolute', top: 94, left: 16, right: 16, zIndex: 55, pointerEvents: 'auto', maxHeight: 230, overflowY: 'auto', background: 'rgba(13,14,24,.96)' }}>
          {searchMatches.map((part) => (
            <button key={part.id} type="button" role="option" aria-selected="false" className="row" onClick={() => openPart(part)}
              style={{ width: '100%', padding: '9px 4px', textAlign: 'left', color: 'var(--text)', borderBottom: '1px solid var(--line)' }}>
              <span style={{ color: familyColor(part.family) }}>{FAMILY_LABELS[part.family].icon}</span>
              <span className="grow" style={{ marginLeft: 8, fontWeight: 850 }}>{lang === 'ru' ? part.nameRu ?? part.name : part.nameEn ?? part.name}</span>
              <span className="faint" style={{ fontSize: 10 }}>{FAMILY_LABELS[part.family][lang]}</span>
            </button>
          ))}
          {searchMatches.length === 0 && <p className="sub" style={{ padding: 8 }}>{lang === 'ru' ? 'Совпадений нет. Новую часть можно создать в Студии архетипов.' : 'No match. Create a new character deliberately in Archetype Studio.'}</p>}
          <button type="button" className="btn ghost small block mt8" onClick={() => openStudio(q.trim())}>🎨 {lang === 'ru' ? 'Создать в Студии архетипов' : 'Create in Archetype Studio'}</button>
        </div>
      )}

      {/* segmented mode */}
      <div className="row" style={{ padding: '10px 16px 0', gap: 8, pointerEvents: 'auto', position: 'relative', zIndex: 40, overflowX: 'auto' }}>
        <Seg value={universeMode} onChange={setUniverseMode} options={[
          { v: 'parts', l: t('uniAll') },
          { v: 'clusters', l: t('uniClusters') },
          { v: 'stories', l: t('uniStories') },
        ]} />
      </div>

      {universeMode === 'parts' && (
        <div className="row" style={{ position: 'absolute', left: 0, right: 0, bottom: 86, padding: '0 16px', gap: 8, overflowX: 'auto', pointerEvents: 'auto', zIndex: 30 }}>
          {visible.slice(0, 8).map((part) => (
            <button key={part.id} className="chip" style={{ flex: '0 0 auto', background: 'rgba(7,7,10,.72)', borderColor: familyColor(part.family), color: 'var(--text)', backdropFilter: 'blur(6px)' }}
              onClick={() => toggleCompare(part.id)}>
              {compare.includes(part.id) ? '✓ ' : ''}{FAMILY_LABELS[part.family].icon} {lang === 'ru' ? part.nameRu ?? part.name : part.nameEn ?? part.name}
            </button>
          ))}
          {visible.length === 0 && <span className="chip" style={{ flex: '0 0 auto', opacity: .8 }}>{tr('sw23', lang)}</span>}
        </div>
      )}

      {universeMode === 'clusters' && (
        <div className="row wrap" style={{ position: 'absolute', left: 14, right: 14, bottom: 86, justifyContent: 'center', gap: 8, pointerEvents: 'auto', zIndex: 30 }}>
          {['manager', 'firefighter', 'exile', 'resource'].map((family) => (
            <button key={family} className={`chip ${famOn[family] ? 'on' : ''}`} onClick={() => toggleFamily(family)}
              style={{ flex: '0 0 auto', borderColor: familyColor(family), color: famOn[family] ? '#16161c' : familyColor(family) }}>
              {FAMILY_LABELS[family].icon} {FAMILY_LABELS[family][lang]} · {parts.filter((part) => part.family === family).length}
            </button>
          ))}
        </div>
      )}

      {universeMode === 'stories' && (
        <div className="card" style={{ position: 'absolute', left: 16, right: 16, top: 112, maxHeight: 'calc(100% - 225px)', overflowY: 'auto', zIndex: 32, pointerEvents: 'auto', background: 'rgba(13,14,24,.94)' }}>
          <div className="kicker">{storyHeadline || t('universe')}</div>
          {storyEssay && <p className="sub mt8">{storyEssay}</p>}
          {!storyEssay && <p className="sub mt8">{lang === 'ru' ? 'Изучите части с наибольшей энергией и откройте любую для подробностей.' : 'Meet the most energized visible parts; open any one for its detail card.'}</p>}
          {storyParts.map((part) => (
            <button key={part.id} className="row mt8" onClick={() => setSheet({ type: 'part', id: part.id })}
              style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 12, color: 'var(--text)', textAlign: 'left' }}>
              <span style={{ color: familyColor(part.family) }}>{FAMILY_LABELS[part.family].icon}</span>
              <span className="grow" style={{ marginLeft: 8, fontWeight: 900 }}>{lang === 'ru' ? part.nameRu ?? part.name : part.nameEn ?? part.name}</span>
              <span className="chip" style={{ fontSize: 10 }}>{Math.round(normalizedEnergy(part))}%</span>
            </button>
          ))}
          <p className="faint mt8" style={{ fontSize: 10 }}>{lang === 'ru' ? 'История — приглашение к саморефлексии, а не диагноз.' : 'A story is an invitation to reflect, not a diagnosis.'}</p>
        </div>
      )}

      {/* bottom action tray */}
      <div className="row" style={{ position: 'absolute', left: 16, right: 16, bottom: 22, gap: 9, pointerEvents: 'auto', zIndex: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="tray-btn" onClick={() => openStudio()}>🎨 {t('archetype')}</button>
        <button className="tray-btn" onClick={() => setOverlay('synastry')}>💞 {t('synastry')}</button>
        <button className="tray-btn" onClick={() => { downloadBackup(); toast('⬇ ' + t('saveBackup')); }}>💾 {t('saveBackup')}</button>
        <button className="tray-btn" onClick={() => setOverlay('practice')}>🏋️ {t('practice')}</button>
        <button className="tray-btn" onClick={() => premium ? setDrawer(true) : openPaywall()}>📊 {t('compare')}</button>
        <button className="tray-btn" onClick={() => setSheet({ type: 'chemistry' })}>⚗️</button>
      </div>

      {/* compare tray */}
      {compare.length === 2 && (
        <div className="card" style={{ position: 'absolute', left: 16, right: 16, top: 118, zIndex: 45, pointerEvents: 'auto', animation: 'screen-in .3s', background: 'rgba(13,14,24,.94)' }}>
          <div className="kicker">{t('compare')}</div>
          <div className="row mt8" style={{ gap: 10 }}>
            {compare.map((id) => {
              const p = parts.find((x) => x.id === id);
              if (!p) return null;
              return (
                <div key={id} className="grow center">
                  <div style={{ width: 56, margin: '0 auto' }}><Character traits={p.traits} lite showShadow={false} /></div>
                  <div style={{ fontWeight: 900, fontSize: 13 }}>{p.name}</div>
                  <div className="faint" style={{ fontSize: 11, fontWeight: 800 }}>⚡{p.energy}% · {FAMILY_LABELS[p.family][lang]}</div>
                </div>
              );
            })}
            <button className="ibtn" onClick={() => setCompare([])}>✕</button>
          </div>
        </div>
      )}

      {/* filters drawer */}
      {drawer && (
        <div className="overlay" style={{ zIndex: 60 }} onClick={() => setDrawer(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <div className="row">
              <div className="kicker grow">{t('filters')}</div>
              <button className="ibtn" onClick={() => setDrawer(false)}>✕</button>
            </div>
            <div className="mt16">
              <div className="row">
                <span style={{ fontWeight: 900, fontSize: 14 }}>{t('energy')}</span>
                <span className="grow" />
                <span className="faint" style={{ fontWeight: 900, fontSize: 12 }}>{dims.energy}%</span>
              </div>
              <input aria-label={t('energy')} type="range" min={0} max={100} value={dims.energy}
                style={{ width: '100%', accentColor: '#FFD000' }}
                onChange={(event) => setDims({ energy: Number(event.target.value) })} />
            </div>

            <div className="card flat mt16">
              <div className="kicker">{lang === 'ru' ? 'Четырёхмерная линза' : 'Four-dimensional lens'}</div>
              <p className="faint mt6" style={{ fontSize: 10, lineHeight: 1.5 }}>
                {lang === 'ru'
                  ? 'Сдвигайте группы в пространстве. Линза меняет только визуализацию и не пересчитывает ответы или профиль.'
                  : 'Shift the families through the map. This lens changes the visualization only; it does not change answers or scores.'}
              </p>
              {DIMENSION_AXES.map((axis) => (
                <div key={axis.key} className="mt12">
                  <div className="row">
                    <span style={{ fontWeight: 900, fontSize: 12 }}>{axis.icon} {dimensionCopy[axis.label]}</span>
                    <span className="grow" />
                    <b className="faint" style={{ fontSize: 11 }}>{dimensions[axis.key] > 0 ? '+' : ''}{Math.round(dimensions[axis.key] * 100)}%</b>
                  </div>
                  <input aria-label={dimensionCopy[axis.label]} type="range" min={-100} max={100} step={1}
                    value={Math.round(dimensions[axis.key] * 100)} style={{ width: '100%', accentColor: axis.color }}
                    onChange={(event) => setDimensions((current) => ({ ...current, [axis.key]: Number(event.target.value) / 100 }))} />
                  <div className="row" style={{ justifyContent: 'space-between', fontSize: 10, fontWeight: 800 }}>
                    <span>{dimensionCopy[axis.low]}</span><span>{dimensionCopy[axis.high]}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="kicker mt24">{t('cluster')}</div>
            <div className="row wrap mt8" style={{ gap: 8 }}>
              {['manager', 'firefighter', 'exile', 'resource'].map((f) => (
                <button key={f} className={`chip ${famOn[f] ? 'on' : ''}`}
                  style={{ borderColor: familyColor(f), color: famOn[f] ? '#16161c' : familyColor(f) }}
                  onClick={() => toggleFamily(f)}>
                  {FAMILY_LABELS[f].icon} {FAMILY_LABELS[f][lang]}
                </button>
              ))}
            </div>
            <button className="btn primary block mt24" onClick={() => setDrawer(false)}>{t('close')}</button>
          </div>
        </div>
      )}

      {/* Archetype Studio */}
      {studio && (
        <ArchetypeStudio initialIdea={studioIdea} onClose={() => setStudio(false)}
          onCreate={(p) => { setParts([...parts, p]); setStudio(false); toast('🎨 ' + p.name); }} />
      )}
    </div>
  );
}

/* ═══════════ Archetype Studio (AI create) ═══════════ */
function ArchetypeStudio({ initialIdea = '', onClose, onCreate }) {
  const { t, lang, toast } = useApp();
  const [idea, setIdea] = useState(initialIdea);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);

  const generate = async () => {
    if (!idea.trim()) return;
    setBusy(true);
    try {
      const line = await AI.archetypeCreate(idea);
      let model = null;
      try {
        const json = line.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        const match = json.match(/\{[\s\S]*\}/);
        if (match) model = JSON.parse(match[0]);
      } catch { /* keep a plain-text model response usable */ }
      const families = ['manager', 'firefighter', 'exile', 'resource'];
      const fam = families.includes(model?.family)
        ? model.family
        : families[Math.abs(line.length + idea.length) % families.length];
      const baseTraits = randomTraits(fam);
      const traits = model ? {
        ...baseTraits,
        shape: SHAPES.includes(model.shape) ? model.shape : baseTraits.shape,
        color: /^#[\da-f]{6}$/i.test(model.color ?? '') ? model.color : baseTraits.color,
        eyes: EYES.includes(model.eyes) ? model.eyes : baseTraits.eyes,
        mouth: MOUTHS.includes(model.mouth) ? model.mouth : baseTraits.mouth,
        head: HEADS.includes(model.head) ? model.head : baseTraits.head,
        face: FACES.includes(model.face) ? model.face : baseTraits.face,
        bow: typeof model.bow === 'boolean' ? model.bow : baseTraits.bow,
        cheeks: typeof model.cheeks === 'boolean' ? model.cheeks : baseTraits.cheeks,
      } : baseTraits;
      const nm = (model?.title || model?.name || line.split(/—|–|-|:/)[0] || idea).trim().slice(0, 24) || tr('sw24', lang);
      const desc = (model?.role || model?.description || idea).trim().slice(0, 90);
      setDraft({
        id: pid(), name: nm,
        family: fam, traits, role: desc,
        blurb: '', energy: 55, burden: '—', need: '—', voice: '—', star: false, since: 'today',
      });
    } catch {
      const fam = 'manager';
      setDraft({ id: pid(), name: idea.slice(0, 18) || 'New part', family: fam, traits: randomTraits(fam), role: idea.slice(0, 60), blurb: '', energy: 50, burden: '—', need: '—', voice: '—', star: false, since: 'today' });
    }
    setBusy(false);
  };

  return (
    <div className="overlay" style={{ zIndex: 70 }} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="row">
          <div className="kicker grow">🎨 {t('archetype')}</div>
          <button className="ibtn" onClick={onClose}>✕</button>
        </div>
        <p className="sub mt8">{tr('sw25', lang)}</p>
        <div className="field mt12">
          <div className="field">
            <input value={idea} onChange={(e) => setIdea(e.target.value)} placeholder={tr('sw26', lang)} />
          </div>
        </div>
        <button className="btn primary block mt12" disabled={busy || !idea.trim()} onClick={generate}>
          {busy ? '✨ …' : t('archetype')}
        </button>

        {draft && (
          <div className="card mt16 center" style={{ animation: 'screen-in .3s' }}>
            <div style={{ width: 96, margin: '0 auto' }} className="animate-idle">
              <Character traits={draft.traits} />
            </div>
            <div className="h2" style={{ fontSize: 19, marginTop: 8 }}>{draft.name}</div>
            <div className="kicker" style={{ color: familyColor(draft.family) }}>{FAMILY_LABELS[draft.family][lang]}</div>
            <p className="sub mt8">{draft.role}</p>
            <div className="row mt12" style={{ gap: 10 }}>
              <button className="btn ghost grow" onClick={() => setDraft(null)}>⟲</button>
              <button className="btn primary grow" onClick={() => onCreate(draft)}>✓ {t('save')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ Specialist (therapist) view ═══════════ */
export function SpecialistView() {
  const { t, lang, go, toast, setOverlay, user } = useApp();
  const [tab, setTab] = useState('claims');
  const [attested, setAttested] = useState(() => { try { return localStorage.getItem('ifs.attested') === '1'; } catch { return false; } });
  const [inviteCode, setInviteCode] = useState('');
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [appointmentBusy, setAppointmentBusy] = useState('');
  const [error, setError] = useState('');
  const [assignFor, setAssignFor] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const [frequency, setFrequency] = useState('once');
  const [refreshKey, setRefreshKey] = useState(0);
  const exerciseIds = useMemo(() => Object.keys(EXERCISE_COPY), []);
  const activeClients = clients.filter((client) => !client.archived);
  const archivedClients = clients.filter((client) => client.archived);
  const pendingAppointments = appointments.filter((appointment) => appointment.status === 'pending');
  const summaryClients = activeClients.filter((client) => client.summary);
  const checkInsDone = summaryClients.reduce((sum, client) => sum + (Number(client.summary?.adherence?.done) || 0), 0);
  const checkInsSkipped = summaryClients.reduce((sum, client) => sum + (Number(client.summary?.adherence?.skipped) || 0), 0);
  const selfEnergyValues = summaryClients.map((client) => Number(client.summary?.selfEnergy)).filter(Number.isFinite);
  const meanSelfEnergy = selfEnergyValues.length
    ? Math.round(selfEnergyValues.reduce((sum, value) => sum + value, 0) / selfEnergyValues.length)
    : null;
  const dayLabels = t('availDays').split(',');

  useEffect(() => {
    if (!attested || !user?.linked || !user.uid) {
      setClients([]);
      setAppointments([]);
      setAvailability(null);
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError('');
    Promise.allSettled([
      linkedClients(user.uid),
      therapistAppointments(user.uid),
      getTherapistProfile(user.uid),
    ]).then((results) => {
      if (!active) return;
      const [clientResult, appointmentResult, availabilityResult] = results;
      if (clientResult.status === 'fulfilled') setClients(clientResult.value);
      else setClients([]);
      if (appointmentResult.status === 'fulfilled') {
        setAppointments(appointmentResult.value);
        ensureTherapistBusySlots(user.uid, appointmentResult.value).catch((err) => {
          console.error('Could not backfill busy-slot projection', err);
          if (active) setError(t('therapistSaveFailed'));
        });
      } else setAppointments([]);
      if (availabilityResult.status === 'fulfilled') setAvailability(availabilityResult.value);
      else setAvailability(null);
      if (results.some((result) => result.status === 'rejected')) setError(t('therapistLoadFailed'));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attested, user?.uid, user?.linked, refreshKey, t]);

  const refresh = () => setRefreshKey((value) => value + 1);

  const claim = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!user?.linked || !user.uid || code.length < 6 || busy) return;
    setBusy(true);
    setError('');
    try {
      const summary = await claimTherapistLink(user.uid, code);
      if (!summary) setError(t('badCode'));
      else {
        setInviteCode('');
        toast('✓ ' + t('acceptClaim'));
        refresh();
        setTab('clients');
      }
    } catch (err) {
      console.error('Therapist invite claim failed', err);
      setError(t('badCode'));
    } finally {
      setBusy(false);
    }
  };

  const archiveClient = async (clientUid, archived) => {
    if (!user?.linked || !user.uid || busy) return;
    setBusy(true);
    setError('');
    try {
      await setClientArchived(user.uid, clientUid, archived);
      toast('✓ ' + t(archived ? 'clientArchived' : 'clientRestored'));
      refresh();
    } catch (err) {
      console.error('Client archive update failed', err);
      setError(t('therapistSaveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const decideAppointment = async (appointmentId, status) => {
    if (!user?.linked || appointmentBusy) return;
    setAppointmentBusy(appointmentId);
    setError('');
    try {
      await setAppointmentStatus(appointmentId, status);
      toast('✓ ' + t(status === 'approved' ? 'appointmentApproved' : 'appointmentDeclined'));
      refresh();
    } catch (err) {
      console.error('Appointment update failed', err);
      setError(t('therapistSaveFailed'));
    } finally {
      setAppointmentBusy('');
    }
  };

  const sendAssignment = async (clientUid) => {
    if (!user?.linked || !user.uid || !exerciseId || busy) return;
    setBusy(true);
    setError('');
    try {
      const saved = await assignExercise(user.uid, clientUid, { exerciseId, frequency });
      if (!saved) {
        setError(t('exerciseSafetyGate'));
        return;
      }
      toast('✓ ' + t('assignedExercise'));
      setAssignFor('');
      setExerciseId('');
    } catch (err) {
      console.error('Exercise assignment failed', err);
      setError(t('therapistSaveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const appointmentDate = (value) => {
    const date = new Date(`${value}:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', {
      weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const clientCard = (client, archived = false) => (
    <div key={client.clientUid} className="card flat mt12">
      <div className="row" style={{ alignItems: 'flex-start', gap: 8 }}>
        <div className="grow">
          <b style={{ fontSize: 14 }}>{client.clientEmail || client.clientUid.slice(0, 12)}</b>
          <div className="faint mt4" style={{ fontSize: 11 }}>{client.clientUid.slice(0, 12)} · {new Date(client.linkedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}</div>
        </div>
        <button className="btn small ghost" disabled={busy} onClick={() => archiveClient(client.clientUid, !archived)}>
          {archived ? t('restore') : t('archive')}
        </button>
      </div>
      {client.summary ? (
        <div className="card flat mt10" style={{ padding: 11 }}>
          <div className="kicker" style={{ color: 'var(--accent-text)' }}>{client.summary.headline}</div>
          <div className="row wrap mt8" style={{ gap: 6 }}>
            <span className="chip">{t('burden')}: {Math.round(Number(client.summary.burden) || 0)}</span>
            <span className="chip">{t('energy')}: {Math.round(Number(client.summary.selfEnergy) || 0)}</span>
            <span className="chip">{t('activeComplexes')}: {client.summary.activeComplexes?.length ?? 0}</span>
          </div>
          <div className="faint mt8" style={{ fontSize: 11.5 }}>
            {Object.keys(client.summary.parts ?? {}).length} {t('parts')} · {Number(client.summary.adherence?.done) || 0} {t('checkinsDone')}
          </div>
        </div>
      ) : <p className="faint mt8" style={{ fontSize: 12 }}>{t('clientSummaryNotShared')}</p>}
      {!archived && (
        <>
          <button className="btn block mt10" onClick={() => setAssignFor(assignFor === client.clientUid ? '' : client.clientUid)}>
            🏋️ {t('assignExercise')}
          </button>
          {assignFor === client.clientUid && (
            <div className="card flat mt10">
              <label className="field">
                <span>{t('chooseExercise')}</span>
                <select className="drop mt6" value={exerciseId} onChange={(event) => setExerciseId(event.target.value)}>
                  <option value="">—</option>
                  {exerciseIds.map((id) => <option key={id} value={id}>{id.toUpperCase()} · {EXERCISE_COPY[id]?.[lang]}</option>)}
                </select>
              </label>
              <label className="field mt8">
                <span>{t('frequency')}</span>
                <select className="drop mt6" value={frequency} onChange={(event) => setFrequency(event.target.value)}>
                  <option value="once">{t('frequencyOnce')}</option>
                  <option value="daily">{t('frequencyDaily')}</option>
                  <option value="weekly">{t('frequencyWeekly')}</option>
                  <option value="after-trigger">{t('frequencyAfterTrigger')}</option>
                </select>
              </label>
              <button className="btn primary block mt10" disabled={!exerciseId || busy} onClick={() => sendAssignment(client.clientUid)}>
                {busy ? '⏳ …' : t('sendAssignment')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (!attested) {
    return (
      <div className="screen">
        <div className="scroll">
          <div className="row" style={{ paddingTop: 4 }}>
            <button className="ibtn" onClick={() => go('assessment-results')}>‹</button>
            <div className="grow kicker">{t('therapist')}</div>
          </div>
          <div className="card mt24" style={{ borderColor: 'var(--accent)' }}>
            <div className="kicker" style={{ color: 'var(--accent-text)' }}>🪪 {t('attest')}</div>
            <p className="sub mt8">{tr('attestB2', lang)}</p>
            <button className="btn primary block mt16" onClick={() => { setAttested(true); try { localStorage.setItem('ifs.attested', '1'); } catch { /* */ } toast('✓ ' + t('attest')); }}>
              {t('attest')}
            </button>
            <button className="btn ghost block mt12" onClick={() => go('assessment-results')}>{t('close')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="scroll">
        <div className="row" style={{ paddingTop: 4 }}>
          <button className="ibtn" onClick={() => go('assessment-results')}>‹</button>
          <div className="grow kicker">{t('therapist')}</div>
          <button className="ibtn" title={t('availT')} onClick={() => setOverlay('therapist')}>⚙</button>
          <button className="ibtn" onClick={() => setOverlay('help')}>?</button>
        </div>

        {!user?.linked && (
          <div className="card flat mt12">
            <p className="sub">{t('therapistLoginRequired')}</p>
            <button className="btn primary block mt12" onClick={() => setOverlay('login')}>🔐 {t('loginT')}</button>
          </div>
        )}
        {error && <p className="card flat mt12" role="alert" style={{ color: 'var(--danger, #b54a4a)', fontSize: 12 }}>{error}</p>}
        {loading && <p className="faint mt12" role="status">{t('loading')}</p>}

        <div className="tabs mt16">
          {[
            ['claims', t('claims')], ['avail', t('availability')], ['clients', t('clients')],
            ['metrics', t('metrics')], ['appts', t('appointments')],
          ].map(([value, label]) => (
            <button key={value} className={tab === value ? 'on' : ''} onClick={() => setTab(value)}>{label}</button>
          ))}
        </div>

        {tab === 'claims' && (
          <div className="mt16">
            <div className="card flat">
              <div className="kicker">{t('claimTherapistCode')}</div>
              <p className="sub mt8">{t('claimTherapistCodeHint')}</p>
              <label className="field mt12">
                <span>{t('code')}</span>
                <input value={inviteCode} maxLength={10} autoCapitalize="characters" placeholder="ABCD2345EF"
                  onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                  onKeyDown={(event) => event.key === 'Enter' && claim()} />
              </label>
              <button className="btn primary block mt12" disabled={busy || !user?.linked || inviteCode.trim().length < 6} onClick={claim}>
                {busy ? '⏳ …' : t('claimTherapistCode')}
              </button>
            </div>
            <div className="card flat mt16">
              <div className="kicker">{t('clientList')} · {activeClients.length}</div>
              {activeClients.length ? activeClients.slice(0, 4).map((client) => (
                <div key={client.clientUid} className="row" style={{ padding: '10px 0', borderBottom: '1.5px solid var(--line)' }}>
                  <span className="grow"><b>{client.clientEmail || client.clientUid.slice(0, 12)}</b></span>
                  <span className="faint" style={{ fontSize: 11 }}>{client.summary ? t('summaryShared') : t('bookingLink')}</span>
                </div>
              )) : <p className="sub mt8">{t('noLinkedClients')}</p>}
            </div>
          </div>
        )}

        {tab === 'avail' && (
          <div className="mt16">
            <div className="card flat">
              <div className="row">
                <div className="grow"><div className="kicker">{t('availT')}</div><p className="sub mt8">{t('availSub')}</p></div>
                <button className="btn small" onClick={() => setOverlay('therapist')}>{t('edit')}</button>
              </div>
              {!availability ? <p className="sub mt12">{t('therapistNoAvailability')}</p> : dayLabels.map((label, index) => {
                const window = availability.availability.find((item) => item.days.includes(index + 1));
                return (
                  <div key={label} className="row" style={{ padding: '10px 0', borderBottom: '1.5px solid var(--line)' }}>
                    <b className="grow" style={{ fontSize: 13 }}>{label}</b>
                    <span className="faint" style={{ fontSize: 12 }}>{window ? `${window.start}–${window.end}` : t('unavailable')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'clients' && (
          <div className="mt16">
            <div className="row">
              <div className="kicker grow">{t('clientList')} · {activeClients.length}</div>
              <button className="btn small" onClick={refresh} disabled={loading}>{t('refresh')}</button>
            </div>
            {activeClients.length ? activeClients.map((client) => clientCard(client)) : <p className="sub mt12">{t('noLinkedClients')}</p>}
            {archivedClients.length > 0 && (
              <details className="card flat mt16">
                <summary className="kicker" style={{ cursor: 'pointer' }}>{t('archive')} · {archivedClients.length}</summary>
                {archivedClients.map((client) => clientCard(client, true))}
              </details>
            )}
          </div>
        )}

        {tab === 'metrics' && (
          <div className="mt16">
            <div className="card flat">
              <div className="kicker">{t('metrics')}</div>
              {[
                [tr('sw36', lang), activeClients.length],
                [tr('sw37', lang), checkInsDone],
                [tr('sw38', lang), checkInsDone + checkInsSkipped ? `${Math.round(checkInsDone * 100 / (checkInsDone + checkInsSkipped))}%` : '—'],
                [tr('sw39', lang), meanSelfEnergy == null ? '—' : `${meanSelfEnergy}%`],
                [t('pendingAppointments'), pendingAppointments.length],
              ].map(([label, value]) => (
                <div key={label} className="row" style={{ padding: '12px 0', borderBottom: '1.5px solid var(--line)' }}>
                  <span className="grow" style={{ fontWeight: 800 }}>{label}</span>
                  <b style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{value}</b>
                </div>
              ))}
              <p className="faint mt12" style={{ fontSize: 11 }}>{t('metricsFromSharedSummaries')}</p>
            </div>
          </div>
        )}

        {tab === 'appts' && (
          <div className="mt16">
            {appointments.length === 0 ? <p className="sub">{t('therapistNoAppointments')}</p> : appointments.map((appointment) => (
              <div key={appointment.id} className="card flat mt10">
                <div className="row">
                  <b className="grow">{appointment.clientEmail || appointment.clientUid.slice(0, 12)}</b>
                  <span className="chip">{t(`status${appointment.status[0].toUpperCase()}${appointment.status.slice(1)}`)}</span>
                </div>
                <div className="faint mt8" style={{ fontSize: 12 }}>{appointmentDate(appointment.start)}</div>
                {appointment.status === 'pending' && (
                  <div className="row mt10" style={{ gap: 8 }}>
                    <button className="btn primary grow" disabled={appointmentBusy === appointment.id} onClick={() => decideAppointment(appointment.id, 'approved')}>
                      {t('appointmentApprove')}
                    </button>
                    <button className="btn ghost grow" disabled={appointmentBusy === appointment.id} onClick={() => decideAppointment(appointment.id, 'declined')}>
                      {t('appointmentDecline')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
