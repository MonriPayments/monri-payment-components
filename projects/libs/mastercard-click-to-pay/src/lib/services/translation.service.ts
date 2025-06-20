import { Injectable, signal, WritableSignal } from '@angular/core';
import { translations } from '../assets/translations/translations';

@Injectable({ providedIn: 'root' })
export class MCTranslationService {
  private _currentLang = signal('ba-hr');

  public translate(key: string): string {
    return translations[this._currentLang()][key] || key;
  }

  get currentLang(): WritableSignal<string> {
    return this._currentLang;
  }

  set currentLang(value: string) {
    this._currentLang.set(value);
  }
}
