import {
  Component,
  HostListener,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { KeksPayService } from './services/keks-pay.service';
import { QRCodeModule } from 'angularx-qrcode';
import { take } from 'rxjs';
import { StartPaymentRequest } from './interfaces/alternative-payment-method.interface';
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
  private readonly _keksPayService: KeksPayService = inject(KeksPayService);
  private readonly _translationService: TranslationService =
    inject(TranslationService);
  readonly keksPayStore = inject(KeksPayStore);

  @HostListener('window:resize', ['$event'])
  onResize() {
    patchState(this.keksPayStore, { resolution: window.innerWidth });
  }

  ngOnInit(): void {
    this.setComponentOptions();
    this.startPayment();
  }

  private startPayment() {
    this.keksPayService
      .startPayment(this.keksPayStore.inputParams())
      .pipe(take(1))
      .subscribe(response => {
        patchState(this.keksPayStore, {
          qr_type: '1',
          cid: response.qr_text.cid,
          tid: response.qr_text.tid,
          //TODO: change bill_id to number and test
          bill_id: response.qr_text.bill_id.toString(),
          amount: response.qr_text.amount
        });
        patchState(this.keksPayStore, setFulfilled());
      });
  }

  private setComponentOptions() {
    if (this.keksPayStore.inputParams().data['lang']) {
      this.translationService.currentLang = this.keksPayStore.inputParams().data['lang'];
    } else {
      throw new Error(this.translationService.translate('LANG_NOT_SET'));
    }

    if (this.keksPayStore.inputParams().data['environment']) {
      patchState(this.keksPayStore, {
        environment: this.keksPayStore.inputParams().data['environment']
      });
    } else {
      throw new Error(this.translationService.translate('ENV_NOT_SET'));
    }
  }

  @Input() set inputParams(value: StartPaymentRequest) {
    patchState(this.keksPayStore, {inputParams: value});
  }

  get keksPayService(): KeksPayService {
    return this._keksPayService;
  }

  get translationService(): TranslationService {
    return this._translationService;
  }
}
