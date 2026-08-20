import type { ClockPort } from "../../ports/index.js";
export class BrowserClock implements ClockPort { now(){return Date.now();} monotonic(){return performance.now();} }
