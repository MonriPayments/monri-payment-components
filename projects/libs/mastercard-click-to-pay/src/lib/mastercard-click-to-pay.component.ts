import { Component, HostListener, inject, Input, OnInit } from '@angular/core';
import { MastercardClickToPayService } from './services/mastercard-click-to-pay.service';
import { QRCodeModule } from 'angularx-qrcode';
import { take } from 'rxjs';
import { StartPaymentRequest } from './interfaces/alternative-payment-method.interface';
import { MCTranslationService } from './services/translation.service';
import { MCTranslatePipe } from './pipes/translate.pipe';
import { MastercardClickToPayStore } from './store/mastercard-click-to-pay.store';
import { patchState } from '@ngrx/signals';
import { setFulfilled } from './store/request-status.feature';

@Component({
  selector: 'lib-mastercard-click-to-pay',
  standalone: true,
  imports: [QRCodeModule, MCTranslatePipe],
  templateUrl: 'mastercard-click-to-pay.component.html',
  styleUrl: 'mastercard-click-to-pay.component.scss',
  providers: [
    MastercardClickToPayService,
    MCTranslationService,
    MastercardClickToPayStore
  ]
})
export class MastercardClickToPayComponent implements OnInit {
  readonly store = inject(MastercardClickToPayStore);
  private readonly _service = inject(MastercardClickToPayService);
  private readonly _translation = inject(MCTranslationService);

  @Input() set inputParams(value: StartPaymentRequest) {
    patchState(this.store, { inputParams: value });
    console.log(
      'Mastercard Click To Pay inputParams:',
      this.store.inputParams()
    );
    this.store.onLoad();
  }

  get mastercardClickToPayService(): MastercardClickToPayService {
    return this._service;
  }

  get translationService(): MCTranslationService {
    return this._translation;
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    patchState(this.store, { resolution: window.innerWidth });
  }

  ngOnInit(): void {
    this.validateInputParams();
    this.startPayment();
  }

  private startPayment() {
    const input = this.store.inputParams();

    if (input.is_test) {
      patchState(this.store, setFulfilled());
      return;
    }

    this._service
      .startPayment(input)
      .pipe(take(1))
      .subscribe(response => {
        patchState(this.store, {
          // primjer što bi mogao biti response iz Mastercard servisa:
          checkoutUrl: response.checkout_url
          // dodaj sve što trebaš iz response
        });
        patchState(this.store, setFulfilled());
      });
  }

  private validateInputParams() {
    const data = this.store.inputParams().data;

    if (!data['locale']) {
      throw new Error(this._translation.translate('LOCALE_NOT_SET'));
    }

    if (!data['srcDpaId']) {
      throw new Error(this._translation.translate('DPA_ID_NOT_SET'));
    }

    if (!this.store.inputParams().is_test && !data['environment']) {
      throw new Error(this._translation.translate('ENV_NOT_SET'));
    }

    if (data['environment']) {
      patchState(this.store, { environment: data['environment'] });
    }
  }
}
