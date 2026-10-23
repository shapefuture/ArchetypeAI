import { describe, expect, it } from 'vitest';
import { requestFocus, takeFocusRequest } from './focus-request';

describe('one-shot focus requests', () => {
  it('is taken once by the matching target only', () => {
    requestFocus('situation-inquiry');
    expect(takeFocusRequest('other')).toBe(false);
    expect(takeFocusRequest('situation-inquiry')).toBe(true);
    expect(takeFocusRequest('situation-inquiry')).toBe(false);
  });

  it('replaces an untaken request with the next one', () => {
    requestFocus('a');
    requestFocus('b');
    expect(takeFocusRequest('a')).toBe(false);
    expect(takeFocusRequest('b')).toBe(true);
  });
});
