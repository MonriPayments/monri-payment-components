import {inject, Injectable} from '@angular/core';
import {
  AlternativePaymentMethodInterface,
  MerchantValidateRequest,
  NewCardTransactionRequest,
  StartPaymentRequest,
  StartPaymentResponse
} from '../interfaces/alternative-payment-method.interface';
import {WebPayService} from './web-pay.service';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApplePayService implements AlternativePaymentMethodInterface {
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

  public validateMerchant(
    params: MerchantValidateRequest
  ): Observable<any> {
    return this.webPayService.validateMerchant({
      data: params.data,
      validation_url: params.validation_url,
      origin: params.origin
    });
  }

  public newTransaction(
    params: NewCardTransactionRequest,
    env: string | undefined
  ): Observable<any> {
    return this.webPayService.newTransaction(params, env);
  }
}
