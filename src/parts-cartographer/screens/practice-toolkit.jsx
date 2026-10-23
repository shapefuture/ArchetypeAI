import React, { useId, useState } from 'react';
import { useApp } from '../app.jsx';
import { store } from '../core/local-store';
import { createCard, recordOutcome, summarizeExperiments, OUTCOMES } from '../core/experiment-outcome.ts';
import {
  MAX_INTERVAL_DAYS,
  MIN_INTERVAL_DAYS,
  REVIEW_RESULTS,
  activeProbes,
  applyAdjustment,
  nextInterval,
  scoreFor,
} from '../core/recall-review.ts';
import { chooseReward, isEssentialLocked, progressFor, revise } from '../core/artifact-progression.ts';
import { addEndpoint, createSeason } from '../core/practice-season.ts';
import { MAX_HYPOTHESES, MAX_QUESTIONS } from '../core/situation-inquiry.ts';
import './practice-toolkit.css';

// Shared per-viewer toolkit state (INNERVERSE_TOOLKIT_V1). Read and written only through the helpers below.
// Corrupt or unexpected values are dropped on load, so a bad value falls back to an empty field.

export const TOOLKIT_KEY = 'INNERVERSE_TOOLKIT_V1';
const TOOLKIT_VERSION = 1;
export const SEASON_ID = 'season-current';
export const PROBE_IDS = ['room', 'day', 'people', 'topic'];
export const KIND_IDS = ['note', 'letter', 'plan', 'other'];
export const ESSENTIAL_IDS = ['grounding', 'safe-place'];
const RECORDABLE = ['tried', 'adapted', 'did-not-try'];
const SECTION_IDS = ['experiments', 'review', 'artifacts', 'season'];

