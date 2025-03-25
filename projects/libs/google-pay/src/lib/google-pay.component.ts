import {Component, inject, Input, OnInit} from '@angular/core';
import {patchState} from "@ngrx/signals";
import {GooglePayService} from "./services/google-pay.service";
import {GooglePayStore} from "./store/google-pay.store";
import {StartPaymentRequest} from "./interfaces/alternative-payment-method.interface";
import {setFulfilled} from "./store/request-status.feature";
import {take} from "rxjs";

declare var google: any;

@Component({
  selector: 'lib-google-pay',
  templateUrl: './google-pay.component.html',
  standalone: true,
  styleUrls: ['./google-pay.component.scss'],
  providers: [GooglePayStore, GooglePayService]
})
export class GooglePayComponent implements OnInit {

  protected readonly googlePayStore = inject(GooglePayStore);
  private readonly _googlePayService: GooglePayService = inject(GooglePayService);

  @Input() set inputParams(value: StartPaymentRequest) {
    patchState(this.googlePayStore, {inputParams: value});
    console.log('Google Pay inputParams:', this.googlePayStore.inputParams());
  }

  get googlePayService(): GooglePayService {
    return this._googlePayService;
  }

  ngOnInit(): void {
    this.startPayment()
  }

  private startPayment() {
    this.googlePayService
      .startPayment(this.googlePayStore.inputParams())
      .pipe(take(1))
      .subscribe(response => {
        patchState(this.googlePayStore, {
          googleTransactionInfo: response?.transactionInfo,
          googlePaymentDataRequest: {
            ...this.googlePayStore.googlePaymentDataRequest(),
            allowedPaymentMethods: [response?.allowedPaymentMethods],
            merchantInfo: response.merchantInfo
          },
          googleIsReadyToPayRequest: {
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [response?.allowedPaymentMethods]
          },
          googleErrorState: response?.googleErrorState,
          googleTransactionState: response?.googleTransactionState
        });
        patchState(this.googlePayStore, setFulfilled());
      });
  }
}
