import { inject, Injectable } from '@angular/core';
import {
  AlternativePaymentMethodInterface,
  NewCardTransactionRequest,
  StartPaymentRequest,
  StartPaymentResponse
} from '../interfaces/alternative-payment-method.interface';
import { WebPayService } from './web-pay.service';
import { Observable, of } from 'rxjs';
import {
  DpaData,
  DpaTransactionOptions
} from '../interfaces/mastercard-c2p.interface';

@Injectable({
  providedIn: 'root'
})
export class MastercardC2pService
  implements AlternativePaymentMethodInterface
{
  private readonly _webPayService: WebPayService = inject(WebPayService);

  public startPayment(
    params: StartPaymentRequest
  ): Observable<StartPaymentResponse> {
    if (params.is_test) {
      return of({
        srcDpaId: '',
        dpaData: <DpaData>{},
        dpaTransactionOptions: <DpaTransactionOptions>{},
        cardBrands: []
      });
    }

    return this.webPayService.startPayment({
      trx_token: params.trx_token,
      payment_method: params.payment_method,
      data: params.data
    });
  }

  public newTransaction(
    params: NewCardTransactionRequest,
    env: string | undefined
  ): Observable<unknown> {
    return this.webPayService.newTransaction(params, env);
  }

  get webPayService(): WebPayService {
    return this._webPayService;
  }
}
