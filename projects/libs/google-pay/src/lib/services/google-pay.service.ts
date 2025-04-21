import {inject, Injectable} from '@angular/core';
import {
  AlternativePaymentMethodInterface,
  NewCardTransactionRequest,
  StartPaymentRequest,
  StartPaymentResponse
} from '../interfaces/alternative-payment-method.interface';
import {WebPayService} from "./web-pay.service";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class GooglePayService implements AlternativePaymentMethodInterface {
  private readonly _webPayService: WebPayService = inject(WebPayService);

  get webPayService(): WebPayService {
    return this._webPayService;
  }

  public startPayment(
    params: StartPaymentRequest
  ): Observable<StartPaymentResponse> {
    return this.webPayService.startPayment({
      payment_method: params.payment_method,
      data: params.data
    });
  }

  public newTransaction(
    params: NewCardTransactionRequest,
    env: string
  ): Observable<any> {
    return this.webPayService.newTransaction(params, env);
  }
}
