import { Injectable, signal } from '@angular/core';

/**
 * PWA install flow (inspired by khmyznikov/pwa-install):
 * captures the deferred beforeinstallprompt so a custom dialog —
 * not the browser's mini-bar — offers installation; falls back to
 * Safari "Share → Add to Home Screen" instructions on iOS, which
 * never fires the event. Dismissals expire after a week.
 */
const DISMISS_KEY = 'INNERVERSE_INSTALL_DISMISSED';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class InstallService {
  readonly canInstall = signal(false);
  readonly installed = signal(this.isStandalone());
  readonly isIos = signal(this.detectIos());
  readonly dialogOpen = signal(false);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  constructor() {
    if (this.installed()) return;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.canInstall.set(false);
      this.dialogOpen.set(false);
    });
  }

  /** Show the dialog — called automatically after a delay, or manually. */
  open(): void {
    if (this.installed() || !this.canPrompt()) return;
    this.dialogOpen.set(true);
  }

  autoOpenAfterDelay(ms: number): void {
    if (!this.canPrompt()) return;
    setTimeout(() => this.open(), ms);
  }

  dismiss(): void {
    this.dialogOpen.set(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch { /* storage unavailable */ }
  }

  async promptInstall(): Promise<void> {
    if (!this.deferredPrompt) {
      // iOS / unsupported: the dialog's instructions are the flow.
      return;
    }
    this.dialogOpen.set(false);
    await this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') this.installed.set(true);
    this.deferredPrompt = null;
    this.canInstall.set(false);
  }

  private canPrompt(): boolean {
    if (this.installed()) return false;
    try {
      const t = Number(localStorage.getItem(DISMISS_KEY));
      if (Number.isFinite(t) && Date.now() - t < DISMISS_TTL_MS) return false;
    } catch { /* no storage — show */ }
    return this.canInstall() || this.isIos();
  }

  private isStandalone(): boolean {
    return window.matchMedia?.('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true;
  }

  private detectIos(): boolean {
    if (!navigator.userAgent) return false;
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua)
      || (ua.includes('Macintosh') && navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 1);
  }
}
