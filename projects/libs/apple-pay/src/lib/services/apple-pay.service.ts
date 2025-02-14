import {inject, Injectable} from '@angular/core';
import {
  AlternativePaymentMethodInterface,
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
    params: any
  ): Observable<any> {
    return this.webPayService.validateMerchant({
      validation_url: params.validation_url,
    });
  }

  public newTransaction(
    params: any
  ): Observable<any> {
    return this.webPayService.newTransaction(params);
  }
}
