/**
 * Optional daily questions for the journal: body, shadow and parts work. One question a day, the same all day,
 * rotating through the list. The person can ask for another, answer it, or hide it for today. Nothing is required.
 * Each question names the journal entry type it fits. Pure, framework-free.
 */
export type JournalKind = 'jTrigger' | 'jSensation' | 'jThought' | 'jPattern';

export interface DailyPrompt { id: string; kind: JournalKind; en: string; ru: string }

export const DAILY_PROMPTS: readonly DailyPrompt[] = [
  { id: 'body-ignored', kind: 'jSensation', en: 'When did you last notice your body wanted to tell you something, and you carried on anyway?', ru: 'Когда вы в последний раз заметили, что тело хотело вам что-то сказать, а вы продолжили, как будто ничего не было?' },
  { id: 'body-tension', kind: 'jSensation', en: 'Where in your body did tension gather today? If it could speak, what would it ask for?', ru: 'Где в теле сегодня собралось напряжение? Если бы оно могло говорить, о чём бы оно попросило?' },
  { id: 'body-tired', kind: 'jSensation', en: 'When did you push past tiredness or hunger recently? Which part kept you going?', ru: 'Когда вы недавно не обратили внимания на усталость или голод? Какая часть заставляла вас продолжать?' },
  { id: 'body-ease', kind: 'jSensation', en: 'When did your body feel at ease lately? What was around you?', ru: 'Когда в последнее время телу было спокойно? Что было вокруг вас?' },
  { id: 'shadow-irritation', kind: 'jTrigger', en: 'Who irritated you more than the moment called for? What quality in them do you keep away from in yourself?', ru: 'Кто вызвал у вас раздражение сильнее, чем требовала ситуация? Какое качество этого человека вы не допускаете в себе?' },
  { id: 'shadow-envy', kind: 'jTrigger', en: 'Where did you feel a flicker of envy? What does it say you want?', ru: 'Где вы почувствовали укол зависти? О каком вашем желании он говорит?' },
  { id: 'shadow-admire', kind: 'jTrigger', en: 'Whom do you admire a little too much? Which of their strengths might also be yours?', ru: 'Кем вы восхищаетесь чуть больше обычного? Какая из сильных сторон этого человека может быть и вашей?' },
  { id: 'shadow-overreact', kind: 'jTrigger', en: 'When did you react more strongly than you expected? How old did that part feel?', ru: 'Когда вы отреагировали сильнее, чем ожидали? Сколько лет ощущалось той части?' },
  { id: 'trigger-swallowed', kind: 'jTrigger', en: 'What did you want to say today and swallowed? Which part held it back, and what was it protecting?', ru: 'Что вы хотели сегодня сказать, но промолчали? Какая часть вас удержала и что она защищала?' },
  { id: 'thought-critic', kind: 'jThought', en: 'What did your inner critic say today? What is it afraid would happen if it stopped?', ru: 'Что сегодня говорил ваш внутренний критик? Чего он боится, если замолчит?' },
  { id: 'thought-should', kind: 'jThought', en: 'Which "I should" came up most today? Whose voice does it sound like?', ru: 'Какое «я должен» или «я должна» звучало сегодня чаще всего? Чей голос это напоминает?' },
  { id: 'thought-loop', kind: 'jThought', en: 'Which thought kept coming back? If it were a part, what would it want you to know?', ru: 'Какая мысль возвращалась снова и снова? Если бы это была часть, что она хотела бы, чтобы вы знали?' },
  { id: 'thought-story', kind: 'jThought', en: 'What story about yourself did you believe today without checking it?', ru: 'Какой истории о себе вы сегодня поверили, не проверив её?' },
  { id: 'pattern-yes', kind: 'jPattern', en: 'Where did you say yes when part of you meant no?', ru: 'Где вы сказали «да», когда часть вас имела в виду «нет»?' },
  { id: 'pattern-escape', kind: 'jPattern', en: 'When did you reach for your phone, food or busyness to avoid a feeling? What was the feeling?', ru: 'Когда вы потянулись к телефону, еде или делам, чтобы не чувствовать что-то? Что это было за чувство?' },
  { id: 'pattern-repeat', kind: 'jPattern', en: 'What did you do again today that you have promised yourself to stop? What does that part get from it?', ru: 'Что вы сегодня снова сделали, хотя обещали себе перестать? Что эта часть от этого получает?' },
  { id: 'pattern-hidden', kind: 'jPattern', en: 'What part of you did you hide from someone today? What did it fear they would see?', ru: 'Какую часть себя вы сегодня скрыли от кого-то? Чего она боялась, что они увидят?' },
  { id: 'pattern-thanks', kind: 'jPattern', en: 'Which protector worked hard for you today? What would you like to thank it for?', ru: 'Какой защитник сегодня много для вас работал? За что вы хотели бы его поблагодарить?' },
];

/** Whole days since 1970-01-01 for a local ISO day (YYYY-MM-DD). An invalid day reads as 0. */
export function dayNumber(isoDay: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDay);
  if (!match) return 0;
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isFinite(utc) ? Math.floor(utc / 86_400_000) : 0;
}

/** The question for a day. `skip` moves to the next questions in order when the person asks for another. */
export function promptForDay(isoDay: string, skip = 0, prompts: readonly DailyPrompt[] = DAILY_PROMPTS): DailyPrompt {
  const length = prompts.length;
  const index = (((dayNumber(isoDay) + skip) % length) + length) % length;
  return prompts[index];
}

export const promptById = (id: unknown): DailyPrompt | null =>
  typeof id === 'string' ? DAILY_PROMPTS.find((prompt) => prompt.id === id) ?? null : null;

/** The local calendar day, YYYY-MM-DD. */
export function localDay(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Key for "hide today's question". It holds the day it was hidden, so the question returns tomorrow. */
export const PROMPT_HIDDEN_KEY = 'ifs.journal.prompt.hidden';
