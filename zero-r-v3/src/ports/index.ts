import type { AppEvent, AppState, FutureCandidate, FutureObject, Route } from "../domain/model.js";
import type { Part } from "../domain/content.js";
export interface InteractionPort { subscribe(cb:(event:unknown)=>void):()=>void; }
export interface AssetPort { prefetch(ids:string[]):Promise<void>; get(id:string):Promise<unknown|null>; }
export interface ClockPort { now():number; monotonic():number; }
export interface StatePort { get(): AppState; set(state: AppState): void; subscribe(cb:(state:AppState)=>void):()=>void; }
export interface StoragePort { read<T>(key:string,fallback:T):Promise<T>; write<T>(key:string,value:T):Promise<void>; clear(key:string):Promise<void>; }
export interface PredictionPort { predict(state:AppState):Promise<FutureCandidate[]>; }
export interface FuturePort { get(key:string):FutureObject|undefined; put(future:FutureObject):void; clear():void; size():number; subscribe(cb:()=>void):()=>void; }
export interface SchedulerPort { select(candidates:FutureCandidate[], budget:ResourceBudget):FutureCandidate[]; }
export interface ResourceBudget { maxFutures:number; maxCpuMs:number; maxMemoryMb:number; quality:"ultra"|"high"|"standard"; }
export interface ScenePort { activate(route:Route,state:AppState):void; prepare(future:FutureObject):void; setDrag(route:Route,value:number):void; }
export interface ComputePort { score(population:number,personal:number,cost:number):Promise<number>; depth(probability:number,utility:number):Promise<number>; }
export interface PartFigure { svg?:string; size?:number; tris?:number; dna?:unknown; }
/**
 * Presentation of the characters. A renderer draws the parts however it likes
 * (ambient gradients, sewn felt dolls, ...) as long as it stays inside the tier budget.
 */
export interface RenderPort {
  setQuality(tier:"ultra"|"high"|"standard"):void;
  attachNode?(el:HTMLElement,part:Part):void;
  attachSelf?(el:HTMLElement):void;
  mountDetail?(mount:HTMLElement,part:Part):void;
  mountFamily?(mount:HTMLElement,parts:Part[]):void;
  unmountDetail?():void;
  onSelectPart?:((id:string)=>void)|null;
  dispose():void;
}
export interface CapabilityPort { capabilities():RuntimeCapabilities; }
export interface RuntimeCapabilities { wasm:boolean; indexedDb:boolean; opfs:boolean; webgpu:boolean; webgl:boolean; workers:boolean; serviceWorker:boolean; deviceMemoryGb:number|null; }
export interface TelemetryPort { interaction(ms:number):void; frame(ms:number):void; event(name:string,data?:Record<string,unknown>):void; }
export interface SyncPort { queue(events:unknown[]):Promise<void>; flush():Promise<void>; }
