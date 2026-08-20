export type Route = "home" | "part" | "checkin" | "system" | "profile";
export type PartCategory = "manager" | "firefighter" | "exile";
export type EffectClass = "pure" | "local" | "reversible" | "idempotent" | "remote" | "irreversible" | "privileged";
export type EventType = "OPEN_HOME" | "OPEN_PART" | "OPEN_CHECKIN" | "OPEN_SYSTEM" | "OPEN_PROFILE" | "CLOSE_PART";
export interface AppState { route: Route; selectedPartId: string | null; revision: number; }
export interface AppEvent { type: EventType; id?: string; }
export interface Transition { id: EventType; effect: EffectClass; apply: (state: AppState, event: AppEvent) => AppState; }
export interface FutureCandidate { key: string; probability: number; cost: number; latencySavedMs: number; depth: number; reason: string; }
export interface FutureObject extends FutureCandidate { preparedAt: number; }
export const INITIAL_STATE: AppState = { route: "home", selectedPartId: null, revision: 0 };
export const TRANSITIONS: Record<EventType, Transition> = {
  OPEN_HOME: { id:"OPEN_HOME", effect:"pure", apply:()=>({ ...INITIAL_STATE, revision:0 }) },
  OPEN_PART: { id:"OPEN_PART", effect:"pure", apply:(s,e)=>({route:"part",selectedPartId:e.id ?? null,revision:s.revision+1}) },
  OPEN_CHECKIN: { id:"OPEN_CHECKIN", effect:"local", apply:(s,e)=>({route:"checkin",selectedPartId:e.id ?? s.selectedPartId,revision:s.revision+1}) },
  OPEN_SYSTEM: { id:"OPEN_SYSTEM", effect:"pure", apply:s=>({route:"system",selectedPartId:null,revision:s.revision+1}) },
  OPEN_PROFILE: { id:"OPEN_PROFILE", effect:"pure", apply:s=>({route:"profile",selectedPartId:null,revision:s.revision+1}) },
  CLOSE_PART: { id:"CLOSE_PART", effect:"pure", apply:s=>({route:"home",selectedPartId:null,revision:s.revision+1}) }
};
export function transition(state: AppState, event: AppEvent): AppState {
  return (TRANSITIONS[event.type] ?? TRANSITIONS.OPEN_HOME).apply(state,event);
}
