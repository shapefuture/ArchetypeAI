import {
  Component,
  Input,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Particle {
  x: number;
  y: number;
  r: number;
  angle: number;
  speed: number;
}

@Component({
  selector: 'app-particle-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas class="particle-canvas" #canvas></canvas>`,
  styles: [`
    .particle-canvas {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
      width: 100%;
      height: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticleCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() particleCount = 60;
  @Input() particleType: 'dust' | 'firefly' | 'sparkle' = 'dust';
  @Input() color = '#fff';

  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private animationId = 0;
  private destroyed = false;

  ngAfterViewInit(): void {
    this.initCanvas();
    this.initParticles();
    this.startAnimation();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.animationId);
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    try {
      this.ctx = canvas.getContext('2d');
    } catch {
      this.ctx = null;
    }
  }

  private initParticles(): void {
    const canvas = this.canvasRef.nativeElement;
    this.particles = Array.from({ length: this.particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.5 + 0.2
    }));
  }

  private startAnimation(): void {
    if (!this.ctx) return;
    const animate = () => {
      if (this.destroyed) return;
      this.render();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  private render(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of this.particles) {
      p.y -= p.speed;
      p.angle += 0.05;

      if (p.y < -10) {
        p.y = canvas.height + 10;
        p.x = Math.random() * canvas.width;
      }

      const alpha = 0.2 + Math.sin(p.angle) * 0.3;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(p.x % canvas.width, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
