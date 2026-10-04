import React, { useId } from 'react';

const COPY = {
  en: {
    relationalArchetype: 'Relational archetype', invitation: 'Invitation', shadow: 'Shadow to notice',
    attachment: 'Attachment dance', cycle: 'Possible cycle', deactivation: 'De-escalation',
    resonance: 'Dimensional resonance', crossTriggers: 'Possible cross-person triggers',
    noCrossTriggers: 'No cross-person trigger pairs were identified by this model.',
    shared: 'Shared complexes', complementary: 'Complementary complexes', noShared: 'None identified in the model.',
    pathway: 'Joint reflection pathway', diagnostics: 'Response-based indicators',
    person1: 'You', person2: 'Partner', dissociation: 'Dissociation tendency estimate',
    regulation: 'Regulation pattern', boundary: 'Boundary style', coherence: 'Response coherence',
    noPathway: 'No joint steps were generated.', caveat: 'These are hypotheses generated from questionnaire responses, not clinical findings or predictions. Use them only if they feel useful.',
    score: 'Model estimate', pattern: 'Pattern',
  },
  ru: {
    relationalArchetype: 'Реляционный архетип', invitation: 'Приглашение', shadow: 'Тень для наблюдения',
    attachment: 'Танец привязанности', cycle: 'Возможный цикл', deactivation: 'Снижение напряжения',
    resonance: 'Резонанс по измерениям', crossTriggers: 'Возможные взаимные триггеры',
    noCrossTriggers: 'Модель не выявила пары взаимных триггеров.',
    shared: 'Общие комплексы', complementary: 'Дополняющие комплексы', noShared: 'В модели не обнаружены.',
    pathway: 'Совместный путь рефлексии', diagnostics: 'Показатели по ответам',
    person1: 'Вы', person2: 'Партнёр', dissociation: 'Оценка тенденции к диссоциации',
    regulation: 'Паттерн регуляции', boundary: 'Стиль границ', coherence: 'Согласованность ответов',
    noPathway: 'Совместные шаги не сформированы.', caveat: 'Это гипотезы по ответам на вопросы, а не клинические выводы или прогнозы. Используйте их, только если они кажутся полезными.',
    score: 'Оценка модели', pattern: 'Паттерн',
  },
};

function text(value, language) {
  if (language === 'ru') return value?.nameRu ?? value?.ru ?? value?.name ?? value?.descriptionRu ?? value?.description ?? '';
  return value?.nameEn ?? value?.en ?? value?.name ?? value?.descriptionEn ?? value?.description ?? '';
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="card flat mt10" aria-label={title} style={{ scrollMarginTop: 72 }}>
      <div className="kicker" style={{ color: 'var(--accent-text)' }}>{title}</div>
      <div className="mt8">{children}</div>
    </section>
  );
}

function PersonIndicators({ report, language, label, copy }) {
  const dissociation = report[`person${label === copy.person1 ? '1' : '2'}Dissociation`];
  const regulation = report[`person${label === copy.person1 ? '1' : '2'}Regulation`];
  const boundary = report[`person${label === copy.person1 ? '1' : '2'}Boundary`];
  const coherence = report[`person${label === copy.person1 ? '1' : '2'}Coherence`];
  return (
    <div className="card flat mt8">
      <b>{label}</b>
      <ul className="sub mt8" style={{ paddingLeft: 18, fontSize: 12 }}>
        <li>{copy.dissociation}: {language === 'ru' ? dissociation.levelRu : dissociation.level}</li>
        <li>{copy.regulation}: {language === 'ru' ? regulation.dysregulationPatternRu : regulation.dysregulationPattern}</li>
        <li>{copy.boundary}: {language === 'ru' ? boundary.styleRu : boundary.style}</li>
        <li>{copy.coherence}: {language === 'ru' ? coherence.levelRu : coherence.level}</li>
      </ul>
    </div>
  );
}

