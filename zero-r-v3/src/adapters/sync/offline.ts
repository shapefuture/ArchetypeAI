import type { SyncPort } from "../../ports/index.js";
export class OfflineSync implements SyncPort { private queueItems:unknown[]=[]; async queue(events:unknown[]){this.queueItems.push(...events);} async flush(){this.queueItems.length=0;} size(){return this.queueItems.length;} }
