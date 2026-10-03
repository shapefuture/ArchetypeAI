import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../app.jsx';
import { Character } from '../pal/Character.tsx';
import { FAMILY_LABELS, randomTraits, pid, SHAPES, EYES, MOUTHS, HEADS, FACES } from '../pal/traits.ts';
import { familyColor, Crest, Seg, Bars } from '../ui/ui.jsx';
import { t as tr } from '../i18n/strings.ts';
import { AI } from '../core/ai.adapter.ts';

/* ═══════════ Innerverse (universe chrome lives in app.jsx) ═══════════ */
export function Innerverse() {
  const { t, lang, parts, setParts, setOverlay, setSheet, toast, universeMode, setUniverseMode, go, premium, openPaywall } = useApp();
  const [q, setQ] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [studio, setStudio] = useState(false);
  const [compare, setCompare] = useState([]);
  const [dims, setDims] = useState({ energy: 100, burden: 100, closeness: 100, voice: 100 });
  const [famOn, setFamOn] = useState({ manager: true, firefighter: true, exile: true, resource: true });

  const visible = parts.filter((p) =>
    famOn[p.family] &&
    p.energy <= dims.energy &&
    (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.role.toLowerCase().includes(q.toLowerCase())));

  const summon = () => {
    if (!q.trim()) return;
    const fams = ['manager', 'firefighter', 'exile', 'resource'];
    const fam = fams[Math.floor(Math.random() * 4)];
    const name = q.trim().replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 18) || 'Part';
    const p = {
      id: pid(), name,
      family: fam, traits: randomTraits(fam), role: tr('sw22', lang),
      blurb: '', energy: 30 + Math.floor(Math.random() * 50), burden: '—', need: '—', voice: '—',
      star: false, since: 'today',
    };
    setParts([...parts, p]);
    setQ('');
    toast('✨ ' + t('summon') + ' · ' + p.name);
    try { import('../pal/sfx.ts').then((m) => m.sfx.pop()); } catch { /* */ }
  };

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

      {/* segmented mode */}
      <div className="row" style={{ padding: '10px 16px 0', gap: 8, pointerEvents: 'auto', position: 'relative', zIndex: 40, overflowX: 'auto' }}>
        <Seg value={universeMode} onChange={setUniverseMode} options={[
          { v: 'parts', l: t('uniAll') },
          { v: 'clusters', l: t('uniClusters') },
          { v: 'stories', l: t('uniStories') },
        ]} />
      </div>

      {/* visible part chips (AR-style labels) */}
      <div className="row" style={{ position: 'absolute', left: 0, right: 0, bottom: 86, padding: '0 16px', gap: 8, overflowX: 'auto', pointerEvents: 'auto', zIndex: 30 }}>
        {visible.slice(0, 8).map((p) => (
          <button key={p.id} className="chip" style={{ flex: '0 0 auto', background: 'rgba(7,7,10,.72)', borderColor: familyColor(p.family), color: 'var(--text)', backdropFilter: 'blur(6px)' }}
            onClick={() => toggleCompare(p.id)}>
            {compare.includes(p.id) ? '✓ ' : ''}{FAMILY_LABELS[p.family].icon} {p.name}
          </button>
        ))}
        {visible.length === 0 && <span className="chip" style={{ flex: '0 0 auto', opacity: .8 }}>{tr('sw23', lang)}</span>}
      </div>

      {/* bottom action tray */}
      <div className="row" style={{ position: 'absolute', left: 16, right: 16, bottom: 22, gap: 9, pointerEvents: 'auto', zIndex: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="tray-btn" onClick={() => setStudio(true)}>🎨 {t('archetype')}</button>
        <button className="tray-btn" onClick={() => setOverlay('synastry')}>💞 {t('synastry')}</button>
        <button className="tray-btn" onClick={() => { try { const blob = JSON.stringify({ parts, at: Date.now() }); navigator.clipboard?.writeText(blob); toast('💾 ' + t('saveBackup')); } catch { /* */ } }}>💾 {t('saveBackup')}</button>
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
            {[
              ['energy', t('energy')],
              ['burden', t('burden')],
              ['closeness', t('closeness')],
              ['voice', t('voiceVol')],
            ].map(([k, label]) => (
              <div key={k} className="mt16">
                <div className="row">
                  <span style={{ fontWeight: 900, fontSize: 14 }}>{label}</span>
                  <span className="grow" />
                  <span className="faint" style={{ fontWeight: 900, fontSize: 12 }}>{dims[k]}%</span>
                </div>
                <input type="range" min={10} max={100} value={dims[k]} style={{ width: '100%', accentColor: '#FFD000' }}
                  onChange={(e) => setDims({ ...dims, [k]: +e.target.value })} />
              </div>
            ))}
            <div className="kicker mt24">{t('cluster')}</div>
            <div className="row wrap mt8" style={{ gap: 8 }}>
              {['manager', 'firefighter', 'exile', 'resource'].map((f) => (
                <button key={f} className={`chip ${famOn[f] ? 'on' : ''}`}
                  style={{ borderColor: familyColor(f), color: famOn[f] ? '#16161c' : familyColor(f) }}
                  onClick={() => setFamOn({ ...famOn, [f]: !famOn[f] })}>
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
        <ArchetypeStudio onClose={() => setStudio(false)}
          onCreate={(p) => { setParts([...parts, p]); setStudio(false); toast('🎨 ' + p.name); }} />
      )}
    </div>
  );
}

/* ═══════════ Archetype Studio (AI create) ═══════════ */
function ArchetypeStudio({ onClose, onCreate }) {
  const { t, lang, toast } = useApp();
  const [idea, setIdea] = useState('');
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
  const { t, lang, go, toast, setOverlay } = useApp();
  const [tab, setTab] = useState('claims');
  const [attested, setAttested] = useState(() => { try { return localStorage.getItem('ifs.attested') === '1'; } catch { return false; } });
  const [days] = useState(() => {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() + i * 864e5);
      out.push({ iso: d.toISOString().slice(0, 10), free: [9, 11, 16, 18].filter(() => Math.random() > 0.35) });
    }
    return out;
  });

  const claims = [
    { id: 'u_9f2a', name: 'Mira K.', focus: tr('sw27', lang), days: 12 },
    { id: 'u_31bc', name: 'Tom R.', focus: tr('sw28', lang), days: 5 },
    { id: 'u_77de', name: 'Ana P.', focus: tr('sw29', lang), days: 30 },
  ];

  const accept = (att) => {
    try {
      const list = JSON.parse(localStorage.getItem('ifs.claims') || '[]');
      list.push(att);
      localStorage.setItem('ifs.claims', JSON.stringify(list));
    } catch { /* */ }
    toast('✓ ' + t('acceptClaim'));
  };

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
          <button className="ibtn" onClick={() => setOverlay('help')}>?</button>
        </div>

        <div className="tabs mt16">
          {[['claims', t('claims')], ['avail', t('availability')], ['clients', t('clients')], ['metrics', t('metrics')], ['appts', t('appointments')]].map(([v, l]) => (
            <button key={v} className={tab === v ? 'on' : ''} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>

        {tab === 'claims' && (
          <div className="mt16">
            {claims.map((c) => (
              <div key={c.id} className="card flat mb12">
                <div className="row">
                  <div className="grow">
                    <div style={{ fontWeight: 900 }}>{c.name}</div>
                    <div className="faint" style={{ fontSize: 12, fontWeight: 800 }}>{c.focus} · {c.days}d</div>
                  </div>
                  <button className="btn" style={{ background: '#10B981', color: '#fff', borderColor: '#0a8f66', padding: '10px 16px' }}
                    onClick={() => accept(c)}>{t('acceptClaim')}</button>
                  <button className="btn ghost" style={{ padding: '10px 14px' }}>✕</button>
                </div>
              </div>
            ))}
            <button className="btn block" onClick={() => toast('📨 ' + (tr('sw30', lang)))}>
              ＋ {t('sendRequest')}
            </button>
            <div className="card flat mt16">
              <div className="kicker">{tr('sw31', lang)}</div>
              {[
                ['u_9f2a…c31', 'supervisor@ifs.map', tr('sw32', lang)],
                ['u_31bc…9ab', 'clinic@ifs.map', tr('sw33', lang)],
              ].map(([uid, mail, acc]) => (
                <div key={uid} className="row" style={{ padding: '9px 0', borderBottom: '1.5px solid var(--line)' }}>
                  <div className="grow">
                    <b style={{ fontSize: 13 }}>{mail}</b>
                    <div className="faint" style={{ fontSize: 11, fontWeight: 800 }}>{uid} · {acc}</div>
                  </div>
                  <span style={{ color: '#3EE0B0', fontWeight: 900 }}>✓</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'avail' && (
          <div className="mt16">
            {days.map((d) => (
              <div key={d.iso} className="card flat mb12">
                <div className="row">
                  <b style={{ fontSize: 14 }}>{new Date(d.iso).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short', day: '2-digit', month: 'short' })}</b>
                  <span className="grow" />
                  <span className="faint" style={{ fontSize: 12, fontWeight: 800 }}>{d.free.length} {t('slots')}</span>
                </div>
                <div className="row wrap mt8" style={{ gap: 8 }}>
                  {d.free.map((h) => (
                    <span key={h} className="chip on" style={{ fontSize: 12 }}>{String(h).padStart(2, '0')}:00</span>
                  ))}
                  {d.free.length === 0 && <span className="chip" style={{ fontSize: 12 }}>{tr('sw34', lang)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'clients' && (
          <div className="mt16">
            {claims.map((c, i) => (
              <div key={c.id} className="card flat mb12">
                <div className="row">
                  <div className="grow">
                    <div style={{ fontWeight: 900 }}>{c.name}</div>
                    <div className="faint" style={{ fontSize: 12, fontWeight: 800 }}>{c.focus}</div>
                  </div>
                  <button className="btn ghost" style={{ padding: '9px 12px', fontSize: 12 }} onClick={() => setOverlay('therapist')}>⊞ {t('viewMatrix')}</button>
                </div>
                <div className="row mt10" style={{ gap: 8 }}>
                  <button className="btn ghost grow" style={{ padding: '9px', fontSize: 12 }} onClick={() => setOverlay('therapist')}>🤖 {t('viewReport')}</button>
                  <button className="btn ghost grow" style={{ padding: '9px', fontSize: 12 }} onClick={() => {
                    const blob = `${c.name} — IFS report\n${tr('sw35', lang)}`;
                    navigator.clipboard?.writeText(blob); toast('📄 ' + t('downloadReport'));
                  }}>⬇ {t('downloadReport')}</button>
                </div>
                <button className="btn block mt10" style={{ padding: '10px', fontSize: 13 }}
                  onClick={() => toast('🏋️ ' + t('assignExercise'))}>🏋️ {t('assignExercise')}</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'metrics' && (
          <div className="mt16">
            <div className="card flat">
              <div className="kicker">{t('metrics')}</div>
              <Bars items={[
                { k: tr('sw36', lang), v: 0.74 },
                { k: tr('sw37', lang), v: 0.88 },
                { k: tr('sw38', lang), v: 0.63 },
                { k: tr('sw39', lang), v: 0.57 },
              ]} cls="y" />
            </div>
            <div className="card flat mt16">
              <div className="kicker">{tr('sw40', lang)}</div>
              <Bars items={[
                { k: tr('sw41', lang), v: 0.42 },
                { k: tr('sw42', lang), v: 0.55 },
                { k: tr('sw43', lang), v: 0.71 },
              ]} cls="p" />
            </div>
          </div>
        )}

        {tab === 'appts' && (
          <div className="mt16">
            <div className="card flat">
              <div className="kicker">{t('appointments')}</div>
              <p className="sub mt8">{tr('sw44', lang)}</p>
              {['therapist', 'date', 'slot', 'confirm'].map((k, i) => (
                <div key={k} className="row" style={{ padding: '11px 0', borderBottom: '1.5px solid var(--line)' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 13, background: 'var(--accent)', color: '#16161c', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontSize: 13 }}>{i + 1}</span>
                  <b style={{ marginLeft: 12, fontSize: 14 }}>{[t('pickTherapist'), t('pickDate'), t('pickSlot'), t('confirmSlot')][i]}</b>
                </div>
              ))}
              <button className="btn primary block mt16" onClick={() => setOverlay('therapist')}>📅 {t('bookSession')}</button>
            </div>
          </div>
        )}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
