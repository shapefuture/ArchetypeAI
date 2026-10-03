import type { IFSCharacter } from '../data/characters';
import { dnaFor } from './dnaMap';
import { FeltSticker } from './FeltSticker';
import { describe } from './engine';

/**
 * Swap a character's art for its felt self, keeping the app's data and behaviour untouched.
 * Same id -> same DNA -> same plush every reload; the parts keep the colours the app already gave them.
 */
export function withFeltArt(characters: IFSCharacter[]): IFSCharacter[] {
  return characters.map((c) => ({
    ...c,
    renderSticker: ({ className = '', interactive = false, isUnburdened = false }) => (
      <FeltSticker
        dna={dnaFor(c)}
        className={className}
        interactive={interactive}
        isUnburdened={isUnburdened}
        title={describe(dnaFor(c))}
      />
    ),
  }));
}

export default withFeltArt;
