import React, { useState } from 'react';
import { store } from '../core/local-store';
import { appendVersion, latestFor } from '../core/content-versions.ts';

export const PART_VERSIONS_KEY = 'INNERVERSE_PART_VERSIONS_V1';
const RESERVED_NAMES = new Set(['__proto__', 'constructor', 'prototype']);

const COPY = {
  en: {
    kicker: 'Saved versions',
    intro: 'Earlier versions are never edited or deleted. Restoring adds a new version with the old text.',
    localOnly: 'Stored on this device only.',
    empty: 'No saved versions in this language yet.',
    save: 'Save current text as a version',
    saved: (n) => `Saved as version ${n}.`,
    emptyText: 'The text is empty, so nothing was saved.',
    unchanged: 'This text is already the latest saved version.',
    current: 'Latest saved',
    restore: 'Restore',
    restored: (n) => `Restored. The old text is now version ${n}.`,
    noDate: '',
  },
  ru: {
    kicker: 'Сохранённые версии',
    intro: 'Прежние версии никогда не меняются и не удаляются. Восстановление добавляет новую версию со старым текстом.',
    localOnly: 'Хранится только на этом устройстве.',
    empty: 'Сохранённых версий на этом языке пока нет.',
    save: 'Сохранить текущий текст как версию',
    saved: (n) => `Сохранено как версия ${n}.`,
    emptyText: 'Текст пустой, поэтому ничего не сохранено.',
    unchanged: 'Этот текст уже последняя сохранённая версия.',
    current: 'Последняя сохранённая',
    restore: 'Восстановить',
    restored: (n) => `Восстановлено. Старый текст теперь версия ${n}.`,
    noDate: '',
  },
};

function isVersion(item) {
  return item && typeof item === 'object'
    && typeof item.version === 'string' && item.version !== ''
    && typeof item.locale === 'string'
    && typeof item.text === 'string';
}

/** Validates the stored map of part id to versions. Malformed versions are dropped; no version is ever rewritten here. */
export function readVersionMap(raw) {
  const map = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return map;
  for (const [partId, list] of Object.entries(raw)) {
    if (!partId || RESERVED_NAMES.has(partId) || !Array.isArray(list)) continue;
    map[partId] = list
      .filter(isVersion)
      .map((item) => ({
        version: item.version,
        locale: item.locale,
        text: item.text,
        private: item.private !== false,
        ...(typeof item.at === 'string' ? { at: item.at } : {}),
      }));
  }
  return map;
}

export function nextVersionNumber(history, locale) {
  const numbers = history
    .filter((v) => v.locale === locale)
    .map((v) => Number(v.version))
    .filter(Number.isFinite);
  return String(Math.max(0, ...numbers) + 1);
}

/** A new version for this locale. The number is one above the highest in that locale, so it never collides. */
export function makeVersion(history, { locale, text, at }) {
  return { version: nextVersionNumber(history, locale), locale, text, private: true, at };
}

export function PartVersionHistory({ partId, text, lang, onRestore }) {
  const localeKey = COPY[lang] ? lang : 'en';
  const copy = COPY[localeKey];
  const validId = Boolean(partId) && !RESERVED_NAMES.has(partId);
  const [map, setMap] = useState(() => readVersionMap(validId ? store.load(PART_VERSIONS_KEY, {}) : {}));
  const [message, setMessage] = useState('');

  const history = validId ? (map[partId] ?? []) : [];
  const current = typeof text === 'string' ? text : '';
  // Only versions in this language are shown. Another language is never substituted.
  const inLocale = history.filter((v) => v.locale === localeKey);
  const latest = latestFor(history, localeKey);

  const commit = (nextHistory) => {
    const nextMap = { ...map, [partId]: nextHistory };
    setMap(nextMap);
    store.save(PART_VERSIONS_KEY, nextMap);
  };

  const formatDate = (at) => {
    const date = at ? new Date(at) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleString(localeKey === 'ru' ? 'ru-RU' : 'en-US') : copy.noDate;
  };

  const saveVersion = () => {
    const clean = current.trim();
    if (!validId) return;
    if (!clean) { setMessage(copy.emptyText); return; }
    if (latest && latest.text === clean) { setMessage(copy.unchanged); return; }
    const version = makeVersion(history, { locale: localeKey, text: clean, at: new Date().toISOString() });
    commit(appendVersion(history, version));
    setMessage(copy.saved(version.version));
  };

  const restore = (old) => {
    if (!validId) return;
    // Restoring is always recorded as a new version, so the earlier entries are untouched.
    const version = makeVersion(history, { locale: localeKey, text: old.text, at: new Date().toISOString() });
    commit(appendVersion(history, version));
    onRestore?.(old.text);
    setMessage(copy.restored(version.version));
  };

  if (!validId) return null;

  return (
    <section className="card flat mt16" aria-labelledby={`part-history-${partId}`}>
      <div className="kicker" style={{ color: 'var(--accent-text)' }} id={`part-history-${partId}`}>{copy.kicker}</div>
      <p className="sub mt8" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{copy.intro}</p>
      <p className="faint mt4" style={{ fontSize: 12 }}>{copy.localOnly}</p>

      <div className="row mt12" style={{ flexWrap: 'wrap' }}>
        <button className="btn small ghost" disabled={!current.trim()} onClick={saveVersion}>{copy.save}</button>
      </div>
      {message && <p className="faint mt8" role="status" style={{ fontSize: 12 }}>{message}</p>}

      {inLocale.length === 0 ? (
        <p className="sub mt12" style={{ fontSize: 13 }}>{copy.empty}</p>
      ) : (
        <ol className="mt12" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
          {[...inLocale].reverse().map((entry) => {
            const isLatest = latest !== null && entry === latest;
            return (
              <li key={`${entry.locale}-${entry.version}`} className="card flat" style={{ padding: 12 }}>
                <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                  <b className="grow" style={{ fontSize: 13 }}>
                    {localeKey === 'ru' ? `Версия ${entry.version}` : `Version ${entry.version}`}
                  </b>
                  {isLatest ? (
                    <span className="chip on">{copy.current}</span>
                  ) : (
                    <button className="btn small ghost" onClick={() => restore(entry)}>{copy.restore}</button>
                  )}
                </div>
                {formatDate(entry.at) && <div className="faint mt4" style={{ fontSize: 11 }}>{formatDate(entry.at)}</div>}
                <p className="mt8" style={{ fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{entry.text}</p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
