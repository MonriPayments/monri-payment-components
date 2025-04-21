import {inject, Injectable} from '@angular/core';
import {
  AlternativePaymentMethodInterface,
  MerchantValidateRequest,
  NewCardTransactionRequest,
  StartPaymentRequest,
  StartPaymentResponse
} from '../interfaces/alternative-payment-method.interface';
import {WebPayService} from './web-pay.service';
import {Observable, of} from 'rxjs';

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
    if (params.is_test) {
      return of<StartPaymentResponse>({
        country_code: 'HR',
        currency_code: 'EUR',
        supported_networks: ['Visa', 'MasterCard'],
        merchant_capabilities: ['supports3DS'],
        total: { label: 'Naziv trgovca', amount: '1.00' },
        status: 'success',
      })
    }

    return this.webPayService.startPayment({
      payment_method: params.payment_method,
      data: params.data
    });
  }

  public validateMerchant(
    params: MerchantValidateRequest,
  ): Observable<any> {
    return this.webPayService.validateMerchant({
      data: params.data,
      validation_url: params.validation_url,
      initiative_context: window.location.hostname
    });
  }

  public newTransaction(
    params: NewCardTransactionRequest, env: string
  ): Observable<any> {
    return this.webPayService.newTransaction(params, env);
  }
}
