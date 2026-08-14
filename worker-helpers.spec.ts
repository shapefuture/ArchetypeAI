import { describe, it, expect } from 'vitest';
import { getMissingApiKeys } from './worker-helpers';

describe('getMissingApiKeys', () => {
  it('returns an empty array when every provider key is set', () => {
    expect(
      getMissingApiKeys({
        GOOGLE_API_KEY: 'g',
        OPENROUTER_API_KEY: 'o',
        NVIDIA_API_KEY: 'n',
        OLLAMA_API_KEY: 'l',
      }),
    ).toEqual([]);
  });

  it('reports the single key that is missing', () => {
    expect(
      getMissingApiKeys({
        GOOGLE_API_KEY: 'g',
        OPENROUTER_API_KEY: 'o',
        NVIDIA_API_KEY: 'n',
        // OLLAMA_API_KEY missing
      }),
    ).toEqual(['OLLAMA_API_KEY']);
  });

  it('reports every missing key when the worker is fully unconfigured (the live bug)', () => {
    // This is the production state we just hit: wrangler.toml has empty
    // placeholders and `wrangler secret put` was never run for any provider.
    expect(getMissingApiKeys({})).toEqual([
      'GOOGLE_API_KEY',
      'OPENROUTER_API_KEY',
      'NVIDIA_API_KEY',
      'OLLAMA_API_KEY',
    ]);
  });

  it('treats empty string as missing (vars section of wrangler.toml defaults to "")', () => {
    expect(
      getMissingApiKeys({
        GOOGLE_API_KEY: '',
        OPENROUTER_API_KEY: '',
        NVIDIA_API_KEY: '',
        OLLAMA_API_KEY: '',
      }),
    ).toEqual([
      'GOOGLE_API_KEY',
      'OPENROUTER_API_KEY',
      'NVIDIA_API_KEY',
      'OLLAMA_API_KEY',
    ]);
  });

  it('ignores unknown keys on the env (forward-compatible with new providers)', () => {
    expect(
      getMissingApiKeys({
        GOOGLE_API_KEY: 'g',
        FUTURE_PROVIDER_KEY: 'x',
      }),
    ).toEqual(['OPENROUTER_API_KEY', 'NVIDIA_API_KEY', 'OLLAMA_API_KEY']);
  });
});
