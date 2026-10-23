import React, { useState } from 'react';
import { useApp } from '../app.jsx';
import { store } from '../core/local-store';
import { disablePushReminder, enablePushReminder } from '../core/push.ts';
import { chooseMove } from '../core/return-loop.ts';
import {
  REMINDERS_KEY,
  localDateKey,
  readReminderSettings,
  reminderDecision,
  resumeToday,
  skipToday,
} from '../core/reminder-policy.ts';

const MODES = ['off', 'in-app', 'device'];
const DEFAULT_QUIET = { startHour: 22, endHour: 7 };
const MAX_OPTIONS = 5;

const COPY = {
  en: {
    kicker: 'Reminders',
    title: 'Gentle return reminders',
    intro: 'Nothing is shown unless you turn reminders on. You can skip a day, use quiet hours, or turn them off at any time.',
    channel: 'How to remind you',
    modes: { off: 'Off', 'in-app': 'In the app', device: 'On this device' },
    deviceExplain: 'A device reminder uses your browser notification permission. The browser asks only when you press the button below.',
    allowDevice: 'Allow device reminders',
    allowing: 'Asking the browser...',
    deviceOn: 'Device reminders are on for this browser.',
    deviceDenied: 'The browser did not allow notifications, so no device reminders will be sent.',
    deviceUnsupported: 'This browser cannot show device reminders.',
    deviceNeedsClick: 'Press "Allow device reminders" to finish turning them on.',
    inAppOn: 'Reminders will appear inside the app.',
    offDone: 'Reminders are off. Nothing will be shown.',
    quietTitle: 'Quiet hours',
    quietFrom: 'From',
    quietUntil: 'Until',
    skip: 'Skip today',
    skippedToday: 'Paused for today. Reminders return tomorrow.',
    resume: 'Resume today',
    statusLabel: 'Right now',
    status: {
      ok: (channel) => (channel === 'device'
        ? 'A device reminder can be sent when one is due.'
        : 'A reminder can appear in the app when one is due.'),
      'not-opted-in': 'Reminders are off.',
      'no-channel': 'Reminders are off.',
      'device-not-confirmed': 'Device reminders wait until you allow them above.',
      'skipped-today': 'Paused for today. Reminders return tomorrow.',
      'quiet-hours': 'Paused by your quiet hours right now.',
      'invalid-time': 'The time could not be read, so nothing is shown.',
    },
    moveTitle: 'A small next move',
    moveHint: 'Type a few options, one per line. Nothing is chosen for you. Pick one only if it fits.',
    movePlaceholder: 'For example: stand up and stretch',
    chosen: 'Your next small move',
    clear: 'Clear',
  },
  ru: {
    kicker: 'Напоминания',
    title: 'Мягкие напоминания вернуться',
    intro: 'Ничего не появляется, пока вы не включите напоминания. Можно пропустить день, включить тихие часы или выключить их в любой момент.',
    channel: 'Как напоминать',
    modes: { off: 'Выключено', 'in-app': 'В приложении', device: 'На этом устройстве' },
    deviceExplain: 'Напоминание на устройстве использует разрешение браузера на уведомления. Браузер спрашивает только после нажатия кнопки ниже.',
    allowDevice: 'Разрешить напоминания на устройстве',
    allowing: 'Спрашиваем браузер...',
    deviceOn: 'Напоминания на этом устройстве включены.',
    deviceDenied: 'Браузер не разрешил уведомления, поэтому напоминания на устройстве отправляться не будут.',
    deviceUnsupported: 'Этот браузер не может показывать напоминания на устройстве.',
    deviceNeedsClick: 'Нажмите «Разрешить напоминания на устройстве», чтобы завершить включение.',
    inAppOn: 'Напоминания будут появляться внутри приложения.',
    offDone: 'Напоминания выключены. Ничего показываться не будет.',
    quietTitle: 'Тихие часы',
    quietFrom: 'С',
    quietUntil: 'До',
    skip: 'Пропустить сегодня',
    skippedToday: 'На сегодня пауза. Напоминания вернутся завтра.',
    resume: 'Вернуть на сегодня',
    statusLabel: 'Сейчас',
    status: {
      ok: (channel) => (channel === 'device'
        ? 'Напоминание на устройстве может прийти, когда придёт время.'
        : 'Напоминание может появиться в приложении, когда придёт время.'),
      'not-opted-in': 'Напоминания выключены.',
      'no-channel': 'Напоминания выключены.',
      'device-not-confirmed': 'Напоминания на устройстве ждут вашего разрешения выше.',
      'skipped-today': 'На сегодня пауза. Напоминания вернутся завтра.',
      'quiet-hours': 'Сейчас действуют тихие часы.',
      'invalid-time': 'Не удалось определить время, поэтому ничего не показывается.',
    },
    moveTitle: 'Следующий небольшой шаг',
    moveHint: 'Напишите несколько вариантов, по одному в строке. Ничего не выбирается за вас. Выбирайте, только если подходит.',
    movePlaceholder: 'Например: встать и потянуться',
    chosen: 'Ваш следующий небольшой шаг',
    clear: 'Убрать',
  },
};

