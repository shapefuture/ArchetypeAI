// Practice palette, flexible season and creative endpoints (ArchetypeAI-28h.5.3). Pure.
// The season has no composite rank, no spiritual rating and no mandated length. Goals and endpoints are the
// person's own, and they stay editable.

export interface Season { id: string; goals: ReadonlyArray<string>; endpoints: ReadonlyArray<string>; lengthDays: number | null; }

export function createSeason(id: string, goals: ReadonlyArray<string>, lengthDays: number | null = null): Season {
  return { id, goals: goals.map((g) => g.trim()).filter(Boolean), endpoints: [], lengthDays: lengthDays !== null && lengthDays > 0 ? Math.round(lengthDays) : null };
}

export function setGoals(season: Season, goals: ReadonlyArray<string>): Season {
  return { ...season, goals: goals.map((g) => g.trim()).filter(Boolean) };
}

export function addEndpoint(season: Season, endpoint: string): Season {
  const trimmed = endpoint.trim();
  return trimmed ? { ...season, endpoints: [...season.endpoints, trimmed] } : season;
}
