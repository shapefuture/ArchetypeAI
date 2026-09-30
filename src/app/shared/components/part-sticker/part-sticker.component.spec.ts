import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PartStickerComponent } from './part-sticker.component';
import { Archetype } from '../../../../services/webxr.service';

const base = { coordinates: [0, 0, 0, 0], size: 0.6, symbol: '', invitation: '', coreBelief: '', attracts: '' };
const ashamed: Archetype = { ...base, id: 'ashamed', name: 'Стыдящийся', color: '#8E62B8', cluster: 'exiles', shape: 'ashamed', glyph: { e: 'lid', m: 'wavy' } } as Archetype;
const taskmaster: Archetype = { ...base, id: 'taskmaster', name: 'Деятель', color: '#DE6A40', cluster: 'managers', shape: 'taskmaster', glyph: { e: 'lid', m: 'grit' } } as Archetype;

/** Distinct silhouettes from landing/stickers.ts SHAPES. */
const EGG = 'M50 9c17 0 31 25 31 46a31 31 0 0 1-62 0c0-21 14-46 31-46Z';

/**
 * Host wrapper: binds [archetype] through a real template, exactly like the
 * detail card does in production (componentRef.setInput doesn't propagate
 * signal inputs in this TestBed setup, template binding is the true path).
 */
@Component({
  standalone: true,
  imports: [PartStickerComponent],
  template: `<app-part-sticker [archetype]="part()" [sizePx]="96"></app-part-sticker>`,
})
class HostComponent {
  readonly part = signal<Archetype | null>(null);
}

describe('PartStickerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function svgHtml(): string {
    return (fixture.nativeElement.querySelector('.part-sticker svg') as SVGElement | null)?.innerHTML ?? '';
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.part.set(ashamed);
    fixture.detectChanges();
  });

  it('renders the part family silhouette, not a generic blob (bug: Стыдящийся showed a legged blob)', () => {
    expect(svgHtml()).toContain(EGG);
  });

  it('uses the assigned part color', () => {
    expect(svgHtml()).toContain('#8E62B8');
  });

  it('renders the part glyph face (lid eyes, wavy mouth)', () => {
    const html = svgHtml();
    expect(html).toContain('M32 46q6-7 12 0');    // 'lid' eyes
    expect(html).toContain('M42 63q4-4 8 0t8 0'); // 'wavy' mouth
  });

  it('REGRESSION: recomputes when [archetype] changes on a REUSED instance (detail card keeps @if truthy)', () => {
    // same component instance, new selection — the case the live app hit:
    // every part showed the first-selected character
    host.part.set(taskmaster);
    fixture.detectChanges();
    const html = svgHtml();
    expect(html).not.toContain(EGG);   // egg silhouette gone
    expect(html).toContain('rect');    // taskmaster id-card body
    expect(html).toContain('#DE6A40'); // taskmaster color
  });

  it('renders nothing when no archetype is bound (safe placeholder)', () => {
    host.part.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.part-sticker svg')).toBeNull();
  });

  it('respects persisted user look overrides (same source of truth as the 3D label)', () => {
    localStorage.setItem('INNERVERSE_PART_LOOKS_V1', JSON.stringify({
      ashamed: { shape: 'sage', color: '#2FA39E', eye: 'dot', mouth: 'smile' },
    }));
    // panel instantiates at selection time → a fresh binding picks the override up
    const fresh = TestBed.createComponent(HostComponent);
    (fresh.componentInstance as HostComponent).part.set(ashamed);
    fresh.detectChanges();
    const html = (fresh.nativeElement.querySelector('.part-sticker svg') as SVGElement).innerHTML;
    expect(html).toContain('#2FA39E');                                                 // overridden color
    expect(html).not.toContain(EGG);                                                   // overridden shape gone
    expect(html).toContain('M50 9C79 26 85 58 50 91 15 58 21 26 50 9Z');               // sage leaf
    localStorage.removeItem('INNERVERSE_PART_LOOKS_V1');
  });
});
