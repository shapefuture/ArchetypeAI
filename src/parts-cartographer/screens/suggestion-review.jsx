import React, { useEffect, useState } from 'react';
import { useApp } from '../app.jsx';
import { store } from '../core/local-store';
import { decideSuggestion } from '../core/ai-suggestions.ts';
import './suggestion-review.css';

export const SUGGESTIONS_KEY = 'INNERVERSE_SUGGESTIONS_V1';
export const MAX_QUEUED = 50;
const MAX_TEXT = 1200;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;

const COPY = {
  en: {
    title: 'Coach suggestions to review',
    notice: 'Nothing here is applied automatically. A schema match does not certify a suggestion. Each one needs a person to review it before anyone relies on it.',
    empty: 'No Coach replies are waiting for review.',
    refused: 'Not offered. It did not pass the bounded check.',
    needsReview: 'Needs review. No reviewed evidence is attached.',
    accepted: 'Accepted for review. It is still not applied.',
    remove: 'Remove',
    clear: 'Clear all',
  },
  ru: {
    title: 'Предложения Коуча для проверки',
    notice: 'Ничего отсюда не применяется автоматически. Соответствие схеме не подтверждает качество предложения. Каждое нужно проверить человеку, прежде чем на него опираться.',
    empty: 'Ответов Коуча, ожидающих проверки, нет.',
    refused: 'Не предлагается: не прошло проверку формы.',
    needsReview: 'Нужна проверка. Проверенных доказательств не приложено.',
    accepted: 'Принято для проверки. Всё ещё не применено.',
    remove: 'Убрать',
    clear: 'Очистить всё',
  },
};

const DECISION_COPY = {
  refused: 'refused',
  'needs-review': 'needsReview',
  'accepted-for-review': 'accepted',
};

/** Shape check only: non-empty, bounded, no control characters. It says nothing about quality or safety. */
export function passesShapeCheck(text) {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_TEXT && !CONTROL_CHARS.test(trimmed);
}

function isEntry(value) {
  return !!value && typeof value === 'object' && typeof value.id === 'string' && typeof value.decision === 'string';
}

export function loadSuggestionQueue() {
  const value = store.load(SUGGESTIONS_KEY, []);
  return Array.isArray(value) ? value.filter(isEntry) : [];
}

function saveQueue(items) {
  store.save(SUGGESTIONS_KEY, items.slice(0, MAX_QUEUED));
}

/**
 * Queue one Coach reply with its decideSuggestion decision. Nothing is applied.
 * Coach replies carry no reviewed evidence, so a passing reply is 'needs-review'.
 * A refused reply keeps no text.
 */
export function queueCoachReply({ text, mode = 'parts', lang = 'ru', now = new Date() }) {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  const suggestion = {
    id: `coach-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'prompt',
    text: trimmed,
    schemaValid: passesShapeCheck(text),
    evidence: null,
  };
  const decision = decideSuggestion(suggestion);
  const entry = {
    id: suggestion.id,
    createdAt: now.toISOString(),
    source: 'coach',
    mode: mode === 'general' ? 'general' : 'parts',
    lang: lang === 'en' ? 'en' : 'ru',
    decision,
    text: decision === 'refused' ? '' : trimmed.slice(0, MAX_TEXT),
  };
  saveQueue([entry, ...loadSuggestionQueue()]);
  return entry;
}

export function dismissSuggestion(id) {
  saveQueue(loadSuggestionQueue().filter((item) => item.id !== id));
}

export function clearSuggestionQueue() {
  saveQueue([]);
}

/**
 * Review queue for AI-suggested text. It only lists and removes items. There is no
 * apply action, because nothing in this queue is ever applied automatically.
 */
export function SuggestionReview({ refreshKey = 0 }) {
  const { lang } = useApp();
  const copy = COPY[lang === 'en' ? 'en' : 'ru'];
  const [items, setItems] = useState(loadSuggestionQueue);

  useEffect(() => { setItems(loadSuggestionQueue()); }, [refreshKey]);

  const remove = (id) => {
    dismissSuggestion(id);
    setItems(loadSuggestionQueue());
  };
  const clear = () => {
    clearSuggestionQueue();
    setItems([]);
  };

  return (
    <details className="sugg-review">
      <summary className="sugg-summary">{copy.title} · {items.length}</summary>
      <p className="sugg-notice" role="note">{copy.notice}</p>
      {items.length === 0 ? (
        <p className="sugg-empty">{copy.empty}</p>
      ) : (
        <>
          <ul className="sugg-list">
            {items.map((item) => (
              <li key={item.id} className={`sugg-item sugg-${item.decision}`}>
                <span className="sugg-badge">{copy[DECISION_COPY[item.decision] ?? 'refused']}</span>
                {item.decision !== 'refused' && item.text ? <p className="sugg-text">{item.text}</p> : null}
                <button type="button" className="sugg-remove" onClick={() => remove(item.id)}>{copy.remove}</button>
              </li>
            ))}
          </ul>
          <button type="button" className="sugg-clear" onClick={clear}>{copy.clear}</button>
        </>
      )}
    </details>
  );
}
