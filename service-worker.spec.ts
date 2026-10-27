import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

// Runs public/sw.js against fake caches and fetch, stamped with two build assets.
function loadWorker(fetchImpl: (url: string) => Promise<Response>) {
  const source = readFileSync('public/sw.js', 'utf8')
    .replace('const BUILD_ASSETS = [];', "const BUILD_ASSETS = ['/assets/a-1.js', '/assets/broken-2.js'];");
  const stored = new Map<string, Response>();
  const cache = {
    // Like the real Cache.addAll: downloads every URL and rejects if any one fails.
    addAll: async (urls: string[]) => { for (const url of urls) stored.set(url, await fetchImpl(url)); },
    put: async (key: string | Request, res: Response) => { stored.set(typeof key === 'string' ? key : new URL(key.url).pathname, res); },
  };
  const listeners: Record<string, (event: any) => void> = {};
  const self = {
    location: { origin: 'https://app.test' },
    addEventListener: (type: string, fn: (event: any) => void) => { listeners[type] = fn; },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  runInNewContext(source, {
    self, URL, Response, Promise, console,
    caches: { open: async () => cache, keys: async () => [], match: async () => undefined },
    fetch: (input: string | Request) => fetchImpl(typeof input === 'string' ? input : input.url),
  });
  return { listeners, stored };
}

describe('service worker', () => {
  it('installs even when one build asset fails to download', async () => {
    const { listeners, stored } = loadWorker(async (url) => {
      if (url.includes('broken')) throw new Error('network');
      return new Response('js', { status: 200, headers: { 'content-type': 'text/javascript' } });
    });
    let done: Promise<unknown> = Promise.resolve();
    listeners.install({ waitUntil: (p: Promise<unknown>) => { done = p; } });
    await expect(done).resolves.toBeUndefined();
    expect(stored.has('/index.html')).toBe(true);
  });

  it('never caches the HTML fallback served for a missing script', async () => {
    const html = () => Object.defineProperty(new Response('<!doctype html>', { status: 200, headers: { 'content-type': 'text/html' } }), 'type', { value: 'basic' });
    const { listeners, stored } = loadWorker(async () => html());
    let response: Promise<Response> | undefined;
    listeners.fetch({
      request: { method: 'GET', mode: 'no-cors', url: 'https://app.test/assets/cabinet-OLDHASH.js' },
      respondWith: (p: Promise<Response>) => { response = p; },
    });
    await response;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect([...stored.keys()].some((key) => key.includes('OLDHASH'))).toBe(false);
  });

  it('keeps the app shell as the offline page when a navigation returns something else', async () => {
    const json = () => Object.defineProperty(new Response('{"name":"x"}', { status: 200, headers: { 'content-type': 'application/manifest+json' } }), 'type', { value: 'basic' });
    const { listeners, stored } = loadWorker(async () => json());
    let response: Promise<Response> | undefined;
    listeners.fetch({
      request: { method: 'GET', mode: 'navigate', url: 'https://app.test/manifest.webmanifest' },
      respondWith: (p: Promise<Response>) => { response = p; },
    });
    await response;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(stored.has('/index.html')).toBe(false);
  });
});
