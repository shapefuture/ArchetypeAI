import { describe, expect, it } from 'vitest';
import * as shared from '../../shared/i18n/strings';
import * as local from './strings';

/** Every Russian leaf string in a copy module (any path with a `ru` segment). */
function ruLeaves(value: unknown, path: string[] = [], out: Array<[string, string]> = []): Array<[string, string]> {
  if (typeof value === 'string') {
    if (path.includes('ru')) out.push([path.join('.'), value]);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => ruLeaves(item, [...path, String(index)], out));
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) ruLeaves(item, [...path, key], out);
  }
  return out;
}

/** Text outside «…» or "…" quotes, where a quoted script may keep «ты». */
const unquoted = (text: string) => text.replace(/«[^»]*»/g, ' ').replace(/"[^"]*"/g, ' ');
const SECOND_PERSON = /(?<![\p{L}])(ты|тебя|тебе|тобой|тобою|твой|твоя|твоё|твою|твои|твоих|твоему|твоей|тебя)(?![\p{L}])|(?<![\p{L}])(?!лишь)\p{L}+(?:ешь|ешься|ишь|ишься|ёшь|ёшься)(?![\p{L}])/giu;

describe('critic: user-voice Russian copy addresses the reader as «вы»', () => {
  it('no unquoted «ты» or second-person singular verb in any Russian string', () => {
    const hits: string[] = [];
    for (const [moduleName, module] of [['shared', shared], ['parts-cartographer', local]] as const) {
      for (const [exportName, value] of Object.entries(module)) {
        for (const [path, text] of ruLeaves(value, [exportName])) {
          // Core-belief templates are the person's own first-person beliefs about a partner, quoted as the belief.
          if (path.startsWith('CORE_BELIEF_TEMPLATES')) continue;
          const found = unquoted(text).match(SECOND_PERSON);
          if (found) hits.push(`${moduleName} ${path}: ${[...new Set(found)].join(', ')} :: ${text.slice(0, 140)}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});