const COPY = {
  en: {
    title: 'Practice toolkit',
    intro: 'Small tools, used at your own pace. Nothing here is scored, and any part can be left unfinished.',
    tabs: { experiments: 'Experiments', review: 'Review', artifacts: 'Artifacts', season: 'Season' },
    notKept: 'This browser could not keep that change. It applies to this visit only.',
    cancel: 'Cancel',
    // Experiments
    expNew: 'New card',
    expEditing: 'Edit card',
    expSituation: 'If this situation comes up…',
    expAction: '…then I will…',
    expPrediction: 'I predict… (optional)',
    expSave: 'Save card',
    expUpdate: 'Save changes',
    expNeed: 'Add a situation and an action to save the card.',
    expEdit: 'Edit card',
    expRecordOpen: 'Record an outcome',
    expEmpty: 'No cards yet. Write one when a situation is coming up.',
    expChoose: 'How did it go?',
    expNote: 'A note (optional)',
    expSaveOutcome: 'Save outcome',
    expSkip: 'Continue without recording',
    expNothingStored: 'Nothing is stored for this choice, not even a note.',
    expRecorded: 'Outcome recorded.',
    expNotRecorded: 'Nothing was recorded.',
    expSummary: 'Summary',
    expRecordedCount: (n) => `Recorded: ${n}`,
    expSummaryNote: 'Counts only. They do not score anything and do not claim that the action caused a result.',
    outcomes: { tried: 'I tried it', adapted: 'I adapted it', 'did-not-try': 'I did not try it', 'do-not-record': 'Do not record this' },
    // Review
    revIntro: 'Try to recall first, without the hint. A gap is information, not a failure, and it never shortens the schedule.',
    revAddTitle: 'Add something to recall',
    revPrompt: 'What would you like to recall?',
    revCue: 'A hint (optional, shown only if you ask)',
    revAdd: 'Add to review',
    revNeed: 'Write what you would like to recall.',
    revEmpty: 'Nothing to review yet.',
    revToday: 'Ready today',
    revNext: (d) => `Next review ${d}`,
    revOpen: 'Review now',
    revClose: 'Close',
    revRecallFirst: 'Recall it first, without looking.',
    revShowHint: 'Show the hint',
    revResults: { recalled: 'Recalled', 'cue-helped': 'Recalled with the hint', 'could-not-recall': 'Could not recall', skipped: 'Skip for now' },
    revAfter: {
      recalled: 'Recorded. The next review is further out.',
      'cue-helped': 'Recorded. The schedule stays as it was.',
      'could-not-recall': 'Recorded. A gap is information, not a failure. The schedule stays as it was.',
      skipped: 'Skipped for now. The schedule stays as it was.',
    },
    revChecks: 'Things to check, if they fit',
    revNoChecks: 'No checks are switched on. You can switch some on below.',
    revSwitches: 'Checks you can switch on',
    revSwitchesNote: 'Only the checks you switch on appear with a review. Nothing is applied for you.',
    revOptions: 'Practical options (you choose; nothing changes by itself)',
    revAdjust: 'Change the interval',
    revDays: 'Days until the next review',
    revPreview: 'Preview',
    revPreviewText: (d) => `If you confirm, the next review moves to ${d} days from today.`,
    revConfirm: 'Confirm change',
    revChanged: 'Interval changed.',
    revNothing: 'Nothing has changed yet.',
    revBadDays: 'Enter a whole number of days.',
    probes: {
      room: 'Was it a different room?',
      day: 'Was it a different day?',
      people: 'Was someone else there?',
      topic: 'Was it a different topic?',
    },
    environment: [
      'Try the same practice in a quieter place.',
      'Try it at a different time of day.',
      'Set a reminder at a time that already fits your routine.',
      'Ask someone you trust to check in, if you want that.',
    ],
    // Artifacts
    artIntro: 'Keep what you make. Revising adds to your progress and never removes anything.',
    artMade: 'Made',
    artRevised: 'Revised',
    artLast: 'Last made',
    artEmpty: 'Nothing made yet.',
    artTitle: 'Title',
    artKind: 'Kind',
    artAdd: 'Save artifact',
    artNeed: 'Give it a title to save it.',
    artRevise: 'Revise',
    artRevisedTimes: (n) => `Revised ${n} ${n === 1 ? 'time' : 'times'}`,
    kinds: { note: 'Note', letter: 'Letter', plan: 'Plan', other: 'Other' },
    rewardTitle: 'Workshop reward (optional)',
    rewardIntro: 'Choose one reward, or none. A reward never locks or unlocks anything.',
    rewardOptions: 'Your options',
    rewardNone: 'No options yet. Tap an idea below to add it.',
    rewardSuggest: 'Ideas (tap to add and choose)',
    rewardSuggestions: ['A short walk', 'A favorite song', 'Tea somewhere quiet', 'A kind message to someone you trust'],
    rewardChosen: 'Chosen',
    rewardClear: 'Clear choice',
    rewardAddPh: 'Add your own option',
    rewardAdd: 'Add',
    essentialsTitle: 'Always open',
    essentialsNote: 'Rewards never gate these.',
    essentials: { grounding: 'Grounding', 'safe-place': 'Safe place' },
    open: 'Open',
    locked: 'Locked',
    // Season
    seaIntro: 'Your own goals and endpoints. No length is set unless you set one. There is no ranking and no comparison.',
    seaGoals: 'Goals (one per line)',
    seaLength: 'Length in days (optional)',
    seaNoLength: 'No set length. Pause or stop whenever you like.',
    seaSave: 'Save season',
    seaEndpoints: 'Endpoints',
    seaEndpointsNote: 'Something you would like to make, or a moment you would like to reach.',
    seaEndpointPh: 'Add an endpoint',
    seaAdd: 'Add',
    seaEmpty: 'No endpoints yet.',
    seaSaved: 'Season saved.',
    locale: 'en-US',
  },
  ru: {
    title: 'Набор практик',
    intro: 'Небольшие инструменты, которыми можно пользоваться в своём темпе. Ничего здесь не оценивается, и любую часть можно оставить незавершённой.',
    tabs: { experiments: 'Опыты', review: 'Повторение', artifacts: 'Артефакты', season: 'Сезон' },
    notKept: 'Этот браузер не смог сохранить изменение. Оно действует только в этом визите.',
    cancel: 'Отмена',
    expNew: 'Новая карточка',
    expEditing: 'Изменить карточку',
    expSituation: 'Если возникает такая ситуация…',
    expAction: '…тогда я…',
    expPrediction: 'Я предполагаю… (необязательно)',
    expSave: 'Сохранить карточку',
    expUpdate: 'Сохранить изменения',
    expNeed: 'Чтобы сохранить карточку, опишите ситуацию и действие.',
    expEdit: 'Изменить карточку',
    expRecordOpen: 'Отметить результат',
    expEmpty: 'Карточек пока нет. Напишите одну, когда ситуация приближается.',
    expChoose: 'Как прошло?',
    expNote: 'Заметка (необязательно)',
    expSaveOutcome: 'Сохранить результат',
    expSkip: 'Продолжить без записи',
    expNothingStored: 'Для этого выбора ничего не сохраняется, даже заметка.',
    expRecorded: 'Результат записан.',
    expNotRecorded: 'Ничего не записано.',
    expSummary: 'Итоги',
    expRecordedCount: (n) => `Записано: ${n}`,
    expSummaryNote: 'Только счётчики. Они ничего не оценивают и не утверждают, что действие что-то вызвало.',
    outcomes: { tried: 'Я попробовал(а)', adapted: 'Я адаптировал(а)', 'did-not-try': 'Я не пробовал(а)', 'do-not-record': 'Не записывать' },
    revIntro: 'Сначала попробуйте вспомнить без подсказки. Пробел в памяти — это информация, а не провал, и он никогда не сокращает расписание.',
    revAddTitle: 'Добавить, что вспомнить',
    revPrompt: 'Что вы хотите вспомнить?',
    revCue: 'Подсказка (необязательно, показывается только по запросу)',
    revAdd: 'Добавить в повторение',
    revNeed: 'Напишите, что вы хотите вспомнить.',
    revEmpty: 'Пока нечего повторять.',
    revToday: 'Можно сегодня',
    revNext: (d) => `Следующее повторение: ${d}`,
    revOpen: 'Повторить сейчас',
    revClose: 'Закрыть',
    revRecallFirst: 'Сначала вспомните сами, не глядя.',
    revShowHint: 'Показать подсказку',
    revResults: { recalled: 'Вспомнил(а)', 'cue-helped': 'Вспомнил(а) с подсказкой', 'could-not-recall': 'Не вспомнил(а)', skipped: 'Пропустить сейчас' },
    revAfter: {
      recalled: 'Записано. Следующее повторение будет позже.',
      'cue-helped': 'Записано. Расписание не меняется.',
      'could-not-recall': 'Записано. Пробел — это информация, а не провал. Расписание не меняется.',
      skipped: 'Пропущено сейчас. Расписание не меняется.',
    },
    revChecks: 'Что стоит проверить, если подходит',
    revNoChecks: 'Проверки не включены. Некоторые можно включить ниже.',
    revSwitches: 'Проверки, которые можно включить',
    revSwitchesNote: 'К повторению показываются только включённые проверки. Ничего не применяется само.',
    revOptions: 'Практичные варианты (выбираете вы; ничего не меняется само)',
    revAdjust: 'Изменить интервал',
    revDays: 'Дней до следующего повторения',
    revPreview: 'Посмотреть',
    revPreviewText: (d) => `Если подтвердите, следующее повторение будет через ${d} дн. от сегодня.`,
    revConfirm: 'Подтвердить изменение',
    revChanged: 'Интервал изменён.',
    revNothing: 'Пока ничего не изменилось.',
    revBadDays: 'Введите целое число дней.',
    probes: {
      room: 'Это было в другой комнате?',
      day: 'Это было в другой день?',
      people: 'Был ли рядом кто-то другой?',
      topic: 'Это была другая тема?',
    },
    environment: [
      'Попробуйте ту же практику в более тихом месте.',
      'Попробуйте в другое время дня.',
      'Поставьте напоминание на время, которое уже вписывается в ваш день.',
      'Попросите близкого человека спросить, как вы, если хотите.',
    ],
    artIntro: 'Сохраняйте то, что создали. Доработка добавляется к прогрессу и ничего не убирает.',
    artMade: 'Создано',
    artRevised: 'Доработано',
    artLast: 'Последнее создание',
    artEmpty: 'Пока ничего не создано.',
    artTitle: 'Название',
    artKind: 'Вид',
    artAdd: 'Сохранить артефакт',
    artNeed: 'Чтобы сохранить, дайте название.',
    artRevise: 'Доработать',
    artRevisedTimes: (n) => `Доработано: ${n}`,
    kinds: { note: 'Заметка', letter: 'Письмо', plan: 'План', other: 'Другое' },
    rewardTitle: 'Награда мастерской (необязательно)',
    rewardIntro: 'Выберите одну награду или ни одной. Награда никогда ничего не закрывает и не открывает.',
    rewardOptions: 'Ваши варианты',
    rewardNone: 'Вариантов пока нет. Нажмите идею ниже, чтобы добавить её.',
    rewardSuggest: 'Идеи (нажмите, чтобы добавить и выбрать)',
    rewardSuggestions: ['Короткая прогулка', 'Любимая песня', 'Чай в тихом месте', 'Тёплое сообщение близкому человеку'],
    rewardChosen: 'Выбрано',
    rewardClear: 'Снять выбор',
    rewardAddPh: 'Добавить свой вариант',
    rewardAdd: 'Добавить',
    essentialsTitle: 'Всегда открыто',
    essentialsNote: 'Награды никогда не закрывают эти разделы.',
    essentials: { grounding: 'Заземление', 'safe-place': 'Безопасное место' },
    open: 'Открыто',
    locked: 'Закрыто',
    seaIntro: 'Ваши цели и ориентиры. Длительность не задана, пока вы её не укажете. Здесь нет рейтинга и сравнения.',
    seaGoals: 'Цели (по одной в строке)',
    seaLength: 'Длительность в днях (необязательно)',
    seaNoLength: 'Срок не задан. Можно приостановить или остановиться в любой момент.',
    seaSave: 'Сохранить сезон',
    seaEndpoints: 'Ориентиры',
    seaEndpointsNote: 'Что-то, что вы хотели бы создать, или момент, которого хотели бы достичь.',
    seaEndpointPh: 'Добавить ориентир',
    seaAdd: 'Добавить',
    seaEmpty: 'Ориентиров пока нет.',
    seaSaved: 'Сезон сохранён.',
    locale: 'ru-RU',
  },
};

