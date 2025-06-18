import { inject, Pipe, PipeTransform } from '@angular/core';
import { MCTranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class MCTranslatePipe implements PipeTransform {
  private readonly _translationService: MCTranslationService =
    inject(MCTranslationService);

  transform(value: string): string {
    return this.translationService.translate(value);
  }

  get translationService(): MCTranslationService {
    return this._translationService;
  }
}
