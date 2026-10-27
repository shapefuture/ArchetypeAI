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

describe('missing build files', () => {
  // Checked in the Hosting emulator: app routes get index.html, real files are served,
  // and a missing file with a static extension (anywhere, not only /assets) gets 404,
  // so the app shell is never cached under a script, style or image URL.
  it('answers 404 for any missing static file instead of the app shell', () => {
    const hosting = JSON.parse(readFileSync('firebase.json', 'utf8')).hosting as Array<{ site: string; rewrites: Array<{ source: string; destination: string }> }>;
    for (const site of hosting) {
      expect(site.rewrites, site.site).toHaveLength(1);
      expect(site.rewrites[0].destination).toBe('/index.html');
      expect(site.rewrites[0].source.startsWith('!**/*.@(')).toBe(true);
      for (const extension of ['js', 'css', 'png', 'svg', 'woff2', 'json', 'webmanifest']) {
        expect(site.rewrites[0].source, extension).toMatch(new RegExp(`[(|]${extension}[|)]`));
      }
    }
  });
});