export const copyFor = (lang) => COPY[lang === 'ru' ? 'ru' : 'en'];

// ---------- dates and ids ----------

const pad = (n) => String(n).padStart(2, '0');

export function localIsoDay(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(isoDay, days) {
  const [year, month, day] = isoDay.split('-').map(Number);
  return localIsoDay(new Date(year, month - 1, day + days));
}

export function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const formatDay = (isoDay, locale) => {
  const [year, month, day] = isoDay.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
};

const formatStamp = (stamp, locale) => new Date(stamp).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });

const clampDays = (days) => Math.min(MAX_INTERVAL_DAYS, Math.max(MIN_INTERVAL_DAYS, Math.round(days)));

/** Whole days from free text, clamped to the module bounds. Blank or non-positive text gives null. */
export function parseDays(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value > 0 ? clampDays(value) : null;
}

// ---------- validation of stored data ----------

const isObj = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = (value) => typeof value === 'string';
const listOf = (value, keep) => (Array.isArray(value) ? value.filter(keep) : []);
const isIsoDay = (value) => isText(value) && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isStamp = (value) => isText(value) && Number.isFinite(Date.parse(value));

function cleanSeason(value) {
  if (!isObj(value) || !isText(value.id)) return null;
  return {
    id: value.id,
    goals: listOf(value.goals, isText),
    endpoints: listOf(value.endpoints, isText),
    lengthDays: Number.isInteger(value.lengthDays) && value.lengthDays > 0 ? value.lengthDays : null,
  };
}

const isCard = (card) => isObj(card) && isText(card.id) && isText(card.situation) && isText(card.action)
  && card.authoredBy === 'user' && (card.prediction === undefined || isText(card.prediction));

const isRecordedOutcome = (entry) => isObj(entry) && entry.recorded === true && isText(entry.cardId)
  && RECORDABLE.includes(entry.outcome) && (entry.note === null || entry.note === undefined || isText(entry.note));

function cleanOutcome(entry) {
  return { recorded: true, cardId: entry.cardId, outcome: entry.outcome, note: entry.note ?? null, scoreDelta: 0, causalClaim: false };
}

const isReview = (item) => isObj(item) && isText(item.id) && isText(item.prompt)
  && (item.cue === undefined || isText(item.cue)) && Number.isFinite(item.intervalDays) && isIsoDay(item.dueOn);

function cleanReview(item) {
  return {
    id: item.id,
    prompt: item.prompt,
    cue: item.cue ?? '',
    intervalDays: clampDays(item.intervalDays),
    dueOn: item.dueOn,
    lastResult: REVIEW_RESULTS.includes(item.lastResult) ? item.lastResult : null,
    lastScored: item.lastScored === true,
  };
}

