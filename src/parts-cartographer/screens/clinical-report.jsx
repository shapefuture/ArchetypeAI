import React, { useMemo, useState } from 'react';
import { useApp } from '../app.jsx';
import { Character } from '../pal/Character';
import { familyColor } from '../ui/ui.jsx';
import { store, KEYS } from '../core/local-store';
import { buildClinicalMarkdown, clinicalAttachmentStyle, clinicalSubtype, downloadText, shownNeed, sortedClinicalParts } from '../core/clinical-report';
import { adaptClinicalProfile, withPersonEdits } from '../core/clinical-profile-adapter';
import { validClinicalScore } from '../core/profile-contract';
import { DESCENT_DRAFT_KEY, LEGACY_DESCENT_DRAFT_KEY } from '../core/assessment-draft';
import { STRINGS } from '../../shared/i18n/strings';
import { PART_COPY, LAYERS } from '../../shared/core/data/part-copy';
import { RESOURCES, SELF_QUALITIES, RESOURCE_BANDS, partClass, COMPLEXES } from '../../shared/core/data/parts';
import { constellationEssay, constellationName, polarizationName, resourceName, COMPLEX_COPY_RU } from '../../shared/core/data/constellation-copy';
import { attributionRatio } from '../../shared/core/data/state-v2';
import { buildLayout } from '../../shared/core/data/constellation-layout';

