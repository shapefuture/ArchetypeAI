import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The production API is deployed from wrangler.api.toml. The Worker fails
// closed without its project ID and rate-limit bindings, so a deploy from this
// file must carry them, and must allow production origins only.
const config = readFileSync('wrangler.api.toml', 'utf8');
const value = (key: string) => config.match(new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, 'm'))?.[1];

describe('production Worker config (wrangler.api.toml)', () => {
  it('names the Firebase project whose ID tokens it verifies', () => {
    expect(value('FIREBASE_PROJECT_ID')).toBe('archetype-ai-3e43b');
  });

  it('allows only HTTPS production origins', () => {
    const origins = (value('ALLOWED_APP_ORIGINS') ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
    expect(origins.length).toBeGreaterThan(0);
    for (const origin of origins) {
      expect(origin).toMatch(/^https:\/\//);
      expect(origin).not.toMatch(/localhost|127\.0\.0\.1/);
    }
  });

  it('binds every rate limiter the Worker reads', () => {
    for (const name of ['AI_RATE_LIMITER', 'AI_IP_RATE_LIMITER', 'BILLING_RATE_LIMITER']) {
      expect(config).toMatch(new RegExp(`\\[\\[ratelimits\\]\\]\\s*\\nname\\s*=\\s*"${name}"`));
    }
  });
});