const isArtifact = (item) => isObj(item) && isText(item.id) && isText(item.title) && KIND_IDS.includes(item.kind)
  && isStamp(item.createdAt) && Number.isInteger(item.revisedCount) && item.revisedCount >= 0;

const isReward = (item) => isObj(item) && isText(item.id) && isText(item.label) && item.chosenBy === 'user';

function cleanProbes(value) {
  if (!isObj(value)) return {};
  return Object.fromEntries(PROBE_IDS.filter((id) => value[id] === true).map((id) => [id, true]));
}

function cleanInquiry(value) {
  if (!isObj(value) || !isText(value.observation) || !value.observation.trim()) return null;
  return {
    observation: value.observation,
    answers: listOf(value.answers, (a) => isObj(a) && isText(a.id) && isText(a.text)).slice(0, MAX_QUESTIONS),
    hypotheses: listOf(value.hypotheses, (h) => isObj(h) && isText(h.id) && isText(h.text))
      .slice(0, MAX_HYPOTHESES)
      .map((h) => ({ id: h.id, text: h.text, linkedAnswerId: isText(h.linkedAnswerId) ? h.linkedAnswerId : null })),
    unknowns: listOf(value.unknowns, isText),
    rejected: listOf(value.rejected, isText),
    corrections: listOf(value.corrections, isText),
    nextAction: isText(value.nextAction) ? value.nextAction : null,
    questionsAsked: Number.isInteger(value.questionsAsked) ? Math.min(Math.max(value.questionsAsked, 0), MAX_QUESTIONS) : 0,
  };
}

/** Turns any stored value into a complete toolkit. Anything unexpected is dropped. */
export function normalizeToolkit(raw) {
  const src = isObj(raw) ? raw : {};
  return {
    season: cleanSeason(src.season),
    cards: listOf(src.cards, isCard),
    outcomes: listOf(src.outcomes, isRecordedOutcome).map(cleanOutcome),
    reviews: listOf(src.reviews, isReview).map(cleanReview),
    probes: cleanProbes(src.probes),
    artifacts: listOf(src.artifacts, isArtifact),
    rewardOptions: listOf(src.rewardOptions, isReward),
    rewardChoice: isText(src.rewardChoice) ? src.rewardChoice : null,
    inquiry: cleanInquiry(src.inquiry),
  };
}

// ---------- storage ----------

export function loadToolkit() {
  return normalizeToolkit(store.load(TOOLKIT_KEY, null));
}

/** Writes a value and reads it back. Returns false when this browser did not keep it. */
export function persist(key, value) {
  store.save(key, value);
  return JSON.stringify(store.load(key, undefined)) === JSON.stringify(value);
}

export function saveToolkit(toolkit) {
  return persist(TOOLKIT_KEY, { version: TOOLKIT_VERSION, ...toolkit });
}

// ---------- pure updates (each returns a new toolkit; nothing is stored here) ----------

/** Records one outcome. "do-not-record" returns the toolkit unchanged: no entry, no note. */
export function recordExperimentOutcome(toolkit, cardId, outcome, note) {
  const card = toolkit.cards.find((item) => item.id === cardId);
  if (!card) return { toolkit, recorded: false };
  const entry = recordOutcome(card, outcome, note);
  if (!entry.recorded) return { toolkit, recorded: false };
  return { toolkit: { ...toolkit, outcomes: [...toolkit.outcomes, cleanOutcome(entry)] }, recorded: true };
}

export function saveExperimentCard(toolkit, draft, editingId) {
  const id = editingId ?? newId('card');
  const card = createCard({
    id,
    situation: draft.situation,
    action: draft.action,
    prediction: draft.prediction,
    authoredBy: 'user',
  });
  if (!card) return { toolkit, card: null };
  const cards = editingId
    ? toolkit.cards.map((item) => (item.id === editingId ? card : item))
    : [...toolkit.cards, card];
  return { toolkit: { ...toolkit, cards }, card };
}

export function addReviewItem(toolkit, prompt, cue, now = new Date()) {
  const text = prompt.trim();
  if (!text) return { toolkit, item: null };
  const item = {
    id: newId('review'),
    prompt: text,
    cue: cue.trim(),
    intervalDays: MIN_INTERVAL_DAYS,
    dueOn: localIsoDay(now),
    lastResult: null,
    lastScored: false,
  };
  return { toolkit: { ...toolkit, reviews: [...toolkit.reviews, item] }, item };
}

/** Recall-first answer. A recall grows the interval; every other result keeps it. Nothing is scored. */
export function answerReviewItem(toolkit, itemId, result, now = new Date()) {
  const item = toolkit.reviews.find((review) => review.id === itemId);
  if (!item || !REVIEW_RESULTS.includes(result)) return { toolkit, item: null };
  const intervalDays = nextInterval({ id: item.id, intervalDays: item.intervalDays }, result);
  const next = {
    ...item,
    intervalDays,
    dueOn: addDays(localIsoDay(now), intervalDays),
    lastResult: result,
    lastScored: scoreFor(result) !== null,
  };
  return {
    toolkit: { ...toolkit, reviews: toolkit.reviews.map((review) => (review.id === itemId ? next : review)) },
    item: next,
  };
}

