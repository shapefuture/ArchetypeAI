import { Injectable, signal } from '@angular/core';
import { translations } from '../i18n/translations';

export type Language = 'en' | 'ru';

const LANG_KEY = 'APP_LANG';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private currentLang = signal<Language>(this.restoreLang());

  private restoreLang(): Language {
    // Russian-first product: ru unless the user explicitly saved 'en'.
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'en') return 'en';
      return 'ru';
    } catch { return 'ru'; }
  }

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* storage unavailable */ }
  }

  getLanguage() {
    return this.currentLang();
  }

  t(key: string, section?: string, fallback?: string): string {
    const lang = this.currentLang();
    let trans = translations[lang] as any;
    
    if (section) {
        const sections = section.split('.');
        for (const s of sections) {
            if (trans[s]) {
                trans = trans[s];
            } else {
                return fallback || key;
            }
        }
    }
    return trans[key] || fallback || key;
  }

  getArchetypeField(archetypeId: string, field: string, fallback?: string): string {
    const lang = this.currentLang();
    const trans = (translations as any)[lang]?.universe?.archetypes?.[archetypeId]?.[field];
    return trans || fallback || '';
  }
}
