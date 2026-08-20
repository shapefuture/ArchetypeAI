import type { TelemetryPort } from "../../ports/index.js";
export class PerformanceTelemetry implements TelemetryPort { private frames:number[]=[]; private interactions:number[]=[]; private longTasks=0; private listeners=new Set<(tier:"ultra"|"high"|"standard")=>void>(); private raf=0; private last=0; private observer:PerformanceObserver|null=null;
 start(){this.last=performance.now(); const tick=(t:number)=>{const d=t-this.last;this.last=t;if(d>0&&d<1000){this.frames.push(d);if(this.frames.length>180)this.frames.shift();}this.raf=requestAnimationFrame(tick);};this.raf=requestAnimationFrame(tick); if("PerformanceObserver" in window){try{this.observer=new PerformanceObserver(l=>{for(const e of l.getEntries()){if(e.duration>50)this.longTasks++;}});this.observer.observe({type:"longtask",buffered:true});}catch{}}}
 stop(){if(this.raf)cancelAnimationFrame(this.raf);this.observer?.disconnect();}
 interaction(ms:number){this.interactions.push(ms);if(this.interactions.length>100)this.interactions.shift();}
 frame(ms:number){this.frames.push(ms);if(this.frames.length>180)this.frames.shift();}
 event(_name:string,_data?:Record<string,unknown>){}
 getTier(){const p95=(a:number[])=>{if(!a.length)return 0;const s=[...a].sort((a,b)=>a-b);return s[Math.min(s.length-1,Math.floor(s.length*.95))];};const f=p95(this.frames),i=p95(this.interactions);return f>18||i>40||this.longTasks>8?"standard":f>11||i>20||this.longTasks>4?"high":"ultra";}
 subscribe(cb:(tier:"ultra"|"high"|"standard")=>void){this.listeners.add(cb);return()=>this.listeners.delete(cb);}
 sample(){const p95=(a:number[])=>{if(!a.length)return 0;const s=[...a].sort((a,b)=>a-b);return s[Math.min(s.length-1,Math.floor(s.length*.95))];};return {frameP95:p95(this.frames),interactionP95:p95(this.interactions),longTasks:this.longTasks};}
}
