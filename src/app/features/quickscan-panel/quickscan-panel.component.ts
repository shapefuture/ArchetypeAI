/**
 * INNERVERSE — Quick Scan lead magnet (§1.13): "Meet one part in 90 seconds".
 * Standalone public teaser — 14 statements, one per screen → base-subtype
 * card (Face + Need) + blurred constellation teaser → CTA into the battery.
 * Results are NEVER stored and never touch the profile.
 */
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import { ITEM_BANK, LIKERT } from '../../../i18n/items';
import { SHADOW_PARTS, SUBTYPES, type ShadowPartId } from '../../core/data/parts';
import { quickScan } from '../../core/data/scoring-v2';
import { PART_COPY } from '../../core/data/part-copy';

const UI = {
  en: {
    title: 'Meet one part in 90 seconds',
    skip: 'Close',
    resultOf: name => `${name} stepped forward.`,
    teaserNote: 'A one-part glimpse. The full battery — 147 statements, three sittings — meets all eighteen.',
    cta: 'Begin the full battery',
    selfTitle: 'No part claimed the floor — your Self is near the surface.',
    selfNote: 'Rare and good. The full battery will still find the quieter ones.',
  },
  ru: {
    title: 'Встретьте одну часть за 90 секунд',
    skip: 'Закрыть',
    resultOf: name => `Вперёд вышла часть «${name}».`,
    teaserNote: 'Это взгляд на одну часть. Полная батарея — 147 утверждений, три части — встретит все восемнадцать.',
    cta: 'Начать полную батарею',
    selfTitle: 'Ни одна часть не заняла сцену — ваш Self близко к поверхности.',
    selfNote: 'Редко и хорошо. Полная батарея всё равно найдёт более тихие.',
  },
};

@Component({
  selector: 'app-quickscan-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quickscan-panel.component.html',
  styleUrls: ['./quickscan-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickScanPanelComponent {
  private readonly translationService = inject(TranslationService);

  closed = output<void>();
  startDescent = output<void>();

  readonly parts = SHADOW_PARTS;
  readonly likert = LIKERT;
  /** Presentational only: 14 slots for the progress star strip. */
  readonly stars14 = new Array(14);
  readonly idx = signal(0);
  readonly answers = signal<number[]>(new Array(14).fill(0));
  readonly done = signal(false);

  readonly lang = computed(() => this.translationService.getLanguage());
  readonly ui = computed(() => UI[this.lang()] as typeof UI.en);
  readonly itemText = computed(() => ITEM_BANK[this.lang()].items[this.parts[this.idx()]][0]);

  readonly result = computed(() => {
    if (!this.done()) return null;
    const map = {} as Partial<Record<ShadowPartId, number>>;
    SHADOW_PARTS.forEach((p, i) => { map[p] = this.answers()[i]; });
    return quickScan(map);
  });

  readonly resultName = computed(() => {
    const r = this.result();
    return r && r.kind === 'family' ? SUBTYPES[r.family][0].name : null;
  });

  answer(v: number): void {
    this.answers.update(a => { a[this.idx()] = v; return [...a]; });
    if (this.idx() < 13) this.idx.update(i => i + 1);
    else this.done.set(true);
  }

  faceOf(part: ShadowPartId): string { return PART_COPY[this.lang()][part].face; }
  needOf(part: ShadowPartId): string { return PART_COPY[this.lang()][part].need; }

  close(): void { this.closed.emit(); }
  begin(): void { this.startDescent.emit(); }
}
