import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private readonly _translationService: TranslationService =
    inject(TranslationService);

  transform(value: string): string {
    return this.translationService.translate(value);
  }

  get translationService(): TranslationService {
    return this._translationService;
  }
}
