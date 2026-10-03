import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AI, ResilientAiAdapter } from '../core/ai.adapter';
import { parseReportMarkdown } from '../../app/features/results-panel/report-parser';
import { STRINGS as SOURCE_STRINGS, TRANSLATIONS } from '../../i18n/strings';
import {
  applyLegacyAiAnalysis,
  buildLegacyAssessmentBackup,
  buildLegacyClinicalMarkdown,
} from './legacy-report-data';
import { ASSESSMENT_QUESTIONS } from '../../app/core/data/assessment-questions';
import { negativePoleStrength, positivePoleStrength } from '../../app/core/data/scoring';

const SECTION_COPY = {
  en: {
    narrative: 'Narrative', profile: 'Dimensional profile', poles: 'Pole scores', pantheon: 'Pantheon',
    dynamics: 'System dynamics', complexes: 'Complexes', defense: 'Defense hierarchy',
    triggers: 'Trigger map', pathway: 'Integration pathway', diagnostics: 'Diagnostics',
    narrativeLoading: 'Preparing an optional AI reflection…', narrativeLocal: 'Showing the local, computed reflection.',
    narrativeCloud: 'AI-assisted reflection · scores remain locally computed.', retry: 'Retry AI reflection', cancel: 'Cancel',
    downloadBackup: 'Download backup', clinicalExport: 'Clinical report', viewUniverse: 'View in universe', retake: 'Retake', back: 'Back',
    noNarrative: 'No narrative is available.', none: 'None mapped in this result.',
    localOnly: 'The local profile and all indicators remain available without AI.',
    primary: 'Primary archetype', health: 'Relational health', disorganized: 'Disorganized attachment pattern',
    left: 'Left pole', right: 'Right pole', score: 'Score', type: 'Part type', origin: 'Developmental origin',
    wound: 'Wound', shadow: 'Shadow', invitation: 'Invitation', belief: 'Core belief', attracts: 'Attracts',
    triggerSituations: 'Situations that may activate this pattern', response: 'Possible response', underlyingWound: 'Possible underlying need or wound',
    escalation: 'Escalation paths', targetParts: 'Parts involved', window: 'Window of tolerance',
    ethics: 'A self-reflection tool, not a medical or psychiatric diagnosis. These indicators are generated from questionnaire responses and should not be treated as clinical findings.',
    scoringMethod: 'Analysis mode', deterministicMode: 'Deterministic · local', aiMode: 'AI-generated pantheon',
    aiDisclosure: 'AI mode sends the complete 64 answers to the authenticated AI service. Numeric scores and safety indicators stay locally computed; this is optional and cancellable.',
    aiRunning: 'Generating an alternate pantheon and reflection…', aiFailed: 'AI mode is unavailable. Your local deterministic result is unchanged.',
    aiCancelled: 'AI request cancelled. Your local result is unchanged.',
  },
  ru: {
    narrative: 'Нарратив', profile: 'Размерный профиль', poles: 'Оценки полюсов', pantheon: 'Пантеон',
    dynamics: 'Динамика системы', complexes: 'Комплексы', defense: 'Иерархия защит',
    triggers: 'Карта триггеров', pathway: 'Путь интеграции', diagnostics: 'Показатели',
    narrativeLoading: 'Готовим дополнительную ИИ-рефлексию…', narrativeLocal: 'Показан локальный вычисляемый текст.',
    narrativeCloud: 'Рефлексия с помощью ИИ · показатели рассчитаны локально.', retry: 'Повторить ИИ-рефлексию', cancel: 'Отменить',
    downloadBackup: 'Скачать резервную копию', clinicalExport: 'Клинический отчёт', viewUniverse: 'Открыть во вселенной', retake: 'Пройти заново', back: 'Назад',
    noNarrative: 'Нарратив недоступен.', none: 'В этом результате не сопоставлено.',
    localOnly: 'Локальный профиль и все показатели доступны и без ИИ.',
    primary: 'Основной архетип', health: 'Здоровые паттерны отношений', disorganized: 'Дезорганизованный паттерн привязанности',
    left: 'Левый полюс', right: 'Правый полюс', score: 'Оценка', type: 'Тип части', origin: 'Развитие',
    wound: 'Рана', shadow: 'Тень', invitation: 'Приглашение', belief: 'Базовое убеждение', attracts: 'Притягивает',
    triggerSituations: 'Ситуации, которые могут активировать паттерн', response: 'Возможная реакция', underlyingWound: 'Возможная потребность или рана',
    escalation: 'Пути эскалации', targetParts: 'Вовлечённые части', window: 'Окно толерантности',
    ethics: 'Инструмент для саморефлексии, не медицинская или психиатрическая диагностика. Показатели рассчитаны по ответам и не являются клиническими заключениями.',
    scoringMethod: 'Режим анализа', deterministicMode: 'Точный расчёт · локально', aiMode: 'Пантеон с помощью ИИ',
    aiDisclosure: 'В режиме ИИ все 64 ответа отправляются в защищённый ИИ-сервис. Числовые показатели и индикаторы безопасности по-прежнему рассчитываются локально; режим необязательный, запрос можно отменить.',
    aiRunning: 'Создаём альтернативный пантеон и рефлексию…', aiFailed: 'Режим ИИ недоступен. Локальный детерминированный результат не изменён.',
    aiCancelled: 'Запрос ИИ отменён. Локальный результат не изменён.',
  },
};

