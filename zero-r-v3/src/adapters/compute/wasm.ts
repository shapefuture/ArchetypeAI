import type { ComputePort } from "../../ports/index.js";
export class WasmCompute implements ComputePort { private runtime:Promise<WebAssembly.Exports|null>; constructor(){this.runtime=this.load();}
 private async load(){try{const r=await fetch("/wasm/zero_runtime.wasm",{cache:"force-cache"}); if(!r.ok)return null; const {instance}=await WebAssembly.instantiateStreaming(r,{}); return instance.exports;}catch{return null;}}
 async score(p:number,q:number,c:number){const e=await this.runtime; const fn=(e as {score_future?:Function}|null)?.score_future; return typeof fn==="function"?Number(fn(p,q,c)):((p*.35+q*.65)/(c||.001));}
 async depth(p:number,u:number){const e=await this.runtime; const fn=(e as {select_depth?:Function}|null)?.select_depth; return typeof fn==="function"?Number(fn(p,u)):p>=.7&&u>1?5:p>=.45&&u>.5?4:p>=.2?3:p>=.05?2:1;}
}
