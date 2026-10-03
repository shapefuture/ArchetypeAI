// In dev, call relative routes so Vite can proxy /api to the Worker. The
// Firebase Hosting production target has no API rewrite, so use the deployed
// Worker origin there; set VITE_WORKER_ORIGIN to override it at build time.
const configuredOrigin = import.meta.env.VITE_WORKER_ORIGIN?.replace(/\/+$/, '');
const workerOrigin = configuredOrigin ?? (import.meta.env.DEV ? '' : 'https://archetypeai-worker.wmobilas.workers.dev');

export function workerApiUrl(route: string): string {
  return `${workerOrigin}/api/${route.replace(/^\/+/, '')}`;
}