/** Changes the interval only when confirmed is true. The UI passes true only from its Confirm button. */
export function confirmIntervalChange(toolkit, itemId, days, confirmed, now = new Date()) {
  const item = toolkit.reviews.find((review) => review.id === itemId);
  if (!item) return { toolkit, applied: false };
  const result = applyAdjustment({ id: item.id, intervalDays: item.intervalDays }, { kind: 'set-interval-days', days }, confirmed);
  if (!result.applied) return { toolkit, applied: false };
  const next = { ...item, intervalDays: result.item.intervalDays, dueOn: addDays(localIsoDay(now), result.item.intervalDays) };
  return {
    toolkit: { ...toolkit, reviews: toolkit.reviews.map((review) => (review.id === itemId ? next : review)) },
    applied: true,
  };
}

export function toggleProbe(toolkit, probeId) {
  if (!PROBE_IDS.includes(probeId)) return toolkit;
  const probes = { ...toolkit.probes };
  if (probes[probeId]) delete probes[probeId];
  else probes[probeId] = true;
  return { ...toolkit, probes };
}

/** Only the checks the person has switched on. */
export function switchedOnChecks(toolkit, probeText) {
  return activeProbes(PROBE_IDS.map((id) => ({ id, text: probeText[id], userSelected: toolkit.probes[id] === true })));
}

export function addArtifact(toolkit, title, kind, now = new Date()) {
  const text = title.trim();
  if (!text || !KIND_IDS.includes(kind)) return { toolkit, artifact: null };
  const artifact = { id: newId('artifact'), title: text, kind, createdAt: now.toISOString(), revisedCount: 0 };
  return { toolkit: { ...toolkit, artifacts: [...toolkit.artifacts, artifact] }, artifact };
}

export function reviseArtifactById(toolkit, id) {
  return { ...toolkit, artifacts: revise(toolkit.artifacts, id) };
}

export function addRewardOption(toolkit, label) {
  const text = label.trim();
  if (!text) return { toolkit, option: null };
  const existing = toolkit.rewardOptions.find((option) => option.label === text);
  if (existing) return { toolkit, option: existing };
  const option = { id: newId('reward'), label: text, chosenBy: 'user' };
  return { toolkit: { ...toolkit, rewardOptions: [...toolkit.rewardOptions, option] }, option };
}

export function pickReward(toolkit, id) {
  const reward = chooseReward(toolkit.rewardOptions, id);
  return reward ? { ...toolkit, rewardChoice: reward.id } : toolkit;
}

/** Goals are replaced from the text; endpoints the person already added are kept. Length stays optional. */
export function saveSeason(toolkit, goalsText, lengthText) {
  const base = toolkit.season ?? createSeason(SEASON_ID, []);
  const season = { ...createSeason(base.id, String(goalsText).split('\n'), parseDays(lengthText)), endpoints: base.endpoints };
  return { ...toolkit, season };
}

export function addSeasonEndpoint(toolkit, text) {
  const base = toolkit.season ?? createSeason(SEASON_ID, []);
  return { ...toolkit, season: addEndpoint(base, text) };
}

// ---------- components ----------

export function PracticeToolkit() {
  const { lang } = useApp() ?? {};
  const copy = copyFor(lang);
  const [toolkit, setToolkit] = useState(loadToolkit);
  const [section, setSection] = useState('experiments');
  const [kept, setKept] = useState(true);
  const titleId = useId();

  const commit = (next) => {
    setToolkit(next);
    setKept(saveToolkit(next));
  };

  const shared = { toolkit, commit, copy, locale: copy.locale };

  return (
    <section className="tk" aria-labelledby={titleId}>
      <div className="kicker" id={titleId}>{copy.title}</div>
      <p className="sub">{copy.intro}</p>
      <div className="tk-tabs" role="group" aria-label={copy.title}>
        {SECTION_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={`chip ${section === id ? 'on' : ''}`}
            aria-pressed={section === id}
            onClick={() => setSection(id)}
          >
            {copy.tabs[id]}
          </button>
        ))}
      </div>
      {!kept && <p className="tk-notice" role="status">{copy.notKept}</p>}
      {section === 'experiments' && <ExperimentsPanel {...shared} />}
      {section === 'review' && <ReviewPanel {...shared} />}
      {section === 'artifacts' && <ArtifactsPanel {...shared} />}
      {section === 'season' && <SeasonPanel {...shared} />}
    </section>
  );
}

