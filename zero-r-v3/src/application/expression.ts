import { transition } from "../domain/model.js";
import type { AppEvent, AppState, FutureObject } from "../domain/model.js";
import type { ComputePort, FuturePort, PredictionPort, ResourceBudget, SchedulerPort, ScenePort, StatePort, StoragePort, SyncPort, TelemetryPort } from "../ports/index.js";
export class MemoryState implements StatePort { private s:AppState; private ls=new Set<(s:AppState)=>void>(); constructor(initial:AppState){this.s=initial;} get(){return this.s;} set(s:AppState){this.s=s;this.ls.forEach(x=>x(s));} subscribe(cb:(s:AppState)=>void){this.ls.add(cb);return()=>this.ls.delete(cb);} }
export class ExperienceCoordinator {
 constructor(private state:StatePort,private storage:StoragePort,private predictor:PredictionPort,private futures:FuturePort,private scheduler:SchedulerPort,private scene:ScenePort,private compute:ComputePort,private telemetry:TelemetryPort,private sync:SyncPort){ }
 async restore(fallback:AppState){const saved=await this.storage.read<AppState>("state",fallback); const valid=["home","part","checkin","system","profile"].includes(saved.route); if(valid)this.state.set(saved);}
 async dispatch(event:AppEvent){const t0=performance.now(); const before=this.state.get(); const next=transition(before,event); this.state.set(next); this.telemetry.interaction(performance.now()-t0); void this.storage.write("state",next); void this.sync.queue([{type:event.type,id:event.id??null,revision:next.revision}]); void this.prepare(before,next);}
 
 private async prepare(_before:AppState,next:AppState){const candidates=await this.predictor.predict(next);const budget:ResourceBudget={maxFutures:next.route==="home"?4:3,maxCpuMs:2,maxMemoryMb:24,quality:"ultra"}; const selected=this.scheduler.select(candidates,budget); for(const c of selected){if(this.futures.get(c.key))continue; const score=await this.compute.score(c.probability, c.probability, c.cost); const depth=await this.compute.depth(c.probability,score); const f:FutureObject={...c,depth,preparedAt:performance.now()};this.futures.put(f);this.scene.prepare(f);} }
}
