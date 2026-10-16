// E18 physical-device comfort and economy (ArchetypeAI-dqit, step 05 UI). The person declares their device. Each measure
// shows whether a run has been made on this device. No measurement is invented here, so every metric starts as pending.
import React, { useState } from 'react';
import { useApp } from '../../app.jsx';
import { store } from '../../core/local-store';
import { METRICS, declareEnvelope, envelopeComplete, readingFor } from '../../elevation/e18-device-envelope.ts';

export const DEVICE_ENVELOPE_KEY = 'INNERVERSE_DEVICE_ENVELOPE_V1';

const METRIC_LABELS = {
  en: { 'frame-ms': 'Frame time', 'long-task-ms': 'Longest busy stretch', 'entry-ms': 'Time to first screen', 'resume-ms': 'Time to resume', 'heap-mb': 'Memory in use' },
  ru: { 'frame-ms': 'Время кадра', 'long-task-ms': 'Самый долгий занятый отрезок', 'entry-ms': 'Время до первого экрана', 'resume-ms': 'Время возобновления', 'heap-mb': 'Используемая память' },
};

const COPY = {
  en: {
    kicker: 'Your device',
    ask: 'Describe the device you use. Measurements need a run on that device, and none has been made here.',
    handset: 'Phone or device', os: 'System', browser: 'Browser', network: 'Connection',
    networks: { '': 'Choose', wifi: 'Wi-Fi', cellular: 'Mobile data', ethernet: 'Cable' },
    save: 'Save device details',
    complete: 'Device details complete.',
    incomplete: 'Please fill in every field.',
    pending: { 'no-run': 'No measurement run yet.', 'method-none': 'This browser cannot measure it.', 'envelope-incomplete': 'Fill in your device first.', 'threshold-unfrozen': 'Thresholds are not set yet.' },
  },
  ru: {
    kicker: 'Ваше устройство',
    ask: 'Опишите устройство, которым пользуетесь. Измерения требуют запуска на этом устройстве, здесь ни одного не сделано.',
    handset: 'Телефон или устройство', os: 'Система', browser: 'Браузер', network: 'Подключение',
    networks: { '': 'Выберите', wifi: 'Wi-Fi', cellular: 'Мобильная сеть', ethernet: 'Кабель' },
    save: 'Сохранить данные устройства',
    complete: 'Данные устройства заполнены.',
    incomplete: 'Заполните все поля.',
    pending: { 'no-run': 'Измерений пока не было.', 'method-none': 'Этот браузер не может это измерить.', 'envelope-incomplete': 'Сначала заполните устройство.', 'threshold-unfrozen': 'Пороги пока не заданы.' },
  },
};

export function DeviceEnvelopePanel() {
  const { lang } = useApp() ?? {};
  const lk = lang === 'ru' ? 'ru' : 'en';
  const copy = COPY[lk];
  const stored = store.load(DEVICE_ENVELOPE_KEY, {});
  const [fields, setFields] = useState({ handset: stored.handset ?? '', os: stored.os ?? '', browser: stored.browser ?? '', network: stored.network ?? '' });
  const [message, setMessage] = useState('');
  const { envelope } = declareEnvelope(fields);
  const complete = envelopeComplete(envelope);

  const save = () => {
    store.save(DEVICE_ENVELOPE_KEY, fields);
    setMessage(complete ? copy.complete : copy.incomplete);
  };

  return (
    <section className="card flat mt16" aria-labelledby="e18-title">
      <div className="kicker" id="e18-title">{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 13 }}>{copy.ask}</p>
      <label className="field mt8"><span>{copy.handset}</span><input value={fields.handset} onChange={(e) => setFields({ ...fields, handset: e.target.value })} /></label>
      <label className="field mt6"><span>{copy.os}</span><input value={fields.os} onChange={(e) => setFields({ ...fields, os: e.target.value })} /></label>
      <label className="field mt6"><span>{copy.browser}</span><input value={fields.browser} onChange={(e) => setFields({ ...fields, browser: e.target.value })} /></label>
      <label className="field mt6">
        <span>{copy.network}</span>
        <select className="drop mt6" value={fields.network} onChange={(e) => setFields({ ...fields, network: e.target.value })}>
          {Object.entries(copy.networks).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <button className="btn small primary block mt8" onClick={save}>{copy.save}</button>
      {message && <p className="faint mt6" role="status" style={{ fontSize: 12 }}>{message}</p>}
      <ul className="mt8" style={{ fontSize: 12 }}>
        {Object.keys(METRICS).map((metric) => {
          const reading = readingFor(metric, undefined, envelope);
          const text = reading.status === 'observed' ? '' : copy.pending[reading.reason] ?? copy.pending['no-run'];
          return <li key={metric}><span className="faint">{METRIC_LABELS[lk][metric]}: </span>{text}</li>;
        })}
      </ul>
    </section>
  );
}
