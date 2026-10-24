// E19 extensions that earn complexity (ArchetypeAI-umo5, step 05 UI). Each optional extension lists what it is for,
// what it needs, and the simpler path it is compared against. Prerequisites start unknown and are never assumed met.
// Nothing here is required for ordinary use. Details come from the pure E19 catalogue (English); Russian readers
// see EXTENSION_COPY_RU below, keyed by extension key and prerequisite id.
import React from 'react';
import { useApp } from '../../app.jsx';
import { EXTENSIONS } from '../../elevation/e19-comparison.ts';

const COPY = {
  en: {
    kicker: 'Optional extensions',
    ask: 'Each one is optional. Ordinary use never requires any of them.',
    purpose: 'Purpose',
    needs: 'Needs',
    simpler: 'Simpler path it is compared against',
    unknown: 'Not checked yet',
  },
  ru: {
    kicker: 'Необязательные расширения',
    ask: 'Каждое из них необязательно. Обычное использование не требует ни одного.',
    purpose: 'Назначение',
    needs: 'Нужно',
    simpler: 'Более простой путь, с которым сравнивается',
    unknown: 'Пока не проверено',
  },
};

/** Russian for the E19 catalogue's user-facing fields. A spec keeps it complete. */
export const EXTENSION_COPY_RU = {
  extensions: {
    'rehearse-tomorrow': { purpose: 'Подготовиться к обычной предстоящей ситуации и сохранить выбранный ответ как карточку эксперимента', path: 'Чек-лист подготовки' },
    'shared-room': { purpose: 'Поддержать один режим совместной работы, который даёт общий согласованный черновик с историей вкладов', path: 'Обмен материалами не в реальном времени' },
    'contextual-cues': { purpose: 'Дать вам самим составить напоминание и решать, когда оно появляется', path: 'Физическое или сохранённое напоминание' },
    'facilitated-lab': { purpose: 'Провести конкретный деликатный протокол с ведущим, с возможностью остановиться, вернуться и получить поддержку', path: 'Проверенная самостоятельная практика с путём выхода' },
    lenses: { purpose: 'Предложить выбранную вами линзу толкования с прозрачным происхождением и альтернативой на обычном языке', path: 'Размышление на обычном языке без линзы' },
    'xr-arrangement': { purpose: 'Рассмотреть в пространстве подготовленную расстановку для репетиции', path: 'Обычная карта или сцена с полным путём без XR' },
    'shared-artifact': { purpose: 'Поделиться выбранным вами полезным материалом', path: 'Личный экспорт выбранного материала' },
  },
  needs: {
    'scene-review': 'Проверенная грамматика сцен и практическое ограничение',
    'recipient-accounts': 'У каждого участника есть аккаунт, права получателей проверены',
    'sharing-consent': 'Каждый участник соглашается на предпросмотр контекста, прежде чем делиться',
    'device-channel': 'Подтверждённый канал устройства, а не предполагаемый',
    'qualified-facilitator': 'Квалифицированные ведущие в штате',
    'research-consent': 'Согласие на исследование отдельно от согласия в приложении и условий платных услуг',
    'protocol-review': 'Проверенные границы протокола',
    'community-review': 'Подходящие источники и рецензенты из сообщества',
    'xr-hardware': 'Поддерживаемое настоящее XR-оборудование с управлением, паузой и выходом',
    'share-consent': 'Понятное объяснение согласия, прежде чем делиться',
  },
};

export function ExtensionsPanel() {
  const { lang } = useApp() ?? {};
  const ru = lang === 'ru';
  const copy = COPY[ru ? 'ru' : 'en'];
  const purposeOf = (extension) => (ru ? EXTENSION_COPY_RU.extensions[extension.key]?.purpose : null) ?? extension.purpose;
  const pathOf = (extension) => (ru ? EXTENSION_COPY_RU.extensions[extension.key]?.path : null) ?? extension.comparator.path;
  const needOf = (item) => (ru ? EXTENSION_COPY_RU.needs[item.id] : null) ?? item.need;
  return (
    <section className="card flat mt16" aria-labelledby="e19-title">
      <div className="kicker" id="e19-title">{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 13 }}>{copy.ask}</p>
      {EXTENSIONS.map((extension) => (
        <div key={extension.key} className="mt10">
          <div style={{ fontSize: 13, fontWeight: 700 }}>{extension.provisionalId}</div>
          <p className="mt4" style={{ fontSize: 12 }}><span className="faint">{copy.purpose}: </span>{purposeOf(extension)}</p>
          <ul className="mt4" style={{ fontSize: 12 }}>
            {extension.prerequisites.map((item) => (
              <li key={item.id}><span className="faint">{copy.needs}: </span>{needOf(item)} <span className="faint">({copy.unknown})</span></li>
            ))}
          </ul>
          <p className="faint mt4" style={{ fontSize: 12 }}>{copy.simpler}: {pathOf(extension)}</p>
        </div>
      ))}
    </section>
  );
}
