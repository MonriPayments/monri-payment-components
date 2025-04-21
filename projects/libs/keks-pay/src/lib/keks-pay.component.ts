import { Component, inject } from '@angular/core';
import { KeksPayService } from './services/keks-pay.service';
import { QRCodeModule } from 'angularx-qrcode';
import { TranslationService } from './services/translation.service';
import { TranslatePipe } from './pipes/translate.pipe';
import { KeksPayStore } from './store/keks-pay.store';

@Component({
  selector: 'lib-keks-pay',
  standalone: true,
  imports: [QRCodeModule, TranslatePipe],
  templateUrl: 'keks-pay.component.html',
  styleUrl: 'keks-pay.component.scss',
  providers: [KeksPayService, TranslationService, KeksPayStore]
})
export class KeksPayComponent {
  readonly keksPayStore = inject(KeksPayStore);
}
