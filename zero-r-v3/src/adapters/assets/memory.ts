import type { AssetPort } from "../../ports/index.js";
export class MemoryAssetAdapter implements AssetPort { private cache=new Map<string,unknown>(); async prefetch(ids:string[]){await Promise.all(ids.map(async id=>{if(this.cache.has(id))return; const r=await fetch(id,{cache:"force-cache"}); if(r.ok)this.cache.set(id,await r.blob());}));} async get(id:string){return this.cache.get(id)??null;} }
