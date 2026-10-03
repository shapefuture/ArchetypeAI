// Worker pool with two priorities and "latest wins" keys. Falls back to the main thread if workers are unavailable.
import { process } from './core.js';
export class Pool {
  constructor(src, n = 2) {
    this.workers = []; this.hi = []; this.lo = []; this.next = 1; this.pending = new Map(); this.fallback = false;
    try {
      const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      for (let i = 0; i < n; i++) { const w = new Worker(url); w.busy = false; w.onmessage = (e) => this.done(w, e.data); w.onerror = () => { this.fallback = true; }; this.workers.push(w); }
    } catch { this.fallback = true; }
    if (!this.workers.length) this.fallback = true;
  }
  /** priority 'hi' | 'lo'. A queued request with the same key is replaced (its promise resolves to null). */
  request(msg, { priority = 'hi', key = null } = {}) {
    const q = priority === 'hi' ? this.hi : this.lo;
    if (key) for (let i = q.length - 1; i >= 0; i--) if (q[i].key === key) { q[i].resolve(null); q.splice(i, 1); }
    return new Promise((resolve) => { q.push({ id: this.next++, msg, key, resolve }); this.pump(); });
  }
  pump() {
    if (this.fallback) { const job = this.hi.shift() || this.lo.shift(); if (!job) return; setTimeout(() => { try { const { out } = process(job.msg); job.resolve(out); } catch (e) { job.resolve({ ok: false, error: String(e.message || e) }); } this.pump(); }, 0); return; }
    for (const w of this.workers) {
      if (w.busy) continue; const job = this.hi.shift() || this.lo.shift(); if (!job) return;
      w.busy = true; this.pending.set(job.id, job); w.postMessage({ ...job.msg, id: job.id });
    }
  }
  done(w, d) { w.busy = false; const job = this.pending.get(d.id); this.pending.delete(d.id); if (job) job.resolve(d); this.pump(); }
}
