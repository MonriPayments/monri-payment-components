import { Injectable, signal, WritableSignal } from '@angular/core';
import { translations } from '../assets/translations/translations';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private _currentLang = signal('bs');

  public setLanguage(lang: string): void {
    this._currentLang.set(lang);
  }

  public translate(key: string): string {
    return translations[this._currentLang()][key] || key;
  }

  get currentLang(): WritableSignal<string> {
    return this._currentLang;
  }

  set currentLang(value: WritableSignal<string>) {
    this._currentLang = value;
  }
}
