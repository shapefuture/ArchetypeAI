import React from 'react';

// Last line of defence: a render or effect crash at the root must never leave
// a blank page. The person can reload, save everything stored on this device,
// or, after confirming, reset the app's local data.
const COPY = {
  en: {
    title: 'Something went wrong',
    body: 'The app hit an error while starting. Your data is still on this device. Save it first if you plan to reset.',
    reload: 'Reload',
    save: 'Save my data',
    reset: 'Reset app data on this device',
    confirm: 'Delete everything this app stores on this device? Save your data first if you want to keep it.',
  },
  ru: {
    title: 'Что-то пошло не так',
    body: 'При запуске приложения произошла ошибка. Ваши данные по-прежнему на этом устройстве. Если собираетесь сбросить приложение, сначала сохраните их.',
    reload: 'Перезагрузить',
    save: 'Сохранить мои данные',
    reset: 'Сбросить данные приложения на этом устройстве',
    confirm: 'Удалить всё, что приложение хранит на этом устройстве? Если хотите сохранить данные, сначала скачайте их.',
  },
};

function language() {
  try { return JSON.parse(localStorage.getItem('ifs.lang') ?? '"en"') === 'ru' ? 'ru' : 'en'; } catch { return 'en'; }
}

/** Everything in local storage, as a backup file the Restore screen accepts. */
export function localDataSnapshot() {
  const data = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    const raw = localStorage.getItem(key);
    try { data[key] = JSON.parse(raw); } catch { data[key] = raw; }
  }
  return { schema: 'parts-cartographer.backup.v2', exportedAt: new Date().toISOString(), data };
}

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('App crashed', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const copy = COPY[language()];
    const save = () => {
      const blob = new Blob([JSON.stringify(localDataSnapshot(), null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'innerverse-backup.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    };
    const reset = () => {
      if (!window.confirm(copy.confirm)) return;
      try { localStorage.clear(); } catch { /* storage unavailable */ }
      window.location.reload();
    };
    return (
      <main role="alert" style={{ maxWidth: 420, margin: '15vh auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 22 }}>{copy.title}</h1>
        <p style={{ lineHeight: 1.5 }}>{copy.body}</p>
        <p><button type="button" onClick={() => window.location.reload()}>{copy.reload}</button></p>
        <p><button type="button" onClick={save}>{copy.save}</button></p>
        <p><button type="button" onClick={reset}>{copy.reset}</button></p>
      </main>
    );
  }
}
