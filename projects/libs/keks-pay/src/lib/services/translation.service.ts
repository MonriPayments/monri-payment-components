import { Injectable, signal } from '@angular/core';
import { translations } from '../assets/translations/translations';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private currentLang = signal('bs');

  public setLanguage(lang: string): void {
    this.currentLang.set(lang);
  }

  public translate(key: string): string {
    return translations[this.currentLang()][key] || key;
  }
}
