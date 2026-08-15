/**
 * INNERVERSE — the living constellation (REVAMP §3.1, §1.15).
 *
 * Canvas 2D render of the deterministic layout: tier-sized stars on fixed
 * orbits, polarization tension arcs, strong guardianship lines, resource
 * leak arcs, complex glows pulsing together, and the Self radar glowing at
 * the chair. Honors prefers-reduced-motion with a single static frame.
 */
import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy,
  computed, inject, model, viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import { buildLayout, starAt } from '../../core/data/constellation-layout';
import type { ScoredProfile } from '../../core/data/scoring-v2';

@Component({
  selector: 'app-innerverse-constellation',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #cv class="constellation-canvas" role="img"
    [attr.aria-label]="ariaLabel()"></canvas>`,
  styles: [`
    :host { display: block; width: 100%; aspect-ratio: 1; }
    .constellation-canvas { width: 100%; height: 100%; display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InnerverseConstellationComponent implements AfterViewInit, OnDestroy {
  private readonly translationService = inject(TranslationService);

  readonly profile = model.required<ScoredProfile>();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');

  private raf = 0;
  private readonly reducedMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  readonly layout = computed(() => buildLayout(this.profile()));

  readonly ariaLabel = computed(() => {
    const en = this.translationService.getLanguage() === 'en';
    return en
      ? `Your inner constellation: ${this.layout().stars.length} parts around the Self`
      : `Ваше внутреннее созвездие: ${this.layout().stars.length} частей вокруг Self`;
  });

  ngAfterViewInit(): void {
    const draw = (t: number) => {
      this.render(t);
      if (!this.reducedMotion) this.raf = requestAnimationFrame(draw);
    };
    this.raf = requestAnimationFrame(draw);
  }

  ngOnDestroy(): void { cancelAnimationFrame(this.raf); }

  /** One deterministic frame at time t (ms). Pure drawing, no state. */
  render(t: number): void {
    const el = this.canvas().nativeElement;
    const dpr = Math.min(2, globalThis.devicePixelRatio ?? 1);
    const size = el.clientWidth || 600;
    if (el.width !== Math.round(size * dpr)) {
      el.width = Math.round(size * dpr);
      el.height = Math.round(size * dpr);
    }
    const ctx = el.getContext('2d');
    if (!ctx) return; // jsdom / no 2d context: layout stays testable
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const L = this.layout();
    const px = (v: number) => v * size;
    const star = (id: string) => starAt(L, id as never);

    // orbit rings (faint)
    ctx.save();
    for (const ring of ['resource', 'manager', 'firefighter', 'exile'] as const) {
      const r = ({ resource: 0.44, manager: 0.36, firefighter: 0.26, exile: 0.155 })[ring];
      ctx.beginPath();
      ctx.strokeStyle = ring === 'resource' ? 'rgba(232,201,135,0.07)' : 'rgba(236,234,246,0.05)';
      ctx.arc(px(0.5), px(0.5), px(r), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // guardianship: faint orbit lines protector → exile
    ctx.save();
    ctx.strokeStyle = 'rgba(236,234,246,0.08)';
    for (const g of L.guardLines) {
      const a = star(g.from), b = star(g.to);
      ctx.beginPath();
      ctx.moveTo(px(a.x), px(a.y));
      ctx.quadraticCurveTo(px(0.5), px(0.5), px(b.x), px(b.y));
      ctx.stroke();
    }
    ctx.restore();

    // polarization tension arcs (animated shimmer)
    ctx.save();
    ctx.lineWidth = 1.6;
    for (const arc of L.tensionArcs) {
      const a = star(arc.a), b = star(arc.b);
      const pulse = this.reducedMotion ? 0.6 : 0.45 + 0.35 * Math.sin(t / 600);
      const grad = ctx.createLinearGradient(px(a.x), px(a.y), px(b.x), px(b.y));
      grad.addColorStop(0, `rgba(111,168,201,${pulse})`);
      grad.addColorStop(1, `rgba(224,138,92,${pulse})`);
      ctx.strokeStyle = grad;
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = this.reducedMotion ? 0 : -t / 50;
      ctx.beginPath();
      ctx.moveTo(px(a.x), px(a.y));
      const mx = (a.x + b.x) / 2 + (0.5 - (a.y + b.y) / 2) * 0.0;
      ctx.quadraticCurveTo(px(mx), px((a.y + b.y) / 2 - 0.12), px(b.x), px(b.y));
      ctx.stroke();
    }
    ctx.restore();

    // resource leak arcs (§1.14): warm, resource → shadow part
    ctx.save();
    ctx.strokeStyle = 'rgba(217,138,116,0.35)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([]);
    for (const leak of L.leakArcs) {
      const a = star(leak.from), b = star(leak.to);
      ctx.beginPath();
      ctx.moveTo(px(a.x), px(a.y));
      ctx.quadraticCurveTo(px(0.5), px(0.5), px(b.x), px(b.y));
      ctx.stroke();
    }
    ctx.restore();

    // Self glow (breathing luminosity = self_energy)
    const selfR = px(L.self.radius);
    const breathe = this.reducedMotion ? 1 : 0.92 + 0.08 * Math.sin(t / 900);
    const glow = ctx.createRadialGradient(px(0.5), px(0.5), 0, px(0.5), px(0.5), selfR * 2.4 * breathe);
    glow.addColorStop(0, 'rgba(242,231,201,0.85)');
    glow.addColorStop(0.4, 'rgba(242,231,201,0.25)');
    glow.addColorStop(1, 'rgba(242,231,201,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px(0.5), px(0.5), selfR * 2.4 * breathe, 0, Math.PI * 2);
    ctx.fill();

    // Self radar spokes (§1.15) inside the glow
    ctx.save();
    ctx.strokeStyle = 'rgba(242,231,201,0.55)';
    ctx.lineWidth = 1;
    for (const s of L.self.spokes) {
      ctx.beginPath();
      ctx.moveTo(px(0.5), px(0.5));
      ctx.lineTo(px(0.5 + Math.cos(s.angle) * s.length), px(0.5 + Math.sin(s.angle) * s.length));
      ctx.stroke();
    }
    ctx.restore();

    // complex subgraph glows: member stars pulse together (§1.7)
    const glowStrength = (id: string): number => {
      const g = L.complexGlows.find(c => c.parts.includes(id as never));
      if (!g) return 0;
      return this.reducedMotion ? 0.35 : 0.25 + 0.25 * Math.sin(t / 700);
    };

    // North Star (§3D.2): distant, steady — the whole map faces it
    const ns = L.northStar;
    const nsR = ns.bright ? 5 : 3;
    const nsAlpha = ns.bright ? 0.9 : 0.28;
    const nsGlow = ctx.createRadialGradient(px(ns.x), px(ns.y), 0, px(ns.x), px(ns.y), nsR * 5);
    nsGlow.addColorStop(0, `rgba(242,231,201,${nsAlpha})`);
    nsGlow.addColorStop(1, 'rgba(242,231,201,0)');
    ctx.fillStyle = nsGlow;
    ctx.beginPath();
    ctx.arc(px(ns.x), px(ns.y), nsR * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(242,231,201,${nsAlpha})`;
    ctx.beginPath();
    ctx.arc(px(ns.x), px(ns.y), nsR, 0, Math.PI * 2);
    ctx.fill();
    if (ns.bright) {
      // faint guidance line: the Self faces its North Star
      ctx.strokeStyle = 'rgba(242,231,201,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px(0.5), px(0.5));
      ctx.lineTo(px(ns.x), px(ns.y));
      ctx.stroke();
    }

    // stars
    L.stars.forEach((st, i) => {
      const phase = this.reducedMotion ? 1 : 0.85 + 0.15 * Math.sin(t / (700 + i * 37));
      const r = px(st.radius) * (st.tier === 'dominant' ? phase : 1);
      const halo = ctx.createRadialGradient(px(st.x), px(st.y), 0, px(st.x), px(st.y), r * 3.2);
      const cg = glowStrength(st.id);
      const alpha = 0.35 * phase + cg;
      halo.addColorStop(0, st.color);
      halo.addColorStop(0.35, `${st.color}${Math.round(Math.min(1, alpha) * 255).toString(16).padStart(2, '0')}`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(px(st.x), px(st.y), r * 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.arc(px(st.x), px(st.y), r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