/** The canonical Descent report uses the same score, text and layout as Angular, with React's cards. */
export function ClinicalReport({ profile: supplied, readOnly = false, embedded = false, onBack, clientLabel = '' }) {
  const app = useApp();
  const { lang, t, user, parts, go, setOverlay, setSheet, setParts, setProfile, downloadBackup } = app;
  const profile = supplied ?? app.profile;
  const p = profile.clinical;
  const ui = STRINGS.innerverseReport.ui[lang];
  const [layers, setLayers] = useState({});
  const [preview, setPreview] = useState(null);
  const savedFuture = readOnly ? [] : store.load('INNERVERSE_FUTURE_SELF_V1', []);
  const futureSelf = Array.isArray(savedFuture) ? savedFuture.filter((answer) => typeof answer === 'string') : [];
  const savedVerdicts = readOnly ? [] : store.load('INNERVERSE_SEALED_VERDICTS_V1', []);
  const texts = Array.isArray(savedVerdicts) ? savedVerdicts.map((v) => v?.text).filter((text) => typeof text === 'string' && text) : [];
  const vane = texts.length ? attributionRatio(texts, lang) : null;
  const layout = useMemo(() => buildLayout(p), [p]);
  const sorted = sortedClinicalParts(p);
  const need = shownNeed(p);
  const displayParts = useMemo(() => supplied ? adaptClinicalProfile(p, lang).parts : parts, [supplied, p, lang, parts]);
  const partName = (id) => clinicalSubtype(p, id, lang);
  const section = (id, title, content, sub) => <section id={`clinical-${id}`} className="card flat mt16" aria-labelledby={`clinical-heading-${id}`}><h2 id={`clinical-heading-${id}`} className="h2" style={{ fontSize: 18 }}>{title}</h2>{sub && <p className="sub mt8">{sub}</p>}{content}</section>;
  const bar = (value, label) => <div className="bar y mt6" role="meter" aria-label={label} aria-valuemin={20} aria-valuemax={80} aria-valuenow={value}><i style={{ width: `${Math.max(0, Math.min(100, (value - 20) / 60 * 100))}%` }} /></div>;
  const openPart = (id) => { if (!readOnly) setSheet({ type: 'part', id }); };
  const restoreHistory = (entry) => {
    const rebuilt = adaptClinicalProfile(entry.clinical, lang);
    const ids = new Set(rebuilt.parts.map((part) => part.id));
    // The archived report's scores are the restored ones; what the person did to a part (typed name, role, family, look, star) stays.
    const kept = rebuilt.parts.map((part) => withPersonEdits(part, parts.find((item) => item.id === part.id)));
    setParts([...kept, ...parts.filter((part) => !ids.has(part.id) && !String(part.id).startsWith('seed-'))]);
    setProfile({ ...rebuilt.profile, createdAt: entry.createdAt }, { archive: false });
    setPreview(null);
  };
  const retake = () => {
    // An unfinished 147-item test is only deleted with consent.
    const hasDraft = [DESCENT_DRAFT_KEY, LEGACY_DESCENT_DRAFT_KEY].some((key) => { try { return localStorage.getItem(key) !== null; } catch { return false; } });
    if (hasDraft && !window.confirm(ui.retakeDraftConfirm)) return;
    store.remove(DESCENT_DRAFT_KEY); store.remove(LEGACY_DESCENT_DRAFT_KEY);
    go('full-assessment');
  };
  if (preview) return <ClinicalReport profile={preview} readOnly onBack={() => setPreview(null)} />;

  return <div className={embedded ? "report-embedded" : "screen"}><div className="scroll no-dock">
    <div className="row"><button className="ibtn" aria-label={ui.back} onClick={onBack ?? (() => go('intro'))}>‹</button><div className="grow kicker">{readOnly ? t('adminViewSnapshot') : ui.report}{clientLabel && ` · ${clientLabel}`}</div>
      <button className="btn small" onClick={() => downloadText(buildClinicalMarkdown(p, lang, futureSelf), 'innerverse-report.md')}>{lang === 'ru' ? 'Скачать отчёт' : 'Download report'}</button></div>
    <header className="mt16"><p className="kicker">{ui.constellationOf}</p><h1 className="h1 mt8">{constellationName(p.headline, lang)}</h1><p className="sub mt12">{constellationEssay(p.headline, lang)}</p><p className="sub mt8">{partName(p.headline.protector)} {ui.and} {partName(p.headline.exile)}</p></header>
    <nav className="row wrap mt12" aria-label={ui.report} style={{ gap: 8 }}>{[['parts', ui.partsByTier], ['self', ui.selfEnergy], ['coping', ui.copingStack], ['resources', ui.resources]].map(([id, label]) => <a className="chip" key={id} href={`#clinical-${id}`}>{label}</a>)}</nav>
    {p.crisis && <aside className="card mt12" role="status" style={{ borderColor: 'var(--danger, #FF3B4E)' }}>{t('crisisSupport')}</aside>}
    {section('strength', ui.strongestResource, <><div className="h2 mt12">{resourceName(p.strongestResource.id, lang)}</div><p className="sub mt8">{ui.strongestResourceSub(resourceName(p.strongestResource.id, lang))}</p></>)}
    <svg viewBox="0 0 320 320" className="mt16" style={{ width: '100%' }} role={readOnly ? "img" : "group"} aria-label={ui.constellationOf}>
      {layout.guardLines.map((line, i) => { const a = layout.stars.find((s) => s.id === line.from); const b = layout.stars.find((s) => s.id === line.to); return <line key={`g${i}`} x1={a.x * 320} y1={a.y * 320} x2={b.x * 320} y2={b.y * 320} stroke="currentColor" opacity={0.14} />; })}
      {layout.tensionArcs.map((arc, i) => { const a = layout.stars.find((s) => s.id === arc.a); const b = layout.stars.find((s) => s.id === arc.b); return <line key={`t${i}`} x1={a.x * 320} y1={a.y * 320} x2={b.x * 320} y2={b.y * 320} stroke="#FF8A1F" strokeDasharray="3 3" />; })}
      {layout.leakArcs.map((arc, i) => { const a = layout.stars.find((star) => star.id === arc.from); const b = layout.stars.find((star) => star.id === arc.to); return <line key={`leak-${i}`} x1={a.x * 320} y1={a.y * 320} x2={b.x * 320} y2={b.y * 320} stroke="#FFD000" strokeDasharray="5 4"><title>{ui.leak(partName(arc.to))}</title></line>; })}
      {layout.complexGlows.map((glow) => <polygon key={glow.id} points={glow.parts.map((id) => layout.stars.find((star) => star.id === id)).filter(Boolean).map((star) => `${star.x * 320},${star.y * 320}`).join(' ')} fill="#8B6CFF" opacity={.1}><title>{lang === 'ru' ? COMPLEX_COPY_RU[glow.id]?.name ?? glow.name : glow.name}</title></polygon>)}
      {layout.self.spokes.map((spoke) => <line key={spoke.quality} x1={160} y1={160} x2={160 + Math.cos(spoke.angle) * spoke.length * 320} y2={160 + Math.sin(spoke.angle) * spoke.length * 320} stroke="#FFD000"><title>{lang === 'ru' ? STRINGS.innerverseReport.qualityLabelsRu[spoke.quality] : spoke.quality}: {p.selfRadar[spoke.quality]}</title></line>)}
      {layout.stars.map((star) => <g key={star.id} role={readOnly ? undefined : 'button'} tabIndex={readOnly ? undefined : 0} aria-label={partName(star.id)} onClick={() => openPart(star.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPart(star.id); } }}><circle cx={star.x * 320} cy={star.y * 320} r={star.radius * 320} fill={star.color} /><title>{partName(star.id)}</title></g>)}
      <circle cx={160} cy={160} r={layout.self.radius * 320} fill="#FFD000" /><text x={160} y={164} textAnchor="middle" fontSize={11}>{lang === 'ru' ? 'Я' : 'Self'}</text>
      {futureSelf.some((a) => a.trim()) && <text x={layout.northStar.x * 320} y={layout.northStar.y * 320} fill="#FFD000" fontSize={20}>✦<title>{futureSelf.join(' ')}</title></text>}
    </svg>
    {section('self', ui.selfEnergy, <><div className="h2 mt8">{p.selfEnergy}/100</div><p className="sub mt8">{ui.burden} · {Math.round(p.burden)}</p><p className="sub mt8">{ui.radar}</p>{SELF_QUALITIES.map((q) => <div key={q} className="mt12"><div className="row"><span className="grow">{lang === 'ru' ? STRINGS.innerverseReport.qualityLabelsRu[q] : q}</span><b>{p.selfRadar[q]}</b></div>{bar(p.selfRadar[q], lang === 'ru' ? STRINGS.innerverseReport.qualityLabelsRu[q] : q)}</div>)}<h3 className="kicker mt16">{ui.vane}</h3>{vane ? <><div className="bar mt8"><i style={{ width: `${100 - Math.min(100, (vane.ratio === Infinity ? 3 : vane.ratio) / 3 * 100)}%` }} /></div><p className="sub mt8">{ui.vaneEssence} ↔ {ui.vaneBehavior}</p></> : <p className="sub mt8">{ui.vaneEmpty}</p>}<p className="sub mt16">{ui.attachment}: <b>{ui.attStyle[clinicalAttachmentStyle(p)]}</b></p></>)}
    {section('parts', ui.partsByTier, <div className="part-grid mt12">{sorted.map((id) => { const layer = layers[id] ?? 'face'; const part = displayParts.find((x) => x.id === id); return <button className="part-card" key={id} onClick={() => setLayers((value) => ({ ...value, [id]: LAYERS[(LAYERS.indexOf(layer) + 1) % LAYERS.length] }))}><div className="pc-art">{part?.traits && <Character traits={part.traits} lite showShadow={false} />}</div><b>{partName(id)}</b><p className="faint mt4">{ui.tierNames[p.parts[id].tier]} · T {Math.round(p.parts[id].T)}</p><span className="chip mt8">{STRINGS.innerverseReport.layerLabels[lang][layer]}</span><p className="sub mt8">{PART_COPY[lang][id][layer]}</p></button>; })}</div>, ui.flipHint)}
    {p.polarizations.length > 0 && section('polarizations', ui.polarizations, p.polarizations.map((pol) => <div className="mt12" key={pol.name}><b>{partName(pol.pair[0])} ↔ {partName(pol.pair[1])}</b><p className="sub mt6">{polarizationName(pol.name, lang)}</p></div>), ui.polarizationSub)}
    {section('complexes', ui.complexes, p.activeComplexes.length ? p.activeComplexes.map((c) => { const def = lang === 'ru' ? COMPLEX_COPY_RU[c.id] : COMPLEXES[c.id]; return <div className="mt12" key={c.id}><b>{def.name}</b><span className="chip">{ui.complexTierNames[c.tier]} · {Math.round(c.activation)}</span><p className="sub mt8">{ui.complexBelief}: “{def.belief}”</p><p className="sub mt8">{ui.complexExperiment}: {def.experiment}</p></div>; }) : <p className="sub mt8">{ui.noComplexes}</p>, ui.complexesSub)}
    {section('coping', ui.copingStack, <ol className="mt12">{[p.copingStack.l1, p.copingStack.l2, p.copingStack.l3, p.copingStack.floor].filter(Boolean).map((id, i) => <li className="mt12" key={`${id}-${i}`}><b>{partName(id)}</b>{id === p.copingStack.floor ? <p className="sub">{ui.floorLabel} · {STRINGS.innerverseReport.exileBeliefs[id]?.[lang === 'ru' ? 1 : 0]}</p> : <p className="sub">{ui.whenFails}</p>}</li>)}</ol>)}
    {need ? section('needs', ui.needs, <><h3 className="h2 mt8">{lang === 'ru' ? STRINGS.innerverseReport.needLabelsRu[need.need] : need.need}</h3><p className="sub mt8">{STRINGS.innerverseReport.needPractice[lang][need.need]}</p></>, ui.needsSub) : section('needs', ui.needs, <p className="sub mt8">{ui.needsNone}</p>)}
    {section('resources', ui.resources, RESOURCES.map((id) => <div className="mt12" key={id}><div className="row"><b className="grow">{resourceName(id, lang)}</b><span className="chip">{ui.band[p.resources[id].band]} · T {Math.round(p.resources[id].T)}</span></div>{bar(p.resources[id].T, resourceName(id, lang))}{p.resourceLeaks.some((leak) => leak.resource === id) && <p className="sub mt8">{ui.leak(p.resourceLeaks.filter((leak) => leak.resource === id).map((leak) => partName(leak.spillPart)).join(', '))}</p>}</div>), ui.resourcesSub)}
    {p.validity.flags.length > 0 && section('validity', t('validityFlags'), p.validity.flags.map((flag) => <p key={flag} className="sub mt8">{t(flag === 'attention' ? 'validityAttentionFlag' : 'validityInfrequencyFlag')}</p>))}
    {futureSelf.some((a) => a.trim()) && section('future', lang === 'ru' ? 'Будущее «я»' : 'Future Self', futureSelf.map((answer, i) => <p className="sub mt8" key={i}>{answer}</p>))}
    {!readOnly && <>
      {section('continue', ui.continueTitle, <><button className="btn primary block mt12" onClick={() => go('universe')}>🌌 {t('seeUniverse')}</button><button className="btn block mt12" onClick={downloadBackup}>{ui.localCta}</button>{user?.linked ? <><button className="btn block mt12" onClick={() => go('cabinet')}>{ui.cabinetCta}</button><button className="btn block mt12" onClick={() => setOverlay('practice')}>{ui.practiceCta}</button><button className="btn block mt12" onClick={() => setOverlay('share')}>{ui.specialistCta}</button></> : <button className="btn block mt12" onClick={() => setOverlay('login')}>{ui.saveCta}</button>}<button className="btn ghost block mt12" onClick={retake}>{t('retake')}</button></>)}
      {section('history', t('history'), store.history(KEYS.history).filter((entry) => validClinicalScore(entry?.clinical)).reverse().slice(0, 10).map((entry, i) => {
        const reportName = constellationName(entry.clinical.headline, lang);
        const when = new Date(entry.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US');
        // The buttons name the report they act on, so two rows never read the same to a screen reader.
        return <div className="row mt12" key={i}><span className="grow">{reportName}<small className="sub"> · {when}</small></span><button className="btn small" aria-label={`${t('viewReport')}: ${reportName} · ${when}`} onClick={() => setPreview(entry)}>{t('viewReport')}</button><button className="btn small" aria-label={`${t('restore')}: ${reportName} · ${when}`} onClick={() => restoreHistory(entry)}>{t('restore')}</button></div>;
      }))}
    </>}
    <footer className="sub mt24">{ui.ethics}</footer>
  </div></div>;
}
