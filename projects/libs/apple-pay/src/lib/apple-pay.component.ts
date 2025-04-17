import {Component, inject, Input, OnInit} from '@angular/core';
import {patchState} from '@ngrx/signals';
import {ApplePayStore} from './store/apple-pay.store';
import {StartPaymentRequest} from './interfaces/alternative-payment-method.interface';
import {ApplePayService} from './services/apple-pay.service';
import {take} from "rxjs";
import {setFulfilled} from "./store/request-status.feature";

@Component({
  selector: 'lib-apple-pay',
  templateUrl: './apple-pay.component.html',
  standalone: true,
  styleUrls: ['./apple-pay.component.scss'],
  providers: [ApplePayStore, ApplePayService]
})
export class ApplePayComponent implements OnInit {

  protected readonly applePayStore = inject(ApplePayStore);
  private readonly _applePayService: ApplePayService = inject(ApplePayService);

  @Input() set inputParams(value: StartPaymentRequest) {
    patchState(this.applePayStore, {inputParams: value});
  }

  get applePayService(): ApplePayService {
    return this._applePayService;
  }

  ngOnInit(): void {
    this.startPayment();
  }

  private startPayment() {
    this.applePayService
      .startPayment(this.applePayStore.inputParams())
      .pipe(take(1))
      .subscribe(response => {
        patchState(this.applePayStore, {
          countryCode: response.country_code,
          currencyCode: response.currency_code,
          supportedNetworks: response.supported_networks,
          merchantCapabilities: response.merchant_capabilities,
          total: {label: response.total.label, amount: response.total.amount},
        });
        patchState(this.applePayStore, setFulfilled());
      });
  }
}