function ExperimentsPanel({ toolkit, commit, copy }) {
  const uid = useId();
  const emptyDraft = { situation: '', action: '', prediction: '' };
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState(null);
  const [notice, setNotice] = useState('');
  const summary = summarizeExperiments(toolkit.outcomes);

  const startEdit = (card) => {
    setEditingId(card.id);
    setDraft({ situation: card.situation, action: card.action, prediction: card.prediction ?? '' });
    setError('');
  };
  const resetDraft = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setError('');
  };
  const saveCard = () => {
    const result = saveExperimentCard(toolkit, draft, editingId);
    if (!result.card) {
      setError(copy.expNeed);
      return;
    }
    commit(result.toolkit);
    resetDraft();
  };
  const chooseOutcome = (outcome) => {
    setPicked((current) => ({ ...current, outcome, note: outcome === 'do-not-record' ? '' : current.note }));
  };
  const saveOutcome = () => {
    if (!picked?.outcome) return;
    const result = recordExperimentOutcome(toolkit, picked.cardId, picked.outcome, picked.note);
    if (result.recorded) {
      commit(result.toolkit);
      setNotice(copy.expRecorded);
    } else {
      setNotice(copy.expNotRecorded);
    }
    setPicked(null);
  };

  return (
    <div className="tk-stack">
      {notice && <p className="tk-notice" role="status">{notice}</p>}
      <div className="tk-item">
        <div className="kicker">{editingId ? copy.expEditing : copy.expNew}</div>
        <div className="field mt8">
          <label htmlFor={`${uid}-situation`}>{copy.expSituation}</label>
          <input id={`${uid}-situation`} value={draft.situation} onChange={(event) => setDraft({ ...draft, situation: event.target.value })} />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-action`}>{copy.expAction}</label>
          <input id={`${uid}-action`} value={draft.action} onChange={(event) => setDraft({ ...draft, action: event.target.value })} />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-prediction`}>{copy.expPrediction}</label>
          <input id={`${uid}-prediction`} value={draft.prediction} onChange={(event) => setDraft({ ...draft, prediction: event.target.value })} />
        </div>
        {error && <p className="tk-error" role="alert">{error}</p>}
        <div className="tk-row-wrap">
          <button type="button" className="btn primary small" onClick={saveCard}>{editingId ? copy.expUpdate : copy.expSave}</button>
          {editingId && <button type="button" className="btn ghost small" onClick={resetDraft}>{copy.cancel}</button>}
        </div>
      </div>

      {toolkit.cards.length === 0 && <p className="sub">{copy.expEmpty}</p>}
      {toolkit.cards.map((card) => {
        const open = picked?.cardId === card.id;
        return (
          <div className="tk-item" key={card.id}>
            <p className="tk-line"><b>{copy.expSituation}</b> {card.situation}</p>
            <p className="tk-line"><b>{copy.expAction}</b> {card.action}</p>
            {card.prediction && <p className="tk-line faint">{copy.expPrediction} {card.prediction}</p>}
            <div className="tk-row-wrap mt8">
              <button type="button" className="btn ghost small" onClick={() => startEdit(card)}>{copy.expEdit}</button>
              <button
                type="button"
                className="btn small"
                aria-expanded={open}
                onClick={() => setPicked(open ? null : { cardId: card.id, outcome: null, note: '' })}
              >
                {copy.expRecordOpen}
              </button>
            </div>
            {open && (
              <div className="mt12">
                <div className="kicker">{copy.expChoose}</div>
                <div className="tk-grid mt8" role="group" aria-label={copy.expChoose}>
                  {OUTCOMES.map((outcome) => (
                    <button
                      key={outcome}
                      type="button"
                      className={`chip ${picked.outcome === outcome ? 'on' : ''}`}
                      aria-pressed={picked.outcome === outcome}
                      onClick={() => chooseOutcome(outcome)}
                    >
                      {copy.outcomes[outcome]}
                    </button>
                  ))}
                </div>
                {picked.outcome === 'do-not-record' ? (
                  <p className="tk-notice mt8">{copy.expNothingStored}</p>
                ) : (
                  <div className="field mt8">
                    <label htmlFor={`${uid}-note`}>{copy.expNote}</label>
                    <textarea
                      id={`${uid}-note`}
                      rows={2}
                      value={picked.note}
                      disabled={!picked.outcome}
                      onChange={(event) => setPicked({ ...picked, note: event.target.value })}
                    />
                  </div>
                )}
                <div className="tk-row-wrap mt8">
                  <button type="button" className="btn primary small" disabled={!picked.outcome} onClick={saveOutcome}>
                    {picked.outcome === 'do-not-record' ? copy.expSkip : copy.expSaveOutcome}
                  </button>
                  <button type="button" className="btn ghost small" onClick={() => setPicked(null)}>{copy.cancel}</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="tk-item">
        <div className="kicker">{copy.expSummary}</div>
        <p className="mt8"><b>{copy.expRecordedCount(summary.recordedCount)}</b></p>
        <p className="sub mt4">
          {copy.outcomes.tried}: {summary.counts.tried} · {copy.outcomes.adapted}: {summary.counts.adapted} · {copy.outcomes['did-not-try']}: {summary.counts['did-not-try']}
        </p>
        <p className="faint mt8 tk-small">{copy.expSummaryNote}</p>
      </div>
    </div>
  );
}

function ReviewPanel({ toolkit, commit, copy, locale }) {
  const uid = useId();
  const [prompt, setPrompt] = useState('');
  const [cue, setCue] = useState('');
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [adjustDraft, setAdjustDraft] = useState('');
  const [adjust, setAdjust] = useState(null);
  const [notice, setNotice] = useState('');
  const today = localIsoDay(new Date());
  const checks = switchedOnChecks(toolkit, copy.probes);
  const items = [...toolkit.reviews].sort((a, b) => a.dueOn.localeCompare(b.dueOn));

  const addItem = () => {
    const result = addReviewItem(toolkit, prompt, cue, new Date());
    if (!result.item) {
      setError(copy.revNeed);
      return;
    }
    commit(result.toolkit);
    setPrompt('');
    setCue('');
    setError('');
  };
  const toggleOpen = (id) => {
    setOpenId(openId === id ? null : id);
    setHintOpen(false);
    setAdjust(null);
    setAdjustDraft('');
    setError('');
  };
  const answer = (item, result) => {
    const next = answerReviewItem(toolkit, item.id, result, new Date());
    if (!next.item) return;
    commit(next.toolkit);
    setNotice(copy.revAfter[result]);
    toggleOpen(item.id);
  };
  const previewAdjust = () => {
    const days = parseDays(adjustDraft);
    if (!days) {
      setError(copy.revBadDays);
      return;
    }
    setError('');
    setAdjust({ itemId: openId, days });
  };
  const confirmAdjust = () => {
    if (!adjust) return;
    // Explicit confirmation: this click is the only place that passes confirmed = true.
    const result = confirmIntervalChange(toolkit, adjust.itemId, adjust.days, true, new Date());
    if (result.applied) commit(result.toolkit);
    setAdjust(null);
    setAdjustDraft('');
    setNotice(result.applied ? copy.revChanged : copy.revNothing);
  };

  return (
    <div className="tk-stack">
      {notice && <p className="tk-notice" role="status">{notice}</p>}
      <p className="sub">{copy.revIntro}</p>

      <div className="tk-item">
        <div className="kicker">{copy.revAddTitle}</div>
        <div className="field mt8">
          <label htmlFor={`${uid}-prompt`}>{copy.revPrompt}</label>
          <input id={`${uid}-prompt`} value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-cue`}>{copy.revCue}</label>
          <input id={`${uid}-cue`} value={cue} onChange={(event) => setCue(event.target.value)} />
        </div>
        {error && <p className="tk-error" role="alert">{error}</p>}
        <button type="button" className="btn primary small" onClick={addItem}>{copy.revAdd}</button>
      </div>

      {items.length === 0 && <p className="sub">{copy.revEmpty}</p>}
      {items.map((item) => {
        const due = item.dueOn <= today;
        const open = openId === item.id;
        return (
          <div className="tk-item" key={item.id}>
            <div className="tk-row-wrap">
              <b className="grow tk-wrap">{item.prompt}</b>
              <span className="chip">{due ? copy.revToday : copy.revNext(formatDay(item.dueOn, locale))}</span>
            </div>
            <button type="button" className="btn ghost small mt8" aria-expanded={open} onClick={() => toggleOpen(item.id)}>
              {open ? copy.revClose : copy.revOpen}
            </button>
            {open && (
              <div className="mt12">
                <p className="sub">{copy.revRecallFirst}</p>
                {item.cue && (hintOpen
                  ? <p className="tk-hint mt8">{item.cue}</p>
                  : <button type="button" className="btn ghost small mt8" onClick={() => setHintOpen(true)}>{copy.revShowHint}</button>)}
                <div className="tk-grid mt12">
                  {REVIEW_RESULTS.map((result) => (
                    <button key={result} type="button" className="btn small" onClick={() => answer(item, result)}>
                      {copy.revResults[result]}
                    </button>
                  ))}
                </div>

                <div className="kicker mt16">{copy.revChecks}</div>
                {checks.length === 0
                  ? <p className="faint tk-small mt4">{copy.revNoChecks}</p>
                  : <ul className="tk-list mt4">{checks.map((check) => <li key={check.id} className="sub mt4">{check.text}</li>)}</ul>}

                <div className="kicker mt16">{copy.revOptions}</div>
                <ul className="tk-list mt4">
                  {copy.environment.map((line) => <li key={line} className="sub mt4">{line}</li>)}
                </ul>

                <div className="kicker mt16">{copy.revAdjust}</div>
                <div className="tk-row-wrap mt8">
                  <div className="field grow">
                    <label htmlFor={`${uid}-days`}>{copy.revDays}</label>
                    <input
                      id={`${uid}-days`}
                      type="number"
                      inputMode="numeric"
                      min={MIN_INTERVAL_DAYS}
                      max={MAX_INTERVAL_DAYS}
                      step={1}
                      value={adjustDraft}
                      onChange={(event) => setAdjustDraft(event.target.value)}
                    />
                  </div>
                  <button type="button" className="btn small" onClick={previewAdjust}>{copy.revPreview}</button>
                </div>
                {adjust?.itemId === item.id && (
                  <div className="mt8">
                    <p className="sub">{copy.revPreviewText(adjust.days)}</p>
                    <div className="tk-row-wrap mt8">
                      <button type="button" className="btn primary small" onClick={confirmAdjust}>{copy.revConfirm}</button>
                      <button type="button" className="btn ghost small" onClick={() => setAdjust(null)}>{copy.cancel}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="tk-item">
        <div className="kicker">{copy.revSwitches}</div>
        <p className="faint tk-small mt4">{copy.revSwitchesNote}</p>
        {PROBE_IDS.map((id) => (
          <label key={id} className="tk-toggle mt8">
            <input type="checkbox" checked={toolkit.probes[id] === true} onChange={() => commit(toggleProbe(toolkit, id))} />
            <span>{copy.probes[id]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ArtifactsPanel({ toolkit, commit, copy, locale }) {
  const uid = useId();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('note');
  const [error, setError] = useState('');
  const [rewardDraft, setRewardDraft] = useState('');
  const progress = progressFor(toolkit.artifacts);

  const addArt = () => {
    const result = addArtifact(toolkit, title, kind, new Date());
    if (!result.artifact) {
      setError(copy.artNeed);
      return;
    }
    commit(result.toolkit);
    setTitle('');
    setError('');
  };
  const reviseArt = (id) => commit(reviseArtifactById(toolkit, id));
  const pickOption = (id) => commit(pickReward(toolkit, id));
  const addAndPick = (label) => {
    const added = addRewardOption(toolkit, label);
    if (!added.option) return;
    commit(pickReward(added.toolkit, added.option.id));
    setRewardDraft('');
  };
  const clearChoice = () => commit({ ...toolkit, rewardChoice: null });

  return (
    <div className="tk-stack">
      <p className="sub">{copy.artIntro}</p>

      <div className="tk-item">
        <div className="tk-stats">
          <div><span className="kicker">{copy.artMade}</span><b className="tk-big">{progress.artifactCount}</b></div>
          <div><span className="kicker">{copy.artRevised}</span><b className="tk-big">{progress.revisionCount}</b></div>
        </div>
        {progress.lastCreatedAt && (
          <p className="faint tk-small mt8">{copy.artLast}: {formatStamp(progress.lastCreatedAt, locale)}</p>
        )}
      </div>

      <div className="tk-item">
        <div className="kicker">{copy.artAdd}</div>
        <div className="field mt8">
          <label htmlFor={`${uid}-title`}>{copy.artTitle}</label>
          <input id={`${uid}-title`} value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="kicker mt4">{copy.artKind}</div>
        <div className="tk-grid mt8" role="group" aria-label={copy.artKind}>
          {KIND_IDS.map((id) => (
            <button key={id} type="button" className={`chip ${kind === id ? 'on' : ''}`} aria-pressed={kind === id} onClick={() => setKind(id)}>
              {copy.kinds[id]}
            </button>
          ))}
        </div>
        {error && <p className="tk-error" role="alert">{error}</p>}
        <button type="button" className="btn primary small mt12" onClick={addArt}>{copy.artAdd}</button>
      </div>

      {toolkit.artifacts.length === 0 && <p className="sub">{copy.artEmpty}</p>}
      {toolkit.artifacts.map((artifact) => (
        <div className="tk-item" key={artifact.id}>
          <div className="tk-row-wrap">
            <b className="grow tk-wrap">{artifact.title}</b>
            <span className="chip">{copy.kinds[artifact.kind]}</span>
          </div>
          <p className="faint tk-small mt4">{copy.artRevisedTimes(artifact.revisedCount)}</p>
          <button type="button" className="btn ghost small mt8" onClick={() => reviseArt(artifact.id)}>{copy.artRevise}</button>
        </div>
      ))}

      <div className="tk-item">
        <div className="kicker">{copy.rewardTitle}</div>
        <p className="sub mt8">{copy.rewardIntro}</p>
        <div className="kicker mt12">{copy.rewardOptions}</div>
        {toolkit.rewardOptions.length === 0 && <p className="faint tk-small mt4">{copy.rewardNone}</p>}
        <div className="tk-grid mt8" role="group" aria-label={copy.rewardOptions}>
          {toolkit.rewardOptions.map((option) => {
            const chosen = toolkit.rewardChoice === option.id;
            return (
              <button key={option.id} type="button" className={`chip ${chosen ? 'on' : ''}`} aria-pressed={chosen} onClick={() => pickOption(option.id)}>
                {option.label}{chosen ? ` · ${copy.rewardChosen}` : ''}
              </button>
            );
          })}
        </div>
        {toolkit.rewardChoice && <button type="button" className="btn ghost small mt8" onClick={clearChoice}>{copy.rewardClear}</button>}
        <div className="kicker mt12">{copy.rewardSuggest}</div>
        <div className="tk-grid mt8">
          {copy.rewardSuggestions.map((label) => (
            <button key={label} type="button" className="chip" onClick={() => addAndPick(label)}>{label}</button>
          ))}
        </div>
        <div className="tk-row-wrap mt8">
          <div className="field grow">
            <label htmlFor={`${uid}-reward`}>{copy.rewardAddPh}</label>
            <input id={`${uid}-reward`} value={rewardDraft} onChange={(event) => setRewardDraft(event.target.value)} />
          </div>
          <button type="button" className="btn small" onClick={() => addAndPick(rewardDraft)}>{copy.rewardAdd}</button>
        </div>
      </div>

      <div className="tk-item">
        <div className="kicker">{copy.essentialsTitle}</div>
        <p className="faint tk-small mt4">{copy.essentialsNote}</p>
        <ul className="tk-list mt8">
          {ESSENTIAL_IDS.map((id) => (
            <li key={id} className="tk-line">
              {copy.essentials[id]} · {isEssentialLocked(id, progress) ? copy.locked : copy.open}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SeasonPanel({ toolkit, commit, copy }) {
  const uid = useId();
  const season = toolkit.season;
  const [goalsText, setGoalsText] = useState(() => (season ? season.goals.join('\n') : ''));
  const [lengthText, setLengthText] = useState(() => (season?.lengthDays ? String(season.lengthDays) : ''));
  const [endpointDraft, setEndpointDraft] = useState('');
  const [notice, setNotice] = useState('');

  const saveGoals = () => {
    commit(saveSeason(toolkit, goalsText, lengthText));
    setNotice(copy.seaSaved);
  };
  const addOne = () => {
    const text = endpointDraft.trim();
    if (!text) return;
    commit(addSeasonEndpoint(toolkit, text));
    setEndpointDraft('');
  };

  return (
    <div className="tk-stack">
      {notice && <p className="tk-notice" role="status">{notice}</p>}
      <p className="sub">{copy.seaIntro}</p>

      <div className="tk-item">
        <div className="field">
          <label htmlFor={`${uid}-goals`}>{copy.seaGoals}</label>
          <textarea id={`${uid}-goals`} rows={3} value={goalsText} onChange={(event) => setGoalsText(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-length`}>{copy.seaLength}</label>
          <input
            id={`${uid}-length`}
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={lengthText}
            onChange={(event) => setLengthText(event.target.value)}
          />
        </div>
        {!parseDays(lengthText) && <p className="faint tk-small">{copy.seaNoLength}</p>}
        <button type="button" className="btn primary small mt8" onClick={saveGoals}>{copy.seaSave}</button>
      </div>

      <div className="tk-item">
        <div className="kicker">{copy.seaEndpoints}</div>
        <p className="faint tk-small mt4">{copy.seaEndpointsNote}</p>
        {(season?.endpoints ?? []).length === 0 && <p className="faint tk-small mt8">{copy.seaEmpty}</p>}
        <ul className="tk-list mt8">
          {(season?.endpoints ?? []).map((endpoint, index) => <li key={`${index}-${endpoint}`} className="tk-line">{endpoint}</li>)}
        </ul>
        <div className="tk-row-wrap mt8">
          <div className="field grow">
            <label htmlFor={`${uid}-endpoint`}>{copy.seaEndpointPh}</label>
            <input id={`${uid}-endpoint`} value={endpointDraft} onChange={(event) => setEndpointDraft(event.target.value)} />
          </div>
          <button type="button" className="btn small" onClick={addOne}>{copy.seaAdd}</button>
        </div>
      </div>
    </div>
  );
}