const AXES = [
  { en: 'Agency', ru: 'Агентность', left: 'Active', leftRu: 'Активный', right: 'Receptive', rightRu: 'Восприимчивый' },
  { en: 'Emotional temperature', ru: 'Эмоциональная температура', left: 'Composed', leftRu: 'Сдержанный', right: 'Expressive', rightRu: 'Экспрессивный' },
  { en: 'Relational focus', ru: 'Фокус отношений', left: 'Self-focused', leftRu: 'На себе', right: 'Other-focused', rightRu: 'На других' },
  { en: 'Attachment', ru: 'Привязанность', left: 'Avoidant', leftRu: 'Избегающий', right: 'Anxious', rightRu: 'Тревожный' },
];

const POLES = [
  ['agencyActive', 'agencyActive', 'agencyActive', 'negative'],
  ['agencyReceptive', 'agencyReceptive', 'agencyReceptive', 'positive'],
  ['tempHot', 'tempHot', 'tempHot', 'positive'],
  ['tempCool', 'tempCool', 'tempCool', 'negative'],
  ['focusOther', 'focusOther', 'focusOther', 'positive'],
  ['focusSelf', 'focusSelf', 'focusSelf', 'negative'],
  ['attAnxious', 'attAnxious', 'attAnxious', 'positive'],
  ['attAvoidant', 'attAvoidant', 'attAvoidant', 'negative'],
];

