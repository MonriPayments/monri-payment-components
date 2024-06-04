import {
  Component,
  HostListener,
  inject,
  Input,
  OnInit,
  signal,
  WritableSignal
} from '@angular/core';
import { KeksPayService } from './services/keks-pay.service';
import { QRCodeModule } from 'angularx-qrcode';
import { take } from 'rxjs';
import { StartPaymentRequest } from './services/alternative-payment-method.interface';
import { TranslationService } from './services/translation.service';
import { TranslatePipe } from './pipes/translate.pipe';
import { KeksPayStore } from './store/keks-pay.store';
import { patchState } from '@ngrx/signals';
import { setFulfilled } from './store/request-status.feature';

@Component({
  selector: 'lib-keks-pay',
  standalone: true,
  imports: [QRCodeModule, TranslatePipe],
  templateUrl: 'keks-pay.component.html',
  styleUrl: 'keks-pay.component.scss',
  providers: [KeksPayService, TranslationService, KeksPayStore]
})
export class KeksPayComponent implements OnInit {
  private _inputParams = signal<StartPaymentRequest>({
    payment_method: '',
    data: {}
  });
  private readonly _keksPayService: KeksPayService = inject(KeksPayService);
  private readonly _translationService: TranslationService =
    inject(TranslationService);
  readonly keksPayStore = inject(KeksPayStore);

  @HostListener('window:resize', ['$event'])
  onResize() {
    patchState(this.keksPayStore, { resolution: window.innerWidth });
  }

  ngOnInit(): void {
    if (this.inputParams().data['lang']) {
      this.translationService.currentLang = this.inputParams().data['lang'];
    }

    this.keksPayService
      .startPayment(this.inputParams())
      .pipe(take(1))
      .subscribe(response => {
        if (response.status === 'approved') {
          const parsedQrText = JSON.parse(response.qr_text as string);

          patchState(this.keksPayStore, {
            qr_type: parsedQrText.qr_type,
            cid: parsedQrText.cid,
            tid: parsedQrText.tid,
            bill_id: parsedQrText.bill_id,
            amount: parsedQrText.amount,
            currency: parsedQrText.currency
          });
          patchState(this.keksPayStore, setFulfilled());
        } else {
          throw new Error('Payment not approved');
        }
      });
  }

  get inputParams(): WritableSignal<StartPaymentRequest> {
    return this._inputParams;
  }

  @Input() set inputParams(value: StartPaymentRequest) {
    this._inputParams.set(value);
  }

  get keksPayService(): KeksPayService {
    return this._keksPayService;
  }

  get translationService(): TranslationService {
    return this._translationService;
  }
}
