import { Component, HostListener, inject, Input, OnInit } from '@angular/core';
import { MastercardClickToPayService } from './services/mc-click-to-pay.service';
import { QRCodeModule } from 'angularx-qrcode';
import { take } from 'rxjs';
import { StartPaymentRequest } from './interfaces/alternative-payment-method.interface';
import { MCTranslationService } from './services/translation.service';
import { MCTranslatePipe } from './pipes/translate.pipe';
import { MastercardClickToPayStore } from './store/mc-click-to-pay.store';
import { patchState } from '@ngrx/signals';
import { setFulfilled } from './store/request-status.feature';

@Component({
  selector: 'lib-mc-click-to-pay',
  standalone: true,
  imports: [QRCodeModule, MCTranslatePipe],
  templateUrl: 'mc-click-to-pay.component.html',
  styleUrl: 'mc-click-to-pay.component.scss',
  providers: [MastercardClickToPayService, MCTranslationService, MastercardClickToPayStore]
})
export class MastercardClickToPayComponent implements OnInit {
  private readonly _mastercardClickToPayService: MastercardClickToPayService = inject(MastercardClickToPayService);
  private readonly _translationService: MCTranslationService =
    inject(MCTranslationService);
  readonly mastercardClickToPayStore = inject(MastercardClickToPayStore);

  @HostListener('window:resize', ['$event'])
  onResize() {
    patchState(this.mastercardClickToPayStore, { resolution: window.innerWidth });
  }

  ngOnInit(): void {
    this.setComponentOptions();
    this.startPayment();
  }

  private startPayment() {
    this.mastercardClickToPayService
      .startPayment(this.mastercardClickToPayStore.inputParams())
      .pipe(take(1))
      .subscribe(response => {
        patchState(this.mastercardClickToPayStore, {
          qr_type: '1',
          cid: response.qr_text.cid,
          tid: response.qr_text.tid,
          //TODO: change bill_id to number and test
          bill_id: response.qr_text.bill_id.toString(),
          amount: response.qr_text.amount
        });
        patchState(this.mastercardClickToPayStore, setFulfilled());
      });
  }

  private setComponentOptions() {
    if (this.mastercardClickToPayStore.inputParams().data['lang']) {
      this.translationService.currentLang =
        this.mastercardClickToPayStore.inputParams().data['lang'];
    } else {
      throw new Error(this.translationService.translate('LANG_NOT_SET'));
    }

    if (this.mastercardClickToPayStore.inputParams().is_test) return;

    if (this.mastercardClickToPayStore.inputParams().data['environment']) {
      patchState(this.mastercardClickToPayStore, {
        environment: this.mastercardClickToPayStore.inputParams().data['environment']
      });
    } else {
      throw new Error(this.translationService.translate('ENV_NOT_SET'));
    }
  }

  @Input() set inputParams(value: StartPaymentRequest) {
    patchState(this.mastercardClickToPayStore, { inputParams: value });
  }

  get mastercardClickToPayService(): MastercardClickToPayService {
    return this._mastercardClickToPayService;
  }

  get translationService(): MCTranslationService {
    return this._translationService;
  }
}
