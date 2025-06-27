import { inject, Injectable } from '@angular/core';
import {
  AlternativePaymentMethodInterface,
  StartPaymentRequest,
  StartPaymentResponse
} from '../interfaces/alternative-payment-method.interface';
import { WebPayService } from './web-pay.service';
import { Observable, of } from 'rxjs';
import {
  DpaData,
  DpaTransactionOptions
} from '../interfaces/mastercard-click-to-pay.interface';

@Injectable({
  providedIn: 'root'
})
export class MastercardClickToPayService
  implements AlternativePaymentMethodInterface
{
  private readonly _webPayService: WebPayService = inject(WebPayService);

  public startPayment(
    params: StartPaymentRequest
  ): Observable<StartPaymentResponse> {
    if (params.is_test) {
      return of({
        dpaData: <DpaData>{},
        dpaTransactionOptions: <DpaTransactionOptions>{},
        cardBrands: []
      });
    }

    return this.webPayService.startPayment({
      payment_method: params.payment_method,
      data: params.data
    });
  }

  get webPayService(): WebPayService {
    return this._webPayService;
  }
}
