import type { StoragePort } from "../../ports/index.js";
export class MemoryStorage implements StoragePort { private m=new Map<string,unknown>(); async read<T>(k:string,f:T){return (this.m.get(k) as T|undefined)??f;} async write<T>(k:string,v:T){this.m.set(k,v);} async clear(k:string){this.m.delete(k);} }