export function LegacySynastryDetails({ report, lang = 'en', onDownload }) {
  const sectionId = useId();
  if (!report) return null;
  const language = lang === 'ru' ? 'ru' : 'en';
  const copy = COPY[language];
  const archetype = report.relationalArchetype;
  const dance = report.attachmentDance;
  const pathway = report.jointPathway ?? [];
  const triggers = report.crossPersonTriggers ?? [];
  const resonance = report.dimensionalResonance ?? [];
  const personOneComplexes = report.person1Complexes?.map((complex) => complex.name) ?? [];
  const personTwoComplexes = report.person2Complexes?.map((complex) => complex.name) ?? [];

  return (
    <div className="mt12" data-synastry-details>
      <nav className="tabs" aria-label={lang === 'ru' ? 'Разделы отчёта' : 'Report sections'} style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
        {['relationalArchetype', 'attachment', 'resonance', 'crossTriggers', 'shared', 'pathway', 'diagnostics'].map((key) => <button key={key} onClick={() => document.getElementById(`${sectionId}-${key}`)?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}>{copy[key]}</button>)}
      </nav>
      <Section id={`${sectionId}-relationalArchetype`} title={copy.relationalArchetype}>
        <h3 className="h2" style={{ fontSize: 17 }}>{text(archetype, language)}</h3>
        <p className="sub mt8" style={{ color: 'var(--text)' }}>{language === 'ru' ? archetype.descriptionRu : archetype.descriptionEn}</p>
        <p className="sub mt8"><b>{copy.invitation}: </b>{language === 'ru' ? archetype.invitationRu : archetype.invitationEn}</p>
        <p className="sub mt8"><b>{copy.shadow}: </b>{language === 'ru' ? archetype.shadowRu : archetype.shadowEn}</p>
      </Section>

      <Section id={`${sectionId}-attachment`} title={copy.attachment}>
        <p className="sub" style={{ color: 'var(--text)' }}>{language === 'ru' ? dance.descriptionRu : dance.descriptionEn}</p>
        <p className="sub mt8"><b>{copy.cycle}: </b>{language === 'ru' ? dance.cycleRu : dance.cycleEn}</p>
        <p className="sub mt8"><b>{copy.deactivation}: </b>{language === 'ru' ? dance.deactivationRu : dance.deactivationEn}</p>
      </Section>

      <Section id={`${sectionId}-resonance`} title={copy.resonance}>
        {resonance.map((dimension) => (
          <article className="card flat mt8" key={dimension.dimension}>
            <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
              <b>{dimension.dimension}</b>
              <span className="faint" style={{ fontSize: 11 }}>{copy.pattern}: {dimension.pattern}</span>
            </div>
            <p className="sub mt8" style={{ color: 'var(--text)' }}>
              {language === 'ru' ? dimension.descriptionRu : dimension.descriptionEn}
            </p>
          </article>
        ))}
      </Section>

      <Section id={`${sectionId}-crossTriggers`} title={copy.crossTriggers}>
        {triggers.length ? triggers.map((trigger, index) => (
          <article className="card flat mt8" key={`${trigger.person1Trigger}-${trigger.person2Trigger}-${index}`}>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <span className="pill">{trigger.person1Trigger}</span>
              <span aria-hidden="true">↔</span>
              <span className="pill">{trigger.person2Trigger}</span>
            </div>
            <p className="sub mt8" style={{ color: 'var(--text)' }}>{language === 'ru' ? trigger.interactionDescRu : trigger.interactionDesc}</p>
          </article>
        )) : <p className="sub">{copy.noCrossTriggers}</p>}
      </Section>

      <Section id={`${sectionId}-shared`} title={copy.shared}>
        <p className="sub">{report.sharedComplexes?.length ? report.sharedComplexes.join(' · ') : copy.noShared}</p>
        <div className="kicker mt12" style={{ color: 'var(--accent-text)' }}>{copy.complementary}</div>
        <p className="sub mt8">{report.complementaryComplexes?.length ? report.complementaryComplexes.join(' · ') : copy.noShared}</p>
        {(personOneComplexes.length > 0 || personTwoComplexes.length > 0) && (
          <div className="grid mt10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
            <div className="card flat"><b>{copy.person1}</b><p className="sub mt4">{personOneComplexes.join(' · ') || copy.noShared}</p></div>
            <div className="card flat"><b>{copy.person2}</b><p className="sub mt4">{personTwoComplexes.join(' · ') || copy.noShared}</p></div>
          </div>
        )}
      </Section>

      <Section id={`${sectionId}-pathway`} title={copy.pathway}>
        {pathway.length ? pathway.map((step) => (
          <article className="row mt8" key={step.stage} style={{ alignItems: 'flex-start', gap: 10 }}>
            <span className="pill">{step.stage}</span>
            <div>
              <b>{language === 'ru' ? step.labelRu : step.label}</b>
              <p className="sub mt4" style={{ color: 'var(--text)' }}>{language === 'ru' ? step.actionRu : step.action}</p>
              {(step.precondition || step.preconditionRu) && <p className="faint mt4" style={{ fontSize: 11 }}>{language === 'ru' ? step.preconditionRu : step.precondition}</p>}
            </div>
          </article>
        )) : <p className="sub">{copy.noPathway}</p>}
      </Section>

      <Section id={`${sectionId}-diagnostics`} title={copy.diagnostics}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          <PersonIndicators report={report} language={language} label={copy.person1} copy={copy} />
          <PersonIndicators report={report} language={language} label={copy.person2} copy={copy} />
        </div>
        <p className="faint mt10" role="note" style={{ fontSize: 11 }}>{copy.caveat}</p>
      </Section>

      {onDownload && <button type="button" className="btn ghost block mt12" onClick={onDownload}>⬇ {language === 'ru' ? 'Скачать полный JSON-отчёт' : 'Download full JSON report'}</button>}
    </div>
  );
}
