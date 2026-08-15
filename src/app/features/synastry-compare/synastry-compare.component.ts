/**
 * INNERVERSE — Synastry compare (§2, §3.5): two constellations, the Loop,
 * the six-axis hexagon (NO compatibility %), interlocks, the attachment
 * dance. Local-first pairing: your profile becomes a paste-code; the partner
 * pastes theirs back. Fully client-side, deterministic.
 */
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import { scoreProfile, type AssessmentInput } from '../../core/data/scoring-v2';
import { synastry, toSynastryProfile, type SynastryProfile, type SynastryResult } from '../../core/data/synastry-v2';

const PROFILE_KEY = 'INNERVERSE_PROFILE_V1';

const UI = {
  en: {
    title: 'Synastry — the Pattern between you',
    yourCode: 'Your pairing code',
    copy: 'Copy',
    copied: 'Copied',
    pasteLabel: 'Paste their code',
    compare: 'Read the pattern',
    badCode: 'That code could not be read.',
    noProfile: 'Complete the battery first — your constellation is one of the two inputs.',
    loopTitle: 'Your signature loop',
    hexagon: 'Six dynamics — no single number, ever',
    interlocks: 'Locked storylines',
    noInterlocks: 'No locked storyline — your complexes run in parallel. That is a good result.',
    dance: 'Attachment dance',
    nourish: 'What you can actually give each other',
    axes: ['Friction', 'Resonance', 'Balance', 'Safety', 'Growth', 'Nourish'],
    close: 'Close',
    export: 'Save as image',
  },
  ru: {
    title: 'Синастрия — узор между вами',
    yourCode: 'Ваш код для пары',
    copy: 'Скопировать',
    copied: 'Скопировано',
    pasteLabel: 'Вставьте их код',
    compare: 'Прочитать узор',
    badCode: 'Код не читается.',
    noProfile: 'Сначала пройдите батарею — ваше созвездие половина входа.',
    loopTitle: 'Ваша сигнатурная петля',
    hexagon: 'Шесть динамик — и никогда одной цифры',
    interlocks: 'Сцепленные сюжетные линии',
    noInterlocks: 'Сцепленной линии нет — ваши комплексы идут параллельно. Это хороший результат.',
    dance: 'Танец привязанности',
    nourish: 'Что вы реально можете дать друг другу',
    axes: ['Трение', 'Резонанс', 'Баланс', 'Безопасность', 'Рост', 'Питание'],
    close: 'Закрыть',
    export: 'Сохранить как изображение',
  },
};

function encodeProfile(p: SynastryProfile): string {
  const json = JSON.stringify(p);
  return btoa(encodeURIComponent(json));
}
function decodeProfile(code: string): SynastryProfile | null {
  try { return JSON.parse(decodeURIComponent(atob(code.trim()))); } catch { return null; }
}

@Component({
  selector: 'app-synastry-compare',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './synastry-compare.component.html',
  styleUrls: ['./synastry-compare.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SynastryCompareComponent {
  private readonly translationService = inject(TranslationService);

  closed = output<void>();

  readonly lang = computed(() => this.translationService.getLanguage());
  readonly ui = computed(() => UI[this.lang()] as typeof UI.en);

  readonly myProfile = signal<SynastryProfile | null>(this.loadMine());
  readonly partnerCode = signal('');
  readonly result = signal<SynastryResult | null>(null);
  readonly copied = signal(false);
  readonly error = signal(false);

  readonly myCode = computed(() => this.myProfile() ? encodeProfile(this.myProfile()!) : '');

  readonly hexPoints = computed(() => {
    const r = this.result();
    if (!r) return '';
    const values = [r.FRICTION, r.RESONANCE, r.BALANCE, r.SAFETY, r.GROWTH, r.NOURISH];
    const cx = 110, cy = 100, R = 80;
    return values.map((v, i) => {
      const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      const rad = R * (v / 100);
      return `${cx + Math.cos(a) * rad},${cy + Math.sin(a) * rad}`;
    }).join(' ');
  });

  private loadMine(): SynastryProfile | null {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? toSynastryProfile(scoreProfile(JSON.parse(raw) as AssessmentInput)) : null;
    } catch { return null; }
  }

  copyCode(): void {
    try { navigator.clipboard.writeText(this.myCode()); this.copied.set(true); }
    catch { /* clipboard unavailable */ }
    setTimeout(() => this.copied.set(false), 1500);
  }

  compare(): void {
    this.error.set(false);
    const theirs = decodeProfile(this.partnerCode());
    if (!theirs || !this.myProfile()) { this.error.set(true); return; }
    this.result.set(synastry(this.myProfile()!, theirs));
  }

  axisValue(i: number): number {
    const r = this.result();
    if (!r) return 0;
    return [r.FRICTION, r.RESONANCE, r.BALANCE, r.SAFETY, r.GROWTH, r.NOURISH][i];
  }

  /** §3.5: shareable image export — canvas render, no screenshot. */
  exportImage(): void {
    const r = this.result();
    if (!r) return;
    const canvas = document.createElement('canvas');
    canvas.width = 720; canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0b0b1e';
    ctx.fillRect(0, 0, 720, 900);
    ctx.fillStyle = '#f2e7c9';
    ctx.font = '26px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Innerverse · Synastry', 360, 70);
    ctx.font = '32px Georgia';
    ctx.fillText(r.loop.name, 360, 130);
    // hexagon
    const values = [r.FRICTION, r.RESONANCE, r.BALANCE, r.SAFETY, r.GROWTH, r.NOURISH];
    const labels = this.ui().axes;
    const cx = 360, cy = 400, R = 200;
    ctx.strokeStyle = 'rgba(236,234,246,0.25)';
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.beginPath();
    values.forEach((v, i) => {
      const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      const rad = R * (v / 100);
      const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(242,231,201,0.2)';
    ctx.strokeStyle = '#f2e7c9';
    ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
    ctx.font = '16px Georgia';
    ctx.fillStyle = 'rgba(236,234,246,0.7)';
    labels.forEach((l, i) => {
      const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      ctx.fillText(`${l} ${Math.round(values[i])}`, cx + Math.cos(a) * (R + 40), cy + Math.sin(a) * (R + 40));
    });
    ctx.font = '18px Georgia';
    ctx.fillStyle = '#eceaf6';
    ctx.fillText(this.ui().dance + ': ' + r.dance, 360, 700);
    ctx.font = '13px Georgia';
    ctx.fillStyle = 'rgba(236,234,246,0.4)';
    ctx.fillText('Innerverse — self-reflection, not diagnosis', 360, 860);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'innerverse-synastry.png';
    a.click();
  }

  close(): void { this.closed.emit(); }
}
