import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../app.jsx';
import { applyBackup, prepareBackup } from '../core/backup';

const COPY = {
  en: { skipped: (n) => `${n} damaged item(s) in this file will be left out; everything else restores.`, choose: 'Choose a backup file', preview: 'Review local restore', source: 'Source', records: 'Local records', merge: 'Merge with this device', replace: 'Replace portable data on this device', privacy: 'This restores local data. It does not upload anything or change your account.', busy: 'Checking file…', apply: 'Restore this backup', error: 'The backup could not be restored. Check the format and available storage; your existing data was retained.' },
  ru: { skipped: (n) => `Повреждённых записей в файле: ${n}. Их не восстановить, всё остальное восстановится.`, choose: 'Выберите файл резервной копии', preview: 'Проверка локального восстановления', source: 'Источник', records: 'Локальные записи', merge: 'Объединить с данными устройства', replace: 'Заменить переносимые данные на устройстве', privacy: 'Восстановление выполняется локально. Данные не загружаются в сеть, аккаунт не меняется.', busy: 'Проверяем файл…', apply: 'Восстановить эту копию', error: 'Не удалось восстановить копию. Проверьте формат и свободное место; прежние данные сохранены.' },
};

export function BackupRestore() {
  const { lang, t, parts, toast, setOverlay } = useApp();
  const ui = COPY[lang];
  const [backup, setBackup] = useState(null);
  const [mode, setMode] = useState('merge');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  const choose = async (event) => {
    const version = ++generation.current;
    const file = event.target.files?.[0];
    setBackup(null);
    setError('');
    if (!file) { setBusy(false); return; }
    setBusy(true);
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('size');
      const prepared = await prepareBackup(await file.text(), lang, parts);
      if (version === generation.current) setBackup(prepared);
    } catch { if (version === generation.current) setError(ui.error); }
    finally { if (version === generation.current) setBusy(false); }
  };
  return <div className="overlay"><header className="ov-head"><h1 className="grow h2">{t('restore')}</h1><button className="ibtn" aria-label={t('close')} onClick={() => setOverlay(null)}>✕</button></header><div className="ov-body">
    <p className="sub">{ui.privacy}</p><label className="field mt16">{ui.choose}<input type="file" accept="application/json,.json" onChange={choose} /></label>
    {busy && <p role="status">{ui.busy}</p>}{error && <p className="sub mt12" role="alert">{error}</p>}
    {backup && <div className="card mt16"><h2 className="h2">{ui.preview}</h2><p className="sub mt8">{ui.source}: {backup.source === 'angular-descent147' ? (lang === 'ru' ? 'Карта 147 ответов' : '147-answer map') : backup.source === 'angular-assessment64' ? (lang === 'ru' ? 'Тест отношений' : 'Relational assessment') : 'Innerverse'} · {ui.records}: {Object.keys(backup.entries).length}</p>
      <p className="sub mt8">{Object.keys(backup.entries).map((key) => key === 'ifs.parts' ? t('parts') : key === 'ifs.profile' ? t('report') : key === 'INNERVERSE_FUTURE_SELF_V1' ? lang === 'ru' ? 'Будущее «я»' : 'Future Self' : key.includes('HISTORY') || key.includes('history') ? t('history') : key.includes('ASSESSMENT') || key.includes('DESCENT') || key.includes('PROFILE') ? t('assessment') : t('restore')).filter((label, index, all) => all.indexOf(label) === index).join(' · ')}</p>
      {backup.skipped?.length > 0 && <p className="sub mt8" role="status">⚠ {ui.skipped(backup.skipped.length)}</p>}
      <label className="row mt16"><input type="radio" name="restore-mode" checked={mode === 'merge'} onChange={() => setMode('merge')} />{ui.merge}</label>
      <label className="row mt12"><input type="radio" name="restore-mode" checked={mode === 'replace'} onChange={() => setMode('replace')} />{ui.replace}</label>
      <button className="btn primary block mt16" onClick={() => { try { applyBackup(backup, localStorage, mode); toast('✓ ' + t('restoreOk')); setOverlay(null); } catch { setError(ui.error); } }}>{ui.apply}</button>
    </div>}
  </div></div>;
}