function clamp01(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }
function pct(value) { return Math.round(clamp01(value) * 100); }
function displayPartType(value, lang) {
  if (lang === 'ru') return SOURCE_STRINGS.resultsPanel.partTypesRu[value] ?? value;
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
function displayOrigin(value, lang) {
  if (lang === 'ru') return SOURCE_STRINGS.resultsPanel.originsRu[value] ?? value;
  return ({ pre_verbal: 'Pre-verbal', early_attachment: 'Early attachment', oedipal: 'Oedipal', latency: 'Latency', adolescent: 'Adolescent' })[value] ?? value;
}
function labelForPole(key, lang, resultCopy) {
  const translation = TRANSLATIONS[lang]?.assessment?.results?.[key];
  return translation ?? resultCopy[key] ?? key;
}
function downloadFile(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function LegacyClinicalReport({
  result, responses, resultCopy, lang, onBack, onRetake, onNarrativeChange,
  readOnly = false, embedded = false, scoringMethod = 'deterministic', aiAnalysisBusy = false, aiAnalysisError = '',
  onScoringMethodChange = () => {}, onCancelAiAnalysis = () => {}, onViewUniverse = () => {},
}) {
  const ui = SECTION_COPY[lang] ?? SECTION_COPY.en;
  const displayResult = useMemo(() => scoringMethod === 'fallback' && result.aiAnalysis
    ? applyLegacyAiAnalysis(result, result.aiAnalysis) : result, [result, scoringMethod]);
  const [narrative, setNarrative] = useState(displayResult.aiNarrative || displayResult.localNarrative || ui.noNarrative);
  const [narrativeBusy, setNarrativeBusy] = useState(false);
  const [narrativeDegraded, setNarrativeDegraded] = useState(!displayResult.aiNarrative);
  const [requestVersion, setRequestVersion] = useState(0);
  const activeRequest = useRef(null);
  const reportForExport = useMemo(() => ({
    ...displayResult,
    aiNarrative: displayResult.aiNarrative || (narrative !== displayResult.localNarrative ? narrative : undefined),
  }), [displayResult, narrative]);
  const labels = [
    ['legacy-narrative', ui.narrative], ['legacy-profile', ui.profile], ['legacy-poles', ui.poles],
    ['legacy-pantheon', ui.pantheon], ['legacy-dynamics', ui.dynamics], ['legacy-complexes', ui.complexes],
    ['legacy-defense', ui.defense], ['legacy-triggers', ui.triggers], ['legacy-pathway', ui.pathway],
    ['legacy-diagnostics', ui.diagnostics],
  ];

  useEffect(() => {
    if (scoringMethod === 'fallback' && displayResult.aiAnalysis) {
      setNarrative(displayResult.aiAnalysis.analysis);
      setNarrativeDegraded(false);
      setNarrativeBusy(false);
      return undefined;
    }
    if (displayResult.aiNarrative && requestVersion === 0) {
      setNarrative(displayResult.aiNarrative);
      setNarrativeDegraded(false);
      setNarrativeBusy(false);
      return undefined;
    }

    if (readOnly || requestVersion === 0) {
      setNarrative(displayResult.localNarrative || ui.noNarrative);
      setNarrativeDegraded(true);
      setNarrativeBusy(false);
      return undefined;
    }
    const controller = new AbortController();
    activeRequest.current = controller;
    setNarrative(displayResult.localNarrative || ui.noNarrative);
    setNarrativeBusy(true);
    setNarrativeDegraded(false);
    const summary = {
      assessment: '64-item relational self-reflection',
      language: lang,
      dimensionalCenters: displayResult.poleScores.center,
      relationalHealth: Math.round(displayResult.poleScores.healthScore * 100),
      disorganizedAttachment: displayResult.poleScores.disorganizedAttachment,
      leadingArchetypes: displayResult.archetypes.slice(0, 4).map(({ name, partType, prominence, description }) => ({ name, partType, prominence, description })),
      complexes: displayResult.complexes.slice(0, 3).map(({ name, nameRu, severity }) => ({ name: lang === 'ru' ? nameRu : name, severity: Math.round(severity * 100) })),
      systemDynamics: displayResult.dynamics.slice(0, 3).map(({ description }) => description),
      nextStep: displayResult.integrationPathway[0]
        ? (lang === 'ru' ? displayResult.integrationPathway[0].actionRu : displayResult.integrationPathway[0].action)
        : null,
      guardrail: 'Reflective language only: do not diagnose, pathologize, infer trauma, or claim certainty. Mention that computed scores are not clinical findings.',
    };

    AI.aiReport(summary, { signal: controller.signal }).then((text) => {
      if (controller.signal.aborted) return;
      const degraded = ResilientAiAdapter.degradation.degraded || ResilientAiAdapter.primary !== 'cloud';
      if (degraded || !text?.trim()) {
        setNarrative(displayResult.localNarrative || ui.noNarrative);
        setNarrativeDegraded(true);
        return;
      }
      setNarrative(text.trim());
      setNarrativeDegraded(false);
      onNarrativeChange?.(text.trim());
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setNarrative(displayResult.localNarrative || ui.noNarrative);
      setNarrativeDegraded(true);
      console.warn('Legacy assessment narrative could not be generated:', error);
    }).finally(() => {
      if (!controller.signal.aborted) setNarrativeBusy(false);
    });

    return () => {
      controller.abort();
      if (activeRequest.current === controller) activeRequest.current = null;
    };
  }, [displayResult, lang, requestVersion, readOnly, scoringMethod, ui.noNarrative, onNarrativeChange]);

  const cancelNarrative = () => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setNarrativeBusy(false);
    setNarrative(displayResult.localNarrative || ui.noNarrative);
    setNarrativeDegraded(true);
  };

  const downloadBackup = () => {
    const translations = TRANSLATIONS[lang]?.assessment?.questions ?? {};
    const backup = buildLegacyAssessmentBackup(
      responses,
      reportForExport,
      ASSESSMENT_QUESTIONS,
      (question) => {
        const sectionKey = question.section.split('.').at(-1) ?? 'agency';
        return translations[sectionKey]?.[question.text] ?? question.text;
      },
    );
    downloadFile(JSON.stringify(backup, null, 2), 'application/json', 'archetype_assessment_backup.json');
  };

  const downloadClinical = () => {
    const markdown = buildLegacyClinicalMarkdown(reportForExport, lang);
    downloadFile(markdown, 'text/markdown;charset=utf-8', `archetype_clinical_report_${new Date().toISOString().slice(0, 10)}.md`);
  };

  const navigateTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const poles = displayResult.poleScores;
  const poleValue = (key, direction) => {
    const value = poles[key];
    return direction === 'negative' ? negativePoleStrength(value) : positivePoleStrength(value);
  };
  const clusterNames = TRANSLATIONS[lang]?.universe?.clusterNames ?? {};

  return (
    <div className={embedded ? "report-embedded" : "screen"}>
      <div className="scroll no-dock">
        <div className="row" style={{ paddingTop: 4 }}>
          <button className="ibtn" aria-label={ui.back} onClick={onBack}>‹</button>
          <div className="grow kicker">{resultCopy.title}</div>
          <button className="btn small" onClick={downloadBackup}>{ui.downloadBackup}</button>
        </div>

        <div className="card mt16" style={{ borderColor: 'var(--yolk)' }}>
          <div className="kicker" style={{ color: 'var(--accent-text)' }}>{resultCopy.eyebrow}</div>
          <h1 className="h2 mt8">{resultCopy.title}</h1>
          <p className="sub mt8">{resultCopy.description}</p>
          <div className="row wrap mt12" style={{ gap: 8 }}>
            <span className="chip">{lang === 'ru' ? '64 вопроса' : '64 items'}</span>
            <span className="chip">{ui.health} · {pct(poles.healthScore)}%</span>
            {poles.disorganizedAttachment && <span className="chip">{resultCopy.disorganizedFlag}</span>}
            {displayResult.archetypes[0] && <span className="chip">{ui.primary}: {displayResult.archetypes[0].name}</span>}
          </div>
        </div>

        {!readOnly && <div className="card flat mt12">
          <div className="row">
            <div className="kicker grow">{ui.scoringMethod}</div>
            <span className="chip">{scoringMethod === 'fallback' ? ui.aiMode : ui.deterministicMode}</span>
          </div>
          <p className="faint mt8" style={{ fontSize: 11, lineHeight: 1.5 }}>{ui.aiDisclosure}</p>
          <div className="row wrap mt10" style={{ gap: 8 }}>
            <button type="button" className={`btn small ${scoringMethod === 'deterministic' ? 'primary' : 'ghost'}`}
              aria-pressed={scoringMethod === 'deterministic'} onClick={() => onScoringMethodChange('deterministic')}>
              {ui.deterministicMode}
            </button>
            <button type="button" className={`btn small ${scoringMethod === 'fallback' ? 'primary' : 'ghost'}`}
              aria-pressed={scoringMethod === 'fallback'} onClick={() => onScoringMethodChange('fallback')}>
              {ui.aiMode}
            </button>
            {aiAnalysisBusy && <button type="button" className="btn ghost small" onClick={onCancelAiAnalysis}>{ui.cancel}</button>}
          </div>
          {aiAnalysisBusy && <p className="faint mt8" role="status">{ui.aiRunning}</p>}
          {aiAnalysisError && <p className="sub mt8" role="alert">{aiAnalysisError || ui.aiFailed}</p>}
        </div>}

        <nav className="tabs mt16" aria-label={lang === 'ru' ? 'Разделы отчёта' : 'Report sections'} style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          {labels.map(([id, label]) => <button key={id} type="button" onClick={() => navigateTo(id)} style={{ whiteSpace: 'nowrap' }}>{label}</button>)}
        </nav>

        <section id="legacy-narrative" className="card flat mt16" style={{ scrollMarginTop: 92 }}>
          <div className="row">
            <div className="kicker grow">{ui.narrative}</div>
            {narrativeBusy && <span className="faint" role="status">{lang === 'ru' ? 'ИИ…' : 'AI…'}</span>}
          </div>
          <div className="mt8" style={{ fontSize: 13.5, lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: parseReportMarkdown(narrative || '') }} />
          <div className="row wrap mt12" style={{ gap: 8 }}>
            {!readOnly && (narrativeBusy
              ? <button className="btn ghost small" onClick={cancelNarrative}>{ui.cancel}</button>
              : <button className="btn ghost small" onClick={() => setRequestVersion((value) => value + 1)}>{ui.retry}</button>)}
            <span className="faint" role="status" style={{ fontSize: 11 }}>
              {narrativeBusy ? ui.narrativeLoading : narrativeDegraded ? ui.narrativeLocal : ui.narrativeCloud}
            </span>
          </div>
        </section>

        <section id="legacy-profile" className="card flat mt12" style={{ scrollMarginTop: 92 }}>
          <div className="kicker">{ui.profile}</div>
          <div className="faint" style={{ fontSize: 11, margin: '8px 0 14px' }}>
            {lang === 'ru' ? 'Ось показывает положение между двумя полюсами; центр — нейтральная точка.' : 'Each axis places the profile between two poles; the center line is neutral.'}
          </div>
          {AXES.map((axis, index) => {
            const value = poles.center[index];
            const left = value < 0 ? 50 + value * 50 : 50;
            return (
              <div key={axis.en} className="mt12">
                <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
                  <b className="grow">{lang === 'ru' ? axis.ru : axis.en}</b>
                  <span className="faint" style={{ fontSize: 10 }}>{Math.round(value * 100)}%</span>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 10, fontWeight: 800, margin: '4px 0' }}>
                  <span>{lang === 'ru' ? axis.leftRu : axis.left}</span><span>{lang === 'ru' ? axis.rightRu : axis.right}</span>
                </div>
                <div aria-label={`${axis.en}: ${Math.round(value * 100)}%`} style={{ height: 10, position: 'relative', border: '1.5px solid var(--line)', borderRadius: 999, background: 'var(--paper-2, #f2efe7)' }}>
                  <span aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 0, height: '100%', borderLeft: '1px solid var(--text-faint)' }} />
                  <span aria-hidden="true" style={{ position: 'absolute', left: `${left}%`, width: `${Math.abs(value) * 50}%`, height: '100%', borderRadius: 999, background: 'var(--yolk, #ffd000)' }} />
                  <span aria-hidden="true" style={{ position: 'absolute', left: `${(value + 1) * 50}%`, top: '50%', width: 13, height: 13, borderRadius: '50%', border: '2px solid var(--line)', background: 'var(--paper, #fff)', transform: 'translate(-50%, -50%)' }} />
                </div>
              </div>
            );
          })}
        </section>

        <section id="legacy-poles" className="card flat mt12" style={{ scrollMarginTop: 92 }}>
          <div className="kicker">{ui.poles}</div>
          <div className="row wrap mt8" style={{ gap: 8 }}>
            <span className="chip">{ui.health} · {pct(poles.healthScore)}%</span>
            {poles.disorganizedAttachment && <span className="chip">{resultCopy.disorganizedFlag}</span>}
          </div>
          {POLES.map(([key, _en, _ru, direction]) => {
            const value = poleValue(key, direction);
            return (
              <div className="mt12" key={key}>
                <div className="row"><span className="grow">{labelForPole(key, lang, resultCopy)}</span><b>{pct(value)}%</b></div>
                <div className="bar y mt4"><i style={{ width: `${pct(value)}%` }} /></div>
              </div>
            );
          })}
        </section>

        <section id="legacy-pantheon" className="mt16" style={{ scrollMarginTop: 92 }}>
          <div className="kicker">{ui.pantheon}</div>
          <p className="sub mt4">{resultCopy.pantheonSubtitle}</p>
          {displayResult.archetypes.map((archetype, index) => (
            <details className="card flat mt12" key={`${archetype.name}-${index}`}>
              <summary className="row" style={{ cursor: 'pointer', listStyle: 'none' }}>
                <span className="chip" style={{ fontSize: 20 }}>{archetype.symbol}</span>
                <div className="grow" style={{ marginLeft: 10 }}>
                  <b>{archetype.name}</b>
                  <div className="faint mt4" style={{ fontSize: 11 }}>{displayPartType(archetype.partType, lang)} · {archetype.prominence}%</div>
                </div>
                <span className="mi-go" aria-hidden="true">⌄</span>
              </summary>
              <p className="sub mt12">{archetype.description}</p>
              <p className="sub mt8"><b>{ui.wound}:</b> {archetype.wound}</p>
              <p className="sub mt8"><b>{ui.shadow}:</b> {archetype.shadow}</p>
              <p className="sub mt8"><b>{ui.invitation}:</b> {archetype.invitation}</p>
              <p className="sub mt8"><b>{ui.belief}:</b> {archetype.coreBelief}</p>
              <p className="sub mt8"><b>{ui.attracts}:</b> {archetype.attracts}</p>
              <div className="row wrap mt8" style={{ gap: 6 }}>
                <span className="chip" style={{ fontSize: 10 }}>{clusterNames[archetype.cluster] ?? archetype.cluster}</span>
                <span className="chip" style={{ fontSize: 10 }}>{ui.origin}: {displayOrigin(archetype.developmentalOrigin, lang)}</span>
              </div>
            </details>
          ))}
        </section>

        <section id="legacy-dynamics" className="card flat mt16" style={{ scrollMarginTop: 92 }}>
          <div className="kicker">{ui.dynamics}</div>
          {displayResult.dynamics.length === 0 && <p className="sub mt8">{ui.none}</p>}
          {displayResult.dynamics.map((dynamic, index) => (
            <div className="mt10" key={`${dynamic.protector}-${index}`}>
              <div className="row wrap" style={{ gap: 6 }}>
                <span className="chip">{dynamic.protector}</span><b aria-hidden="true">→</b><span className="chip">{dynamic.protects}</span>
                <span className="faint" style={{ fontSize: 10 }}>{dynamic.mechanism}</span>
              </div>
              <p className="sub mt6">{dynamic.description}</p>
            </div>
          ))}
        </section>

        <section id="legacy-complexes" className="card flat mt12" style={{ scrollMarginTop: 92 }}>
          <div className="kicker">{ui.complexes}</div>
          {displayResult.complexes.length === 0 && <p className="sub mt8">{ui.none}</p>}
          {displayResult.complexes.map((complex) => (
            <article className="card flat mt10" key={complex.name}>
              <div className="row"><b className="grow">{lang === 'ru' ? complex.nameRu : complex.name}</b><span className="chip">{Math.round(complex.severity * 100)}%</span></div>
              <p className="sub mt8">{lang === 'ru' ? complex.coreWoundRu : complex.coreWound}</p>
              <div className="row wrap mt8" style={{ gap: 6 }}>{complex.contributingArchetypes.map((name) => <span key={name} className="chip">{name}</span>)}</div>
              <p className="faint mt8" style={{ fontSize: 11 }}>{lang === 'ru' ? complex.defensePatternRu : complex.defensePattern}</p>
            </article>
          ))}
        </section>

        <section id="legacy-defense" className="card flat mt12" style={{ scrollMarginTop: 92 }}>
          <div className="kicker">{ui.defense}</div>
          {displayResult.defenseHierarchy.layers.length === 0 && <p className="sub mt8">{ui.none}</p>}
          {displayResult.defenseHierarchy.layers.map((layer) => (
            <article className="card flat mt10" key={layer.level}>
              <div className="row"><span className="chip">L{layer.level}</span><b className="grow" style={{ marginLeft: 8 }}>{lang === 'ru' ? layer.labelRu : layer.label}</b></div>
              <div className="row wrap mt8" style={{ gap: 6 }}>{layer.parts.map((part) => <span key={part} className="chip">{part}</span>)}</div>
              <p className="sub mt8">{lang === 'ru' ? layer.descriptionRu : layer.description}</p>
            </article>
          ))}
          {displayResult.defenseHierarchy.escalationPaths.length > 0 && <div className="kicker mt16">{ui.escalation}</div>}
          {displayResult.defenseHierarchy.escalationPaths.map((path, index) => (
            <div className="card flat mt8" key={`${path.from}-${path.to}-${index}`}>
              <b>{path.from} → {path.to}</b><p className="sub mt6">{lang === 'ru' ? path.triggerRu : path.trigger}</p>
            </div>
          ))}
        </section>

        <section id="legacy-triggers" className="card flat mt12" style={{ scrollMarginTop: 92 }}>
          <div className="kicker">{ui.triggers}</div>
          {displayResult.triggerMap.length === 0 && <p className="sub mt8">{ui.none}</p>}
          {displayResult.triggerMap.map((trigger) => (
            <article className="card flat mt10" key={trigger.partName}>
              <div className="row"><b className="grow">{trigger.partName}</b><span className="chip">{displayPartType(trigger.partType, lang)}</span></div>
              <div className="mt8">
                <b style={{ fontSize: 11 }}>{ui.triggerSituations}</b>
                {(lang === 'ru' ? trigger.triggerSituationsRu : trigger.triggerSituations).map((situation) => <p className="sub mt4" key={situation}>• {situation}</p>)}
              </div>
              <p className="sub mt8"><b>{ui.response}:</b> {lang === 'ru' ? trigger.reactionPatternRu : trigger.reactionPattern}</p>
              <p className="faint mt6" style={{ fontSize: 11 }}><b>{ui.underlyingWound}:</b> {lang === 'ru' ? trigger.underlyingWoundRu : trigger.underlyingWound}</p>
            </article>
          ))}
        </section>

        <section id="legacy-pathway" className="card flat mt12" style={{ scrollMarginTop: 92 }}>
          <div className="kicker">{ui.pathway}</div>
          {displayResult.integrationPathway.length === 0 && <p className="sub mt8">{ui.none}</p>}
          {displayResult.integrationPathway.map((step) => (
            <article className="card flat mt10" key={step.stage}>
              <div className="row"><span className="chip">{step.stage}</span><b className="grow" style={{ marginLeft: 8 }}>{lang === 'ru' ? step.stageNameRu : step.stageName}</b></div>
              <p className="sub mt8">{lang === 'ru' ? step.actionRu : step.action}</p>
              <div className="row wrap mt8" style={{ gap: 6 }}>{step.targetParts.map((part) => <span className="chip" key={part}>{part}</span>)}</div>
            </article>
          ))}
        </section>

        <section id="legacy-diagnostics" className="mt12" style={{ scrollMarginTop: 92 }}>
          <div className="kicker">{ui.diagnostics}</div>
          {[
            { label: resultCopy.dissociationLabel, score: displayResult.dissociation.score, level: lang === 'ru' ? displayResult.dissociation.levelRu : displayResult.dissociation.level, description: lang === 'ru' ? displayResult.dissociation.descriptionRu : displayResult.dissociation.description },
            { label: resultCopy.regulationLabel, score: displayResult.regulation.windowOfTolerance, level: lang === 'ru' ? displayResult.regulation.dysregulationPatternRu : displayResult.regulation.dysregulationPattern, description: lang === 'ru' ? displayResult.regulation.descriptionRu : displayResult.regulation.description, sublabel: ui.window },
            { label: resultCopy.boundaryLabel, score: displayResult.boundary.score, level: lang === 'ru' ? displayResult.boundary.styleRu : displayResult.boundary.style, description: lang === 'ru' ? displayResult.boundary.descriptionRu : displayResult.boundary.description },
            { label: resultCopy.coherenceLabel, score: displayResult.coherence.score, level: lang === 'ru' ? displayResult.coherence.levelRu : displayResult.coherence.level, description: lang === 'ru' ? displayResult.coherence.descriptionRu : displayResult.coherence.description },
          ].map((indicator) => (
            <article className="card flat mt10" key={indicator.label}>
              <div className="row"><b className="grow">{indicator.label}</b><span className="chip">{indicator.level} · {pct(indicator.score)}%</span></div>
              {indicator.sublabel && <p className="faint mt6" style={{ fontSize: 11 }}>{indicator.sublabel}</p>}
              <div className="bar p mt8"><i style={{ width: `${pct(indicator.score)}%` }} /></div>
              <p className="sub mt8">{indicator.description}</p>
            </article>
          ))}
        </section>

        <div className="row wrap mt24" style={{ gap: 10 }}>
          {!readOnly && <button className="btn grow" onClick={onRetake}>{ui.retake}</button>}
          <button className="btn grow" onClick={downloadClinical}>{ui.clinicalExport}</button>
          {!readOnly && <button className="btn grow" onClick={onViewUniverse}>{ui.viewUniverse}</button>}
          <button className="btn primary grow" onClick={onBack}>{ui.back}</button>
        </div>
        <button className="btn ghost block mt12" onClick={downloadBackup}>{ui.downloadBackup}</button>
        <div className="card flat mt16" role="note"><p className="faint" style={{ fontSize: 11, lineHeight: 1.55 }}>{ui.ethics} {ui.localOnly}</p></div>
      </div>
    </div>
  );
}
