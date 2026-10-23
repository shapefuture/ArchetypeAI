import { ChangeDetectorRef, Component, Input, NgZone, OnChanges, SimpleChanges, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { loadLooks, sticker } from '../../../../shared/features/landing/stickers';
import { type Archetype, effectiveLook } from '../../../../services/universe-state.service';
import { FeltCharacterService } from '../../../../services/felt-character.service';

/**
 * The part's REAL character — the same per-part shape/color/glyph the 3D
 * satellite label shows (including persisted user overrides), rendered as an
 * inline SVG sticker. Use anywhere a part identity appears in the DOM so no
 * surface ever falls back to a generic blob.
 *
 * Decorator @Input + OnChanges (not signal input()): the detail card REUSES
 * this component across part selections (@if stays truthy), so the SVG must
 * recompute on every [archetype] change — OnChanges fires deterministically
 * on a reused instance, killing the "same character for every part" bug.
 */
@Component({
  selector: 'app-part-sticker',
  standalone: true,
  template: `
    @if (archetype) {
      <div class="part-sticker" [style.width.px]="sizePx" [style.height.px]="sizePx"
           [innerHTML]="stickerHtml" aria-hidden="true"></div>
    }
  `,
  styles: [`
    :host { display: inline-flex; }
    .part-sticker { display: block; }
    .part-sticker ::ng-deep svg { width: 100%; height: 100%; display: block; }
  `],
})
export class PartStickerComponent implements OnChanges {
  @Input({ required: true }) archetype!: Archetype;
  @Input() sizePx = 96;

  private readonly sanitizer = inject(DomSanitizer);
  private readonly feltCharacters = inject(FeltCharacterService);
  private readonly zone = inject(NgZone);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private svgRequest = 0;

  stickerHtml = this.sanitizer.bypassSecurityTrustHtml('');

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['archetype'] && !changes['sizePx']) return;
    const request = ++this.svgRequest;
    if (!this.archetype) { this.stickerHtml = this.sanitizer.bypassSecurityTrustHtml(''); return; } // defensive: required by contract

    // Keep a fast, editable fallback in place while the generated felt SVG is
    // sewn off-thread. If the part has a saved legacy look override, the
    // service returns null and this exact look remains the source of truth.
    const look = effectiveLook(this.archetype);
    this.stickerHtml = this.sanitizer.bypassSecurityTrustHtml(sticker({
      name: this.archetype.name,
      shape: look.shape,
      color: look.color,
      glyph: { e: look.eye, m: look.mouth },
    }));

    const archetype = this.archetype;
    void this.feltCharacters.svgFor(archetype).then((svg) => {
      if (!svg || loadLooks()[archetype.id] || request !== this.svgRequest || this.archetype?.id !== archetype.id) return;
      this.zone.run(() => {
        this.stickerHtml = this.sanitizer.bypassSecurityTrustHtml(svg);
        this.changeDetector.markForCheck();
      });
    }).catch(() => undefined);
  }
}
