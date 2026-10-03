import React from 'react';

const COPY = {
  en: {
    title: 'Computed interaction patterns', loop: 'Possible interaction loop',
    yourProtector: 'Your protector', partnerVulnerability: 'Partner vulnerability',
    partnerProtector: 'Partner protector', yourVulnerability: 'Your vulnerability',
    interlocks: 'Possible complex interlocks', noInterlocks: 'No predefined complex pair was active in both profiles.',
    nourish: 'Possible mutual nourishment', noNourish: 'The model did not identify a strong resource-to-need match.',
    giver: 'Resource', need: 'Possible need', dance: 'Relational dance',
    caveat: 'A deterministic pattern model, not a compatibility score, diagnosis, or prediction. Use these descriptions as hypotheses only.',
    export: 'Download full JSON report',
  },
  ru: {
    title: 'Рассчитанные паттерны взаимодействия', loop: 'Возможный цикл взаимодействия',
    yourProtector: 'Ваша защитная часть', partnerVulnerability: 'Уязвимая часть партнёра',
    partnerProtector: 'Защитная часть партнёра', yourVulnerability: 'Ваша уязвимая часть',
    interlocks: 'Возможное сцепление комплексов', noInterlocks: 'В обоих профилях не активна ни одна заданная пара комплексов.',
    nourish: 'Возможная взаимная поддержка', noNourish: 'Модель не выявила сильного соответствия ресурса потребности.',
    giver: 'Ресурс', need: 'Возможная потребность', dance: 'Стиль взаимодействия',
    caveat: 'Детерминированная модель паттернов, не оценка совместимости, диагноз или прогноз. Используйте описания только как гипотезы.',
    export: 'Скачать полный JSON-отчёт',
  },
};

const PARTS = {
  en: {
    taskmaster: 'Taskmaster', inner_critic: 'Inner Critic', pleaser: 'Pleaser', controller: 'Controller',
    analyst: 'Analyst', hermit: 'Hermit', bypasser: 'Bypasser', numb: 'Numb', rebel: 'Rebel',
    charmer: 'Charmer', abandoned: 'Abandoned', ashamed: 'Ashamed', frightened: 'Frightened', unseen: 'Unseen',
  },
  ru: {
    taskmaster: 'Драйвер', inner_critic: 'Внутренний критик', pleaser: 'Угодник', controller: 'Контролёр',
    analyst: 'Аналитик', hermit: 'Отшельник', bypasser: 'Обходчик', numb: 'Оцепенение', rebel: 'Бунтарь',
    charmer: 'Очарователь', abandoned: 'Покинутый', ashamed: 'Стыдящийся', frightened: 'Испуганный', unseen: 'Незамеченный',
  },
};

const COMPLEXES = {
  en: {
    abandonment: 'Abandonment', inferiority: 'Inferiority', power: 'Power', performance: 'Performance',
    engulfment: 'Engulfment', invisibility: 'Invisibility', vigilance: 'Vigilance', unlovability: 'Unlovability', betrayal: 'Betrayal',
  },
  ru: {
    abandonment: 'Оставление', inferiority: 'Неполноценность', power: 'Власть', performance: 'Достижение',
    engulfment: 'Поглощение', invisibility: 'Невидимость', vigilance: 'Настороженность', unlovability: 'Нелюбимость', betrayal: 'Предательство',
  },
};

const RESOURCES = {
  en: { sage: 'Sage', warrior: 'Warrior', caregiver: 'Caregiver', explorer: 'Explorer' },
  ru: { sage: 'Мудрец', warrior: 'Воин', caregiver: 'Заботящийся', explorer: 'Исследователь' },
};
const NEEDS = {
  en: { safety: 'safety', love: 'love', worth: 'worth', autonomy: 'autonomy', belonging: 'belonging', meaning: 'meaning', joy: 'joy' },
  ru: { safety: 'безопасность', love: 'любовь', worth: 'ценность', autonomy: 'автономия', belonging: 'принадлежность', meaning: 'смысл', joy: 'радость' },
};
const DANCES = {
  HEALING_CONTAINER: { en: 'Healing container', ru: 'Поддерживающая связь' },
  PARALLEL_SOVEREIGNTY: { en: 'Parallel sovereignty', ru: 'Параллельная самостоятельность' },
  PURSUE_WITHDRAW_1: { en: 'Pursue–withdraw · partner withdraws', ru: 'Сближение и дистанция · партнёр отстраняется' },
  PURSUE_WITHDRAW_2: { en: 'Pursue–withdraw · you withdraw', ru: 'Сближение и дистанция · вы отстраняетесь' },
  MUTUAL_ESCALATION: { en: 'Mutual escalation', ru: 'Взаимное усиление напряжения' },
  DEEP_FREEZE: { en: 'Deep freeze', ru: 'Взаимное отдаление' },
  VOLATILE_BOND: { en: 'Unsteady bond', ru: 'Нестабильная связь' },
};

