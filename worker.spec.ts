import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Regression guard for the COOP / CORP security headers that make
 * Firebase Auth's Google sign-in popup flow work.
 *
 * The bug: clicking "Sign in with Google" opens an `accounts.google.com`
 * popup. Firebase Auth's SDK polls `popup.closed` to detect when the
 * user closes the auth window, and the browser logged
 *   "Cross-Origin-Opener-Policy policy would block the window.closed call."
 * Modern Chrome defaults to `Cross-Origin-Opener-Policy: same-origin`
 * (or applies it implicitly via the opener), which isolates the popup
 * into a different browsing context group and BLOCKS the `closed` read.
 * The browser logs the warning and (in some Chrome versions) the SDK
 * thinks the popup closed prematurely, breaking the auth flow.
 *
 * The fix: a `_headers` file at the project root (copied to
 * `dist/_headers` by the `postbuild` script) sets
 *   Cross-Origin-Opener-Policy: same-origin-allow-popups
 *   Cross-Origin-Resource-Policy: cross-origin
 * Cloudflare Workers Static Assets parses that file and applies those
 * headers to every static asset response.
 *
 * The WRONG fix would have been a `withSecurityHeaders(...)` wrapper
 * inside the worker. The worker is NOT called for static asset URLs
 * (the edge serves them directly), so the wrapper would be dead code
 * and the bug would persist. Pin both the source `_headers` and the
 * fact that the `postbuild` script copies it to `dist/`.
 *
 * (Note: the `Permissions-Policy` warnings the user sees in DevTools —
 * "Unrecognized feature: 'browsing-topics'", "run-ad-auction",
 * "private-state-token-*", "attribution-reporting", etc. — come from
 * the *Google sign-in iframe* at `accounts.google.com`, NOT from our
 * domain. We can't suppress those without controlling Google's
 * response headers, and they're warnings rather than errors — the
 * sign-in flow still works once the COOP block is removed here.)
 */

const PROJECT_ROOT = resolve(__dirname);
const HEADERS_SOURCE = resolve(PROJECT_ROOT, '_headers');
const HEADERS_DIST = resolve(PROJECT_ROOT, 'dist/_headers');
const PACKAGE_JSON = resolve(PROJECT_ROOT, 'package.json');

describe('_headers — COOP / CORP for Firebase Auth popup', () => {
  it('a _headers file exists at the project root', () => {
    // The fix lives in a static-asset _headers file, NOT in worker.ts.
    // The Cloudflare Workers Static Assets feature parses this file
    // and applies the headers to every static asset response.
    expect(existsSync(HEADERS_SOURCE)).toBe(true);
  });

  it('the _headers file applies COOP=same-origin-allow-popups site-wide (/* pattern)', () => {
    const content = readFileSync(HEADERS_SOURCE, 'utf-8');
    // The /* glob matches every URL; the COOP header must be set to
    // the value that lets Firebase Auth's popup poll `window.closed`.
    expect(content).toMatch(/\/\*/);
    expect(content).toMatch(/Cross-Origin-Opener-Policy:\s*same-origin-allow-popups/);
  });

  it('the _headers file also sets Cross-Origin-Resource-Policy=cross-origin', () => {
    // CORP default is `same-origin`, which blocks testing tools and
    // embeds from loading our assets. `cross-origin` allows them
    // while still respecting the CORS contract.
    const content = readFileSync(HEADERS_SOURCE, 'utf-8');
    expect(content).toMatch(/Cross-Origin-Resource-Policy:\s*cross-origin/);
  });

  it('package.json `postbuild` script copies _headers to dist/_headers', () => {
    // The Cloudflare Workers Static Assets feature reads `_headers`
    // from the assets directory (dist/), not the project root. The
    // `postbuild` script is what makes the file survive `ng build`,
    // which wipes dist/ on every run. Pin that the postbuild step
    // exists and references the right source/dest paths.
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf-8'));
    expect(pkg.scripts.postbuild).toBeDefined();
    expect(pkg.scripts.postbuild).toMatch(/cp\s+_headers\s+dist\/_headers/);
  });
});
