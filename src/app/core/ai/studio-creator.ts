import type { Archetype } from '../../../services/universe-state.service';

/**
 * Offline studio creator — pure deterministic intelligence, no Angular, no IO.
 * Shared by GeminiAiAdapter (inline fallback) and LocalHeuristicAiAdapter
 * (primary path), so the offline behavior is literally the same code in both.
 */

export type Lang = 'ru' | 'en';

export function inferStudioCluster([agency, temp, focus, attachment]: [number, number, number, number]): string {
  if (attachment < -0.45 && temp < -0.35) return 'avoidant_intellectual_shadows';
  if (attachment > 0.45 && focus > 0.2) return 'anxious_connection_shadows';
  if (Math.abs(attachment) > 0.55 && temp > 0.35) return 'disorganized_attachment_shadows';
  if (agency < -0.45 && temp < 0.2) return 'control_shadows';
  if (temp > 0.45) return 'emotional_storm_shadows';
  if (agency < -0.25 && attachment < -0.15) return 'seductive_avoidance_shadows';
  return 'gift_archetypes';
}

export function colorForCluster(cluster: string): string {
  const colors: Record<string, string> = {
    gift_archetypes: '#4A90E2',
    control_shadows: '#6A040F',
    emotional_storm_shadows: '#E85D04',
    avoidant_intellectual_shadows: '#0077B6',
    anxious_connection_shadows: '#FFB703',
    seductive_avoidance_shadows: '#9D4EDD',
    disorganized_attachment_shadows: '#3A0CA3',
  };
  return colors[cluster] || '#4A90E2';
}

export function buildStudioArchetypeId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  const slug = seed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/^_+|_+$/g, '').slice(0, 32);
  return `studio_${slug || Math.abs(hash).toString(36)}`;
}

export function createStudioArchetype(prompt: string, lang: Lang): Archetype {
  const lower = prompt.toLowerCase();
  const has = (...terms: string[]) => terms.some(t => lower.includes(t));
  const agency = has('control', 'контрол', 'force', 'push', 'давит') ? -0.75 : has('receive', 'allow', 'уступ', 'принима') ? 0.55 : 0;
  const temp = has('rage', 'anger', 'storm', 'гнев', 'ярост', 'бур') ? 0.8 : has('logic', 'cold', 'detach', 'логик', 'холод', 'исчез', 'отстран') ? -0.75 : 0;
  const focus = has('people', 'other', 'please', 'друг', 'угожд', 'спас') ? 0.65 : has('self', 'alone', 'себ', 'один') ? -0.45 : 0;
  const attachment = has('cling', 'abandon', 'anxious', 'брош', 'тревож', 'цепля') ? 0.8 : has('avoid', 'distance', 'disappear', 'избег', 'дистанц', 'исчез') ? -0.85 : 0;
  const coordinates: [number, number, number, number] = [agency, temp, focus, attachment];
  const cluster = inferStudioCluster(coordinates);
  const name = lang === 'ru' ? 'Студийная часть' : 'Studio Part';

  return {
    id: buildStudioArchetypeId(prompt),
    name,
    coordinates,
    color: colorForCluster(cluster),
    size: 0.72,
    symbol: '✦',
    cluster,
    description: lang === 'ru' ? `Локально созданная часть по описанию: ${prompt}` : `Locally generated part from: ${prompt}`,
    wound: lang === 'ru' ? 'Защитный паттерн, который просит быть увиденным без давления.' : 'A protective pattern asking to be seen without pressure.',
    shadow: lang === 'ru' ? 'Может усиливаться, когда система чувствует угрозу.' : 'May intensify when the system feels threatened.',
    invitation: lang === 'ru' ? 'Подойти к части с любопытством и дать ей безопасную роль.' : 'Approach the part with curiosity and give it a safer role.',
    coreBelief: lang === 'ru' ? 'Я защищаю систему от боли.' : 'I protect the system from pain.',
    attracts: lang === 'ru' ? 'Части с похожей раной и компенсирующие ресурсные части.' : 'Parts with a similar wound and compensating resource parts.',
  };
}