function humanize(value, language) {
  const dictionary = language === 'ru' ? PARTS.ru : PARTS.en;
  return dictionary[value] ?? value?.replaceAll('_', ' ') ?? '';
}

export function ScoredProfileSynastryDetails({ report, lang = 'en', onDownload }) {
  if (!report) return null;
  const language = lang === 'ru' ? 'ru' : 'en';
  const copy = COPY[language];
  const loop = report.loop;

  return (
    <div className="mt12">
      <section className="card flat mt10" aria-label={copy.title}>
        <div className="kicker" style={{ color: 'var(--accent-text)' }}>{copy.title}</div>
        <div className="card flat mt8">
          <b>{copy.dance}: {DANCES[report.dance]?.[language] ?? report.dance}</b>
          <div className="faint mt8" style={{ fontSize: 11 }}>{copy.loop}</div>
          <ol className="sub mt4" style={{ paddingLeft: 18, fontSize: 12 }}>
            <li>{copy.yourProtector}: {humanize(loop.aProtector, language)}</li>
            <li>{copy.partnerVulnerability}: {humanize(loop.bExile, language)}</li>
            <li>{copy.partnerProtector}: {humanize(loop.bGuardian, language)}</li>
            <li>{copy.yourVulnerability}: {humanize(loop.aExile, language)}</li>
            <li>{copy.yourProtector}: {humanize(loop.aGuardian, language)}</li>
          </ol>
          {language === 'en' && <p className="sub mt8">{loop.name}</p>}
          {language === 'ru' && <p className="sub mt8">Цикл защиты и уязвимости — гипотеза, не прогноз.</p>}
        </div>
      </section>

      <section className="card flat mt10" aria-label={copy.interlocks}>
        <div className="kicker" style={{ color: 'var(--accent-text)' }}>{copy.interlocks}</div>
        {report.noLockedStoryline ? <p className="sub mt8">{copy.noInterlocks}</p> : report.interlocks.map((hit, index) => (
          <article className="card flat mt8" key={`${hit.pair.join('-')}-${index}`}>
            <b>{language === 'ru' ? 'Взаимодействие комплексов' : hit.name}</b>
            <p className="sub mt4">{hit.pair.map((id) => COMPLEXES[language][id] ?? id).join(' ↔ ')}</p>
            <div className="faint mt4" style={{ fontSize: 11 }}>{Math.round(hit.strength)} / 100</div>
          </article>
        ))}
      </section>

      <section className="card flat mt10" aria-label={copy.nourish}>
        <div className="kicker" style={{ color: 'var(--accent-text)' }}>{copy.nourish}</div>
        {report.nourishHighlights.length ? report.nourishHighlights.map((hit, index) => (
          <div className="row mt8" key={`${hit.giver}-${hit.need}-${index}`} style={{ justifyContent: 'space-between', gap: 8 }}>
            <span className="sub">{copy.giver}: {RESOURCES[language][hit.giver] ?? hit.giver} · {copy.need}: {NEEDS[language][hit.need] ?? hit.need}</span>
            <span className="pill">{Math.round(hit.strength * 100)}%</span>
          </div>
        )) : <p className="sub mt8">{copy.noNourish}</p>}
        <p className="faint mt10" role="note" style={{ fontSize: 11 }}>{copy.caveat}</p>
      </section>

      {onDownload && <button type="button" className="btn ghost block mt12" onClick={onDownload}>⬇ {copy.export}</button>}
    </div>
  );
}
