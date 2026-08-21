/**
 * INNERVERSE — the living constellation (REVAMP §3.1, §1.15; SIGGRAPH-tier render).
 *
 * Canvas 2D with additive-light composition: deterministic star layout on
 * fixed orbits, an assembly reveal (the Memory Anchor motion — stars ease
 * out of the Self into their orbits), tier-sized stars with cross-flares on
 * prominent/dominant parts, drifting depth-layered dust, polarization
 * tension arcs, guardianship lines, leak arcs, complex glows, the Self radar
 * breathing at the chair, and the North Star. Honors prefers-reduced-motion
 * with a fully assembled static frame.
 */
import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy,
  computed, inject, model, viewChild,
} from '@angular/core';

const safeR = (v: number) => Math.max(0.1, v);
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import { buildLayout, starAt, type Star } from '../../core/data/constellation-layout';
import type { ScoredProfile } from '../../core/data/scoring-v2';

const RING_RADIUS = { resource: 0.44, manager: 0.36, firefighter: 0.26, exile: 0.155 } as const;
const RING_DRIFT = { resource: 0.004, manager: -0.006, firefighter: 0.009, exile: -0.012 } as const; // rad/s
const REVEAL_MS = 1400;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/** Deterministic dust field (no randomness at render time). */
const DUST = Array.from({ length: 64 }, (_, i) => ({
  x: ((i * 137.5077) % 360) / 360,              // golden-angle scatter
  y: ((i * 61.8034 + 17) % 360) / 360,
  depth: i % 2 === 0 ? 0.6 : 1,                  // two parallax layers
  phase: (i * 0.618) % (Math.PI * 2),
  size: 0.0012 + (i % 3) * 0.0006,
}));

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
  private bornAt = 0;
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
    this.bornAt = performance.now();
    const draw = (t: number) => {
      this.render(t);
      if (!this.reducedMotion) this.raf = requestAnimationFrame(draw);
    };
    this.raf = requestAnimationFrame(draw);
  }

  ngOnDestroy(): void { cancelAnimationFrame(this.raf); }

  /** One frame at time t (ms). Drawing only — layout stays pure and tested. */
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
    const reveal = this.reducedMotion ? 1 : easeOutCubic(Math.min(1, (t - this.bornAt) / REVEAL_MS));
    const tSec = t / 1000;
    // stars fly out of the Self during the reveal, then drift on their rings
    const pos = (s: Star): { x: number; y: number } => {
      const drift = this.reducedMotion ? 0 : RING_DRIFT[s.ring] * tSec;
      const ang = Math.atan2(s.y - 0.5, s.x - 0.5) + drift;
      const rad = Math.hypot(s.x - 0.5, s.y - 0.5);
      const fx = 0.5 + Math.cos(ang) * rad, fy = 0.5 + Math.sin(ang) * rad;
      return { x: 0.5 + (fx - 0.5) * reveal, y: 0.5 + (fy - 0.5) * reveal };
    };
    const star = (id: string) => starAt(L, id as never);

    // deep-space backdrop
    const bg = ctx.createRadialGradient(px(0.5), px(0.42), 0, px(0.5), px(0.5), px(0.75));
    bg.addColorStop(0, '#141433');
    bg.addColorStop(0.55, '#0d0d24');
    bg.addColorStop(1, '#0b0b1e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    // drifting dust (two parallax layers, additive)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const d of DUST) {
      const driftX = this.reducedMotion ? 0 : (tSec * 0.004 * d.depth) % 1;
      const x = ((d.x + driftX) % 1) * size;
      const y = d.y * size;
      const tw = this.reducedMotion ? 0.5 : 0.35 + 0.35 * Math.sin(tSec * 0.8 + d.phase);
      ctx.fillStyle = `rgba(236,234,246,${0.05 * d.depth * tw + 0.02})`;
      ctx.beginPath();
      ctx.arc(x, y, safeR(px(d.size)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // orbit rings (faint, breathing with the reveal)
    ctx.save();
    ctx.lineWidth = 1;
    for (const ring of ['resource', 'manager', 'firefighter', 'exile'] as const) {
      ctx.beginPath();
      ctx.strokeStyle = ring === 'resource'
        ? `rgba(232,201,135,${0.07 * reveal})`
        : `rgba(236,234,246,${0.05 * reveal})`;
      ctx.arc(px(0.5), px(0.5), safeR(px(RING_RADIUS[ring] * reveal)), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // guardianship: faint curved lines protector → exile
    ctx.save();
    ctx.strokeStyle = 'rgba(236,234,246,0.08)';
    for (const g of L.guardLines) {
      const a = pos(star(g.from)), b = pos(star(g.to));
      ctx.beginPath();
      ctx.moveTo(px(a.x), px(a.y));
      ctx.quadraticCurveTo(px(0.5), px(0.5), px(b.x), px(b.y));
      ctx.stroke();
    }
    ctx.restore();

    // polarization tension arcs (shimmering)
    ctx.save();
    ctx.lineWidth = 1.6;
    for (const arc of L.tensionArcs) {
      const a = pos(star(arc.a)), b = pos(star(arc.b));
      const pulse = this.reducedMotion ? 0.6 : 0.45 + 0.35 * Math.sin(tSec * 1.6 + a.x * 9);
      const grad = ctx.createLinearGradient(px(a.x), px(a.y), px(b.x), px(b.y));
      grad.addColorStop(0, `rgba(111,168,201,${pulse})`);
      grad.addColorStop(1, `rgba(224,138,92,${pulse})`);
      ctx.strokeStyle = grad;
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = this.reducedMotion ? 0 : -tSec * 22;
      ctx.beginPath();
      ctx.moveTo(px(a.x), px(a.y));
      ctx.quadraticCurveTo(px((a.x + b.x) / 2), px((a.y + b.y) / 2 - 0.12), px(b.x), px(b.y));
      ctx.stroke();
    }
    ctx.restore();

    // resource leak arcs (§1.14): warm, resource → shadow part
    ctx.save();
    ctx.strokeStyle = 'rgba(217,138,116,0.35)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([]);
    for (const leak of L.leakArcs) {
      const a = pos(star(leak.from)), b = pos(star(leak.to));
      ctx.beginPath();
      ctx.moveTo(px(a.x), px(a.y));
      ctx.quadraticCurveTo(px(0.5), px(0.5), px(b.x), px(b.y));
      ctx.stroke();
    }
    ctx.restore();

    // Self glow — breathing luminosity (self_energy), additive
    const selfR = px(L.self.radius * reveal);
    const breathe = this.reducedMotion ? 1 : 0.92 + 0.08 * Math.sin(tSec * 0.7);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(px(0.5), px(0.5), 0, px(0.5), px(0.5), selfR * 2.4 * breathe);
    glow.addColorStop(0, 'rgba(242,231,201,0.9)');
    glow.addColorStop(0.4, 'rgba(242,231,201,0.25)');
    glow.addColorStop(1, 'rgba(242,231,201,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px(0.5), px(0.5), safeR(selfR * 2.4 * breathe), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Self radar spokes (§1.15) inside the glow
    ctx.save();
    ctx.strokeStyle = 'rgba(242,231,201,0.55)';
    ctx.lineWidth = 1;
    for (const s of L.self.spokes) {
      const len = s.length * reveal;
      ctx.beginPath();
      ctx.moveTo(px(0.5), px(0.5));
      ctx.lineTo(px(0.5 + Math.cos(s.angle) * len), px(0.5 + Math.sin(s.angle) * len));
      ctx.stroke();
    }
    ctx.restore();

    // complex subgraph glows (member stars pulse together, §1.7)
    const glowStrength = (id: string): number => {
      const g = L.complexGlows.find(c => c.parts.includes(id as never));
      if (!g) return 0;
      return this.reducedMotion ? 0.35 : 0.25 + 0.25 * Math.sin(tSec * 1.4);
    };

    // North Star (§3D.2): distant, steady, the whole map faces it
    const ns = L.northStar;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const nsR = (ns.bright ? 5 : 3) * reveal;
    const nsAlpha = (ns.bright ? 0.9 : 0.28) * reveal;
    const nsGlow = ctx.createRadialGradient(px(ns.x), px(ns.y), 0, px(ns.x), px(ns.y), nsR * 5);
    nsGlow.addColorStop(0, `rgba(242,231,201,${nsAlpha})`);
    nsGlow.addColorStop(1, 'rgba(242,231,201,0)');
    ctx.fillStyle = nsGlow;
    ctx.beginPath();
    ctx.arc(px(ns.x), px(ns.y), safeR(nsR * 5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = `rgba(242,231,201,${nsAlpha})`;
    ctx.beginPath();
    ctx.arc(px(ns.x), px(ns.y), safeR(nsR), 0, Math.PI * 2);
    ctx.fill();
    if (ns.bright) {
      ctx.strokeStyle = 'rgba(242,231,201,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px(0.5), px(0.5));
      ctx.lineTo(px(ns.x), px(ns.y));
      ctx.stroke();
    }

    // stars — additive cores, halos, and cross-flares on prominent/dominant
    L.stars.forEach((st, i) => {
      const p = pos(st);
      const phase = this.reducedMotion ? 1 : 0.85 + 0.15 * Math.sin(tSec * (0.9 + i * 0.037));
      const r = px(st.radius) * (st.tier === 'dominant' ? phase : 1);
      const cg = glowStrength(st.id);
      const alpha = Math.min(1, (0.35 * phase + cg) * reveal);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const halo = ctx.createRadialGradient(px(p.x), px(p.y), 0, px(p.x), px(p.y), r * 3.2);
      halo.addColorStop(0, st.color);
      halo.addColorStop(0.35, `${st.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(px(p.x), px(p.y), safeR(r * 3.2), 0, Math.PI * 2);
      ctx.fill();

      // cross-flare: four-spike star cross on prominent/dominant parts
      if (st.tier === 'prominent' || st.tier === 'dominant') {
        const flare = r * (st.tier === 'dominant' ? 4.2 : 3);
        const rot = this.reducedMotion ? 0 : tSec * 0.05;
        ctx.save();
        ctx.translate(px(p.x), px(p.y));
        ctx.rotate(rot);
        const fg = ctx.createLinearGradient(-flare, 0, flare, 0);
        fg.addColorStop(0, 'rgba(0,0,0,0)');
        fg.addColorStop(0.5, `${st.color}${Math.round(alpha * 200).toString(16).padStart(2, '0')}`);
        fg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fg;
        ctx.fillRect(-flare, -Math.max(0.6, r * 0.06), flare * 2, Math.max(1.2, r * 0.12));
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-flare, -Math.max(0.6, r * 0.06), flare * 2, Math.max(1.2, r * 0.12));
        ctx.restore();
      }

      // hot core
      ctx.fillStyle = '#fffdf6';
      ctx.beginPath();
      ctx.arc(px(p.x), px(p.y), safeR(r * 0.42), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.arc(px(p.x), px(p.y), safeR(r), 0, Math.PI * 2);
      ctx.fill();
    });

    // vignette — focuses the eye into the chair
    const vg = ctx.createRadialGradient(px(0.5), px(0.5), px(0.35), px(0.5), px(0.5), px(0.74));
    vg.addColorStop(0, 'rgba(11,11,30,0)');
    vg.addColorStop(1, 'rgba(11,11,30,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, size, size);
  }
}
