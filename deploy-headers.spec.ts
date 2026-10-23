import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The app is served by Cloudflare (_headers) and by two Firebase Hosting sites
// (firebase.json). Both must send the same security headers on every path.
const REQUIRED: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), xr-spatial-tracking=(self)',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "frame-ancestors 'none'",
  'Strict-Transport-Security': 'max-age=31536000',
};

/** Headers of one path block in a Cloudflare _headers file. */
function cloudflareBlock(text: string, path: string): Record<string, string> {
  const lines = text.split('\n').filter((line) => !line.startsWith('#'));
  const start = lines.findIndex((line) => line === path);
  const headers: Record<string, string> = {};
  for (const line of lines.slice(start + 1)) {
    if (!/^\s+\S/.test(line)) break;
    const [key, ...value] = line.trim().split(':');
    headers[key] = value.join(':').trim();
  }
  return headers;
}

describe('deploy security headers', () => {
  it('Cloudflare sends them on every path', () => {
    expect(cloudflareBlock(readFileSync('_headers', 'utf8'), '/*')).toMatchObject(REQUIRED);
  });

  it('each Firebase Hosting site sends them on every path', () => {
    const sites = JSON.parse(readFileSync('firebase.json', 'utf8')).hosting as Array<{ site: string; headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }> }>;
    expect(sites.length).toBeGreaterThan(0);
    for (const site of sites) {
      const all = site.headers.find((block) => block.source === '**');
      const headers = Object.fromEntries((all?.headers ?? []).map(({ key, value }) => [key, value]));
      expect(headers, site.site).toMatchObject(REQUIRED);
    }
  });

  it('keeps XR available to the app, which uses WebXR in the universe scene', () => {
    expect(REQUIRED['Permissions-Policy']).toContain('xr-spatial-tracking=(self)');
  });
});

describe('deploy worker origins', () => {
  // Owner decision (2026-10-23): production workers allow only the production
  // app origins. Local development keeps localhost via the code default in
  // worker-security.ts and the same-origin vite proxy, never via production vars.
  const PROD_ORIGINS = [
    'https://archetype-ai-3e43b.web.app',
    'https://archetype-ai-3e43b.firebaseapp.com',
    'https://innerverseai.web.app',
    'https://innerverseai.firebaseapp.com',
  ];

  function tomlVar(text: string, name: string): string[] | null {
    const match = text.match(new RegExp(`^${name}\\s*=\\s*"([^"]*)"`, 'm'));
    return match ? match[1].split(',').map((v) => v.trim()).filter(Boolean) : null;
  }

  it('every deployable worker config pins ALLOWED_APP_ORIGINS to the production origins only', () => {
    for (const file of ['wrangler.toml', 'wrangler.api.toml']) {
      const origins = tomlVar(readFileSync(file, 'utf8'), 'ALLOWED_APP_ORIGINS');
      expect(origins, `${file} must define ALLOWED_APP_ORIGINS`).not.toBeNull();
      expect(origins, file).toEqual(PROD_ORIGINS);
      expect(origins?.some((origin) => /localhost|127\.0\.0\.1/.test(origin)), file).toBe(false);
    }
  });

  it('the code default still lets a local wrangler dev accept localhost origins', () => {
    const defaults = readFileSync('worker-security.ts', 'utf8').match(/DEFAULT_ALLOWED_APP_ORIGINS = \[([\s\S]*?)\] as const/)?.[1] ?? '';
    expect(defaults).toContain('http://localhost:5174');
    for (const origin of PROD_ORIGINS) expect(defaults).toContain(origin);
  });
});