const hourLabel = (hour) => `${String(hour).padStart(2, '0')}:00`;

function loadSettings() {
  return readReminderSettings(store.load(REMINDERS_KEY, null));
}

export function ReminderSettings() {
  const { lang } = useApp();
  const localeKey = COPY[lang] ? lang : 'en';
  const copy = COPY[localeKey];
  const [settings, setSettings] = useState(loadSettings);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState('');

  const now = new Date();
  const decision = reminderDecision(settings, now);
  const skippedToday = settings.skipDate === localDateKey(now);
  const activeMode = settings.channel ?? 'off';
  const options = draft.split('\n').map(chooseMove).filter(Boolean).slice(0, MAX_OPTIONS);

  const commit = (next) => {
    setSettings(next);
    store.save(REMINDERS_KEY, next);
  };

  // Removes this browser's device token. It runs only when a device channel was confirmed.
  const withdrawDevice = async () => {
    try { await disablePushReminder(); } catch { /* the token may already be gone */ }
  };

  const chooseMode = async (mode) => {
    if (mode === activeMode) return;
    if (mode === 'off') {
      if (settings.deviceConfirmed) await withdrawDevice();
      commit({ ...settings, optIn: false, channel: null, deviceConfirmed: false });
      setMessage(copy.offDone);
      return;
    }
    if (mode === 'in-app') {
      if (settings.deviceConfirmed) await withdrawDevice();
      commit({ ...settings, optIn: true, channel: 'in-app', deviceConfirmed: false });
      setMessage(copy.inAppOn);
      return;
    }
    // Choosing the device channel asks for nothing. The explicit button below is the only opt-in.
    if (settings.deviceConfirmed) await withdrawDevice();
    commit({ ...settings, optIn: false, channel: 'device', deviceConfirmed: false });
    setMessage(copy.deviceNeedsClick);
  };

  // The only call into push.ts, and it runs only from this click.
  const allowDevice = async () => {
    setBusy(true);
    let result;
    try {
      result = await enablePushReminder();
    } catch {
      result = 'unsupported';
    }
    setBusy(false);
    const latest = loadSettings();
    if (result === 'enabled') {
      commit({ ...latest, optIn: true, channel: 'device', deviceConfirmed: true });
      setMessage(copy.deviceOn);
      return;
    }
    commit({ ...latest, optIn: false, channel: 'device', deviceConfirmed: false });
    setMessage(result === 'unsupported' ? copy.deviceUnsupported : copy.deviceDenied);
  };

  const setQuiet = (on) => commit({ ...settings, quietHours: on ? DEFAULT_QUIET : null });
  const setQuietHour = (edge, hour) => commit({ ...settings, quietHours: { ...(settings.quietHours ?? DEFAULT_QUIET), [edge]: hour } });

  const pickMove = (option) => {
    const move = chooseMove(option);
    if (move) commit({ ...settings, move });
  };

  // A device channel that was chosen but not yet allowed is explained as waiting, not as plain "off".
  const waitingForDevice = activeMode === 'device' && !settings.deviceConfirmed;
  const statusText = decision.reason === 'ok'
    ? copy.status.ok(decision.channel)
    : waitingForDevice ? copy.status['device-not-confirmed'] : copy.status[decision.reason];

  return (
    <section className="card mt16" aria-labelledby="reminder-settings-title">
      <div className="kicker" style={{ color: 'var(--accent-text)' }}>{copy.kicker}</div>
      <div className="h2 mt6" id="reminder-settings-title">{copy.title}</div>
      <p className="sub mt8" style={{ fontSize: 12.5 }}>{copy.intro}</p>

      <div className="kicker mt16">{copy.channel}</div>
      <div role="group" aria-label={copy.channel} className="seg mt8">
        {MODES.map((mode) => (
          <button key={mode} type="button" className={activeMode === mode ? 'on' : ''}
            aria-pressed={activeMode === mode} disabled={busy} onClick={() => chooseMode(mode)}>
            {copy.modes[mode]}
          </button>
        ))}
      </div>

      {activeMode === 'device' && !settings.deviceConfirmed && (
        <div className="card flat mt10">
          <p className="sub" style={{ fontSize: 12.5 }}>{copy.deviceExplain}</p>
          <button className="btn small primary mt8" disabled={busy} onClick={allowDevice}>
            {busy ? copy.allowing : copy.allowDevice}
          </button>
        </div>
      )}

      <div className="card flat mt16" style={{ padding: 14 }}>
        <label className="row" style={{ gap: 10, minHeight: 40, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.quietHours !== null} style={{ width: 22, height: 22, flex: '0 0 22px', accentColor: 'var(--accent)' }}
            onChange={(event) => setQuiet(event.target.checked)} />
          <span>{copy.quietTitle}</span>
        </label>
        {settings.quietHours && (
          <div className="row mt8" style={{ flexWrap: 'wrap' }}>
            <div className="field grow" style={{ marginBottom: 0 }}>
              <label htmlFor="reminder-quiet-start">{copy.quietFrom}</label>
              <select id="reminder-quiet-start" className="drop" value={settings.quietHours.startHour}
                onChange={(event) => setQuietHour('startHour', Number(event.target.value))}>
                {Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{hourLabel(hour)}</option>)}
              </select>
            </div>
            <div className="field grow" style={{ marginBottom: 0 }}>
              <label htmlFor="reminder-quiet-end">{copy.quietUntil}</label>
              <select id="reminder-quiet-end" className="drop" value={settings.quietHours.endHour}
                onChange={(event) => setQuietHour('endHour', Number(event.target.value))}>
                {Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{hourLabel(hour)}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="row mt16" style={{ flexWrap: 'wrap', gap: 8 }}>
        {skippedToday ? (
          <>
            <span className="sub" style={{ fontSize: 12.5 }}>{copy.skippedToday}</span>
            <button className="btn small ghost" onClick={() => commit(resumeToday(settings))}>{copy.resume}</button>
          </>
        ) : (
          <button className="btn small ghost" disabled={activeMode === 'off'} onClick={() => commit(skipToday(settings, now))}>{copy.skip}</button>
        )}
      </div>

      <p className="mt12" aria-live="polite" style={{ fontSize: 13, lineHeight: 1.45 }}>
        <b>{copy.statusLabel}:</b> {statusText}
      </p>
      {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}

      <div className="kicker mt16">{copy.moveTitle}</div>
      <p className="sub mt8" style={{ fontSize: 12.5 }}>{copy.moveHint}</p>
      <div className="field mt8">
        <textarea aria-label={copy.moveTitle} rows={3} placeholder={copy.movePlaceholder} value={draft}
          onChange={(event) => setDraft(event.target.value)} />
      </div>
      {options.length > 0 && (
        <div className="row mt8" style={{ flexWrap: 'wrap', gap: 8 }}>
          {options.map((option, index) => (
            <button key={`${index}-${option}`} className="chip" onClick={() => pickMove(option)}>{option}</button>
          ))}
        </div>
      )}
      {settings.move && (
        <div className="row mt12" style={{ flexWrap: 'wrap', gap: 8 }}>
          <span className="grow" style={{ fontSize: 14, overflowWrap: 'anywhere' }}>
            <b>{copy.chosen}:</b> {settings.move}
          </span>
          <button className="btn small ghost" onClick={() => commit({ ...settings, move: null })}>{copy.clear}</button>
        </div>
      )}
    </section>
  );
}
