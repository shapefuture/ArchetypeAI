import React, { useEffect, useState } from 'react';
import { useApp } from '../app.jsx';
import { ClinicalReport } from './clinical-report.jsx';
import { LegacyClinicalReport } from './legacy-report.jsx';
import { buildLegacyReportData, applyLegacyAiAnalysis } from './legacy-report-data';
import { sanitizeLegacyAiAnalysis } from '../core/legacy-ai-analysis';
import { validProfile } from '../core/profile-contract';
import { TRANSLATIONS } from '../../shared/i18n/strings';

/** Reuse complete reports without touching the specialist's own profile or starting AI requests. */
export function SpecialistReport({ snapshot, onBack, clientLabel }) {
  const { lang } = useApp();
  const [legacy, setLegacy] = useState(null);
  const responses = snapshot.responses ?? snapshot.source?.responses;
  useEffect(() => {
    setLegacy(null);
    if (!Array.isArray(responses) || responses.length !== 64 || !responses.every((n) => Number.isInteger(n) && n >= 1 && n <= 5)) return;
    const local = buildLegacyReportData(responses, lang);
    const original = snapshot.results ?? snapshot.source?.results;
    try {
      const ai = original?.aiAnalysis ?? (original?.analysis && original?.pantheon ? original : null);
      setLegacy(ai && (!original.language || original.language === lang) ? applyLegacyAiAnalysis(local, sanitizeLegacyAiAnalysis(ai)) : local);
    } catch { setLegacy(local); }
  }, [snapshot, responses, lang]);
  if (snapshot.profile?.testModel === 'angular-v2' && validProfile(snapshot.profile)) return <ClinicalReport profile={snapshot.profile} readOnly embedded onBack={onBack} clientLabel={clientLabel} />;
  if (legacy) return <LegacyClinicalReport result={legacy} responses={responses} lang={lang} resultCopy={TRANSLATIONS[lang].assessment.results} readOnly embedded onBack={onBack} scoringMethod={legacy.aiAnalysis ? 'fallback' : 'deterministic'} />;
  return <p className="sub">{lang === 'ru' ? 'Полный отчёт недоступен в этой версии записи. Можно скачать исходную копию.' : 'A complete report is unavailable in this snapshot version. You can download the source copy.'}</p>;
}
