import type { FuturePort, ResourceBudget, SchedulerPort } from "../../ports/index.js";
import type { FutureCandidate, FutureObject } from "../../domain/model.js";

export class MemoryFutureStore implements FuturePort {
  private map = new Map<string, FutureObject>();
  private listeners = new Set<() => void>();
  get(key: string) { return this.map.get(key); }
  put(future: FutureObject) { this.map.set(future.key, future); this.listeners.forEach(fn => fn()); }
  clear() { this.map.clear(); this.listeners.forEach(fn => fn()); }
  size() { return this.map.size; }
  subscribe(cb: () => void) { this.listeners.add(cb); return () => this.listeners.delete(cb); }
}

export class EconomicScheduler implements SchedulerPort {
  select(candidates: FutureCandidate[], budget: ResourceBudget): FutureCandidate[] {
    const ranked = candidates
      .map(candidate => ({
        candidate,
        score: candidate.probability * candidate.latencySavedMs / Math.max(candidate.cost, 0.001)
      }))
      .sort((a, b) => b.score - a.score);
    const selected: FutureCandidate[] = [];
    let cpu = 0;
    for (const item of ranked) {
      if (selected.length >= budget.maxFutures) break;
      if (item.candidate.probability < 0.04) continue;
      if (cpu + item.candidate.cost > budget.maxCpuMs) continue;
      selected.push(item.candidate);
      cpu += item.candidate.cost;
    }
    return selected;
  }
}
