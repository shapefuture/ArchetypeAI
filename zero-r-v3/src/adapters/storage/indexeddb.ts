import type { StoragePort } from "../../ports/index.js";
const DB="zero-r-v3"; const VERSION=1; const STORE="records";
function open():Promise<IDBDatabase>{ return new Promise((res,rej)=>{ const r=indexedDB.open(DB,VERSION); r.onupgradeneeded=()=>{ if(!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE,{keyPath:"key"}); }; r.onerror=()=>rej(r.error); r.onsuccess=()=>res(r.result); }); }
export class IndexedDbStorage implements StoragePort {
 async read<T>(key:string,fallback:T){ if(typeof indexedDB==="undefined") return fallback; try{const db=await open(); return await new Promise<T>(res=>{const r=db.transaction(STORE,"readonly").objectStore(STORE).get(key); r.onsuccess=()=>res((r.result?.value as T|undefined)??fallback); r.onerror=()=>res(fallback);});}catch{return fallback;} }
 async write<T>(key:string,value:T){ if(typeof indexedDB==="undefined") return; try{const db=await open(); await new Promise<void>((res,rej)=>{const tx=db.transaction(STORE,"readwrite"); tx.objectStore(STORE).put({key,value}); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error);});}catch{} }
 async clear(key:string){ if(typeof indexedDB==="undefined") return; try{const db=await open(); await new Promise<void>(res=>{const tx=db.transaction(STORE,"readwrite"); tx.objectStore(STORE).delete(key); tx.oncomplete=()=>res(); tx.onerror=()=>res();});}catch{} }
}
